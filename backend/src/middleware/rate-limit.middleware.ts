import { Injectable, NestMiddleware, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private configService: ConfigService) {}

  async use(context: ExecutionContext, next: () => Promise<void>) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 获取客户端标识
    const clientId = this.getClientId(request);

    // 获取限流配置
    const windowMs = parseInt(this.configService.get<string>('RATE_LIMIT_WINDOW', '900000')); // 15分钟
    const maxRequests = parseInt(this.configService.get<string>('RATE_LIMIT_MAX', '100')); // 100请求

    const now = Date.now();
    const userRequests = this.requestCounts.get(clientId);

    if (!userRequests || now > userRequests.resetTime) {
      // 重置计数器
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // 增加计数器
      userRequests.count++;

      if (userRequests.count > maxRequests) {
        // 超过限流，返回429
        response.setHeader('X-RateLimit-Limit', maxRequests.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('X-RateLimit-Reset', userRequests.resetTime.toString());
        response.setHeader(
          'Retry-After',
          Math.ceil((userRequests.resetTime - now) / 1000).toString(),
        );

        response.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        });
        return;
      }
    }

    // 添加限流头
    if (userRequests) {
      const remaining = Math.max(0, maxRequests - userRequests.count);
      response.setHeader('X-RateLimit-Limit', maxRequests.toString());
      response.setHeader('X-RateLimit-Remaining', remaining.toString());
      response.setHeader('X-RateLimit-Reset', userRequests.resetTime.toString());
    }

    await next();
  }

  private getClientId(request: Request): string {
    // 优先使用用户ID（已登录用户）
    const userId = (request as any).user?.id;
    if (userId) {
      return `user_${userId}`;
    }

    // 次使用IP地址（匿名用户）
    const ip =
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress;

    // 如果有用户代理，取第一个IP
    const clientIp = ip
      ? (Array.isArray(ip) ? ip[0] : ip.toString()).split(',')[0].trim()
      : 'unknown';

    return `ip_${clientIp}`;
  }

  // 定期清理过期的计数器
  private cleanupExpiredCounters() {
    const now = Date.now();
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      }
    }
  }
}
