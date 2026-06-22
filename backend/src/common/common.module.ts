import { Module } from '@nestjs/common';
import { AppLoggerService } from './services/app-logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { DatabaseHealthService } from './services/database-health.service';
import { RedisHealthService } from './services/redis-health.service';
import { HealthController } from './controllers/health.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 通用模块
 * 提供全局可用的服务和组件
 */
@Module({
  providers: [
    AppLoggerService,
    GlobalExceptionFilter,
    DatabaseHealthService,
    RedisHealthService,
    JwtAuthGuard,
  ],
  controllers: [HealthController],
  exports: [AppLoggerService, DatabaseHealthService, RedisHealthService],
})
export class CommonModule {}
