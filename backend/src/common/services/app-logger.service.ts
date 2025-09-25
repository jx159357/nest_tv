import { Injectable, Logger } from '@nestjs/common';
import { RequestLogInfo, ResponseLogInfo } from '../../middleware/request-logging.middleware';

/**
 * 企业级应用日志服务
 * 支持请求日志、响应日志、错误日志等多种日志类型
 */
@Injectable()
export class AppLoggerService {
  private readonly logger: Logger;
  private requestLogEnabled: boolean = true;
  private responseLogEnabled: boolean = true;
  private errorLogEnabled: boolean = true;

  constructor() {
    this.logger = new Logger('NestTV');
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  /**
   * 记录错误日志
   */
  error(message: any, context?: string, trace?: string): void {
    this.logger.error(message, trace || '', context);
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string): void {
    this.logger.debug(message, context);
  }

  /**
   * 记录请求日志
   */
  logRequest(info: RequestLogInfo): void {
    if (!this.requestLogEnabled) return;

    const logMessage = `${info.method} ${info.url} - IP: ${info.ip}`;
    const context = `HTTP_REQUEST | User-Agent: ${info.userAgent || 'Unknown'}`;
    
    this.logger.log(logMessage, context);
  }

  /**
   * 记录响应日志
   */
  logResponse(info: ResponseLogInfo): void {
    if (!this.responseLogEnabled) return;

    const statusColor = info.statusCode >= 400 ? 'ERROR' : 'SUCCESS';
    const logMessage = `${info.method} ${info.url} - ${info.statusCode} (${info.responseTime}ms)`;
    const context = `HTTP_RESPONSE_${statusColor}`;
    
    if (info.statusCode >= 400) {
      this.logger.warn(logMessage, context);
    } else {
      this.logger.log(logMessage, context);
    }
  }

  /**
   * 记录业务操作日志
   */
  logOperation(
    action: string,
    resource: string,
    userId?: number,
    metadata?: Record<string, unknown>,
    status: 'success' | 'error' | 'warning' = 'success'
  ): void {
    const logMessage = `${action.toUpperCase()}: ${resource}`;
    const context = [
      `USER_ID: ${userId || 'Anonymous'}`,
      `STATUS: ${status}`,
      `METADATA: ${JSON.stringify(metadata || {})}`,
    ].join(' | ');

    if (status === 'error') {
      this.logger.error(logMessage, 'BUSINESS_OPERATION');
    } else if (status === 'warning') {
      this.logger.warn(logMessage, 'BUSINESS_OPERATION');
    } else {
      this.logger.log(logMessage, 'BUSINESS_OPERATION');
    }
  }

  /**
   * 记录性能日志
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    const logMessage = `PERFORMANCE: ${operation} took ${duration}ms`;
    const context = metadata ? `METADATA: ${JSON.stringify(metadata)}` : '';
    
    if (duration > 1000) {
      this.logger.warn(logMessage, context);
    } else {
      this.logger.debug(logMessage, context);
    }
  }

  /**
   * 记录数据库查询日志
   */
  logDatabase(query: string, parameters: unknown[], duration: number): void {
    const logMessage = `DATABASE_QUERY: ${query.substring(0, 100)}...`;
    const context = `PARAMS: ${JSON.stringify(parameters)} | DURATION: ${duration}ms`;
    
    this.logger.debug(logMessage, context);
  }

  /**
   * 记录安全相关日志
   */
  logSecurity(event: string, userId?: string, details?: Record<string, unknown>): void {
    const logMessage = `SECURITY_EVENT: ${event}`;
    const context = [
      `USER: ${userId || 'Anonymous'}`,
      `DETAILS: ${JSON.stringify(details || {})}`,
    ].join(' | ');

    this.logger.warn(logMessage, context);
  }

  /**
   * 启用/禁用特定类型的日志
   */
  setLogTypeEnabled(type: 'request' | 'response' | 'error', enabled: boolean): void {
    switch (type) {
      case 'request':
        this.requestLogEnabled = enabled;
        break;
      case 'response':
        this.responseLogEnabled = enabled;
        break;
      case 'error':
        this.errorLogEnabled = enabled;
        break;
    }
  }

  /**
   * 获取当前日志配置
   */
  getLogConfig(): Record<string, boolean> {
    return {
      request: this.requestLogEnabled,
      response: this.responseLogEnabled,
      error: this.errorLogEnabled,
    };
  }
}

export interface LogContext {
  module?: string;
  function?: string;
  userId?: number;
  requestId?: string;
  [key: string]: any;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}
