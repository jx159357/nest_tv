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
const media_resource_entity_1 = require("../entities/media-resource.entity");
const app_logger_service_1 = require("../common/services/app-logger.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    mediaResourceService;
    appLogger;
    logger = new common_1.Logger(CrawlerService_1.name);
    httpClient;
    cache = new Map();
    constructor(mediaResourceService, appLogger) {
        this.mediaResourceService = mediaResourceService;
        this.appLogger = appLogger;
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
            this.appLogger.log(`响应状态: ${response.status} - ${response.config.url}`, 'CRAWLER_RESPONSE');
            return response;
        }, (error) => {
            this.appLogger.logExternalServiceError('Crawler HTTP Client', 'Response Interceptor', error, error.config?.url, undefined);
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
    async fetchWithRetry(url, options = {}, maxRetries = 3, retryDelay = 2000) {
        let lastError = new Error('Unknown error');
        const requestId = this.generateRequestId();
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.appLogger.log(`尝试请求 (尝试 ${attempt}/${maxRetries}): ${url}`, 'CRAWLER_FETCH');
                const response = await this.httpClient.get(url, {
                    timeout: crawler_config_1.CRAWLER_CONFIG.request.timeout,
                    ...options,
                });
                this.appLogger.log(`请求成功: ${url} - 状态: ${response.status}`, 'CRAWLER_SUCCESS');
                return response;
            }
            catch (error) {
                lastError = error;
                this.appLogger.logExternalServiceError('Crawler HTTP Client', `Fetch Attempt ${attempt}/${maxRetries}`, error, url, requestId);
                if (attempt < maxRetries) {
                    const delay = retryDelay * Math.pow(2, attempt - 1);
                    this.appLogger.warn(`等待 ${delay}ms 后重试...`, 'CRAWLER_RETRY', requestId);
                    await this.delay(delay);
                }
            }
        }
        this.appLogger.error(`所有重试失败: ${url}`, 'CRAWLER_FAILED', lastError.stack, requestId);
        throw lastError;
    }
    generateRequestId() {
        return `crawler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    validateAndCleanData(data) {
        const cleanedData = { ...data };
        cleanedData.title = cleanedData.title
            .replace(/电影天堂|迅雷下载|高清下载|完整版|免费观看|在线观看/g, '')
            .trim();
        if (!cleanedData.title || cleanedData.title.length < 2) {
            throw new Error('标题无效或过短');
        }
        if (cleanedData.description) {
            cleanedData.description = cleanedData.description
                .replace(/\s+/g, ' ')
                .substring(0, 1000);
        }
        if (cleanedData.downloadUrls) {
            cleanedData.downloadUrls = cleanedData.downloadUrls
                .filter(url => url && (url.startsWith('http') || url.startsWith('magnet:') || url.startsWith('thunder://')))
                .map(url => url.trim())
                .filter((url, index, self) => self.indexOf(url) === index);
        }
        if (!cleanedData.rating || cleanedData.rating < 0) {
            cleanedData.rating = 7.5;
        }
        return cleanedData;
    }
    async crawlWebsite(targetName, url) {
        const requestId = this.generateRequestId();
        try {
            this.appLogger.setContext(requestId, {
                module: 'CRAWLER',
                function: 'crawlWebsite',
                requestId,
            });
            if (!this.validateUrl(url)) {
                throw new Error(`URL不符合爬取规则: ${url}`);
            }
            const cacheKey = `crawl:${targetName}:${url}`;
            const cached = this.getCache(cacheKey);
            if (cached) {
                this.appLogger.log(`使用缓存数据: ${url}`, 'CRAWLER_CACHE');
                return cached;
            }
            const target = crawler_config_1.CRAWLER_TARGETS.find(t => t.name === targetName);
            if (!target) {
                throw new Error(`未找到爬虫目标: ${targetName}`);
            }
            if (target.enabled === false) {
                throw new Error(`爬虫目标未启用: ${targetName}`);
            }
            this.appLogger.log(`开始爬取 ${targetName}: ${url}`, 'CRAWLER_START');
            const response = await this.fetchWithRetry(url);
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const $ = cheerio.load(response.data);
            let crawledData;
            if (targetName === '电影天堂') {
                crawledData = await this.extractDyttData($, url, target);
            }
            else {
                crawledData = {
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
            }
            if (!this.validateCrawledData(crawledData)) {
                throw new Error('爬取的数据验证失败');
            }
            this.appLogger.log(`成功爬取数据: ${crawledData.title}`, 'CRAWLER_SUCCESS');
            const cleanedData = this.validateAndCleanData(crawledData);
            this.setCache(cacheKey, cleanedData);
            this.appLogger.logOperation('CRAWL', `${targetName}:${cleanedData.title}`, undefined, { url, target: targetName, title: cleanedData.title }, 'success', requestId);
            this.appLogger.clearContext(requestId);
            return cleanedData;
        }
        catch (error) {
            this.appLogger.error(`爬取失败 ${targetName}: ${url}`, 'CRAWLER_ERROR', error.stack, requestId);
            this.appLogger.logOperation('CRAWL', `${targetName}:${url}`, undefined, { url, target: targetName, error: error.message }, 'error', requestId);
            return null;
        }
    }
    extractDyttData($, url, target) {
        const titleText = $('.co_content22 ul li a').first().text().trim();
        let title = titleText;
        let quality = media_resource_entity_1.MediaQuality.HD;
        const titleMatch = titleText.match(/《(.*?)》/);
        if (titleMatch) {
            title = titleMatch[1];
        }
        if (titleText.includes('4K') || titleText.includes('蓝光'))
            quality = media_resource_entity_1.MediaQuality.BLUE_RAY;
        else if (titleText.includes('1080P'))
            quality = media_resource_entity_1.MediaQuality.FULL_HD;
        else if (titleText.includes('720P') || titleText.includes('HD'))
            quality = media_resource_entity_1.MediaQuality.HD;
        const dateText = $('.co_content22 ul li span').first().text().trim();
        let releaseDate;
        const dateMatch = dateText.match(/(\d{4}-\d{1,2}-\d{1,2})/);
        if (dateMatch) {
            releaseDate = new Date(dateMatch[1]);
        }
        const downloadUrls = [];
        $('.co_content22 ul li a').each((_, element) => {
            const href = $(element).attr('href');
            if (href && !href.includes('javascript')) {
                downloadUrls.push(this.resolveUrl(href, target.baseUrl));
            }
        });
        const contentText = $('.co_content22').text();
        const ftpMatches = contentText.match(/ftp:\/\/[^\s\n]+/g);
        if (ftpMatches) {
            downloadUrls.push(...ftpMatches);
        }
        const magnetMatches = contentText.match(/magnet:\?[^\s\n]+/g);
        if (magnetMatches) {
            downloadUrls.push(...magnetMatches);
        }
        const thunderMatches = contentText.match(/thunder:\/\/[^\s\n]+/g);
        if (thunderMatches) {
            downloadUrls.push(...thunderMatches);
        }
        const uniqueUrls = [...new Set(downloadUrls)];
        return {
            title,
            description: this.extractDyttDescription($),
            type: this.inferMediaType(url),
            director: this.extractDyttDirector($),
            actors: this.extractDyttActors($),
            genres: this.extractDyttGenres($),
            releaseDate,
            poster: undefined,
            rating: 0,
            source: target.name,
            downloadUrls: uniqueUrls,
            episodeCount: this.inferEpisodeCount(titleText),
            metadata: {
                quality,
                crawledAt: new Date(),
                crawledUrl: url,
                website: target.name,
                originalTitle: titleText,
            },
        };
    }
    extractDyttDescription($) {
        let description = '';
        const titleText = $('.co_content22 ul li a').first().text().trim();
        if (titleText.includes('◎')) {
            const descMatch = titleText.match(/◎(.*?)(?=◎|$)/);
            if (descMatch) {
                description = descMatch[1].trim();
            }
        }
        if (!description) {
            const content = $('.co_content22').text();
            const lines = content.split('\n').filter(line => line.trim().length > 10);
            if (lines.length > 0) {
                description = lines[0].trim();
            }
        }
        return description || '暂无简介';
    }
    extractDyttDirector($) {
        const content = $('.co_content22').text();
        const directorMatch = content.match(/导演[:：]\s*([^\n]+)/);
        if (directorMatch) {
            return directorMatch[1].trim();
        }
        const directorMatch2 = content.match(/Director[:：]\s*([^\n]+)/i);
        if (directorMatch2) {
            return directorMatch2[1].trim();
        }
        return '';
    }
    extractDyttActors($) {
        const content = $('.co_content22').text();
        const actorsMatch = content.match(/主演[:：]\s*([^\n]+)/);
        if (actorsMatch) {
            return actorsMatch[1].trim();
        }
        const actorsMatch2 = content.match(/Cast[:：]\s*([^\n]+)/i);
        if (actorsMatch2) {
            return actorsMatch2[1].trim();
        }
        return '';
    }
    extractDyttGenres($) {
        const content = $('.co_content22').text();
        const genres = [];
        const genreMatch = content.match(/类型[:：]\s*([^\n]+)/);
        if (genreMatch) {
            const genreText = genreMatch[1].trim();
            const genreList = genreText.split(/[/,，、]/);
            genreList.forEach(genre => {
                const trimmedGenre = genre.trim();
                if (trimmedGenre && !genres.includes(trimmedGenre)) {
                    genres.push(trimmedGenre);
                }
            });
        }
        const genreMatch2 = content.match(/Genre[:：]\s*([^\n]+)/i);
        if (genreMatch2 && genres.length === 0) {
            const genreText = genreMatch2[1].trim();
            const genreList = genreText.split(/[/,，、]/);
            genreList.forEach(genre => {
                const trimmedGenre = genre.trim();
                if (trimmedGenre && !genres.includes(trimmedGenre)) {
                    genres.push(trimmedGenre);
                }
            });
        }
        return genres.length > 0 ? genres : ['电影'];
    }
    inferEpisodeCount(titleText) {
        const episodeMatch = titleText.match(/(\d+)集/);
        if (episodeMatch) {
            return parseInt(episodeMatch[1]);
        }
        const seasonMatch = titleText.match(/第(\d+)季/);
        if (seasonMatch) {
            return undefined;
        }
        if (titleText.includes('连续剧') || titleText.includes('剧集')) {
            return undefined;
        }
        return 1;
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
        try {
            const text = $(selector).first().text().trim();
            if (text.includes('《') && text.includes('》')) {
                const titleMatch = text.match(/《(.*?)》/);
                return titleMatch ? titleMatch[1] : text;
            }
            return text;
        }
        catch (error) {
            this.logger.warn(`提取文本失败: ${selector}`, error.message);
            return '';
        }
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
        if (urls.length === 0) {
            $('.co_content22').each((_, element) => {
                const text = $(element).text();
                const ftpMatch = text.match(/ftp:\/\/[^\s]+/g);
                if (ftpMatch) {
                    urls.push(...ftpMatch);
                }
                const magnetMatch = text.match(/magnet:\?[^\s]+/g);
                if (magnetMatch) {
                    urls.push(...magnetMatch);
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
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService,
        app_logger_service_1.AppLoggerService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map