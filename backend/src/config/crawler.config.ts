/**
 * 爬虫目标网站配置
 */
import { CrawlerTarget } from '../crawler/crawler.service';

/**
 * 爬虫目标配置
 * 包含各个网站的选择器配置和爬取规则
 */
export const CRAWLER_TARGETS: CrawlerTarget[] = [
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
    enabled: false, // 暂时禁用，待配置完善
    priority: 2,
    maxPages: 5,
    respectRobotsTxt: true,
    requestDelay: 3000,
  },
  // 可以添加更多爬虫目标
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
    enabled: false, // 暂时禁用，待配置完善
    priority: 3,
    maxPages: 8,
    respectRobotsTxt: true,
    requestDelay: 1500,
  },
];

/**
 * 爬虫通用配置
 */
export const CRAWLER_CONFIG = {
  // 请求配置
  request: {
    timeout: 30000, // 30秒超时
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 3600, // 1小时缓存
    maxSize: 1000, // 最大缓存1000条
  },

  // 解析配置
  parsing: {
    maxConcurrentRequests: 3, // 最大并发请求数
    maxTextLength: 50000, // 最大文本长度
    timeout: 10000, // 解析超时时间
  },

  // 清理配置
  cleaning: {
    enabled: true,
    minTitleLength: 2, // 最小标题长度
    maxTitleLength: 200, // 最大标题长度
    minDescriptionLength: 10, // 最小描述长度
    maxDescriptionLength: 2000, // 最大描述长度
    allowedGenres: [
      '动作',
      '喜剧',
      '爱情',
      '科幻',
      '恐怖',
      '悬疑',
      '动画',
      '纪录片',
      '战争',
      '犯罪',
      '冒险',
      '奇幻',
      '剧情',
      '传记',
      '历史',
      '音乐',
      '运动',
      '西部',
      '家庭',
      '惊悚',
    ],
  },

  // 重试配置
  retry: {
    maxAttempts: 3,
    delay: 5000, // 5秒重试延迟
    backoffFactor: 2, // 退避因子
  },

  // 日志配置
  logging: {
    enabled: true,
    level: 'info', // debug, info, warn, error
    saveToFile: false,
    maxFileSize: 10485760, // 10MB
    maxFiles: 5,
  },

  // 代理配置（可选）
  proxy: {
    enabled: false,
    servers: [], // 代理服务器列表
    rotateInterval: 300000, // 5分钟轮换一次
  },

  // 速率限制配置
  rateLimit: {
    enabled: true,
    requestsPerMinute: 30, // 每分钟最多30个请求
    burstSize: 5, // 突发请求大小
  },

  // 数据验证配置
  validation: {
    strictMode: true, // 严格模式
    allowEmptyFields: ['description', 'poster', 'rating'], // 允许为空字段
    requiredFields: ['title'], // 必填字段
  },
};

/**
 * 爬虫规则配置
 */
export const CRAWLER_RULES = {
  // URL过滤规则
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

  // 内容过滤规则
  contentFilters: {
    minContentLength: 100, // 最小内容长度
    maxContentLength: 100000, // 最大内容长度
    requiredKeywords: ['电影', '下载', '在线'], // 必需关键词
    disallowedKeywords: ['广告', '推广', '垃圾'], // 禁止关键词
  },

  // 重定向规则
  redirectRules: {
    maxRedirects: 5, // 最大重定向次数
    followRedirects: true, // 是否跟随重定向
  },

  // 超时规则
  timeoutRules: {
    connectionTimeout: 10000, // 连接超时
    requestTimeout: 30000, // 请求超时
    responseTimeout: 30000, // 响应超时
  },

  // 错误处理规则
  errorHandling: {
    retryOnTimeout: true, // 超时是否重试
    retryOnError: true, // 错误是否重试
    ignoreErrors: [404, 403], // 忽略的错误状态码
    logErrors: true, // 是否记录错误
  },
};

/**
 * 爬虫任务配置
 */
export const CRAWLER_TASKS = {
  // 定时任务配置
  schedule: {
    enabled: true,
    interval: '0 0 */6 * * *', // 每6小时执行一次
    timezone: 'Asia/Shanghai',
  },

  // 任务队列配置
  queue: {
    maxSize: 1000,
    retryDelay: 60000, // 1分钟后重试
    maxRetries: 5,
  },

  // 结果处理配置
  processing: {
    batchSize: 50,
    delayBetweenBatches: 5000,
    saveToDatabase: true,
    generateReport: true,
  },
};
