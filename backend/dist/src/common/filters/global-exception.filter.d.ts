import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { AppLoggerService } from '../services/app-logger.service';
export declare enum ErrorType {
    UNKNOWN = "UNKNOWN_ERROR",
    AUTHENTICATION = "AUTHENTICATION_ERROR",
    AUTHORIZATION = "AUTHORIZATION_ERROR",
    VALIDATION = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND_ERROR",
    CONFLICT = "CONFLICT_ERROR",
    INTERNAL = "INTERNAL_ERROR",
    EXTERNAL = "EXTERNAL_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    requestId: string;
    type: ErrorType;
    severity: ErrorSeverity;
    data?: any;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly appLogger;
    constructor(appLogger: AppLoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private classifyError;
    private logError;
    private buildErrorResponse;
    private generateRequestId;
}
