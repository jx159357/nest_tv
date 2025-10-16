import { ProxyPoolService } from '../common/services/proxy-pool.service';
import { ProxyProviderService } from '../common/services/proxy-provider.service';
import { ProxyMonitoringService } from '../common/services/proxy-monitoring.service';
import { ProxyInfo } from '../common/types/proxy-pool.types';
export declare class ProxyPoolController {
    private readonly proxyPoolService;
    private readonly proxyProviderService;
    private readonly proxyMonitoringService;
    constructor(proxyPoolService: ProxyPoolService, proxyProviderService: ProxyProviderService, proxyMonitoringService: ProxyMonitoringService);
    getProxyStats(): import("../common/types/proxy-pool.types").ProxyStats;
    getHealthReport(): any;
    getHealthScore(): {
        score: number;
        status: any;
    };
    getMetrics(minutes?: number): {
        current: import("../common/services/proxy-monitoring.service").ProxyMonitoringMetrics | null;
        history: import("../common/services/proxy-monitoring.service").ProxyMonitoringMetrics[];
    };
    getAlerts(hours?: number): import("../common/services/proxy-monitoring.service").ProxyAlert[];
    getPerformanceReport(hours?: number): any;
    getProviders(): {
        providers: {
            name: string;
            active: boolean;
            priority: number;
        }[];
        active: import("../common/types/proxy-pool.types").ProxyProvider[];
    };
    getProxies(status?: string, protocol?: string): {
        total: number;
        proxies: ProxyInfo[];
    };
    refreshProxies(): Promise<{
        success: boolean;
        message: string;
        result: number;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        result?: undefined;
    }>;
    testProxy(proxyData: {
        host: string;
        port: number;
        protocol?: 'http' | 'https' | 'socks4' | 'socks5';
    }): Promise<{
        success: boolean;
        result: import("../common/types/proxy-pool.types").ProxyTestResult;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        result?: undefined;
    }>;
    removeFailedProxies(): {
        success: boolean;
        message: string;
        removed: number;
    };
    getConfig(): import("../common/types/proxy-pool.types").ProxyPoolConfig;
    updateConfig(config: any): {
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    };
    toggleProvider(providerName: string, body: {
        active: boolean;
    }): {
        success: boolean;
        message: string;
    };
    getBestProxy(protocol?: string): {
        success: boolean;
        proxy: ProxyInfo | null;
    };
}
