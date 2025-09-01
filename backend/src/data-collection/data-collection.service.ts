import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MediaResource, MediaType } from '../entities/media-resource.entity';
import { PlaySource, PlaySourceType, PlaySourceStatus } from '../entities/play-source.entity';
import { AppLoggerService, LogContext } from '../common/services/app-logger.service';

export interface MediaData {
  title: string;
  description?: string;
  type: MediaType;
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: Date;
  poster?: string;
  backdrop?: string;
  rating: number;
  source: string;
  downloadUrls?: string[];
  playUrls?: string[];
  metadata?: any;
}

export interface CrawlerSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  maxConcurrent: number;
  delay: number;
  config: any;
}

@Injectable()
export class DataCollectionService {
  private readonly logger: AppLoggerService;

  constructor(
    appLoggerService: AppLoggerService,
  ) {
    this.logger = appLoggerService;
  }

  /**
   * 数据源配置
   */
  private readonly sources: CrawlerSource[] = [
    {
      name: '豆瓣电影',
      baseUrl: 'https://movie.douban.com',
      enabled: true,
      maxConcurrent: 2,
      delay: 2000,
      config: {
        selectors: {
          title: 'h1 span[property="v:itemreviewed"]',
          description: '.related-info .indent .all',
          poster: '.related-pic img',
          rating: '.rating_self strong',
          director: '.info a[rel="v:directedBy"]',
          actors: '.info a[rel="v:starring"]',
          genres: '.info span[property="v:genre"]',
          releaseDate: '.info span[property="v:initialReleaseDate"]',
          downloadUrls: ['#info a[href*="download"]'],
        },
      },
    },
    {
      name: 'IMDB',
      baseUrl: 'https://www.imdb.com',
      enabled: true,
      maxConcurrent: 2,
      delay: 3000,
      config: {
        selectors: {
          title: '[data-testid="hero-title-block__title"]',
          description: '[data-testid="plot"] span',
          poster: '.ipc-media img',
          rating: '[data-testid="hero-rating-bar__aggregate-rating__score"] span',
          director: 'a[href*="tt_ov_dr"]',
          actors: 'a[href*="tt_ov_st"]',
          genres: '.ipc-chip span',
          releaseDate: '[data-testid="title-details-releasedate"] div',
          downloadUrls: '.ipc-split-button a',
        },
      },
    },
    {
      name: '电影天堂',
      baseUrl: 'https://www.dy2018.com',
      enabled: true,
      maxConcurrent: 3,
      delay: 1500,
      config: {
        selectors: {
          title: '.title a',
          description: '.description',
          poster: '.poster img',
          rating: '.rating',
          director: '.director',
          actors: '.actors',
          genres: ['.genre'],
          releaseDate: '.release-date',
          downloadUrls: ['.download-link'],
        },
      },
    },
    {
      name: 'BT蚂蚁',
      baseUrl: 'https://www.btant.com',
      enabled: true,
      maxConcurrent: 3,
      delay: 2000,
      config: {
        selectors: {
          title: '.movie-title h1',
          description: '.movie-desc',
          poster: '.movie-poster img',
          rating: '.movie-rating',
          director: '.movie-director',
          actors: '.movie-actor',
          genres: '.movie-genre',
          releaseDate: '.movie-date',
          downloadUrls: '.download-link',
        },
      },
    },
    {
      name: '电影蜜蜂',
      baseUrl: 'https://www.dytt8.net',
      enabled: true,
      maxConcurrent: 3,
      delay: 1500,
      config: {
        selectors: {
          title: '.title h1',
          description: '.content',
          poster: '.poster img',
          rating: '.rating',
          director: '.director',
          actors: '.actors',
          genres: '.genre',
          releaseDate: '.date',
          downloadUrls: '.download a',
        },
      },
    },
  ];

