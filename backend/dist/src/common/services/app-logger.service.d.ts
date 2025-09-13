export declare class AppLoggerService {
    private readonly logger;
    constructor();
    log(message: any, context?: string): void;
    error(message: any, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
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
