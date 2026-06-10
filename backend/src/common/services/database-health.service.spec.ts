import type { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import type { AppLoggerService } from './app-logger.service';
import { DatabaseHealthService } from './database-health.service';

describe('DatabaseHealthService', () => {
  const dataSource = {
    query: jest.fn(),
    driver: {},
  } as unknown as DataSource & {
    query: jest.Mock;
  };

  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService & {
    get: jest.Mock;
  };

  const appLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logDatabaseError: jest.fn(),
  } as unknown as AppLoggerService & {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    logDatabaseError: jest.Mock;
  };

  let service: DatabaseHealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, number> = {
        DB_HEALTH_RETRY_ATTEMPTS: 1,
        DB_HEALTH_RETRY_DELAY: 1,
        DB_CONNECTION_CHECK_TIMEOUT: 50,
        DB_HEALTH_FAILURE_LOG_THROTTLE_MS: 300000,
        DB_RETRY_ATTEMPTS: 1,
        DB_RETRY_DELAY: 1,
      };
      return values[key];
    });
    service = new DatabaseHealthService(dataSource, configService, appLogger);
  });

  it('can run a silent health probe without logging database health failures', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));

    const healthy = await service.checkDatabaseHealth({ maxRetries: 1, logFailure: false });

    expect(healthy).toBe(false);
    expect(appLogger.error).not.toHaveBeenCalledWith(
      expect.any(String),
      'DATABASE_HEALTH_FAILED',
      expect.anything(),
      expect.any(String),
    );
  });

  it('throttles repeated database health failure logs', async () => {
    dataSource.query
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockRejectedValueOnce(new Error('connection refused'));

    await service.checkDatabaseHealth({ maxRetries: 1 });
    await service.checkDatabaseHealth({ maxRetries: 1 });

    expect(appLogger.error).toHaveBeenCalledTimes(1);
    expect(appLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('connection refused'),
      'DATABASE_HEALTH_FAILED',
      expect.any(String),
      expect.any(String),
    );
    expect(appLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('connection refused'),
      'DATABASE_HEALTH_STILL_FAILED',
      expect.any(String),
    );
  });

  it('does not emit health failure logs from executeWithRetry preflight probes', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));

    const result = await service.executeWithRetry(() => Promise.resolve('ok'), 'demo operation');

    expect(result).toBe('ok');
    expect(appLogger.error).not.toHaveBeenCalledWith(
      expect.any(String),
      'DATABASE_HEALTH_FAILED',
      expect.anything(),
      expect.any(String),
    );
  });
});
