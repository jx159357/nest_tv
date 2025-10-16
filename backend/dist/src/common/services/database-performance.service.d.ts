import { Connection } from 'typeorm';
export declare class DatabasePerformanceService {
    private readonly connection;
    private readonly logger;
    private readonly SLOW_QUERY_THRESHOLD;
    private queryStats;
    constructor(connection: Connection);
    private setupQueryLogging;
    logQueryPerformance(operation: string, startTime: number, query: string, parameters?: any[]): Promise<void>;
    private updateQueryStats;
    getPerformanceReport(): {
        totalQueries: number;
        averageTime: number;
        slowQueries: Array<{
            operation: string;
            avgTime: number;
            count: number;
        }>;
        topOperations: Array<{
            operation: string;
            count: number;
            avgTime: number;
        }>;
        connectionStats: any;
    };
    private getConnectionStats;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        connectionPool?: any;
        error?: string;
    }>;
    getOptimizationSuggestions(): string[];
    clearStats(): void;
    getOperationStats(operation: string): {
        count: number;
        totalTime: number;
        avgTime: number;
        maxTime: number;
        minTime: number;
        lastExecuted: Date;
    } | undefined;
}
