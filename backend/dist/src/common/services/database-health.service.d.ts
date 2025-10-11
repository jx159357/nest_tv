import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from './app-logger.service';
export declare class DatabaseHealthService implements OnModuleInit {
    private readonly dataSource;
    private readonly configService;
    private readonly appLogger;
    private readonly logger;
    private isHealthy;
    private healthCheckInterval;
    private readonly healthCheckIntervalMs;
    constructor(dataSource: DataSource, configService: ConfigService, appLogger: AppLoggerService);
    onModuleInit(): Promise<void>;
    private initializeHealthCheck;
    checkDatabaseHealth(): Promise<boolean>;
    executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    isDatabaseHealthy(): boolean;
    getDatabaseStatus(): {
        isHealthy: boolean;
        connectionCount: number;
        lastChecked: Date;
    };
    private sleep;
    onModuleDestroy(): Promise<void>;
}
