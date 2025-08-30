import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerformanceMonitorService implements OnModuleInit {
  private readonly metrics = {
    requests: { count: 0, duration: [] },
    errors: { count: 0, lastError: null as any },
    database: { slowQueries: [] as Array<{ query: string; duration: number }> },
    memory: { usage: [] as Array<{ timestamp: number; usage: number }> }
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // 设置内存监控
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.startMemoryMonitoring();
    }
  }

  // 记录请求性能
  recordRequest(duration: number, method: string, path: string, statusCode: number) {
    this.metrics.requests.count++;
    this.metrics.requests.duration.push({ duration, method, path, statusCode, timestamp: Date.now() });
    
    // 只保留最近1000条记录
    if (this.metrics.requests.duration.length > 1000) {
      this.metrics.requests.duration = this.metrics.requests.duration.slice(-1000);
    }

    // 记录慢请求（超过500ms）
    if (duration > 500) {
      console.warn(`⚠️ Slow request detected: ${method} ${path} - ${duration}ms`);
    }

    // 记录错误请求
    if (statusCode >= 400) {
      this.metrics.errors.count++;
      this.metrics.errors.lastError = {
        method, path, statusCode, timestamp: Date.now()
      };
    }
  }

  // 记录数据库查询性能
  recordDatabaseQuery(query: string, duration: number) {
    // 记录慢查询（超过100ms）
    if (duration > 100) {
      this.metrics.database.slowQueries.push({ query, duration, timestamp: Date.now() });
      
      // 只保留最近100条慢查询
      if (this.metrics.database.slowQueries.length > 100) {
        this.metrics.database.slowQueries = this.metrics.database.slowQueries.slice(-100);
      }
      
      console.warn(`🐌 Slow database query detected: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    const now = Date.now();
    const lastHour = now - 3600000; // 1小时前
    const lastDay = now - 86400000; // 1天前

    const recentRequests = this.metrics.requests.duration.filter(r => r.timestamp > lastHour);
    const todayErrors = this.metrics.requests.duration.filter(r => r.timestamp > lastDay && r.statusCode >= 400);
    const recentSlowQueries = this.metrics.database.slowQueries.filter(q => q.timestamp > lastHour);

    const avgRequestDuration = recentRequests.length > 0 
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length 
      : 0;

    const memoryStats = this.getMemoryStats();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: this.metrics.requests.count,
        totalErrors: this.metrics.errors.count,
        errorRate: this.metrics.requests.count > 0 
          ? (this.metrics.errors.count / this.metrics.requests.count * 100).toFixed(2) + '%'
          : '0%',
        avgRequestDuration: Math.round(avgRequestDuration) + 'ms',
        slowQueryCount: this.metrics.database.slowQueries.length,
        memoryUsage: memoryStats.current + 'MB',
        uptime: process.uptime()
      },
      details: {
        recentRequests: recentRequests.slice(-10).map(r => ({
          method: r.method,
          path: r.path,
          duration: r.duration + 'ms',
          statusCode: r.statusCode,
          timestamp: new Date(r.timestamp).toISOString()
        })),
        slowQueries: recentSlowQueries.slice(-5).map(q => ({
          duration: q.duration + 'ms',
          query: q.query.substring(0, 200) + (q.query.length > 200 ? '...' : ''),
          timestamp: new Date(q.timestamp).toISOString()
        })),
        memoryTrend: memoryStats.trend,
        lastError: this.metrics.errors.lastError ? {
          ...this.metrics.errors.lastError,
          timestamp: new Date(this.metrics.errors.lastError.timestamp).toISOString()
        } : null
      }
    };
  }

  // 获取内存统计
  private getMemoryStats() {
    const usage = process.memoryUsage();
    const current = Math.round(usage.heapUsed / 1024 / 1024); // MB
    
    // 记录内存使用情况
    this.metrics.memory.usage.push({
      timestamp: Date.now(),
      usage: current
    });

    // 只保留最近100条记录
    if (this.metrics.memory.usage.length > 100) {
      this.metrics.memory.usage = this.metrics.memory.usage.slice(-100);
    }

    // 计算内存使用趋势
    const trend = this.calculateMemoryTrend();

    return {
      current,
      peak: Math.max(...this.metrics.memory.usage.map(m => m.usage)),
      average: Math.round(this.metrics.memory.usage.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.usage.length),
      trend
    };
  }

  // 计算内存使用趋势
  private calculateMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
    const usage = this.metrics.memory.usage;
    if (usage.length < 10) return 'stable';

    const recent = usage.slice(-5);
    const older = usage.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.usage, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.usage, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 10) return 'increasing';
    if (diff < -10) return 'decreasing';
    return 'stable';
  }

  // 启动内存监控
  private startMemoryMonitoring() {
    setInterval(() => {
      const report = this.getPerformanceReport();
      
      // 如果内存使用过高，记录警告
      if (parseInt(report.summary.memoryUsage) > 500) {
        console.warn(`⚠️ High memory usage detected: ${report.summary.memoryUsage}`);
      }
      
      // 如果错误率过高，记录警告
      if (parseFloat(report.summary.errorRate) > 5) {
        console.warn(`⚠️ High error rate detected: ${report.summary.errorRate}`);
      }
      
    }, 300000); // 每5分钟检查一次
  }

  // 重置统计数据（通常在凌晨执行）
  resetMetrics() {
    this.metrics.requests = { count: 0, duration: [] };
    this.metrics.errors = { count: 0, lastError: null };
    this.metrics.database.slowQueries = [];
    console.log('📊 Performance metrics reset');
  }
}