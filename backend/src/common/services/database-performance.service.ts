import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

/**
 * 数据库性能监控服务
 * 监控查询性能、连接池状态和慢查询
 */
@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);

  // 慢查询阈值（毫秒）
  private readonly SLOW_QUERY_THRESHOLD = 1000;

  // 查询统计
  private queryStats: Map<
    string,
    {
      count: number;
      totalTime: number;
      avgTime: number;
      maxTime: number;
      minTime: number;
      lastExecuted: Date;
    }
  > = new Map();

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.setupQueryLogging();
  }

  /**
   * 设置查询日志记录
   */
  private setupQueryLogging(): void {
    if (process.env.NODE_ENV === 'development') {
      // 开发环境下记录查询日志（简化版本）
      this.logger.debug('数据库性能监控已启用');
    }
  }

  /**
   * 记录查询性能
   */
  async logQueryPerformance(
    operation: string,
    startTime: number,
    query: string,
    parameters?: any[],
  ): Promise<void> {
    const duration = Date.now() - startTime;

    // 更新查询统计
    this.updateQueryStats(operation, duration);

    // 记录慢查询
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.logger.warn(
        `慢查询检测: ${operation} 耗时 ${duration}ms\n` +
          `SQL: ${query.substring(0, 200)}...\n` +
          `参数: ${JSON.stringify(parameters)}`,
      );
    }

    // 调试日志
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `查询性能: ${operation} | 耗时: ${duration}ms | SQL: ${query.substring(0, 100)}...`,
      );
    }
  }

  /**
   * 更新查询统计信息
   */
  private updateQueryStats(operation: string, duration: number): void {
    const stats = this.queryStats.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      lastExecuted: new Date(),
    };

    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
    stats.lastExecuted = new Date();

    this.queryStats.set(operation, stats);
  }

  /**
   * 获取查询性能报告
   */
  getPerformanceReport(): {
    totalQueries: number;
    averageTime: number;
    slowQueries: Array<{ operation: string; avgTime: number; count: number }>;
    topOperations: Array<{ operation: string; count: number; avgTime: number }>;
    connectionStats: any;
  } {
    let totalQueries = 0;
    let totalTime = 0;
    const slowQueries: Array<{ operation: string; avgTime: number; count: number }> = [];
    const operations: Array<{ operation: string; count: number; avgTime: number }> = [];

    for (const [operation, stats] of this.queryStats.entries()) {
      totalQueries += stats.count;
      totalTime += stats.totalTime;

      operations.push({
        operation,
        count: stats.count,
        avgTime: Math.round(stats.avgTime * 100) / 100,
      });

      if (stats.avgTime > this.SLOW_QUERY_THRESHOLD) {
        slowQueries.push({
          operation,
          avgTime: Math.round(stats.avgTime * 100) / 100,
          count: stats.count,
        });
      }
    }

    const averageTime = totalQueries > 0 ? totalTime / totalQueries : 0;

    return {
      totalQueries,
      averageTime: Math.round(averageTime * 100) / 100,
      slowQueries: slowQueries.sort((a, b) => b.avgTime - a.avgTime),
      topOperations: operations.sort((a, b) => b.count - a.count).slice(0, 10),
      connectionStats: this.getConnectionStats(),
    };
  }

  /**
   * 获取连接池统计信息
   */
  private getConnectionStats(): any {
    try {
      // MySQL 连接池统计
      const pool = (this.connection.driver as any).master?.pool;
      if (pool) {
        return {
          totalConnections: pool.pool.allConnections.length,
          activeConnections: pool.pool.allConnections.length - pool.pool.freeConnections.length,
          freeConnections: pool.pool.freeConnections.length,
          queuedRequests: pool.pool.acquiringConnections.length,
        };
      }
    } catch (error) {
      this.logger.warn('无法获取连接池统计信息', error);
    }

    return {
      totalConnections: 'unknown',
      activeConnections: 'unknown',
      freeConnections: 'unknown',
      queuedRequests: 'unknown',
    };
  }

  /**
   * 检查数据库健康状态
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    connectionPool?: any;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // 执行简单查询测试连接
      await this.connection.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'unhealthy',
        responseTime,
        connectionPool: this.getConnectionStats(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * 优化建议
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const report = this.getPerformanceReport();

    // 检查慢查询
    if (report.slowQueries.length > 0) {
      suggestions.push(`发现 ${report.slowQueries.length} 个慢查询，建议检查索引和查询优化`);
    }

    // 检查平均响应时间
    if (report.averageTime > 100) {
      suggestions.push('平均查询响应时间较长，建议优化数据库索引');
    }

    // 检查连接池
    const poolStats = report.connectionStats;
    if (poolStats.activeConnections && poolStats.totalConnections) {
      const utilizationRate = poolStats.activeConnections / poolStats.totalConnections;
      if (utilizationRate > 0.8) {
        suggestions.push('连接池利用率过高，建议增加连接池大小');
      }
    }

    return suggestions;
  }

  /**
   * 清理统计数据
   */
  clearStats(): void {
    this.queryStats.clear();
    this.logger.debug('查询统计数据已清理');
  }

  /**
   * 获取特定操作的统计信息
   */
  getOperationStats(operation: string) {
    return this.queryStats.get(operation);
  }
}
