import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProxyPoolService } from './proxy-pool.service';
import { ProxyStats, ProxyInfo } from '../types/proxy-pool.types';
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

@Injectable()
export class ProxyMonitoringService {
  private readonly logger = new Logger(ProxyMonitoringService.name);
  private metricsHistory: ProxyMonitoringMetrics[] = [];
  private alerts: ProxyAlert[] = [];
  private lastRequestCount = 0;
  private readonly maxHistorySize = 1440; // 24小时的分钟数

  constructor(
    private readonly proxyPoolService: ProxyPoolService,
    private readonly appLogger: AppLoggerService,
  ) {
    // 检查代理池是否启用
    this.checkProxyPoolEnabled();
  }

  /**
   * 检查代理池启用状态
   */
  private checkProxyPoolEnabled(): void {
    const isEnabled = process.env.PROXY_POOL_ENABLED === 'true';
    if (!isEnabled) {
      this.logger.log('代理池功能已禁用，监控将跳过');
    }
  }

  /**
   * 每分钟收集代理池指标
   */
  @Cron('0 * * * * *') // 每分钟执行
  collectMetrics(): void {
    try {
      // 检查代理池是否启用
      if (process.env.PROXY_POOL_ENABLED !== 'true') {
        return; // 如果代理池禁用，跳过监控
      }

      const currentStats = this.proxyPoolService.getProxyStats();
      const metrics: ProxyMonitoringMetrics = {
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

      // 添加到历史记录
      this.addToHistory(metrics);

      // 更新请求计数
      this.lastRequestCount = currentStats.totalRequests;

      // 检查告警条件
      this.checkAlerts(metrics);

      // 记录关键指标
      this.logKeyMetrics(metrics);
    } catch (error) {
      this.appLogger.error('收集代理池指标失败', 'ProxyMonitoringService', error.message);
    }
  }

  /**
   * 添加指标到历史记录
   */
  private addToHistory(metrics: ProxyMonitoringMetrics): void {
    this.metricsHistory.push(metrics);

    // 保持历史记录在限制范围内
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(metrics: ProxyMonitoringMetrics): void {
    const alerts: ProxyAlert[] = [];

    // 检查可用代理数量过低
    if (metrics.workingProxies < 5) {
      alerts.push({
        type: 'low_working_proxies',
        severity: metrics.workingProxies < 2 ? 'critical' : 'high',
        message: `可用代理数量过低: ${metrics.workingProxies}`,
        timestamp: new Date(),
        metadata: { workingProxies: metrics.workingProxies, totalProxies: metrics.totalProxies },
      });
    }

    // 检查失败率过高
    if (metrics.successRate < 70 && metrics.totalRequests > 10) {
      alerts.push({
        type: 'high_failure_rate',
        severity: metrics.successRate < 50 ? 'high' : 'medium',
        message: `代理失败率过高: ${(100 - metrics.successRate).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { successRate: metrics.successRate, totalRequests: metrics.totalRequests },
      });
    }

    // 检查响应时间过慢
    if (metrics.averageResponseTime > 10000 && metrics.workingProxies > 0) {
      alerts.push({
        type: 'slow_response',
        severity: metrics.averageResponseTime > 20000 ? 'high' : 'medium',
        message: `代理响应时间过慢: ${metrics.averageResponseTime.toFixed(0)}ms`,
        timestamp: new Date(),
        metadata: { averageResponseTime: metrics.averageResponseTime },
      });
    }

    // 检查代理池为空
    if (metrics.totalProxies === 0) {
      alerts.push({
        type: 'pool_empty',
        severity: 'critical',
        message: '代理池为空，无法获取代理',
        timestamp: new Date(),
        metadata: {},
      });
    }

    // 添加新告警
    for (const alert of alerts) {
      if (!this.isDuplicateAlert(alert)) {
        this.alerts.push(alert);
        this.logAlert(alert);
      }
    }

    // 清理过期告警（保留24小时）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
  }

  /**
   * 检查是否为重复告警
   */
  private isDuplicateAlert(newAlert: ProxyAlert): boolean {
    const recentAlerts = this.alerts.filter(
      alert =>
        alert.type === newAlert.type && Date.now() - alert.timestamp.getTime() < 30 * 60 * 1000, // 30分钟内
    );
    return recentAlerts.length > 0;
  }

  /**
   * 记录告警
   */
  private logAlert(alert: ProxyAlert): void {
    const logMethod = this.getLogLevel(alert.severity);
    logMethod.call(
      this.logger,
      `代理池告警 [${alert.severity.toUpperCase()}] ${alert.message}`,
      alert.metadata,
    );

    this.appLogger.warn(`代理池告警: ${alert.message}`, 'ProxyMonitoringService');
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: string): Function {
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

  /**
   * 记录关键指标
   */
  private logKeyMetrics(metrics: ProxyMonitoringMetrics): void {
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

    // 每10分钟记录详细统计
    if (metrics.timestamp.getMinutes() % 10 === 0) {
      this.logger.log(
        `代理池指标 - 总数: ${metrics.totalProxies}, 可用: ${metrics.workingProxies}, ` +
          `成功率: ${metrics.successRate.toFixed(1)}%, 平均响应: ${metrics.averageResponseTime.toFixed(0)}ms, ` +
          `每分钟请求: ${metrics.requestsPerMinute}`,
      );
    }
  }

  /**
   * 获取当前监控指标
   */
  getCurrentMetrics(): ProxyMonitoringMetrics | null {
    return this.metricsHistory.length > 0
      ? this.metricsHistory[this.metricsHistory.length - 1]
      : null;
  }

  /**
   * 获取历史指标
   */
  getMetricsHistory(minutes: number = 60): ProxyMonitoringMetrics[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter(metric => metric.timestamp > cutoffTime);
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(hours: number = 24): ProxyAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(hours: number = 24): any {
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

  /**
   * 获取代理健康评分
   */
  getHealthScore(): number {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics || currentMetrics.totalProxies === 0) {
      return 0;
    }

    let score = 100;

    // 可用代理数量评分 (40%权重)
    const workingRatio = currentMetrics.workingProxies / Math.max(currentMetrics.totalProxies, 1);
    score -= (1 - workingRatio) * 40;

    // 成功率评分 (30%权重)
    score -= (100 - currentMetrics.successRate) * 0.3;

    // 响应时间评分 (20%权重)
    if (currentMetrics.averageResponseTime > 10000) {
      score -= 20;
    } else if (currentMetrics.averageResponseTime > 5000) {
      score -= 10;
    } else if (currentMetrics.averageResponseTime > 2000) {
      score -= 5;
    }

    // 活跃告警扣分 (10%权重)
    const activeAlerts = this.getActiveAlerts(1);
    score -= activeAlerts.filter(a => a.severity === 'critical').length * 10;
    score -= activeAlerts.filter(a => a.severity === 'high').length * 5;
    score -= activeAlerts.filter(a => a.severity === 'medium').length * 2;

    return Math.max(0, Math.round(score));
  }

  /**
   * 生成健康报告
   */
  generateHealthReport(): any {
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

  /**
   * 获取健康状态
   */
  private getHealthStatus(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * 获取优化建议
   */
  private getRecommendations(
    score: number,
    metrics: ProxyMonitoringMetrics | null,
    alerts: ProxyAlert[],
  ): string[] {
    const recommendations: string[] = [];

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
}
