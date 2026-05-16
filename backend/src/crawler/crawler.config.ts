import { CrawlerTarget } from './crawler.service';

export const CRAWLER_TARGETS: CrawlerTarget[] = [
  // 电影天堂 - 主站点
  {
    name: '电影天堂',
    baseUrl: 'https://www.dytt8899.com',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img, .co_content8 img',
      rating: '.rank, .co_content8 strong',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.position .updatetime, .co_content8 p span',
      downloadUrls:
        '#downlist a[href*="magnet"], .player_list a, a[href*="thunder"], a[href*="ftp"], a[href*="ed2k"]',
    },
    listingUrls: [
      'https://www.dytt8899.com/html/gndy/dyzz/index.html',
      'https://www.dytt8899.com/html/gndy/rihan/index.html',
      'https://www.dytt8899.com/html/gndy/oumei/index.html',
    ],
    enabled: true,
    priority: 1,
    maxPages: 50,
    respectRobotsTxt: true,
    requestDelay: 2000,
  },
  // 阳光电影 - 禁用（站点不可达）
  {
    name: '阳光电影',
    baseUrl: 'https://www.ygdy8.com',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img',
      rating: '.rank, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls: 'a[href*="magnet"], a[href*="thunder"], a[href*="ftp"]',
    },
    enabled: false,
    priority: 3,
    maxPages: 30,
    respectRobotsTxt: true,
    requestDelay: 2000,
  },
  // 6v电影 - 禁用（域名已变更）
  {
    name: '6v电影',
    baseUrl: 'https://www.6v520.cc',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img',
      rating: '.rank, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls: 'a[href*="magnet"], a[href*="thunder"], a[href*="ftp"]',
    },
    enabled: false,
    priority: 4,
    maxPages: 20,
    respectRobotsTxt: true,
    requestDelay: 2500,
  },
  // 天堂影院 - maccms CMS 在线播放站
  {
    name: '天堂影院',
    baseUrl: 'https://dytt001.com',
    selectors: {
      title: 'h1',
      description: '.m-text1 .txt',
      poster: '.m-text1 .txt img',
      rating: '.info span',
      director: '.info span',
      actors: '.info span',
      genres: '.info span a',
      releaseDate: '.info span',
      downloadUrls: '',
    },
    listingUrls: [
      // 电影分类
      'https://dytt001.com/html/page-5.html',  // 动作
      'https://dytt001.com/html/page-6.html',  // 喜剧
      'https://dytt001.com/html/page-7.html',  // 爱情
      'https://dytt001.com/html/page-8.html',  // 科幻
      'https://dytt001.com/html/page-9.html',  // 恐怖
      'https://dytt001.com/html/page-10.html', // 剧情
      'https://dytt001.com/html/page-11.html', // 战争
      // 电视剧分类
      'https://dytt001.com/html/page-12.html', // 国产剧
      'https://dytt001.com/html/page-13.html', // 港剧
      'https://dytt001.com/html/page-14.html', // 台剧
      'https://dytt001.com/html/page-15.html', // 日剧
      'https://dytt001.com/html/page-16.html', // 韩剧
      'https://dytt001.com/html/page-17.html', // 欧美剧
      'https://dytt001.com/html/page-18.html', // 外剧
      'https://dytt001.com/html/page-19.html', // 泰剧
      // 其他分类
      'https://dytt001.com/html/page-3.html',  // 综艺
      'https://dytt001.com/html/page-4.html',  // 动漫
      'https://dytt001.com/html/page-22.html', // 纪录片
      'https://dytt001.com/html/page-27.html', // 短剧
      // 今日更新和排行榜
      'https://dytt001.com/label/new.html',
      'https://dytt001.com/label/top.html',
    ],
    enabled: true,
    priority: 2,
    maxPages: 100,
    respectRobotsTxt: true,
    requestDelay: 1500,
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
  },
};
