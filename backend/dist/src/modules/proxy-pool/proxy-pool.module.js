"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyPoolModule = void 0;
const common_1 = require("@nestjs/common");
const proxy_pool_service_1 = require("../../common/services/proxy-pool.service");
const proxy_provider_service_1 = require("../../common/services/proxy-provider.service");
const proxy_monitoring_service_1 = require("../../common/services/proxy-monitoring.service");
const proxy_provider_service_2 = require("../../common/services/proxy-provider.service");
const proxy_pool_controller_1 = require("../../controllers/proxy-pool.controller");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const app_logger_service_1 = require("../../common/services/app-logger.service");
let ProxyPoolModule = class ProxyPoolModule {
};
exports.ProxyPoolModule = ProxyPoolModule;
exports.ProxyPoolModule = ProxyPoolModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), config_1.ConfigModule],
        controllers: [proxy_pool_controller_1.ProxyPoolController],
        providers: [
            proxy_pool_service_1.ProxyPoolService,
            proxy_provider_service_1.ProxyProviderService,
            proxy_monitoring_service_1.ProxyMonitoringService,
            app_logger_service_1.AppLoggerService,
            proxy_provider_service_2.KuaiDailiFreeProvider,
            proxy_provider_service_2.XiciProxyProvider,
            proxy_provider_service_2.Proxy89Provider,
            proxy_provider_service_2.XiaoHuanProxyProvider,
        ],
        exports: [proxy_pool_service_1.ProxyPoolService, proxy_provider_service_1.ProxyProviderService, proxy_monitoring_service_1.ProxyMonitoringService],
    })
], ProxyPoolModule);
//# sourceMappingURL=proxy-pool.module.js.map