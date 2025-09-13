import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

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

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultPrefix = 'nest_tv:';
  private readonly defaultTtl = 1800; // 30分钟

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('缓存服务初始化');
  }

  /**
   * 设置缓存
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
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

      const parsedValue = JSON.parse(value as string);
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
        value === null || value === undefined ? null : JSON.parse(value as string)
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
}