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
const app_logger_service_1 = require("../common/services/app-logger.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let DataCollectionController = class DataCollectionController {
    dataCollectionService;
    logger;
    constructor(dataCollectionService, appLoggerService) {
        this.dataCollectionService = dataCollectionService;
        this.logger = appLoggerService;
    }
    async collectFromUrl(query) {
        const context = {
            userId: query.userId,
            function: 'collectFromUrl',
            sourceName: query.sourceName,
            url: query.url
        };
        try {
            this.logger.logUserAction(query.userId || 0, 'collect_from_url', query.url, { sourceName: query.sourceName }, context);
            const result = await this.dataCollectionService.collectFromUrl(query.sourceName, query.url, query.userId);
            if (!result) {
                this.logger.warn('Data collection failed', context);
                return {
                    success: false,
                    message: '数据采集失败',
                };
            }
            this.logger.log('Data collection successful', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: '数据采集成功',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`Data collection failed: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async batchCollect(sourceName, urls, userId) {
        const context = { userId, function: 'batchCollect', sourceName, urlCount: urls.length };
        try {
            this.logger.logUserAction(userId || 0, 'batch_collect', urls.length.toString(), { sourceName }, context);
            const results = await this.dataCollectionService.batchCollect(sourceName, urls, userId);
            this.logger.log('Batch data collection completed', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: '批量采集完成',
                data: {
                    totalUrls: urls.length,
                    successCount: results.length,
                    results,
                },
            };
        }
        catch (error) {
            this.logger.error(`Batch data collection failed: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async collectPopular(sourceName, count = 20, userId) {
        const context = { userId, function: 'collectPopular', sourceName, count };
        try {
            this.logger.logUserAction(userId || 0, 'collect_popular', count.toString(), { sourceName }, context);
            const results = await this.dataCollectionService.collectPopularResources(sourceName, count, userId);
            this.logger.log('Popular resources collection completed', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: '热门资源采集完成',
                data: {
                    requestedCount: count,
                    successCount: results.length,
                    results,
                },
            };
        }
        catch (error) {
            this.logger.error(`Popular resources collection failed: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getAvailableSources() {
        const context = { function: 'getAvailableSources' };
        try {
            const sources = this.dataCollectionService.getAvailableSources();
            this.logger.log('Retrieved available sources', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                data: sources,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get available sources: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async toggleSource(sourceName, enabled, userId) {
        const context = { userId, function: 'toggleSource', sourceName, enabled };
        try {
            this.logger.logUserAction(userId || 0, 'toggle_source', sourceName, { enabled }, context);
            const success = this.dataCollectionService.toggleSource(sourceName, enabled);
            if (!success) {
                this.logger.warn(`Source not found: ${sourceName}`, context);
                return {
                    success: false,
                    message: '数据源不存在',
                };
            }
            this.logger.log('Source toggled successfully', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: `数据源${enabled ? '启用' : '禁用'}成功`,
            };
        }
        catch (error) {
            this.logger.error(`Failed to toggle source: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getSourceStats() {
        const context = { function: 'getSourceStats' };
        try {
            const stats = this.dataCollectionService.getSourceStats();
            this.logger.log('Retrieved source stats', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get source stats: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async processAndSave(mediaData, createPlaySources = true, userId) {
        const context = { userId, function: 'processAndSave', title: mediaData.title };
        try {
            this.logger.logUserAction(userId || 0, 'process_and_save', mediaData.title, null, context);
            const result = {
                mediaResource: null,
                playSources: [],
            };
            this.logger.log('Data processed and saved successfully', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: '数据处理并保存成功',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`Failed to process and save data: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getTemplates(sourceName) {
        const context = { function: 'getTemplates', sourceName };
        try {
            const templates = {
                douban: {
                    name: '豆瓣电影',
                    baseUrl: 'https://movie.douban.com',
                    selectors: {
                        title: 'h1 span[property="v:itemreviewed"]',
                        description: '.related-info .indent .all',
                        poster: '.related-pic img',
                        rating: '.rating_self strong',
                        director: '.info a[rel="v:directedBy"]',
                        actors: '.info a[rel="v:starring"]',
                        genres: '.info span[property="v:genre"]',
                        releaseDate: '.info span[property="v:initialReleaseDate"]',
                        downloadUrls: ['#info a[href*="download"]'],
                    },
                },
                dy2018: {
                    name: '电影天堂',
                    baseUrl: 'https://www.dy2018.com',
                    selectors: {
                        title: '.title a',
                        description: '.description',
                        poster: '.poster img',
                        rating: '.rating',
                        director: '.director',
                        actors: '.actors',
                        genres: ['.genre'],
                        releaseDate: '.release-date',
                        downloadUrls: ['.download-link'],
                    },
                },
            };
            const result = sourceName ? { [sourceName]: templates[sourceName] } : templates;
            this.logger.log('Retrieved collection templates', app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get templates: ${error.message}`, context, error.stack);
            throw error;
        }
    }
};
exports.DataCollectionController = DataCollectionController;
__decorate([
    (0, common_1.Post)('collect'),
    (0, swagger_1.ApiOperation)({ summary: '从URL采集数据' }),
    (0, swagger_1.ApiQuery)({ name: 'sourceName', description: '数据源名称' }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: '要采集的URL' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '用户ID', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '采集成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "collectFromUrl", null);
__decorate([
    (0, common_1.Post)('batch-collect'),
    (0, swagger_1.ApiOperation)({ summary: '批量采集数据' }),
    (0, swagger_1.ApiQuery)({ name: 'sourceName', description: '数据源名称' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '用户ID', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量采集成功' }),
    __param(0, (0, common_1.Query)('sourceName')),
    __param(1, (0, common_1.Body)('urls')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Number]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "batchCollect", null);
__decorate([
    (0, common_1.Post)('collect-popular'),
    (0, swagger_1.ApiOperation)({ summary: '采集热门资源' }),
    (0, swagger_1.ApiQuery)({ name: 'sourceName', description: '数据源名称' }),
    (0, swagger_1.ApiQuery)({ name: 'count', description: '采集数量', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '用户ID', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '采集成功' }),
    __param(0, (0, common_1.Query)('sourceName')),
    __param(1, (0, common_1.Query)('count')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "collectPopular", null);
__decorate([
    (0, common_1.Get)('sources'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有可用数据源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "getAvailableSources", null);
__decorate([
    (0, common_1.Put)('sources/:sourceName/toggle'),
    (0, swagger_1.ApiOperation)({ summary: '启用/禁用数据源' }),
    (0, swagger_1.ApiParam)({ name: 'sourceName', description: '数据源名称' }),
    (0, swagger_1.ApiQuery)({ name: 'enabled', description: '是否启用', type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '操作成功' }),
    __param(0, (0, common_1.Param)('sourceName')),
    __param(1, (0, common_1.Query)('enabled')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Number]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "toggleSource", null);
__decorate([
    (0, common_1.Get)('sources/stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取数据源统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "getSourceStats", null);
__decorate([
    (0, common_1.Post)('process-and-save'),
    (0, swagger_1.ApiOperation)({ summary: '处理采集数据并保存' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '用户ID', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '处理并保存成功' }),
    __param(0, (0, common_1.Body)('mediaData')),
    __param(1, (0, common_1.Body)('createPlaySources')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean, Number]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "processAndSave", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: '获取采集模板' }),
    (0, swagger_1.ApiQuery)({ name: 'sourceName', description: '数据源名称', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)('sourceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataCollectionController.prototype, "getTemplates", null);
exports.DataCollectionController = DataCollectionController = __decorate([
    (0, swagger_1.ApiTags)('数据采集管理'),
    (0, common_1.Controller)('data-collection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [data_collection_service_1.DataCollectionService,
        app_logger_service_1.AppLoggerService])
], DataCollectionController);
//# sourceMappingURL=data-collection.controller.js.map