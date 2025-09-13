import Redis from 'ioredis';
export declare const REDIS_CLIENT = "REDIS_CLIENT";
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    handler?: (key: string, limit: RateLimitInfo) => any;
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
    checkLimit(key: string, options?: Partial<RateLimitOptions>): Promise<{
        success: boolean;
        info?: RateLimitInfo;
    }>;
    private getCurrentCount;
    private incrementCount;
    private setExpiration;
    private getExpirationTime;
    resetLimit(key: string): Promise<void>;
    getLimitInfo(key: string): Promise<RateLimitInfo | null>;
    cleanup(): Promise<number>;
}
