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
exports.PerformanceMonitoringMiddleware = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("../common/services/app-logger.service");
let PerformanceMonitoringMiddleware = class PerformanceMonitoringMiddleware {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    use(req, res, next) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();
        const { method, originalUrl } = req;
        const requestId = this.generateRequestId();
        req.headers['x-request-id'] = requestId;
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const endTime = Date.now();
            const endMemory = process.memoryUsage();
            const responseTime = endTime - startTime;
            const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
            const { statusCode } = res;
            this.logPerformanceMetrics({
                requestId,
                method,
                url: originalUrl,
                statusCode,
                responseTime,
                memoryUsage,
                timestamp: new Date().toISOString(),
            });
            return originalEnd.call(res, chunk, encoding);
        }.bind(this);
        next();
    }
    logPerformanceMetrics(metrics) {
        const { responseTime, statusCode, memoryUsage } = metrics;
        this.logger.logPerformance(`${metrics.method} ${metrics.url}`, responseTime, {
            statusCode,
            memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)}MB`,
            requestId: metrics.requestId,
        });
        if (responseTime > 5000) {
            this.logger.warn(`Slow request detected: ${metrics.method} ${metrics.url} took ${responseTime}ms`, 'PERFORMANCE_WARNING');
        }
        const heapUsedInMB = memoryUsage / 1024 / 1024;
        if (heapUsedInMB > 500) {
            this.logger.warn(`High memory usage detected: ${heapUsedInMB.toFixed(2)}MB`, 'MEMORY_WARNING');
        }
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.PerformanceMonitoringMiddleware = PerformanceMonitoringMiddleware;
exports.PerformanceMonitoringMiddleware = PerformanceMonitoringMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], PerformanceMonitoringMiddleware);
//# sourceMappingURL=performance-monitoring.middleware.js.map