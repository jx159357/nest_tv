"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRAWLER_RULES = exports.CRAWLER_CONFIG = exports.CRAWLER_TARGETS = void 0;
exports.CRAWLER_TARGETS = [
    {
        name: '电影天堂',
        baseUrl: 'https://www.dytt8899.com',
        selectors: {
            title: '.co_content22 ul li a, .title_all h1, .bd3r .co_area2 .title_all h1',
            description: '.co_content22, .co_content8, .co_content222, .zoomX',
            poster: '#Zoom img, .co_content8 img, .bd3r .co_area2 img',
            rating: '.rating, .score, .co_content8 .rank',
            director: '.co_content8 p, .actor p',
            actors: '.co_content8 p, .actor p',
            genres: '.co_content8 p a, .actor p a, .co_content222 p a',
            releaseDate: '.co_content8 p span, .actor p span, .co_content222 p',
            downloadUrls: '.co_content22 a[href*="thunder"], .co_content222 a[href*="magnet"], .down_list a',
        },
        enabled: true,
        priority: 1,
        maxPages: 100,
        respectRobotsTxt: true,
        requestDelay: 2000,
    },
];
exports.CRAWLER_CONFIG = {
    request: {
        timeout: 30000,
        retries: 3,
        delay: 1000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            Connection: 'keep-alive',
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