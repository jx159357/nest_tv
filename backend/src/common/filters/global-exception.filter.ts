import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 统一异常过滤器
 * 捕获所有异常并返回统一的错误响应格式
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let error: string;
    let details: any;

    // 处理不同类型的异常
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      status = exception.getStatus();
      message = exceptionResponse.message || exception.message;
      error = exceptionResponse.error || 'HTTP_EXCEPTION';
      details = exceptionResponse.details || null;
    } else if (exception instanceof Error) {
      // 处理系统错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      error = exception.name;
      details = process.env.NODE_ENV === 'development' ? exception.stack : null;
    } else {
      // 处理未知错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
      error = 'UNKNOWN_ERROR';
      details = null;
    }

    // 数据库错误特殊处理
    if (exception instanceof Error && exception.name.includes('Database')) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '数据库操作失败';
      error = 'DATABASE_ERROR';
      details = process.env.NODE_ENV === 'development' ? exception.message : null;
    }

    // 验证错误特殊处理
    if (exception instanceof Error && exception.name.includes('ValidationError')) {
      status = HttpStatus.BAD_REQUEST;
      message = '数据验证失败';
      error = 'VALIDATION_ERROR';
      details = exception.message;
    }

    // 权限错误特殊处理
    if (exception instanceof Error && exception.name.includes('Unauthorized')) {
      status = HttpStatus.UNAUTHORIZED;
      message = '未授权访问';
      error = 'UNAUTHORIZED';
      details = exception.message;
    }

    // 生成错误ID（用于追踪）
    const errorId = this.generateErrorId();
    
    // 记录错误日志
    this.logError(errorId, exception, ctx.getRequest());

    // 构造统一的错误响应
    const errorResponse = {
      success: false,
      error: {
        id: errorId,
        code: error,
        message,
        details: details || undefined,
        timestamp: new Date().toISOString(),
      },
      data: null,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ERR_${timestamp}_${random}`;
  }

  /**
   * 记录错误日志
   */
  private logError(errorId: string, exception: unknown, request: any): void {
    const errorInfo = {
      errorId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      userAgent: request.get('user-agent'),
      ip: request.ip || request.connection.remoteAddress,
      userId: request.user?.id || null,
      exception: {
        name: exception instanceof Error ? exception.name : 'Unknown',
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : null,
      },
    };

    // 根据环境选择日志级别
    const logLevel = this.getLogLevel(exception);
    
    switch (logLevel) {
      case 'error':
        console.error('🚨 ERROR:', JSON.stringify(errorInfo, null, 2));
        break;
      case 'warn':
        console.warn('⚠️  WARNING:', JSON.stringify(errorInfo, null, 2));
        break;
      case 'info':
        console.info('ℹ️  INFO:', JSON.stringify(errorInfo, null, 2));
        break;
      default:
        console.log('📝 LOG:', JSON.stringify(errorInfo, null, 2));
    }
  }

  /**
   * 根据异常类型确定日志级别
   */
  private getLogLevel(exception: unknown): 'error' | 'warn' | 'info' | 'debug' {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) return 'error';
      if (status >= 400) return 'warn';
      return 'info';
    }
    
    if (exception instanceof Error) {
      if (exception.name.includes('Database')) return 'error';
      if (exception.name.includes('Validation')) return 'warn';
      return 'error';
    }
    
    return 'error';
  }
}