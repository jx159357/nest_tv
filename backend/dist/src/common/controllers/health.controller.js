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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const database_health_service_1 = require("../services/database-health.service");
const cache_service_1 = require("../cache/cache.service");
const app_logger_service_1 = require("../services/app-logger.service");
let HealthController = class HealthController {
    databaseHealthService;
    cacheService;
    loggerService;
    constructor(databaseHealthService, cacheService, loggerService) {
        this.databaseHealthService = databaseHealthService;
        this.cacheService = cacheService;
        this.loggerService = loggerService;
    }
    async getHealth() {
        const startTime = Date.now();
        const [databaseHealth, redisHealth] = await Promise.allSettled([
            this.databaseHealthService.checkDatabaseHealth(),
            this.checkRedisHealth(),
        ]);
        const responseTime = Date.now() - startTime;
        const result = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            responseTime,
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            services: {
                database: {
                    status: databaseHealth.status === 'fulfilled' && databaseHealth.value ? 'healthy' : 'unhealthy',
                    details: databaseHealth.status === 'fulfilled' ? { isHealthy: databaseHealth.value } : null,
                    error: databaseHealth.status === 'rejected' ? databaseHealth.reason?.message : null,
                },
                redis: {
                    status: redisHealth.status === 'fulfilled' && redisHealth.value ? 'healthy' : 'unhealthy',
                    details: redisHealth.status === 'fulfilled' ? redisHealth.value : null,
                    error: redisHealth.status === 'rejected' ? redisHealth.reason?.message : null,
                },
            },
            metadata: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
            },
        };
        const unhealthyServices = Object.values(result.services).filter(service => service.status !== 'healthy');
        if (unhealthyServices.length > 0) {
            result.status = 'unhealthy';
        }
        this.loggerService.log(`健康检查完成 - 状态: ${result.status}, 响应时间: ${responseTime}ms`);
        return result;
    }
    async getDatabaseHealth() {
        const health = await this.databaseHealthService.checkDatabaseHealth();
        const status = this.databaseHealthService.getDatabaseStatus();
        return {
            health,
            status,
            timestamp: new Date().toISOString(),
        };
    }
    async getRedisHealth() {
        return this.checkRedisHealth();
    }
    async getReadiness() {
        try {
            await this.databaseHealthService.checkDatabaseHealth();
            if (process.env.REDIS_HOST) {
                await this.checkRedisHealth();
            }
            return {
                status: 'ready',
                timestamp: new Date().toISOString(),
                message: '应用已准备好接收请求',
            };
        }
        catch (error) {
            return {
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                message: '应用未准备好',
                error: error instanceof Error ? error.message : '未知错误',
            };
        }
    }
    async getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            message: '应用正在运行',
        };
    }
    async checkRedisHealth() {
        try {
            const testKey = `health_check_${Date.now()}`;
            const testValue = 'ok';
            await this.cacheService.set(testKey, testValue, { ttl: 10 });
            const retrievedValue = await this.cacheService.get(testKey);
            await this.cacheService.delete(testKey);
            if (retrievedValue === testValue) {
                return {
                    status: 'healthy',
                    message: 'Redis连接正常',
                    responseTime: 0,
                };
            }
            else {
                return {
                    status: 'unhealthy',
                    message: 'Redis读写测试失败',
                };
            }
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Redis连接失败',
                error: error instanceof Error ? error.message : '未知错误',
            };
        }
    }
    async getMetrics() {
        const dbStatus = this.databaseHealthService.getDatabaseStatus();
        return {
            timestamp: new Date().toISOString(),
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime(),
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            database: dbStatus,
            app: {
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development',
                version: '1.0.0',
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '系统健康检查',
        description: '检查数据库、Redis等核心服务的健康状态，返回系统整体健康状况和各服务详细状态'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '系统健康',
        schema: {
            type: 'object',
            example: {
                status: 'healthy',
                timestamp: '2024-01-01T00:00:00.000Z',
                responseTime: 45,
                uptime: 3600,
                environment: 'development',
                version: '1.0.0',
                services: {
                    database: {
                        status: 'healthy',
                        details: {
                            isHealthy: true,
                            connectionCount: 5,
                            maxConnections: 100,
                            responseTime: 12
                        },
                        error: null
                    },
                    redis: {
                        status: 'healthy',
                        details: {
                            status: 'healthy',
                            message: 'Redis连接正常',
                            responseTime: 3
                        },
                        error: null
                    }
                },
                metadata: {
                    nodeVersion: 'v18.0.0',
                    platform: 'win32',
                    arch: 'x64',
                    memoryUsage: {
                        rss: 52428800,
                        heapTotal: 31457280,
                        heapUsed: 20971520,
                        external: 2097152
                    },
                    cpuUsage: {
                        user: 1200000,
                        system: 800000
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        description: '服务异常',
        schema: {
            type: 'object',
            example: {
                status: 'unhealthy',
                timestamp: '2024-01-01T00:00:00.000Z',
                responseTime: 5000,
                services: {
                    database: {
                        status: 'unhealthy',
                        details: null,
                        error: 'Connection timeout'
                    },
                    redis: {
                        status: 'healthy',
                        details: {
                            status: 'healthy',
                            message: 'Redis连接正常'
                        },
                        error: null
                    }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('database'),
    (0, swagger_1.ApiOperation)({ summary: '数据库健康检查', description: '专门检查数据库连接状态' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDatabaseHealth", null);
__decorate([
    (0, common_1.Get)('redis'),
    (0, swagger_1.ApiOperation)({ summary: 'Redis健康检查', description: '专门检查Redis连接状态' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getRedisHealth", null);
__decorate([
    (0, common_1.Get)('readiness'),
    (0, swagger_1.ApiOperation)({ summary: '就绪检查', description: '检查应用是否准备好接收请求' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
__decorate([
    (0, common_1.Get)('liveness'),
    (0, swagger_1.ApiOperation)({ summary: '存活检查', description: '检查应用是否正在运行' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: '系统指标', description: '获取系统性能指标' }),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getMetrics", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('系统管理'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [database_health_service_1.DatabaseHealthService,
        cache_service_1.CacheService,
        app_logger_service_1.AppLoggerService])
], HealthController);
//# sourceMappingURL=health.controller.js.map