import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { MediaType } from '../entities/media-resource.entity';
import { MediaResourceService } from '../media/media-resource.service';
import { PlaySourceService } from '../play-sources/play-source.service';
import { PlaySourceType } from '../entities/play-source.entity';
import { ProxyPoolService } from '../common/services/proxy-pool.service';
import type { ProxyInfo } from '../common/types/proxy-pool.types';

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
  metadata?: any;
}

interface SourceSelectors {
  title: string;
  description: string;
  poster: string;
  rating: string;
  director?: string;
  actors?: string;
  genres?: string;
  releaseDate?: string;
  downloadUrls?: string;
}

interface CrawlerSourceConfig {
  selectors: SourceSelectors;
  listLinkSelectors?: string[];
  allowedLinkPatterns?: RegExp[];
}

export interface SourceCollectionPolicy {
  dailyEnabled: boolean;
  dailyLimit: number;
  proxyMode: 'direct' | 'prefer-proxy' | 'proxy-required';
  requirePlayableUrls: boolean;
  minimumPlayableUrls: number;
}

export interface PersistenceResult {
  mediaResourceId: number;
  created: boolean;
  playSourceCount: number;
  skippedPlaySources: number;
}

export interface CollectedSourceSummary {
  sourceName: string;
  effectiveDailyLimit: number;
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoPlayableUrls: number;
  createdMedia: number;
  createdPlaySources: number;
  skippedPlaySources: number;
  urls: string[];
  errors: string[];
}

export interface SourceHealthSummary {
  name: string;
  baseUrl: string;
  dailyEnabled: boolean;
  dailyLimit: number;
  proxyMode: SourceCollectionPolicy['proxyMode'];
  requirePlayableUrls: boolean;
  minimumPlayableUrls: number;
  suggestedProxyMode: SourceCollectionPolicy['proxyMode'];
  qualityScore: number;
  recommendation: string;
  totalPlaySources: number;
  activePlaySources: number;
  inactivePlaySources: number;
  recentPlaySources24h: number;
  activeRate: number;
  latestCreatedAt: string | null;
  latestCheckedAt: string | null;
}

export interface CrawlerSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  maxConcurrent: number;
  delay: number;
  config: CrawlerSourceConfig;
  collectionPolicy: SourceCollectionPolicy;
}

interface AxiosProxyConfig {
  protocol: ProxyInfo['protocol'];
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

@Injectable()
export class DataCollectionService {
  private readonly logger = new Logger('DataCollectionService');

