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
var CrawlerSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const crawler_service_1 = require("../crawler/crawler.service");
const crawler_config_1 = require("../crawler/crawler.config");
const media_resource_service_1 = require("../media/media-resource.service");
const app_logger_service_1 = require("../common/services/app-logger.service");
let CrawlerSchedulerService = CrawlerSchedulerService_1 = class CrawlerSchedulerService {
    crawlerService;
    mediaResourceService;
    appLogger;
    logger = new common_1.Logger(CrawlerSchedulerService_1.name);
    retryAttempts = 3;
    retryDelay = 5000;
    timeout = 30000;
    constructor(crawlerService, mediaResourceService, appLogger) {
        this.crawlerService = crawlerService;
        this.mediaResourceService = mediaResourceService;
        this.appLogger = appLogger;
    }
    async handleMovieHeavenCrawl() {
        const targetName = '电影天堂';
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            this.appLogger.setContext(requestId, {
                module: 'CRAWLER_SCHEDULER',
                function: 'handleMovieHeavenCrawl',
                requestId,
            });
            this.logger.log(`开始执行电影天堂定时爬取任务`);
            this.appLogger.log(`开始定时爬取任务: ${targetName}`, 'CRAWLER_SCHEDULE_START');
            const result = await this.executeWithRetry(() => this.crawlTargetWithTimeout(targetName), targetName, requestId);
            const duration = Date.now() - startTime;
            const summaryMessage = `电影天堂定时爬取完成: 总计${result.successCount + result.failureCount}个，成功${result.successCount}个，失败${result.failureCount}个，保存${result.savedCount}个，耗时${duration}ms`;
            this.logger.log(summaryMessage);
            if (result.errors.length > 0) {
                this.logger.warn(`爬取过程中遇到错误: ${result.errors.join('; ')}`);
            }
            this.appLogger.logOperation('CRAWLER_SCHEDULE_COMPLETE', targetName, undefined, {
                targetName,
                totalUrls: result.successCount + result.failureCount,
                successCount: result.successCount,
                failureCount: result.failureCount,
                savedCount: result.savedCount,
                errors: result.errors,
                warnings: result.warnings,
                duration,
                crawlTime: new Date().toISOString(),
            }, result.errors.length > 0 ? 'warning' : 'success', requestId);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = `电影天堂定时爬取任务失败: ${error.message}`;
            this.logger.error(errorMessage, error.stack);
            this.appLogger.logOperation('CRAWLER_SCHEDULE_ERROR', targetName, undefined, {
                targetName,
                error: error.message,
                stack: error.stack,
                duration,
                crawlTime: new Date().toISOString(),
            }, 'error', requestId);
        }
        finally {
            this.appLogger.clearContext(requestId);
        }
    }
    async handleFullCrawl() {
        this.logger.log('开始执行全量爬取任务');
        this.appLogger.log('开始全量爬取任务', 'CRAWLER_FULL_SCHEDULE_START');
        const enabledTargets = crawler_config_1.CRAWLER_TARGETS.filter(t => t.enabled);
        let totalSuccess = 0;
        let totalFailure = 0;
        for (const target of enabledTargets) {
            try {
                this.logger.log(`正在爬取目标: ${target.name}`);
                const result = await this.crawlTarget(target);
                if (result.success) {
                    totalSuccess += result.successCount;
                    totalFailure += result.failureCount;
                }
                else {
                    totalFailure++;
                }
            }
            catch (error) {
                this.logger.error(`爬取目标 ${target.name} 失败: ${error.message}`);
                totalFailure++;
            }
            await this.delay(5000);
        }
        this.logger.log(`全量爬取任务完成: 成功${totalSuccess}个，失败${totalFailure}个`);
        this.appLogger.log(`全量爬取完成: 成功${totalSuccess}, 失败${totalFailure}`, 'CRAWLER_FULL_SCHEDULE_COMPLETE');
    }
    async crawlTarget(target) {
        try {
            const crawlUrls = await this.discoverCrawlUrls(target.baseUrl, target.name);
            const maxCrawlCount = 5;
            const urlsToCrawl = crawlUrls.slice(0, maxCrawlCount);
            let successCount = 0;
            let failureCount = 0;
            for (const url of urlsToCrawl) {
                try {
                    const result = await this.crawlerService.crawlWebsite(target.name, url);
                    if (result.success && result.data) {
                        try {
                            await this.saveToDatabase(result.data, target.name);
                            successCount++;
                        }
                        catch (saveError) {
                            this.logger.warn(`保存失败: ${saveError.message}`);
                            successCount++;
                        }
                    }
                    else {
                        failureCount++;
                    }
                    await this.delay(target.requestDelay || 2000);
                }
                catch (error) {
                    failureCount++;
                    this.logger.warn(`单个URL爬取失败: ${error.message}`);
                }
            }
            return { success: true, successCount, failureCount };
        }
        catch (error) {
            this.logger.error(`爬取目标 ${target.name} 失败: ${error.message}`);
            return { success: false, successCount: 0, failureCount: 1 };
        }
    }
    async discoverCrawlUrls(baseUrl, targetName) {
        try {
            if (targetName === '电影天堂') {
                const commonPaths = [
                    '/html/gndy/dyzz/index.html',
                    '/html/gndy/jddy/index.html',
                    '/html/tv/hytv/index.html',
                    '/html/dongman/index.html',
                ];
                const urls = [];
                for (const path of commonPaths) {
                    urls.push(new URL(path, baseUrl).href);
                }
                return urls;
            }
            if (targetName === '阳光电影') {
                const commonPaths = [
                    '/html/gndy/dyzz/index.html',
                    '/html/tv/hytv/index.html',
                    '/html/dongman/index.html',
                    '/html/zongyi/index.html',
                    '/html/jilup/index.html',
                ];
                const urls = [];
                for (const path of commonPaths) {
                    urls.push(new URL(path, baseUrl).href);
                }
                return urls;
            }
            if (targetName === '人人影视') {
                const commonPaths = [
                    '/html/gndy/dyzz/index.html',
                    '/html/tv/hytv/index.html',
                    '/html/dongman/index.html',
                    '/html/zongyi/index.html',
                    '/html/jilup/index.html',
                ];
                const urls = [];
                for (const path of commonPaths) {
                    urls.push(new URL(path, baseUrl).href);
                }
                return urls;
            }
            const commonPaths = ['/', '/latest', '/new', '/movies', '/tv', '/anime', '/variety'];
            return commonPaths.map(path => new URL(path, baseUrl).href);
        }
        catch (error) {
            this.logger.error(`发现URL失败: ${error.message}`);
            return [];
        }
    }
    async saveToDatabase(data, source) {
        if (!data || !data.title) {
            throw new Error('无效的爬取数据：缺少标题');
        }
        const existingMedia = await this.mediaResourceService.findByTitle(data.title);
        if (existingMedia) {
            this.logger.log(`资源已存在，跳过: ${data.title}`);
            return;
        }
        const mediaData = {
            title: data.title.trim(),
            description: (data.description || '').trim().substring(0, 1000),
            type: this.mapMediaType(data.type),
            director: (data.director || '').trim(),
            actors: (data.actors || '').trim(),
            genres: this.arrayFromString(data.genres),
            releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
            quality: this.mapQuality(data.quality),
            poster: (data.poster || '').trim(),
            backdrop: (data.backdrop || '').trim(),
            rating: this.parseRating(data.rating),
            viewCount: 0,
            isActive: true,
            source: source,
            metadata: {
                ...data.metadata,
                crawledAt: new Date(),
                source,
            },
            duration: data.duration ? parseInt(data.duration) : undefined,
            episodeCount: data.episodeCount ? parseInt(data.episodeCount) : undefined,
            downloadUrls: Array.isArray(data.downloadUrls)
                ? data.downloadUrls.filter(url => url && url.trim().length > 0)
                : [],
        };
        await this.mediaResourceService.create(mediaData);
        this.logger.log(`成功保存资源: ${data.title}`);
    }
    mapMediaType(type) {
        const typeMap = {
            电影: 'movie',
            电视剧: 'tv_series',
            综艺: 'variety',
            动漫: 'anime',
            纪录片: 'documentary',
            movie: 'movie',
            tv_series: 'tv_series',
            variety: 'variety',
            anime: 'anime',
            documentary: 'documentary',
        };
        return typeMap[type] || 'movie';
    }
    mapQuality(quality) {
        const qualityMap = {
            高清: 'hd',
            超清: 'full_hd',
            蓝光: 'blue_ray',
            标清: 'sd',
            hd: 'hd',
            full_hd: 'full_hd',
            blue_ray: 'blue_ray',
            sd: 'sd',
        };
        return qualityMap[quality] || 'hd';
    }
    parseRating(rating) {
        if (typeof rating === 'number') {
            return Math.max(0, Math.min(10, rating));
        }
        if (typeof rating === 'string') {
            const parsed = parseFloat(rating);
            if (!isNaN(parsed)) {
                return Math.max(0, Math.min(10, parsed));
            }
        }
        return 7.5;
    }
    arrayFromString(str) {
        if (Array.isArray(str)) {
            return str.filter(item => item && item.trim().length > 0);
        }
        if (!str || typeof str !== 'string') {
            return [];
        }
        return str
            .split(/[,，、]/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateRequestId() {
        return `scheduler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async executeWithRetry(task, targetName, requestId, maxAttempts = this.retryAttempts) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await task();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    const delay = this.retryDelay * attempt;
                    this.logger.warn(`${targetName} 爬取失败，第${attempt}次重试，${delay}ms后重试: ${error.message}`);
                    await this.delay(delay);
                }
                else {
                    this.logger.error(`${targetName} 爬取失败，已达最大重试次数: ${error.message}`);
                }
            }
        }
        throw lastError || new Error('未知错误');
    }
    async crawlTargetWithTimeout(targetName) {
        const result = {
            success: true,
            successCount: 0,
            failureCount: 0,
            savedCount: 0,
            errors: [],
            warnings: [],
        };
        try {
            const target = crawler_config_1.CRAWLER_TARGETS.find(t => t.name === targetName && t.enabled);
            if (!target) {
                throw new Error(`爬虫目标未启用或不存在: ${targetName}`);
            }
            const connectionOk = await Promise.race([
                this.crawlerService.testConnection(targetName),
                new Promise((_, reject) => setTimeout(() => reject(new Error('连接测试超时')), 10000)),
            ]);
            if (!connectionOk) {
                throw new Error(`无法连接到目标网站: ${targetName}`);
            }
            const crawlUrls = await Promise.race([
                this.discoverCrawlUrls(target.baseUrl, targetName),
                new Promise((_, reject) => setTimeout(() => reject(new Error('URL发现超时')), 15000)),
            ]);
            if (crawlUrls.length === 0) {
                result.warnings.push('未发现可爬取的URL列表');
                return result;
            }
            this.logger.log(`发现 ${crawlUrls.length} 个URL进行爬取`);
            const maxCrawlCount = 10;
            const urlsToCrawl = crawlUrls.slice(0, maxCrawlCount);
            for (let i = 0; i < urlsToCrawl.length; i++) {
                const url = urlsToCrawl[i];
                try {
                    this.logger.log(`正在爬取 (${i + 1}/${urlsToCrawl.length}): ${url}`);
                    const crawlResult = await Promise.race([
                        this.crawlerService.crawlWebsite(targetName, url),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('单个URL爬取超时')), this.timeout)),
                    ]);
                    if (crawlResult.success && crawlResult.data) {
                        try {
                            await this.saveToDatabaseWithRetry(crawlResult.data, targetName);
                            result.savedCount++;
                            result.successCount++;
                            this.logger.log(`成功爬取并保存: ${crawlResult.data.title}`);
                        }
                        catch (saveError) {
                            result.warnings.push(`爬取成功但保存失败 (${crawlResult.data.title}): ${saveError.message}`);
                            result.successCount++;
                        }
                    }
                    else {
                        result.failureCount++;
                        result.errors.push(`爬取失败 (${url}): ${crawlResult.error}`);
                    }
                    if (target.requestDelay && i < urlsToCrawl.length - 1) {
                        await this.delay(target.requestDelay);
                    }
                }
                catch (error) {
                    result.failureCount++;
                    result.errors.push(`爬取过程出错 (${url}): ${error.message}`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`目标爬取失败: ${error.message}`);
            return result;
        }
    }
    async saveToDatabaseWithRetry(data, source, maxAttempts = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.saveToDatabase(data, source);
            }
            catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    const delay = this.retryDelay * attempt;
                    this.logger.warn(`数据保存失败，第${attempt}次重试，${delay}ms后重试: ${error.message}`);
                    await this.delay(delay);
                }
                else {
                    this.logger.error(`数据保存失败，已达最大重试次数: ${error.message}`);
                }
            }
        }
        throw lastError || new Error('保存数据失败');
    }
};
exports.CrawlerSchedulerService = CrawlerSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerSchedulerService.prototype, "handleMovieHeavenCrawl", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerSchedulerService.prototype, "handleFullCrawl", null);
exports.CrawlerSchedulerService = CrawlerSchedulerService = CrawlerSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService,
        media_resource_service_1.MediaResourceService,
        app_logger_service_1.AppLoggerService])
], CrawlerSchedulerService);
//# sourceMappingURL=crawler-scheduler.service.js.map