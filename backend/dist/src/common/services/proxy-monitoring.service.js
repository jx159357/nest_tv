"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProxyMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const proxy_pool_service_1 = require("./proxy-pool.service");
const app_logger_service_1 = require("./app-logger.service");
let ProxyMonitoringService = ProxyMonitoringService_1 = class ProxyMonitoringService {
    proxyPoolService;
    appLogger;
    logger = new common_1.Logger(ProxyMonitoringService_1.name);
    metricsHistory = [];
    alerts = [];
    lastRequestCount = 0;
    maxHistorySize = 1440;
    constructor(proxyPoolService, appLogger) {
        this.proxyPoolService = proxyPoolService;
        this.appLogger = appLogger;
        this.checkProxyPoolEnabled();
    }
    checkProxyPoolEnabled() {
        const isEnabled = process.env.PROXY_POOL_ENABLED === 'true';
        if (!isEnabled) {
            this.logger.log('代理池功能已禁用，监控将跳过');
        }
    }
    collectMetrics() {
        try {
            if (process.env.PROXY_POOL_ENABLED !== 'true') {
                return;
            }
            const currentStats = this.proxyPoolService.getProxyStats();
            const metrics = {
                timestamp: new Date(),
                totalProxies: currentStats.totalProxies,
                workingProxies: currentStats.workingProxies,
                failedProxies: currentStats.failedProxies,
                averageResponseTime: currentStats.averageResponseTime,
                successRate: currentStats.successRate,
                totalRequests: currentStats.totalRequests,
                totalFailures: currentStats.totalFailures,
                requestsPerMinute: currentStats.totalRequests - this.lastRequestCount,
                topPerformers: currentStats.topPerformingProxies.slice(0, 3),
                worstPerformers: currentStats.worstPerformingProxies.slice(0, 3),
            };
            this.addToHistory(metrics);
            this.lastRequestCount = currentStats.totalRequests;
            this.checkAlerts(metrics);
            this.logKeyMetrics(metrics);
        }
        catch (error) {
            this.appLogger.error('收集代理池指标失败', 'ProxyMonitoringService', error.message);
        }
    }
    addToHistory(metrics) {
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }
    }
    checkAlerts(metrics) {
        const alerts = [];
        if (metrics.workingProxies < 5) {
            alerts.push({
                type: 'low_working_proxies',
                severity: metrics.workingProxies < 2 ? 'critical' : 'high',
                message: `可用代理数量过低: ${metrics.workingProxies}`,
                timestamp: new Date(),
                metadata: { workingProxies: metrics.workingProxies, totalProxies: metrics.totalProxies },
            });
        }
        if (metrics.successRate < 70 && metrics.totalRequests > 10) {
            alerts.push({
                type: 'high_failure_rate',
                severity: metrics.successRate < 50 ? 'high' : 'medium',
                message: `代理失败率过高: ${(100 - metrics.successRate).toFixed(1)}%`,
                timestamp: new Date(),
                metadata: { successRate: metrics.successRate, totalRequests: metrics.totalRequests },
            });
        }
        if (metrics.averageResponseTime > 10000 && metrics.workingProxies > 0) {
            alerts.push({
                type: 'slow_response',
                severity: metrics.averageResponseTime > 20000 ? 'high' : 'medium',
                message: `代理响应时间过慢: ${metrics.averageResponseTime.toFixed(0)}ms`,
                timestamp: new Date(),
                metadata: { averageResponseTime: metrics.averageResponseTime },
            });
        }
        if (metrics.totalProxies === 0) {
            alerts.push({
                type: 'pool_empty',
                severity: 'critical',
                message: '代理池为空，无法获取代理',
                timestamp: new Date(),
                metadata: {},
            });
        }
        for (const alert of alerts) {
            if (!this.isDuplicateAlert(alert)) {
                this.alerts.push(alert);
                this.logAlert(alert);
            }
        }
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
    }
    isDuplicateAlert(newAlert) {
        const recentAlerts = this.alerts.filter(alert => alert.type === newAlert.type && Date.now() - alert.timestamp.getTime() < 30 * 60 * 1000);
        return recentAlerts.length > 0;
    }
    logAlert(alert) {
        const logMethod = this.getLogLevel(alert.severity);
        logMethod.call(this.logger, `代理池告警 [${alert.severity.toUpperCase()}] ${alert.message}`, alert.metadata);
        this.appLogger.warn(`代理池告警: ${alert.message}`, 'ProxyMonitoringService');
    }
    getLogLevel(severity) {
        switch (severity) {
            case 'critical':
                return this.logger.error.bind(this.logger);
            case 'high':
                return this.logger.warn.bind(this.logger);
            case 'medium':
                return this.logger.log.bind(this.logger);
            default:
                return this.logger.debug.bind(this.logger);
        }
    }
    logKeyMetrics(metrics) {
        if (metrics.workingProxies === 0) {
            this.logger.error('代理池状态: 无可用代理');
            return;
        }
        if (metrics.successRate < 80) {
            this.logger.warn(`代理成功率较低: ${metrics.successRate.toFixed(1)}%`);
        }
        if (metrics.averageResponseTime > 8000) {
            this.logger.warn(`代理响应时间较慢: ${metrics.averageResponseTime.toFixed(0)}ms`);
        }
        if (metrics.timestamp.getMinutes() % 10 === 0) {
            this.logger.log(`代理池指标 - 总数: ${metrics.totalProxies}, 可用: ${metrics.workingProxies}, ` +
                `成功率: ${metrics.successRate.toFixed(1)}%, 平均响应: ${metrics.averageResponseTime.toFixed(0)}ms, ` +
                `每分钟请求: ${metrics.requestsPerMinute}`);
        }
    }
    getCurrentMetrics() {
        return this.metricsHistory.length > 0
            ? this.metricsHistory[this.metricsHistory.length - 1]
            : null;
    }
    getMetricsHistory(minutes = 60) {
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        return this.metricsHistory.filter(metric => metric.timestamp > cutoffTime);
    }
    getActiveAlerts(hours = 24) {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }
    getPerformanceReport(hours = 24) {
        const metrics = this.getMetricsHistory(hours);
        if (metrics.length === 0) {
            return { error: '没有可用的指标数据' };
        }
        const workingProxies = metrics.map(m => m.workingProxies);
        const successRates = metrics.map(m => m.successRate);
        const responseTimes = metrics.map(m => m.averageResponseTime);
        const requestsPerMinute = metrics.map(m => m.requestsPerMinute);
        return {
            timeRange: `${hours}小时`,
            dataPoints: metrics.length,
            workingProxies: {
                min: Math.min(...workingProxies),
                max: Math.max(...workingProxies),
                avg: workingProxies.reduce((sum, val) => sum + val, 0) / workingProxies.length,
                current: workingProxies[workingProxies.length - 1],
            },
            successRate: {
                min: Math.min(...successRates),
                max: Math.max(...successRates),
                avg: successRates.reduce((sum, val) => sum + val, 0) / successRates.length,
                current: successRates[successRates.length - 1],
            },
            responseTime: {
                min: Math.min(...responseTimes),
                max: Math.max(...responseTimes),
                avg: responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length,
                current: responseTimes[responseTimes.length - 1],
            },
            throughput: {
                min: Math.min(...requestsPerMinute),
                max: Math.max(...requestsPerMinute),
                avg: requestsPerMinute.reduce((sum, val) => sum + val, 0) / requestsPerMinute.length,
                total: metrics.reduce((sum, val) => sum + val.requestsPerMinute, 0),
            },
            alerts: {
                critical: this.getActiveAlerts(hours).filter(a => a.severity === 'critical').length,
                high: this.getActiveAlerts(hours).filter(a => a.severity === 'high').length,
                medium: this.getActiveAlerts(hours).filter(a => a.severity === 'medium').length,
                low: this.getActiveAlerts(hours).filter(a => a.severity === 'low').length,
            },
        };
    }
    getHealthScore() {
        const currentMetrics = this.getCurrentMetrics();
        if (!currentMetrics || currentMetrics.totalProxies === 0) {
            return 0;
        }
        let score = 100;
        const workingRatio = currentMetrics.workingProxies / Math.max(currentMetrics.totalProxies, 1);
        score -= (1 - workingRatio) * 40;
        score -= (100 - currentMetrics.successRate) * 0.3;
        if (currentMetrics.averageResponseTime > 10000) {
            score -= 20;
        }
        else if (currentMetrics.averageResponseTime > 5000) {
            score -= 10;
        }
        else if (currentMetrics.averageResponseTime > 2000) {
            score -= 5;
        }
        const activeAlerts = this.getActiveAlerts(1);
        score -= activeAlerts.filter(a => a.severity === 'critical').length * 10;
        score -= activeAlerts.filter(a => a.severity === 'high').length * 5;
        score -= activeAlerts.filter(a => a.severity === 'medium').length * 2;
        return Math.max(0, Math.round(score));
    }
    generateHealthReport() {
        const currentMetrics = this.getCurrentMetrics();
        const healthScore = this.getHealthScore();
        const activeAlerts = this.getActiveAlerts(24);
        return {
            score: healthScore,
            status: this.getHealthStatus(healthScore),
            timestamp: new Date(),
            metrics: currentMetrics,
            alerts: {
                total: activeAlerts.length,
                critical: activeAlerts.filter(a => a.severity === 'critical').length,
                high: activeAlerts.filter(a => a.severity === 'high').length,
                medium: activeAlerts.filter(a => a.severity === 'medium').length,
                low: activeAlerts.filter(a => a.severity === 'low').length,
            },
            recommendations: this.getRecommendations(healthScore, currentMetrics, activeAlerts),
        };
    }
    getHealthStatus(score) {
        if (score >= 90)
            return 'excellent';
        if (score >= 75)
            return 'good';
        if (score >= 60)
            return 'fair';
        if (score >= 40)
            return 'poor';
        return 'critical';
    }
    getRecommendations(score, metrics, alerts) {
        const recommendations = [];
        if (!metrics) {
            recommendations.push('启动代理池监控以获取详细建议');
            return recommendations;
        }
        if (metrics.workingProxies < 5) {
            recommendations.push('增加更多代理源或检查现有代理的连接状态');
        }
        if (metrics.successRate < 70) {
            recommendations.push('检查网络连接，考虑更换更可靠的代理提供商');
        }
        if (metrics.averageResponseTime > 8000) {
            recommendations.push('优化代理选择策略，优先选择响应速度更快的代理');
        }
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
            recommendations.push('立即处理关键告警，确保代理池稳定运行');
        }
        if (score < 50) {
            recommendations.push('代理池状态较差，建议进行全面检查和优化');
        }
        if (recommendations.length === 0) {
            recommendations.push('代理池运行状态良好，继续保持当前配置');
        }
        return recommendations;
    }
};
exports.ProxyMonitoringService = ProxyMonitoringService;
__decorate([
    (0, schedule_1.Cron)('0 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyMonitoringService.prototype, "collectMetrics", null);
exports.ProxyMonitoringService = ProxyMonitoringService = ProxyMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [proxy_pool_service_1.ProxyPoolService,
        app_logger_service_1.AppLoggerService])
], ProxyMonitoringService);
//# sourceMappingURL=proxy-monitoring.service.js.map