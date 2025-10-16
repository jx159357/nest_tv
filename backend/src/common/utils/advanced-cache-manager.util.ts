import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';

// 简化的缓存接口，避免依赖 cache-manager
interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  del(key: string): Promise<void>;
  store: { reset(): Promise<void> };
}

/**
 * 缓存键生成策略
 */
export enum CacheKeyStrategy {
  TRENDING = 'trending',
  USER_RECOMMENDATIONS = 'user_recommendations',
  USER_PREFERENCES = 'user_preferences',
  SIMILAR_MEDIA = 'similar_media',
  SIMILAR_USERS = 'similar_users',
  COLLABORATIVE_MEDIA = 'collaborative_media',
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  ttl: number; // 缓存时间（毫秒）
  strategy: 'memory' | 'redis' | 'hybrid';
  compression?: boolean;
  serialize?: boolean;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  compressedKeys: number;
  serializedKeys: number;
}

/**
 * 高级缓存管理器
 * 提供智能缓存策略和性能监控
 */
@Injectable()
export class AdvancedCacheManager {
  private readonly logger = new Logger(AdvancedCacheManager.name);
  private stats: Map<
    string,
    { hits: number; misses: number; compressed: boolean; serialized: boolean }
  > = new Map();

  // 默认缓存配置
  private readonly defaultConfigs: Record<CacheKeyStrategy, CacheConfig> = {
    [CacheKeyStrategy.TRENDING]: {
      ttl: 15 * 60 * 1000, // 15分钟
      strategy: 'memory',
      compression: true,
      serialize: true,
    },
    [CacheKeyStrategy.USER_RECOMMENDATIONS]: {
      ttl: 10 * 60 * 1000, // 10分钟
      strategy: 'memory',
      compression: true,
      serialize: true,
    },
    [CacheKeyStrategy.USER_PREFERENCES]: {
      ttl: 30 * 60 * 1000, // 30分钟
      strategy: 'memory',
      compression: false,
      serialize: true,
    },
    [CacheKeyStrategy.SIMILAR_MEDIA]: {
      ttl: 5 * 60 * 1000, // 5分钟
      strategy: 'memory',
      compression: true,
      serialize: true,
    },
    [CacheKeyStrategy.SIMILAR_USERS]: {
      ttl: 10 * 60 * 1000, // 10分钟
      strategy: 'memory',
      compression: false,
      serialize: true,
    },
    [CacheKeyStrategy.COLLABORATIVE_MEDIA]: {
      ttl: 3 * 60 * 1000, // 3分钟
      strategy: 'memory',
      compression: true,
      serialize: true,
    },
  };

  constructor(private readonly cacheManager: CacheManager) {}

  /**
   * 生成缓存键
   */
  generateCacheKey(strategy: CacheKeyStrategy, params: Record<string, any> = {}): string {
    const paramStr = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('_');

    return `${strategy}_${paramStr}`;
  }

