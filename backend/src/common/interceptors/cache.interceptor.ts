import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';

/**
 * 缓存键装饰器
 */
export const CACHE_KEY = 'CACHE_KEY';
export const CACHE_TTL = 'CACHE_TTL';
export const CACHE_INVALIDATE = 'CACHE_INVALIDATE';

export const CacheKey = (key: string) => (target: any, key: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(CACHE_KEY, key, descriptor.value);
};

export const CacheTTL = (ttl: number) => (target: any, key: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(CACHE_TTL, ttl, descriptor.value);
};

export const CacheInvalidate = (pattern: string) => (target: any, key: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(CACHE_INVALIDATE, pattern, descriptor.value);
};

/**
 * 自动缓存拦截器
 * 自动缓存GET请求的响应结果
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // 只缓存GET请求
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL, context.getHandler());
    const invalidatePattern = this.reflector.get<string>(CACHE_INVALIDATE, context.getHandler());

    // 如果有缓存失效标记，先清除相关缓存
    if (invalidatePattern) {
      return next.handle().pipe(
        tap(() => {
          this.cacheService.delPattern(invalidatePattern);
        })
      );
    }

    // 如果没有缓存键，不进行缓存
    if (!cacheKey) {
      return next.handle();
    }

    // 生成完整的缓存键
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    // 尝试从缓存获取
    return from(this.cacheService.get(fullCacheKey)).pipe(
      switchMap(cached => {
        if (cached) {
          return of(cached);
        }

        // 缓存未命中，执行原方法并缓存结果
        return next.handle().pipe(
          map(data => {
            // 设置缓存
            const ttl = cacheTTL || 3600; // 默认1小时
            this.cacheService.set(fullCacheKey, data, ttl);
            return data;
          })
        );
      })
    );
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(baseKey: string, request: any): string {
    // 添加请求参数到缓存键
    const params = this.extractRequestParams(request);
    const paramsString = Object.keys(params).length 
      ? `:${Buffer.from(JSON.stringify(params)).toString('base64')}`
      : '';
    
    return `${baseKey}${paramsString}`;
  }

  /**
   * 提取请求参数
   */
  private extractRequestParams(request: any): any {
    const params: any = {};
    
    // 路径参数
    if (request.params) {
      Object.assign(params, request.params);
    }
    
    // 查询参数
    if (request.query) {
      Object.assign(params, request.query);
    }
    
    // 用户ID（如果有）
    if (request.user && request.user.id) {
      params.userId = request.user.id;
    }
    
    return params;
  }
}

