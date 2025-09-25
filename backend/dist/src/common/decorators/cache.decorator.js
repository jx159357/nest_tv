"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRefresh = exports.CacheEvict = exports.Cacheable = void 0;
const Cacheable = (options = {}) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheService = this.cacheService;
            const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
            const cached = await cacheService.get(cacheKey, options);
            if (cached !== null) {
                return cached;
            }
            const result = await originalMethod.apply(this, args);
            await cacheService.set(cacheKey, result, options);
            return result;
        };
    };
};
exports.Cacheable = Cacheable;
const CacheEvict = (options = {}) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheService = this.cacheService;
            const result = await originalMethod.apply(this, args);
            if (options.all) {
                const pattern = options.key || `${target.constructor.name}.${propertyKey}:*`;
                await cacheService.clearPattern(pattern, options);
            }
            else {
                const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
                await cacheService.delete(cacheKey, options);
            }
            return result;
        };
    };
};
exports.CacheEvict = CacheEvict;
const CacheRefresh = (options = {}) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheService = this.cacheService;
            const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
            const cached = await cacheService.get(cacheKey, options);
            if (cached !== null) {
                originalMethod
                    .apply(this, args)
                    .then(async (newResult) => {
                    await cacheService.set(cacheKey, newResult, options);
                })
                    .catch(error => {
                    console.error(`缓存刷新失败: ${cacheKey}`, error);
                });
                return cached;
            }
            const result = await originalMethod.apply(this, args);
            await cacheService.set(cacheKey, result, options);
            return result;
        };
    };
};
exports.CacheRefresh = CacheRefresh;
//# sourceMappingURL=cache.decorator.js.map