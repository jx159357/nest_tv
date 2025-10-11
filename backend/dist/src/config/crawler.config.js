"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRAWLER_TASKS = exports.CRAWLER_RULES = exports.CRAWLER_CONFIG = exports.CRAWLER_TARGETS = void 0;
exports.CRAWLER_TARGETS = [
    {
        name: '电影天堂',
        baseUrl: 'https://www.dy2018.com',
        selectors: {
            title: '.co_content22 ul li a',
            description: '.co_content22',
            poster: '.co_content22 img',
            rating: '.co_content22 .rating',
            director: '.co_content22 .director',
            actors: '.co_content22 .actors',
            genres: ['.co_content22 .genres'],
            releaseDate: '.co_content22 .date',
            downloadUrls: ['.co_content22 a'],
        },
        enabled: true,
        priority: 1,
        maxPages: 10,
        respectRobotsTxt: true,
        requestDelay: 2000,
    },
    {
        name: '阳光电影',
        baseUrl: 'https://www.ygdy8.com',
        selectors: {
            title: '.title a',
            description: '.description',
            poster: '.poster img',
            rating: '.rating',
            director: '.director',
            actors: '.actors',
            genres: ['.genres'],
            releaseDate: '.date',
            downloadUrls: ['.download a'],
        },
        enabled: false,
        priority: 2,
        maxPages: 5,
        respectRobotsTxt: true,
        requestDelay: 3000,
    },
    {
        name: '人人影视',
        baseUrl: 'https://www.rrys2018.com',
        selectors: {
            title: '.movie-title a',
            description: '.movie-description',
            poster: '.movie-poster img',
            rating: '.movie-rating',
            director: '.movie-director',
            actors: '.movie-actors',
            genres: ['.movie-genres'],
            releaseDate: '.movie-date',
            downloadUrls: ['.movie-download a'],
        },
        enabled: false,
        priority: 3,
        maxPages: 8,
        respectRobotsTxt: true,
        requestDelay: 1500,
    },
];
exports.CRAWLER_CONFIG = {
    request: {
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        },
    },
    cache: {
        enabled: true,
        ttl: 3600,
        maxSize: 1000,
    },
    parsing: {
        maxConcurrentRequests: 3,
        maxTextLength: 50000,
        timeout: 10000,
    },
    cleaning: {
        enabled: true,
        minTitleLength: 2,
        maxTitleLength: 200,
        minDescriptionLength: 10,
        maxDescriptionLength: 2000,
        allowedGenres: ['动作', '喜剧', '爱情', '科幻', '恐怖', '悬疑', '动画', '纪录片', '战争', '犯罪', '冒险', '奇幻', '剧情', '传记', '历史', '音乐', '运动', '西部', '家庭', '惊悚'],
    },
    retry: {
        maxAttempts: 3,
        delay: 5000,
        backoffFactor: 2,
    },
    logging: {
        enabled: true,
        level: 'info',
        saveToFile: false,
        maxFileSize: 10485760,
        maxFiles: 5,
    },
    proxy: {
        enabled: false,
        servers: [],
        rotateInterval: 300000,
    },
    rateLimit: {
        enabled: true,
        requestsPerMinute: 30,
        burstSize: 5,
    },
    validation: {
        strictMode: true,
        allowEmptyFields: ['description', 'poster', 'rating'],
        requiredFields: ['title'],
    },
};
exports.CRAWLER_RULES = {
    urlFilters: {
        allowedExtensions: ['.html', '.htm', '', '.php', '.asp', '.aspx'],
        disallowedPaths: ['/admin', '/login', '/register', '/search', '/tag', '/category'],
        allowedPatterns: [
            /^https?:\/\/(www\.)?dy2018\.com\/.*$/,
            /^https?:\/\/(www\.)?ygdy8\.com\/.*$/,
        ],
        disallowedPatterns: [
            /.*\.(jpg|jpeg|png|gif|css|js|ico|svg|woff|ttf).*$/i,
            /.*(admin|login|register|search|tag|category).*$/i,
        ],
    },
    contentFilters: {
        minContentLength: 100,
        maxContentLength: 100000,
        requiredKeywords: ['电影', '下载', '在线'],
        disallowedKeywords: ['广告', '推广', '垃圾'],
    },
    redirectRules: {
        maxRedirects: 5,
        followRedirects: true,
    },
    timeoutRules: {
        connectionTimeout: 10000,
        requestTimeout: 30000,
        responseTimeout: 30000,
    },
    errorHandling: {
        retryOnTimeout: true,
        retryOnError: true,
        ignoreErrors: [404, 403],
        logErrors: true,
    },
};
exports.CRAWLER_TASKS = {
    schedule: {
        enabled: true,
        interval: '0 0 */6 * * *',
        timezone: 'Asia/Shanghai',
    },
    queue: {
        maxSize: 1000,
        retryDelay: 60000,
        maxRetries: 5,
    },
    processing: {
        batchSize: 50,
        delayBetweenBatches: 5000,
        saveToDatabase: true,
        generateReport: true,
    },
};
//# sourceMappingURL=crawler.config.js.map