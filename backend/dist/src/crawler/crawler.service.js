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
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
let CrawlerService = CrawlerService_1 = class CrawlerService {
    logger = new common_1.Logger(CrawlerService_1.name);
    targets = [
        {
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
        {
            name: 'BT种子',
            baseUrl: 'https://www.btdigg.com',
            selectors: {
                title: '.movie-title',
                description: '.movie-description',
                poster: '.movie-poster img',
                rating: '.movie-rating',
                director: '.movie-director',
                actors: '.movie-actors',
                genres: ['.movie-genres'],
                releaseDate: '.movie-date',
                downloadUrls: ['.torrent-link'],
            },
        },
        {
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
        {
            name: 'IMDB',
            baseUrl: 'https://www.imdb.com',
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
        {
            name: 'BT蚂蚁',
            baseUrl: 'https://www.btant.com',
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
        {
            name: '电影蜜蜂',
            baseUrl: 'https://www.dytt8.net',
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
    ];
    async crawlWebsite(targetName, url) {
        try {
            const target = this.targets.find(t => t.name === targetName);
            if (!target) {
                throw new Error(`未找到爬虫目标: ${targetName}`);
            }
            this.logger.log(`开始爬取 ${targetName}: ${url}`);
            const response = await axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });
            const $ = cheerio.load(response.data);
            const crawledData = {
                title: $(target.selectors.title).first().text().trim() || '未知标题',
                description: $(target.selectors.description).first().text().trim(),
                type: this.inferMediaType(url),
                director: $(target.selectors.director).first().text().trim(),
                actors: $(target.selectors.actors).first().text().trim(),
                genres: this.extractGenres($, target.selectors.genres[0]),
                releaseDate: this.parseDate($(target.selectors.releaseDate).first().text().trim()),
                poster: this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl),
                rating: this.parseRating($(target.selectors.rating).first().text().trim()),
                source: target.name,
                downloadUrls: this.extractDownloadUrls($, target.selectors.downloadUrls[0]),
                metadata: {
                    crawledAt: new Date(),
                    crawledUrl: url,
                    website: target.name,
                },
            };
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
        const batchSize = 5;
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const promises = batch.map(url => this.crawlWebsite(targetName, url));
            const batchResults = await Promise.allSettled(promises);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            });
            await this.delay(2000);
        }
        this.logger.log(`批量爬取完成，成功获取 ${results.length} 条数据`);
        return results;
    }
    getAvailableTargets() {
        return this.targets;
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
    extractDownloadUrls($, selector) {
        const urls = [];
        $(selector).each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                urls.push(href);
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
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)()
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map