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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyPoolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_pool_service_1 = require("../common/services/proxy-pool.service");
const proxy_provider_service_1 = require("../common/services/proxy-provider.service");
const proxy_monitoring_service_1 = require("../common/services/proxy-monitoring.service");
let ProxyPoolController = class ProxyPoolController {
    proxyPoolService;
    proxyProviderService;
    proxyMonitoringService;
    constructor(proxyPoolService, proxyProviderService, proxyMonitoringService) {
        this.proxyPoolService = proxyPoolService;
        this.proxyProviderService = proxyProviderService;
        this.proxyMonitoringService = proxyMonitoringService;
    }
    getProxyStats() {
        return this.proxyPoolService.getProxyStats();
    }
    getHealthReport() {
        return this.proxyMonitoringService.generateHealthReport();
    }
    getHealthScore() {
        return {
            score: this.proxyMonitoringService.getHealthScore(),
            status: this.proxyMonitoringService.generateHealthReport().status,
        };
    }
    getMetrics(minutes) {
        return {
            current: this.proxyMonitoringService.getCurrentMetrics(),
            history: this.proxyMonitoringService.getMetricsHistory(minutes || 60),
        };
    }
    getAlerts(hours) {
        return this.proxyMonitoringService.getActiveAlerts(hours || 24);
    }
    getPerformanceReport(hours) {
        return this.proxyMonitoringService.getPerformanceReport(hours || 24);
    }
    getProviders() {
        return {
            providers: this.proxyProviderService.getProviderStats(),
            active: this.proxyProviderService.getActiveProviders(),
        };
    }
    getProxies(status, protocol) {
        const stats = this.proxyPoolService.getProxyStats();
        let proxies = [];
        if (status === 'working') {
            proxies = stats.topPerformingProxies;
        }
        else if (status === 'failed') {
            proxies = stats.worstPerformingProxies;
        }
        else {
            proxies = [...stats.topPerformingProxies, ...stats.worstPerformingProxies];
        }
        if (protocol) {
            proxies = proxies.filter(proxy => proxy.protocol === protocol);
        }
        return {
            total: proxies.length,
            proxies,
        };
    }
    async refreshProxies() {
        try {
            const result = await this.proxyPoolService.fetchProxiesFromProviders();
            return {
                success: true,
                message: '代理池刷新成功',
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: '代理池刷新失败',
                error: error.message,
            };
        }
    }
    async testProxy(proxyData) {
        const proxyInfo = {
            id: `test_${proxyData.host}_${proxyData.port}`,
            host: proxyData.host,
            port: proxyData.port,
            protocol: proxyData.protocol || 'http',
            source: 'manual_test',
            addedAt: new Date(),
            isWorking: false,
            successCount: 0,
            failureCount: 0,
            totalRequests: 0,
            uptime: 0,
        };
        try {
            const result = await this.proxyPoolService.testProxy(proxyInfo);
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    removeFailedProxies() {
        const removed = this.proxyPoolService.removeFailedProxies();
        return {
            success: true,
            message: `已清理 ${removed} 个失效代理`,
            removed,
        };
    }
    getConfig() {
        return this.proxyPoolService.getConfig();
    }
    updateConfig(config) {
        try {
            this.proxyPoolService.updateConfig(config);
            return {
                success: true,
                message: '配置更新成功',
            };
        }
        catch (error) {
            return {
                success: false,
                message: '配置更新失败',
                error: error.message,
            };
        }
    }
    toggleProvider(providerName, body) {
        const success = this.proxyProviderService.toggleProvider(providerName, body.active);
        return {
            success,
            message: success ? `提供商 ${providerName} 已${body.active ? '启用' : '禁用'}` : '操作失败',
        };
    }
    getBestProxy(protocol) {
        const proxy = this.proxyPoolService.getBestProxy(protocol);
        return {
            success: !!proxy,
            proxy,
        };
    }
};
exports.ProxyPoolController = ProxyPoolController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取统计信息' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getProxyStats", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池健康状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取健康状态' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getHealthReport", null);
__decorate([
    (0, common_1.Get)('health/score'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池健康评分' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取健康评分' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getHealthScore", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池监控指标' }),
    (0, swagger_1.ApiQuery)({ name: 'minutes', required: false, type: Number, description: '获取多少分钟内的指标' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取监控指标' }),
    __param(0, (0, common_1.Query)('minutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池告警信息' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, type: Number, description: '获取多少小时内的告警' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取告警信息' }),
    __param(0, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池性能报告' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, type: Number, description: '获取多少小时内的报告' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取性能报告' }),
    __param(0, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getPerformanceReport", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理提供商列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取提供商列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('proxies'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有代理列表' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['working', 'failed', 'all'],
        description: '筛选状态',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'protocol',
        required: false,
        enum: ['http', 'https', 'socks4', 'socks5'],
        description: '筛选协议',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取代理列表' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('protocol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getProxies", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: '刷新代理池' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功刷新代理池' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProxyPoolController.prototype, "refreshProxies", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, swagger_1.ApiOperation)({ summary: '测试代理' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功测试代理' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProxyPoolController.prototype, "testProxy", null);
__decorate([
    (0, common_1.Delete)('failed'),
    (0, swagger_1.ApiOperation)({ summary: '清理失效代理' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功清理失效代理' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "removeFailedProxies", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: '获取代理池配置' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取配置' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, swagger_1.ApiOperation)({ summary: '更新代理池配置' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功更新配置' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('providers/:provider/toggle'),
    (0, swagger_1.ApiOperation)({ summary: '启用/禁用代理提供商' }),
    (0, swagger_1.ApiParam)({ name: 'provider', description: '提供商名称' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功切换提供商状态' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "toggleProvider", null);
__decorate([
    (0, common_1.Get)('best'),
    (0, swagger_1.ApiOperation)({ summary: '获取最佳代理' }),
    (0, swagger_1.ApiQuery)({ name: 'protocol', required: false, description: '指定协议类型' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取最佳代理' }),
    __param(0, (0, common_1.Query)('protocol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProxyPoolController.prototype, "getBestProxy", null);
exports.ProxyPoolController = ProxyPoolController = __decorate([
    (0, swagger_1.ApiTags)('代理池管理'),
    (0, common_1.Controller)('proxy-pool'),
    __metadata("design:paramtypes", [proxy_pool_service_1.ProxyPoolService,
        proxy_provider_service_1.ProxyProviderService,
        proxy_monitoring_service_1.ProxyMonitoringService])
], ProxyPoolController);
//# sourceMappingURL=proxy-pool.controller.js.map