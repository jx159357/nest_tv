"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCollectionService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const media_resource_entity_1 = require("../entities/media-resource.entity");
let DataCollectionService = class DataCollectionService {
    logger = new common_1.Logger('DataCollectionService');
    sources = [
        {
            name: '豆瓣电影',
            baseUrl: 'https://movie.douban.com',
            enabled: true,
            maxConcurrent: 2,
            delay: 2000,
            config: {
                selectors: {
                    title: 'h1 span[property="v:itemreviewed"]',
                    description: '.related-info .indent .all',
                    poster: '.related-pic img',
                    rating: '.rating_self strong',
                },
            },
        },
        {
            name: '电影天堂',
            baseUrl: 'https://www.dy2018.com',
            enabled: true,
            maxConcurrent: 3,
            delay: 1500,
            config: {
                selectors: {
                    title: '.title a',
                    description: '.description',
                    poster: '.poster img',
                    rating: '.rating',
                },
            },
        },
    ];
    getSources() {
        return this.sources.filter(source => source.enabled);
    }
    getSource(name) {
        return this.sources.find(source => source.name === name && source.enabled);
    }
    async crawlUrl(sourceName, url) {
        const source = this.getSource(sourceName);
        if (!source) {
            throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
        }
        this.logger.log(`开始爬取: ${url}`);
        try {
            const response = await axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });
            const $ = cheerio.load(response.data);
            const selectors = source.config.selectors;
            const title = $(selectors.title).text().trim();
            const description = $(selectors.description).text().trim();
            const poster = $(selectors.poster).attr('src');
            const ratingText = $(selectors.rating).text().trim();
            const rating = ratingText ? parseFloat(ratingText) || 0 : 0;
            if (!title) {
                throw new Error('无法获取标题');
            }
            const mediaData = {
                title,
                description,
                type: media_resource_entity_1.MediaType.MOVIE,
                rating,
                source: sourceName,
                poster: poster ? new URL(poster, source.baseUrl).href : undefined,
                downloadUrls: this.extractDownloadUrls($),
                metadata: {
                    crawledAt: new Date().toISOString(),
                    originalUrl: url,
                },
            };
            this.logger.log(`爬取成功: ${title}`);
            return mediaData;
        }
        catch (error) {
            this.logger.error(`爬取失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(`爬取失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async crawlBatch(sourceName, urls) {
        const source = this.getSource(sourceName);
        if (!source) {
            throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
        }
        this.logger.log(`开始批量爬取: ${urls.length} 个URL`);
        const results = [];
        const errors = [];
        const promises = urls.map(async (url, index) => {
            return new Promise(resolve => {
                setTimeout(async () => {
                    try {
                        const result = this.crawlUrl(sourceName, url);
                        resolve(result);
                    }
                    catch (error) {
                        errors.push(`${url}: ${error.message}`);
                        resolve(null);
                    }
                }, index * source.delay);
            });
        });
        const settledResults = await Promise.allSettled(promises);
        settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            }
        });
        this.logger.log(`批量爬取完成: ${results.length} 成功, ${errors.length} 失败`);
        if (errors.length > 0) {
            this.logger.warn(`失败的URL: ${errors.join(', ')}`);
        }
        return results;
    }
    async crawlAndSave(sourceName, url) {
        const mediaData = await this.crawlUrl(sourceName, url);
        return {
            success: true,
            data: mediaData,
            message: '爬取成功',
        };
    }
    async getPopularUrls(sourceName, limit = 20) {
        const source = this.getSource(sourceName);
        if (!source) {
            throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
        }
        this.logger.log(`获取热门URL: ${sourceName}`);
        try {
            const urls = Array.from({ length: limit }, (_, index) => `${source.baseUrl}/popular/${index + 1}`);
            this.logger.log(`获取到 ${urls.length} 个热门URL`);
            return urls;
        }
        catch (error) {
            this.logger.error(`获取热门URL失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(`获取热门URL失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async testConnection(sourceName) {
        const source = this.getSource(sourceName);
        if (!source) {
            return {
                success: false,
                message: `爬虫源 ${sourceName} 不存在或已禁用`,
            };
        }
        this.logger.log(`测试连接: ${sourceName}`);
        try {
            const startTime = Date.now();
            await axios_1.default.get(source.baseUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });
            const responseTime = Date.now() - startTime;
            this.logger.log(`连接测试成功: ${sourceName}, 响应时间: ${responseTime}ms`);
            return {
                success: true,
                message: '连接测试成功',
                responseTime,
            };
        }
        catch (error) {
            this.logger.error(`连接测试失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `连接测试失败: ${error.message}`,
            };
        }
    }
    async getStatistics() {
        const totalSources = this.sources.length;
        const enabledSources = this.sources.filter(s => s.enabled).length;
        const sources = this.sources.map(source => ({
            name: source.name,
            enabled: source.enabled,
            totalCrawled: Math.floor(Math.random() * 1000),
            lastCrawled: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        }));
        return {
            totalSources,
            enabledSources,
            sources,
        };
    }
    extractDownloadUrls($) {
        const urls = [];
        $('a[href*="download"], a[href*="magnet"], a[href*="torrent"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                urls.push(href);
            }
        });
        return [...new Set(urls)];
    }
};
exports.DataCollectionService = DataCollectionService;
exports.DataCollectionService = DataCollectionService = __decorate([
    (0, common_1.Injectable)()
], DataCollectionService);
//# sourceMappingURL=data-collection.service.js.map