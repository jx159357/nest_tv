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
    constructor(crawlerService, mediaResourceService, appLogger) {
        this.crawlerService = crawlerService;
        this.mediaResourceService = mediaResourceService;
        this.appLogger = appLogger;
    }
    async handleScheduledCrawl() {
        const targets = crawler_config_1.CRAWLER_TARGETS.filter(target => target.enabled);
        if (targets.length === 0) {
            this.logger.log('没有启用的爬取目标，跳过定时任务');
            return;
        }
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.log(`开始执行定时爬取任务，共${targets.length}个目标`);
            for (const target of targets) {
                try {
                    this.logger.log(`正在爬取目标: ${target.name}`);
                    const result = await this.executeWithRetry(() => this.crawlTargetWithTimeout(target.name, target.baseUrl), target.name);
                    results.push(result);
                    this.logger.log(`目标 ${target.name} 爬取完成`);
                }
                catch (error) {
                    this.logger.error(`目标 ${target.name} 爬取失败:`, error);
                    results.push({
                        success: false,
                        successCount: 0,
                        failureCount: 1,
                        savedCount: 0,
                        errors: [error instanceof Error ? error.message : '未知错误'],
                        warnings: []
                    });
                }
            }
            const duration = Date.now() - startTime;
            const totalSuccess = results.reduce((sum, r) => sum + (r.successCount || 0), 0);
            const totalFailure = results.reduce((sum, r) => sum + (r.failureCount || 0), 0);
            const totalSaved = results.reduce((sum, r) => sum + (r.savedCount || 0), 0);
            const summaryMessage = `定时爬取完成: 总计${totalSuccess + totalFailure}个，成功${totalSuccess}个，失败${totalFailure}个，保存${totalSaved}个，耗时${duration}ms`;
            this.logger.log(summaryMessage);
            const allErrors = results.flatMap(r => r.errors || []);
            if (allErrors.length > 0) {
                this.logger.warn(`爬取过程中遇到错误: ${allErrors.join('; ')}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`定时爬取任务失败: ${errorMessage}`, errorStack);
        }
    }
    async executeWithRetry(task, targetName, maxRetries = 3, retryDelay = 5000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await task();
            }
            catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                this.logger.warn(`目标 ${targetName} 第${attempt}次尝试失败，${retryDelay}ms后重试`);
                await this.sleep(retryDelay);
            }
        }
        throw new Error(`执行任务失败: ${targetName}`);
    }
    async crawlTargetWithTimeout(targetName, url) {
        try {
            const result = await this.crawlerService.crawlWebsite(targetName, url);
            return {
                success: true,
                successCount: result.success ? 1 : 0,
                failureCount: result.success ? 0 : 1,
                savedCount: result.data ? 1 : 0,
                errors: result.error ? [result.error] : [],
                warnings: []
            };
        }
        catch (error) {
            return {
                success: false,
                successCount: 0,
                failureCount: 1,
                savedCount: 0,
                errors: [error instanceof Error ? error.message : '未知错误'],
                warnings: []
            };
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async triggerManualCrawl(targetName) {
        const targets = crawler_config_1.CRAWLER_TARGETS.filter(target => target.enabled);
        if (targets.length === 0) {
            return { success: false, message: '没有启用的爬取目标' };
        }
        const target = targetName
            ? targets.find(t => t.name === targetName)
            : targets[0];
        if (!target) {
            return { success: false, message: `未找到目标: ${targetName}` };
        }
        try {
            this.logger.log(`开始手动爬取目标: ${target.name}`);
            const result = await this.crawlTargetWithTimeout(target.name, target.baseUrl);
            return { success: true, target: target.name, result };
        }
        catch (error) {
            this.logger.error(`手动爬取目标 ${target.name} 失败: `, error);
            return {
                success: false,
                target: target.name,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    async testConnection(targetName) {
        const targets = crawler_config_1.CRAWLER_TARGETS.filter(target => target.enabled);
        if (targets.length === 0) {
            return { success: false, message: '没有启用的爬取目标' };
        }
        if (targetName) {
            const target = targets.find(t => t.name === targetName);
            if (!target) {
                return { success: false, message: `未找到目标: ${targetName}` };
            }
            try {
                await this.crawlerService.testConnection(target.name);
                return { success: true, message: `目标 ${targetName} 连接正常` };
            }
            catch (error) {
                return {
                    success: false,
                    message: `目标 ${targetName} 连接失败: ${error instanceof Error ? error.message : '未知错误'}`
                };
            }
        }
        else {
            const results = [];
            for (const target of targets) {
                try {
                    await this.crawlerService.testConnection(target.name);
                    results.push(`${target.name}: 正常`);
                }
                catch (error) {
                    results.push(`${target.name}: 失败`);
                }
            }
            return {
                success: true,
                message: '连接测试完成',
                targets: results
            };
        }
    }
    getCrawlerStatus() {
        const targets = crawler_config_1.CRAWLER_TARGETS;
        return {
            enabled: targets.filter(t => t.enabled).length,
            total: targets.length,
            targets: targets.map(t => ({ name: t.name, enabled: t.enabled || false }))
        };
    }
    async toggleTarget(targetName, enabled) {
        const targetIndex = crawler_config_1.CRAWLER_TARGETS.findIndex(t => t.name === targetName);
        if (targetIndex === -1) {
            return { success: false, message: `未找到目标: ${targetName}` };
        }
        crawler_config_1.CRAWLER_TARGETS[targetIndex].enabled = enabled;
        this.logger.log(`爬虫目标 ${targetName} 已${enabled ? '启用' : '禁用'}`);
        return {
            success: true,
            message: `爬虫目标 ${targetName} 已${enabled ? '启用' : '禁用'}`
        };
    }
};
exports.CrawlerSchedulerService = CrawlerSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerSchedulerService.prototype, "handleScheduledCrawl", null);
exports.CrawlerSchedulerService = CrawlerSchedulerService = CrawlerSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService,
        media_resource_service_1.MediaResourceService,
        app_logger_service_1.AppLoggerService])
], CrawlerSchedulerService);
//# sourceMappingURL=crawler-scheduler.service.js.map