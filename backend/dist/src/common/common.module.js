"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("./services/app-logger.service");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const database_health_service_1 = require("./services/database-health.service");
const health_controller_1 = require("./controllers/health.controller");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        providers: [app_logger_service_1.AppLoggerService, global_exception_filter_1.GlobalExceptionFilter, database_health_service_1.DatabaseHealthService],
        controllers: [health_controller_1.HealthController],
        exports: [app_logger_service_1.AppLoggerService, database_health_service_1.DatabaseHealthService],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map