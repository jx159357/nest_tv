import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../constants/redis.constants';

type RedisExecResult = [Error | null, unknown][] | null;

/**
 * 限流选项接口
 */
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
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
 * 提供固定窗口、令牌桶和滑动窗口三种实现。
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 60_000,
    maxRequests: 100,
    keyPrefix: 'rate_limit:',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('限流服务初始化');
  }

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

  private async fixedWindow(
    key: string,
    options: Partial<RateLimitOptions>,
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = this.mergeOptions(options);
    const fullKey = `${config.keyPrefix}${key}`;

    try {
      const current = await this.getCurrentCount(fullKey);

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

      const newCount = await this.incrementCount(fullKey, config.windowMs);
      await this.setExpiration(fullKey, config.windowMs);

      const expiresAt = await this.getExpirationTime(fullKey);
      const info: RateLimitInfo = {
        key: fullKey,
        points: newCount,
        expiresAt,
        remaining: Math.max(0, config.maxRequests - newCount),
        isFirstRequest: newCount === 1,
        resetTime: expiresAt,
      };

      this.logger.debug(`限流检查通过: ${key}, 当前计数: ${newCount}, 剩余: ${info.remaining}`);
      return { success: true, info };
    } catch (error: unknown) {
      this.logger.error(
        `固定窗口限流失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: true };
    }
  }

  private async tokenBucket(
    key: string,
    options: Partial<RateLimitOptions>,
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = this.mergeOptions(options);
    const fullKey = `${config.keyPrefix}token_bucket:${key}`;
    const currentTime = Math.floor(Date.now() / 1000);
    const bucketSize = config.maxRequests;
    const refillRate = config.maxRequests / (config.windowMs / 1000);

    const luaScript = `
      local key = KEYS[1]
      local currentTime = tonumber(ARGV[1])
      local bucketSize = tonumber(ARGV[2])
      local refillRate = tonumber(ARGV[3])
      local requestedTokens = tonumber(ARGV[4])

      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(data[1])
      local lastRefill = tonumber(data[2])

      if tokens == nil or lastRefill == nil then
        tokens = bucketSize
        lastRefill = currentTime
      end

      local elapsed = currentTime - lastRefill
      local refill = elapsed * refillRate
      tokens = math.min(bucketSize, tokens + refill)

      if tokens >= requestedTokens then
        tokens = tokens - requestedTokens
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
        redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
        return {1, math.floor(tokens), math.floor(bucketSize - tokens)}
      end

      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', currentTime)
      redis.call('EXPIRE', key, math.ceil(bucketSize / refillRate))
      return {0, math.floor(tokens), math.floor(bucketSize - tokens)}
    `;

    try {
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
        const successFlag = this.toNumber(result[0]);
        const availableTokens = this.toNumber(result[1]);
        const consumedTokens = this.toNumber(result[2]);
        const success = successFlag === 1;

        const info: RateLimitInfo = {
          key: fullKey,
          points: availableTokens,
          expiresAt: currentTime + Math.ceil(bucketSize / refillRate),
          remaining: Math.max(0, bucketSize - consumedTokens),
          resetTime: currentTime + Math.ceil(bucketSize / refillRate),
        };

        if (!success) {
          this.logger.warn(`令牌桶限流: ${key}, 可用令牌: ${availableTokens}`);
        }

        return { success, info };
      }

      return { success: true };
    } catch (error: unknown) {
      this.logger.error(`令牌桶限流失败: ${key}`, error instanceof Error ? error.stack : undefined);
      return { success: true };
    }
  }

  private async slidingWindow(
    key: string,
    options: Partial<RateLimitOptions>,
  ): Promise<{ success: boolean; info?: RateLimitInfo }> {
    const config = this.mergeOptions(options);
    const fullKey = `${config.keyPrefix}sliding:${key}`;
    const currentTime = Date.now();
    const windowStart = currentTime - config.windowMs;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(fullKey, 0, windowStart);
      pipeline.zcard(fullKey);
      pipeline.zadd(fullKey, currentTime, `${currentTime}-${Math.random()}`);
      pipeline.expire(fullKey, Math.ceil(config.windowMs / 1000));

      const results = (await pipeline.exec()) as RedisExecResult;
      const currentCount = this.getPipelineCardValue(results);
      const remaining = Math.max(0, config.maxRequests - currentCount);

      const info: RateLimitInfo = {
        key: fullKey,
        points: currentCount,
        expiresAt: currentTime + config.windowMs,
        remaining,
        isFirstRequest: currentCount === 1,
        resetTime: currentTime + config.windowMs,
      };

      if (currentCount >= config.maxRequests) {
        this.logger.warn(
          `滑动窗口限流: ${key}, 请求数: ${currentCount}, 限制: ${config.maxRequests}`,
        );
        return { success: false, info: { ...info, remaining: 0 } };
      }

      return { success: true, info };
    } catch (error: unknown) {
      this.logger.error(
        `滑动窗口限流失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: true };
    }
  }

  async resetLimit(key: string): Promise<void> {
    const fullKey = `${this.defaultOptions.keyPrefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.logger.log(`重置限流计数: ${key}`);
    } catch (error: unknown) {
      this.logger.error(
        `重置限流计数失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async getLimitInfo(key: string): Promise<RateLimitInfo | null> {
    const config = this.defaultOptions;
    const fullKey = `${config.keyPrefix}${key}`;

    try {
      const current = await this.getCurrentCount(fullKey);
      const expiresAt = await this.getExpirationTime(fullKey);

      return {
        key: fullKey,
        points: current,
        expiresAt,
        remaining: Math.max(0, config.maxRequests - current),
        resetTime: expiresAt,
      };
    } catch (error: unknown) {
      this.logger.error(
        `获取限流状态失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

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
    } catch (error: unknown) {
      this.logger.error('清理过期限流键失败', error instanceof Error ? error.stack : undefined);
      return 0;
    }
  }

  private mergeOptions(options: Partial<RateLimitOptions>): RateLimitOptions {
    return { ...this.defaultOptions, ...options };
  }

  private async getCurrentCount(key: string): Promise<number> {
    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error: unknown) {
      this.logger.error(
        `获取限流计数失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  private async incrementCount(key: string, windowMs: number): Promise<number> {
    try {
      const result = (await this.redis
        .multi()
        .incr(key)
        .expire(key, Math.ceil(windowMs / 1000))
        .exec()) as RedisExecResult;

      if (
        Array.isArray(result) &&
        result[0] &&
        result[0][0] === null &&
        typeof result[0][1] === 'number'
      ) {
        return result[0][1];
      }

      return 1;
    } catch (error: unknown) {
      this.logger.error(
        `增加限流计数失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 1;
    }
  }

  private async setExpiration(key: string, windowMs: number): Promise<void> {
    try {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    } catch (error: unknown) {
      this.logger.error(
        `设置限流过期时间失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async getExpirationTime(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : 0;
    } catch (error: unknown) {
      this.logger.error(
        `获取限流过期时间失败: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  private getPipelineCardValue(results: RedisExecResult): number {
    if (
      Array.isArray(results) &&
      results[1] &&
      results[1][0] === null &&
      typeof results[1][1] === 'number'
    ) {
      return results[1][1];
    }

    return 0;
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' ? value : Number(value) || 0;
  }
}
