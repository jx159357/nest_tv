import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../common/services/app-logger.service';

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const logger = this.logger; // 保存logger引用
    
    // 记录请求开始
    logger.logRequest({
      method,
      url: originalUrl,
      ip: this.getClientIp(req),
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // 监听响应结束
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;

      // 记录响应信息
      try {
        logger.logResponse({
          method,
          url: originalUrl,
          statusCode,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // 如果记录日志失败，不中断正常流程
        console.error('Failed to log response:', error);
      }

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    return req.ip || req.connection.remoteAddress || '';
  }
}

/**
 * 请求日志信息接口
 */
export interface RequestLogInfo {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * 响应日志信息接口
 */
export interface ResponseLogInfo {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
}