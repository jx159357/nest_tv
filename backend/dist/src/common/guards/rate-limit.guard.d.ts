import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService, RateLimitOptions } from '../rate-limit/rate-limit.service';
export declare const RATE_LIMIT_KEY = "rate_limit";
export declare const RATE_LIMIT_OPTIONS = "rate_limit_options";
export declare const RateLimit: (options: RateLimitOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class RateLimitGuard implements CanActivate {
    private readonly rateLimitService;
    private readonly reflector;
    constructor(rateLimitService: RateLimitService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getLimitKey;
    private getClientIP;
    private getRoutePath;
    private setResponseHeaders;
}
