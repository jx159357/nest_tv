import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService, RateLimitInfo, RateLimitOptions } from '../rate-limit/rate-limit.service';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RATE_LIMIT_OPTIONS = 'rate_limit_options';

/**
 * 限流装饰器
 */
export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_OPTIONS, options, target, propertyKey);
    Reflect.defineMetadata(RATE_LIMIT_KEY, true, target, propertyKey);
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 获取限流配置
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_OPTIONS,
      context.getHandler(),
    );

    // 如果没有限流配置，直接通过
    if (!options) {
      return true;
    }

    // 获取限流键（IP + 路径）
    const key = this.getLimitKey(request, context);
    
    // 检查限流
    const result = await this.rateLimitService.checkLimit(key, options);

    // 设置响应头
    this.setResponseHeaders(response, result.info);

    // 如果限流失败，抛出异常
    if (!result.success) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '请求过于频繁，请稍后重试',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((result.info!.expiresAt - Date.now()) / 1000),
          resetTime: new Date(result.info!.expiresAt).toISOString(),
          remaining: result.info!.remaining,
          total: result.info!.points,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * 获取限流键
   */
  private getLimitKey(request: any, context: ExecutionContext): string {
    // 默认使用IP + 路径
    let key = `${this.getClientIP(request)}:${this.getRoutePath(context)}`;

    // 如果有用户，使用用户ID
    if (request.user && request.user.id) {
      key = `user:${request.user.id}:${this.getRoutePath(context)}`;
    }

    return key;
  }

  /**
   * 获取客户端IP
   */
  private getClientIP(request: any): string {
    // 支持各种代理场景的IP获取
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.headers['cf-connecting-ip'] || // Cloudflare
      request.headers['true-client-ip'] ||
      request.headers['x-client-ip'] ||
      request.headers['x-forwarded'] ||
      request.headers['forwarded-for'] ||
      request.headers['remote-addr'] ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * 获取路由路径
   */
  private getRoutePath(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path || request.path || '/';
    
    // 清理路径中的参数
    return routePath
      .replace(/\/\d+/g, '/{id}') // 将数字ID替换为占位符
      .replace(/\/[^\/]+\/[^\/]+/g, '/{param}'); // 将参数路径替换
  }

  /**
   * 设置响应头
   */
  private setResponseHeaders(response: any, info?: RateLimitInfo): void {
    if (!info) return;

    // 设置标准的限流响应头
    response.setHeader('X-RateLimit-Limit', info.points);
    response.setHeader('X-RateLimit-Remaining', info.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));

    // 设置重试时间头
    const retryAfter = Math.ceil((info.expiresAt - Date.now()) / 1000);
    if (retryAfter > 0) {
      response.setHeader('Retry-After', retryAfter);
      response.setHeader('X-RateLimit-Retry-After', retryAfter);
    }

    // 设置第一次请求标志
    if (info.isFirstRequest) {
      response.setHeader('X-RateLimit-First', 'true');
    }
  }
}