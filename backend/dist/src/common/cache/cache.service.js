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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let CacheService = CacheService_1 = class CacheService {
    redis;
    logger = new common_1.Logger(CacheService_1.name);
    defaultPrefix = 'nest_tv:';
    defaultTtl = 1800;
    constructor(redis) {
        this.redis = redis;
        this.logger.log('缓存服务初始化');
    }
    async set(key, value, options = {}) {
        const { ttl = this.defaultTtl, prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.set(fullKey, serializedValue, 'EX', ttl);
            this.logger.debug(`缓存设置成功: ${fullKey}`);
        }
        catch (error) {
            this.logger.error(`缓存设置失败: ${fullKey}`, error);
            throw error;
        }
    }
    async get(key, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            const value = await this.redis.get(fullKey);
            if (value === null || value === undefined) {
                this.logger.debug(`缓存未命中: ${fullKey}`);
                return null;
            }
            const parsedValue = JSON.parse(value);
            this.logger.debug(`缓存命中: ${fullKey}`);
            return parsedValue;
        }
        catch (error) {
            this.logger.error(`缓存获取失败: ${fullKey}`, error);
            return null;
        }
    }
    async delete(key, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            await this.redis.del(fullKey);
            this.logger.debug(`缓存删除成功: ${fullKey}`);
        }
        catch (error) {
            this.logger.error(`缓存删除失败: ${fullKey}`, error);
            throw error;
        }
    }
    async clearPattern(pattern, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullPattern = `${prefix}${pattern}`;
        try {
            const keys = await this.redis.keys(fullPattern);
            if (keys.length === 0) {
                this.logger.debug(`未找到匹配的缓存: ${fullPattern}`);
                return 0;
            }
            const deleted = await this.redis.del(...keys);
            this.logger.log(`清除缓存: ${fullPattern}, 删除了 ${deleted} 个键`);
            return deleted;
        }
        catch (error) {
            this.logger.error(`清除缓存失败: ${fullPattern}`, error);
            throw error;
        }
    }
    async exists(key, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            const result = await this.redis.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`检查缓存存在性失败: ${fullKey}`, error);
            return false;
        }
    }
    async expire(key, ttl, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            await this.redis.expire(fullKey, ttl);
            this.logger.debug(`缓存过期时间设置成功: ${fullKey}, TTL: ${ttl}s`);
        }
        catch (error) {
            this.logger.error(`设置缓存过期时间失败: ${fullKey}`, error);
            throw error;
        }
    }
    async ttl(key, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKey = `${prefix}${key}`;
        try {
            const timeToLive = await this.redis.ttl(fullKey);
            return timeToLive;
        }
        catch (error) {
            this.logger.error(`获取缓存TTL失败: ${fullKey}`, error);
            return -1;
        }
    }
    async mset(data, options = {}) {
        const { ttl = this.defaultTtl, prefix = this.defaultPrefix } = options;
        const pipeline = this.redis.pipeline();
        try {
            for (const [key, value] of Object.entries(data)) {
                const fullKey = `${prefix}${key}`;
                const serializedValue = JSON.stringify(value);
                pipeline.set(fullKey, serializedValue);
                if (ttl > 0) {
                    pipeline.expire(fullKey, ttl);
                }
            }
            await pipeline.exec();
            this.logger.debug(`批量设置缓存成功，数量: ${Object.keys(data).length}`);
        }
        catch (error) {
            this.logger.error(`批量设置缓存失败`, error);
            throw error;
        }
    }
    async mget(keys, options = {}) {
        const { prefix = this.defaultPrefix } = options;
        const fullKeys = keys.map(key => `${prefix}${key}`);
        try {
            const values = await this.redis.mget(fullKeys);
            return values.map(value => value === null || value === undefined ? null : JSON.parse(value));
        }
        catch (error) {
            this.logger.error(`批量获取缓存失败`, error);
            return keys.map(() => null);
        }
    }
    async getStats() {
        try {
            const info = await this.redis.info();
            const lines = info.split('\r\n');
            const stats = {};
            for (const line of lines) {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key.trim()] = value.trim();
                }
            }
            return stats;
        }
        catch (error) {
            this.logger.error('获取Redis统计信息失败', error);
            return {};
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], CacheService);
//# sourceMappingURL=cache.service.js.map