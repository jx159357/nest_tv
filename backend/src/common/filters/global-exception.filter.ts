import {
  ExceptionFilter,
  ArgumentsHost,
  Catch,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { AppLoggerService, LogContext } from '../services/app-logger.service';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  UNKNOWN = 'UNKNOWN_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  EXTERNAL = 'EXTERNAL_ERROR',
}

/**
 * 错误严重级别枚举
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  requestId: string;
  type: ErrorType;
  severity: ErrorSeverity;
  data?: any;
}

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准化的错误响应
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;
  private readonly appLogger: AppLoggerService;

  constructor(appLogger: AppLoggerService) {
    this.logger = new Logger(GlobalExceptionFilter.name);
    this.appLogger = appLogger;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 记录错误日志
    this.logError(exception, request);

    // 生成错误响应
    const errorResponse = this.buildErrorResponse(exception, request);

    // 发送错误响应
    response
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }

  /**
   * 分类错误类型
   */
  private classifyError(exception: unknown): { type: ErrorType; severity: ErrorSeverity } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      
      if (status === 401) {
        return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.MEDIUM };
      } else if (status === 403) {
        return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM };
      } else if (status === 404) {
        return { type: ErrorType.NOT_FOUND, severity: ErrorSeverity.LOW };
      } else if (status === 409) {
        return { type: ErrorType.CONFLICT, severity: ErrorSeverity.MEDIUM };
      } else if (status >= 400 && status < 500) {
        return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
      } else if (status >= 500 && status < 600) {
        return { type: ErrorType.INTERNAL, severity: ErrorSeverity.HIGH };
      }
    }

    // 默认处理
    const error = exception as Error;
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return { type: ErrorType.INTERNAL, severity: ErrorSeverity.CRITICAL };
    } else if (error.name === 'ValidationError') {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
    }

    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }

  /**
   * 记录错误日志
   */
  private logError(exception: unknown, request: Request): void {
    const { type, severity } = this.classifyError(exception);
    const requestId = this.generateRequestId();
    
    // 基础错误信息
    const errorInfo = {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    // 设置请求上下文到日志服务
    const context: LogContext = {
      module: 'HTTP',
      function: 'GlobalExceptionFilter',
      requestId,
    };
    
    const userId = (request as any).user?.userId;
    if (userId) {
      context.userId = userId;
    }
    
    this.appLogger.setContext(requestId, context);

    // 根据错误类型使用专门的日志方法
    if (type === ErrorType.UNKNOWN || type === ErrorType.INTERNAL) {
      this.appLogger.error(
        `Unhandled Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        'GLOBAL_EXCEPTION_FILTER',
        exception instanceof Error ? exception.stack : undefined,
        requestId
      );
    } else if (type === ErrorType.EXTERNAL) {
      this.appLogger.logExternalServiceError(
        'External Service',
        'HTTP Request',
        exception instanceof Error ? exception : new Error(String(exception)),
        request.url,
        requestId
      );
    } else {
      // 使用增强的日志方法
      this.appLogger.error(
        `HTTP Exception: ${exception instanceof HttpException ? (exception.getResponse() as any)?.message || exception.message : 'Unknown error'}`,
        `${type} | Severity: ${severity}`,
        exception instanceof Error ? exception.stack : undefined,
        requestId
      );
    }

    // 详细错误信息记录到调试日志
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      this.appLogger.debug(JSON.stringify({ 
        ...errorInfo, 
        error: response,
        httpStatus: status 
      }), 'HTTP_EXCEPTION_DETAILS', requestId);
    } else {
      const error = exception as Error;
      this.appLogger.debug(JSON.stringify({
        ...errorInfo,
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      }), 'UNHANDLED_EXCEPTION_DETAILS', requestId);
    }
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const { type, severity } = this.classifyError(exception);
    const requestId = this.generateRequestId();
    
    let statusCode = 500;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse() as any;
      message = response?.message || exception.message;
    } else {
      const error = exception as Error;
      message = error.message;
    }

    return {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      type,
      severity,
      data: process.env.NODE_ENV === 'development' ? {
        error: exception instanceof Error ? {
          name: exception.name,
          message: exception.message,
          stack: exception.stack,
        } : exception,
      } : undefined,
    };
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}