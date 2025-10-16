import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { CRAWLER_TARGETS, CRAWLER_CONFIG, CRAWLER_RULES } from './crawler.config';
import { MediaResourceService } from '../media/media-resource.service';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';
import { AppLoggerService } from '../common/services/app-logger.service';
import { ProxyPoolService } from '../common/services/proxy-pool.service';
import { ProxyInfo } from '../common/types/proxy-pool.types';

export interface CrawlerTarget {
  name: string;
  baseUrl: string;
  selectors: {
    title: string;
    description: string;
    poster: string;
    rating: string;
    director: string;
    actors: string;
    genres: string;
    releaseDate: string;
    downloadUrls: string;
  };
  enabled?: boolean; // 是否启用此爬虫
  priority?: number; // 优先级，数字越小优先级越高
  maxPages?: number; // 最大爬取页数
  respectRobotsTxt?: boolean; // 是否遵守robots.txt
  requestDelay?: number; // 请求间隔（毫秒）
}

export interface CrawledData {
  title: string;
  description?: string;
  type: 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary';
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: Date;
  poster?: string;
  backdrop?: string;
  rating: number;
  source: string;
  downloadUrls?: string[];
  episodeCount?: number;
  metadata?: any;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly httpClient: AxiosInstance;
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(
    private readonly mediaResourceService: MediaResourceService,
    private readonly appLogger: AppLoggerService,
    private readonly proxyPoolService: ProxyPoolService,
  ) {
    // 创建HTTP客户端实例
    this.httpClient = axios.create({
      timeout: CRAWLER_CONFIG.request.timeout,
      headers: {
        'User-Agent': CRAWLER_CONFIG.request.userAgent,
        ...CRAWLER_CONFIG.request.headers,
      },
    });

    // 设置请求拦截器
    this.httpClient.interceptors.request.use(
      config => {
        // 如果启用了代理，自动选择最佳代理
        if ((CRAWLER_CONFIG as any).proxy?.enabled && config.url) {
          const targetName = this.extractTargetNameFromUrl(config.url);
          const strategy = targetName
            ? (CRAWLER_CONFIG as any).proxy?.targetStrategies?.[targetName]
            : null;

          if (strategy && strategy.useProxy) {
            const proxy = this.proxyPoolService.getBestProxy(strategy.preferredProtocol);
            if (proxy) {
              config.proxy = this.createProxyConfig(proxy);
              // 类型断言以解决headers类型问题
              (config.headers as any) = {
                ...config.headers,
                'X-Proxy-Source': proxy.source,
                'X-Proxy-ID': proxy.id,
              };
              this.logger.log(
                `使用代理 ${proxy.id} (${proxy.host}:${proxy.port}) 请求: ${config.url}`,
              );
            } else {
              this.logger.warn(`没有可用的代理进行请求: ${config.url}`);
            }
          }
        }

        this.logger.log(`请求URL: ${config.url}`);
        return config;
      },
      error => {
        this.logger.error('请求拦截器错误:', error);
        return Promise.reject(error);
      },
    );

    // 设置响应拦截器
    this.httpClient.interceptors.response.use(
      response => {
        this.appLogger.log(
          `响应状态: ${response.status} - ${response.config.url}`,
          'CRAWLER_RESPONSE',
        );
        return response;
      },
      error => {
        this.appLogger.logExternalServiceError(
          'Crawler HTTP Client',
          'Response Interceptor',
          error,
          error.config?.url,
          undefined,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * 获取可用的爬虫目标
   */
  getAvailableTargets(): CrawlerTarget[] {
    return CRAWLER_TARGETS.filter(target => {
      try {
        new URL(target.baseUrl);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * 验证URL是否符合规则
   */
  private validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // 检查文件扩展名
      const ext = urlObj.pathname.toLowerCase();
      const allowedExtensions = CRAWLER_RULES.urlFilters.allowedExtensions;
      if (!allowedExtensions.some(allowedExt => ext.endsWith(allowedExt) || allowedExt === '')) {
        return false;
      }

      // 检查禁止的路径
      const disallowedPaths = CRAWLER_RULES.urlFilters.disallowedPaths;
      if (disallowedPaths.some(disallowed => urlObj.pathname.includes(disallowed))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取缓存数据
   */
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CRAWLER_CONFIG.cache.ttl * 1000) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存数据
   */
  private setCache(key: string, data: any): void {
    if (CRAWLER_CONFIG.cache.enabled && this.cache.size < CRAWLER_CONFIG.cache.maxSize) {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > CRAWLER_CONFIG.cache.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带重试机制的HTTP请求
   */
  private async fetchWithRetry(
    url: string,
    options: any = {},
    maxRetries: number = 3,
    retryDelay: number = 2000,
  ): Promise<any> {
    let lastError: Error = new Error('Unknown error');
    const requestId = this.generateRequestId();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.appLogger.log(`尝试请求 (尝试 ${attempt}/${maxRetries}): ${url}`, 'CRAWLER_FETCH');

        const response = await this.httpClient.get(url, {
          timeout: CRAWLER_CONFIG.request.timeout,
          ...options,
        });

        this.appLogger.log(`请求成功: ${url} - 状态: ${response.status}`, 'CRAWLER_SUCCESS');
        return response;
      } catch (error) {
        lastError = error;

        this.appLogger.logExternalServiceError(
          'Crawler HTTP Client',
          `Fetch Attempt ${attempt}/${maxRetries}`,
          error,
          url,
          requestId,
        );

        if (attempt < maxRetries) {
          // 指数退避
          const delay = retryDelay * Math.pow(2, attempt - 1);
          this.appLogger.warn(`等待 ${delay}ms 后重试...`, 'CRAWLER_RETRY', requestId);
          await this.delay(delay);
        }
      }
    }

    this.appLogger.error(`所有重试失败: ${url}`, 'CRAWLER_FAILED', lastError.stack, requestId);
    throw lastError;
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `crawler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理和验证爬取的数据
   */
  private validateAndCleanData(data: CrawledData): CrawledData {
    const cleanedData = { ...data };

    // 清理标题
    cleanedData.title = cleanedData.title
      .replace(/电影天堂|迅雷下载|高清下载|完整版|免费观看|在线观看/g, '')
      .trim();

    // 确保必要的字段存在
    if (!cleanedData.title || cleanedData.title.length < 2) {
      throw new Error('标题无效或过短');
    }

    // 清理描述
    if (cleanedData.description) {
      cleanedData.description = cleanedData.description.replace(/\s+/g, ' ').substring(0, 1000);
    }

    // 验证下载链接
    if (cleanedData.downloadUrls) {
      cleanedData.downloadUrls = cleanedData.downloadUrls
        .filter(
          url =>
            url &&
            (url.startsWith('http') || url.startsWith('magnet:') || url.startsWith('thunder://')),
        )
        .map(url => url.trim())
        .filter((url, index, self) => self.indexOf(url) === index); // 去重
    }

    // 设置默认评分
    if (!cleanedData.rating || cleanedData.rating < 0) {
      cleanedData.rating = 7.5; // 默认评分
    }

    return cleanedData;
  }

  /**
   * 爬取指定网站的数据
   * @param targetName 目标网站名称
   * @param url 要爬取的URL
   * @returns 爬取的结果，包含成功/失败状态和详细信息
   */
  async crawlWebsite(
    targetName: string,
    url: string,
  ): Promise<{ success: boolean; data?: CrawledData; error?: string; details?: any }> {
    const requestId = this.generateRequestId();

    try {
      // 设置请求上下文
      this.appLogger.setContext(requestId, {
        module: 'CRAWLER',
        function: 'crawlWebsite',
        requestId,
      });

      // 验证URL
      if (!this.validateUrl(url)) {
        throw new Error(`URL不符合爬取规则: ${url}`);
      }

      // 检查缓存
      const cacheKey = `crawl:${targetName}:${url}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        this.appLogger.log(`使用缓存数据: ${url}`, 'CRAWLER_CACHE');
        return { success: true, data: cached };
      }

      // 获取目标配置（优先从预定义配置中查找，否则创建动态配置）
      let target = CRAWLER_TARGETS.find(t => t.name === targetName);

      if (!target) {
        // 创建动态目标配置
        target = this.createDynamicTarget(targetName, url);
        this.appLogger.log(`创建动态爬虫目标: ${targetName}`, 'CRAWLER_DYNAMIC');
      }

      // 检查是否启用
      if (target.enabled === false) {
        throw new Error(`爬虫目标未启用: ${targetName}`);
      }

      this.appLogger.log(`开始爬取 ${targetName}: ${url}`, 'CRAWLER_START');

      // 获取网页内容
      const response = await this.fetchWithRetry(url);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const $ = cheerio.load(response.data);

      // 提取数据
      let crawledData: CrawledData;

      // 特殊处理电影天堂的数据提取
      if (targetName === '电影天堂') {
        crawledData = await this.extractDyttData($, url, target);
      } else {
        crawledData = this.extractGenericData($, url, target);
      }

      // 验证爬取的数据
      if (!this.validateCrawledData(crawledData)) {
        throw new Error('爬取的数据验证失败');
      }

      this.appLogger.log(`成功爬取数据: ${crawledData.title}`, 'CRAWLER_SUCCESS');

      // 清理和验证数据
      const cleanedData = this.validateAndCleanData(crawledData);

      // 设置缓存
      this.setCache(cacheKey, cleanedData);

      // 记录操作日志
      this.appLogger.logOperation(
        'CRAWL',
        `${targetName}:${cleanedData.title}`,
        undefined,
        { url, target: targetName, title: cleanedData.title },
        'success',
        requestId,
      );

      // 清除请求上下文
      this.appLogger.clearContext(requestId);

      return { success: true, data: cleanedData };
    } catch (error) {
      const errorMessage = error.message || '未知错误';

      this.appLogger.error(
        `爬取失败 ${targetName}: ${url}`,
        'CRAWLER_ERROR',
        error.stack,
        requestId,
      );

      // 记录操作日志
      this.appLogger.logOperation(
        'CRAWL',
        `${targetName}:${url}`,
        undefined,
        { url, target: targetName, error: errorMessage },
        'error',
        requestId,
      );

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

  /**
   * 提取电影天堂网站的数据
   */
  private extractDyttData($: cheerio.CheerioAPI, url: string, target: CrawlerTarget): CrawledData {
    // 尝试多种方式获取标题
    let title = '';
    let titleText = '';
    let quality = MediaQuality.HD;

    // 方法1: 从页面标题获取
    titleText = $('title').text().trim();
    if (titleText) {
      const titleMatch = titleText.match(/《(.*?)》/);
      if (titleMatch) {
        title = titleMatch[1];
      } else {
        // 如果没有《》格式，清理标题
        title = titleText.replace(/[_-]?\s*(电影天堂|dytt8899).*$/gi, '').trim();
      }
    }

    // 方法2: 从内容区域获取
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
        } else {
          title = contentTitle;
        }
      }
    }

    // 方法3: 从通用选择器获取
    if (!title) {
      title = this.extractTitleFromPage($);
      titleText = title;
    }

    // 解析画质信息
    if (titleText.includes('4K') || titleText.includes('蓝光')) quality = MediaQuality.BLUE_RAY;
    else if (titleText.includes('1080P')) quality = MediaQuality.FULL_HD;
    else if (titleText.includes('720P') || titleText.includes('HD')) quality = MediaQuality.HD;

    // 提取发布日期
    const dateText = $('.co_content22 ul li span, .co_content222 p').first().text().trim();
    let releaseDate: Date | undefined;

    // 尝试多种日期格式
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

    // 提取下载链接
    const downloadUrls: string[] = [];

    // 方法1: 从a标签提取链接
    $(
      '.co_content22 a, .co_content222 a, a[href*="thunder"], a[href*="magnet"], a[href*="ftp"]',
    ).each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.includes('javascript') && !href.includes('#')) {
        downloadUrls.push(this.resolveUrl(href, target.baseUrl)!);
      }
    });

    // 方法2: 从文本中提取各种链接格式
    const contentText = $('.co_content22, .co_content222, .zoomX').text();

    // 提取FTP链接
    const ftpMatches = contentText.match(/ftp:\/\/[^\s\n]+/gi);
    if (ftpMatches) {
      downloadUrls.push(...ftpMatches);
    }

    // 提取磁力链接
    const magnetMatches = contentText.match(/magnet:\?[^\s\n]+/gi);
    if (magnetMatches) {
      downloadUrls.push(...magnetMatches);
    }

    // 提取thunder链接
    const thunderMatches = contentText.match(/thunder:\/\/[^\s\n]+/gi);
    if (thunderMatches) {
      downloadUrls.push(...thunderMatches);
    }

    // 提取ed2k链接
    const ed2kMatches = contentText.match(/ed2k:\/\/[^\s\n]+/gi);
    if (ed2kMatches) {
      downloadUrls.push(...ed2kMatches);
    }

    // 去重
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
      rating: 0, // 电影天堂通常不提供评分
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

  /**
   * 提取电影天堂的描述信息
   */
  private extractDyttDescription($: cheerio.CheerioAPI): string {
    // 尝试从不同位置提取描述
    let description = '';

    // 从标题中提取
    const titleText = $('.co_content22 ul li a').first().text().trim();
    if (titleText.includes('◎')) {
      const descMatch = titleText.match(/◎(.*?)(?=◎|$)/);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }

    // 从页面内容中提取
    if (!description) {
      const content = $('.co_content22').text();
      // 提取主要描述信息
      const lines = content.split('\n').filter(line => line.trim().length > 10);
      if (lines.length > 0) {
        description = lines[0].trim();
      }
    }

    return description || '暂无简介';
  }

  /**
   * 提取电影天堂的导演信息
   */
  private extractDyttDirector($: cheerio.CheerioAPI): string {
    const content = $('.co_content22').text();

    // 匹配导演信息
    const directorMatch = content.match(/导演[:：]\s*([^\n]+)/);
    if (directorMatch) {
      return directorMatch[1].trim();
    }

    // 英文导演信息
    const directorMatch2 = content.match(/Director[:：]\s*([^\n]+)/i);
    if (directorMatch2) {
      return directorMatch2[1].trim();
    }

    return '';
  }

  /**
   * 提取电影天堂的演员信息
   */
  private extractDyttActors($: cheerio.CheerioAPI): string {
    const content = $('.co_content22').text();

    // 匹配主演信息
    const actorsMatch = content.match(/主演[:：]\s*([^\n]+)/);
    if (actorsMatch) {
      return actorsMatch[1].trim();
    }

    // 英文演员信息
    const actorsMatch2 = content.match(/Cast[:：]\s*([^\n]+)/i);
    if (actorsMatch2) {
      return actorsMatch2[1].trim();
    }

    return '';
  }

  /**
   * 提取电影天堂的类型信息
   */
  private extractDyttGenres($: cheerio.CheerioAPI): string[] {
    const content = $('.co_content22').text();
    const genres: string[] = [];

    // 匹配类型信息
    const genreMatch = content.match(/类型[:：]\s*([^\n]+)/);
    if (genreMatch) {
      const genreText = genreMatch[1].trim();
      // 分割类型
      const genreList = genreText.split(/[/,，、]/);
      genreList.forEach(genre => {
        const trimmedGenre = genre.trim();
        if (trimmedGenre && !genres.includes(trimmedGenre)) {
          genres.push(trimmedGenre);
        }
      });
    }

    // 英文类型信息
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

  /**
   * 推断剧集数量
   */
  private inferEpisodeCount(titleText: string): number | undefined {
    // 匹配剧集数量
    const episodeMatch = titleText.match(/(\d+)集/);
    if (episodeMatch) {
      return parseInt(episodeMatch[1]);
    }

    // 匹配季数信息
    const seasonMatch = titleText.match(/第(\d+)季/);
    if (seasonMatch) {
      return undefined; // 季数不是具体集数
    }

    // 如果是连续剧但没有明确集数，返回undefined
    if (titleText.includes('连续剧') || titleText.includes('剧集')) {
      return undefined;
    }

    // 默认电影返回1集
    return 1;
  }

  /**
   * 创建动态目标配置
   */
  private createDynamicTarget(targetName: string, url: string): CrawlerTarget {
    const baseUrl = new URL(url).origin;

    return {
      name: targetName,
      baseUrl,
      selectors: {
        title: 'title, h1, h2, .title, .movie-title, [class*="title"]',
        description: 'meta[name="description"], .description, .summary, .content, [class*="desc"]',
        poster:
          'meta[property="og:image"], .poster img, .cover img, [class*="poster"] img, [class*="cover"] img',
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

  /**
   * 通用数据提取方法
   */
  private extractGenericData(
    $: cheerio.CheerioAPI,
    url: string,
    target: CrawlerTarget,
  ): CrawledData {
    return {
      title: this.extractText($, target.selectors.title) || this.extractTitleFromPage($),
      description:
        this.extractText($, target.selectors.description) || this.extractDescriptionFromPage($),
      type: this.inferMediaType(url),
      director: this.extractText($, target.selectors.director),
      actors: this.extractText($, target.selectors.actors),
      genres: this.extractGenres($, target.selectors.genres),
      releaseDate: this.parseDate(this.extractText($, target.selectors.releaseDate)),
      poster:
        this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl) ||
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

  /**
   * 从页面提取标题（备用方法）
   */
  private extractTitleFromPage($: cheerio.CheerioAPI): string {
    // 尝试多种方式提取标题
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
        // 清理标题
        return text
          .replace(/\s+/g, ' ')
          .replace(/[_-]?\s*(电影|在线观看|下载|免费|完整版).*$/g, '')
          .trim();
      }
    }

    return '未知标题';
  }

  /**
   * 从页面提取描述（备用方法）
   */
  private extractDescriptionFromPage($: cheerio.CheerioAPI): string {
    // 尝试多种方式提取描述
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
      } else {
        text = $(selector).text();
      }

      if (text && text.length > 10 && text.length < 1000) {
        return text.replace(/\s+/g, ' ').trim();
      }
    }

    return '暂无描述';
  }

  /**
   * 从页面提取海报（备用方法）
   */
  private extractPosterFromPage($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    // 尝试多种方式提取海报
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

  /**
   * 批量爬取资源
   * @param targetName 目标网站名称
   * @param urls 要爬取的URL列表
   * @returns 爬取的数据列表
   */
  async batchCrawl(targetName: string, urls: string[]): Promise<CrawledData[]> {
    const results: CrawledData[] = [];
    const batchSize = CRAWLER_CONFIG.parsing.maxConcurrentRequests;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(async url => {
        const result = await this.crawlWebsite(targetName, url);
        await this.delay(CRAWLER_CONFIG.request.delay);
        return result;
      });

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach(result => {
        if (
          result.status === 'fulfilled' &&
          result.value &&
          result.value.success &&
          result.value.data
        ) {
          results.push(result.value.data);
        }
      });
    }

    this.logger.log(`批量爬取完成，成功获取 ${results.length} 条数据`);
    return results;
  }

  /**
   * 提取文本内容
   */
  private extractText($: cheerio.CheerioAPI, selector: string): string {
    if (!selector) return '';

    try {
      const text = $(selector).first().text().trim();

      // 特殊处理电影天堂的数据格式
      if (text.includes('《') && text.includes('》')) {
        // 提取电影标题，格式如：《阿凡达2》HD中英双字
        const titleMatch = text.match(/《(.*?)》/);
        return titleMatch ? titleMatch[1] : text;
      }

      return text;
    } catch (error) {
      this.logger.warn(`提取文本失败: ${selector}`, error.message);
      return '';
    }
  }

  /**
   * 推断媒体类型
   */
  private inferMediaType(
    url: string,
    titleText?: string,
  ): 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary' {
    const lowerUrl = url.toLowerCase();
    const textToAnalyze = (titleText || url).toLowerCase();

    if (
      lowerUrl.includes('tv') ||
      lowerUrl.includes('series') ||
      textToAnalyze.includes('剧集') ||
      textToAnalyze.includes('连续剧') ||
      textToAnalyze.includes('电视剧') ||
      (textToAnalyze.includes('第') && textToAnalyze.includes('季'))
    ) {
      return 'tv_series';
    }
    if (textToAnalyze.includes('综艺') || lowerUrl.includes('variety')) {
      return 'variety';
    }
    if (
      textToAnalyze.includes('动画') ||
      textToAnalyze.includes('动漫') ||
      lowerUrl.includes('anime')
    ) {
      return 'anime';
    }
    if (textToAnalyze.includes('纪录') || lowerUrl.includes('doc')) {
      return 'documentary';
    }
    return 'movie';
  }

  /**
   * 提取类型标签
   */
  private extractGenres($: cheerio.CheerioAPI, selectors: string): string[] {
    const genres: string[] = [];

    // 如果是逗号分隔的选择器，分割处理
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

  /**
   * 解析日期
   */
  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

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

  /**
   * 解析评分
   */
  private parseRating(ratingString: string): number {
    if (!ratingString) return 0;

    const match = ratingString.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const rating = parseFloat(match[1]);
      return Math.min(10, Math.max(0, rating));
    }

    return 0;
  }

  /**
   * 解析URL
   */
  private resolveUrl(url: string | undefined, baseUrl: string): string | undefined {
    if (!url) return undefined;

    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return new URL(url, baseUrl).href;
    } catch {
      return undefined;
    }
  }

  /**
   * 提取下载链接
   */
  private extractDownloadUrls($: cheerio.CheerioAPI, selectors: string): string[] {
    const urls: string[] = [];

    // 如果是逗号分隔的选择器，分割处理
    const selectorList = selectors.includes(',') ? selectors.split(',') : [selectors];

    for (const selector of selectorList) {
      $(selector.trim()).each((_, element) => {
        const href = $(element).attr('href');
        if (
          href &&
          (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('magnet:'))
        ) {
          urls.push(href);
        }
      });
    }

    // 特殊处理电影天堂的下载链接格式
    if (urls.length === 0) {
      // 尝试提取电影天堂的ftp下载链接
      $('.co_content22').each((_, element) => {
        const text = $(element).text();
        const ftpMatch = text.match(/ftp:\/\/[^\s]+/g);
        if (ftpMatch) {
          urls.push(...ftpMatch);
        }

        // 尝试提取磁力链接
        const magnetMatch = text.match(/magnet:\?[^\s]+/g);
        if (magnetMatch) {
          urls.push(...magnetMatch);
        }
      });
    }

    return [...new Set(urls)]; // 去重
  }

  /**
   * 验证爬取的数据
   */
  private validateCrawledData(data: CrawledData): boolean {
    // 检查必填字段
    if (!data.title || data.title.trim().length === 0) {
      return false;
    }

    // 检查内容长度
    if (data.description && data.description.length > CRAWLER_CONFIG.cleaning.maxTextLength) {
      return false;
    }

    // 检查评分范围
    if (data.rating < 0 || data.rating > 10) {
      return false;
    }

    return true;
  }

  /**
   * 测试目标网站连接
   */
  async testConnection(targetName: string): Promise<boolean> {
    try {
      const target = CRAWLER_TARGETS.find(t => t.name === targetName);
      if (!target) {
        throw new Error(`未找到爬虫目标: ${targetName}`);
      }

      const response = await this.httpClient.get(target.baseUrl, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error(`连接测试失败 ${targetName}:`, error.message);
      return false;
    }
  }

  /**
   * 从URL中提取目标名称
   */
  private extractTargetNameFromUrl(url: string): string | null {
    for (const target of CRAWLER_TARGETS) {
      if (url.includes(target.baseUrl)) {
        return target.name;
      }
    }
    return null;
  }

  /**
   * 创建代理配置
   */
  private createProxyConfig(proxy: ProxyInfo): any {
    const proxyConfig: any = {
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

  /**
   * 获取代理池统计信息
   */
  getProxyStats() {
    if (!(CRAWLER_CONFIG as any).proxy?.enabled) {
      return { enabled: false, message: '代理池未启用' };
    }
    return this.proxyPoolService.getProxyStats();
  }

  /**
   * 手动刷新代理池
   */
  async refreshProxyPool(): Promise<{ success: number; failed: number }> {
    if (!(CRAWLER_CONFIG as any).proxy?.enabled) {
      throw new Error('代理池未启用');
    }

    const result = await this.proxyPoolService.fetchProxiesFromProviders();
    return { success: result, failed: 0 };
  }

  /**
   * 测试特定代理
   */
  async testProxy(proxyInfo: ProxyInfo): Promise<any> {
    return this.proxyPoolService.testProxy(proxyInfo);
  }

  /**
   * 移除失效代理
   */
  removeFailedProxies(): number {
    return this.proxyPoolService.removeFailedProxies();
  }

  /**
   * 初始化代理池
   */
  async initializeProxyPool(): Promise<void> {
    if (!(CRAWLER_CONFIG as any).proxy?.enabled) {
      this.logger.log('代理池未启用，跳过初始化');
      return;
    }

    try {
      // 从提供商获取初始代理
      const result = await this.proxyPoolService.fetchProxiesFromProviders();
      this.logger.log(`代理池初始化完成，获取到 ${result} 个代理`);
    } catch (error) {
      this.logger.error('代理池初始化失败:', error);
    }
  }

  /**
   * 获取代理池配置
   */
  getProxyPoolConfig() {
    return this.proxyPoolService.getConfig();
  }

  /**
   * 更新代理池配置
   */
  updateProxyPoolConfig(newConfig: any): void {
    this.proxyPoolService.updateConfig(newConfig);
  }
}
