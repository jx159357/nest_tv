interface CacheManager {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: {
        ttl?: number;
    }): Promise<void>;
    del(key: string): Promise<void>;
    store: {
        reset(): Promise<void>;
    };
}
export declare enum CacheKeyStrategy {
    TRENDING = "trending",
    USER_RECOMMENDATIONS = "user_recommendations",
    USER_PREFERENCES = "user_preferences",
    SIMILAR_MEDIA = "similar_media",
    SIMILAR_USERS = "similar_users",
    COLLABORATIVE_MEDIA = "collaborative_media"
}
export interface CacheConfig {
    ttl: number;
    strategy: 'memory' | 'redis' | 'hybrid';
    compression?: boolean;
    serialize?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
    compressedKeys: number;
    serializedKeys: number;
}
export declare class AdvancedCacheManager {
    private readonly cacheManager;
    private readonly logger;
    private stats;
    private readonly defaultConfigs;
    constructor(cacheManager: CacheManager);
    generateCacheKey(strategy: CacheKeyStrategy, params?: Record<string, any>): string;
    get<T>(key: string, strategy?: CacheKeyStrategy): Promise<T | null>;
    set<T>(key: string, value: T, strategy: CacheKeyStrategy, customTtl?: number): Promise<void>;
    getOrSet<T>(strategy: CacheKeyStrategy, params: Record<string, any>, factory: () => Promise<T>, customTtl?: number): Promise<T>;
    mget<T>(keys: string[]): Promise<Map<string, T>>;
    mset<T>(entries: Array<{
        key: string;
        value: T;
        strategy: CacheKeyStrategy;
    }>): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): CacheStats;
    getKeyStats(key: string): {
        hits: number;
        misses: number;
        hitRate: number;
    };
    warmUp(strategy: CacheKeyStrategy, paramsList: Record<string, any>[], factory: (params: Record<string, any>) => Promise<any>): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        message?: string;
    }>;
    private updateStats;
    private compressData;
    private decompressData;
    private calculateDynamicTTL;
}
export {};
