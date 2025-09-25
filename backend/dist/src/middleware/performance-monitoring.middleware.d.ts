import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../common/services/app-logger.service';
export declare class PerformanceMonitoringMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: AppLoggerService);
    use(req: Request, res: Response, next: NextFunction): void;
    private logPerformanceMetrics;
    private generateRequestId;
}
export interface PerformanceMetrics {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    memoryUsage: number;
    timestamp: string;
}
export interface PerformanceStats {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    memoryUsage: number;
    uptime: number;
}
