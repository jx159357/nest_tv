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
exports.CacheInterceptor = exports.CacheInvalidate = exports.CacheTTL = exports.CacheKey = exports.CACHE_INVALIDATE = exports.CACHE_TTL = exports.CACHE_KEY = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const core_1 = require("@nestjs/core");
const cache_service_1 = require("../services/cache.service");
exports.CACHE_KEY = 'CACHE_KEY';
exports.CACHE_TTL = 'CACHE_TTL';
exports.CACHE_INVALIDATE = 'CACHE_INVALIDATE';
const CacheKey = (key) => (target, key, descriptor) => {
    Reflect.defineMetadata(exports.CACHE_KEY, key, descriptor.value);
};
exports.CacheKey = CacheKey;
const CacheTTL = (ttl) => (target, key, descriptor) => {
    Reflect.defineMetadata(exports.CACHE_TTL, ttl, descriptor.value);
};
exports.CacheTTL = CacheTTL;
const CacheInvalidate = (pattern) => (target, key, descriptor) => {
    Reflect.defineMetadata(exports.CACHE_INVALIDATE, pattern, descriptor.value);
};
exports.CacheInvalidate = CacheInvalidate;
let CacheInterceptor = class CacheInterceptor {
    cacheService;
    reflector;
    constructor(cacheService, reflector) {
        this.cacheService = cacheService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') {
            return next.handle();
        }
        const cacheKey = this.reflector.get(exports.CACHE_KEY, context.getHandler());
        const cacheTTL = this.reflector.get(exports.CACHE_TTL, context.getHandler());
        const invalidatePattern = this.reflector.get(exports.CACHE_INVALIDATE, context.getHandler());
        if (invalidatePattern) {
            return next.handle().pipe((0, operators_1.tap)(() => {
                this.cacheService.delPattern(invalidatePattern);
            }));
        }
        if (!cacheKey) {
            return next.handle();
        }
        const fullCacheKey = this.generateCacheKey(cacheKey, request);
        return (0, rxjs_1.from)(this.cacheService.get(fullCacheKey)).pipe((0, operators_1.switchMap)(cached => {
            if (cached) {
                return (0, rxjs_1.of)(cached);
            }
            return next.handle().pipe((0, operators_1.map)(data => {
                const ttl = cacheTTL || 3600;
                this.cacheService.set(fullCacheKey, data, ttl);
                return data;
            }));
        }));
    }
    generateCacheKey(baseKey, request) {
        const params = this.extractRequestParams(request);
        const paramsString = Object.keys(params).length
            ? `:${Buffer.from(JSON.stringify(params)).toString('base64')}`
            : '';
        return `${baseKey}${paramsString}`;
    }
    extractRequestParams(request) {
        const params = {};
        if (request.params) {
            Object.assign(params, request.params);
        }
        if (request.query) {
            Object.assign(params, request.query);
        }
        if (request.user && request.user.id) {
            params.userId = request.user.id;
        }
        return params;
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        core_1.Reflector])
], CacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map