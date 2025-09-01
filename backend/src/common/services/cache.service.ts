import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * 缓存服务
 * 提供Redis缓存功能，支持多种缓存策略
 */
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
  ) {}

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值或null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * 删除匹配模式的缓存
   * @param pattern 模式（如：user:*）
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        return await this.redisClient.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   * @param key 缓存键
   * @param ttl 过期时间（秒）
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redisClient.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  }

  /**
   * 获取缓存过期时间
   * @param key 缓存键
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * 递增计数器
   * @param key 缓存键
   * @param increment 递增值
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    try {
      return await this.redisClient.incrby(key, increment);
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * 递减计数器
   * @param key 缓存键
   * @param decrement 递减值
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    try {
      return await this.redisClient.decrby(key, decrement);
    } catch (error) {
      console.error(`Cache decr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   * @param key 缓存键
   * @param factory 数据获取函数
   * @param ttl 过期时间（秒）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // 先尝试从缓存获取
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // 缓存未命中，从数据源获取
      const data = await factory();
      
      // 设置缓存
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 批量获取缓存
   * @param keys 缓存键数组
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redisClient.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * 批量设置缓存
   * @param keyValuePairs 键值对数组
   * @param ttl 过期时间（秒）
   */
  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();
      
      for (const pair of keyValuePairs) {
        const serializedValue = JSON.stringify(pair.value);
        if (pair.ttl) {
          pipeline.setex(pair.key, pair.ttl, serializedValue);
        } else {
          pipeline.set(pair.key, serializedValue);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  /**
   * 生成缓存键
   * @param prefix 前缀
   * @param parts 键部分
   */
  generateKey(prefix: string, ...parts: string[]): string {
    const normalizedParts = parts.map(part => 
      String(part).replace(/[^a-zA-Z0-9_-]/g, '_')
    );
    return `${prefix}:${normalizedParts.join(':')}`;
  }

  /**
   * 清理过期缓存（安全清理）
   * @param prefix 前缀
   * @param maxAge 最大年龄（秒）
   */
  async cleanupExpired(prefix: string, maxAge: number = 86400): Promise<number> {
    try {
      const keys = await this.redisClient.keys(`${prefix}:*`);
      let cleanedCount = 0;
      
      for (const key of keys) {
        const ttl = await this.ttl(key);
        if (ttl > maxAge) {
          await this.del(key);
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error(`Cache cleanup error for prefix ${prefix}:`, error);
      return 0;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    keyCount: number;
    memoryUsage: string;
    connected: boolean;
  }> {
    try {
      const [keyCount, memoryUsage] = await Promise.all([
        this.redisClient.dbsize(),
        this.redisClient.info('memory')
      ]);
      
      const memoryMatch = memoryUsage.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsageHuman = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return {
        keyCount,
        memoryUsage: memoryUsageHuman,
        connected: true,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        keyCount: 0,
        memoryUsage: 'unknown',
        connected: false,
      };
    }
  }
}