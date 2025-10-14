import { CrawlerTarget } from './crawler.service';

export const CRAWLER_TARGETS: CrawlerTarget[] = [
  // 电影天堂 - 主站点配置 (默认常驻播放源)
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
      genres: ['.co_content8 p a, .actor p a, .co_content222 p a'],
      releaseDate: '.co_content8 p span, .actor p span, .co_content222 p',
      downloadUrls: [
        '.co_content22 a[href*="thunder"], .co_content222 a[href*="magnet"], .down_list a',
      ],
    },
    enabled: true, // 启用此爬虫
    priority: 1, // 最高优先级
    maxPages: 100, // 最大爬取页数
    respectRobotsTxt: true,
    requestDelay: 2000, // 请求间隔2秒
  },
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
  // 注意：以下为示例配置，实际使用时请确保遵守相关网站的robots.txt和使用条款
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

export const CRAWLER_CONFIG = {
  // 请求配置
  request: {
    timeout: 30000, // 30秒超时
    retries: 3, // 重试次数
    delay: 1000, // 请求间隔（毫秒）
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    },
  },

  // 解析配置
  parsing: {
    defaultTimeout: 10000,
    maxRetries: 2,
    respectRobotsTxt: true, // 遵守robots.txt
    maxConcurrentRequests: 5, // 最大并发请求数
  },

  // 数据清洗配置
  cleaning: {
    removeHtmlTags: true,
    trimWhitespace: true,
    normalizeUrls: true,
    minTextLength: 10, // 最小文本长度
    maxTextLength: 5000, // 最大文本长度
  },

  // 错误处理配置
  errorHandling: {
    logErrors: true,
    continueOnError: false,
    maxErrorRate: 0.1, // 最大错误率（10%）
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 3600, // 缓存时间（秒）
    maxSize: 1000, // 最大缓存条目数
  },
};

export const CRAWLER_RULES = {
  // URL过滤规则
  urlFilters: {
    allowedExtensions: ['.html', '.htm', ''],
    disallowedPaths: ['/search', '/login', '/admin'],
    requiredParams: [],
  },

  // 内容过滤规则
  contentFilters: {
    minContentLength: 100,
    maxContentLength: 1000000,
    requiredKeywords: ['title', 'movie', 'film'],
    excludedKeywords: ['error', '404', 'not found'],
  },

  // 数据验证规则
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
