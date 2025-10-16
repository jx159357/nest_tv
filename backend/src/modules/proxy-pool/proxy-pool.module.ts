import { Module } from '@nestjs/common';
import { ProxyPoolService } from '../../common/services/proxy-pool.service';
import { ProxyProviderService } from '../../common/services/proxy-provider.service';
import { ProxyMonitoringService } from '../../common/services/proxy-monitoring.service';
import {
  KuaiDailiFreeProvider,
  XiciProxyProvider,
  Proxy89Provider,
  XiaoHuanProxyProvider,
} from '../../common/services/proxy-provider.service';
import { ProxyPoolController } from '../../controllers/proxy-pool.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from '../../common/services/app-logger.service';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  controllers: [ProxyPoolController],
  providers: [
    // 核心服务
    ProxyPoolService,
    ProxyProviderService,
    ProxyMonitoringService,
    AppLoggerService,

    // 代理提供商
    KuaiDailiFreeProvider,
    XiciProxyProvider,
    Proxy89Provider,
    XiaoHuanProxyProvider,
  ],
  exports: [ProxyPoolService, ProxyProviderService, ProxyMonitoringService],
})
export class ProxyPoolModule {}
