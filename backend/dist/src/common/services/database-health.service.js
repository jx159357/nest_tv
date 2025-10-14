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
var DatabaseHealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHealthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const app_logger_service_1 = require("./app-logger.service");
let DatabaseHealthService = DatabaseHealthService_1 = class DatabaseHealthService {
    dataSource;
    configService;
    appLogger;
    logger = new common_1.Logger(DatabaseHealthService_1.name);
    isHealthy = false;
    healthCheckInterval;
    healthCheckIntervalMs = 300000;
    constructor(dataSource, configService, appLogger) {
        this.dataSource = dataSource;
        this.configService = configService;
        this.appLogger = appLogger;
    }
    async onModuleInit() {
        await this.initializeHealthCheck();
    }
    async initializeHealthCheck() {
        await this.checkDatabaseHealth();
        this.healthCheckInterval = setInterval(() => this.checkDatabaseHealth(), this.healthCheckIntervalMs);
    }
    async checkDatabaseHealth() {
        const requestId = `db_health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            const maxRetries = this.configService.get('DB_RETRY_ATTEMPTS', 5);
            const retryDelay = this.configService.get('DB_RETRY_DELAY', 5000);
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const query = 'SELECT 1 as test';
                    const result = await this.dataSource.query(query);
                    if (result && result[0] && result[0].test === 1) {
                        if (!this.isHealthy) {
                            this.appLogger.log('数据库连接已恢复', 'DATABASE_HEALTH_RECOVERED');
                        }
                        this.isHealthy = true;
                        return true;
                    }
                }
                catch (error) {
                    this.appLogger.logDatabaseError('Health Check', error, 'SELECT 1 as test', [], requestId);
                    if (attempt < maxRetries) {
                        const delay = retryDelay * Math.pow(2, attempt - 1);
                        this.appLogger.warn(`等待 ${delay}ms 后重试数据库连接...`, 'DATABASE_RETRY', requestId);
                        await this.sleep(delay);
                    }
                }
            }
            this.isHealthy = false;
            this.appLogger.error('数据库连接失败，已达到最大重试次数', 'DATABASE_HEALTH_FAILED', undefined, requestId);
            return false;
        }
        catch (error) {
            this.isHealthy = false;
            this.appLogger.logDatabaseError('Health Check Exception', error, undefined, [], requestId);
            return false;
        }
    }
    async executeWithRetry(operation, context = '数据库操作') {
        const requestId = `db_operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const maxRetries = this.configService.get('DB_RETRY_ATTEMPTS', 5);
        const retryDelay = this.configService.get('DB_RETRY_DELAY', 5000);
        let lastError = new Error('未知错误');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!this.isHealthy) {
                    await this.checkDatabaseHealth();
                }
                const result = await operation();
                this.appLogger.log(`${context}执行成功`, 'DATABASE_OPERATION_SUCCESS');
                return result;
            }
            catch (error) {
                lastError = error;
                this.appLogger.logDatabaseError(context, error, undefined, [], requestId);
                if (attempt < maxRetries) {
                    const delay = retryDelay * Math.pow(2, attempt - 1);
                    this.appLogger.warn(`${context}重试，等待 ${delay}ms...`, 'DATABASE_OPERATION_RETRY', requestId);
                    await this.sleep(delay);
                }
            }
        }
        this.appLogger.error(`${context}最终失败，已达到最大重试次数`, 'DATABASE_OPERATION_FAILED', lastError.stack, requestId);
        throw lastError;
    }
    isDatabaseHealthy() {
        return this.isHealthy;
    }
    getDatabaseStatus() {
        let connectionCount = 0;
        try {
            const pool = this.dataSource.driver.pool;
            if (pool && typeof pool.getAllConnections === 'function') {
                connectionCount = pool.getAllConnections().length;
            }
        }
        catch (error) {
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async onModuleDestroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
};
exports.DatabaseHealthService = DatabaseHealthService;
exports.DatabaseHealthService = DatabaseHealthService = DatabaseHealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.ConfigService,
        app_logger_service_1.AppLoggerService])
], DatabaseHealthService);
//# sourceMappingURL=database-health.service.js.map