import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../constants/redis.constants';

/**
 * 限流选项接口
 */
export interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyPrefix?: string; // 键前缀
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean; // 跳过失败请求
}

/**
 * 限流信息接口
 */
export interface RateLimitInfo {
  key: string;
  points: number;
  expiresAt: number;
  remaining: number;
  isFirstRequest?: boolean;
  resetTime: number;
}

/**
 * 限流服务
 * 提供多种限流算法：固定窗口、令牌桶、滑动窗口
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 60000, // 1分钟
    maxRequests: 100,
    keyPrefix: 'rate_limit:',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('限流服务初始化');
  }

  /**
   * 获取限流键值
   */
  private async getCurrentCount(key: string, windowMs: number): Promise<number> {
    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      this.logger.error(`获取限流计数失败: ${key}`, error);
      return 0;
    }
  }

  /**
   * 增加限流计数
   */
  private async incrementCount(key: string, windowMs: number): Promise<number> {
    try {
      const result = await this.redis
        .multi()
        .incr(key)
        .expire(key, Math.ceil(windowMs / 1000))
        .exec();

      if (
        Array.isArray(result) &&
        result[0] &&
        result[0][0] === null &&
        typeof result[0][1] === 'number'
      ) {
        return result[0][1];
      }
      return 1;
    } catch (error) {
      this.logger.error(`增加限流计数失败: ${key}`, error);
      return 1;
    }
  }

  /**
   * 设置过期时间
   */
  private async setExpiration(key: string, windowMs: number): Promise<void> {
    try {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    } catch (error) {
      this.logger.error(`设置限流过期时间失败: ${key}`, error);
    }
  }

  /**
   * 获取过期时间
   */
  private async getExpirationTime(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : 0;
    } catch (error) {
      this.logger.error(`获取限流过期时间失败: ${key}`, error);
      return 0;
    }
  }

  /**
   * 检查请求是否被限流（多种算法支持）
   */
  async checkLimit(
    key: string,
    options: Partial<RateLimitOptions> = {},
    algorithm: 'fixed' | 'token_bucket' | 'sliding_window' = 'fixed',
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    switch (algorithm) {
      case 'token_bucket':
        return this.tokenBucket(key, options);
      case 'sliding_window':
        return this.slidingWindow(key, options);
      default:
        return this.fixedWindow(key, options);
    }
  }

  /**
   * 固定窗口算法
   */
  private async fixedWindow(
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
   * 令牌桶算法
   */
  private async tokenBucket(
    key: string,
    options: Partial<RateLimitOptions> = {},
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.keyPrefix}token:${key}`;
    const bucketSize = config.maxRequests;
    const refillRate = config.maxRequests / (config.windowMs / 1000); // 每秒补充的令牌数

    try {
      const currentTime = Math.floor(Date.now() / 1000);

      // 使用Lua脚本实现原子性操作
      const luaScript = `
        local key = KEYS[1]
        local currentTime = tonumber(ARGV[1])
        local bucketSize = tonumber(ARGV[2])
        local refillRate = tonumber(ARGV[3])
        local requestTokens = tonumber(ARGV[4])
        
        local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(data[1]) or bucketSize
        local lastRefill = tonumber(data[2]) or currentTime
        
        -- 补充令牌
        local timePassed = currentTime - lastRefill
        local tokensToAdd = math.floor(timePassed * refillRate)
        tokens = math.min(bucketSize, tokens + tokensToAdd)
        
        -- 检查是否有足够令牌
        if tokens >= requestTokens then
          tokens = tokens - requestTokens
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
          redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
          return {1, tokens, bucketSize - tokens}
        else
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
          redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
          return {0, tokens, bucketSize - tokens}
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        fullKey,
        currentTime,
        bucketSize,
        refillRate,
        1,
      );

      if (Array.isArray(result) && result.length === 3) {
        const success = result[0][1] === 1;
        const availableTokens = result[1][1];
        const remaining = result[2][1];
        const info: RateLimitInfo = {
          key: fullKey,
          points: availableTokens,
          expiresAt: currentTime + Math.ceil(bucketSize / refillRate),
          remaining: remaining,
          resetTime: currentTime + Math.ceil(bucketSize / refillRate),
        };

        if (success) {
          return { success: true, info };
        } else {
          this.logger.warn(`令牌桶限流: ${key}, 可用令牌: ${availableTokens}`);
          return { success: false, info };
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`令牌桶限流失败: ${key}`, error);
      return { success: true };
    }
  }

  /**
   * 滑动窗口算法
   */
  private async slidingWindow(
    key: string,
    options: Partial<RateLimitOptions> = {},
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.keyPrefix}sliding:${key}`;
    const currentTime = Date.now();
    const windowStart = currentTime - config.windowMs;

    try {
      // 使用有序集合存储请求时间戳
      const pipeline = this.redis.pipeline();

      // 移除过期的请求记录
      pipeline.zremrangebyscore(fullKey, 0, windowStart);

      // 获取当前窗口内的请求数
      pipeline.zcard(fullKey);

      // 添加当前请求
      pipeline.zadd(fullKey, currentTime, `${currentTime}-${Math.random()}`);

      // 设置过期时间
      pipeline.expire(fullKey, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();

      if (
        Array.isArray(results) &&
        results[1] &&
        results[1][0] === null &&
        results[1][1] !== null
      ) {
        const currentCount = results[1][1] as number;
        const remaining = Math.max(0, config.maxRequests - currentCount);

        if (currentCount >= config.maxRequests) {
          const info: RateLimitInfo = {
            key: fullKey,
            points: currentCount,
            expiresAt: currentTime + config.windowMs,
            remaining: 0,
            resetTime: currentTime + config.windowMs,
          };

          this.logger.warn(
            `滑动窗口限流: ${key}, 请求数: ${currentCount}, 限制: ${config.maxRequests}`,
          );
          return { success: false, info };
        }

        const info: RateLimitInfo = {
          key: fullKey,
          points: currentCount,
          expiresAt: currentTime + config.windowMs,
          remaining: remaining,
          isFirstRequest: currentCount === 1,
          resetTime: currentTime + config.windowMs,
        };

        return { success: true, info };
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`滑动窗口限流失败: ${key}`, error);
      return { success: true };
    }
  }

  /**
   * 重置限流计数
   */
  async resetLimit(key: string): Promise<void> {
    const config = this.defaultOptions;
    const fullKey = `${config.keyPrefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.logger.log(`重置限流计数: ${key}`);
    } catch (error) {
      this.logger.error(`重置限流计数失败: ${key}`, error);
    }
  }

  /**
   * 获取限流状态
   */
  async getLimitInfo(key: string): Promise<RateLimitInfo | null> {
    const config = this.defaultOptions;
    const fullKey = `${config.keyPrefix}${key}`;

    try {
      const current = await this.getCurrentCount(fullKey, config.windowMs);
      const expiresAt = await this.getExpirationTime(fullKey);

      return {
        key: fullKey,
        points: current,
        expiresAt,
        remaining: Math.max(0, config.maxRequests - current),
        resetTime: expiresAt,
      };
    } catch (error) {
      this.logger.error(`获取限流状态失败: ${key}`, error);
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
