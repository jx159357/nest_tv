import { RequestLogInfo, ResponseLogInfo } from '../../middleware/request-logging.middleware';
export declare class AppLoggerService {
    private readonly logger;
    private requestLogEnabled;
    private responseLogEnabled;
    private errorLogEnabled;
    constructor();
    log(message: any, context?: string): void;
    error(message: any, context?: string, trace?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    logRequest(info: RequestLogInfo): void;
    logResponse(info: ResponseLogInfo): void;
    logOperation(action: string, resource: string, userId?: number, metadata?: Record<string, unknown>, status?: 'success' | 'error' | 'warning'): void;
    logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void;
    logDatabase(query: string, parameters: unknown[], duration: number): void;
    logSecurity(event: string, userId?: string, details?: Record<string, unknown>): void;
    setLogTypeEnabled(type: 'request' | 'response' | 'error', enabled: boolean): void;
    getLogConfig(): Record<string, boolean>;
}
export interface LogContext {
    module?: string;
    function?: string;
    userId?: number;
    requestId?: string;
    [key: string]: any;
}
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
