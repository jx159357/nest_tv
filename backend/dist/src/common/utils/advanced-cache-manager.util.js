"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdvancedCacheManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCacheManager = exports.CacheKeyStrategy = void 0;
const common_1 = require("@nestjs/common");
const zlib = __importStar(require("zlib"));
var CacheKeyStrategy;
(function (CacheKeyStrategy) {
    CacheKeyStrategy["TRENDING"] = "trending";
    CacheKeyStrategy["USER_RECOMMENDATIONS"] = "user_recommendations";
    CacheKeyStrategy["USER_PREFERENCES"] = "user_preferences";
    CacheKeyStrategy["SIMILAR_MEDIA"] = "similar_media";
    CacheKeyStrategy["SIMILAR_USERS"] = "similar_users";
    CacheKeyStrategy["COLLABORATIVE_MEDIA"] = "collaborative_media";
})(CacheKeyStrategy || (exports.CacheKeyStrategy = CacheKeyStrategy = {}));
let AdvancedCacheManager = AdvancedCacheManager_1 = class AdvancedCacheManager {
    cacheManager;
    logger = new common_1.Logger(AdvancedCacheManager_1.name);
    stats = new Map();
    defaultConfigs = {
        [CacheKeyStrategy.TRENDING]: {
            ttl: 15 * 60 * 1000,
            strategy: 'memory',
            compression: true,
            serialize: true,
        },
        [CacheKeyStrategy.USER_RECOMMENDATIONS]: {
            ttl: 10 * 60 * 1000,
            strategy: 'memory',
            compression: true,
            serialize: true,
        },
        [CacheKeyStrategy.USER_PREFERENCES]: {
            ttl: 30 * 60 * 1000,
            strategy: 'memory',
            compression: false,
            serialize: true,
        },
        [CacheKeyStrategy.SIMILAR_MEDIA]: {
            ttl: 5 * 60 * 1000,
            strategy: 'memory',
            compression: true,
            serialize: true,
        },
        [CacheKeyStrategy.SIMILAR_USERS]: {
            ttl: 10 * 60 * 1000,
            strategy: 'memory',
            compression: false,
            serialize: true,
        },
        [CacheKeyStrategy.COLLABORATIVE_MEDIA]: {
            ttl: 3 * 60 * 1000,
            strategy: 'memory',
            compression: true,
            serialize: true,
        },
    };
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    generateCacheKey(strategy, params = {}) {
        const paramStr = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('_');
        return `${strategy}_${paramStr}`;
    }
    async get(key, strategy) {
        const startTime = Date.now();
        try {
            let cached = await this.cacheManager.get(key);
            if (cached === null) {
                this.updateStats(key, false, false, false);
                return null;
            }
            const config = strategy ? this.defaultConfigs[strategy] : null;
            let isCompressed = false;
            let isSerialized = false;
            if (config?.compression && typeof cached === 'string') {
                try {
                    const decompressed = await this.decompressData(cached);
                    if (decompressed) {
                        cached = decompressed;
                        isCompressed = true;
                    }
                }
                catch (error) {
                    this.logger.debug(`解压缩失败: ${key}, 可能数据未被压缩`);
                }
            }
            if (config?.serialize && typeof cached === 'string') {
                try {
                    cached = JSON.parse(cached);
                    isSerialized = true;
                }
                catch (error) {
                    this.logger.debug(`反序列化失败: ${key}, 可能数据未被序列化`);
                }
            }
            this.updateStats(key, true, isCompressed, isSerialized);
            const duration = Date.now() - startTime;
            this.logger.debug(`缓存命中: ${key}, 解压缩: ${isCompressed}, 反序列化: ${isSerialized}, 耗时: ${duration}ms`);
            return cached;
        }
        catch (error) {
            this.logger.error(`缓存获取失败: ${key}`, error);
            this.updateStats(key, false, false, false);
            return null;
        }
    }
    async set(key, value, strategy, customTtl) {
        const startTime = Date.now();
        try {
            const config = this.defaultConfigs[strategy];
            const ttl = customTtl || config.ttl;
            let processedValue = value;
            let useCompression = config.compression;
            const useSerialization = config.serialize;
            if (useSerialization && typeof value !== 'string') {
                processedValue = JSON.stringify(value);
            }
            if (useCompression && typeof processedValue === 'string') {
                const compressed = await this.compressData(processedValue);
                if (compressed.length < processedValue.length) {
                    processedValue = compressed;
                }
                else {
                    useCompression = false;
                }
            }
            await this.cacheManager.set(key, processedValue, { ttl });
            this.updateStats(key, false, useCompression || false, useSerialization || false);
            const duration = Date.now() - startTime;
            this.logger.debug(`缓存设置: ${key}, TTL: ${ttl}ms, 压缩: ${useCompression}, 序列化: ${useSerialization}, 耗时: ${duration}ms`);
        }
        catch (error) {
            this.logger.error(`缓存设置失败: ${key}`, error);
        }
    }
    async getOrSet(strategy, params, factory, customTtl) {
        const key = this.generateCacheKey(strategy, params);
        const cached = await this.get(key, strategy);
        if (cached !== null) {
            return cached;
        }
        const startTime = Date.now();
        const data = await factory();
        const generationTime = Date.now() - startTime;
        const config = this.defaultConfigs[strategy];
        const ttl = this.calculateDynamicTTL(config.ttl, generationTime, customTtl);
        await this.set(key, data, strategy, ttl);
        this.logger.debug(`缓存未命中，生成新数据: ${key}, 生成耗时: ${generationTime}ms, TTL: ${ttl}ms`);
        return data;
    }
    async mget(keys) {
        const results = new Map();
        const promises = keys.map(async (key) => {
            const value = await this.get(key);
            if (value !== null) {
                results.set(key, value);
            }
        });
        await Promise.all(promises);
        return results;
    }
    async mset(entries) {
        const promises = entries.map(({ key, value, strategy }) => this.set(key, value, strategy));
        await Promise.all(promises);
    }
    async del(key) {
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`缓存删除: ${key}`);
        }
        catch (error) {
            this.logger.error(`缓存删除失败: ${key}`, error);
        }
    }
    async delPattern(pattern) {
        try {
            this.logger.warn(`按模式删除缓存: ${pattern} - 此操作可能不被支持`);
        }
        catch (error) {
            this.logger.error(`按模式删除缓存失败: ${pattern}`, error);
        }
    }
    async clear() {
        try {
            await this.cacheManager.store.reset();
            this.stats.clear();
            this.logger.debug('缓存已清空');
        }
        catch (error) {
            this.logger.error('清空缓存失败', error);
        }
    }
    getStats() {
        let totalHits = 0;
        let totalMisses = 0;
        let compressedKeys = 0;
        let serializedKeys = 0;
        for (const { hits, misses, compressed, serialized } of this.stats.values()) {
            totalHits += hits;
            totalMisses += misses;
            if (compressed)
                compressedKeys++;
            if (serialized)
                serializedKeys++;
        }
        const totalRequests = totalHits + totalMisses;
        const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
        return {
            hits: totalHits,
            misses: totalMisses,
            hitRate,
            totalKeys: this.stats.size,
            memoryUsage: process.memoryUsage().heapUsed,
            compressedKeys,
            serializedKeys,
        };
    }
    getKeyStats(key) {
        const stats = this.stats.get(key) || { hits: 0, misses: 0 };
        const total = stats.hits + stats.misses;
        const hitRate = total > 0 ? stats.hits / total : 0;
        return {
            hits: stats.hits,
            misses: stats.misses,
            hitRate,
        };
    }
    async warmUp(strategy, paramsList, factory) {
        this.logger.log(`开始预热缓存: ${strategy}, 参数数量: ${paramsList.length}`);
        const promises = paramsList.map(async (params) => {
            const key = this.generateCacheKey(strategy, params);
            const existing = await this.get(key, strategy);
            if (existing === null) {
                try {
                    const data = await factory(params);
                    await this.set(key, data, strategy);
                }
                catch (error) {
                    this.logger.error(`预热缓存失败: ${key}`, error);
                }
            }
        });
        await Promise.all(promises);
        this.logger.log(`缓存预热完成: ${strategy}`);
    }
    async healthCheck() {
        try {
            const testKey = 'health_check_test';
            const testValue = Date.now().toString();
            await this.cacheManager.set(testKey, testValue, { ttl: 5000 });
            const retrieved = await this.cacheManager.get(testKey);
            if (retrieved === testValue) {
                await this.cacheManager.del(testKey);
                return { status: 'healthy' };
            }
            return { status: 'unhealthy', message: '缓存数据不匹配' };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `缓存健康检查失败: ${error.message}`,
            };
        }
    }
    updateStats(key, isHit, isCompressed, isSerialized) {
        const stats = this.stats.get(key) || {
            hits: 0,
            misses: 0,
            compressed: false,
            serialized: false,
        };
        if (isHit) {
            stats.hits++;
        }
        else {
            stats.misses++;
        }
        stats.compressed = isCompressed;
        stats.serialized = isSerialized;
        this.stats.set(key, stats);
    }
    async compressData(data) {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, (error, compressed) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(compressed.toString('base64'));
                }
            });
        });
    }
    async decompressData(compressedData) {
        return new Promise((resolve, reject) => {
            try {
                const buffer = Buffer.from(compressedData, 'base64');
                zlib.gunzip(buffer, (error, decompressed) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(decompressed.toString());
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    calculateDynamicTTL(baseTTL, generationTime, customTtl) {
        if (customTtl) {
            return customTtl;
        }
        if (generationTime > 5000) {
            return baseTTL * 2;
        }
        if (generationTime < 1000) {
            return baseTTL * 0.5;
        }
        return baseTTL;
    }
};
exports.AdvancedCacheManager = AdvancedCacheManager;
exports.AdvancedCacheManager = AdvancedCacheManager = AdvancedCacheManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], AdvancedCacheManager);
//# sourceMappingURL=advanced-cache-manager.util.js.map