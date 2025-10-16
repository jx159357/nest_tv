"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerModule = void 0;
const common_1 = require("@nestjs/common");
const crawler_service_1 = require("./crawler.service");
const media_module_1 = require("../media/media.module");
const common_module_1 = require("../common/common.module");
const crawler_controller_1 = require("./crawler.controller");
const proxy_pool_module_1 = require("../modules/proxy-pool/proxy-pool.module");
let CrawlerModule = class CrawlerModule {
};
exports.CrawlerModule = CrawlerModule;
exports.CrawlerModule = CrawlerModule = __decorate([
    (0, common_1.Module)({
        imports: [media_module_1.MediaResourceModule, common_module_1.CommonModule, proxy_pool_module_1.ProxyPoolModule],
        controllers: [crawler_controller_1.CrawlerController],
        providers: [crawler_service_1.CrawlerService],
        exports: [crawler_service_1.CrawlerService],
    })
], CrawlerModule);
//# sourceMappingURL=crawler.module.js.map