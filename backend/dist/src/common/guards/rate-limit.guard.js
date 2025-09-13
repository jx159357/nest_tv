"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_OPTIONS = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limit_service_1 = require("../rate-limit/rate-limit.service");
exports.RATE_LIMIT_KEY = 'rate_limit';
exports.RATE_LIMIT_OPTIONS = 'rate_limit_options';
const RateLimit = (options) => {
    return (target, propertyKey, descriptor) => {
        Reflect.defineMetadata(exports.RATE_LIMIT_OPTIONS, options, target, propertyKey);
        Reflect.defineMetadata(exports.RATE_LIMIT_KEY, true, target, propertyKey);
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    rateLimitService;
    reflector;
    constructor(rateLimitService, reflector) {
        this.rateLimitService = rateLimitService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const options = this.reflector.get(exports.RATE_LIMIT_OPTIONS, context.getHandler());
        if (!options) {
            return true;
        }
        const key = this.getLimitKey(request, context);
        const result = await this.rateLimitService.checkLimit(key, options);
        this.setResponseHeaders(response, result.info);
        if (!result.success) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: '请求过于频繁，请稍后重试',
                error: 'Too Many Requests',
                retryAfter: Math.ceil((result.info.expiresAt - Date.now()) / 1000),
                resetTime: new Date(result.info.expiresAt).toISOString(),
                remaining: result.info.remaining,
                total: result.info.points,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
    getLimitKey(request, context) {
        let key = `${this.getClientIP(request)}:${this.getRoutePath(context)}`;
        if (request.user && request.user.id) {
            key = `user:${request.user.id}:${this.getRoutePath(context)}`;
        }
        return key;
    }
    getClientIP(request) {
        return (request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.headers['cf-connecting-ip'] ||
            request.headers['true-client-ip'] ||
            request.headers['x-client-ip'] ||
            request.headers['x-forwarded'] ||
            request.headers['forwarded-for'] ||
            request.headers['remote-addr'] ||
            request.socket?.remoteAddress ||
            request.connection?.remoteAddress ||
            request.ip ||
            'unknown');
    }
    getRoutePath(context) {
        const request = context.switchToHttp().getRequest();
        const routePath = request.route?.path || request.path || '/';
        return routePath
            .replace(/\/\d+/g, '/{id}')
            .replace(/\/[^\/]+\/[^\/]+/g, '/{param}');
    }
    setResponseHeaders(response, info) {
        if (!info)
            return;
        response.setHeader('X-RateLimit-Limit', info.points);
        response.setHeader('X-RateLimit-Remaining', info.remaining);
        response.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));
        const retryAfter = Math.ceil((info.expiresAt - Date.now()) / 1000);
        if (retryAfter > 0) {
            response.setHeader('Retry-After', retryAfter);
            response.setHeader('X-RateLimit-Retry-After', retryAfter);
        }
        if (info.isFirstRequest) {
            response.setHeader('X-RateLimit-First', 'true');
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limit_service_1.RateLimitService,
        core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map