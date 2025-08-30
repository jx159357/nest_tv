import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class PerformanceMonitorService implements OnModuleInit {
    private readonly configService;
    private readonly metrics;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    recordRequest(duration: number, method: string, path: string, statusCode: number): void;
    recordDatabaseQuery(query: string, duration: number): void;
    getPerformanceReport(): {
        timestamp: string;
        summary: {
            totalRequests: number;
            totalErrors: number;
            errorRate: string;
            avgRequestDuration: string;
            slowQueryCount: number;
            memoryUsage: string;
            uptime: number;
        };
        details: {
            recentRequests: {
                method: any;
                path: any;
                duration: string;
                statusCode: any;
                timestamp: string;
            }[];
            slowQueries: {
                duration: string;
                query: string;
                timestamp: string;
            }[];
            memoryTrend: "increasing" | "stable" | "decreasing";
            lastError: any;
        };
    };
    private getMemoryStats;
    private calculateMemoryTrend;
    private startMemoryMonitoring;
    resetMetrics(): void;
}
