import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  type RawAxiosResponseHeaders,
} from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import { CRAWLER_TARGETS, CRAWLER_CONFIG, CRAWLER_RULES } from './crawler.config';
import { MediaResourceService } from '../media/media-resource.service';
import { PlaySourceService } from '../play-sources/play-source.service';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';
import { PlaySourceType, PlaySourceStatus, PlaySourceVisibility } from '../entities/play-source.entity';
import type { PlaySourceOriginInfo } from '../play-sources/play-source.service';
import { CrawlerTarget as CrawlerTargetEntity } from '../entities/crawler-target.entity';
import { AppLoggerService } from '../common/services/app-logger.service';
import { ProxyPoolService } from '../common/services/proxy-pool.service';
import {
  ProxyInfo,
  ProxyPoolConfig,
  ProxyStats,
  ProxyTestResult,
} from '../common/types/proxy-pool.types';

interface CrawlerProxyStrategy {
  useProxy: boolean;
  preferredProtocol?: ProxyInfo['protocol'];
}

interface CrawlerProxySettings {
  enabled: boolean;
  targetStrategies?: Record<string, CrawlerProxyStrategy>;
}

interface AxiosCrawlerProxyConfig {
  protocol: ProxyInfo['protocol'];
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

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
  listingUrls?: string[]; // 列表页URL（定时任务从这些页面提取详情页链接）
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
  metadata?: Record<string, unknown>;
}

export interface CrawlWebsiteResult {
  success: boolean;
  data?: CrawledData;
  error?: string;
  details?: unknown;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly httpClient: AxiosInstance;
  private readonly verboseCrawlerLogs = process.env.CRAWLER_VERBOSE_LOGS === 'true';
  private readonly cache: Map<string, { data: CrawledData; timestamp: number }> = new Map();
  private readonly inFlightCrawls: Map<string, Promise<CrawlWebsiteResult>> = new Map();
  private readonly proxySettings: CrawlerProxySettings | undefined = (
    CRAWLER_CONFIG as typeof CRAWLER_CONFIG & { proxy?: CrawlerProxySettings }
  ).proxy;

