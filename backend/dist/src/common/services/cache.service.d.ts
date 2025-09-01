import { Redis } from 'ioredis';
export declare class CacheService {
    private redisClient;
    constructor(redisClient: Redis);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    ttl(key: string): Promise<number>;
    incr(key: string, increment?: number): Promise<number>;
    decr(key: string, decrement?: number): Promise<number>;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(keyValuePairs: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    generateKey(prefix: string, ...parts: string[]): string;
    cleanupExpired(prefix: string, maxAge?: number): Promise<number>;
    getStats(): Promise<{
        keyCount: number;
        memoryUsage: string;
        connected: boolean;
    }>;
}
