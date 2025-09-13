import { CacheService } from '../cache/cache.service';
import { CacheableOptions, CacheEvictOptions } from '../cache/cache.service';

/**
 * 缓存装饰器 - 方法结果缓存
 */
export const Cacheable = (options: CacheableOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      
      // 简化的缓存键生成
      const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
      
      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey, options);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 设置缓存
      await cacheService.set(cacheKey, result, options);

      return result;
    };
  };
};

/**
 * 缓存清除装饰器 - 方法执行后清除缓存
 */
export const CacheEvict = (options: CacheEvictOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 清除缓存
      if (options.all) {
        // 简化的模式清除
        const pattern = options.key || `${target.constructor.name}.${propertyKey}:*`;
        await cacheService.clearPattern(pattern, options);
      } else {
        // 清除特定缓存
        const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
        await cacheService.delete(cacheKey, options);
      }

      return result;
    };
  };
};

/**
 * 缓存装饰器 - 自动管理缓存生命周期
 */
export const CacheRefresh = (options: CacheableOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      
      // 简化的缓存键生成
      const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;

      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey, options);
      if (cached !== null) {
        // 异步刷新缓存（不阻塞请求）
        originalMethod.apply(this, args).then(async (newResult) => {
          await cacheService.set(cacheKey, newResult, options);
        }).catch(error => {
          console.error(`缓存刷新失败: ${cacheKey}`, error);
        });
        return cached;
      }

      // 缓存不存在，正常执行
      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, options);

      return result;
    };
  };
};