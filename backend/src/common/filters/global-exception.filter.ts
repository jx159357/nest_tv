import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLoggerService } from '../../common/services/app-logger.service';

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
    const errorResponse = this.buildErrorResponse(exception);

    // 发送错误响应
    response
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }

  /**
   * 记录错误日志
   */
  private logError(exception: unknown, request: Request): void {
    const requestId = request.headers['x-request-id'] as string || 'unknown';
    const { method, originalUrl, ip, headers } = request;

    const errorInfo = {
      requestId,
      method,
      url: originalUrl,
      ip: this.getClientIp(request),
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      
      this.appLogger.error(
        `HTTP Exception: ${response?.message || exception.message}`,
        `HTTP_ERROR | Status: ${status}`,
        JSON.stringify({ ...errorInfo, error: response })
      );
    } else {
      const error = exception as Error;
      
      this.appLogger.error(
        `Unhandled Exception: ${error.message}`,
        'UNHANDLED_ERROR',
        JSON.stringify({
          ...errorInfo,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        })
      );
    }
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(exception: unknown): ErrorResponse {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      const message = response?.message || exception.message;

      return {
        success: false,
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: exception instanceof HttpException ? undefined : undefined,
        data: response?.data || null,
      };
    }

    // 处理未捕获的异常
    const error = exception as Error;
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: undefined,
      data: process.env.NODE_ENV === 'development' ? {
        error: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
    };
  }

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    return request.ip || request.connection.remoteAddress || '';
  }
}

/**
 * 标准化错误响应接口
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  data?: any;
}

/**
 * 验证错误响应接口
 */
export interface ValidationErrorResponse extends ErrorResponse {
  data: {
    errors: ValidationErrorItem[];
  };
}

/**
 * 验证错误项接口
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
  constraints?: Record<string, string>;
}