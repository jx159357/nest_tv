import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    RedisModule, // 导入Redis模块
  ],
  providers: [
    CacheService,
  ],
  exports: [
    CacheService,
  ],
})
export class CacheModule {}