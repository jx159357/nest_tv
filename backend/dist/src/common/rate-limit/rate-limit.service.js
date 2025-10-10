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
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_constants_1 = require("../constants/redis.constants");
let RateLimitService = RateLimitService_1 = class RateLimitService {
    redis;
    logger = new common_1.Logger(RateLimitService_1.name);
    defaultOptions = {
        windowMs: 60000,
        maxRequests: 100,
        keyPrefix: 'rate_limit:',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    };
    constructor(redis) {
        this.redis = redis;
        this.logger.log('限流服务初始化');
    }
    async getCurrentCount(key, windowMs) {
        try {
            const count = await this.redis.get(key);
            return count ? parseInt(count, 10) : 0;
        }
        catch (error) {
            this.logger.error(`获取限流计数失败: ${key}`, error);
            return 0;
        }
    }
    async incrementCount(key, windowMs) {
        try {
            const result = await this.redis.multi()
                .incr(key)
                .expire(key, Math.ceil(windowMs / 1000))
                .exec();
            if (Array.isArray(result) && result[0] && result[0][0] === null && typeof result[0][1] === 'number') {
                return result[0][1];
            }
            return 1;
        }
        catch (error) {
            this.logger.error(`增加限流计数失败: ${key}`, error);
            return 1;
        }
    }
    async setExpiration(key, windowMs) {
        try {
            await this.redis.expire(key, Math.ceil(windowMs / 1000));
        }
        catch (error) {
            this.logger.error(`设置限流过期时间失败: ${key}`, error);
        }
    }
    async getExpirationTime(key) {
        try {
            const ttl = await this.redis.ttl(key);
            return ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : 0;
        }
        catch (error) {
            this.logger.error(`获取限流过期时间失败: ${key}`, error);
            return 0;
        }
    }
    async checkLimit(key, options = {}, algorithm = 'fixed') {
        switch (algorithm) {
            case 'token_bucket':
                return this.tokenBucket(key, options);
            case 'sliding_window':
                return this.slidingWindow(key, options);
            default:
                return this.fixedWindow(key, options);
        }
    }
    async fixedWindow(key, options = {}) {
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
    async tokenBucket(key, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const fullKey = `${config.keyPrefix}token:${key}`;
        const bucketSize = config.maxRequests;
        const refillRate = config.maxRequests / (config.windowMs / 1000);
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const luaScript = `
        local key = KEYS[1]
        local currentTime = tonumber(ARGV[1])
        local bucketSize = tonumber(ARGV[2])
        local refillRate = tonumber(ARGV[3])
        local requestTokens = tonumber(ARGV[4])
        
        local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(data[1]) or bucketSize
        local lastRefill = tonumber(data[2]) or currentTime
        
        -- 补充令牌
        local timePassed = currentTime - lastRefill
        local tokensToAdd = math.floor(timePassed * refillRate)
        tokens = math.min(bucketSize, tokens + tokensToAdd)
        
        -- 检查是否有足够令牌
        if tokens >= requestTokens then
          tokens = tokens - requestTokens
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
          redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
          return {1, tokens, bucketSize - tokens}
        else
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
          redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
          return {0, tokens, bucketSize - tokens}
        end
      `;
            const result = await this.redis.eval(luaScript, 1, fullKey, currentTime, bucketSize, refillRate, 1);
            if (Array.isArray(result) && result.length === 3) {
                const success = result[0][1] === 1;
                const availableTokens = result[1][1];
                const remaining = result[2][1];
                const info = {
                    key: fullKey,
                    points: availableTokens,
                    expiresAt: currentTime + Math.ceil(bucketSize / refillRate),
                    remaining: remaining,
                    resetTime: currentTime + Math.ceil(bucketSize / refillRate),
                };
                if (success) {
                    return { success: true, info };
                }
                else {
                    this.logger.warn(`令牌桶限流: ${key}, 可用令牌: ${availableTokens}`);
                    return { success: false, info };
                }
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`令牌桶限流失败: ${key}`, error);
            return { success: true };
        }
    }
    async slidingWindow(key, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const fullKey = `${config.keyPrefix}sliding:${key}`;
        const currentTime = Date.now();
        const windowStart = currentTime - config.windowMs;
        try {
            const pipeline = this.redis.pipeline();
            pipeline.zremrangebyscore(fullKey, 0, windowStart);
            pipeline.zcard(fullKey);
            pipeline.zadd(fullKey, currentTime, `${currentTime}-${Math.random()}`);
            pipeline.expire(fullKey, Math.ceil(config.windowMs / 1000));
            const results = await pipeline.exec();
            if (Array.isArray(results) && results[1] && results[1][0] === null && results[1][1] !== null) {
                const currentCount = results[1][1];
                const remaining = Math.max(0, config.maxRequests - currentCount);
                if (currentCount >= config.maxRequests) {
                    const info = {
                        key: fullKey,
                        points: currentCount,
                        expiresAt: currentTime + config.windowMs,
                        remaining: 0,
                        resetTime: currentTime + config.windowMs,
                    };
                    this.logger.warn(`滑动窗口限流: ${key}, 请求数: ${currentCount}, 限制: ${config.maxRequests}`);
                    return { success: false, info };
                }
                const info = {
                    key: fullKey,
                    points: currentCount,
                    expiresAt: currentTime + config.windowMs,
                    remaining: remaining,
                    isFirstRequest: currentCount === 1,
                    resetTime: currentTime + config.windowMs,
                };
                return { success: true, info };
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`滑动窗口限流失败: ${key}`, error);
            return { success: true };
        }
    }
    async resetLimit(key) {
        const config = this.defaultOptions;
        const fullKey = `${config.keyPrefix}${key}`;
        try {
            await this.redis.del(fullKey);
            this.logger.log(`重置限流计数: ${key}`);
        }
        catch (error) {
            this.logger.error(`重置限流计数失败: ${key}`, error);
        }
    }
    async getLimitInfo(key) {
        const config = this.defaultOptions;
        const fullKey = `${config.keyPrefix}${key}`;
        try {
            const current = await this.getCurrentCount(fullKey, config.windowMs);
            const expiresAt = await this.getExpirationTime(fullKey);
            return {
                key: fullKey,
                points: current,
                expiresAt,
                remaining: Math.max(0, config.maxRequests - current),
                resetTime: expiresAt,
            };
        }
        catch (error) {
            this.logger.error(`获取限流状态失败: ${key}`, error);
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
    __param(0, (0, common_1.Inject)(redis_constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map