/**
 * 代理池相关类型定义
 */

export interface ProxyInfo {
  id: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
  country?: string;
  source: string;
  addedAt: Date;
  lastChecked?: Date;
  isWorking: boolean;
  responseTime?: number;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  uptime: number; // 可用性百分比
  tags?: string[]; // 标签，如 'free', 'paid', 'fast'
}

export interface ProxyPoolConfig {
  // 基础配置
  enabled: boolean;
  maxProxies: number; // 最大代理数量
  minWorkingProxies: number; // 最少可用代理数量

  // 验证配置
  validation: {
    testUrl: string; // 测试URL
    timeout: number; // 超时时间（毫秒）
    interval: number; // 检查间隔（毫秒）
    maxFailureCount: number; // 最大失败次数
    retryAttempts: number; // 重试次数
  };

  // 轮换策略
  rotation: {
    strategy: 'round-robin' | 'random' | 'best-response-time' | 'weighted';
    switchAfter: number; // 使用多少次后切换
    failureThreshold: number; // 失败阈值
  };

  // 缓存配置
  cache: {
    responseTimeCache: number; // 响应时间缓存时间
    proxyListCache: number; // 代理列表缓存时间
  };

  // 监控配置
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    statisticsInterval: number; // 统计间隔（毫秒）
  };
}

export interface ProxyStats {
  totalProxies: number;
  workingProxies: number;
  failedProxies: number;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  totalFailures: number;
  topPerformingProxies: ProxyInfo[];
  worstPerformingProxies: ProxyInfo[];
}

export interface ProxyProvider {
  name: string;
  baseUrl?: string;
  fetchProxies(): Promise<ProxyInfo[]>;
  isActive: boolean;
  priority: number;
}

export interface ProxyTestResult {
  proxy: ProxyInfo;
  success: boolean;
  responseTime?: number;
  error?: string;
}

export interface ProxyRequestConfig {
  timeout?: number;
  retries?: number;
  useProxy?: boolean;
  preferredProtocol?: 'http' | 'https' | 'socks4' | 'socks5';
  skipFailedProxies?: boolean;
}
