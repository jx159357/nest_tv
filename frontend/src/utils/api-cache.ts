import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CacheConfig {
  ttl?: number; // 默认5分钟
  key?: string; // 自定义缓存key
  forceRefresh?: boolean; // 强制刷新
  enabled?: boolean; // 是否启用缓存，默认true
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * API缓存工具类
 */
class APICacheManager {
  private cache = new Map<string, CacheItem>();
  private maxSize = 1000; // 最大缓存条目数
  private cleanupInterval: number | null = null;

  constructor() {
    // 定期清理过期缓存
    this.startCleanup();
  }

  /**
   * 生成缓存key
   */
  private generateKey(config: AxiosRequestConfig): string {
    const { url, method, params, data } = config;
    const normalizedUrl = url.replace(/\/$/, ''); // 移除尾部斜杠

    // 基于URL、方法、参数和数据生成唯一key
    const keyObj = {
      url: normalizedUrl,
      method: method?.toLowerCase() || 'get',
      params: params ? JSON.stringify(params) : '',
      data: data ? JSON.stringify(data) : '',
    };

    return btoa(JSON.stringify(keyObj));
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(item: CacheItem): boolean {
    const now = Date.now();
    return now - item.timestamp < item.ttl;
  }

  /**
   * 获取缓存数据
   */
  private getCache<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || !this.isCacheValid(item)) {
      return null;
    }
    return item.data;
  }

  /**
   * 设置缓存数据
   */
  private setCache<T = any>(key: string, data: T, ttl: number): void {
    // 清理过期的缓存
    this.cleanupExpired();

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    });
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp >= item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 中断请求处理
   */
  private async handleRequest<T = any>(
    config: AxiosRequestConfig,
    cacheKey: string,
    cacheConfig: CacheConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      const response = await axios(config);

      // 缓存成功的响应
      if (response.status >= 200 && response.status < 300) {
        const ttl = cacheConfig.ttl || 300000; // 默认5分钟
        this.setCache(cacheKey, response.data, ttl);
      }

      return response;
    } catch (error) {
      // 对于某些错误，可以返回缓存的旧数据
      if (error.response?.status === 503 || error.response?.status === 504) {
        const cachedData = this.getCache(cacheKey);
        if (cachedData) {
          // 返回缓存的旧数据，并标记为过期数据
          return {
            ...error.response,
            data: cachedData,
            status: 200,
            cached: true,
            cachedAt: this.cache.get(cacheKey)?.timestamp,
          };
        }
      }

      throw error;
    }
  }

  /**
   * 请求拦截器
   */
  public async requestInterceptor(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    // 只缓存GET请求，除非显式配置
    if (config.method?.toLowerCase() !== 'get' && !config.cacheConfig?.enabled) {
      return config;
    }

    const cacheConfig = config.cacheConfig || {};
    if (cacheConfig.enabled === false) {
      return config;
    }

    if (cacheConfig.forceRefresh) {
      return config;
    }

    const key = cacheConfig.key || this.generateKey(config);
    const cachedData = this.getCache(key);

    if (cachedData) {
      // 如果有缓存数据，直接返回，不发送网络请求
      throw axios.Cancel('Cache hit');
    }

    return config;
  }

  /**
   * 响应拦截器
   */
  public async responseInterceptor(error: any): Promise<any> {
    if (!axios.isCancel(error)) {
      throw error;
    }

    // 如果是缓存命中，构造响应对象
    const config = error.config;
    const cacheConfig = config.cacheConfig || {};
    const key = cacheConfig.key || this.generateKey(config);
    const cachedData = this.getCache(key);

    if (cachedData) {
      return {
        data: cachedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        cached: true,
        cachedAt: this.cache.get(key)?.timestamp,
      };
    }

    throw error;
  }

  /**
   * 清理指定key的缓存
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 清理指定URL模式的缓存
   */
  public clearCacheByPattern(pattern: string | RegExp): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 获取缓存统计
   */
  public getStats(): Object {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let totalSize = 0;

    this.cache.forEach((item, key) => {
      totalSize += JSON.stringify(item).length;
      if (this.isCacheValid(item)) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      hitRate: validCount / (this.cache.size || 1),
      size: totalSize,
    };
  }

  /**
   * 预加载缓存
   */
  public async preload(urls: string[], ttl: number = 300000): Promise<void> {
    const preloadPromises = urls.map(url => {
      return axios
        .get(url, { cacheConfig: { ttl } })
        .then(() => console.log(`预加载成功: ${url}`))
        .catch(() => console.log(`预加载失败: ${url}`));
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * 销毁清理
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// 创建全局缓存管理器实例
export const apiCacheManager = new APICacheManager();

/**
 * 为axios实例添加缓存拦截器
 */
export const setupCacheInterceptors = (instance: typeof axios): void => {
  // 请求拦截器
  instance.interceptors.request.use(
    async config => {
      try {
        return await apiCacheManager.requestInterceptor(config);
      } catch (error) {
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        return config;
      }
    },
    error => Promise.reject(error),
  );

  // 响应拦截器
  instance.interceptors.response.use(
    response => response,
    async error => {
      try {
        return await apiCacheManager.responseInterceptor(error);
      } catch (responseError) {
        return Promise.reject(responseError);
      }
    },
  );
};

/**
 * 缓存配置工具函数
 */
export const withCache = (
  config: AxiosRequestConfig,
  cacheConfig?: CacheConfig,
): AxiosRequestConfig => {
  return {
    ...config,
    cacheConfig: {
      ttl: 300000, // 默认5分钟
      enabled: true,
      ...cacheConfig,
    },
  };
};

/**
 * 强制刷新缓存
 */
export const forceRefresh = (
  config: AxiosRequestConfig,
  cacheConfig?: Omit<CacheConfig, 'forceRefresh'>,
): AxiosRequestConfig => {
  return withCache(config, {
    ...cacheConfig,
    forceRefresh: true,
  });
};

export default apiCacheManager;
