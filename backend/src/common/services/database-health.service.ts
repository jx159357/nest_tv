import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from './app-logger.service';

interface HealthCheckRow {
  test: number;
}

interface DataSourceDriverWithPool {
  pool?: {
    getAllConnections?: () => unknown[];
  };
}

interface HealthCheckOptions {
  maxRetries?: number;
  logFailure?: boolean;
}

@Injectable()
export class DatabaseHealthService implements OnModuleInit, OnModuleDestroy {
  private isHealthy = false;
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private readonly healthCheckIntervalMs = 300000; // 5分钟检查一次
  private lastFailureLogAt = 0;

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
    this.healthCheckInterval = setInterval(() => {
      void this.checkDatabaseHealth();
    }, this.healthCheckIntervalMs);
  }

  async checkDatabaseHealth(options: HealthCheckOptions = {}): Promise<boolean> {
    const requestId = `db_health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const maxRetries =
        options.maxRetries ??
        this.getNumberConfig(
          'DB_HEALTH_RETRY_ATTEMPTS',
          Math.min(this.getNumberConfig('DB_RETRY_ATTEMPTS', 5), 2),
        );
      const retryDelay = this.getNumberConfig(
        'DB_HEALTH_RETRY_DELAY',
        Math.min(this.getNumberConfig('DB_RETRY_DELAY', 5000), 2000),
      );
      const queryTimeout = this.getNumberConfig('DB_CONNECTION_CHECK_TIMEOUT', 30000);
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.runHealthQuery(queryTimeout);

          if (result && result[0] && result[0].test === 1) {
            if (!this.isHealthy) {
              this.appLogger.log('数据库连接已恢复', 'DATABASE_HEALTH_RECOVERED');
            }
            this.isHealthy = true;
            this.lastFailureLogAt = 0;
            return true;
          }
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            this.appLogger.warn(`等待 ${delay}ms 后重试数据库连接...`, 'DATABASE_RETRY', requestId);
            await this.sleep(delay);
          }
        }
      }

      const wasHealthy = this.isHealthy;
      this.isHealthy = false;
      if (options.logFailure !== false) {
        this.logHealthFailureIfNeeded(lastError, wasHealthy, maxRetries, requestId);
      }
      return false;
    } catch (error: unknown) {
      const wasHealthy = this.isHealthy;
      this.isHealthy = false;
      if (options.logFailure !== false) {
        this.logHealthFailureIfNeeded(
          error instanceof Error ? error : new Error(String(error)),
          wasHealthy,
          1,
          requestId,
        );
      }
      return false;
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = '数据库操作',
  ): Promise<T> {
    const requestId = `db_operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const maxRetries = this.getNumberConfig('DB_RETRY_ATTEMPTS', 5);
    const retryDelay = this.getNumberConfig('DB_RETRY_DELAY', 5000);

    let lastError: Error = new Error('未知错误');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 在执行操作前检查连接健康状态
        if (!this.isHealthy) {
          await this.checkDatabaseHealth({ maxRetries: 1, logFailure: false });
        }

        const result = await operation();
        this.appLogger.log(`${context}执行成功`, 'DATABASE_OPERATION_SUCCESS');
        return result;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.appLogger.logDatabaseError(context, lastError, undefined, [], requestId);

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
      const pool = (this.dataSource.driver as DataSourceDriverWithPool).pool;
      if (pool && typeof pool.getAllConnections === 'function') {
        connectionCount = pool.getAllConnections().length;
      }
    } catch {
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

  private getNumberConfig(key: string, defaultValue: number): number {
    const value = this.configService.get<string | number>(key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return defaultValue;
  }

  private async runHealthQuery(timeoutMs: number): Promise<HealthCheckRow[]> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`数据库健康检查超时 ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        this.dataSource.query<HealthCheckRow[]>('SELECT 1 as test'),
        timeout,
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private logHealthFailureIfNeeded(
    error: Error | null,
    wasHealthy: boolean,
    attempts: number,
    requestId: string,
  ): void {
    const now = Date.now();
    const throttleMs = this.getNumberConfig('DB_HEALTH_FAILURE_LOG_THROTTLE_MS', 300000);
    const shouldLogError = wasHealthy || now - this.lastFailureLogAt >= throttleMs;
    const message = error?.message
      ? `数据库连接失败，已达到最大重试次数（${attempts}次）：${error.message}`
      : `数据库连接失败，已达到最大重试次数（${attempts}次）`;

    if (shouldLogError) {
      this.lastFailureLogAt = now;
      this.appLogger.error(message, 'DATABASE_HEALTH_FAILED', error?.stack, requestId);
      return;
    }

    this.appLogger.debug(message, 'DATABASE_HEALTH_STILL_FAILED', requestId);
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
