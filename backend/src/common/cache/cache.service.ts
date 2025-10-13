import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryCacheItem<T> {
  value: T;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export const REDIS_CLIENT = 'REDIS_CLIENT';

export interface CacheOptions {
  ttl?: number; // 缓存时间（秒）
  key?: string; // 自定义缓存键
  prefix?: string; // 键前缀
}

export interface CacheableOptions extends CacheOptions {
  key?: string; // 支持静态键
}

export interface CacheEvictOptions extends CacheOptions {
  all?: boolean; // 是否清除所有匹配的缓存
}

export interface MultiCacheOptions extends CacheOptions {
  useMemoryCache?: boolean; // 是否使用内存缓存
  useRedisCache?: boolean; // 是否使用Redis缓存
  memoryTtl?: number; // 内存缓存TTL（秒）
  priority?: 'high' | 'medium' | 'low'; // 缓存优先级
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultPrefix = 'nest_tv:';
  private readonly defaultTtl = 1800; // 30分钟

  // 内存缓存层
  private memoryCache = new Map<string, MemoryCacheItem<any>>();
  private readonly defaultMemoryTtl = 300; // 5分钟内存缓存

  // 缓存统计
  private stats = {
    hits: 0,
    misses: 0,
    memoryHits: 0,
    redisHits: 0,
    errors: 0,
  };

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('多层缓存服务初始化');
    this.startMemoryCacheCleanup();
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = this.defaultTtl, prefix = this.defaultPrefix } = options;
    const fullKey = `${prefix}${key}`;

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.set(fullKey, serializedValue, 'EX', ttl);
      this.logger.debug(`缓存设置成功: ${fullKey}`);
    } catch (error) {
      this.logger.error(`缓存设置失败: ${fullKey}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
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
    } catch (error) {
      this.logger.error(`缓存获取失败: ${fullKey}`, error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const { prefix = this.defaultPrefix } = options;
    const fullKey = `${prefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.logger.debug(`缓存删除成功: ${fullKey}`);
    } catch (error) {
      this.logger.error(`缓存删除失败: ${fullKey}`, error);
      throw error;
    }
  }

  /**
   * 清除模式匹配的缓存
   */
  async clearPattern(pattern: string, options: CacheOptions = {}): Promise<number> {
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
    } catch (error) {
      this.logger.error(`清除缓存失败: ${fullPattern}`, error);
      throw error;
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const { prefix = this.defaultPrefix } = options;
    const fullKey = `${prefix}${key}`;

    try {
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`检查缓存存在性失败: ${fullKey}`, error);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<void> {
    const { prefix = this.defaultPrefix } = options;
    const fullKey = `${prefix}${key}`;

    try {
      await this.redis.expire(fullKey, ttl);
      this.logger.debug(`缓存过期时间设置成功: ${fullKey}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`设置缓存过期时间失败: ${fullKey}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存剩余时间
   */
  async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    const { prefix = this.defaultPrefix } = options;
    const fullKey = `${prefix}${key}`;

    try {
      const timeToLive = await this.redis.ttl(fullKey);
      return timeToLive;
    } catch (error) {
      this.logger.error(`获取缓存TTL失败: ${fullKey}`, error);
      return -1;
    }
  }

  /**
   * 批量设置缓存
   */
  async mset<T>(data: Record<string, T>, options: CacheOptions = {}): Promise<void> {
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
    } catch (error) {
      this.logger.error(`批量设置缓存失败`, error);
      throw error;
    }
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    const { prefix = this.defaultPrefix } = options;
    const fullKeys = keys.map(key => `${prefix}${key}`);

    try {
      const values = await this.redis.mget(fullKeys);
      return values.map(value =>
        value === null || value === undefined ? null : JSON.parse(value),
      );
    } catch (error) {
      this.logger.error(`批量获取缓存失败`, error);
      return keys.map(() => null);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info();
      const lines = info.split('\r\n');
      const stats: any = {};

      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key.trim()] = value.trim();
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('获取Redis统计信息失败', error);
      return {};
    }
  }

  // ===== 多层缓存新方法 =====

  /**
   * 多层缓存设置
   */
  async multiSet<T>(key: string, value: T, options: MultiCacheOptions = {}): Promise<void> {
    const {
      ttl = this.defaultTtl,
      prefix = this.defaultPrefix,
      useMemoryCache = true,
      useRedisCache = true,
      memoryTtl = this.defaultMemoryTtl,
      priority = 'medium',
    } = options;

    const fullKey = `${prefix}${key}`;

    try {
      // 1. 设置内存缓存（快速访问）
      if (useMemoryCache) {
        this.setMemoryCache(fullKey, value, memoryTtl, priority);
      }

      // 2. 设置Redis缓存（持久化）
      if (useRedisCache) {
        const serializedValue = JSON.stringify(value);
        await this.redis.set(fullKey, serializedValue, 'EX', ttl);
      }

      this.logger.debug(
        `多层缓存设置成功: ${fullKey} [内存:${useMemoryCache}, Redis:${useRedisCache}]`,
      );
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`多层缓存设置失败: ${fullKey}`, error);
      throw error;
    }
  }

  /**
   * 多层缓存获取
   */
  async multiGet<T>(key: string, options: MultiCacheOptions = {}): Promise<T | null> {
    const { prefix = this.defaultPrefix, useMemoryCache = true, useRedisCache = true } = options;

    const fullKey = `${prefix}${key}`;

    try {
      // 1. 首先检查内存缓存（最快）
      if (useMemoryCache) {
        const memoryResult = this.getMemoryCache<T>(fullKey);
        if (memoryResult !== null) {
          this.stats.hits++;
          this.stats.memoryHits++;
          this.logger.debug(`内存缓存命中: ${fullKey}`);
          return memoryResult;
        }
      }

      // 2. 检查Redis缓存
      if (useRedisCache) {
        const value = await this.redis.get(fullKey);
        if (value !== null && value !== undefined) {
          const parsedValue = JSON.parse(value);

          // 回填内存缓存
          if (useMemoryCache) {
            this.setMemoryCache(fullKey, parsedValue, this.defaultMemoryTtl, 'low');
          }

          this.stats.hits++;
          this.stats.redisHits++;
          this.logger.debug(`Redis缓存命中: ${fullKey}`);
          return parsedValue;
        }
      }

      // 3. 缓存未命中
      this.stats.misses++;
      this.logger.debug(`多层缓存未命中: ${fullKey}`);
      return null;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`多层缓存获取失败: ${fullKey}`, error);
      return null;
    }
  }

  /**
   * 多层缓存删除
   */
  async multiDelete(key: string, options: MultiCacheOptions = {}): Promise<void> {
    const { prefix = this.defaultPrefix, useMemoryCache = true, useRedisCache = true } = options;

    const fullKey = `${prefix}${key}`;

    try {
      // 1. 删除内存缓存
      if (useMemoryCache) {
        this.deleteMemoryCache(fullKey);
      }

      // 2. 删除Redis缓存
      if (useRedisCache) {
        await this.redis.del(fullKey);
      }

      this.logger.debug(`多层缓存删除成功: ${fullKey}`);
    } catch (error) {
      this.logger.error(`多层缓存删除失败: ${fullKey}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(2) : '0';

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      memoryHitRate:
        this.stats.hits > 0 ? ((this.stats.memoryHits / this.stats.hits) * 100).toFixed(2) : '0',
    };
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(`清理过期内存缓存: ${keysToDelete.length} 个键`);
    }
  }

  /**
   * 启动内存缓存清理定时器
   */
  private startMemoryCacheCleanup(): void {
    // 每2分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 120000);
  }

  /**
   * 设置内存缓存
   */
  private setMemoryCache<T>(key: string, value: T, ttl: number, priority: string): void {
    const expiresAt = Date.now() + ttl * 1000;

    this.memoryCache.set(key, {
      value,
      expiresAt,
      metadata: { priority, setAt: Date.now() },
    });

    // 如果内存缓存过大，删除一些低优先级的缓存
    if (this.memoryCache.size > 1000) {
      this.evictLowPriorityCache();
    }
  }

  /**
   * 获取内存缓存
   */
  private getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除内存缓存
   */
  private deleteMemoryCache(key: string): void {
    this.memoryCache.delete(key);
  }

  /**
   * 淘汰低优先级缓存
   */
  private evictLowPriorityCache(): void {
    const keysToDelete: string[] = [];
    const now = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      // 优先删除过期或低优先级的缓存
      if (item.expiresAt <= now || item.metadata?.priority === 'low') {
        keysToDelete.push(key);

        if (keysToDelete.length >= 100) {
          // 一次最多删除100个
          break;
        }
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(`淘汰低优先级内存缓存: ${keysToDelete.length} 个键`);
    }
  }
}