  constructor(
    @InjectRepository(CrawlerTargetEntity)
    private readonly crawlerTargetRepository: Repository<CrawlerTargetEntity>,
    private readonly mediaResourceService: MediaResourceService,
    private readonly playSourceService: PlaySourceService,
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
        if (this.proxySettings?.enabled && config.url) {
          const targetName = this.extractTargetNameFromUrl(config.url);
          const strategy = targetName
            ? this.proxySettings?.targetStrategies?.[targetName]
            : undefined;

          if (strategy && strategy.useProxy) {
            const proxy = this.proxyPoolService.getBestProxy(strategy.preferredProtocol);
            if (proxy) {
              config.proxy = this.createProxyConfig(proxy);
              config.headers.set('X-Proxy-Source', proxy.source);
              config.headers.set('X-Proxy-ID', proxy.id);
              if (this.verboseCrawlerLogs) {
                this.logger.log(
                  `使用代理 ${proxy.id} (${proxy.host}:${proxy.port}) 请求: ${config.url}`,
                );
              }
            } else {
              this.logger.warn(`没有可用的代理进行请求: ${config.url}`);
            }
          }
        }

        if (this.verboseCrawlerLogs) {
          this.logger.log(`请求URL: ${config.url}`);
        }
        return config;
      },
      (error: unknown) => {
        const normalizedError = this.toError(error);
        this.logger.error('请求拦截器错误:', normalizedError.stack);
        return Promise.reject(normalizedError);
      },
    );

    // 设置响应拦截器
    this.httpClient.interceptors.response.use(
      response => {
        if (this.verboseCrawlerLogs) {
          this.appLogger.log(
            `响应状态: ${response.status} - ${response.config.url}`,
            'CRAWLER_RESPONSE',
          );
        }
        return response;
      },
      (error: unknown) => {
        const normalizedError = this.toError(error);
        this.appLogger.logExternalServiceError(
          'Crawler HTTP Client',
          'Response Interceptor',
          normalizedError,
          axios.isAxiosError(error) ? error.config?.url : undefined,
          undefined,
        );
        return Promise.reject(normalizedError);
      },
    );
  }

  /**
   * 获取可用的爬虫目标（优先从数据库读取）
   */
  async getAvailableTargets(): Promise<CrawlerTarget[]> {
    try {
      const dbTargets = await this.crawlerTargetRepository.find({
        where: { enabled: true },
        order: { priority: 'ASC' },
      });

      if (dbTargets.length > 0) {
        return dbTargets.map(t => ({
          name: t.name,
          baseUrl: t.baseUrl,
          selectors: t.selectors,
          listingUrls: t.listingUrls,
          enabled: t.enabled,
          priority: t.priority,
          maxPages: t.maxPages,
          respectRobotsTxt: t.respectRobotsTxt,
          requestDelay: t.requestDelay,
        }));
      }
    } catch (error) {
      this.logger.warn('从数据库读取数据源配置失败，使用默认配置:', error);
    }

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
   * 获取当前激活的数据源
   */
  async getActiveTarget(): Promise<CrawlerTarget | null> {
    try {
      const activeTarget = await this.crawlerTargetRepository.findOne({
        where: { isActive: true },
      });

      if (activeTarget) {
        return {
          name: activeTarget.name,
          baseUrl: activeTarget.baseUrl,
          selectors: activeTarget.selectors,
          listingUrls: activeTarget.listingUrls,
          enabled: activeTarget.enabled,
          priority: activeTarget.priority,
          maxPages: activeTarget.maxPages,
          respectRobotsTxt: activeTarget.respectRobotsTxt,
          requestDelay: activeTarget.requestDelay,
        };
      }
    } catch (error) {
      this.logger.warn('从数据库读取激活数据源失败:', error);
    }

    return CRAWLER_TARGETS.find(t => t.enabled) || null;
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
  private getCache(key: string): CrawledData | null {
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
  private setCache(key: string, data: CrawledData): void {
    if (!CRAWLER_CONFIG.cache.enabled) return;

    if (this.cache.size >= CRAWLER_CONFIG.cache.maxSize) {
      this.cleanCache();
    }

    if (this.cache.size < CRAWLER_CONFIG.cache.maxSize) {
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
    options: AxiosRequestConfig = {},
    maxRetries: number = CRAWLER_CONFIG.request.retries,
    retryDelay: number = 2000,
  ): Promise<AxiosResponse<Buffer>> {
    let lastError: Error = new Error('Unknown error');
    const requestId = this.generateRequestId();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.verboseCrawlerLogs) {
          this.appLogger.log(`尝试请求 (尝试 ${attempt}/${maxRetries}): ${url}`, 'CRAWLER_FETCH');
        }

        const response = await this.httpClient.get<Buffer>(url, {
          responseType: 'arraybuffer',
          timeout: CRAWLER_CONFIG.request.timeout,
          ...options,
        });

        if (this.verboseCrawlerLogs) {
          this.appLogger.log(`请求成功: ${url} - 状态: ${response.status}`, 'CRAWLER_SUCCESS');
        }
        return response;
      } catch (error: unknown) {
        lastError = this.toError(error);
        const shouldRetry = this.shouldRetryRequest(error);

        if (attempt === maxRetries || !shouldRetry) {
          this.appLogger.logExternalServiceError(
            'Crawler HTTP Client',
            `Fetch Attempt ${attempt}/${maxRetries}`,
            lastError,
            url,
            requestId,
          );
        }

        if (attempt < maxRetries && shouldRetry) {
          // 指数退避
          const delay = retryDelay * Math.pow(2, attempt - 1);
          this.appLogger.warn(`等待 ${delay}ms 后重试...`, 'CRAWLER_RETRY', requestId);
          await this.delay(delay);
        } else {
          break;
        }
      }
    }

    this.appLogger.error(`所有重试失败: ${url}`, 'CRAWLER_FAILED', lastError.stack, requestId);
    throw lastError;
  }

  private shouldRetryRequest(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return true;
    }

    const status = error.response?.status;
    if (!status) {
      return true;
    }

    return status === 408 || status === 429 || status >= 500;
  }

  /**
   * 检测响应编码并将字节解码为 UTF-8 字符串
   */
  private decodeResponse(response: AxiosResponse<Buffer>): string {
    const buf = Buffer.from(response.data);

    // 1. 从 Content-Type 头检测 charset
    const headers = response.headers as RawAxiosResponseHeaders;
    const contentTypeHeader = headers['content-type'] || headers['Content-Type'] || '';
    const contentType =
      typeof contentTypeHeader === 'string'
        ? contentTypeHeader
        : Array.isArray(contentTypeHeader) && typeof contentTypeHeader[0] === 'string'
          ? contentTypeHeader[0]
          : '';
    const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
    let charset = charsetMatch ? charsetMatch[1].toLowerCase() : '';

    // 2. 从 HTML meta 标签检测 charset
    if (!charset) {
      const head = buf.slice(0, 1024).toString('ascii');
      const metaCharset = head.match(/<meta[^>]+charset=["']?([^"'\s;>]+)/i);
      if (metaCharset) {
        charset = metaCharset[1].toLowerCase();
      }
      const metaHttpEquiv = head.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;]+)/i);
      if (!charset && metaHttpEquiv) {
        charset = metaHttpEquiv[1].toLowerCase();
      }
    }

    // 3. GBK/GB2312/GB18030 使用 iconv-lite 解码
    if (
      charset &&
      (charset.includes('gbk') || charset.includes('gb2312') || charset.includes('gb18030'))
    ) {
      return iconv.decode(buf, 'gbk');
    }

    // 4. 默认 UTF-8
    return buf.toString('utf-8');
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `crawler_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
            (url.startsWith('http') ||
              url.startsWith('magnet:') ||
              url.startsWith('thunder://') ||
              url.startsWith('ed2k://') ||
              url.startsWith('ftp://') ||
              url.startsWith('jianpian://')),
        )
        .map(url => url.trim())
        .filter((url, index, self) => self.indexOf(url) === index); // 去重
    }

    if (cleanedData.rating && cleanedData.rating < 0) {
      cleanedData.rating = 0;
    }

    return cleanedData;
  }

  /**
   * 爬取指定网站的数据
   * @param targetName 目标网站名称
   * @param url 要爬取的URL
   * @returns 爬取的结果，包含成功/失败状态和详细信息
   */
  async crawlWebsite(targetName: string, url: string): Promise<CrawlWebsiteResult> {
    const crawlKey = `${targetName}:${url}`;
    const inFlight = this.inFlightCrawls.get(crawlKey);
    if (inFlight) {
      return inFlight;
    }

    const task = this.doCrawlWebsite(targetName, url);
    this.inFlightCrawls.set(crawlKey, task);

    try {
      return await task;
    } finally {
      this.inFlightCrawls.delete(crawlKey);
    }
  }

  private async doCrawlWebsite(targetName: string, url: string): Promise<CrawlWebsiteResult> {
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

      // 获取目标配置（优先从预定义配置中查找，否则按URL域名匹配，最后创建动态配置）
      let target = CRAWLER_TARGETS.find(t => t.name === targetName);

      if (!target) {
        // 尝试按 URL 域名匹配已知目标（处理请求体编码导致的名称不匹配）
        const urlOrigin = new URL(url).origin;
        target = CRAWLER_TARGETS.find(t => t.baseUrl === urlOrigin || url.startsWith(t.baseUrl));
      }

      if (!target) {
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

      const html = this.decodeResponse(response);
      const $ = cheerio.load(html);

      // 提取数据
      let crawledData: CrawledData;

      // 特殊处理电影天堂的数据提取
      if (targetName === '电影天堂') {
        crawledData = this.extractDyttData($, url, target);
      } else if (targetName === '天堂影院' || url.includes('dytt001.com')) {
        crawledData = await this.extractDytt001Data($, url, target);
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
    } catch (error: unknown) {
      const normalizedError = this.toError(error);
      const errorMessage = normalizedError.message || '未知错误';

      this.appLogger.error(
        `爬取失败 ${targetName}: ${url}`,
        'CRAWLER_ERROR',
        normalizedError.stack,
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
        title = titleText.replace(/[_-]?\s*(电影天堂|dytt8899).*$/gi, '').trim();
      }
    }

    // 方法2: 从 .title_all h1 获取
    if (!title) {
      const h1Text = $('.title_all h1').first().text().trim();
      if (h1Text) {
        const titleMatch = h1Text.match(/《(.*?)》/);
        title = titleMatch ? titleMatch[1] : h1Text;
        titleText = h1Text;
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
    const dateText = $('.position .updatetime, .co_content8 p span').first().text().trim();
    let releaseDate: Date | undefined;
    const datePatterns = [/(\d{4}-\d{1,2}-\d{1,2})/, /(\d{4}\/\d{1,2}\/\d{1,2})/];
    for (const pattern of datePatterns) {
      const dateMatch = dateText.match(pattern);
      if (dateMatch) {
        releaseDate = new Date(dateMatch[1]);
        break;
      }
    }

    // 提取下载链接
    const downloadUrls: string[] = [];

    // 方法1: 从 #downlist 提取磁力链接（display:none 也能解析）
    $('#downlist a').each((_, element) => {
      const href = $(element).attr('href');
      if (
        href &&
        (href.startsWith('magnet:') || href.startsWith('thunder://') || href.startsWith('ed2k://'))
      ) {
        downloadUrls.push(href);
      }
    });

    // 方法2: 从 .player_list 提取 jianpian:// 和 ftp 链接
    $('.player_list a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.includes('javascript') && !href.includes('#')) {
        downloadUrls.push(href);
      }
    });

    // 方法3: 从 #Zoom 和 .co_content8 提取各种链接
    $('#Zoom a, .co_content8 a, a[href*="thunder"], a[href*="magnet"], a[href*="ftp"]').each(
      (_, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('javascript') && !href.includes('#')) {
          downloadUrls.push(this.resolveUrl(href, target.baseUrl)!);
        }
      },
    );

    // 方法4: 从页面全文文本中提取链接
    const contentText = $('#Zoom, .co_content8').text();
    const ftpMatches = contentText.match(/ftp:\/\/[^\s\n<]+/gi);
    if (ftpMatches) downloadUrls.push(...ftpMatches);
    const magnetMatches = contentText.match(/magnet:\?[^\s\n<]+/gi);
    if (magnetMatches) downloadUrls.push(...magnetMatches);
    const thunderMatches = contentText.match(/thunder:\/\/[^\s\n<]+/gi);
    if (thunderMatches) downloadUrls.push(...thunderMatches);
    const ed2kMatches = contentText.match(/ed2k:\/\/[^\s\n<]+/gi);
    if (ed2kMatches) downloadUrls.push(...ed2kMatches);

    // 去重并过滤无效链接
    const uniqueUrls = [...new Set(downloadUrls)].filter(url => url && url.length > 5);

    return {
      title: title || '未知标题',
      description: this.extractDyttDescription($) || this.extractDescriptionFromPage($),
      type: this.inferMediaType(url, titleText),
      director: this.extractDyttDirector($),
      actors: this.extractDyttActors($),
      genres: this.extractDyttGenres($),
      releaseDate,
      poster:
        this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl) ||
        this.extractPosterFromPage($, target.baseUrl),
      rating: 6.0,
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
   * 提取天堂影院 (dytt001.com) 的数据
   * 该站使用 maccms CMS，详情页有 ◎ 标记的元数据，播放页有 m3u8 源
   */
  private async extractDytt001Data(
    $: cheerio.CheerioAPI,
    url: string,
    target: CrawlerTarget,
  ): Promise<CrawledData> {
    // 标题
    const title = $('h1').first().text().trim() || this.extractTitleFromPage($);

    // 从 ◎ 标记的段落中提取元数据
    const paragraphs = $('.m-text1 .txt p, .co_content8 p');
    let director = '';
    let actors = '';
    let genres: string[] = [];
    let releaseDate: Date | undefined;
    let rating = 6.0;
    const descriptionParts: string[] = [];

    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('◎导') && text.includes('演')) {
        director = text.replace(/◎导[\u3000\s]*演[\u3000\s]*/g, '').trim();
      } else if (text.includes('◎演') && text.includes('员')) {
        actors = text.replace(/◎演[\u3000\s]*员[\u3000\s]*/g, '').trim();
      } else if (text.includes('◎类') && text.includes('别')) {
        const genreText = text.replace(/◎类[\u3000\s]*别[\u3000\s]*/g, '').trim();
        genres = genreText
          .split(/[,，、/]/)
          .map(g => g.trim())
          .filter(Boolean);
      } else if (text.includes('◎年　　代')) {
        const yearMatch = text.match(/(\d{4})/);
        if (yearMatch) {
          releaseDate = new Date(`${yearMatch[1]}-01-01`);
        }
      } else if (text.includes('◎豆瓣评分')) {
        const ratingMatch = text.match(/([\d.]+)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      } else if (text.includes('◎简　　介') || text.includes('◎剧情介绍')) {
        // 下一段是简介
      } else if (text.length > 20 && !text.startsWith('◎')) {
        descriptionParts.push(text);
      }
    });

    // 海报
    const poster = $('.m-text1 .txt img').first().attr('src') || '';

    // 提取播放页链接，按来源分组获取 m3u8 源
    const allPlayUrls: string[] = [];
    $('a[href*="/html/play/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/html/play/')) {
        const fullUrl = href.startsWith('http') ? href : `${target.baseUrl}${href}`;
        if (!allPlayUrls.includes(fullUrl)) {
          allPlayUrls.push(fullUrl);
        }
      }
    });

    // 按来源分组: /html/play/{id}-{source}-{episode}.html
    const sourceMap = new Map<string, string[]>();
    for (const playUrl of allPlayUrls) {
      const match = playUrl.match(/\/play\/\d+-(\d+)-\d+\.html/);
      if (match) {
        const sourceId = match[1];
        if (!sourceMap.has(sourceId)) {
          sourceMap.set(sourceId, []);
        }
        sourceMap.get(sourceId)!.push(playUrl);
      }
    }

    // 访问每个来源的第一个播放页获取 m3u8 源
    const downloadUrls: string[] = [];
    const sourceNames: string[] = [];
    const sourceOrigins: PlaySourceOriginInfo[] = [];
    const sourcesToFetch = Array.from(sourceMap.entries()).slice(0, 5); // 最多5个来源

    for (const [sourceId, urls] of sourcesToFetch) {
      try {
        const playPageUrl = urls[0];
        const playResponse = await this.fetchWithRetry(playPageUrl, {}, 2, 1000);
        const playHtml = this.decodeResponse(playResponse);

        // 从 player_aaaa 变量中提取 m3u8 URL
        const playerMatch = playHtml.match(/"url"\s*:\s*"(https?:[^"]+\.m3u8[^"]*)"/);
        if (playerMatch) {
          const m3u8Url = this.decodeJsonString(playerMatch[1]);
          if (!downloadUrls.includes(m3u8Url)) {
            downloadUrls.push(m3u8Url);
            sourceNames.push(`源${sourceId}`);
            sourceOrigins.push({
              originSite: target.name,
              originDetailUrl: url,
              originPlayPageUrl: playPageUrl,
              originSourceId: sourceId,
              episodeNumber: this.extractDytt001EpisodeNumber(playPageUrl),
              resolvedAt: new Date().toISOString(),
            });
          }
        } else {
          // 也尝试匹配其他格式的视频源
          const anyUrlMatch = playHtml.match(/"url"\s*:\s*"(https?:[^"]+)"/);
          if (anyUrlMatch) {
            const videoUrl = this.decodeJsonString(anyUrlMatch[1]);
            if (!downloadUrls.includes(videoUrl)) {
              downloadUrls.push(videoUrl);
              sourceNames.push(`源${sourceId}`);
              sourceOrigins.push({
                originSite: target.name,
                originDetailUrl: url,
                originPlayPageUrl: playPageUrl,
                originSourceId: sourceId,
                episodeNumber: this.extractDytt001EpisodeNumber(playPageUrl),
                resolvedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (error) {
        this.logger.warn(`获取播放页失败 [源${sourceId}]: ${urls[0]}`, this.toError(error).message);
      }
    }

    // 从分类页推断类型
    const type = this.inferMediaTypeFromUrl(url) || this.inferMediaType(url, title);

    return {
      title: title || '未知标题',
      description:
        descriptionParts.join('\n').substring(0, 1000) || this.extractDescriptionFromPage($),
      type,
      director: director || undefined,
      actors: actors || undefined,
      genres: genres.length > 0 ? genres : undefined,
      releaseDate,
      poster: poster || undefined,
      rating,
      source: target.name,
      downloadUrls,
      episodeCount: allPlayUrls.length > 1 ? allPlayUrls.length : undefined,
      metadata: {
        crawledAt: new Date(),
        crawledUrl: url,
        website: target.name,
        playUrls: allPlayUrls,
        sourceNames,
        sourceOrigins,
      },
    };
  }

  private extractDytt001EpisodeNumber(playPageUrl: string): number | undefined {
    const match = playPageUrl.match(/\/play\/\d+-\d+-(\d+)\.html/);
    if (!match) {
      return undefined;
    }

    const episodeNumber = parseInt(match[1], 10);
    return Number.isFinite(episodeNumber) ? episodeNumber : undefined;
  }

  /**
   * 从 URL 推断媒体类型（基于分类页面 ID）
   */
  private inferMediaTypeFromUrl(url: string): CrawledData['type'] | null {
    const pageMatch = url.match(/page-(\d+)\.html/);
    if (pageMatch) {
      const pageId = parseInt(pageMatch[1]);
      const typeMap: Record<number, CrawledData['type']> = {
        5: 'movie',
        6: 'movie',
        7: 'movie',
        8: 'movie',
        9: 'movie',
        10: 'movie',
        11: 'movie',
        12: 'tv_series',
        13: 'tv_series',
        14: 'tv_series',
        15: 'tv_series',
        16: 'tv_series',
        17: 'tv_series',
        18: 'tv_series',
        19: 'tv_series',
        3: 'variety',
        4: 'anime',
        22: 'documentary',
        27: 'tv_series',
      };
      return typeMap[pageId] || null;
    }
    return null;
  }

  /**
   * 提取电影天堂的描述信息
   */
  private extractDyttDescription($: cheerio.CheerioAPI): string {
    let description = '';

    // 从 #Zoom 提取描述（包含图片和详细信息的区域）
    const zoomText = $('#Zoom').text().trim();
    if (zoomText) {
      // 提取 ◎ 开头的描述行
      const lines = zoomText.split('\n').filter(line => line.trim().length > 5);
      const descLines = lines.filter(
        line => line.includes('◎') || line.includes('简') || line.includes('剧情'),
      );
      if (descLines.length > 0) {
        description = descLines[0].replace(/◎\s*/, '').trim();
      }
    }

    // 从页面内容中提取
    if (!description) {
      const content = $('.co_content8').text();
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
    const content = $('#Zoom, .co_content8').text();
    const directorMatch = content.match(/导\s*演[:：]\s*([^\n◎]+)/);
    if (directorMatch) return directorMatch[1].trim();
    const directorMatch2 = content.match(/Director[:：]\s*([^\n]+)/i);
    if (directorMatch2) return directorMatch2[1].trim();
    return '';
  }

  /**
   * 提取电影天堂的演员信息
   */
  private extractDyttActors($: cheerio.CheerioAPI): string {
    const content = $('#Zoom, .co_content8').text();
    const actorsMatch = content.match(/主\s*演[:：]\s*([^\n◎]+)/);
    if (actorsMatch) return actorsMatch[1].trim();
    const actorsMatch2 = content.match(/Cast[:：]\s*([^\n]+)/i);
    if (actorsMatch2) return actorsMatch2[1].trim();
    return '';
  }

  /**
   * 提取电影天堂的类型信息
   */
  private extractDyttGenres($: cheerio.CheerioAPI): string[] {
    const content = $('#Zoom, .co_content8').text();
    const genres: string[] = [];

    const genreMatch = content.match(/类\s*型[:：]\s*([^\n◎]+)/);
    if (genreMatch) {
      const genreText = genreMatch[1].trim();
      const genreList = genreText.split(/[/,，、]/);
      genreList.forEach(genre => {
        const trimmedGenre = genre.trim();
        if (trimmedGenre && !genres.includes(trimmedGenre)) {
          genres.push(trimmedGenre);
        }
      });
    }

    // 从分组链接中提取类型
    $('.position a').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 10 && !genres.includes(text)) {
        genres.push(text);
      }
    });

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
    let failedCount = 0;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(async (url, index) => {
        if (index > 0) {
          await this.delay(CRAWLER_CONFIG.request.delay * index);
        }
        return this.crawlWebsite(targetName, url);
      });

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success && result.value.data) {
          results.push(result.value.data);
        } else {
          failedCount++;
          const reason: unknown =
            result.status === 'rejected' ? (result.reason as unknown) : result.value;
          this.logger.warn(
            `批量爬取失败 [${batch[index]}]: ${reason instanceof Error ? reason.message : String(reason)}`,
          );
        }
      });

      if (i + batchSize < urls.length) {
        await this.delay(CRAWLER_CONFIG.request.delay);
      }
    }

    this.logger.log(`批量爬取完成: 成功 ${results.length}/${urls.length}, 失败 ${failedCount}`);
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
    } catch (error: unknown) {
      this.logger.warn(`提取文本失败: ${selector}`, this.toError(error).message);
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
    if (!ratingString) return 6.0;

    const match = ratingString.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const rating = parseFloat(match[1]);
      return Math.min(10, Math.max(0, rating));
    }

    return 6.0;
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
    } catch (error: unknown) {
      this.logger.error(`连接测试失败 ${targetName}:`, this.toError(error).message);
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
  private createProxyConfig(proxy: ProxyInfo): AxiosCrawlerProxyConfig {
    const proxyConfig: AxiosCrawlerProxyConfig = {
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
  getProxyStats(): ProxyStats | { enabled: false; message: string } {
    if (!this.proxySettings?.enabled) {
      return { enabled: false, message: '代理池未启用' };
    }
    return this.proxyPoolService.getProxyStats();
  }

  /**
   * 手动刷新代理池
   */
  async refreshProxyPool(): Promise<{ success: number; failed: number }> {
    if (!this.proxySettings?.enabled) {
      throw new Error('代理池未启用');
    }

    const result = await this.proxyPoolService.fetchProxiesFromProviders();
    return { success: result, failed: 0 };
  }

  /**
   * 测试特定代理
   */
  async testProxy(proxyInfo: ProxyInfo): Promise<ProxyTestResult> {
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
    if (!this.proxySettings?.enabled) {
      this.logger.log('代理池未启用，跳过初始化');
      return;
    }

    try {
      // 从提供商获取初始代理
      const result = await this.proxyPoolService.fetchProxiesFromProviders();
      this.logger.log(`代理池初始化完成，获取到 ${result} 个代理`);
    } catch (error: unknown) {
      this.logger.error('代理池初始化失败:', this.toError(error).stack);
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
  updateProxyPoolConfig(newConfig: Partial<ProxyPoolConfig>): void {
    this.proxyPoolService.updateConfig(newConfig);
  }

  /**
   * 从列表页提取详情页链接
   */
  async extractDetailPageUrls(
    targetName: string,
    listingUrl: string,
    maxPages: number = 20,
  ): Promise<string[]> {
    try {
      const response = await this.fetchWithRetry(listingUrl);
      const html = this.decodeResponse(response);
      const $ = cheerio.load(html);

      const target = CRAWLER_TARGETS.find(t => t.name === targetName);
      const baseUrl = target?.baseUrl || new URL(listingUrl).origin;
      const urls: string[] = [];

      if (targetName === '电影天堂') {
        // DYTT: 从分类列表中提取详情页链接
        $(
          '.co_area2 .co_content8 ul li a, ' +
            '.list_area li a, ' +
            '.co_area2 a[href*="html"], ' +
            '#header .nav a',
        ).each((_, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('javascript') && href !== '#' && href !== '/') {
            const fullUrl = this.resolveUrl(href, baseUrl);
            if (fullUrl && fullUrl.includes('.html') && fullUrl !== listingUrl) {
              urls.push(fullUrl);
            }
          }
        });
      }

      if (targetName === '天堂影院' || listingUrl.includes('dytt001.com')) {
        // dytt001.com: 提取 /html/file-XXXXX.html 格式的详情页链接
        $('a[href*="/html/file-"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/html/file-')) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            if (!urls.includes(fullUrl)) {
              urls.push(fullUrl);
            }
          }
        });
      }

      // 通用提取: 所有指向详情页的链接
      if (urls.length === 0) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (
            href &&
            !href.startsWith('javascript') &&
            !href.startsWith('#') &&
            href.includes('.html')
          ) {
            const fullUrl = this.resolveUrl(href, baseUrl);
            if (fullUrl && fullUrl !== listingUrl && !urls.includes(fullUrl)) {
              const path = new URL(fullUrl).pathname;
              if (
                !path.includes('/search') &&
                !path.includes('/login') &&
                !path.includes('/index') &&
                !path.includes('/list') &&
                path.split('/').filter(Boolean).length >= 2
              ) {
                urls.push(fullUrl);
              }
            }
          }
        });
      }

      return [...new Set(urls)].slice(0, maxPages);
    } catch (error: unknown) {
      this.logger.error(`提取详情页链接失败 ${targetName}:`, this.toError(error).message);
      return [];
    }
  }

  /**
   * 将爬取的数据保存到数据库（创建或更新媒体资源及播放源）
   */
  async saveCrawledData(
    data: CrawledData,
    source: string,
  ): Promise<{
    mediaResourceId: number;
    created: boolean;
    playSourceCount: number;
    skippedPlaySources: number;
  }> {
    if (!data || !data.title) {
      throw new Error('无效的爬取数据：缺少标题');
    }

    const mediaData = {
      title: data.title,
      description: data.description || '',
      type: (data.type as MediaType) || MediaType.MOVIE,
      director: data.director || '',
      actors: data.actors || '',
      genres: Array.isArray(data.genres) ? data.genres : [],
      releaseDate: data.releaseDate || undefined,
      quality: MediaQuality.HD,
      poster: data.poster || '',
      backdrop: data.backdrop || '',
      rating: data.rating || 0,
      viewCount: 0,
      isActive: true,
      source,
      metadata: data.metadata || {},
      duration: data.episodeCount || undefined,
      episodeCount: data.episodeCount || undefined,
      downloadUrls: Array.isArray(data.downloadUrls) ? data.downloadUrls : [],
    };

    const existingMedia = await this.mediaResourceService.findDuplicateCandidate(mediaData);
    if (existingMedia) {
      const syncResult = await this.syncPlaySources(existingMedia.id, data, source);
      this.logger.log(`资源已存在，已同步播放源: ${data.title}`);
      return {
        mediaResourceId: existingMedia.id,
        created: false,
        playSourceCount: syncResult.created,
        skippedPlaySources: syncResult.skipped,
      };
    }

    const mediaResource = await this.mediaResourceService.create(mediaData);
    const syncResult = await this.syncPlaySources(mediaResource.id, data, source);
    this.logger.log(`成功保存资源: ${data.title}`);

    return {
      mediaResourceId: mediaResource.id,
      created: true,
      playSourceCount: syncResult.created,
      skippedPlaySources: syncResult.skipped,
    };
  }

  private async syncPlaySources(
    mediaResourceId: number,
    data: CrawledData,
    source: string,
  ): Promise<{ created: number; skipped: number }> {
    const urls = Array.isArray(data.downloadUrls)
      ? data.downloadUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : [];

    if (urls.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const existingSources = await this.playSourceService.getByMediaResource(mediaResourceId);
    const existingUrls = new Set(existingSources.map(s => s.url));
    let created = 0;
    let skipped = 0;

    // 从 metadata 获取来源名称列表
    const sourceNames = this.normalizeStringArray(data.metadata?.sourceNames);
    const sourceOrigins = this.normalizePlaySourceOrigins(data.metadata?.sourceOrigins);

    for (const [index, url] of urls.entries()) {
      if (existingUrls.has(url)) {
        const existingSource = existingSources.find(sourceItem => sourceItem.url === url);
        const origin = sourceOrigins[index];
        if (existingSource) {
          await this.playSourceService.update(existingSource.id, {
            lastCheckedAt: new Date(),
            status: PlaySourceStatus.ACTIVE,
            isActive: true,
          });
          if (origin) {
            await this.playSourceService.updateOriginInfo(existingSource.id, origin);
          }
        }
        skipped++;
        continue;
      }

      // 使用真实来源名称，如果没有则使用默认格式
      const sourceName = sourceNames[index] || `${source}源 ${index + 1}`;

      const playSource = await this.playSourceService.create(
        {
          mediaResourceId,
          type: this.inferPlaySourceType(url),
          url,
          priority: index + 1,
          sourceName,
        },
        { visibility: PlaySourceVisibility.PUBLIC },
      );
      const origin = sourceOrigins[index];
      if (origin) {
        await this.playSourceService.updateOriginInfo(playSource.id, origin);
      }

      created++;
    }

    return { created, skipped };
  }

  private inferPlaySourceType(url: string): PlaySourceType {
    const normalizedUrl = url.toLowerCase();

    if (normalizedUrl.startsWith('magnet:')) {
      return PlaySourceType.MAGNET;
    }

    if (
      normalizedUrl.startsWith('ftp:') ||
      normalizedUrl.startsWith('thunder:') ||
      normalizedUrl.startsWith('ed2k:')
    ) {
      return PlaySourceType.DOWNLOAD;
    }

    if (normalizedUrl.includes('.m3u8') || normalizedUrl.startsWith('rtmp')) {
      return PlaySourceType.STREAM;
    }

    return PlaySourceType.ONLINE;
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  private normalizePlaySourceOrigins(value: unknown): PlaySourceOriginInfo[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(item => this.normalizePlaySourceOrigin(item))
      .filter((item): item is PlaySourceOriginInfo => Boolean(item));
  }

  private normalizePlaySourceOrigin(value: unknown): PlaySourceOriginInfo | undefined {
    if (!this.isRecord(value)) {
      return undefined;
    }

    const origin: PlaySourceOriginInfo = {
      originSite: typeof value.originSite === 'string' ? value.originSite : undefined,
      originDetailUrl:
        typeof value.originDetailUrl === 'string' ? value.originDetailUrl : undefined,
      originPlayPageUrl:
        typeof value.originPlayPageUrl === 'string' ? value.originPlayPageUrl : undefined,
      originSourceId: typeof value.originSourceId === 'string' ? value.originSourceId : undefined,
      episodeNumber:
        typeof value.episodeNumber === 'number' && Number.isFinite(value.episodeNumber)
          ? value.episodeNumber
          : undefined,
      resolvedAt: typeof value.resolvedAt === 'string' ? value.resolvedAt : undefined,
    };

    return Object.values(origin).some(item => item !== undefined) ? origin : undefined;
  }

  /**
   * 从列表页爬取多个详情页数据
   */
  async crawlListingPage(
    targetName: string,
    listingUrl: string,
    maxPages: number = 20,
  ): Promise<{ crawled: CrawledData[]; errors: string[] }> {
    const errors: string[] = [];
    const crawled: CrawledData[] = [];

    const detailUrls = await this.extractDetailPageUrls(targetName, listingUrl, maxPages);

    if (detailUrls.length === 0) {
      this.logger.warn(`未从列表页提取到详情页链接: ${listingUrl}`);
      return { crawled, errors: ['未找到详情页链接'] };
    }

    this.logger.log(`从 ${listingUrl} 提取到 ${detailUrls.length} 个详情页链接`);

    for (const detailUrl of detailUrls) {
      try {
        const result = await this.crawlWebsite(targetName, detailUrl);
        if (result.success && result.data) {
          crawled.push(result.data);
        } else if (result.error) {
          errors.push(`${detailUrl}: ${result.error}`);
        }
        await this.delay(CRAWLER_CONFIG.request.delay);
      } catch (error: unknown) {
        errors.push(`${detailUrl}: ${this.toError(error).message}`);
      }
    }

    this.logger.log(`列表页爬取完成: 成功 ${crawled.length}，失败 ${errors.length}`);
    return { crawled, errors };
  }

  private decodeJsonString(str: string): string {
    try {
      return str
        .replace(/\\\//g, '/')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_match: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        )
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
    } catch {
      return str;
    }
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
