import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, LogEntry, Logger as WinstonLogger } from 'winston';
import 'winston-daily-rotate-file';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  module?: string;
  function?: string;
  userId?: number;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: WinstonLogger;
  private readonly loggers = new Map<string, Logger>();

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.json(),
      ),
      transports: [
        // 错误日志文件
        new transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          maxSize: '20m',
        }),
        // 所有日志文件
        new transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
        }),
        // 控制台输出
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              const log = {
                timestamp,
                level,
                message,
                context: context || 'Application',
                ...meta,
              };
              return JSON.stringify(log);
            }),
          ),
        }),
      ],
    });
  }

  /**
   * 获取或创建模块日志器
   */
  getLogger(context: string): Logger {
    if (!this.loggers.has(context)) {
      this.loggers.set(context, new Logger(context));
    }
    return this.loggers.get(context)!;
  }

  /**
   * 记录错误日志
   */
  error(message: any, context?: LogContext | string, stack?: string): void {
    this.log(message, LogLevel.ERROR, context, stack);
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: LogContext | string): void {
    this.log(message, LogLevel.WARN, context);
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: LogContext | string): void;
  log(message: any, level: LogLevel, context?: LogContext | string, stack?: string): void;
  log(message: any, level?: LogLevel | LogContext | string, context?: LogContext | string, stack?: string): void {
    let finalLevel: LogLevel = LogLevel.INFO;
    let finalContext: LogContext = {};
    let finalStack: string | undefined;

    // 参数重载处理
    if (typeof level === 'string' && Object.values(LogLevel).includes(level as LogLevel)) {
      finalLevel = level as LogLevel;
      if (context) {
        finalContext = typeof context === 'string' ? { module: context } : context;
      }
      finalStack = stack;
    } else if (level) {
      finalContext = typeof level === 'string' ? { module: level } : level;
    }

    // 构建日志条目
    const logEntry: LogEntry = {
      level: finalLevel,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      context: finalContext.module || 'Application',
      ...finalContext,
    };

    if (finalStack) {
      logEntry.stack = finalStack;
    }

    // 记录到Winston
    this.logger.log(finalLevel, logEntry.message, logEntry);

    // 同时记录到NestJS Logger（用于控制台输出）
    if (finalContext.module) {
      const nestLogger = this.getLogger(finalContext.module);
      switch (finalLevel) {
        case LogLevel.ERROR:
          nestLogger.error(message, stack);
          break;
        case LogLevel.WARN:
          nestLogger.warn(message);
          break;
        case LogLevel.INFO:
          nestLogger.log(message);
          break;
        case LogLevel.DEBUG:
          nestLogger.debug(message);
          break;
      }
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: LogContext | string): void {
    this.log(message, LogLevel.DEBUG, context);
  }

  /**
   * 记录API请求日志
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ): void {
    this.log(
      {
        method,
        url,
        statusCode,
        responseTime,
        type: 'http_request',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'HTTP',
      },
    );
  }

  /**
   * 记录数据库操作日志
   */
  logDatabase(
    operation: string,
    table: string,
    data?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        operation,
        table,
        data,
        type: 'database_operation',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'Database',
      },
    );
  }

  /**
   * 记录爬虫日志
   */
  logCrawler(
    target: string,
    url: string,
    action: 'start' | 'success' | 'error',
    data?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        target,
        url,
        action,
        data,
        type: 'crawler_operation',
      },
      action === 'error' ? LogLevel.ERROR : LogLevel.INFO,
      {
        ...context,
        module: 'Crawler',
      },
    );
  }

  /**
   * 记录用户行为日志
   */
  logUserAction(
    userId: number,
    action: string,
    resource?: string,
    details?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        userId,
        action,
        resource,
        details,
        type: 'user_action',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'User',
        userId,
      },
    );
  }

  /**
   * 记录性能日志
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        operation,
        duration,
        metadata,
        type: 'performance',
      },
      duration > 1000 ? LogLevel.WARN : LogLevel.INFO,
      {
        ...context,
        module: 'Performance',
      },
    );
  }

  /**
   * 记录磁力链接操作日志
   */
  logTorrent(
    infoHash: string,
    action: string,
    data?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        infoHash,
        action,
        data,
        type: 'torrent_operation',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'Torrent',
      },
    );
  }

  /**
   * 记录IPTV操作日志
   */
  logIPTV(
    channelId: number,
    action: string,
    data?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        channelId,
        action,
        data,
        type: 'iptv_operation',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'IPTV',
      },
    );
  }

  /**
   * 记录解析提供商操作日志
   */
  logParseProvider(
    providerId: number,
    action: string,
    data?: any,
    context?: LogContext,
  ): void {
    this.log(
      {
        providerId,
        action,
        data,
        type: 'parse_provider_operation',
      },
      LogLevel.INFO,
      {
        ...context,
        module: 'ParseProvider',
      },
    );
  }

  /**
   * 记录系统事件
   */
  logSystemEvent(
    event: string,
    data?: any,
    level: LogLevel = LogLevel.INFO,
    context?: LogContext,
  ): void {
    this.log(
      {
        event,
        data,
        type: 'system_event',
      },
      level,
      {
        ...context,
        module: 'System',
      },
    );
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * 获取所有活跃的日志器
   */
  getActiveLoggers(): string[] {
    return Array.from(this.loggers.keys());
  }
}