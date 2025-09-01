"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CommonModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiException = exports.HttpStatusCodeMap = exports.ApiErrorMessage = exports.ApiErrorCode = exports.CacheInvalidate = exports.CacheTTL = exports.CacheKey = exports.CacheInterceptor = exports.PaginatedResponseDecorator = exports.SuccessResponseDecorator = exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const response_interceptor_1 = require("./interceptors/response.interceptor");
const cache_interceptor_1 = require("./interceptors/cache.interceptor");
const request_id_middleware_1 = require("./middleware/request-id.middleware");
const performance_monitor_service_1 = require("./services/performance-monitor.service");
const cache_service_1 = require("./services/cache.service");
const media_cache_service_1 = require("./services/media-cache.service");
const torrent_service_1 = require("./services/torrent.service");
const app_logger_service_1 = require("./services/app-logger.service");
let CommonModule = CommonModule_1 = class CommonModule {
    static forRoot(options) {
        const providers = [
            performance_monitor_service_1.PerformanceMonitorService,
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
        ];
        if (options?.enableCache) {
            providers.push(cache_service_1.CacheService, media_cache_service_1.MediaCacheService, {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_interceptor_1.CacheInterceptor,
            });
        }
        if (options?.enableRequestId) {
            providers.push({
                provide: 'REQUEST_ID_MIDDLEWARE',
                useFactory: () => {
                    return new request_id_middleware_1.RequestIdMiddleware();
                },
            });
        }
        return {
            module: CommonModule_1,
            providers,
            exports: providers,
            global: true,
        };
    }
    static forFeature() {
        return {
            module: CommonModule_1,
            exports: [
                performance_monitor_service_1.PerformanceMonitorService,
                cache_service_1.CacheService,
                media_cache_service_1.MediaCacheService,
            ],
        };
    }
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = CommonModule_1 = __decorate([
    (0, common_1.Module)({
        providers: [
            performance_monitor_service_1.PerformanceMonitorService,
            cache_service_1.CacheService,
            media_cache_service_1.MediaCacheService,
            torrent_service_1.TorrentService,
            app_logger_service_1.AppLoggerService,
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: cache_interceptor_1.CacheInterceptor,
            },
        ],
        exports: [
            performance_monitor_service_1.PerformanceMonitorService,
            cache_service_1.CacheService,
            media_cache_service_1.MediaCacheService,
            torrent_service_1.TorrentService,
            app_logger_service_1.AppLoggerService,
        ],
    })
], CommonModule);
var response_interceptor_2 = require("./interceptors/response.interceptor");
Object.defineProperty(exports, "SuccessResponseDecorator", { enumerable: true, get: function () { return response_interceptor_2.SuccessResponse; } });
Object.defineProperty(exports, "PaginatedResponseDecorator", { enumerable: true, get: function () { return response_interceptor_2.PaginatedResponse; } });
var cache_interceptor_2 = require("./interceptors/cache.interceptor");
Object.defineProperty(exports, "CacheInterceptor", { enumerable: true, get: function () { return cache_interceptor_2.CacheInterceptor; } });
Object.defineProperty(exports, "CacheKey", { enumerable: true, get: function () { return cache_interceptor_2.CacheKey; } });
Object.defineProperty(exports, "CacheTTL", { enumerable: true, get: function () { return cache_interceptor_2.CacheTTL; } });
Object.defineProperty(exports, "CacheInvalidate", { enumerable: true, get: function () { return cache_interceptor_2.CacheInvalidate; } });
var api_exception_1 = require("./exceptions/api.exception");
Object.defineProperty(exports, "ApiErrorCode", { enumerable: true, get: function () { return api_exception_1.ApiErrorCode; } });
Object.defineProperty(exports, "ApiErrorMessage", { enumerable: true, get: function () { return api_exception_1.ApiErrorMessage; } });
Object.defineProperty(exports, "HttpStatusCodeMap", { enumerable: true, get: function () { return api_exception_1.HttpStatusCodeMap; } });
Object.defineProperty(exports, "ApiException", { enumerable: true, get: function () { return api_exception_1.ApiException; } });
//# sourceMappingURL=common.module.js.map