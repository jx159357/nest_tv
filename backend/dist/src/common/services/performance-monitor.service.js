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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PerformanceMonitorService = class PerformanceMonitorService {
    configService;
    metrics = {
        requests: {
            count: 0,
            duration: []
        },
        errors: { count: 0, lastError: null },
        database: {
            slowQueries: []
        },
        memory: { usage: [] }
    };
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        if (this.configService.get('NODE_ENV') === 'production') {
            this.startMemoryMonitoring();
        }
    }
    recordRequest(duration, method, path, statusCode) {
        this.metrics.requests.count++;
        this.metrics.requests.duration.push({ duration, method, path, statusCode, timestamp: Date.now() });
        if (this.metrics.requests.duration.length > 1000) {
            this.metrics.requests.duration = this.metrics.requests.duration.slice(-1000);
        }
        if (duration > 500) {
            console.warn(`⚠️ Slow request detected: ${method} ${path} - ${duration}ms`);
        }
        if (statusCode >= 400) {
            this.metrics.errors.count++;
            this.metrics.errors.lastError = {
                method, path, statusCode, timestamp: Date.now()
            };
        }
    }
    recordDatabaseQuery(query, duration) {
        if (duration > 100) {
            this.metrics.database.slowQueries.push({ query, duration, timestamp: Date.now() });
            if (this.metrics.database.slowQueries.length > 100) {
                this.metrics.database.slowQueries = this.metrics.database.slowQueries.slice(-100);
            }
            console.warn(`🐌 Slow database query detected: ${duration}ms - ${query.substring(0, 100)}...`);
        }
    }
    getPerformanceReport() {
        const now = Date.now();
        const lastHour = now - 3600000;
        const lastDay = now - 86400000;
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
    getMemoryStats() {
        const usage = process.memoryUsage();
        const current = Math.round(usage.heapUsed / 1024 / 1024);
        this.metrics.memory.usage.push({
            timestamp: Date.now(),
            usage: current
        });
        if (this.metrics.memory.usage.length > 100) {
            this.metrics.memory.usage = this.metrics.memory.usage.slice(-100);
        }
        const trend = this.calculateMemoryTrend();
        return {
            current,
            peak: Math.max(...this.metrics.memory.usage.map(m => m.usage)),
            average: Math.round(this.metrics.memory.usage.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.usage.length),
            trend
        };
    }
    calculateMemoryTrend() {
        const usage = this.metrics.memory.usage;
        if (usage.length < 10)
            return 'stable';
        const recent = usage.slice(-5);
        const older = usage.slice(-10, -5);
        const recentAvg = recent.reduce((sum, m) => sum + m.usage, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.usage, 0) / older.length;
        const diff = recentAvg - olderAvg;
        if (diff > 10)
            return 'increasing';
        if (diff < -10)
            return 'decreasing';
        return 'stable';
    }
    startMemoryMonitoring() {
        setInterval(() => {
            const report = this.getPerformanceReport();
            if (parseInt(report.summary.memoryUsage) > 500) {
                console.warn(`⚠️ High memory usage detected: ${report.summary.memoryUsage}`);
            }
            if (parseFloat(report.summary.errorRate) > 5) {
                console.warn(`⚠️ High error rate detected: ${report.summary.errorRate}`);
            }
        }, 300000);
    }
    resetMetrics() {
        this.metrics.requests = { count: 0, duration: [] };
        this.metrics.errors = { count: 0, lastError: null };
        this.metrics.database.slowQueries = [];
        console.log('📊 Performance metrics reset');
    }
};
exports.PerformanceMonitorService = PerformanceMonitorService;
exports.PerformanceMonitorService = PerformanceMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PerformanceMonitorService);
//# sourceMappingURL=performance-monitor.service.js.map