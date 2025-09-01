import { Logger, LoggerService } from '@nestjs/common';
import 'winston-daily-rotate-file';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
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
export declare class AppLoggerService implements LoggerService {
    private readonly logger;
    private readonly loggers;
    constructor();
    getLogger(context: string): Logger;
    error(message: any, context?: LogContext | string, stack?: string): void;
    warn(message: any, context?: LogContext | string): void;
    log(message: any, context?: LogContext | string): void;
    log(message: any, level: LogLevel, context?: LogContext | string, stack?: string): void;
    debug(message: any, context?: LogContext | string): void;
    logRequest(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void;
    logDatabase(operation: string, table: string, data?: any, context?: LogContext): void;
    logCrawler(target: string, url: string, action: 'start' | 'success' | 'error', data?: any, context?: LogContext): void;
    logUserAction(userId: number, action: string, resource?: string, details?: any, context?: LogContext): void;
    logPerformance(operation: string, duration: number, metadata?: any, context?: LogContext): void;
    logTorrent(infoHash: string, action: string, data?: any, context?: LogContext): void;
    logIPTV(channelId: number, action: string, data?: any, context?: LogContext): void;
    logParseProvider(providerId: number, action: string, data?: any, context?: LogContext): void;
    logSystemEvent(event: string, data?: any, level?: LogLevel, context?: LogContext): void;
    setLevel(level: LogLevel): void;
    getActiveLoggers(): string[];
}
