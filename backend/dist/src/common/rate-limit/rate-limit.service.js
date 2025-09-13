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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let RateLimitService = RateLimitService_1 = class RateLimitService {
    redis;
    logger = new common_1.Logger(RateLimitService_1.name);
    defaultOptions = {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        keyPrefix: 'rate_limit:',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    };
    constructor(redis) {
        this.redis = redis;
        this.logger.log('限流服务初始化');
    }
    async checkLimit(key, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const fullKey = `${config.keyPrefix}${key}`;
        try {
            const current = await this.getCurrentCount(fullKey, config.windowMs);
            const remaining = Math.max(0, config.maxRequests - current);
            if (current >= config.maxRequests) {
                const expiresAt = await this.getExpirationTime(fullKey);
                const info = {
                    key: fullKey,
                    points: current,
                    expiresAt,
                    remaining: 0,
                    resetTime: expiresAt,
                };
                this.logger.warn(`请求被限流: ${key}, 请求数: ${current}, 限制: ${config.maxRequests}`);
                if (config.handler) {
                    config.handler(key, info);
                }
                return { success: false, info };
            }
            const newCount = await this.incrementCount(fullKey, config.windowMs);
            await this.setExpiration(fullKey, config.windowMs);
            const expiresAt = await this.getExpirationTime(fullKey);
            const isFirstRequest = newCount === 1;
            const info = {
                key: fullKey,
                points: newCount,
                expiresAt,
                remaining: config.maxRequests - newCount,
                isFirstRequest,
                resetTime: expiresAt,
            };
            this.logger.debug(`限流检查通过: ${key}, 当前计数: ${newCount}, 剩余: ${info.remaining}`);
            return { success: true, info };
        }
        catch (error) {
            this.logger.error(`限流检查失败: ${key}`, error);
            return { success: true };
        }
    }
    async getCurrentCount(key, windowMs) {
        try {
            const result = await this.redis.get(key);
            return result ? parseInt(result, 10) : 0;
        }
        catch (error) {
            this.logger.error(`获取当前计数失败: ${key}`, error);
            return 0;
        }
    }
    async incrementCount(key, windowMs) {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.incr(key);
            pipeline.expire(key, Math.ceil(windowMs / 1000));
            const results = await pipeline.exec();
            if (results && results[0] && results[0][1]) {
                return results[0][1];
            }
            return 0;
        }
        catch (error) {
            this.logger.error(`增加计数失败: ${key}`, error);
            return 0;
        }
    }
    async setExpiration(key, windowMs) {
        try {
            await this.redis.expire(key, Math.ceil(windowMs / 1000));
        }
        catch (error) {
            this.logger.error(`设置过期时间失败: ${key}`, error);
        }
    }
    async getExpirationTime(key) {
        try {
            const ttl = await this.redis.ttl(key);
            if (ttl === -1 || ttl === -2) {
                return Date.now() + 15 * 60 * 1000;
            }
            return Date.now() + (ttl * 1000);
        }
        catch (error) {
            this.logger.error(`获取过期时间失败: ${key}`, error);
            return Date.now() + 15 * 60 * 1000;
        }
    }
    async resetLimit(key) {
        const fullKey = `${this.defaultOptions.keyPrefix}${key}`;
        try {
            await this.redis.del(fullKey);
            this.logger.log(`限流重置成功: ${key}`);
        }
        catch (error) {
            this.logger.error(`重置限流失败: ${key}`, error);
            throw error;
        }
    }
    async getLimitInfo(key) {
        const fullKey = `${this.defaultOptions.keyPrefix}${key}`;
        try {
            const current = await this.getCurrentCount(fullKey, this.defaultOptions.windowMs);
            const expiresAt = await this.getExpirationTime(fullKey);
            return {
                key: fullKey,
                points: current,
                expiresAt,
                remaining: Math.max(0, this.defaultOptions.maxRequests - current),
                resetTime: expiresAt,
            };
        }
        catch (error) {
            this.logger.error(`获取限流信息失败: ${key}`, error);
            return null;
        }
    }
    async cleanup() {
        const pattern = `${this.defaultOptions.keyPrefix}*`;
        try {
            const keys = await this.redis.keys(pattern);
            let cleaned = 0;
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl === -1) {
                    await this.redis.del(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                this.logger.log(`清理了 ${cleaned} 个过期的限流键`);
            }
            return cleaned;
        }
        catch (error) {
            this.logger.error('清理过期限流键失败', error);
            return 0;
        }
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = RateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map