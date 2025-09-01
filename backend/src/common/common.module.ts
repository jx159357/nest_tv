import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseInterceptor, SuccessResponse, PaginatedResponse } from './interceptors/response.interceptor';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { CacheService } from './services/cache.service';
import { MediaCacheService } from './services/media-cache.service';
import { TorrentService } from './services/torrent.service';
import { AppLoggerService } from './services/app-logger.service';

/**
 * 通用模块
 * 提供全局异常过滤、响应拦截器、缓存等功能
 */
@Module({
  providers: [
    PerformanceMonitorService,
    CacheService,
    MediaCacheService,
    TorrentService,
    AppLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [
    PerformanceMonitorService,
    CacheService,
    MediaCacheService,
    TorrentService,
    AppLoggerService,
  ],
})
export class CommonModule {
  /**
   * 动态创建通用模块
   */
  static forRoot(options?: {
    enableCache?: boolean;
    enableRequestId?: boolean;
  }): DynamicModule {
    const providers: Provider[] = [
      PerformanceMonitorService,
      {
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: ResponseInterceptor,
      },
    ];

    // 根据配置添加服务
    if (options?.enableCache) {
      providers.push(
        CacheService,
        MediaCacheService,
        {
          provide: APP_INTERCEPTOR,
          useClass: CacheInterceptor,
        }
      );
    }

    if (options?.enableRequestId) {
      providers.push({
        provide: 'REQUEST_ID_MIDDLEWARE',
        useFactory: () => {
          return new RequestIdMiddleware();
        },
      });
    }

    return {
      module: CommonModule,
      providers,
      exports: providers,
      global: true,
    };
  }

  /**
   * 动态创建特性模块
   */
  static forFeature(): DynamicModule {
    return {
      module: CommonModule,
      exports: [
        PerformanceMonitorService,
        CacheService,
        MediaCacheService,
      ],
    };
  }
}

// 导出装饰器
export {
  SuccessResponse as SuccessResponseDecorator,
  PaginatedResponse as PaginatedResponseDecorator,
} from './interceptors/response.interceptor';

export {
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  CacheInvalidate,
} from './interceptors/cache.interceptor';

// 导出异常类
export {
  ApiErrorCode,
  ApiErrorMessage,
  HttpStatusCodeMap,
  ApiException,
} from './exceptions/api.exception';

// 导出DTO
export type {
  ApiResponse as ApiResponseDto,
  PaginatedResponse as PaginatedResponseDto,
  SuccessResponse as SuccessResponseDto,
  ErrorResponse as ErrorResponseDto,
} from './dto/api-response.dto';