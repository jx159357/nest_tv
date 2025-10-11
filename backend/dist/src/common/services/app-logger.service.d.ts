import { RequestLogInfo, ResponseLogInfo } from '../../middleware/request-logging.middleware';
export declare class AppLoggerService {
    private readonly logger;
    private requestLogEnabled;
    private responseLogEnabled;
    private errorLogEnabled;
    private contextStore;
    constructor();
    setContext(requestId: string, context: LogContext): void;
    getContext(requestId: string): LogContext | undefined;
    clearContext(requestId: string): void;
    log(message: any, context?: string): void;
    error(message: any, context?: string, trace?: string, requestId?: string): void;
    warn(message: any, context?: string, requestId?: string): void;
    debug(message: any, context?: string, requestId?: string): void;
    private buildContext;
    logRequest(info: RequestLogInfo): void;
    logResponse(info: ResponseLogInfo): void;
    logOperation(action: string, resource: string, userId?: number, metadata?: Record<string, unknown>, status?: 'success' | 'error' | 'warning', requestId?: string): void;
    logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void;
    logDatabase(query: string, parameters: unknown[], duration: number): void;
    logSecurity(event: string, userId?: string, details?: Record<string, unknown>, requestId?: string): void;
    logDatabaseError(operation: string, error: Error, query?: string, params?: unknown[], requestId?: string): void;
    logExternalServiceError(service: string, operation: string, error: Error, url?: string, requestId?: string): void;
    logValidationError(field: string, value: any, validationErrors: string[], requestId?: string): void;
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
