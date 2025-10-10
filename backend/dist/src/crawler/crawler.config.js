"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRAWLER_RULES = exports.CRAWLER_CONFIG = exports.CRAWLER_TARGETS = void 0;
exports.CRAWLER_TARGETS = [
    {
        name: '示例目标 - 测试用',
        baseUrl: 'https://httpbin.org/html',
        selectors: {
            title: 'h1',
            description: 'p',
            poster: '',
            rating: '',
            director: '',
            actors: '',
            genres: [],
            releaseDate: '',
            downloadUrls: [],
        },
    },
    {
        name: 'IMDB示例',
        baseUrl: 'https://www.imdb.com/title/tt0111161/',
        selectors: {
            title: '[data-testid="hero-title-block__title"]',
            description: '[data-testid="plot-xl"]',
            poster: '.ipc-poster img',
            rating: '[data-testid="hero-rating-bar__aggregate-rating__score"]',
            director: 'a.ipc-metadata-list-item__list-content-item[href*="tt_ov_dr"]',
            actors: 'a.ipc-metadata-list-item__list-content-item[href*="tt_ov_st"]',
            genres: ['.ipc-chip-list__scroller .ipc-chip span'],
            releaseDate: '[data-testid="title-details-releasedate"]',
            downloadUrls: [],
        },
    },
    {
        name: '电影资料库示例',
        baseUrl: 'https://www.imdb.com/chart/top/',
        selectors: {
            title: '.titleColumn a',
            description: '.ratingColumn strong',
            poster: '.posterColumn img',
            rating: '.ratingColumn strong',
            director: '',
            actors: '',
            genres: [],
            releaseDate: '.titleColumn .secondaryInfo',
            downloadUrls: [],
        },
    },
];
exports.CRAWLER_CONFIG = {
    request: {
        timeout: 30000,
        retries: 3,
        delay: 1000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        },
    },
    parsing: {
        defaultTimeout: 10000,
        maxRetries: 2,
        respectRobotsTxt: true,
        maxConcurrentRequests: 5,
    },
    cleaning: {
        removeHtmlTags: true,
        trimWhitespace: true,
        normalizeUrls: true,
        minTextLength: 10,
        maxTextLength: 5000,
    },
    errorHandling: {
        logErrors: true,
        continueOnError: false,
        maxErrorRate: 0.1,
    },
    cache: {
        enabled: true,
        ttl: 3600,
        maxSize: 1000,
    },
};
exports.CRAWLER_RULES = {
    urlFilters: {
        allowedExtensions: ['.html', '.htm', ''],
        disallowedPaths: ['/search', '/login', '/admin'],
        requiredParams: [],
    },
    contentFilters: {
        minContentLength: 100,
        maxContentLength: 1000000,
        requiredKeywords: ['title', 'movie', 'film'],
        excludedKeywords: ['error', '404', 'not found'],
    },
    validation: {
        requiredFields: ['title'],
        optionalFields: ['description', 'poster', 'rating'],
        dataTypes: {
            title: 'string',
            rating: 'number',
            releaseDate: 'date',
        },
    },
};
//# sourceMappingURL=crawler.config.js.map