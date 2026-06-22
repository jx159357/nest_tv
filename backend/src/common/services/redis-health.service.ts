import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { AppLoggerService } from './app-logger.service';

export interface RedisHealthResult {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
  error?: string;
}

@Injectable()
export class RedisHealthService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly loggerService: AppLoggerService,
  ) {}

  async checkRedisHealth(): Promise<RedisHealthResult> {
    const startTime = Date.now();

    try {
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'ok';

      await this.cacheService.set(testKey, testValue, { ttl: 10 });
      const retrievedValue = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      const responseTime = Date.now() - startTime;

      if (retrievedValue === testValue) {
        return {
          status: 'healthy',
          message: 'Redis连接正常',
          responseTime,
        };
      }

      return {
        status: 'unhealthy',
        message: 'Redis读写测试失败',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.loggerService.error('Redis健康检查失败', 'REDIS_HEALTH_CHECK', undefined, error);

      return {
        status: 'unhealthy',
        message: 'Redis连接失败',
        responseTime,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}
