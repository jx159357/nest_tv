import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';
export declare const CACHE_KEY = "CACHE_KEY";
export declare const CACHE_TTL = "CACHE_TTL";
export declare const CACHE_INVALIDATE = "CACHE_INVALIDATE";
export declare const CacheKey: (key: string) => (target: any, key: string, descriptor: PropertyDescriptor) => void;
export declare const CacheTTL: (ttl: number) => (target: any, key: string, descriptor: PropertyDescriptor) => void;
export declare const CacheInvalidate: (pattern: string) => (target: any, key: string, descriptor: PropertyDescriptor) => void;
export declare class CacheInterceptor implements NestInterceptor {
    private cacheService;
    private reflector;
    constructor(cacheService: CacheService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private generateCacheKey;
    private extractRequestParams;
}
