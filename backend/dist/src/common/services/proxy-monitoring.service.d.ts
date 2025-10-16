import { ProxyPoolService } from './proxy-pool.service';
import { ProxyInfo } from '../types/proxy-pool.types';
import { AppLoggerService } from './app-logger.service';
export interface ProxyMonitoringMetrics {
    timestamp: Date;
    totalProxies: number;
    workingProxies: number;
    failedProxies: number;
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    totalFailures: number;
    requestsPerMinute: number;
    topPerformers: ProxyInfo[];
    worstPerformers: ProxyInfo[];
}
export interface ProxyAlert {
    type: 'low_working_proxies' | 'high_failure_rate' | 'slow_response' | 'pool_empty';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    metadata: any;
}
export declare class ProxyMonitoringService {
    private readonly proxyPoolService;
    private readonly appLogger;
    private readonly logger;
    private metricsHistory;
    private alerts;
    private lastRequestCount;
    private readonly maxHistorySize;
    constructor(proxyPoolService: ProxyPoolService, appLogger: AppLoggerService);
    collectMetrics(): void;
    private addToHistory;
    private checkAlerts;
    private isDuplicateAlert;
    private logAlert;
    private getLogLevel;
    private logKeyMetrics;
    getCurrentMetrics(): ProxyMonitoringMetrics | null;
    getMetricsHistory(minutes?: number): ProxyMonitoringMetrics[];
    getActiveAlerts(hours?: number): ProxyAlert[];
    getPerformanceReport(hours?: number): any;
    getHealthScore(): number;
    generateHealthReport(): any;
    private getHealthStatus;
    private getRecommendations;
}
