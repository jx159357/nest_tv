import { CrawlerTarget } from './crawler.service';

export const CRAWLER_TARGETS: CrawlerTarget[] = [
  // 电影天堂 - 主站点
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
      downloadUrls:
        '.co_content22 a[href*="thunder"], .co_content222 a[href*="magnet"], .down_list a',
    },
    enabled: true,
    priority: 1,
    maxPages: 50,
    respectRobotsTxt: true,
    requestDelay: 2000,
  },
  // 电影天堂备用域名
  {
    name: '电影天堂备用',
    baseUrl: 'https://www.dy2018.com',
    selectors: {
      title: '.title_all h1, .co_content22 ul li a',
      description: '.co_content8, .co_content222, .zoomX',
      poster: '#Zoom img, .co_content8 img',
      rating: '.rating, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a, .co_content222 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls:
        'a[href*="thunder"], a[href*="magnet"], a[href*="ftp"], a[href*="ed2k"], .down_list a',
    },
    enabled: true,
    priority: 2,
    maxPages: 30,
    respectRobotsTxt: true,
    requestDelay: 2000,
  },
  // 阳光电影
  {
    name: '阳光电影',
    baseUrl: 'https://www.ygdy8.com',
    selectors: {
      title: '.co_content22 ul li a, .title_all h1',
      description: '.co_content8, .co_content222, .zoomX',
      poster: '#Zoom img, .co_content8 img',
      rating: '.rating, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls:
        'a[href*="thunder"], a[href*="magnet"], a[href*="ftp"], .down_list a',
    },
    enabled: true,
    priority: 3,
    maxPages: 30,
    respectRobotsTxt: true,
    requestDelay: 2000,
  },
  // 6v电影
  {
    name: '6v电影',
    baseUrl: 'https://www.hao6v.com',
    selectors: {
      title: '.title_all h1, .co_content22 ul li a',
      description: '.co_content8, .co_content222, .zoom',
      poster: '#Zoom img, .co_content8 img',
      rating: '.rating, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls:
        'a[href*="thunder"], a[href*="magnet"], a[href*="ftp"], .down_list a',
    },
    enabled: true,
    priority: 4,
    maxPages: 20,
    respectRobotsTxt: true,
    requestDelay: 2500,
  },
];

export const CRAWLER_CONFIG = {
  // 请求配置
  request: {
    timeout: 30000,
    retries: 3,
    delay: 1000,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    },
  },

  // 解析配置
  parsing: {
    defaultTimeout: 10000,
    maxRetries: 2,
    respectRobotsTxt: true,
    maxConcurrentRequests: 3,
  },

  // 数据清洗配置
  cleaning: {
    removeHtmlTags: true,
    trimWhitespace: true,
    normalizeUrls: true,
    minTextLength: 2,
    maxTextLength: 5000,
  },

  // 错误处理配置
  errorHandling: {
    logErrors: true,
    continueOnError: true,
    maxErrorRate: 0.5,
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 3600,
    maxSize: 1000,
  },
};

export const CRAWLER_RULES = {
  urlFilters: {
    allowedExtensions: ['.html', '.htm', ''],
    disallowedPaths: ['/search', '/login', '/admin'],
    requiredParams: [],
  },

  contentFilters: {
    minContentLength: 50,
    maxContentLength: 1000000,
    requiredKeywords: [],
    excludedKeywords: ['error', '404', 'not found'],
  },

  validation: {
    requiredFields: ['title'],
    optionalFields: ['description', 'poster', 'rating', 'downloadUrls'],
    dataTypes: {
      title: 'string',
      rating: 'number',
      releaseDate: 'date',
    },
  },
};
