import { Module, forwardRef } from '@nestjs/common';
import { AppLoggerService } from './services/app-logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

/**
 * 通用模块
 * 提供全局可用的服务和组件
 */
@Module({
  providers: [AppLoggerService, GlobalExceptionFilter],
  exports: [AppLoggerService],
})
export class CommonModule {}
