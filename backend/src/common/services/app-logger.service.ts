import { Injectable, Logger } from '@nestjs/common'

/**
 * 简化的应用日志服务
 */
@Injectable()
export class AppLoggerService {
  private readonly logger: Logger

  constructor() {
    this.logger = new Logger('NestTV')
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: string): void {
    this.logger.log(message, context)
  }

  /**
   * 记录错误日志
   */
  error(message: any, context?: string): void {
    this.logger.error(message, context)
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string): void {
    this.logger.warn(message, context)
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string): void {
    this.logger.debug(message, context)
  }
}

export interface LogContext {
  module?: string
  function?: string
  userId?: number
  requestId?: string
  [key: string]: any
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}