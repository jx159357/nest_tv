import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { AppLoggerService } from '../../common/services/app-logger.service';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly appLogger;
    constructor(appLogger: AppLoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private logError;
    private buildErrorResponse;
    private getClientIp;
}
export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    timestamp: string;
    path?: string;
    data?: any;
}
export interface ValidationErrorResponse extends ErrorResponse {
    data: {
        errors: ValidationErrorItem[];
    };
}
export interface ValidationErrorItem {
    field: string;
    message: string;
    constraints?: Record<string, string>;
}
