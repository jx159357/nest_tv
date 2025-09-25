import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../common/services/app-logger.service';

/**
 * 性能监控中间件
 * 监控API响应时间、内存使用等性能指标
 */
@Injectable()
export class PerformanceMonitoringMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const { method, originalUrl } = req;
    const requestId = this.generateRequestId();

    // 添加请求ID到请求头
    req.headers['x-request-id'] = requestId;

    // 监听响应结束
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: string): Response {
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const responseTime = endTime - startTime;
      const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
      const { statusCode } = res;

      // 记录性能指标
      this.logPerformanceMetrics({
        requestId,
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        memoryUsage,
        timestamp: new Date().toISOString(),
      });

      return originalEnd.call(res, chunk, encoding);
    }.bind(this);

    next();
  }

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    const { responseTime, statusCode, memoryUsage } = metrics;

    // 记录性能日志
    this.logger.logPerformance(
      `${metrics.method} ${metrics.url}`,
      responseTime,
      {
        statusCode,
        memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)}MB`,
        requestId: metrics.requestId,
      }
    );

    // 如果响应时间过长，发出警告
    if (responseTime > 5000) {
      this.logger.warn(
        `Slow request detected: ${metrics.method} ${metrics.url} took ${responseTime}ms`,
        'PERFORMANCE_WARNING'
      );
    }

    // 如果内存使用过高，发出警告
    const heapUsedInMB = memoryUsage / 1024 / 1024;
    if (heapUsedInMB > 500) {
      this.logger.warn(
        `High memory usage detected: ${heapUsedInMB.toFixed(2)}MB`,
        'MEMORY_WARNING'
      );
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: number;
  timestamp: string;
}

/**
 * 性能统计数据
 */
export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  memoryUsage: number;
  uptime: number;
}