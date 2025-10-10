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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const crawler_config_1 = require("./crawler.config");
const media_resource_service_1 = require("../media/media-resource.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    mediaResourceService;
    logger = new common_1.Logger(CrawlerService_1.name);
    httpClient;
    cache = new Map();
    constructor(mediaResourceService) {
        this.mediaResourceService = mediaResourceService;
        this.httpClient = axios_1.default.create({
            timeout: crawler_config_1.CRAWLER_CONFIG.request.timeout,
            headers: {
                'User-Agent': crawler_config_1.CRAWLER_CONFIG.request.userAgent,
                ...crawler_config_1.CRAWLER_CONFIG.request.headers,
            },
        });
        this.httpClient.interceptors.request.use((config) => {
            this.logger.log(`请求URL: ${config.url}`);
            return config;
        }, (error) => {
            this.logger.error('请求拦截器错误:', error);
            return Promise.reject(error);
        });
        this.httpClient.interceptors.response.use((response) => {
            this.logger.log(`响应状态: ${response.status} - ${response.config.url}`);
            return response;
        }, (error) => {
            this.logger.error('响应拦截器错误:', error.message);
            return Promise.reject(error);
        });
    }
    getAvailableTargets() {
        return crawler_config_1.CRAWLER_TARGETS.filter(target => {
            try {
                new URL(target.baseUrl);
                return true;
            }
            catch {
                return false;
            }
        });
    }
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            const ext = urlObj.pathname.toLowerCase();
            const allowedExtensions = crawler_config_1.CRAWLER_RULES.urlFilters.allowedExtensions;
            if (!allowedExtensions.some(allowedExt => ext.endsWith(allowedExt) || allowedExt === '')) {
                return false;
            }
            const disallowedPaths = crawler_config_1.CRAWLER_RULES.urlFilters.disallowedPaths;
            if (disallowedPaths.some(disallowed => urlObj.pathname.includes(disallowed))) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < crawler_config_1.CRAWLER_CONFIG.cache.ttl * 1000) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    setCache(key, data) {
        if (crawler_config_1.CRAWLER_CONFIG.cache.enabled && this.cache.size < crawler_config_1.CRAWLER_CONFIG.cache.maxSize) {
            this.cache.set(key, { data, timestamp: Date.now() });
        }
    }
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > crawler_config_1.CRAWLER_CONFIG.cache.ttl * 1000) {
                this.cache.delete(key);
            }
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async crawlWebsite(targetName, url) {
        try {
            if (!this.validateUrl(url)) {
                throw new Error(`URL不符合爬取规则: ${url}`);
            }
            const cacheKey = `crawl:${targetName}:${url}`;
            const cached = this.getCache(cacheKey);
            if (cached) {
                this.logger.log(`使用缓存数据: ${url}`);
                return cached;
            }
            const target = crawler_config_1.CRAWLER_TARGETS.find(t => t.name === targetName);
            if (!target) {
                throw new Error(`未找到爬虫目标: ${targetName}`);
            }
            this.logger.log(`开始爬取 ${targetName}: ${url}`);
            const response = await this.httpClient.get(url);
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const $ = cheerio.load(response.data);
            const crawledData = {
                title: this.extractText($, target.selectors.title) || '未知标题',
                description: this.extractText($, target.selectors.description),
                type: this.inferMediaType(url),
                director: this.extractText($, target.selectors.director),
                actors: this.extractText($, target.selectors.actors),
                genres: this.extractGenres($, target.selectors.genres),
                releaseDate: this.parseDate(this.extractText($, target.selectors.releaseDate)),
                poster: this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl),
                rating: this.parseRating(this.extractText($, target.selectors.rating)),
                source: target.name,
                downloadUrls: this.extractDownloadUrls($, target.selectors.downloadUrls),
                metadata: {
                    crawledAt: new Date(),
                    crawledUrl: url,
                    website: target.name,
                },
            };
            if (!this.validateCrawledData(crawledData)) {
                throw new Error('爬取的数据验证失败');
            }
            this.setCache(cacheKey, crawledData);
            this.logger.log(`成功爬取数据: ${crawledData.title}`);
            return crawledData;
        }
        catch (error) {
            this.logger.error(`爬取失败 ${targetName}: ${url}`, error.stack);
            return null;
        }
    }
    async batchCrawl(targetName, urls) {
        const results = [];
        const batchSize = crawler_config_1.CRAWLER_CONFIG.parsing.maxConcurrentRequests;
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const promises = batch.map(async (url) => {
                const result = await this.crawlWebsite(targetName, url);
                await this.delay(crawler_config_1.CRAWLER_CONFIG.request.delay);
                return result;
            });
            const batchResults = await Promise.allSettled(promises);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            });
        }
        this.logger.log(`批量爬取完成，成功获取 ${results.length} 条数据`);
        return results;
    }
    extractText($, selector) {
        if (!selector)
            return '';
        return $(selector).first().text().trim();
    }
    inferMediaType(url) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('tv') || lowerUrl.includes('series') || lowerUrl.includes('剧集')) {
            return 'tv_series';
        }
        if (lowerUrl.includes('variety') || lowerUrl.includes('综艺')) {
            return 'variety';
        }
        if (lowerUrl.includes('anime') || lowerUrl.includes('动画') || lowerUrl.includes('动漫')) {
            return 'anime';
        }
        if (lowerUrl.includes('doc') || lowerUrl.includes('纪录')) {
            return 'documentary';
        }
        return 'movie';
    }
    extractGenres($, selectors) {
        const genres = [];
        for (const selector of selectors) {
            const elements = $(selector);
            elements.each((_, element) => {
                const text = $(element).text().trim();
                if (text && !genres.includes(text)) {
                    genres.push(text);
                }
            });
        }
        return genres;
    }
    parseDate(dateString) {
        if (!dateString)
            return undefined;
        const patterns = [
            /(\d{4})-(\d{1,2})-(\d{1,2})/,
            /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
            /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        ];
        for (const pattern of patterns) {
            const match = dateString.match(pattern);
            if (match) {
                const [, year, month, day] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
        }
        return undefined;
    }
    parseRating(ratingString) {
        if (!ratingString)
            return 0;
        const match = ratingString.match(/(\d+(?:\.\d+)?)/);
        if (match) {
            const rating = parseFloat(match[1]);
            return Math.min(10, Math.max(0, rating));
        }
        return 0;
    }
    resolveUrl(url, baseUrl) {
        if (!url)
            return undefined;
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return new URL(url, baseUrl).href;
        }
        catch {
            return undefined;
        }
    }
    extractDownloadUrls($, selectors) {
        const urls = [];
        for (const selector of selectors) {
            $(selector).each((_, element) => {
                const href = $(element).attr('href');
                if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('magnet:'))) {
                    urls.push(href);
                }
            });
        }
        return [...new Set(urls)];
    }
    validateCrawledData(data) {
        if (!data.title || data.title.trim().length === 0) {
            return false;
        }
        if (data.description && data.description.length > crawler_config_1.CRAWLER_CONFIG.cleaning.maxTextLength) {
            return false;
        }
        if (data.rating < 0 || data.rating > 10) {
            return false;
        }
        return true;
    }
    async testConnection(targetName) {
        try {
            const target = crawler_config_1.CRAWLER_TARGETS.find(t => t.name === targetName);
            if (!target) {
                throw new Error(`未找到爬虫目标: ${targetName}`);
            }
            const response = await this.httpClient.get(target.baseUrl, {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            this.logger.error(`连接测试失败 ${targetName}:`, error.message);
            return false;
        }
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map