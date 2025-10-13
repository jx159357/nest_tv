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
  private contextStore: Map<string, LogContext> = new Map();

  constructor() {
    this.logger = new Logger('NestTV');
  }

  /**
   * 设置请求上下文
   */
  setContext(requestId: string, context: LogContext): void {
    this.contextStore.set(requestId, context);
  }

  /**
   * 获取请求上下文
   */
  getContext(requestId: string): LogContext | undefined {
    return this.contextStore.get(requestId);
  }

  /**
   * 清除请求上下文
   */
  clearContext(requestId: string): void {
    this.contextStore.delete(requestId);
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  /**
   * 记录错误日志（增强版）
   */
  error(message: any, context?: string, trace?: string, requestId?: string): void {
    const logContext = this.buildContext(context, requestId);
    this.logger.error(message, trace || '', logContext);
  }

  /**
   * 记录警告日志（增强版）
   */
  warn(message: any, context?: string, requestId?: string): void {
    const logContext = this.buildContext(context, requestId);
    this.logger.warn(message, logContext);
  }

  /**
   * 记录调试日志（增强版）
   */
  debug(message: any, context?: string, requestId?: string): void {
    const logContext = this.buildContext(context, requestId);
    this.logger.debug(message, logContext);
  }

  /**
   * 构建带上下文的日志消息
   */
  private buildContext(baseContext?: string, requestId?: string): string {
    const contextParts: string[] = [];

    if (baseContext) {
      contextParts.push(baseContext);
    }

    if (requestId) {
      const requestContext = this.getContext(requestId);
      if (requestContext) {
        contextParts.push(`RequestID: ${requestId}`);
        if (requestContext.userId) {
          contextParts.push(`UserID: ${requestContext.userId}`);
        }
        if (requestContext.module) {
          contextParts.push(`Module: ${requestContext.module}`);
        }
      }
    }

    return contextParts.join(' | ');
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
   * 记录业务操作日志（增强版）
   */
  logOperation(
    action: string,
    resource: string,
    userId?: number,
    metadata?: Record<string, unknown>,
    status: 'success' | 'error' | 'warning' = 'success',
    requestId?: string,
  ): void {
    const logMessage = `${action.toUpperCase()}: ${resource}`;
    const baseContext = [
      `USER_ID: ${userId || 'Anonymous'}`,
      `STATUS: ${status}`,
      `METADATA: ${JSON.stringify(metadata || {})}`,
    ].join(' | ');

    const fullContext = this.buildContext(baseContext, requestId);

    if (status === 'error') {
      this.logger.error(logMessage, 'BUSINESS_OPERATION');
    } else if (status === 'warning') {
      this.logger.warn(logMessage, fullContext);
    } else {
      this.logger.log(logMessage, fullContext);
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
   * 记录安全相关日志（增强版）
   */
  logSecurity(
    event: string,
    userId?: string,
    details?: Record<string, unknown>,
    requestId?: string,
  ): void {
    const logMessage = `SECURITY_EVENT: ${event}`;
    const baseContext = [
      `USER: ${userId || 'Anonymous'}`,
      `DETAILS: ${JSON.stringify(details || {})}`,
    ].join(' | ');

    const fullContext = this.buildContext(baseContext, requestId);
    this.logger.warn(logMessage, fullContext);
  }

  /**
   * 记录数据库错误日志
   */
  logDatabaseError(
    operation: string,
    error: Error,
    query?: string,
    params?: unknown[],
    requestId?: string,
  ): void {
    const logMessage = `DATABASE_ERROR: ${operation} failed`;
    const baseContext = [
      `ERROR: ${error.message}`,
      `QUERY: ${query || 'Unknown'}`,
      `PARAMS: ${JSON.stringify(params || [])}`,
    ].join(' | ');

    const fullContext = this.buildContext(baseContext, requestId);
    this.logger.error(logMessage, error.stack, fullContext);
  }

  /**
   * 记录外部服务错误日志
   */
  logExternalServiceError(
    service: string,
    operation: string,
    error: Error,
    url?: string,
    requestId?: string,
  ): void {
    const logMessage = `EXTERNAL_SERVICE_ERROR: ${service} - ${operation}`;
    const baseContext = [`ERROR: ${error.message}`, `URL: ${url || 'Unknown'}`].join(' | ');

    const fullContext = this.buildContext(baseContext, requestId);
    this.logger.error(logMessage, error.stack, fullContext);
  }

  /**
   * 记录验证错误日志
   */
  logValidationError(
    field: string,
    value: any,
    validationErrors: string[],
    requestId?: string,
  ): void {
    const logMessage = `VALIDATION_ERROR: ${field}`;
    const baseContext = [
      `VALUE: ${JSON.stringify(value)}`,
      `ERRORS: ${validationErrors.join(', ')}`,
    ].join(' | ');

    const fullContext = this.buildContext(baseContext, requestId);
    this.logger.warn(logMessage, fullContext);
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
