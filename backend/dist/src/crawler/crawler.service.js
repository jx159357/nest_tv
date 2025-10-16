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
const proxy_pool_service_1 = require("../common/services/proxy-pool.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    mediaResourceService;
    appLogger;
    proxyPoolService;
    logger = new common_1.Logger(CrawlerService_1.name);
    httpClient;
    cache = new Map();
    constructor(mediaResourceService, appLogger, proxyPoolService) {
        this.mediaResourceService = mediaResourceService;
        this.appLogger = appLogger;
        this.proxyPoolService = proxyPoolService;
        this.httpClient = axios_1.default.create({
            timeout: crawler_config_1.CRAWLER_CONFIG.request.timeout,
            headers: {
                'User-Agent': crawler_config_1.CRAWLER_CONFIG.request.userAgent,
                ...crawler_config_1.CRAWLER_CONFIG.request.headers,
            },
        });
        this.httpClient.interceptors.request.use(config => {
            if (crawler_config_1.CRAWLER_CONFIG.proxy?.enabled && config.url) {
                const targetName = this.extractTargetNameFromUrl(config.url);
                const strategy = targetName
                    ? crawler_config_1.CRAWLER_CONFIG.proxy?.targetStrategies?.[targetName]
                    : null;
                if (strategy && strategy.useProxy) {
                    const proxy = this.proxyPoolService.getBestProxy(strategy.preferredProtocol);
                    if (proxy) {
                        config.proxy = this.createProxyConfig(proxy);
                        config.headers = {
                            ...config.headers,
                            'X-Proxy-Source': proxy.source,
                            'X-Proxy-ID': proxy.id,
                        };
                        this.logger.log(`使用代理 ${proxy.id} (${proxy.host}:${proxy.port}) 请求: ${config.url}`);
                    }
                    else {
                        this.logger.warn(`没有可用的代理进行请求: ${config.url}`);
                    }
                }
            }
            this.logger.log(`请求URL: ${config.url}`);
            return config;
        }, error => {
            this.logger.error('请求拦截器错误:', error);
            return Promise.reject(error);
        });
        this.httpClient.interceptors.response.use(response => {
            this.appLogger.log(`响应状态: ${response.status} - ${response.config.url}`, 'CRAWLER_RESPONSE');
            return response;
        }, error => {
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
            cleanedData.description = cleanedData.description.replace(/\s+/g, ' ').substring(0, 1000);
        }
        if (cleanedData.downloadUrls) {
            cleanedData.downloadUrls = cleanedData.downloadUrls
                .filter(url => url &&
                (url.startsWith('http') || url.startsWith('magnet:') || url.startsWith('thunder://')))
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
                return { success: true, data: cached };
            }
            let target = crawler_config_1.CRAWLER_TARGETS.find(t => t.name === targetName);
            if (!target) {
                target = this.createDynamicTarget(targetName, url);
                this.appLogger.log(`创建动态爬虫目标: ${targetName}`, 'CRAWLER_DYNAMIC');
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
                crawledData = this.extractGenericData($, url, target);
            }
            if (!this.validateCrawledData(crawledData)) {
                throw new Error('爬取的数据验证失败');
            }
            this.appLogger.log(`成功爬取数据: ${crawledData.title}`, 'CRAWLER_SUCCESS');
            const cleanedData = this.validateAndCleanData(crawledData);
            this.setCache(cacheKey, cleanedData);
            this.appLogger.logOperation('CRAWL', `${targetName}:${cleanedData.title}`, undefined, { url, target: targetName, title: cleanedData.title }, 'success', requestId);
            this.appLogger.clearContext(requestId);
            return { success: true, data: cleanedData };
        }
        catch (error) {
            const errorMessage = error.message || '未知错误';
            this.appLogger.error(`爬取失败 ${targetName}: ${url}`, 'CRAWLER_ERROR', error.stack, requestId);
            this.appLogger.logOperation('CRAWL', `${targetName}:${url}`, undefined, { url, target: targetName, error: errorMessage }, 'error', requestId);
            return {
                success: false,
                error: errorMessage,
                details: {
                    url,
                    targetName,
                    timestamp: new Date().toISOString(),
                    requestId,
                },
            };
        }
    }
    extractDyttData($, url, target) {
        let title = '';
        let titleText = '';
        let quality = media_resource_entity_1.MediaQuality.HD;
        titleText = $('title').text().trim();
        if (titleText) {
            const titleMatch = titleText.match(/《(.*?)》/);
            if (titleMatch) {
                title = titleMatch[1];
            }
            else {
                title = titleText.replace(/[_-]?\s*(电影天堂|dytt8899).*$/gi, '').trim();
            }
        }
        if (!title) {
            const contentTitle = $('.co_content22 ul li a, .title_all h1, .bd3r .co_area2 .title_all h1')
                .first()
                .text()
                .trim();
            if (contentTitle) {
                const titleMatch = contentTitle.match(/《(.*?)》/);
                if (titleMatch) {
                    title = titleMatch[1];
                    titleText = contentTitle;
                }
                else {
                    title = contentTitle;
                }
            }
        }
        if (!title) {
            title = this.extractTitleFromPage($);
            titleText = title;
        }
        if (titleText.includes('4K') || titleText.includes('蓝光'))
            quality = media_resource_entity_1.MediaQuality.BLUE_RAY;
        else if (titleText.includes('1080P'))
            quality = media_resource_entity_1.MediaQuality.FULL_HD;
        else if (titleText.includes('720P') || titleText.includes('HD'))
            quality = media_resource_entity_1.MediaQuality.HD;
        const dateText = $('.co_content22 ul li span, .co_content222 p').first().text().trim();
        let releaseDate;
        const datePatterns = [
            /(\d{4}-\d{1,2}-\d{1,2})/,
            /(\d{4}\/\d{1,2}\/\d{1,2})/,
            /(\d{4}年\d{1,2}月\d{1,2}日)/,
        ];
        for (const pattern of datePatterns) {
            const dateMatch = dateText.match(pattern);
            if (dateMatch) {
                releaseDate = new Date(dateMatch[1]);
                break;
            }
        }
        const downloadUrls = [];
        $('.co_content22 a, .co_content222 a, a[href*="thunder"], a[href*="magnet"], a[href*="ftp"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href && !href.includes('javascript') && !href.includes('#')) {
                downloadUrls.push(this.resolveUrl(href, target.baseUrl));
            }
        });
        const contentText = $('.co_content22, .co_content222, .zoomX').text();
        const ftpMatches = contentText.match(/ftp:\/\/[^\s\n]+/gi);
        if (ftpMatches) {
            downloadUrls.push(...ftpMatches);
        }
        const magnetMatches = contentText.match(/magnet:\?[^\s\n]+/gi);
        if (magnetMatches) {
            downloadUrls.push(...magnetMatches);
        }
        const thunderMatches = contentText.match(/thunder:\/\/[^\s\n]+/gi);
        if (thunderMatches) {
            downloadUrls.push(...thunderMatches);
        }
        const ed2kMatches = contentText.match(/ed2k:\/\/[^\s\n]+/gi);
        if (ed2kMatches) {
            downloadUrls.push(...ed2kMatches);
        }
        const uniqueUrls = [...new Set(downloadUrls)].filter(url => url && url.length > 5);
        return {
            title: title || '未知标题',
            description: this.extractDyttDescription($) || this.extractDescriptionFromPage($),
            type: this.inferMediaType(url, titleText),
            director: this.extractDyttDirector($),
            actors: this.extractDyttActors($),
            genres: this.extractDyttGenres($),
            releaseDate,
            poster: this.extractPosterFromPage($, target.baseUrl),
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
    createDynamicTarget(targetName, url) {
        const baseUrl = new URL(url).origin;
        return {
            name: targetName,
            baseUrl,
            selectors: {
                title: 'title, h1, h2, .title, .movie-title, [class*="title"]',
                description: 'meta[name="description"], .description, .summary, .content, [class*="desc"]',
                poster: 'meta[property="og:image"], .poster img, .cover img, [class*="poster"] img, [class*="cover"] img',
                rating: '.rating, .score, [class*="rating"], [class*="score"]',
                director: '.director, [class*="director"]',
                actors: '.cast, .actors, [class*="cast"], [class*="actor"]',
                genres: '.genre, .category, [class*="genre"], [class*="category"]',
                releaseDate: '.date, .release-date, [class*="date"], [class*="release"]',
                downloadUrls: 'a[href*="download"], a[href*="torrent"], a[href*="magnet"]',
            },
            enabled: true,
            priority: 99,
            maxPages: 10,
            respectRobotsTxt: true,
            requestDelay: 3000,
        };
    }
    extractGenericData($, url, target) {
        return {
            title: this.extractText($, target.selectors.title) || this.extractTitleFromPage($),
            description: this.extractText($, target.selectors.description) || this.extractDescriptionFromPage($),
            type: this.inferMediaType(url),
            director: this.extractText($, target.selectors.director),
            actors: this.extractText($, target.selectors.actors),
            genres: this.extractGenres($, target.selectors.genres),
            releaseDate: this.parseDate(this.extractText($, target.selectors.releaseDate)),
            poster: this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl) ||
                this.extractPosterFromPage($, target.baseUrl),
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
    extractTitleFromPage($) {
        const selectors = [
            'title',
            'h1',
            'meta[property="og:title"]',
            '[class*="title"]',
            '[class*="movie"]',
            '[class*="film"]',
        ];
        for (const selector of selectors) {
            const text = this.extractText($, selector);
            if (text && text.length > 2 && text.length < 200) {
                return text
                    .replace(/\s+/g, ' ')
                    .replace(/[_-]?\s*(电影|在线观看|下载|免费|完整版).*$/g, '')
                    .trim();
            }
        }
        return '未知标题';
    }
    extractDescriptionFromPage($) {
        const selectors = [
            'meta[name="description"]',
            'meta[property="og:description"]',
            '.description',
            '.summary',
            '.content',
            '[class*="desc"]',
        ];
        for (const selector of selectors) {
            let text = '';
            if (selector.includes('meta')) {
                text = $(selector).attr('content') || '';
            }
            else {
                text = $(selector).text();
            }
            if (text && text.length > 10 && text.length < 1000) {
                return text.replace(/\s+/g, ' ').trim();
            }
        }
        return '暂无描述';
    }
    extractPosterFromPage($, baseUrl) {
        const selectors = [
            'meta[property="og:image"]',
            '.poster img',
            '.cover img',
            '[class*="poster"] img',
            '[class*="cover"] img',
            'img[src*="poster"]',
            'img[src*="cover"]',
        ];
        for (const selector of selectors) {
            const src = selector.includes('meta') ? $(selector).attr('content') : $(selector).attr('src');
            if (src) {
                return this.resolveUrl(src, baseUrl);
            }
        }
        return undefined;
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
                if (result.status === 'fulfilled' &&
                    result.value &&
                    result.value.success &&
                    result.value.data) {
                    results.push(result.value.data);
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
    inferMediaType(url, titleText) {
        const lowerUrl = url.toLowerCase();
        const textToAnalyze = (titleText || url).toLowerCase();
        if (lowerUrl.includes('tv') ||
            lowerUrl.includes('series') ||
            textToAnalyze.includes('剧集') ||
            textToAnalyze.includes('连续剧') ||
            textToAnalyze.includes('电视剧') ||
            (textToAnalyze.includes('第') && textToAnalyze.includes('季'))) {
            return 'tv_series';
        }
        if (textToAnalyze.includes('综艺') || lowerUrl.includes('variety')) {
            return 'variety';
        }
        if (textToAnalyze.includes('动画') ||
            textToAnalyze.includes('动漫') ||
            lowerUrl.includes('anime')) {
            return 'anime';
        }
        if (textToAnalyze.includes('纪录') || lowerUrl.includes('doc')) {
            return 'documentary';
        }
        return 'movie';
    }
    extractGenres($, selectors) {
        const genres = [];
        const selectorList = selectors.includes(',') ? selectors.split(',') : [selectors];
        for (const selector of selectorList) {
            const elements = $(selector.trim());
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
        const selectorList = selectors.includes(',') ? selectors.split(',') : [selectors];
        for (const selector of selectorList) {
            $(selector.trim()).each((_, element) => {
                const href = $(element).attr('href');
                if (href &&
                    (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('magnet:'))) {
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
    extractTargetNameFromUrl(url) {
        for (const target of crawler_config_1.CRAWLER_TARGETS) {
            if (url.includes(target.baseUrl)) {
                return target.name;
            }
        }
        return null;
    }
    createProxyConfig(proxy) {
        const proxyConfig = {
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port,
        };
        if (proxy.username && proxy.password) {
            proxyConfig.auth = {
                username: proxy.username,
                password: proxy.password,
            };
        }
        return proxyConfig;
    }
    getProxyStats() {
        if (!crawler_config_1.CRAWLER_CONFIG.proxy?.enabled) {
            return { enabled: false, message: '代理池未启用' };
        }
        return this.proxyPoolService.getProxyStats();
    }
    async refreshProxyPool() {
        if (!crawler_config_1.CRAWLER_CONFIG.proxy?.enabled) {
            throw new Error('代理池未启用');
        }
        const result = await this.proxyPoolService.fetchProxiesFromProviders();
        return { success: result, failed: 0 };
    }
    async testProxy(proxyInfo) {
        return this.proxyPoolService.testProxy(proxyInfo);
    }
    removeFailedProxies() {
        return this.proxyPoolService.removeFailedProxies();
    }
    async initializeProxyPool() {
        if (!crawler_config_1.CRAWLER_CONFIG.proxy?.enabled) {
            this.logger.log('代理池未启用，跳过初始化');
            return;
        }
        try {
            const result = await this.proxyPoolService.fetchProxiesFromProviders();
            this.logger.log(`代理池初始化完成，获取到 ${result} 个代理`);
        }
        catch (error) {
            this.logger.error('代理池初始化失败:', error);
        }
    }
    getProxyPoolConfig() {
        return this.proxyPoolService.getConfig();
    }
    updateProxyPoolConfig(newConfig) {
        this.proxyPoolService.updateConfig(newConfig);
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService,
        app_logger_service_1.AppLoggerService,
        proxy_pool_service_1.ProxyPoolService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map