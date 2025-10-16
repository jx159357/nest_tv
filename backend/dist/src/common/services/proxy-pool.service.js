"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ProxyPoolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyPoolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
const app_logger_service_1 = require("./app-logger.service");
let ProxyPoolService = ProxyPoolService_1 = class ProxyPoolService {
    configService;
    appLogger;
    logger = new common_1.Logger(ProxyPoolService_1.name);
    proxies = new Map();
    workingProxies = [];
    failedProxies = [];
    providers = new Map();
    httpClient;
    validationTimer = null;
    config;
    constructor(configService, appLogger) {
        this.configService = configService;
        this.appLogger = appLogger;
        this.config = this.getDefaultConfig();
        this.initializeHttpClient();
        this.startValidationTimer();
    }
    getDefaultConfig() {
        return {
            enabled: this.configService.get('PROXY_POOL_ENABLED', true),
            maxProxies: this.configService.get('MAX_PROXIES', 100),
            minWorkingProxies: this.configService.get('MIN_WORKING_PROXIES', 5),
            validation: {
                testUrl: this.configService.get('PROXY_TEST_URL', 'http://httpbin.org/ip'),
                timeout: this.configService.get('PROXY_TEST_TIMEOUT', 10000),
                interval: this.configService.get('PROXY_VALIDATION_INTERVAL', 300000),
                maxFailureCount: this.configService.get('PROXY_MAX_FAILURE_COUNT', 3),
                retryAttempts: this.configService.get('PROXY_RETRY_ATTEMPTS', 2),
            },
            rotation: {
                strategy: this.configService.get('PROXY_ROTATION_STRATEGY', 'best-response-time'),
                switchAfter: this.configService.get('PROXY_SWITCH_AFTER', 10),
                failureThreshold: this.configService.get('PROXY_FAILURE_THRESHOLD', 3),
            },
            cache: {
                responseTimeCache: this.configService.get('PROXY_RESPONSE_TIME_CACHE', 300000),
                proxyListCache: this.configService.get('PROXY_LIST_CACHE', 600000),
            },
            monitoring: {
                enabled: this.configService.get('PROXY_MONITORING_ENABLED', true),
                logLevel: this.configService.get('PROXY_LOG_LEVEL', 'info'),
                statisticsInterval: this.configService.get('PROXY_STATISTICS_INTERVAL', 60000),
            },
        };
    }
    initializeHttpClient() {
        this.httpClient = axios_1.default.create({
            timeout: this.config.validation.timeout,
            validateStatus: status => status < 500,
        });
    }
    startValidationTimer() {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
        this.validationTimer = setInterval(() => this.validateAllProxies(), this.config.validation.interval);
    }
    async addProxy(proxyInfo) {
        try {
            const existingProxy = this.proxies.get(proxyInfo.id);
            if (existingProxy) {
                this.logger.warn(`代理 ${proxyInfo.id} 已存在，更新信息`);
                Object.assign(existingProxy, proxyInfo);
                return true;
            }
            const testResult = await this.testProxy(proxyInfo);
            proxyInfo.lastChecked = new Date();
            proxyInfo.isWorking = testResult.success;
            proxyInfo.responseTime = testResult.responseTime;
            if (testResult.success) {
                proxyInfo.successCount = 1;
                proxyInfo.uptime = 100;
            }
            else {
                proxyInfo.failureCount = 1;
                proxyInfo.uptime = 0;
            }
            this.proxies.set(proxyInfo.id, proxyInfo);
            this.updateProxyLists();
            this.appLogger.log('INFO', `添加代理 ${proxyInfo.id}: ${testResult.success ? '成功' : '失败'}`);
            return testResult.success;
        }
        catch (error) {
            this.appLogger.error('添加代理失败', 'ProxyPoolService', error.message);
            return false;
        }
    }
    async addProxies(proxies) {
        let success = 0;
        let failed = 0;
        for (const proxy of proxies) {
            const result = await this.addProxy(proxy);
            if (result) {
                success++;
            }
            else {
                failed++;
            }
        }
        this.logger.log(`批量添加代理完成: 成功 ${success}, 失败 ${failed}`);
        return { success, failed };
    }
    async testProxy(proxy) {
        const startTime = Date.now();
        try {
            const response = await this.httpClient.get(this.config.validation.testUrl, {
                proxy: this.createAxiosProxyConfig(proxy),
                timeout: this.config.validation.timeout,
                httpsAgent: this.createHttpsAgent(proxy),
            });
            const responseTime = Date.now() - startTime;
            return {
                proxy,
                success: response.status === 200,
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                proxy,
                success: false,
                responseTime,
                error: error.message,
            };
        }
    }
    createAxiosProxyConfig(proxy) {
        const proxyConfig = {
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port,
        };
        if (proxy.username && proxy.password) {
            proxyConfig.auth = {
                username: proxy.username,
                password: proxy.password,
            };
        }
        return proxyConfig;
    }
    createHttpsAgent(proxy) {
        return new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
        });
    }
    async validateAllProxies() {
        if (!this.config.enabled) {
            return;
        }
        this.logger.log('开始验证所有代理...');
        const validationPromises = [];
        for (const proxy of this.proxies.values()) {
            validationPromises.push(this.validateProxy(proxy));
        }
        await Promise.all(validationPromises);
        this.updateProxyLists();
        this.logProxyStatistics();
    }
    async validateProxy(proxy) {
        try {
            const testResult = await this.testProxy(proxy);
            proxy.lastChecked = new Date();
            if (testResult.success) {
                proxy.successCount++;
                proxy.isWorking = true;
                proxy.responseTime = testResult.responseTime;
                proxy.uptime = (proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100;
            }
            else {
                proxy.failureCount++;
                proxy.isWorking = false;
                proxy.uptime = (proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100;
                if (proxy.failureCount >= this.config.validation.maxFailureCount) {
                    proxy.isWorking = false;
                }
            }
            proxy.totalRequests++;
        }
        catch (error) {
            proxy.failureCount++;
            proxy.totalRequests++;
            proxy.isWorking = false;
            proxy.lastChecked = new Date();
            this.appLogger.error('代理验证失败', 'ProxyPoolService', error.message);
        }
    }
    updateProxyLists() {
        const allProxies = Array.from(this.proxies.values());
        this.workingProxies = allProxies
            .filter(proxy => proxy.isWorking)
            .sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity));
        this.failedProxies = allProxies.filter(proxy => !proxy.isWorking);
    }
    getBestProxy(preferredProtocol) {
        if (this.workingProxies.length === 0) {
            this.logger.warn('没有可用的代理');
            return null;
        }
        let candidates = this.workingProxies;
        if (preferredProtocol) {
            candidates = candidates.filter(proxy => proxy.protocol === preferredProtocol);
            if (candidates.length === 0) {
                this.logger.warn(`没有找到协议为 ${preferredProtocol} 的可用代理`);
                return this.workingProxies[0];
            }
        }
        switch (this.config.rotation.strategy) {
            case 'best-response-time':
                return candidates.reduce((best, current) => (current.responseTime || Infinity) < (best.responseTime || Infinity) ? current : best);
            case 'random':
                return candidates[Math.floor(Math.random() * candidates.length)];
            case 'round-robin':
                const index = Date.now() % candidates.length;
                return candidates[index];
            case 'weighted':
                return candidates.reduce((best, current) => {
                    const bestScore = best.uptime / 100 / (best.responseTime || 1000);
                    const currentScore = current.uptime / 100 / (current.responseTime || 1000);
                    return currentScore > bestScore ? current : best;
                });
            default:
                return candidates[0];
        }
    }
    getProxyStats() {
        const totalProxies = this.proxies.size;
        const workingProxies = this.workingProxies.length;
        const failedProxies = this.failedProxies.length;
        const totalRequests = Array.from(this.proxies.values()).reduce((sum, proxy) => sum + proxy.totalRequests, 0);
        const totalFailures = Array.from(this.proxies.values()).reduce((sum, proxy) => sum + proxy.failureCount, 0);
        const averageResponseTime = this.workingProxies.length > 0
            ? this.workingProxies.reduce((sum, proxy) => sum + (proxy.responseTime || 0), 0) /
                this.workingProxies.length
            : 0;
        const successRate = totalRequests > 0 ? ((totalRequests - totalFailures) / totalRequests) * 100 : 0;
        const sortedProxies = Array.from(this.proxies.values())
            .filter(proxy => proxy.totalRequests > 0)
            .sort((a, b) => b.uptime - a.uptime);
        const topPerformingProxies = sortedProxies.slice(0, 5);
        const worstPerformingProxies = sortedProxies.slice(-5).reverse();
        return {
            totalProxies,
            workingProxies,
            failedProxies,
            averageResponseTime,
            successRate,
            totalRequests,
            totalFailures,
            topPerformingProxies,
            worstPerformingProxies,
        };
    }
    logProxyStatistics() {
        if (!this.config.monitoring.enabled) {
            return;
        }
        const stats = this.getProxyStats();
        this.logger.log(`代理池统计 - 总数: ${stats.totalProxies}, 可用: ${stats.workingProxies}, ` +
            `失败: ${stats.failedProxies}, 成功率: ${stats.successRate.toFixed(2)}%, ` +
            `平均响应时间: ${stats.averageResponseTime.toFixed(0)}ms`);
    }
    removeFailedProxies() {
        const toRemove = Array.from(this.proxies.values()).filter(proxy => !proxy.isWorking && proxy.failureCount >= this.config.validation.maxFailureCount);
        toRemove.forEach(proxy => {
            this.proxies.delete(proxy.id);
            this.appLogger.log('INFO', `移除失效代理: ${proxy.id}`);
        });
        this.updateProxyLists();
        return toRemove.length;
    }
    addProvider(provider) {
        this.providers.set(provider.name, provider);
        this.logger.log(`添加代理提供商: ${provider.name}`);
    }
    async fetchProxiesFromProviders() {
        let totalFetched = 0;
        for (const provider of this.providers.values()) {
            if (!provider.isActive) {
                continue;
            }
            try {
                const proxies = await provider.fetchProxies();
                const result = await this.addProxies(proxies);
                totalFetched += result.success;
                this.logger.log(`从 ${provider.name} 获取代理: 成功 ${result.success}, 失败 ${result.failed}`);
            }
            catch (error) {
                this.appLogger.error('从提供商获取代理失败', 'ProxyPoolService', error.message);
            }
        }
        return totalFetched;
    }
    onModuleDestroy() {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
            this.validationTimer = null;
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.startValidationTimer();
        this.logger.log('代理池配置已更新');
    }
};
exports.ProxyPoolService = ProxyPoolService;
exports.ProxyPoolService = ProxyPoolService = ProxyPoolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        app_logger_service_1.AppLoggerService])
], ProxyPoolService);
//# sourceMappingURL=proxy-pool.service.js.map