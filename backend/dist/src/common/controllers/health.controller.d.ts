import { DatabaseHealthService } from '../services/database-health.service';
import { CacheService } from '../cache/cache.service';
import { AppLoggerService } from '../services/app-logger.service';
export declare class HealthController {
    private readonly databaseHealthService;
    private readonly cacheService;
    private readonly loggerService;
    constructor(databaseHealthService: DatabaseHealthService, cacheService: CacheService, loggerService: AppLoggerService);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        responseTime: number;
        uptime: number;
        environment: string;
        version: string;
        services: {
            database: {
                status: string;
                details: {
                    isHealthy: boolean;
                } | null;
                error: any;
            };
            redis: {
                status: string;
                details: {
                    status: string;
                    message: string;
                    responseTime: number;
                    error?: undefined;
                } | {
                    status: string;
                    message: string;
                    responseTime?: undefined;
                    error?: undefined;
                } | {
                    status: string;
                    message: string;
                    error: string;
                    responseTime?: undefined;
                } | null;
                error: any;
            };
        };
        metadata: {
            nodeVersion: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            memoryUsage: NodeJS.MemoryUsage;
            cpuUsage: NodeJS.CpuUsage;
        };
    }>;
    getDatabaseHealth(): Promise<{
        health: boolean;
        status: {
            isHealthy: boolean;
            connectionCount: number;
            lastChecked: Date;
        };
        timestamp: string;
    }>;
    getRedisHealth(): Promise<{
        status: string;
        message: string;
        responseTime: number;
        error?: undefined;
    } | {
        status: string;
        message: string;
        responseTime?: undefined;
        error?: undefined;
    } | {
        status: string;
        message: string;
        error: string;
        responseTime?: undefined;
    }>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        message: string;
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        message: string;
        error: string;
    }>;
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        message: string;
    }>;
    private checkRedisHealth;
    getMetrics(): Promise<{
        timestamp: string;
        system: {
            memory: NodeJS.MemoryUsage;
            cpu: NodeJS.CpuUsage;
            uptime: number;
            pid: number;
            version: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
        };
        database: {
            isHealthy: boolean;
            connectionCount: number;
            lastChecked: Date;
        };
        app: {
            nodeVersion: string;
            environment: string;
            version: string;
        };
    }>;
}