  /**
   * 从URL采集数据
   */
  async collectFromUrl(sourceName: string, url: string, userId?: number): Promise<MediaData | null> {
    const context: LogContext = { userId, function: 'collectFromUrl', sourceName, url };
    const startTime = Date.now();
    
    try {
      const source = this.sources.find(s => s.name === sourceName);
      if (!source || !source.enabled) {
        this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
        return null;
      }

      this.logger.logCrawler(sourceName, url, 'start', null, context);
      
      // 下载网页内容
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const $ = cheerio.load(response.data);
      const { selectors } = source.config;

      // 提取数据
      const mediaData: MediaData = {
        title: $(selectors.title).first().text().trim() || '未知标题',
        description: $(selectors.description).first().text().trim(),
        type: this.inferMediaType(url),
        director: $(selectors.director).first().text().trim(),
        actors: $(selectors.actors).first().text().trim(),
        genres: this.extractGenres($, selectors.genres[0]),
        releaseDate: this.parseDate($(selectors.releaseDate).first().text().trim()),
        poster: this.resolveUrl($(selectors.poster).first().attr('src'), source.baseUrl),
        backdrop: this.resolveUrl($(selectors.poster).first().attr('src'), source.baseUrl),
        rating: this.parseRating($(selectors.rating).first().text().trim()),
        source: source.name,
        downloadUrls: this.extractUrls($, selectors.downloadUrls[0], source.baseUrl),
        playUrls: this.extractUrls($, selectors.downloadUrls[0], source.baseUrl),
        metadata: {
          crawledAt: new Date(),
          crawledUrl: url,
          source: source.name,
          responseTime: Date.now() - startTime,
        },
      };

      this.logger.logCrawler(sourceName, url, 'success', {
        title: mediaData.title,
        type: mediaData.type,
        responseTime: Date.now() - startTime,
      }, context);

      return mediaData;

    } catch (error) {
      this.logger.logCrawler(sourceName, url, 'error', {
        error: error.message,
        responseTime: Date.now() - startTime,
      }, context);
      return null;
    }
  }

  /**
   * 批量采集数据
   */
  async batchCollect(sourceName: string, urls: string[], userId?: number): Promise<MediaData[]> {
    const context: LogContext = { userId, function: 'batchCollect', sourceName, urlCount: urls.length };
    
    try {
      const source = this.sources.find(s => s.name === sourceName);
      if (!source || !source.enabled) {
        this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
        return [];
      }

      this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'start', null, context);

      const results: MediaData[] = [];
      const batchSize = Math.min(source.maxConcurrent, 5);
      
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const promises = batch.map(url => this.collectFromUrl(sourceName, url, userId));
        
        const batchResults = await Promise.allSettled(promises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          }
        }

