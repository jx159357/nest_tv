"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const crawler_scheduler_service_1 = require("./crawler-scheduler.service");
const crawler_module_1 = require("../crawler/crawler.module");
const media_module_1 = require("../media/media.module");
const app_logger_service_1 = require("../common/services/app-logger.service");
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), crawler_module_1.CrawlerModule, media_module_1.MediaResourceModule],
        providers: [crawler_scheduler_service_1.CrawlerSchedulerService, app_logger_service_1.AppLoggerService],
        exports: [crawler_scheduler_service_1.CrawlerSchedulerService],
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map