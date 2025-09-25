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
exports.RateLimitMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RateLimitMiddleware = class RateLimitMiddleware {
    configService;
    requestCounts = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    async use(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const clientId = this.getClientId(request);
        const windowMs = parseInt(this.configService.get('RATE_LIMIT_WINDOW', '900000'));
        const maxRequests = parseInt(this.configService.get('RATE_LIMIT_MAX', '100'));
        const now = Date.now();
        const userRequests = this.requestCounts.get(clientId);
        if (!userRequests || now > userRequests.resetTime) {
            this.requestCounts.set(clientId, {
                count: 1,
                resetTime: now + windowMs,
            });
        }
        else {
            userRequests.count++;
            if (userRequests.count > maxRequests) {
                response.setHeader('X-RateLimit-Limit', maxRequests.toString());
                response.setHeader('X-RateLimit-Remaining', '0');
                response.setHeader('X-RateLimit-Reset', userRequests.resetTime.toString());
                response.setHeader('Retry-After', Math.ceil((userRequests.resetTime - now) / 1000).toString());
                response.status(common_1.HttpStatus.TOO_MANY_REQUESTS).json({
                    statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too many requests, please try again later',
                    error: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
                });
                return;
            }
        }
        if (userRequests) {
            const remaining = Math.max(0, maxRequests - userRequests.count);
            response.setHeader('X-RateLimit-Limit', maxRequests.toString());
            response.setHeader('X-RateLimit-Remaining', remaining.toString());
            response.setHeader('X-RateLimit-Reset', userRequests.resetTime.toString());
        }
        await next();
    }
    getClientId(request) {
        const userId = request.user?.id;
        if (userId) {
            return `user_${userId}`;
        }
        const ip = request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress;
        const clientIp = ip
            ? (Array.isArray(ip) ? ip[0] : ip.toString()).split(',')[0].trim()
            : 'unknown';
        return `ip_${clientIp}`;
    }
    cleanupExpiredCounters() {
        const now = Date.now();
        for (const [clientId, data] of this.requestCounts.entries()) {
            if (now > data.resetTime) {
                this.requestCounts.delete(clientId);
            }
        }
    }
};
exports.RateLimitMiddleware = RateLimitMiddleware;
exports.RateLimitMiddleware = RateLimitMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RateLimitMiddleware);
//# sourceMappingURL=rate-limit.middleware.js.map