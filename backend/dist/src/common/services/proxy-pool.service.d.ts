import { ConfigService } from '@nestjs/config';
import { ProxyInfo, ProxyPoolConfig, ProxyStats, ProxyProvider, ProxyTestResult } from '../types/proxy-pool.types';
import { AppLoggerService } from './app-logger.service';
export declare class ProxyPoolService {
    private readonly configService;
    private readonly appLogger;
    private readonly logger;
    private proxies;
    private workingProxies;
    private failedProxies;
    private providers;
    private httpClient;
    private validationTimer;
    private config;
    constructor(configService: ConfigService, appLogger: AppLoggerService);
    private getDefaultConfig;
    private initializeHttpClient;
    private startValidationTimer;
    addProxy(proxyInfo: ProxyInfo): Promise<boolean>;
    addProxies(proxies: ProxyInfo[]): Promise<{
        success: number;
        failed: number;
    }>;
    testProxy(proxy: ProxyInfo): Promise<ProxyTestResult>;
    private createAxiosProxyConfig;
    private createHttpsAgent;
    validateAllProxies(): Promise<void>;
    private validateProxy;
    private updateProxyLists;
    getBestProxy(preferredProtocol?: string): ProxyInfo | null;
    getProxyStats(): ProxyStats;
    private logProxyStatistics;
    removeFailedProxies(): number;
    addProvider(provider: ProxyProvider): void;
    fetchProxiesFromProviders(): Promise<number>;
    onModuleDestroy(): void;
    getConfig(): ProxyPoolConfig;
    updateConfig(newConfig: Partial<ProxyPoolConfig>): void;
}