  /**
   * 获取缓存数据（带统计）
   */
  async get<T>(key: string, strategy?: CacheKeyStrategy): Promise<T | null> {
    const startTime = Date.now();

    try {
      let cached = await this.cacheManager.get<any>(key);

      if (cached === null) {
        this.updateStats(key, false, false, false);
        return null;
      }

      // 获取配置以确定是否需要解压缩和反序列化
      const config = strategy ? this.defaultConfigs[strategy] : null;
      let isCompressed = false;
      let isSerialized = false;

      // 尝试解压缩
      if (config?.compression && typeof cached === 'string') {
        try {
          const decompressed = await this.decompressData(cached);
          if (decompressed) {
            cached = decompressed;
            isCompressed = true;
          }
        } catch (error) {
          this.logger.debug(`解压缩失败: ${key}, 可能数据未被压缩`);
        }
      }

      // 尝试反序列化
      if (config?.serialize && typeof cached === 'string') {
        try {
          cached = JSON.parse(cached);
          isSerialized = true;
        } catch (error) {
          this.logger.debug(`反序列化失败: ${key}, 可能数据未被序列化`);
        }
      }

      // 更新统计
      this.updateStats(key, true, isCompressed, isSerialized);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `缓存命中: ${key}, 解压缩: ${isCompressed}, 反序列化: ${isSerialized}, 耗时: ${duration}ms`,
      );

      return cached as T;
    } catch (error) {
      this.logger.error(`缓存获取失败: ${key}`, error);
      this.updateStats(key, false, false, false);
      return null;
    }
  }

  /**
   * 设置缓存数据（带智能TTL）
   */
  async set<T>(
    key: string,
    value: T,
    strategy: CacheKeyStrategy,
    customTtl?: number,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const config = this.defaultConfigs[strategy];
      const ttl = customTtl || config.ttl;

      // 处理压缩和序列化
      let processedValue: any = value;
      let useCompression = config.compression;
      const useSerialization = config.serialize;

      // 序列化处理
      if (useSerialization && typeof value !== 'string') {
        processedValue = JSON.stringify(value);
      }

      // 压缩处理（仅对字符串数据进行压缩）
      if (useCompression && typeof processedValue === 'string') {
        const compressed = await this.compressData(processedValue);
        if (compressed.length < processedValue.length) {
          processedValue = compressed;
        } else {
          useCompression = false; // 压缩后没有变小，就不压缩
        }
      }

      await this.cacheManager.set(key, processedValue, { ttl });

      // 更新统计信息
      this.updateStats(key, false, useCompression || false, useSerialization || false);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `缓存设置: ${key}, TTL: ${ttl}ms, 压缩: ${useCompression}, 序列化: ${useSerialization}, 耗时: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`缓存设置失败: ${key}`, error);
    }
  }

  /**
   * 智能缓存获取模式
   * 如果缓存不存在，则使用工厂函数生成并缓存
   */
  async getOrSet<T>(
    strategy: CacheKeyStrategy,
    params: Record<string, any>,
    factory: () => Promise<T>,
    customTtl?: number,
  ): Promise<T> {
    const key = this.generateCacheKey(strategy, params);

    // 尝试从缓存获取
    const cached = await this.get<T>(key, strategy);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，生成数据
    const startTime = Date.now();
    const data = await factory();
    const generationTime = Date.now() - startTime;

    // 根据生成时间动态调整TTL
    const config = this.defaultConfigs[strategy];
    const ttl = this.calculateDynamicTTL(config.ttl, generationTime, customTtl);

    // 缓存结果
    await this.set(key, data, strategy, ttl);

    this.logger.debug(
      `缓存未命中，生成新数据: ${key}, 生成耗时: ${generationTime}ms, TTL: ${ttl}ms`,
    );

    return data;
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    const promises = keys.map(async key => {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 批量设置缓存
   */
  async mset<T>(
    entries: Array<{ key: string; value: T; strategy: CacheKeyStrategy }>,
  ): Promise<void> {
    const promises = entries.map(({ key, value, strategy }) => this.set(key, value, strategy));

    await Promise.all(promises);
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`缓存删除: ${key}`);
    } catch (error) {
      this.logger.error(`缓存删除失败: ${key}`, error);
    }
  }

  /**
   * 按模式删除缓存
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // 注意：这不是所有缓存存储都支持的操作
      // 在生产环境中，可能需要实现特定的清理逻辑
      this.logger.warn(`按模式删除缓存: ${pattern} - 此操作可能不被支持`);
    } catch (error) {
      this.logger.error(`按模式删除缓存失败: ${pattern}`, error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.store.reset();
      this.stats.clear();
      this.logger.debug('缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    let totalHits = 0;
    let totalMisses = 0;
    let compressedKeys = 0;
    let serializedKeys = 0;

    for (const { hits, misses, compressed, serialized } of this.stats.values()) {
      totalHits += hits;
      totalMisses += misses;
      if (compressed) compressedKeys++;
      if (serialized) serializedKeys++;
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

  /**
   * 获取特定键的统计信息
   */
  getKeyStats(key: string): { hits: number; misses: number; hitRate: number } {
    const stats = this.stats.get(key) || { hits: 0, misses: 0 };
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? stats.hits / total : 0;

    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate,
    };
  }

  /**
   * 预热缓存
   */
  async warmUp(
    strategy: CacheKeyStrategy,
    paramsList: Record<string, any>[],
    factory: (params: Record<string, any>) => Promise<any>,
  ): Promise<void> {
    this.logger.log(`开始预热缓存: ${strategy}, 参数数量: ${paramsList.length}`);

    const promises = paramsList.map(async params => {
      const key = this.generateCacheKey(strategy, params);
      const existing = await this.get(key, strategy);

      if (existing === null) {
        try {
          const data = await factory(params);
          await this.set(key, data, strategy);
        } catch (error) {
          this.logger.error(`预热缓存失败: ${key}`, error);
        }
      }
    });

    await Promise.all(promises);
    this.logger.log(`缓存预热完成: ${strategy}`);
  }

  /**
   * 缓存健康检查
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await this.cacheManager.set(testKey, testValue, { ttl: 5000 });
      const retrieved = await this.cacheManager.get<string>(testKey);

      if (retrieved === testValue) {
        await this.cacheManager.del(testKey);
        return { status: 'healthy' };
      }

      return { status: 'unhealthy', message: '缓存数据不匹配' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `缓存健康检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(
    key: string,
    isHit: boolean,
    isCompressed: boolean,
    isSerialized: boolean,
  ): void {
    const stats = this.stats.get(key) || {
      hits: 0,
      misses: 0,
      compressed: false,
      serialized: false,
    };

    if (isHit) {
      stats.hits++;
    } else {
      stats.misses++;
    }

    stats.compressed = isCompressed;
    stats.serialized = isSerialized;

    this.stats.set(key, stats);
  }

  /**
   * 压缩数据
   */
  private async compressData(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (error, compressed) => {
        if (error) {
          reject(error);
        } else {
          resolve(compressed.toString('base64'));
        }
      });
    });
  }

  /**
   * 解压缩数据
   */
  private async decompressData(compressedData: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const buffer = Buffer.from(compressedData, 'base64');
        zlib.gunzip(buffer, (error, decompressed) => {
          if (error) {
            reject(error);
          } else {
            resolve(decompressed.toString());
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 计算动态TTL
   * 根据数据生成时间和重要性调整缓存时间
   */
  private calculateDynamicTTL(baseTTL: number, generationTime: number, customTtl?: number): number {
    if (customTtl) {
      return customTtl;
    }

    // 如果生成时间很长，延长缓存时间
    if (generationTime > 5000) {
      // 超过5秒
      return baseTTL * 2;
    }

    // 如果生成时间很短，缩短缓存时间
    if (generationTime < 1000) {
      // 不到1秒
      return baseTTL * 0.5;
    }

    return baseTTL;
  }
}
