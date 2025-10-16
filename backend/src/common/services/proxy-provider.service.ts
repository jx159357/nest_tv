import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ProxyProvider, ProxyInfo } from '../types/proxy-pool.types';
import { AppLoggerService } from './app-logger.service';

/**
 * 免费代理提供商基类
 */
export abstract class BaseFreeProxyProvider implements ProxyProvider {
  protected httpClient: AxiosInstance;
  protected logger: Logger;
  protected appLogger: AppLoggerService;

  constructor(
    name: string,
    protected appLoggerService: AppLoggerService,
    protected timeout: number = 10000,
  ) {
    this.logger = new Logger(name);
    this.appLogger = appLoggerService;
    this.httpClient = axios.create({
      timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
  }

  abstract fetchProxies(): Promise<ProxyInfo[]>;

  abstract get name(): string;
  abstract get isActive(): boolean;
  abstract get priority(): number;

  /**
   * 解析代理字符串 (IP:PORT)
   */
  protected parseProxyString(proxyStr: string, source: string): ProxyInfo | null {
    try {
      const parts = proxyStr.trim().split(':');
      if (parts.length !== 2) {
        return null;
      }

      const host = parts[0];
      const port = parseInt(parts[1]);

      if (!this.isValidHost(host) || !this.isValidPort(port)) {
        return null;
      }

      return {
        id: `${source}_${host}_${port}`,
        host,
        port,
        protocol: 'http',
        source,
        addedAt: new Date(),
        isWorking: false,
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        uptime: 0,
        tags: ['free'],
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 验证主机地址
   */
  private isValidHost(host: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(host);
  }

  /**
   * 验证端口
   */
  private isValidPort(port: number): boolean {
    return port > 0 && port <= 65535;
  }

  /**
   * 生成唯一ID
   */
  protected generateId(host: string, port: number, source: string): string {
    return `${source}_${host}_${port}_${Date.now()}`;
  }
}

/**
 * 快代理免费API提供商
 */
@Injectable()
export class KuaiDailiFreeProvider extends BaseFreeProxyProvider implements ProxyProvider {
  readonly name = 'KuaiDailiFree';
  readonly isActive = true;
  readonly priority = 1;

  constructor(appLoggerService: AppLoggerService) {
    super('KuaiDailiFree', appLoggerService);
  }

  async fetchProxies(): Promise<ProxyInfo[]> {
    const proxies: ProxyInfo[] = [];

    try {
      // 快代理免费API
      const apiUrl = 'http://www.kuaidaili.com/free/inha/';
      const response = await this.httpClient.get(apiUrl);

      // 这里需要根据实际的API响应格式进行解析
      // 由于快代理的免费API可能需要复杂的HTML解析，这里提供一个基础实现
      const proxyMatches = response.data.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || [];

      for (const proxyStr of proxyMatches) {
        const proxy = this.parseProxyString(proxyStr, this.name);
        if (proxy) {
          proxies.push(proxy);
        }
      }

      this.logger.log(`从快代理获取 ${proxies.length} 个代理`);
    } catch (error) {
      this.appLogger.error('从快代理获取代理失败', 'KuaiDailiFreeProvider', error.message);
    }

    return proxies;
  }
}

/**
 * 西刺代理提供商
 */
@Injectable()
export class XiciProxyProvider extends BaseFreeProxyProvider implements ProxyProvider {
  readonly name = 'XiciProxy';
  readonly isActive = true;
  readonly priority = 2;

  constructor(appLoggerService: AppLoggerService) {
    super('XiciProxy', appLoggerService);
  }

  async fetchProxies(): Promise<ProxyInfo[]> {
    const proxies: ProxyInfo[] = [];

    try {
      // 西刺代理免费页面
      const apiUrl = 'https://www.xicidaili.com/nn/';
      const response = await this.httpClient.get(apiUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      // 使用正则表达式提取IP:PORT
      const proxyMatches = response.data.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || [];

      for (const proxyStr of proxyMatches) {
        const proxy = this.parseProxyString(proxyStr, this.name);
        if (proxy) {
          proxies.push(proxy);
        }
      }

      this.logger.log(`从西刺代理获取 ${proxies.length} 个代理`);
    } catch (error) {
      this.appLogger.error('从西刺代理获取代理失败', 'XiciProxyProvider', error.message);
    }

    return proxies;
  }
}

/**
 * 89IP代理提供商
 */
@Injectable()
export class Proxy89Provider extends BaseFreeProxyProvider implements ProxyProvider {
  readonly name = 'Proxy89';
  readonly isActive = true;
  readonly priority = 3;

  constructor(appLoggerService: AppLoggerService) {
    super('Proxy89', appLoggerService);
  }

  async fetchProxies(): Promise<ProxyInfo[]> {
    const proxies: ProxyInfo[] = [];

    try {
      // 89IP免费API
      const apiUrl = 'https://www.89ip.cn/api/index?format=text';
      const response = await this.httpClient.get(apiUrl);

      // 89IP返回的是纯文本格式，每行一个IP:PORT
      const lines = response.data.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const proxy = this.parseProxyString(line.trim(), this.name);
        if (proxy) {
          proxies.push(proxy);
        }
      }

      this.logger.log(`从89IP获取 ${proxies.length} 个代理`);
    } catch (error) {
      this.appLogger.error('从89IP获取代理失败', 'Proxy89Provider', error.message);
    }

    return proxies;
  }
}

/**
 * 小幻代理提供商
 */
@Injectable()
export class XiaoHuanProxyProvider extends BaseFreeProxyProvider implements ProxyProvider {
  readonly name = 'XiaoHuanProxy';
  readonly isActive = true;
  readonly priority = 4;

  constructor(appLoggerService: AppLoggerService) {
    super('XiaoHuanProxy', appLoggerService);
  }

  async fetchProxies(): Promise<ProxyInfo[]> {
    const proxies: ProxyInfo[] = [];

    try {
      // 小幻代理API
      const apiUrl = 'https://ip.ihuan.me/api/proxy_ips';
      const response = await this.httpClient.get(apiUrl, {
        headers: {
          Referer: 'https://ip.ihuan.me/',
        },
      });

      // 解析JSON响应
      const data = response.data;
      if (data.data && Array.isArray(data.data.proxy)) {
        for (const item of data.data.proxy) {
          const proxyStr = `${item.ip}:${item.port}`;
          const proxy = this.parseProxyString(proxyStr, this.name);

          if (proxy) {
            // 添加额外信息
            proxy.country = item.country || '';
            proxy.responseTime = item.speed || undefined;
            proxies.push(proxy);
          }
        }
      }

      this.logger.log(`从小幻代理获取 ${proxies.length} 个代理`);
    } catch (error) {
      this.appLogger.error('从小幻代理获取代理失败', 'XiaoHuanProxyProvider', error.message);
    }

    return proxies;
  }
}

/**
 * 代理提供商管理服务
 */
@Injectable()
export class ProxyProviderService {
  private readonly logger = new Logger(ProxyProviderService.name);
  private providers: Map<string, ProxyProvider> = new Map();

  constructor(
    private readonly kuaiDailiProvider: KuaiDailiFreeProvider,
    private readonly xiciProvider: XiciProxyProvider,
    private readonly proxy89Provider: Proxy89Provider,
    private readonly xiaoHuanProvider: XiaoHuanProxyProvider,
  ) {
    this.initializeProviders();
  }

  /**
   * 初始化提供商
   */
  private initializeProviders(): void {
    this.providers.set(this.kuaiDailiProvider.name, this.kuaiDailiProvider);
    this.providers.set(this.xiciProvider.name, this.xiciProvider);
    this.providers.set(this.proxy89Provider.name, this.proxy89Provider);
    this.providers.set(this.xiaoHuanProvider.name, this.xiaoHuanProvider);

    this.logger.log(`初始化 ${this.providers.size} 个代理提供商`);
  }

  /**
   * 获取所有提供商
   */
  getAllProviders(): ProxyProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 获取活跃的提供商
   */
  getActiveProviders(): ProxyProvider[] {
    return this.getAllProviders().filter(provider => provider.isActive);
  }

  /**
   * 根据优先级获取提供商
   */
  getProvidersByPriority(): ProxyProvider[] {
    return this.getActiveProviders().sort((a, b) => a.priority - b.priority);
  }

  /**
   * 添加自定义提供商
   */
  addProvider(provider: ProxyProvider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`添加代理提供商: ${provider.name}`);
  }

  /**
   * 移除提供商
   */
  removeProvider(name: string): boolean {
    const removed = this.providers.delete(name);
    if (removed) {
      this.logger.log(`移除代理提供商: ${name}`);
    }
    return removed;
  }

  /**
   * 启用/禁用提供商
   */
  toggleProvider(name: string, active: boolean): boolean {
    const provider = this.providers.get(name);
    if (provider) {
      (provider as any).isActive = active;
      this.logger.log(`${active ? '启用' : '禁用'}代理提供商: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 从所有活跃提供商获取代理
   */
  async fetchAllProxies(): Promise<{ [provider: string]: ProxyInfo[] }> {
    const result: { [provider: string]: ProxyInfo[] } = {};
    const activeProviders = this.getActiveProviders();

    for (const provider of activeProviders) {
      try {
        this.logger.log(`从 ${provider.name} 获取代理...`);
        const proxies = await provider.fetchProxies();
        result[provider.name] = proxies;
        this.logger.log(`从 ${provider.name} 获取到 ${proxies.length} 个代理`);
      } catch (error) {
        this.logger.error(`从 ${provider.name} 获取代理失败:`, error);
        result[provider.name] = [];
      }
    }

    return result;
  }

  /**
   * 获取提供商统计信息
   */
  getProviderStats(): { name: string; active: boolean; priority: number }[] {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      active: provider.isActive,
      priority: provider.priority,
    }));
  }
}
