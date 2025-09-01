import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheService } from './services/cache.service';
import { MediaCacheService } from './services/media-cache.service';
import { CacheInterceptor, CACHE_KEY, CACHE_TTL, CACHE_INVALIDATE, CacheKey, CacheTTL, CacheInvalidate } from './interceptors/cache.interceptor';

/**
 * 缓存模块配置接口
 */
export interface CacheModuleOptions {
  redisUrl: string;
  redisOptions?: any;
  global?: boolean;
}

/**
 * 缓存模块
 * 提供Redis缓存功能和相关服务
 */
@Module({
  providers: [CacheService, MediaCacheService],
  exports: [CacheService, MediaCacheService],
})
export class CacheModule {
  /**
   * 创建Redis客户端提供者
   */
  static createRedisProvider(options: CacheModuleOptions): Provider {
    return {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const redis = new Redis(options.redisUrl, options.redisOptions);
        
        // 连接错误处理
        redis.on('error', (error) => {
          console.error('Redis connection error:', error);
        });
        
        // 连接成功处理
        redis.on('connect', () => {
          console.log('Redis connected successfully');
        });
        
        return redis;
      },
    };
  }

  /**
   * 动态创建缓存模块
   */
  static forRoot(options: CacheModuleOptions): DynamicModule {
    const providers = [
      this.createRedisProvider(options),
      CacheService,
      MediaCacheService,
    ];

    return {
      module: CacheModule,
      providers,
      exports: [CacheService, MediaCacheService],
      global: options.global ?? false,
    };
  }

  /**
   * 动态创建特性缓存模块
   */
  static forFeature(): DynamicModule {
    return {
      module: CacheModule,
      providers: [MediaCacheService],
      exports: [MediaCacheService],
    };
  }
}

// 导出装饰器和拦截器
export {
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  CacheInvalidate,
  CACHE_KEY,
  CACHE_TTL,
  CACHE_INVALIDATE,
};