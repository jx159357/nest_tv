import { Module, forwardRef } from '@nestjs/common'
import { AppLoggerService } from './services/app-logger.service'

/**
 * 通用模块
 * 提供全局可用的服务和组件
 */
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class CommonModule {}