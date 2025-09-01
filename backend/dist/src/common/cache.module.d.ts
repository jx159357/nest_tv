import { DynamicModule, Provider } from '@nestjs/common';
import { CacheInterceptor, CACHE_KEY, CACHE_TTL, CACHE_INVALIDATE, CacheKey, CacheTTL, CacheInvalidate } from './interceptors/cache.interceptor';
export interface CacheModuleOptions {
    redisUrl: string;
    redisOptions?: any;
    global?: boolean;
}
export declare class CacheModule {
    static createRedisProvider(options: CacheModuleOptions): Provider;
    static forRoot(options: CacheModuleOptions): DynamicModule;
    static forFeature(): DynamicModule;
}
export { CacheInterceptor, CacheKey, CacheTTL, CacheInvalidate, CACHE_KEY, CACHE_TTL, CACHE_INVALIDATE, };
