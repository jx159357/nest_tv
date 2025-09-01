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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let CacheService = class CacheService {
    redisClient;
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async get(key) {
        try {
            const value = await this.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl = 3600) {
        try {
            await this.redisClient.setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    }
    async del(key) {
        try {
            await this.redisClient.del(key);
        }
        catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.redisClient.keys(pattern);
            if (keys.length > 0) {
                return await this.redisClient.del(...keys);
            }
            return 0;
        }
        catch (error) {
            console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }
    async exists(key) {
        try {
            const result = await this.redisClient.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async expire(key, ttl) {
        try {
            await this.redisClient.expire(key, ttl);
        }
        catch (error) {
            console.error(`Cache expire error for key ${key}:`, error);
        }
    }
    async ttl(key) {
        try {
            return await this.redisClient.ttl(key);
        }
        catch (error) {
            console.error(`Cache ttl error for key ${key}:`, error);
            return -1;
        }
    }
    async incr(key, increment = 1) {
        try {
            return await this.redisClient.incrby(key, increment);
        }
        catch (error) {
            console.error(`Cache incr error for key ${key}:`, error);
            return 0;
        }
    }
    async decr(key, decrement = 1) {
        try {
            return await this.redisClient.decrby(key, decrement);
        }
        catch (error) {
            console.error(`Cache decr error for key ${key}:`, error);
            return 0;
        }
    }
    async getOrSet(key, factory, ttl = 3600) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const data = await factory();
            await this.set(key, data, ttl);
            return data;
        }
        catch (error) {
            console.error(`Cache getOrSet error for key ${key}:`, error);
            throw error;
        }
    }
    async mget(keys) {
        try {
            const values = await this.redisClient.mget(...keys);
            return values.map(value => value ? JSON.parse(value) : null);
        }
        catch (error) {
            console.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            const pipeline = this.redisClient.pipeline();
            for (const pair of keyValuePairs) {
                const serializedValue = JSON.stringify(pair.value);
                if (pair.ttl) {
                    pipeline.setex(pair.key, pair.ttl, serializedValue);
                }
                else {
                    pipeline.set(pair.key, serializedValue);
                }
            }
            await pipeline.exec();
        }
        catch (error) {
            console.error('Cache mset error:', error);
        }
    }
    generateKey(prefix, ...parts) {
        const normalizedParts = parts.map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'));
        return `${prefix}:${normalizedParts.join(':')}`;
    }
    async cleanupExpired(prefix, maxAge = 86400) {
        try {
            const keys = await this.redisClient.keys(`${prefix}:*`);
            let cleanedCount = 0;
            for (const key of keys) {
                const ttl = await this.ttl(key);
                if (ttl > maxAge) {
                    await this.del(key);
                    cleanedCount++;
                }
            }
            return cleanedCount;
        }
        catch (error) {
            console.error(`Cache cleanup error for prefix ${prefix}:`, error);
            return 0;
        }
    }
    async getStats() {
        try {
            const [keyCount, memoryUsage] = await Promise.all([
                this.redisClient.dbsize(),
                this.redisClient.info('memory')
            ]);
            const memoryMatch = memoryUsage.match(/used_memory_human:([^\r\n]+)/);
            const memoryUsageHuman = memoryMatch ? memoryMatch[1] : 'unknown';
            return {
                keyCount,
                memoryUsage: memoryUsageHuman,
                connected: true,
            };
        }
        catch (error) {
            console.error('Cache stats error:', error);
            return {
                keyCount: 0,
                memoryUsage: 'unknown',
                connected: false,
            };
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis])
], CacheService);
//# sourceMappingURL=cache.service.js.map