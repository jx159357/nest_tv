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
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const crawler_service_1 = require("./crawler.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const crawl_request_dto_1 = require("./dtos/crawl-request.dto");
let CrawlerController = class CrawlerController {
    crawlerService;
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async crawlSingle(req, crawlRequest) {
        const result = await this.crawlerService.crawlWebsite(crawlRequest.targetName, crawlRequest.url);
        if (!result) {
            return {
                success: false,
                message: '爬取失败',
                data: null,
            };
        }
        return {
            success: true,
            message: '爬取成功',
            data: result,
        };
    }
    async batchCrawl(req, batchCrawlRequest) {
        const results = await this.crawlerService.batchCrawl(batchCrawlRequest.targetName, batchCrawlRequest.urls);
        const successCount = results.length;
        const failureCount = batchCrawlRequest.urls.length - successCount;
        return {
            success: true,
            message: `批量爬取完成，成功 ${successCount} 条，失败 ${failureCount} 条`,
            data: {
                crawledData: results,
                successCount,
                failureCount,
                totalRequested: batchCrawlRequest.urls.length,
            },
        };
    }
    async getTargets() {
        const targets = this.crawlerService.getAvailableTargets();
        return {
            success: true,
            data: targets,
        };
    }
    async crawlAndSave(req, body) {
        const targetName = body.targetName || '电影天堂';
        const result = await this.crawlerService.crawlWebsite(targetName, body.url);
        if (!result) {
            return {
                success: false,
                message: '爬取失败',
                data: null,
            };
        }
        return {
            success: true,
            message: '爬取并保存成功',
            data: result,
        };
    }
    async getStats() {
        return {
            totalCrawled: 0,
            successCount: 0,
            failureCount: 0,
            targetsAvailable: this.crawlerService.getAvailableTargets().map(t => t.name),
        };
    }
    async testConnection(targetName) {
        const target = this.crawlerService.getAvailableTargets().find(t => t.name === targetName);
        if (!target) {
            return {
                success: false,
                message: `未找到目标网站: ${targetName}`,
            };
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(target.baseUrl, {
                method: 'HEAD',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return {
                success: response.ok,
                message: response.ok ? '连接成功' : '连接失败',
                data: {
                    status: response.status,
                    url: target.baseUrl,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: '连接失败',
                data: {
                    error: error.message,
                    url: target.baseUrl,
                },
            };
        }
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Post)('crawl'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crawl_request_dto_1.CrawlRequestDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlSingle", null);
__decorate([
    (0, common_1.Post)('batch-crawl'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crawl_request_dto_1.BatchCrawlRequestDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "batchCrawl", null);
__decorate([
    (0, common_1.Get)('targets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Post)('crawl-and-save'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crawl_request_dto_1.CrawlAndSaveDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlAndSave", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('test-connection'),
    __param(0, (0, common_1.Query)('targetName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "testConnection", null);
exports.CrawlerController = CrawlerController = __decorate([
    (0, common_1.Controller)('crawler'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
//# sourceMappingURL=crawler.controller.js.map