  constructor(
    private readonly mediaResourceService: MediaResourceService,
    private readonly playSourceService: PlaySourceService,
    private readonly proxyPoolService: ProxyPoolService,
  ) {}

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
          director: 'a[rel="v:directedBy"]',
          actors: '.actor .attrs a, .celebrities .info .name a',
          genres: 'span[property="v:genre"]',
          releaseDate: 'span[property="v:initialReleaseDate"]',
        },
        listLinkSelectors: ['a[href*="/subject/"]'],
        allowedLinkPatterns: [/\/subject\/\d+/],
      },
      collectionPolicy: {
        dailyEnabled: true,
        dailyLimit: 6,
        proxyMode: 'prefer-proxy',
        requirePlayableUrls: false,
        minimumPlayableUrls: 0,
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
          director: '.co_content8 p, .actor p',
          actors: '.co_content8 p, .actor p',
          genres: '.co_content8 p a, .actor p a, .co_content222 p a',
          releaseDate: '.co_content8 p span, .actor p span, .co_content222 p',
          downloadUrls:
            '.co_content22 a[href*="thunder"], .co_content222 a[href*="magnet"], a[href*="ftp"], .down_list a',
        },
        listLinkSelectors: ['a[href*="/html/gndy/"]', 'a[href$=".html"]'],
        allowedLinkPatterns: [/\/html\//, /\.html$/],
      },
      collectionPolicy: {
        dailyEnabled: true,
        dailyLimit: 10,
        proxyMode: 'direct',
        requirePlayableUrls: true,
        minimumPlayableUrls: 1,
      },
    },
  ];

  /**
   * 获取所有可用的爬虫源
   */
  getSources(): CrawlerSource[] {
    return this.sources.filter(source => source.enabled);
  }

  getSourceConfig(name: string): CrawlerSource | undefined {
    return this.sources.find(source => source.name === name);
  }

  getDailyCollectionSources(): CrawlerSource[] {
    return this.getSources().filter(source => source.collectionPolicy.dailyEnabled);
  }

  async getSourceHealthSummaries(): Promise<SourceHealthSummary[]> {
    const sources = this.getSources();

    const summaries = await Promise.all(
      sources.map(async source => {
        const summary = await this.playSourceService.getSourceHealthSummary(source.name);
        return {
          name: source.name,
          baseUrl: source.baseUrl,
          dailyEnabled: source.collectionPolicy.dailyEnabled,
          dailyLimit: source.collectionPolicy.dailyLimit,
          proxyMode: source.collectionPolicy.proxyMode,
          requirePlayableUrls: source.collectionPolicy.requirePlayableUrls,
          minimumPlayableUrls: source.collectionPolicy.minimumPlayableUrls,
          suggestedProxyMode: this.getSuggestedProxyMode(
            summary.activeRate,
            summary.recentPlaySources24h,
          ),
          qualityScore: this.calculateSourceQualityScore(
            summary.totalPlaySources,
            summary.activeRate,
            summary.recentPlaySources24h,
          ),
          recommendation: this.getSourceRecommendation(
            summary.totalPlaySources,
            summary.activeRate,
            summary.recentPlaySources24h,
          ),
          totalPlaySources: summary.totalPlaySources,
          activePlaySources: summary.activePlaySources,
          inactivePlaySources: summary.inactivePlaySources,
          recentPlaySources24h: summary.recentPlaySources24h,
          activeRate: summary.activeRate,
          latestCreatedAt: summary.latestCreatedAt,
          latestCheckedAt: summary.latestCheckedAt,
        };
      }),
    );

    return summaries.sort(
      (a, b) => b.activeRate - a.activeRate || b.totalPlaySources - a.totalPlaySources,
    );
  }

  private calculateSourceQualityScore(
    totalPlaySources: number,
    activeRate: number,
    recentPlaySources24h: number,
  ): number {
    const activityScore = Math.min(recentPlaySources24h * 8, 25);
    const activeScore = Math.min(activeRate * 0.6, 60);
    const inventoryScore = Math.min(totalPlaySources * 1.5, 15);

    return Math.round(activityScore + activeScore + inventoryScore);
  }

  private getSuggestedProxyMode(
    activeRate: number,
    recentPlaySources24h: number,
  ): SourceCollectionPolicy['proxyMode'] {
    if (activeRate < 35 || (activeRate < 50 && recentPlaySources24h === 0)) {
      return 'proxy-required';
    }

    if (activeRate < 75) {
      return 'prefer-proxy';
    }

    return 'direct';
  }

  private getSourceRecommendation(
    totalPlaySources: number,
    activeRate: number,
    recentPlaySources24h: number,
  ): string {
    if (totalPlaySources === 0) {
      return '尚未沉淀可用播放源，建议优先排查抓取规则并考虑启用代理';
    }

    if (activeRate >= 80 && recentPlaySources24h > 0) {
      return '来源稳定，可优先直连采集并保持当前频率';
    }

    if (activeRate >= 50) {
      return '来源中等稳定，建议优先代理并继续观察新增源质量';
    }

    return '来源波动较大，建议强制代理、降低频率并优先排查抓取规则';
  }

  /**
   * 根据名称获取爬虫源
   */
  getSource(name: string): CrawlerSource | undefined {
    return this.sources.find(source => source.name === name && source.enabled);
  }

  updateSourcePolicy(name: string, updates: Partial<SourceCollectionPolicy>): CrawlerSource {
    const source = this.getSourceConfig(name);
    if (!source) {
      throw new Error(`爬虫源 ${name} 不存在`);
    }

    source.collectionPolicy = {
      ...source.collectionPolicy,
      ...updates,
      dailyLimit: Math.max(updates.dailyLimit ?? source.collectionPolicy.dailyLimit, 1),
      minimumPlayableUrls: Math.max(
        updates.minimumPlayableUrls ?? source.collectionPolicy.minimumPlayableUrls,
        0,
      ),
    };

    this.logger.log(
      `更新数据源策略: ${name}, dailyEnabled=${source.collectionPolicy.dailyEnabled}, dailyLimit=${source.collectionPolicy.dailyLimit}, proxyMode=${source.collectionPolicy.proxyMode}`,
    );

    return source;
  }

  /**
   * 爬取单个URL
   */
  async crawlUrl(sourceName: string, url: string): Promise<MediaData> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`开始爬取: ${url}`);

    try {
      const response = await axios.get<string>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        ...this.buildRequestConfig(source, url),
      });

      const $ = cheerio.load(response.data);
      const selectors = source.config.selectors;

      // 提取数据
      const title = $(selectors.title).text().trim();
      const description = $(selectors.description).text().trim();
      const poster = $(selectors.poster).attr('src');
      const ratingText = $(selectors.rating).text().trim();
      const director = this.extractFirstText($, selectors.director);
      const actors = this.extractJoinedText($, selectors.actors);
      const genres = this.extractTextList($, selectors.genres);
      const releaseDate = this.extractDate($, selectors.releaseDate);

      // 解析评分
      const rating = ratingText ? parseFloat(ratingText) || 0 : 0;

      if (!title) {
        throw new Error('无法获取标题');
      }

      const mediaData: MediaData = {
        title,
        description,
        type: this.inferMediaType(title, genres),
        director,
        actors,
        genres,
        releaseDate,
        rating,
        source: sourceName,
        poster: poster ? new URL(poster, source.baseUrl).href : undefined,
        downloadUrls: this.extractDownloadUrls($, selectors.downloadUrls),
        metadata: {
          crawledAt: new Date().toISOString(),
          originalUrl: url,
        },
      };

      this.logger.log(`爬取成功: ${title}`);
      return mediaData;
    } catch (error: unknown) {
      const errorMessage = this.toError(error).message;
      this.logger.error(`爬取失败: ${errorMessage}`, this.toError(error).stack);
      throw new HttpException(`爬取失败: ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 批量爬取URL
   */
  async crawlBatch(sourceName: string, urls: string[]): Promise<MediaData[]> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`开始批量爬取: ${urls.length} 个URL`);

    const results: MediaData[] = [];
    const errors: string[] = [];

    // 使用Promise.allSettled来处理批量请求
    const promises = urls.map((url, index) => {
      // 添加延迟以避免过于频繁的请求
      return new Promise<MediaData | null>(resolve => {
        setTimeout(() => {
          void this.crawlUrl(sourceName, url)
            .then(result => {
              resolve(result);
            })
            .catch((error: unknown) => {
              errors.push(`${url}: ${this.toError(error).message}`);
              resolve(null);
            });
        }, index * source.delay);
      });
    });

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    this.logger.log(`批量爬取完成: ${results.length} 成功, ${errors.length} 失败`);

    if (errors.length > 0) {
      this.logger.warn(`失败的URL: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * 爬取并保存到数据库
   */
  async crawlAndSave(sourceName: string, url: string) {
    const mediaData = await this.crawlUrl(sourceName, url);
    const persistence = await this.persistMediaData(mediaData, sourceName);

    return {
      success: true,
      data: mediaData,
      message: '爬取成功',
      persistence,
    };
  }

  /**
   * 获取热门资源URL
   */
  async getPopularUrls(sourceName: string, limit: number = 20): Promise<string[]> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`获取热门URL: ${sourceName}`);

    const response = await axios.get<string>(source.baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      ...this.buildRequestConfig(source, source.baseUrl),
    });

    const $ = cheerio.load(response.data);
    const urls = new Set<string>();
    const selectors = source.config.listLinkSelectors || ['a[href]'];

    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const normalizedUrl = this.normalizeCrawlUrl(
          href,
          source.baseUrl,
          source.config.allowedLinkPatterns,
        );
        if (normalizedUrl) {
          urls.add(normalizedUrl);
        }
      });
    });

    const popularUrls = Array.from(urls).slice(0, limit);

    this.logger.log(`获取到 ${popularUrls.length} 个热门URL`);
    return popularUrls;
  }

  async collectPopularResources(
    sourceName: string,
    limit: number = 10,
  ): Promise<CollectedSourceSummary> {
    const urls = await this.getPopularUrls(sourceName, limit);
    const summary: CollectedSourceSummary = {
      sourceName,
      effectiveDailyLimit: limit,
      attempted: urls.length,
      succeeded: 0,
      failed: 0,
      skippedNoPlayableUrls: 0,
      createdMedia: 0,
      createdPlaySources: 0,
      skippedPlaySources: 0,
      urls,
      errors: [],
    };

    for (const url of urls) {
      try {
        const mediaData = await this.crawlUrl(sourceName, url);
        const source = this.getSource(sourceName);

        if (
          source?.collectionPolicy.requirePlayableUrls &&
          this.countPlayableUrls(mediaData) < source.collectionPolicy.minimumPlayableUrls
        ) {
          summary.skippedNoPlayableUrls++;
          continue;
        }

        const persistence = await this.persistMediaData(mediaData, sourceName);
        summary.succeeded++;
        if (persistence.created) {
          summary.createdMedia++;
        }
        summary.createdPlaySources += persistence.playSourceCount;
        summary.skippedPlaySources += persistence.skippedPlaySources;
      } catch (error: unknown) {
        summary.failed++;
        summary.errors.push(`${url}: ${this.toError(error).message}`);
      }
    }

    return summary;
  }

  /**
   * 测试爬虫源连接
   */
  async testConnection(sourceName: string): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    const source = this.getSource(sourceName);
    if (!source) {
      return {
        success: false,
        message: `爬虫源 ${sourceName} 不存在或已禁用`,
      };
    }

    this.logger.log(`测试连接: ${sourceName}`);

    try {
      const startTime = Date.now();
      await axios.get(source.baseUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        ...this.buildRequestConfig(source, source.baseUrl),
      });
      const responseTime = Date.now() - startTime;

      this.logger.log(`连接测试成功: ${sourceName}, 响应时间: ${responseTime}ms`);

      return {
        success: true,
        message: '连接测试成功',
        responseTime,
      };
    } catch (error: unknown) {
      const normalizedError = this.toError(error);
      this.logger.error(`连接测试失败: ${normalizedError.message}`, normalizedError.stack);

      return {
        success: false,
        message: `连接测试失败: ${normalizedError.message}`,
      };
    }
  }

  /**
   * 获取爬虫统计信息
   */
  getStatistics(): {
    totalSources: number;
    enabledSources: number;
    sources: Array<{
      name: string;
      enabled: boolean;
      lastCrawled?: Date;
      totalCrawled?: number;
    }>;
  } {
    const totalSources = this.sources.length;
    const enabledSources = this.sources.filter(s => s.enabled).length;

    const sources = this.sources.map(source => ({
      name: source.name,
      enabled: source.enabled,
      // 这里可以添加从数据库获取的统计信息
      totalCrawled: Math.floor(Math.random() * 1000),
      lastCrawled: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));

    return {
      totalSources,
      enabledSources,
      sources,
    };
  }

  /**
   * 提取下载链接
   */
  private extractDownloadUrls($: cheerio.CheerioAPI, selector?: string): string[] {
    const urls = new Set<string>();

    if (selector) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const normalizedUrl = this.normalizePlayableUrl(href);
        if (normalizedUrl) {
          urls.add(normalizedUrl);
        }
      });
    }

    // 查找常见的下载/播放链接模式
    $(
      'a[href*="download"], a[href*="magnet"], a[href*="torrent"], a[href*="m3u8"], a[href*="thunder"], a[href*="ftp"]',
    ).each((_, element) => {
      const href = $(element).attr('href');
      const normalizedUrl = this.normalizePlayableUrl(href);
      if (normalizedUrl) {
        urls.add(normalizedUrl);
      }
    });

    const pageText = $.root().text();
    this.extractUrlsFromText(pageText).forEach(url => urls.add(url));

    return Array.from(urls);
  }

  private extractUrlsFromText(text: string): string[] {
    const patterns = [
      /magnet:\?[^\s"'<>]+/gi,
      /thunder:\/\/[^\s"'<>]+/gi,
      /ed2k:\/\/[^\s"'<>]+/gi,
      /ftp:\/\/[^\s"'<>]+/gi,
      /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi,
      /https?:\/\/[^\s"'<>]+\.(mp4|mkv|avi|mov|flv)(\?[^\s"'<>]*)?/gi,
    ];

    const urls = new Set<string>();

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const normalizedUrl = this.normalizePlayableUrl(match);
        if (normalizedUrl) {
          urls.add(normalizedUrl);
        }
      });
    });

    return Array.from(urls);
  }

  private normalizePlayableUrl(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalizedUrl = value.trim();
    if (!normalizedUrl) {
      return null;
    }

    const sanitizedUrl = normalizedUrl.replace(/[)）]+$/, '').replace(/[>]+$/, '');

    if (
      sanitizedUrl.startsWith('magnet:') ||
      sanitizedUrl.startsWith('thunder://') ||
      sanitizedUrl.startsWith('ed2k://') ||
      sanitizedUrl.startsWith('ftp://')
    ) {
      return sanitizedUrl;
    }

    if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
      return null;
    }

    try {
      const url = new URL(sanitizedUrl);
      if (['http:', 'https:'].includes(url.protocol)) {
        return url.toString();
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractFirstText($: cheerio.CheerioAPI, selector?: string): string | undefined {
    if (!selector) {
      return undefined;
    }

    const text = $(selector).first().text().trim();
    return text || undefined;
  }

  private extractJoinedText($: cheerio.CheerioAPI, selector?: string): string | undefined {
    const values = this.extractTextList($, selector);
    return values.length > 0 ? values.join(', ') : undefined;
  }

  private extractTextList($: cheerio.CheerioAPI, selector?: string): string[] {
    if (!selector) {
      return [];
    }

    const values: string[] = [];
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        values.push(text);
      }
    });

    return [...new Set(values)];
  }

  private extractDate($: cheerio.CheerioAPI, selector?: string): Date | undefined {
    const text = this.extractFirstText($, selector);
    if (!text) {
      return undefined;
    }

    const normalizedText = text
      .replace(/[年月]/g, '-')
      .replace(/日/g, '')
      .trim();
    const parsedDate = new Date(normalizedText);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private inferMediaType(title: string, genres: string[] = []): MediaType {
    const combinedText = `${title} ${genres.join(' ')}`.toLowerCase();

    if (combinedText.includes('纪录')) {
      return MediaType.DOCUMENTARY;
    }

    if (combinedText.includes('综艺')) {
      return MediaType.VARIETY;
    }

    if (combinedText.includes('动漫') || combinedText.includes('动画')) {
      return MediaType.ANIME;
    }

    if (combinedText.includes('电视剧') || combinedText.includes('剧集')) {
      return MediaType.TV_SERIES;
    }

    return MediaType.MOVIE;
  }

  private async persistMediaData(
    mediaData: MediaData,
    sourceName: string,
  ): Promise<PersistenceResult> {
    const existingMedia = await this.mediaResourceService.findByTitle(mediaData.title);

    if (existingMedia) {
      const syncResult = await this.syncPlaySources(existingMedia.id, mediaData, sourceName);
      return {
        mediaResourceId: existingMedia.id,
        created: false,
        playSourceCount: syncResult.created,
        skippedPlaySources: syncResult.skipped,
      };
    }

    const createdMedia = await this.mediaResourceService.create({
      title: mediaData.title,
      description: mediaData.description,
      type: mediaData.type,
      director: mediaData.director,
      actors: mediaData.actors,
      genres: mediaData.genres,
      releaseDate: mediaData.releaseDate,
      poster: mediaData.poster,
      backdrop: mediaData.backdrop,
      rating: mediaData.rating,
      source: mediaData.source,
      downloadUrls: mediaData.downloadUrls,
    });

    const syncResult = await this.syncPlaySources(createdMedia.id, mediaData, sourceName);
    return {
      mediaResourceId: createdMedia.id,
      created: true,
      playSourceCount: syncResult.created,
      skippedPlaySources: syncResult.skipped,
    };
  }

  private async syncPlaySources(
    mediaResourceId: number,
    mediaData: MediaData,
    sourceName: string,
  ): Promise<{ created: number; skipped: number }> {
    const downloadUrls = Array.isArray(mediaData.downloadUrls)
      ? mediaData.downloadUrls.filter(
          (url): url is string => typeof url === 'string' && url.length > 0,
        )
      : [];

    if (downloadUrls.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const existingSources = await this.playSourceService.getByMediaResource(mediaResourceId);
    const existingUrls = new Set(existingSources.map(source => source.url));
    let created = 0;
    let skipped = 0;

    for (const [index, url] of downloadUrls.entries()) {
      if (existingUrls.has(url)) {
        skipped++;
        continue;
      }

      await this.playSourceService.create({
        mediaResourceId,
        type: this.inferPlaySourceType(url),
        url,
        priority: index + 1,
        resolution: undefined,
        sourceName: `${sourceName}源 ${index + 1}`,
        description: mediaData.description,
      });
      created++;
    }

    return { created, skipped };
  }

  private normalizeCrawlUrl(
    href: string | undefined,
    baseUrl: string,
    allowedPatterns?: RegExp[],
  ): string | null {
    if (!href) {
      return null;
    }

    try {
      const normalizedUrl = new URL(href, baseUrl).href;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        return null;
      }

      if (allowedPatterns && allowedPatterns.length > 0) {
        const matchesAllowedPattern = allowedPatterns.some(pattern => pattern.test(normalizedUrl));
        if (!matchesAllowedPattern) {
          return null;
        }
      }

      return normalizedUrl;
    } catch {
      return null;
    }
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

  private countPlayableUrls(mediaData: MediaData): number {
    return Array.isArray(mediaData.downloadUrls)
      ? mediaData.downloadUrls.filter(
          (url): url is string => typeof url === 'string' && url.trim().length > 0,
        ).length
      : 0;
  }

  private buildRequestConfig(
    source: CrawlerSource,
    targetUrl: string,
  ): Pick<AxiosRequestConfig, 'proxy'> {
    const proxyMode = source.collectionPolicy.proxyMode;

    if (proxyMode === 'direct') {
      return {};
    }

    const preferredProtocol = targetUrl.startsWith('https://') ? 'https' : 'http';
    const proxy = this.proxyPoolService.getBestProxy(preferredProtocol);

    if (!proxy) {
      if (proxyMode === 'proxy-required') {
        throw new Error(`数据源 ${source.name} 要求代理，但当前没有可用代理`);
      }

      this.logger.warn(`数据源 ${source.name} 未找到可用代理，回退到直连模式`);
      return {};
    }

    this.logger.log(`数据源 ${source.name} 使用代理 ${proxy.host}:${proxy.port}`);
    return {
      proxy: this.createAxiosProxyConfig(proxy),
    };
  }

  private createAxiosProxyConfig(proxy: ProxyInfo): AxiosProxyConfig {
    const proxyConfig: AxiosProxyConfig = {
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

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
