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
    uptime: number;
    tags?: string[];
}
export interface ProxyPoolConfig {
    enabled: boolean;
    maxProxies: number;
    minWorkingProxies: number;
    validation: {
        testUrl: string;
        timeout: number;
        interval: number;
        maxFailureCount: number;
        retryAttempts: number;
    };
    rotation: {
        strategy: 'round-robin' | 'random' | 'best-response-time' | 'weighted';
        switchAfter: number;
        failureThreshold: number;
    };
    cache: {
        responseTimeCache: number;
        proxyListCache: number;
    };
    monitoring: {
        enabled: boolean;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        statisticsInterval: number;
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
