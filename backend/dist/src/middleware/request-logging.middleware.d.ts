import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../common/services/app-logger.service';
export declare class RequestLoggingMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: AppLoggerService);
    use(req: Request, res: Response, next: NextFunction): void;
    private getClientIp;
}
export interface RequestLogInfo {
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    timestamp: string;
}
export interface ResponseLogInfo {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
}
