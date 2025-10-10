import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { CRAWLER_TARGETS, CRAWLER_CONFIG, CRAWLER_RULES } from './crawler.config';
import { MediaResourceService } from '../media/media-resource.service';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';

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
    genres: string[];
    releaseDate: string;
    downloadUrls: string[];
  };
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

  constructor(private readonly mediaResourceService: MediaResourceService) {
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
      (config) => {
        this.logger.log(`请求URL: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 设置响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.log(`响应状态: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('响应拦截器错误:', error.message);
        return Promise.reject(error);
      }
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
   * 爬取指定网站的数据
   * @param targetName 目标网站名称
   * @param url 要爬取的URL
   * @returns 爬取的数据
   */
  async crawlWebsite(targetName: string, url: string): Promise<CrawledData | null> {
    try {
      // 验证URL
      if (!this.validateUrl(url)) {
        throw new Error(`URL不符合爬取规则: ${url}`);
      }

      // 检查缓存
      const cacheKey = `crawl:${targetName}:${url}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        this.logger.log(`使用缓存数据: ${url}`);
        return cached;
      }

      // 获取目标配置
      const target = CRAWLER_TARGETS.find(t => t.name === targetName);
      if (!target) {
        throw new Error(`未找到爬虫目标: ${targetName}`);
      }

      this.logger.log(`开始爬取 ${targetName}: ${url}`);

      // 获取网页内容
      const response = await this.httpClient.get(url);
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const $ = cheerio.load(response.data);

      // 提取数据
      const crawledData: CrawledData = {
        title: this.extractText($, target.selectors.title) || '未知标题',
        description: this.extractText($, target.selectors.description),
        type: this.inferMediaType(url),
        director: this.extractText($, target.selectors.director),
        actors: this.extractText($, target.selectors.actors),
        genres: this.extractGenres($, target.selectors.genres),
        releaseDate: this.parseDate(this.extractText($, target.selectors.releaseDate)),
        poster: this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl),
        rating: this.parseRating(this.extractText($, target.selectors.rating)),
        source: target.name,
        downloadUrls: this.extractDownloadUrls($, target.selectors.downloadUrls),
        metadata: {
          crawledAt: new Date(),
          crawledUrl: url,
          website: target.name,
        },
      };

      // 验证爬取的数据
      if (!this.validateCrawledData(crawledData)) {
        throw new Error('爬取的数据验证失败');
      }

      // 设置缓存
      this.setCache(cacheKey, crawledData);

      this.logger.log(`成功爬取数据: ${crawledData.title}`);
      return crawledData;
    } catch (error) {
      this.logger.error(`爬取失败 ${targetName}: ${url}`, error.stack);
      return null;
    }
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
      const promises = batch.map(async (url) => {
        const result = await this.crawlWebsite(targetName, url);
        await this.delay(CRAWLER_CONFIG.request.delay);
        return result;
      });

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
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
    return $(selector).first().text().trim();
  }

  /**
   * 推断媒体类型
   */
  private inferMediaType(url: string): 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary' {
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

  /**
   * 提取类型标签
   */
  private extractGenres($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const genres: string[] = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
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
  private extractDownloadUrls($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const urls: string[] = [];
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('magnet:'))) {
          urls.push(href);
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
}