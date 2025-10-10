import Redis from 'ioredis';
export declare const REDIS_CLIENT = "REDIS_CLIENT";
export interface CacheOptions {
    ttl?: number;
    key?: string;
    prefix?: string;
}
export interface CacheableOptions extends CacheOptions {
    key?: string;
}
export interface CacheEvictOptions extends CacheOptions {
    all?: boolean;
}
export interface MultiCacheOptions extends CacheOptions {
    useMemoryCache?: boolean;
    useRedisCache?: boolean;
    memoryTtl?: number;
    priority?: 'high' | 'medium' | 'low';
}
export declare class CacheService {
    private readonly redis;
    private readonly logger;
    private readonly defaultPrefix;
    private readonly defaultTtl;
    private memoryCache;
    private readonly defaultMemoryTtl;
    private stats;
    constructor(redis: Redis);
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    delete(key: string, options?: CacheOptions): Promise<void>;
    clearPattern(pattern: string, options?: CacheOptions): Promise<number>;
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    expire(key: string, ttl: number, options?: CacheOptions): Promise<void>;
    ttl(key: string, options?: CacheOptions): Promise<number>;
    mset<T>(data: Record<string, T>, options?: CacheOptions): Promise<void>;
    mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]>;
    getStats(): Promise<any>;
    multiSet<T>(key: string, value: T, options?: MultiCacheOptions): Promise<void>;
    multiGet<T>(key: string, options?: MultiCacheOptions): Promise<T | null>;
    multiDelete(key: string, options?: MultiCacheOptions): Promise<void>;
    getCacheStats(): {
        totalRequests: number;
        hitRate: string;
        memoryCacheSize: number;
        memoryHitRate: string;
        hits: number;
        misses: number;
        memoryHits: number;
        redisHits: number;
        errors: number;
    };
    private cleanupMemoryCache;
    private startMemoryCacheCleanup;
    private setMemoryCache;
    private getMemoryCache;
    private deleteMemoryCache;
    private evictLowPriorityCache;
}
