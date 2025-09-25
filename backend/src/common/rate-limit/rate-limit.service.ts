import { Injectable, Logger, UnauthorizedException, HttpException, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyPrefix?: string; // 键前缀
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
  handler?: (key: string, limit: RateLimitInfo) => any; // 限流处理器
}

export interface RateLimitInfo {
  key: string;
  points: number; // 当前请求数
  expiresAt: number; // 过期时间
  remaining: number; // 剩余请求数
  isFirstRequest?: boolean; // 是否是第一个请求
  resetTime: number; // 重置时间
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100,
    keyPrefix: 'rate_limit:',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('限流服务初始化');
  }

  /**
   * 检查请求是否被限流
   */
  async checkLimit(
    key: string,
    options: Partial<RateLimitOptions> = {},
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.keyPrefix}${key}`;

    try {
      // 获取当前计数
      const current = await this.getCurrentCount(fullKey, config.windowMs);

      // 计算剩余请求数
      const remaining = Math.max(0, config.maxRequests - current);

      // 如果超过限制
      if (current >= config.maxRequests) {
        const expiresAt = await this.getExpirationTime(fullKey);
        const info: RateLimitInfo = {
          key: fullKey,
          points: current,
          expiresAt,
          remaining: 0,
          resetTime: expiresAt,
        };

        this.logger.warn(`请求被限流: ${key}, 请求数: ${current}, 限制: ${config.maxRequests}`);

        // 调用自定义处理器
        if (config.handler) {
          config.handler(key, info);
        }

        return { success: false, info };
      }

      // 增加计数
      const newCount = await this.incrementCount(fullKey, config.windowMs);

      // 设置过期时间
      await this.setExpiration(fullKey, config.windowMs);

      const expiresAt = await this.getExpirationTime(fullKey);
      const isFirstRequest = newCount === 1;

      const info: RateLimitInfo = {
        key: fullKey,
        points: newCount,
        expiresAt,
        remaining: config.maxRequests - newCount,
        isFirstRequest,
        resetTime: expiresAt,
      };

      this.logger.debug(`限流检查通过: ${key}, 当前计数: ${newCount}, 剩余: ${info.remaining}`);

      return { success: true, info };
    } catch (error) {
      this.logger.error(`限流检查失败: ${key}`, error);
      // 发生错误时，允许请求通过以避免服务不可用
      return { success: true };
    }
  }

  /**
   * 获取当前计数
   */
  private async getCurrentCount(key: string, windowMs: number): Promise<number> {
    try {
      const result = await this.redis.get(key);
      return result ? parseInt(result, 10) : 0;
    } catch (error) {
      this.logger.error(`获取当前计数失败: ${key}`, error);
      return 0;
    }
  }

  /**
   * 增加计数
   */
  private async incrementCount(key: string, windowMs: number): Promise<number> {
    try {
      const pipeline = this.redis.pipeline();

      // 使用INCR命令增加计数
      pipeline.incr(key);

      // 如果是第一个请求，设置过期时间
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      if (results && results[0] && results[0][1]) {
        return results[0][1] as number;
      }
      return 0;
    } catch (error) {
      this.logger.error(`增加计数失败: ${key}`, error);
      return 0;
    }
  }

  /**
   * 设置过期时间
   */
  private async setExpiration(key: string, windowMs: number): Promise<void> {
    try {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    } catch (error) {
      this.logger.error(`设置过期时间失败: ${key}`, error);
    }
  }

  /**
   * 获取过期时间
   */
  private async getExpirationTime(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1 || ttl === -2) {
        return Date.now() + 15 * 60 * 1000; // 默认15分钟
      }
      return Date.now() + ttl * 1000;
    } catch (error) {
      this.logger.error(`获取过期时间失败: ${key}`, error);
      return Date.now() + 15 * 60 * 1000;
    }
  }

  /**
   * 重置限流计数
   */
  async resetLimit(key: string): Promise<void> {
    const fullKey = `${this.defaultOptions.keyPrefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.logger.log(`限流重置成功: ${key}`);
    } catch (error) {
      this.logger.error(`重置限流失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取限流信息
   */
  async getLimitInfo(key: string): Promise<RateLimitInfo | null> {
    const fullKey = `${this.defaultOptions.keyPrefix}${key}`;

    try {
      const current = await this.getCurrentCount(fullKey, this.defaultOptions.windowMs);
      const expiresAt = await this.getExpirationTime(fullKey);

      return {
        key: fullKey,
        points: current,
        expiresAt,
        remaining: Math.max(0, this.defaultOptions.maxRequests - current),
        resetTime: expiresAt,
      };
    } catch (error) {
      this.logger.error(`获取限流信息失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 清理过期限流键
   */
  async cleanup(): Promise<number> {
    const pattern = `${this.defaultOptions.keyPrefix}*`;

    try {
      const keys = await this.redis.keys(pattern);

      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          await this.redis.del(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.log(`清理了 ${cleaned} 个过期的限流键`);
      }

      return cleaned;
    } catch (error) {
      this.logger.error('清理过期限流键失败', error);
      return 0;
    }
  }
}
