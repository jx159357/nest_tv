import Redis from 'ioredis';
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export interface RateLimitInfo {
    key: string;
    points: number;
    expiresAt: number;
    remaining: number;
    isFirstRequest?: boolean;
    resetTime: number;
}
export declare class RateLimitService {
    private readonly redis;
    private readonly logger;
    private readonly defaultOptions;
    constructor(redis: Redis);
    private getCurrentCount;
    private incrementCount;
    private setExpiration;
    private getExpirationTime;
    checkLimit(key: string, options?: Partial<RateLimitOptions>, algorithm?: 'fixed' | 'token_bucket' | 'sliding_window'): Promise<{
        success: boolean;
        info?: RateLimitInfo;
    }>;
    private fixedWindow;
    private tokenBucket;
    private slidingWindow;
    resetLimit(key: string): Promise<void>;
    getLimitInfo(key: string): Promise<RateLimitInfo | null>;
    cleanup(): Promise<number>;
}
