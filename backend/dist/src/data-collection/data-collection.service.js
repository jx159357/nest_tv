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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCollectionService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const media_resource_entity_1 = require("../entities/media-resource.entity");
const app_logger_service_1 = require("../common/services/app-logger.service");
let DataCollectionService = class DataCollectionService {
    logger;
    constructor(appLoggerService) {
        this.logger = appLoggerService;
    }
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
                    director: '.info a[rel="v:directedBy"]',
                    actors: '.info a[rel="v:starring"]',
                    genres: '.info span[property="v:genre"]',
                    releaseDate: '.info span[property="v:initialReleaseDate"]',
                    downloadUrls: ['#info a[href*="download"]'],
                },
            },
        },
        {
            name: 'IMDB',
            baseUrl: 'https://www.imdb.com',
            enabled: true,
            maxConcurrent: 2,
            delay: 3000,
            config: {
                selectors: {
                    title: '[data-testid="hero-title-block__title"]',
                    description: '[data-testid="plot"] span',
                    poster: '.ipc-media img',
                    rating: '[data-testid="hero-rating-bar__aggregate-rating__score"] span',
                    director: 'a[href*="tt_ov_dr"]',
                    actors: 'a[href*="tt_ov_st"]',
                    genres: '.ipc-chip span',
                    releaseDate: '[data-testid="title-details-releasedate"] div',
                    downloadUrls: '.ipc-split-button a',
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
                    director: '.director',
                    actors: '.actors',
                    genres: ['.genre'],
                    releaseDate: '.release-date',
                    downloadUrls: ['.download-link'],
                },
            },
        },
        {
            name: 'BT蚂蚁',
            baseUrl: 'https://www.btant.com',
            enabled: true,
            maxConcurrent: 3,
            delay: 2000,
            config: {
                selectors: {
                    title: '.movie-title h1',
                    description: '.movie-desc',
                    poster: '.movie-poster img',
                    rating: '.movie-rating',
                    director: '.movie-director',
                    actors: '.movie-actor',
                    genres: '.movie-genre',
                    releaseDate: '.movie-date',
                    downloadUrls: '.download-link',
                },
            },
        },
        {
            name: '电影蜜蜂',
            baseUrl: 'https://www.dytt8.net',
            enabled: true,
            maxConcurrent: 3,
            delay: 1500,
            config: {
                selectors: {
                    title: '.title h1',
                    description: '.content',
                    poster: '.poster img',
                    rating: '.rating',
                    director: '.director',
                    actors: '.actors',
                    genres: '.genre',
                    releaseDate: '.date',
                    downloadUrls: '.download a',
                },
            },
        },
    ];
    async collectFromUrl(sourceName, url, userId) {
        const context = { userId, function: 'collectFromUrl', sourceName, url };
        try {
            const source = this.sources.find(s => s.name === sourceName);
            if (!source || !source.enabled) {
                this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
                return null;
            }
            this.logger.logCrawler(sourceName, url, 'start', null, context);
            const startTime = Date.now();
            const response = await axios_1.default.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                },
            });
            const $ = cheerio.load(response.data);
            const { selectors } = source.config;
            const mediaData = {
                title: $(selectors.title).first().text().trim() || '未知标题',
                description: $(selectors.description).first().text().trim(),
                type: this.inferMediaType(url),
                director: $(selectors.director).first().text().trim(),
                actors: $(selectors.actors).first().text().trim(),
                genres: this.extractGenres($, selectors.genres[0]),
                releaseDate: this.parseDate($(selectors.releaseDate).first().text().trim()),
                poster: this.resolveUrl($(selectors.poster).first().attr('src'), source.baseUrl),
                backdrop: this.resolveUrl($(selectors.poster).first().attr('src'), source.baseUrl),
                rating: this.parseRating($(selectors.rating).first().text().trim()),
                source: source.name,
                downloadUrls: this.extractUrls($, selectors.downloadUrls[0], source.baseUrl),
                playUrls: this.extractUrls($, selectors.downloadUrls[0], source.baseUrl),
                metadata: {
                    crawledAt: new Date(),
                    crawledUrl: url,
                    source: source.name,
                    responseTime: Date.now() - startTime,
                },
            };
            this.logger.logCrawler(sourceName, url, 'success', {
                title: mediaData.title,
                type: mediaData.type,
                responseTime: Date.now() - startTime,
            }, context);
            return mediaData;
        }
        catch (error) {
            this.logger.logCrawler(sourceName, url, 'error', {
                error: error.message,
                responseTime: Date.now() - (startTime || Date.now()),
            }, context);
            return null;
        }
    }
    async batchCollect(sourceName, urls, userId) {
        const context = { userId, function: 'batchCollect', sourceName, urlCount: urls.length };
        try {
            const source = this.sources.find(s => s.name === sourceName);
            if (!source || !source.enabled) {
                this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
                return [];
            }
            this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'start', null, context);
            const results = [];
            const batchSize = Math.min(source.maxConcurrent, 5);
            for (let i = 0; i < urls.length; i += batchSize) {
                const batch = urls.slice(i, i + batchSize);
                const promises = batch.map(url => this.collectFromUrl(sourceName, url, userId));
                const batchResults = await Promise.allSettled(promises);
                for (const result of batchResults) {
                    if (result.status === 'fulfilled' && result.value) {
                        results.push(result.value);
                    }
                }
                if (i + batchSize < urls.length) {
                    await this.delay(source.delay);
                }
            }
            this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'success', {
                successCount: results.length,
                totalCount: urls.length,
            }, context);
            return results;
        }
        catch (error) {
            this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'error', {
                error: error.message,
            }, context);
            return [];
        }
    }
    async collectPopularResources(sourceName, count = 20, userId) {
        const context = { userId, function: 'collectPopularResources', sourceName, count };
        try {
            const source = this.sources.find(s => s.name === sourceName);
            if (!source || !source.enabled) {
                this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
                return [];
            }
            const popularUrls = await this.getPopularUrls(sourceName, count, userId);
            if (popularUrls.length === 0) {
                this.logger.warn(`No popular URLs found for source: ${sourceName}`, context);
                return [];
            }
            return await this.batchCollect(sourceName, popularUrls, userId);
        }
        catch (error) {
            this.logger.error(`Failed to collect popular resources: ${error.message}`, context, error.stack);
            return [];
        }
    }
    async getPopularUrls(sourceName, count, userId) {
        const context = { userId, function: 'getPopularUrls', sourceName, count };
        try {
            const source = this.sources.find(s => s.name === sourceName);
            if (!source)
                return [];
            switch (sourceName) {
                case '豆瓣电影':
                    return await this.getDoubanPopularUrls(count);
                case '电影天堂':
                    return await this.getDy2018PopularUrls(count);
                default:
                    this.logger.warn(`Popular URLs not implemented for source: ${sourceName}`, context);
                    return [];
            }
        }
        catch (error) {
            this.logger.error(`Failed to get popular URLs: ${error.message}`, context, error.stack);
            return [];
        }
    }
    async getDoubanPopularUrls(count) {
        try {
            const urls = [];
            const response = await axios_1.default.get('https://movie.douban.com/j/search_subjects', {
                params: {
                    type: 'movie',
                    tag: '热门',
                    page_limit: count,
                    page_start: 0,
                },
                timeout: 10000,
            });
            const $ = cheerio.load(response.data);
            $('.subject-item').each((index, element) => {
                if (urls.length < count) {
                    const url = $(element).find('.title a').attr('href');
                    if (url) {
                        urls.push(url);
                    }
                }
            });
            return urls;
        }
        catch (error) {
            this.logger.error(`Failed to get Douban popular URLs: ${error.message}`);
            return [];
        }
    }
    async getDy2018PopularUrls(count) {
        try {
            const urls = [];
            const response = await axios_1.default.get('https://www.dy2018.com/html/gndy/dyzz/index.html', {
                timeout: 10000,
            });
            const $ = cheerio.load(response.data);
            $('.co_content8 ul table').each((index, element) => {
                if (urls.length < count) {
                    const url = $(element).find('a').first().attr('href');
                    if (url) {
                        urls.push(`https://www.dy2018.com${url}`);
                    }
                }
            });
            return urls;
        }
        catch (error) {
            this.logger.error(`Failed to get DY2018 popular URLs: ${error.message}`);
            return [];
        }
    }
    inferMediaType(url) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('tv') || lowerUrl.includes('series') || lowerUrl.includes('剧集')) {
            return media_resource_entity_1.MediaType.TV_SERIES;
        }
        if (lowerUrl.includes('variety') || lowerUrl.includes('综艺')) {
            return media_resource_entity_1.MediaType.VARIETY;
        }
        if (lowerUrl.includes('anime') || lowerUrl.includes('动画') || lowerUrl.includes('动漫')) {
            return media_resource_entity_1.MediaType.ANIME;
        }
        if (lowerUrl.includes('doc') || lowerUrl.includes('纪录')) {
            return media_resource_entity_1.MediaType.DOCUMENTARY;
        }
        return media_resource_entity_1.MediaType.MOVIE;
    }
    extractGenres($, selector) {
        const genresText = $(selector).first().text().trim();
        if (!genresText)
            return [];
        return genresText
            .split(/[,，、\s]+/)
            .map(genre => genre.trim())
            .filter(genre => genre.length > 0);
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
    extractUrls($, selector, baseUrl) {
        const urls = [];
        $(selector).each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                urls.push(this.resolveUrl(href, baseUrl));
            }
        });
        return urls;
    }
    resolveUrl(url, baseUrl) {
        if (!url)
            return undefined;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        if (url.startsWith('/')) {
            return `${baseUrl}${url}`;
        }
        return `${baseUrl}/${url}`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getAvailableSources() {
        return this.sources.filter(source => source.enabled);
    }
    toggleSource(sourceName, enabled) {
        const source = this.sources.find(s => s.name === sourceName);
        if (source) {
            source.enabled = enabled;
            return true;
        }
        return false;
    }
    getSourceStats() {
        const enabledCount = this.sources.filter(s => s.enabled).length;
        return {
            totalSources: this.sources.length,
            enabledSources: enabledCount,
            disabledSources: this.sources.length - enabledCount,
            sources: this.sources.map(s => ({
                name: s.name,
                enabled: s.enabled,
                maxConcurrent: s.maxConcurrent,
                delay: s.delay,
            })),
        };
    }
};
exports.DataCollectionService = DataCollectionService;
exports.DataCollectionService = DataCollectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], DataCollectionService);
//# sourceMappingURL=data-collection.service.js.map