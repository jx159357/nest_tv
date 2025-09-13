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
export declare class CacheService {
    private readonly redis;
    private readonly logger;
    private readonly defaultPrefix;
    private readonly defaultTtl;
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
}
