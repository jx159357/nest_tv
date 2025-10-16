import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as http from 'http';
import * as socks from 'socks';
import {
  ProxyInfo,
  ProxyPoolConfig,
  ProxyStats,
  ProxyProvider,
  ProxyTestResult,
  ProxyRequestConfig,
} from '../types/proxy-pool.types';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class ProxyPoolService {
  private readonly logger = new Logger(ProxyPoolService.name);
  private proxies: Map<string, ProxyInfo> = new Map();
  private workingProxies: ProxyInfo[] = [];
  private failedProxies: ProxyInfo[] = [];
  private providers: Map<string, ProxyProvider> = new Map();
  private httpClient: AxiosInstance;
  private validationTimer: NodeJS.Timeout | null = null;
  private config: ProxyPoolConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly appLogger: AppLoggerService,
  ) {
    this.config = this.getDefaultConfig();
    this.initializeHttpClient();
    this.startValidationTimer();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): ProxyPoolConfig {
    return {
      enabled: this.configService.get('PROXY_POOL_ENABLED', true),
      maxProxies: this.configService.get('MAX_PROXIES', 100),
      minWorkingProxies: this.configService.get('MIN_WORKING_PROXIES', 5),

      validation: {
        testUrl: this.configService.get('PROXY_TEST_URL', 'http://httpbin.org/ip'),
        timeout: this.configService.get('PROXY_TEST_TIMEOUT', 10000),
        interval: this.configService.get('PROXY_VALIDATION_INTERVAL', 300000), // 5分钟
        maxFailureCount: this.configService.get('PROXY_MAX_FAILURE_COUNT', 3),
        retryAttempts: this.configService.get('PROXY_RETRY_ATTEMPTS', 2),
      },

      rotation: {
        strategy: this.configService.get('PROXY_ROTATION_STRATEGY', 'best-response-time'),
        switchAfter: this.configService.get('PROXY_SWITCH_AFTER', 10),
        failureThreshold: this.configService.get('PROXY_FAILURE_THRESHOLD', 3),
      },

      cache: {
        responseTimeCache: this.configService.get('PROXY_RESPONSE_TIME_CACHE', 300000), // 5分钟
        proxyListCache: this.configService.get('PROXY_LIST_CACHE', 600000), // 10分钟
      },

      monitoring: {
        enabled: this.configService.get('PROXY_MONITORING_ENABLED', true),
        logLevel: this.configService.get('PROXY_LOG_LEVEL', 'info'),
        statisticsInterval: this.configService.get('PROXY_STATISTICS_INTERVAL', 60000), // 1分钟
      },
    };
  }

  /**
   * 初始化HTTP客户端
   */
  private initializeHttpClient(): void {
    this.httpClient = axios.create({
      timeout: this.config.validation.timeout,
      validateStatus: status => status < 500,
    });
  }

  /**
   * 启动验证定时器
   */
  private startValidationTimer(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    this.validationTimer = setInterval(
      () => this.validateAllProxies(),
      this.config.validation.interval,
    );
  }

  /**
   * 添加代理
   */
  async addProxy(proxyInfo: ProxyInfo): Promise<boolean> {
    try {
      // 检查是否已存在
      const existingProxy = this.proxies.get(proxyInfo.id);
      if (existingProxy) {
        this.logger.warn(`代理 ${proxyInfo.id} 已存在，更新信息`);
        Object.assign(existingProxy, proxyInfo);
        return true;
      }

      // 验证代理
      const testResult = await this.testProxy(proxyInfo);
      proxyInfo.lastChecked = new Date();
      proxyInfo.isWorking = testResult.success;
      proxyInfo.responseTime = testResult.responseTime;

      if (testResult.success) {
        proxyInfo.successCount = 1;
        proxyInfo.uptime = 100;
      } else {
        proxyInfo.failureCount = 1;
        proxyInfo.uptime = 0;
      }

      this.proxies.set(proxyInfo.id, proxyInfo);
      this.updateProxyLists();

      this.appLogger.log(
        'INFO',
        `添加代理 ${proxyInfo.id}: ${testResult.success ? '成功' : '失败'}`,
      );
      return testResult.success;
    } catch (error) {
      this.appLogger.error('添加代理失败', 'ProxyPoolService', error.message);
      return false;
    }
  }

  /**
   * 批量添加代理
   */
  async addProxies(proxies: ProxyInfo[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const proxy of proxies) {
      const result = await this.addProxy(proxy);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    this.logger.log(`批量添加代理完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed };
  }

  /**
   * 测试代理
   */
  async testProxy(proxy: ProxyInfo): Promise<ProxyTestResult> {
    const startTime = Date.now();

    try {
      const response = await this.httpClient.get(this.config.validation.testUrl, {
        proxy: this.createAxiosProxyConfig(proxy),
        timeout: this.config.validation.timeout,
        httpsAgent: this.createHttpsAgent(proxy),
      });

      const responseTime = Date.now() - startTime;

      return {
        proxy,
        success: response.status === 200,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        proxy,
        success: false,
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * 创建Axios代理配置
   */
  private createAxiosProxyConfig(proxy: ProxyInfo): any {
    const proxyConfig: any = {
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port,
    };

    if (proxy.username && proxy.password) {
      proxyConfig.auth = {
        username: proxy.username,
        password: proxy.password,
      };
    }

    return proxyConfig;
  }

  /**
   * 创建HTTPS代理Agent
   */
  private createHttpsAgent(proxy: ProxyInfo): https.Agent {
    return new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });
  }

  /**
   * 验证所有代理
   */
  async validateAllProxies(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.logger.log('开始验证所有代理...');
    const validationPromises: Promise<void>[] = [];

    for (const proxy of this.proxies.values()) {
      validationPromises.push(this.validateProxy(proxy));
    }

    await Promise.all(validationPromises);
    this.updateProxyLists();
    this.logProxyStatistics();
  }

  /**
   * 验证单个代理
   */
  private async validateProxy(proxy: ProxyInfo): Promise<void> {
    try {
      const testResult = await this.testProxy(proxy);
      proxy.lastChecked = new Date();

      if (testResult.success) {
        proxy.successCount++;
        proxy.isWorking = true;
        proxy.responseTime = testResult.responseTime;
        proxy.uptime = (proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100;
      } else {
        proxy.failureCount++;
        proxy.isWorking = false;
        proxy.uptime = (proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100;

        // 如果失败次数超过阈值，标记为失效
        if (proxy.failureCount >= this.config.validation.maxFailureCount) {
          proxy.isWorking = false;
        }
      }

      proxy.totalRequests++;
    } catch (error) {
      proxy.failureCount++;
      proxy.totalRequests++;
      proxy.isWorking = false;
      proxy.lastChecked = new Date();

      this.appLogger.error('代理验证失败', 'ProxyPoolService', error.message);
    }
  }

  /**
   * 更新代理列表
   */
  private updateProxyLists(): void {
    const allProxies = Array.from(this.proxies.values());

    this.workingProxies = allProxies
      .filter(proxy => proxy.isWorking)
      .sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity));

    this.failedProxies = allProxies.filter(proxy => !proxy.isWorking);
  }

  /**
   * 获取最佳代理
   */
  getBestProxy(preferredProtocol?: string): ProxyInfo | null {
    if (this.workingProxies.length === 0) {
      this.logger.warn('没有可用的代理');
      return null;
    }

    let candidates = this.workingProxies;

    if (preferredProtocol) {
      candidates = candidates.filter(proxy => proxy.protocol === preferredProtocol);
      if (candidates.length === 0) {
        this.logger.warn(`没有找到协议为 ${preferredProtocol} 的可用代理`);
        return this.workingProxies[0]; // 返回最佳代理
      }
    }

    // 根据策略选择代理
    switch (this.config.rotation.strategy) {
      case 'best-response-time':
        return candidates.reduce((best, current) =>
          (current.responseTime || Infinity) < (best.responseTime || Infinity) ? current : best,
        );

      case 'random':
        return candidates[Math.floor(Math.random() * candidates.length)];

      case 'round-robin':
        const index = Date.now() % candidates.length;
        return candidates[index];

      case 'weighted':
        // 基于成功率和响应时间加权
        return candidates.reduce((best, current) => {
          const bestScore = best.uptime / 100 / (best.responseTime || 1000);
          const currentScore = current.uptime / 100 / (current.responseTime || 1000);
          return currentScore > bestScore ? current : best;
        });

      default:
        return candidates[0];
    }
  }

  /**
   * 获取代理池统计信息
   */
  getProxyStats(): ProxyStats {
    const totalProxies = this.proxies.size;
    const workingProxies = this.workingProxies.length;
    const failedProxies = this.failedProxies.length;

    const totalRequests = Array.from(this.proxies.values()).reduce(
      (sum, proxy) => sum + proxy.totalRequests,
      0,
    );

    const totalFailures = Array.from(this.proxies.values()).reduce(
      (sum, proxy) => sum + proxy.failureCount,
      0,
    );

    const averageResponseTime =
      this.workingProxies.length > 0
        ? this.workingProxies.reduce((sum, proxy) => sum + (proxy.responseTime || 0), 0) /
          this.workingProxies.length
        : 0;

    const successRate =
      totalRequests > 0 ? ((totalRequests - totalFailures) / totalRequests) * 100 : 0;

    // 获取最佳和最差代理
    const sortedProxies = Array.from(this.proxies.values())
      .filter(proxy => proxy.totalRequests > 0)
      .sort((a, b) => b.uptime - a.uptime);

    const topPerformingProxies = sortedProxies.slice(0, 5);
    const worstPerformingProxies = sortedProxies.slice(-5).reverse();

    return {
      totalProxies,
      workingProxies,
      failedProxies,
      averageResponseTime,
      successRate,
      totalRequests,
      totalFailures,
      topPerformingProxies,
      worstPerformingProxies,
    };
  }

  /**
   * 记录代理统计信息
   */
  private logProxyStatistics(): void {
    if (!this.config.monitoring.enabled) {
      return;
    }

    const stats = this.getProxyStats();
    this.logger.log(
      `代理池统计 - 总数: ${stats.totalProxies}, 可用: ${stats.workingProxies}, ` +
        `失败: ${stats.failedProxies}, 成功率: ${stats.successRate.toFixed(2)}%, ` +
        `平均响应时间: ${stats.averageResponseTime.toFixed(0)}ms`,
    );
  }

  /**
   * 移除失效代理
   */
  removeFailedProxies(): number {
    const toRemove = Array.from(this.proxies.values()).filter(
      proxy => !proxy.isWorking && proxy.failureCount >= this.config.validation.maxFailureCount,
    );

    toRemove.forEach(proxy => {
      this.proxies.delete(proxy.id);
      this.appLogger.log('INFO', `移除失效代理: ${proxy.id}`);
    });

    this.updateProxyLists();
    return toRemove.length;
  }

  /**
   * 添加代理提供商
   */
  addProvider(provider: ProxyProvider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`添加代理提供商: ${provider.name}`);
  }

  /**
   * 从提供商获取代理
   */
  async fetchProxiesFromProviders(): Promise<number> {
    let totalFetched = 0;

    for (const provider of this.providers.values()) {
      if (!provider.isActive) {
        continue;
      }

      try {
        const proxies = await provider.fetchProxies();
        const result = await this.addProxies(proxies);
        totalFetched += result.success;

        this.logger.log(
          `从 ${provider.name} 获取代理: 成功 ${result.success}, 失败 ${result.failed}`,
        );
      } catch (error) {
        this.appLogger.error('从提供商获取代理失败', 'ProxyPoolService', error.message);
      }
    }

    return totalFetched;
  }

  /**
   * 清理资源
   */
  onModuleDestroy(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }

  /**
   * 获取配置
   */
  getConfig(): ProxyPoolConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ProxyPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.startValidationTimer(); // 重启验证定时器
    this.logger.log('代理池配置已更新');
  }
}
