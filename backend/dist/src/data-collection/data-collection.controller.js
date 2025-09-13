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
exports.DataCollectionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const data_collection_service_1 = require("./data-collection.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let DataCollectionController = class DataCollectionController {
    dataCollectionService;
    constructor(dataCollectionService) {
        this.dataCollectionService = dataCollectionService;
    }
    getSources() {
        return this.dataCollectionService.getSources();
    }
    getSource(name) {
        const source = this.dataCollectionService.getSource(name);
        if (!source) {
            throw new Error(`爬虫源 ${name} 不存在或已禁用`);
        }
        return source;
    }
    async crawlUrl(body) {
        const { sourceName, url, userId } = body;
        try {
            const result = await this.dataCollectionService.crawlAndSave(sourceName, url);
            return {
                success: true,
                data: result,
                message: '爬取成功',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async batchCrawl(body) {
        const { sourceName, urls, userId } = body;
        try {
            const results = await this.dataCollectionService.crawlBatch(sourceName, urls);
            return {
                success: true,
                data: results,
                message: `批量爬取完成: ${results.length} 个URL`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async getPopularUrls(sourceName, limit = 20) {
        try {
            const urls = await this.dataCollectionService.getPopularUrls(sourceName, limit);
            return {
                success: true,
                data: urls,
                message: `获取到 ${urls.length} 个热门URL`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async testConnection(sourceName) {
        const result = await this.dataCollectionService.testConnection(sourceName);
        return {
            success: result.success,
            message: result.message,
            responseTime: result.responseTime,
        };
    }
    async getStatistics() {
        const statistics = await this.dataCollectionService.getStatistics();
        return {
            success: true,
            data: statistics,
            message: '获取统计信息成功',
        };
    }
};
exports.DataCollectionController = DataCollectionController;
__decorate([
    (0, common_1.Get)('sources'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有可用的爬虫源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DataCollectionController.prototype, "getSources", null);
__decorate([
    (0, common_1.Get)('sources/:name'),
    (0, swagger_1.ApiOperation)({ summary: '根据名称获取爬虫源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '爬虫源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'name', description: '爬虫源名称' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DataCollectionController.prototype, "getSource", null);
__decorate([
    (0, common_1.Post)('crawl'),
    (0, swagger_1.ApiOperation)({ summary: '爬取单个URL' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '爬取成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "crawlUrl", null);
__decorate([
    (0, common_1.Post)('batch-crawl'),
    (0, swagger_1.ApiOperation)({ summary: '批量爬取URL' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量爬取成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "batchCrawl", null);
__decorate([
    (0, common_1.Get)('popular-urls/:sourceName'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门资源URL' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '爬虫源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'sourceName', description: '爬虫源名称' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '限制数量', required: false }),
    __param(0, (0, common_1.Param)('sourceName')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "getPopularUrls", null);
__decorate([
    (0, common_1.Get)('test-connection/:sourceName'),
    (0, swagger_1.ApiOperation)({ summary: '测试爬虫源连接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '测试成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '爬虫源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'sourceName', description: '爬虫源名称' }),
    __param(0, (0, common_1.Param)('sourceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: '获取爬虫统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "getStatistics", null);
exports.DataCollectionController = DataCollectionController = __decorate([
    (0, swagger_1.ApiTags)('数据采集'),
    (0, common_1.Controller)('data-collection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [data_collection_service_1.DataCollectionService])
], DataCollectionController);
//# sourceMappingURL=data-collection.controller.js.map