import { Module, forwardRef } from '@nestjs/common';
import { AppLoggerService } from './services/app-logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { DatabaseHealthService } from './services/database-health.service';
import { HealthController } from './controllers/health.controller';

/**
 * 通用模块
 * 提供全局可用的服务和组件
 */
@Module({
  providers: [AppLoggerService, GlobalExceptionFilter, DatabaseHealthService],
  controllers: [HealthController],
  exports: [AppLoggerService, DatabaseHealthService],
})
export class CommonModule {}
