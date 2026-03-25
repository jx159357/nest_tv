import { CacheService } from '../cache/cache.service';
import { CacheableOptions, CacheEvictOptions } from '../cache/cache.service';

interface CacheEnabledInstance {
  cacheService: CacheService;
  constructor: {
    name: string;
  };
}

type AsyncMethod = (...args: unknown[]) => Promise<unknown>;

/**
 * 缓存装饰器 - 方法结果缓存
 */
export const Cacheable = (options: CacheableOptions = {}) => {
  return (_target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as AsyncMethod | undefined;
    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (
      this: CacheEnabledInstance,
      ...args: unknown[]
    ): Promise<unknown> {
      const cacheService = this.cacheService;

      // 简化的缓存键生成
      const cacheKey = options.key || `${this.constructor.name}.${propertyKey}`;

      // 尝试从缓存获取
      const cached: unknown = await cacheService.get<unknown>(cacheKey, options);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const boundMethod = originalMethod.bind(this) as (
        ...methodArgs: unknown[]
      ) => Promise<unknown>;
      const result: unknown = await boundMethod(...args);

      // 设置缓存
      await cacheService.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
};

/**
 * 缓存清除装饰器 - 方法执行后清除缓存
 */
export const CacheEvict = (options: CacheEvictOptions = {}) => {
  return (_target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as AsyncMethod | undefined;
    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (
      this: CacheEnabledInstance,
      ...args: unknown[]
    ): Promise<unknown> {
      const cacheService = this.cacheService;

      // 执行原方法
      const boundMethod = originalMethod.bind(this) as (
        ...methodArgs: unknown[]
      ) => Promise<unknown>;
      const result: unknown = await boundMethod(...args);

      // 清除缓存
      if (options.all) {
        // 简化的模式清除
        const pattern = options.key || `${this.constructor.name}.${propertyKey}:*`;
        await cacheService.clearPattern(pattern, options);
      } else {
        // 清除特定缓存
        const cacheKey = options.key || `${this.constructor.name}.${propertyKey}`;
        await cacheService.delete(cacheKey, options);
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * 缓存装饰器 - 自动管理缓存生命周期
 */
export const CacheRefresh = (options: CacheableOptions = {}) => {
  return (_target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as AsyncMethod | undefined;
    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (
      this: CacheEnabledInstance,
      ...args: unknown[]
    ): Promise<unknown> {
      const cacheService = this.cacheService;

      // 简化的缓存键生成
      const cacheKey = options.key || `${this.constructor.name}.${propertyKey}`;

      // 尝试从缓存获取
      const cached: unknown = await cacheService.get<unknown>(cacheKey, options);
      if (cached !== null) {
        // 异步刷新缓存（不阻塞请求）
        const boundMethod = originalMethod.bind(this) as (
          ...methodArgs: unknown[]
        ) => Promise<unknown>;
        const refreshPromise: Promise<unknown> = boundMethod(...args);
        void refreshPromise
          .then(async (newResult: unknown) => {
            await cacheService.set(cacheKey, newResult, options);
          })
          .catch((error: unknown) => {
            console.error(`缓存刷新失败: ${cacheKey}`, error);
          });
        return cached;
      }

      // 缓存不存在，正常执行
      const boundMethod = originalMethod.bind(this) as (
        ...methodArgs: unknown[]
      ) => Promise<unknown>;
      const result: unknown = await boundMethod(...args);
      await cacheService.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
};
