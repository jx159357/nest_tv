import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseHealthService.name);
  private isHealthy = false;
  private healthCheckInterval: NodeJS.Timeout;
  private readonly healthCheckIntervalMs = 300000; // 30秒检查一次

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly appLogger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.initializeHealthCheck();
  }

  private async initializeHealthCheck() {
    // 初始化时立即检查一次
    await this.checkDatabaseHealth();

    // 设置定期健康检查
    this.healthCheckInterval = setInterval(
      () => this.checkDatabaseHealth(),
      this.healthCheckIntervalMs,
    );
  }

  async checkDatabaseHealth(): Promise<boolean> {
    const requestId = `db_health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const maxRetries = this.configService.get<number>('DB_RETRY_ATTEMPTS', 5);
      const retryDelay = this.configService.get<number>('DB_RETRY_DELAY', 5000);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // 测试数据库连接
          const query = 'SELECT 1 as test';
          const result = await this.dataSource.query(query);

          if (result && result[0] && result[0].test === 1) {
            if (!this.isHealthy) {
              this.appLogger.log('数据库连接已恢复', 'DATABASE_HEALTH_RECOVERED');
            }
            this.isHealthy = true;
            return true;
          }
        } catch (error) {
          this.appLogger.logDatabaseError('Health Check', error, 'SELECT 1 as test', [], requestId);

          if (attempt < maxRetries) {
            // 指数退避重试
            const delay = retryDelay * Math.pow(2, attempt - 1);
            this.appLogger.warn(`等待 ${delay}ms 后重试数据库连接...`, 'DATABASE_RETRY', requestId);
            await this.sleep(delay);
          }
        }
      }

      this.isHealthy = false;
      this.appLogger.error(
        '数据库连接失败，已达到最大重试次数',
        'DATABASE_HEALTH_FAILED',
        undefined,
        requestId,
      );
      return false;
    } catch (error) {
      this.isHealthy = false;
      this.appLogger.logDatabaseError('Health Check Exception', error, undefined, [], requestId);
      return false;
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = '数据库操作',
  ): Promise<T> {
    const requestId = `db_operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const maxRetries = this.configService.get<number>('DB_RETRY_ATTEMPTS', 5);
    const retryDelay = this.configService.get<number>('DB_RETRY_DELAY', 5000);

    let lastError: Error = new Error('未知错误');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 在执行操作前检查连接健康状态
        if (!this.isHealthy) {
          await this.checkDatabaseHealth();
        }

        const result = await operation();
        this.appLogger.log(`${context}执行成功`, 'DATABASE_OPERATION_SUCCESS');
        return result;
      } catch (error) {
        lastError = error;

        this.appLogger.logDatabaseError(context, error, undefined, [], requestId);

        if (attempt < maxRetries) {
          // 指数退避重试
          const delay = retryDelay * Math.pow(2, attempt - 1);
          this.appLogger.warn(
            `${context}重试，等待 ${delay}ms...`,
            'DATABASE_OPERATION_RETRY',
            requestId,
          );
          await this.sleep(delay);
        }
      }
    }

    this.appLogger.error(
      `${context}最终失败，已达到最大重试次数`,
      'DATABASE_OPERATION_FAILED',
      lastError.stack,
      requestId,
    );
    throw lastError;
  }

  isDatabaseHealthy(): boolean {
    return this.isHealthy;
  }

  getDatabaseStatus(): {
    isHealthy: boolean;
    connectionCount: number;
    lastChecked: Date;
  } {
    let connectionCount = 0;
    try {
      // 安全获取连接数
      const pool = (this.dataSource.driver as any).pool;
      if (pool && typeof pool.getAllConnections === 'function') {
        connectionCount = pool.getAllConnections().length;
      }
    } catch (error) {
      this.appLogger.debug('获取连接池信息失败', 'DATABASE_POOL_INFO_FAILED');
    }

    const status = {
      isHealthy: this.isHealthy,
      connectionCount,
      lastChecked: new Date(),
    };

    this.appLogger.debug(`数据库状态: ${JSON.stringify(status)}`, 'DATABASE_STATUS');
    return status;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
