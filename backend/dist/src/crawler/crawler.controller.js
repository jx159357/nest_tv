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
var CrawlerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crawler_service_1 = require("./crawler.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const media_resource_service_1 = require("../media/media-resource.service");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const crawl_request_dto_1 = require("./dtos/crawl-request.dto");
const crawler_config_1 = require("./crawler.config");
let CrawlerController = CrawlerController_1 = class CrawlerController {
    crawlerService;
    mediaResourceService;
    logger = new common_1.Logger(CrawlerController_1.name);
    constructor(crawlerService, mediaResourceService) {
        this.crawlerService = crawlerService;
        this.mediaResourceService = mediaResourceService;
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
        try {
            await this.saveToDatabase(result, crawlRequest.targetName);
        }
        catch (error) {
            console.warn('保存数据失败:', error.message);
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
        let savedCount = 0;
        try {
            for (const result of results) {
                try {
                    await this.saveToDatabase(result, batchCrawlRequest.targetName);
                    savedCount++;
                }
                catch (error) {
                    console.warn(`保存数据失败 (${result.title}):`, error.message);
                }
            }
        }
        catch (error) {
            console.warn('批量保存过程中出现错误:', error.message);
        }
        return {
            success: true,
            message: `批量爬取完成，成功 ${successCount} 条，失败 ${failureCount} 条，保存成功 ${savedCount} 条`,
            data: {
                crawledData: results,
                successCount,
                failureCount,
                savedCount,
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
        const targetName = body.targetName || crawler_config_1.CRAWLER_TARGETS[0]?.name;
        const result = await this.crawlerService.crawlWebsite(targetName, body.url);
        if (!result) {
            return {
                success: false,
                message: '爬取失败',
                data: null,
            };
        }
        try {
            await this.saveToDatabase(result, targetName);
            return {
                success: true,
                message: '爬取并保存成功',
                data: result,
            };
        }
        catch (error) {
            console.warn('保存数据失败:', error.message);
            return {
                success: false,
                message: '爬取成功但保存失败',
                data: {
                    crawledData: result,
                    error: error.message,
                },
            };
        }
    }
    async getStats() {
        try {
            const totalMedia = await this.mediaResourceService.getTotalCount();
            const activeMedia = await this.mediaResourceService.getActiveCount();
            const targetsAvailable = this.crawlerService.getAvailableTargets().map(t => t.name);
            return {
                totalCrawled: totalMedia,
                successCount: activeMedia,
                failureCount: totalMedia - activeMedia,
                lastCrawlTime: await this.mediaResourceService.getLastCrawlTime(),
                targetsAvailable,
            };
        }
        catch (error) {
            console.warn('获取统计信息失败:', error.message);
            return {
                totalCrawled: 0,
                successCount: 0,
                failureCount: 0,
                targetsAvailable: this.crawlerService.getAvailableTargets().map(t => t.name),
            };
        }
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
    async saveToDatabase(data, source) {
        if (!data || !data.title) {
            throw new Error('无效的爬取数据：缺少标题');
        }
        const existingMedia = await this.mediaResourceService.findByTitle(data.title);
        if (existingMedia) {
            console.log(`资源已存在，跳过: ${data.title}`);
            return;
        }
        const mediaData = {
            title: data.title,
            description: data.description || '',
            type: this.mapMediaType(data.type),
            director: data.director || '',
            actors: data.actors || '',
            genres: this.arrayFromString(data.genres),
            releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
            quality: this.mapQuality(data.quality),
            poster: data.poster || '',
            backdrop: data.backdrop || '',
            rating: data.rating || 0,
            viewCount: data.viewCount || 0,
            isActive: true,
            source: source,
            metadata: data.metadata || {},
            duration: data.duration ? parseInt(data.duration) : undefined,
            episodeCount: data.episodeCount ? parseInt(data.episodeCount) : undefined,
            downloadUrls: Array.isArray(data.downloadUrls) ? data.downloadUrls : [],
        };
        await this.mediaResourceService.create(mediaData);
        console.log(`成功保存资源: ${data.title}`);
    }
    mapMediaType(type) {
        const typeMap = {
            '电影': media_resource_entity_1.MediaType.MOVIE,
            '电视剧': media_resource_entity_1.MediaType.TV_SERIES,
            '综艺': media_resource_entity_1.MediaType.VARIETY,
            '动漫': media_resource_entity_1.MediaType.ANIME,
            '纪录片': media_resource_entity_1.MediaType.DOCUMENTARY,
        };
        return typeMap[type] || media_resource_entity_1.MediaType.MOVIE;
    }
    mapQuality(quality) {
        const qualityMap = {
            '高清': media_resource_entity_1.MediaQuality.HD,
            '超清': media_resource_entity_1.MediaQuality.FULL_HD,
            '蓝光': media_resource_entity_1.MediaQuality.BLUE_RAY,
            '标清': media_resource_entity_1.MediaQuality.SD,
        };
        return qualityMap[quality] || media_resource_entity_1.MediaQuality.HD;
    }
    arrayFromString(str) {
        if (!str || typeof str !== 'string') {
            return [];
        }
        return str.split(/[,，、]/).map(item => item.trim()).filter(item => item.length > 0);
    }
    async testCrawler(targetName) {
        const target = targetName || '电影天堂';
        try {
            const startTime = Date.now();
            const connectionOk = await this.crawlerService.testConnection(target);
            const responseTime = Date.now() - startTime;
            if (!connectionOk) {
                return {
                    success: false,
                    message: `无法连接到目标网站: ${target}`,
                    data: {
                        target,
                        connection: false,
                        responseTime,
                        error: '连接失败'
                    }
                };
            }
            let testData = null;
            if (target === '电影天堂') {
                const testUrl = 'http://www.dytt8899.com';
                try {
                    testData = await this.crawlerService.crawlWebsite(target, testUrl);
                }
                catch (error) {
                    this.logger.warn(`测试爬取失败: ${error.message}`);
                }
            }
            return {
                success: true,
                message: '爬虫功能测试完成',
                data: {
                    target,
                    connection: true,
                    responseTime,
                    testData: testData ? {
                        title: testData.title || '未知标题',
                        hasDownloadUrls: testData.downloadUrls && testData.downloadUrls.length > 0,
                        description: testData.description ? testData.description.substring(0, 100) + '...' : '无描述'
                    } : null
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `测试失败: ${error.message}`,
                data: {
                    target,
                    error: error.message
                }
            };
        }
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Post)('crawl'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, swagger_1.ApiOperation)({
        summary: '爬取单个资源',
        description: '根据指定的目标网站和URL爬取影视资源信息并保存到数据库'
    }),
    (0, swagger_1.ApiBody)({
        description: '爬取请求参数',
        type: crawl_request_dto_1.CrawlRequestDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '爬取成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '爬取成功' },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                        title: { type: 'string', example: '电影标题' },
                        description: { type: 'string', example: '电影描述' },
                        type: { type: 'string', example: 'movie' },
                        quality: { type: 'string', example: '1080p' },
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: '参数验证失败' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '未授权访问'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
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
    (0, swagger_1.ApiOperation)({
        summary: '批量爬取资源',
        description: '批量爬取多个URL的影视资源信息，提高爬取效率'
    }),
    (0, swagger_1.ApiBody)({
        description: '批量爬取请求参数',
        type: crawl_request_dto_1.BatchCrawlRequestDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '批量爬取成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '批量爬取完成' },
                results: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            url: { type: 'string' },
                            success: { type: 'boolean' },
                            data: { type: 'object' },
                            error: { type: 'string' }
                        }
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crawl_request_dto_1.BatchCrawlRequestDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "batchCrawl", null);
__decorate([
    (0, common_1.Get)('targets'),
    (0, swagger_1.ApiOperation)({
        summary: '获取爬虫目标列表',
        description: '获取所有可用的爬虫目标网站及其配置信息'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '获取爬虫目标列表成功' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'example-site' },
                            baseUrl: { type: 'string', example: 'https://example.com' },
                            description: { type: 'string', example: '示例网站' },
                            enabled: { type: 'boolean', example: true }
                        }
                    }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Post)('crawl-and-save'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '爬取并保存资源',
        description: '根据指定的目标网站和URL爬取影视资源信息并保存到数据库，需要JWT认证'
    }),
    (0, swagger_1.ApiBody)({
        description: '爬取请求参数',
        type: crawl_request_dto_1.CrawlAndSaveDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '爬取并保存成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '爬取并保存成功' },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                        title: { type: 'string', example: '电影标题' },
                        description: { type: 'string', example: '电影描述' },
                        type: { type: 'string', example: 'movie' },
                        quality: { type: 'string', example: '1080p' },
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '未授权访问'
    }),
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
__decorate([
    (0, common_1.Post)('test'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '测试爬虫功能',
        description: '测试指定爬虫目标的连接和基本功能'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'targetName',
        required: false,
        description: '目标网站名称，默认为电影天堂',
        example: '电影天堂'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '测试成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '爬虫功能正常' },
                data: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', example: '电影天堂' },
                        connection: { type: 'boolean', example: true },
                        responseTime: { type: 'number', example: 1500 },
                        selectors: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', example: '测试标题' },
                                description: { type: 'string', example: '测试描述' }
                            }
                        }
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Query)('targetName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "testCrawler", null);
exports.CrawlerController = CrawlerController = CrawlerController_1 = __decorate([
    (0, swagger_1.ApiTags)('资源爬虫'),
    (0, common_1.Controller)('crawler'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService,
        media_resource_service_1.MediaResourceService])
], CrawlerController);
//# sourceMappingURL=crawler.controller.js.map