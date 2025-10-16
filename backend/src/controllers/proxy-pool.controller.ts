import { Controller, Get, Post, Put, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProxyPoolService } from '../common/services/proxy-pool.service';
import { ProxyProviderService } from '../common/services/proxy-provider.service';
import { ProxyMonitoringService } from '../common/services/proxy-monitoring.service';
import { ProxyInfo } from '../common/types/proxy-pool.types';

@ApiTags('代理池管理')
@Controller('proxy-pool')
export class ProxyPoolController {
  constructor(
    private readonly proxyPoolService: ProxyPoolService,
    private readonly proxyProviderService: ProxyProviderService,
    private readonly proxyMonitoringService: ProxyMonitoringService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '获取代理池统计信息' })
  @ApiResponse({ status: 200, description: '成功获取统计信息' })
  getProxyStats() {
    return this.proxyPoolService.getProxyStats();
  }

  @Get('health')
  @ApiOperation({ summary: '获取代理池健康状态' })
  @ApiResponse({ status: 200, description: '成功获取健康状态' })
  getHealthReport() {
    return this.proxyMonitoringService.generateHealthReport();
  }

  @Get('health/score')
  @ApiOperation({ summary: '获取代理池健康评分' })
  @ApiResponse({ status: 200, description: '成功获取健康评分' })
  getHealthScore() {
    return {
      score: this.proxyMonitoringService.getHealthScore(),
      status: this.proxyMonitoringService.generateHealthReport().status,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: '获取代理池监控指标' })
  @ApiQuery({ name: 'minutes', required: false, type: Number, description: '获取多少分钟内的指标' })
  @ApiResponse({ status: 200, description: '成功获取监控指标' })
  getMetrics(@Query('minutes') minutes?: number) {
    return {
      current: this.proxyMonitoringService.getCurrentMetrics(),
      history: this.proxyMonitoringService.getMetricsHistory(minutes || 60),
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取代理池告警信息' })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: '获取多少小时内的告警' })
  @ApiResponse({ status: 200, description: '成功获取告警信息' })
  getAlerts(@Query('hours') hours?: number) {
    return this.proxyMonitoringService.getActiveAlerts(hours || 24);
  }

  @Get('performance')
  @ApiOperation({ summary: '获取代理池性能报告' })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: '获取多少小时内的报告' })
  @ApiResponse({ status: 200, description: '成功获取性能报告' })
  getPerformanceReport(@Query('hours') hours?: number) {
    return this.proxyMonitoringService.getPerformanceReport(hours || 24);
  }

  @Get('providers')
  @ApiOperation({ summary: '获取代理提供商列表' })
  @ApiResponse({ status: 200, description: '成功获取提供商列表' })
  getProviders() {
    return {
      providers: this.proxyProviderService.getProviderStats(),
      active: this.proxyProviderService.getActiveProviders(),
    };
  }

  @Get('proxies')
  @ApiOperation({ summary: '获取所有代理列表' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['working', 'failed', 'all'],
    description: '筛选状态',
  })
  @ApiQuery({
    name: 'protocol',
    required: false,
    enum: ['http', 'https', 'socks4', 'socks5'],
    description: '筛选协议',
  })
  @ApiResponse({ status: 200, description: '成功获取代理列表' })
  getProxies(@Query('status') status?: string, @Query('protocol') protocol?: string) {
    const stats = this.proxyPoolService.getProxyStats();
    let proxies: ProxyInfo[] = [];

    if (status === 'working') {
      proxies = stats.topPerformingProxies;
    } else if (status === 'failed') {
      proxies = stats.worstPerformingProxies;
    } else {
      proxies = [...stats.topPerformingProxies, ...stats.worstPerformingProxies];
    }

    if (protocol) {
      proxies = proxies.filter(proxy => proxy.protocol === protocol);
    }

    return {
      total: proxies.length,
      proxies,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新代理池' })
  @ApiResponse({ status: 200, description: '成功刷新代理池' })
  async refreshProxies() {
    try {
      const result = await this.proxyPoolService.fetchProxiesFromProviders();
      return {
        success: true,
        message: '代理池刷新成功',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: '代理池刷新失败',
        error: error.message,
      };
    }
  }

  @Post('test')
  @ApiOperation({ summary: '测试代理' })
  @ApiResponse({ status: 200, description: '成功测试代理' })
  async testProxy(
    @Body()
    proxyData: {
      host: string;
      port: number;
      protocol?: 'http' | 'https' | 'socks4' | 'socks5';
    },
  ) {
    const proxyInfo: ProxyInfo = {
      id: `test_${proxyData.host}_${proxyData.port}`,
      host: proxyData.host,
      port: proxyData.port,
      protocol: proxyData.protocol || 'http',
      source: 'manual_test',
      addedAt: new Date(),
      isWorking: false,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      uptime: 0,
    };

    try {
      const result = await this.proxyPoolService.testProxy(proxyInfo);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete('failed')
  @ApiOperation({ summary: '清理失效代理' })
  @ApiResponse({ status: 200, description: '成功清理失效代理' })
  removeFailedProxies() {
    const removed = this.proxyPoolService.removeFailedProxies();
    return {
      success: true,
      message: `已清理 ${removed} 个失效代理`,
      removed,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取代理池配置' })
  @ApiResponse({ status: 200, description: '成功获取配置' })
  getConfig() {
    return this.proxyPoolService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: '更新代理池配置' })
  @ApiResponse({ status: 200, description: '成功更新配置' })
  updateConfig(@Body() config: any) {
    try {
      this.proxyPoolService.updateConfig(config);
      return {
        success: true,
        message: '配置更新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '配置更新失败',
        error: error.message,
      };
    }
  }

  @Post('providers/:provider/toggle')
  @ApiOperation({ summary: '启用/禁用代理提供商' })
  @ApiParam({ name: 'provider', description: '提供商名称' })
  @ApiResponse({ status: 200, description: '成功切换提供商状态' })
  toggleProvider(@Param('provider') providerName: string, @Body() body: { active: boolean }) {
    const success = this.proxyProviderService.toggleProvider(providerName, body.active);
    return {
      success,
      message: success ? `提供商 ${providerName} 已${body.active ? '启用' : '禁用'}` : '操作失败',
    };
  }

  @Get('best')
  @ApiOperation({ summary: '获取最佳代理' })
  @ApiQuery({ name: 'protocol', required: false, description: '指定协议类型' })
  @ApiResponse({ status: 200, description: '成功获取最佳代理' })
  getBestProxy(@Query('protocol') protocol?: string) {
    const proxy = this.proxyPoolService.getBestProxy(protocol);
    return {
      success: !!proxy,
      proxy,
    };
  }
}
