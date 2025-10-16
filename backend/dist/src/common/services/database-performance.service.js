"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DatabasePerformanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabasePerformanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let DatabasePerformanceService = DatabasePerformanceService_1 = class DatabasePerformanceService {
    connection;
    logger = new common_1.Logger(DatabasePerformanceService_1.name);
    SLOW_QUERY_THRESHOLD = 1000;
    queryStats = new Map();
    constructor(connection) {
        this.connection = connection;
        this.setupQueryLogging();
    }
    setupQueryLogging() {
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug('数据库性能监控已启用');
        }
    }
    async logQueryPerformance(operation, startTime, query, parameters) {
        const duration = Date.now() - startTime;
        this.updateQueryStats(operation, duration);
        if (duration > this.SLOW_QUERY_THRESHOLD) {
            this.logger.warn(`慢查询检测: ${operation} 耗时 ${duration}ms\n` +
                `SQL: ${query.substring(0, 200)}...\n` +
                `参数: ${JSON.stringify(parameters)}`);
        }
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`查询性能: ${operation} | 耗时: ${duration}ms | SQL: ${query.substring(0, 100)}...`);
        }
    }
    updateQueryStats(operation, duration) {
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
    getPerformanceReport() {
        let totalQueries = 0;
        let totalTime = 0;
        const slowQueries = [];
        const operations = [];
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
    getConnectionStats() {
        try {
            const pool = this.connection.driver.master?.pool;
            if (pool) {
                return {
                    totalConnections: pool.pool.allConnections.length,
                    activeConnections: pool.pool.allConnections.length - pool.pool.freeConnections.length,
                    freeConnections: pool.pool.freeConnections.length,
                    queuedRequests: pool.pool.acquiringConnections.length,
                };
            }
        }
        catch (error) {
            this.logger.warn('无法获取连接池统计信息', error);
        }
        return {
            totalConnections: 'unknown',
            activeConnections: 'unknown',
            freeConnections: 'unknown',
            queuedRequests: 'unknown',
        };
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.connection.query('SELECT 1');
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime < 1000 ? 'healthy' : 'unhealthy',
                responseTime,
                connectionPool: this.getConnectionStats(),
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message,
            };
        }
    }
    getOptimizationSuggestions() {
        const suggestions = [];
        const report = this.getPerformanceReport();
        if (report.slowQueries.length > 0) {
            suggestions.push(`发现 ${report.slowQueries.length} 个慢查询，建议检查索引和查询优化`);
        }
        if (report.averageTime > 100) {
            suggestions.push('平均查询响应时间较长，建议优化数据库索引');
        }
        const poolStats = report.connectionStats;
        if (poolStats.activeConnections && poolStats.totalConnections) {
            const utilizationRate = poolStats.activeConnections / poolStats.totalConnections;
            if (utilizationRate > 0.8) {
                suggestions.push('连接池利用率过高，建议增加连接池大小');
            }
        }
        return suggestions;
    }
    clearStats() {
        this.queryStats.clear();
        this.logger.debug('查询统计数据已清理');
    }
    getOperationStats(operation) {
        return this.queryStats.get(operation);
    }
};
exports.DatabasePerformanceService = DatabasePerformanceService;
exports.DatabasePerformanceService = DatabasePerformanceService = DatabasePerformanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], DatabasePerformanceService);
//# sourceMappingURL=database-performance.service.js.map