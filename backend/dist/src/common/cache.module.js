"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_INVALIDATE = exports.CACHE_TTL = exports.CACHE_KEY = exports.CacheInvalidate = exports.CacheTTL = exports.CacheKey = exports.CacheInterceptor = exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const cache_service_1 = require("./services/cache.service");
const media_cache_service_1 = require("./services/media-cache.service");
const cache_interceptor_1 = require("./interceptors/cache.interceptor");
Object.defineProperty(exports, "CacheInterceptor", { enumerable: true, get: function () { return cache_interceptor_1.CacheInterceptor; } });
Object.defineProperty(exports, "CACHE_KEY", { enumerable: true, get: function () { return cache_interceptor_1.CACHE_KEY; } });
Object.defineProperty(exports, "CACHE_TTL", { enumerable: true, get: function () { return cache_interceptor_1.CACHE_TTL; } });
Object.defineProperty(exports, "CACHE_INVALIDATE", { enumerable: true, get: function () { return cache_interceptor_1.CACHE_INVALIDATE; } });
Object.defineProperty(exports, "CacheKey", { enumerable: true, get: function () { return cache_interceptor_1.CacheKey; } });
Object.defineProperty(exports, "CacheTTL", { enumerable: true, get: function () { return cache_interceptor_1.CacheTTL; } });
Object.defineProperty(exports, "CacheInvalidate", { enumerable: true, get: function () { return cache_interceptor_1.CacheInvalidate; } });
let CacheModule = CacheModule_1 = class CacheModule {
    static createRedisProvider(options) {
        return {
            provide: 'REDIS_CLIENT',
            useFactory: async () => {
                const redis = new ioredis_1.Redis(options.redisUrl, options.redisOptions);
                redis.on('error', (error) => {
                    console.error('Redis connection error:', error);
                });
                redis.on('connect', () => {
                    console.log('Redis connected successfully');
                });
                return redis;
            },
        };
    }
    static forRoot(options) {
        const providers = [
            this.createRedisProvider(options),
            cache_service_1.CacheService,
            media_cache_service_1.MediaCacheService,
        ];
        return {
            module: CacheModule_1,
            providers,
            exports: [cache_service_1.CacheService, media_cache_service_1.MediaCacheService],
            global: options.global ?? false,
        };
    }
    static forFeature() {
        return {
            module: CacheModule_1,
            providers: [media_cache_service_1.MediaCacheService],
            exports: [media_cache_service_1.MediaCacheService],
        };
    }
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = CacheModule_1 = __decorate([
    (0, common_1.Module)({
        providers: [cache_service_1.CacheService, media_cache_service_1.MediaCacheService],
        exports: [cache_service_1.CacheService, media_cache_service_1.MediaCacheService],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map