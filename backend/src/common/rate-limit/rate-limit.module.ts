import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    RedisModule, // 导入Redis模块
  ],
  providers: [
    RateLimitService,
    RateLimitGuard,
  ],
  exports: [
    RateLimitService,
    RateLimitGuard,
  ],
})
export class RateLimitModule {}