        // 批次间延迟
        if (i + batchSize < urls.length) {
          await this.delay(source.delay);
        }
      }

      this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'success', {
        successCount: results.length,
        totalCount: urls.length,
      }, context);

      return results;

    } catch (error) {
      this.logger.logCrawler(sourceName, `batch:${urls.length}`, 'error', {
        error: error.message,
      }, context);
      return [];
    }
  }

  /**
   * 采集热门资源
   */
  async collectPopularResources(sourceName: string, count: number = 20, userId?: number): Promise<MediaData[]> {
    const context: LogContext = { userId, function: 'collectPopularResources', sourceName, count };
    
    try {
      const source = this.sources.find(s => s.name === sourceName);
      if (!source || !source.enabled) {
        this.logger.warn(`Source not found or disabled: ${sourceName}`, context);
        return [];
      }

      // 这里需要根据具体网站的结构实现热门资源的URL获取
      const popularUrls = await this.getPopularUrls(sourceName, count, userId);
      
      if (popularUrls.length === 0) {
        this.logger.warn(`No popular URLs found for source: ${sourceName}`, context);
        return [];
      }

      return await this.batchCollect(sourceName, popularUrls, userId);

    } catch (error) {
      this.logger.error(`Failed to collect popular resources: ${error.message}`, context, error.stack);
      return [];
    }
  }

  /**
   * 获取热门资源URL
   */
  private async getPopularUrls(sourceName: string, count: number, userId?: number): Promise<string[]> {
    const context: LogContext = { userId, function: 'getPopularUrls', sourceName, count };
    
    try {
      const source = this.sources.find(s => s.name === sourceName);
      if (!source) return [];

      // 根据不同网站实现不同的热门资源URL获取逻辑
      switch (sourceName) {
        case '豆瓣电影':
          return await this.getDoubanPopularUrls(count);
        case '电影天堂':
          return await this.getDy2018PopularUrls(count);
        default:
          this.logger.warn(`Popular URLs not implemented for source: ${sourceName}`, context);
          return [];
      }

    } catch (error) {
      this.logger.error(`Failed to get popular URLs: ${error.message}`, context, error.stack);
      return [];
    }
  }

  /**
   * 获取豆瓣电影热门URL
   */
  private async getDoubanPopularUrls(count: number): Promise<string[]> {
    try {
      const urls: string[] = [];
      
      // 豆瓣电影热门页面
      const response = await axios.get('https://movie.douban.com/j/search_subjects', {
        params: {
          type: 'movie',
          tag: '热门',
          page_limit: count,
          page_start: 0,
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      
      $('.subject-item').each((index, element) => {
        if (urls.length < count) {
          const url = $(element).find('.title a').attr('href');
          if (url) {
            urls.push(url);
          }
        }
      });

      return urls;

    } catch (error) {
      this.logger.error(`Failed to get Douban popular URLs: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取电影天堂热门URL
   */
  private async getDy2018PopularUrls(count: number): Promise<string[]> {
    try {
      const urls: string[] = [];
      
      // 电影天堂最新页面
      const response = await axios.get('https://www.dy2018.com/html/gndy/dyzz/index.html', {
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      
      $('.co_content8 ul table').each((index, element) => {
        if (urls.length < count) {
          const url = $(element).find('a').first().attr('href');
          if (url) {
            urls.push(`https://www.dy2018.com${url}`);
          }
        }
      });

      return urls;

    } catch (error) {
      this.logger.error(`Failed to get DY2018 popular URLs: ${error.message}`);
      return [];
    }
  }

  /**
   * 推断媒体类型
   */
  private inferMediaType(url: string): MediaType {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('tv') || lowerUrl.includes('series') || lowerUrl.includes('剧集')) {
      return MediaType.TV_SERIES;
    }
    if (lowerUrl.includes('variety') || lowerUrl.includes('综艺')) {
      return MediaType.VARIETY;
    }
    if (lowerUrl.includes('anime') || lowerUrl.includes('动画') || lowerUrl.includes('动漫')) {
      return MediaType.ANIME;
    }
    if (lowerUrl.includes('doc') || lowerUrl.includes('纪录')) {
      return MediaType.DOCUMENTARY;
    }
    return MediaType.MOVIE;
  }

  /**
   * 提取类型标签
   */
  private extractGenres($: cheerio.CheerioAPI, selector: string): string[] {
    const genresText = $(selector).first().text().trim();
    if (!genresText) return [];
    
    return genresText
      .split(/[,，、\s]+/)
      .map(genre => genre.trim())
      .filter(genre => genre.length > 0);
  }

  /**
   * 解析日期
   */
  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

    const patterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2024-01-01
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // 2024/01/01
      /(\d{4})年(\d{1,2})月(\d{1,2})日/, // 2024年01月01日
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
   * 提取URL
   */
  private extractUrls($: cheerio.CheerioAPI, selector: string, baseUrl: string): string[] {
    const urls: string[] = [];
    
    $(selector).each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) {
          urls.push(resolvedUrl);
        }
      }
    });

    return urls;
  }

  /**
   * 解析相对URL为绝对URL
   */
  private resolveUrl(url: string | undefined, baseUrl: string): string | undefined {
    if (!url) return undefined;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    return `${baseUrl}/${url}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取所有可用的数据源
   */
  getAvailableSources(): CrawlerSource[] {
    return this.sources.filter(source => source.enabled);
  }

  /**
   * 启用/禁用数据源
   */
  toggleSource(sourceName: string, enabled: boolean): boolean {
    const source = this.sources.find(s => s.name === sourceName);
    if (source) {
      source.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取数据源统计信息
   */
  getSourceStats(): any {
    const enabledCount = this.sources.filter(s => s.enabled).length;
    
    return {
      totalSources: this.sources.length,
      enabledSources: enabledCount,
      disabledSources: this.sources.length - enabledCount,
      sources: this.sources.map(s => ({
        name: s.name,
        enabled: s.enabled,
        maxConcurrent: s.maxConcurrent,
        delay: s.delay,
      })),
    };
  }
}