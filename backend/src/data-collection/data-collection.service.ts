import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { MediaResource, MediaType } from '../entities/media-resource.entity';
import { UpdateMediaResourceDto } from '../media/dtos/update-media-resource.dto';
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
  episodeCount?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
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
  backdrop?: string;
  episodeCount?: string;
  duration?: string;
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
  proxyForDiscovery: boolean;
  proxyForDetail: boolean;
  proxyForConnectivityCheck: boolean;
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
  proxyForDiscovery: boolean;
  proxyForDetail: boolean;
  proxyForConnectivityCheck: boolean;
  requirePlayableUrls: boolean;
  minimumPlayableUrls: number;
  suggestedProxyMode: SourceCollectionPolicy['proxyMode'];
  qualityScore: number;
  extractionCoverage: number;
  recentMedia7d: number;
  qualityBreakdown: {
    availability: number;
    freshness: number;
    extraction: number;
    inventory: number;
    validation: number;
  };
  recommendation: string;
  totalPlaySources: number;
  activePlaySources: number;
  inactivePlaySources: number;
  recentPlaySources24h: number;
  activeRate: number;
  latestCreatedAt: string | null;
  latestCheckedAt: string | null;
}

export interface CollectionSourceStatistics {
  name: string;
  enabled: boolean;
  dailyEnabled: boolean;
  totalCrawled: number;
  activeMedia: number;
  totalPlaySources: number;
  activePlaySources: number;
  recentPlaySources24h: number;
  activeRate: number;
  qualityScore: number;
  extractionCoverage: number;
  recentMedia7d: number;
  qualityBreakdown: {
    availability: number;
    freshness: number;
    extraction: number;
    inventory: number;
    validation: number;
  };
  proxyMode: SourceCollectionPolicy['proxyMode'];
  proxyForDiscovery: boolean;
  proxyForDetail: boolean;
  proxyForConnectivityCheck: boolean;
  suggestedProxyMode: SourceCollectionPolicy['proxyMode'];
  lastCrawled: string | null;
  lastPlaySourceCreatedAt: string | null;
  lastCheckedAt: string | null;
}

type ProxyRequestPurpose = 'discovery' | 'detail' | 'connectivity';

export interface CollectionStatistics {
  totalSources: number;
  enabledSources: number;
  dailyEnabledSources: number;
  stableSources: number;
  totalMedia: number;
  activeMedia: number;
  totalPlaySources: number;
  activePlaySources: number;
  recentPlaySources24h: number;
  averageActiveRate: number;
  averageQualityScore: number;
  latestCollectedAt: string | null;
  latestValidatedAt: string | null;
  sources: CollectionSourceStatistics[];
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
        proxyForDiscovery: false,
        proxyForDetail: true,
        proxyForConnectivityCheck: false,
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
        proxyForDiscovery: false,
        proxyForDetail: false,
        proxyForConnectivityCheck: false,
        requirePlayableUrls: true,
        minimumPlayableUrls: 1,
      },
    },
  ];

  /**
   * 鑾峰彇鎵€鏈夊彲鐢ㄧ殑鐖櫕婧?
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
    const mediaSourceStatistics = await this.mediaResourceService.getSourceStatistics(
      sources.map(source => source.name),
    );

    const summaries = await Promise.all(
      sources.map(async source => {
        const summary = await this.playSourceService.getSourceHealthSummary(source.name);
        const mediaStatistics = mediaSourceStatistics[source.name];
        const qualityBreakdown = this.calculateSourceQualityBreakdown(
          summary.totalPlaySources,
          summary.activeRate,
          summary.recentPlaySources24h,
          summary.latestCheckedAt,
          mediaStatistics,
        );
        const extractionCoverage = this.calculateExtractionCoverage(mediaStatistics);

        return {
          name: source.name,
          baseUrl: source.baseUrl,
          dailyEnabled: source.collectionPolicy.dailyEnabled,
          dailyLimit: source.collectionPolicy.dailyLimit,
          proxyMode: source.collectionPolicy.proxyMode,
          proxyForDiscovery: source.collectionPolicy.proxyForDiscovery,
          proxyForDetail: source.collectionPolicy.proxyForDetail,
          proxyForConnectivityCheck: source.collectionPolicy.proxyForConnectivityCheck,
          requirePlayableUrls: source.collectionPolicy.requirePlayableUrls,
          minimumPlayableUrls: source.collectionPolicy.minimumPlayableUrls,
          suggestedProxyMode: this.getSuggestedProxyMode(
            summary.activeRate,
            summary.recentPlaySources24h,
          ),
          qualityScore: this.calculateSourceQualityScore(qualityBreakdown),
          extractionCoverage,
          recentMedia7d: mediaStatistics?.recentCreated7d || 0,
          qualityBreakdown,
          recommendation: this.getSourceRecommendation(
            summary.totalPlaySources,
            summary.activeRate,
            summary.recentPlaySources24h,
            extractionCoverage,
            summary.latestCheckedAt,
            mediaStatistics?.recentCreated7d || 0,
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

    return summaries.sort((a, b) => b.qualityScore - a.qualityScore || b.activeRate - a.activeRate);
  }

  private calculateSourceQualityBreakdown(
    totalPlaySources: number,
    activeRate: number,
    recentPlaySources24h: number,
    latestCheckedAt?: string | null,
    mediaStatistics?: {
      total: number;
      active: number;
      latestCreatedAt: string | null;
      recentCreated7d: number;
      withPoster: number;
      withBackdrop: number;
      withDuration: number;
      withEpisodeCount: number;
      withDownloadUrls: number;
    },
  ) {
    const availability = Math.min(activeRate * 0.45, 45);
    const freshness = Math.min(
      recentPlaySources24h * 4 + (mediaStatistics?.recentCreated7d || 0) * 2,
      20,
    );
    const extraction = this.calculateExtractionCoverage(mediaStatistics) * 0.2;
    const inventory = Math.min(totalPlaySources * 1.2, 15);
    const validation = this.calculateValidationFreshnessScore(latestCheckedAt);

    return {
      availability: Math.round(availability),
      freshness: Math.round(freshness),
      extraction: Math.round(extraction),
      inventory: Math.round(inventory),
      validation: Math.round(validation),
    };
  }

  private calculateSourceQualityScore(breakdown: {
    availability: number;
    freshness: number;
    extraction: number;
    inventory: number;
    validation: number;
  }): number {
    return (
      breakdown.availability +
      breakdown.freshness +
      breakdown.extraction +
      breakdown.inventory +
      breakdown.validation
    );
  }

  private calculateExtractionCoverage(mediaStatistics?: {
    total: number;
    withPoster: number;
    withBackdrop: number;
    withDuration: number;
    withEpisodeCount: number;
    withDownloadUrls: number;
  }) {
    const total = mediaStatistics?.total || 0;
    if (total === 0) {
      return 0;
    }

    const weightedCoverage =
      ((mediaStatistics?.withPoster || 0) / total) * 0.2 +
      ((mediaStatistics?.withBackdrop || 0) / total) * 0.2 +
      ((mediaStatistics?.withDuration || 0) / total) * 0.2 +
      ((mediaStatistics?.withEpisodeCount || 0) / total) * 0.1 +
      ((mediaStatistics?.withDownloadUrls || 0) / total) * 0.3;

    return Math.round(weightedCoverage * 100);
  }

  private calculateValidationFreshnessScore(latestCheckedAt?: string | null) {
    const hoursSinceLastChecked = this.getHoursSince(latestCheckedAt);
    if (hoursSinceLastChecked === null) {
      return 0;
    }
    if (hoursSinceLastChecked <= 24) {
      return 10;
    }
    if (hoursSinceLastChecked <= 72) {
      return 7;
    }
    if (hoursSinceLastChecked <= 168) {
      return 4;
    }
    return 1;
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
    extractionCoverage: number,
    latestCheckedAt?: string | null,
    recentMedia7d: number = 0,
  ): string {
    if (totalPlaySources === 0) {
      return '尚未沉淀可用播放源，建议优先排查抓取规则并考虑启用代理';
    }

    const hoursSinceLastChecked = this.getHoursSince(latestCheckedAt);

    if (extractionCoverage < 45) {
      return '来源提取覆盖偏低，建议优先排查详情页选择器、图片提取与时长/剧集信号是否失效';
    }

    if (recentMedia7d === 0 && recentPlaySources24h === 0) {
      return '来源近期缺少新增内容，建议优先检查列表发现阶段、分页入口和站点更新频率';
    }

    if (hoursSinceLastChecked !== null && hoursSinceLastChecked > 168) {
      return '来源最近一周缺少有效校验，建议优先恢复稳定性检测并确认活跃播放源是否仍可用';
    }

    if (activeRate >= 80 && recentPlaySources24h > 0) {
      return '来源稳定，可优先直连采集并保持当前频率';
    }

    if (activeRate >= 50) {
      return '来源中等稳定，建议持续观察新增内容与提取覆盖变化';
    }

    return '来源波动较大，建议降低采集频率并优先排查列表与详情抓取链路';
  }

  private getHoursSince(timestamp?: string | null) {
    if (!timestamp) {
      return null;
    }

    const parsed = new Date(timestamp).getTime();
    if (Number.isNaN(parsed)) {
      return null;
    }

    return (Date.now() - parsed) / (1000 * 60 * 60);
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
      proxyForDiscovery: updates.proxyForDiscovery ?? source.collectionPolicy.proxyForDiscovery,
      proxyForDetail: updates.proxyForDetail ?? source.collectionPolicy.proxyForDetail,
      proxyForConnectivityCheck:
        updates.proxyForConnectivityCheck ?? source.collectionPolicy.proxyForConnectivityCheck,
      minimumPlayableUrls: Math.max(
        updates.minimumPlayableUrls ?? source.collectionPolicy.minimumPlayableUrls,
        0,
      ),
    };

    this.logger.log(
      `更新数据源策略: ${name}, dailyEnabled=${source.collectionPolicy.dailyEnabled}, dailyLimit=${source.collectionPolicy.dailyLimit}, proxyMode=${source.collectionPolicy.proxyMode}, proxyForDiscovery=${source.collectionPolicy.proxyForDiscovery}, proxyForDetail=${source.collectionPolicy.proxyForDetail}, proxyForConnectivityCheck=${source.collectionPolicy.proxyForConnectivityCheck}`,
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
        ...this.buildRequestConfig(source, url, 'detail'),
      });

      const $ = cheerio.load(response.data);
      const selectors = source.config.selectors;

      // 提取数据
      const title = $(selectors.title).text().trim();
      const description = $(selectors.description).text().trim();
      const poster = this.extractImageUrl($, selectors.poster, source.baseUrl);
      const backdrop =
        this.extractImageUrl($, selectors.backdrop, source.baseUrl) ||
        this.extractBackdropFallback($, source.baseUrl, poster);
      const ratingText = $(selectors.rating).text().trim();
      const director = this.extractFirstText($, selectors.director);
      const actors = this.extractJoinedText($, selectors.actors);
      const genres = this.extractTextList($, selectors.genres);
      const releaseDate = this.extractDate($, selectors.releaseDate);
      const pageText = $.root().text();
      const downloadUrls = this.extractDownloadUrls($, selectors.downloadUrls);
      const episodeCount = this.extractEpisodeCount(
        $,
        selectors.episodeCount,
        title,
        description,
        pageText,
        downloadUrls.length,
      );
      const duration = this.extractDurationMinutes($, selectors.duration, pageText);

      // 瑙ｆ瀽璇勫垎
      const rating = ratingText ? parseFloat(ratingText) || 0 : 0;

      if (!title) {
        throw new Error('鏃犳硶鑾峰彇鏍囬');
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
        poster,
        backdrop,
        downloadUrls,
        episodeCount,
        duration,
        metadata: {
          crawledAt: new Date().toISOString(),
          originalUrl: url,
          extractionVersion: 2,
          extractionSummary: {
            playableUrlCount: downloadUrls.length,
            extractedFieldCount: [
              title,
              description,
              director,
              actors,
              releaseDate?.toISOString(),
              poster,
              backdrop,
              episodeCount,
              duration,
              ...(genres || []),
            ].filter(value => Boolean(value)).length,
            hasBackdrop: Boolean(backdrop),
            hasEpisodeCount: typeof episodeCount === 'number',
            hasDuration: typeof duration === 'number',
          },
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
      ...this.buildRequestConfig(source, source.baseUrl, 'discovery'),
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
        ...this.buildRequestConfig(source, source.baseUrl, 'connectivity'),
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
  async getStatistics(): Promise<CollectionStatistics> {
    const sources = this.sources;
    const [sourceHealthSummaries, mediaSourceStatistics, totalMedia, activeMedia] =
      await Promise.all([
        this.getSourceHealthSummaries(),
        this.mediaResourceService.getSourceStatistics(sources.map(source => source.name)),
        this.mediaResourceService.getTotalCount(),
        this.mediaResourceService.getActiveCount(),
      ]);

    const sourceHealthMap = new Map(sourceHealthSummaries.map(summary => [summary.name, summary]));
    const sourceStatistics: CollectionSourceStatistics[] = sources.map(source => {
      const healthSummary = sourceHealthMap.get(source.name);
      const mediaStatistics = mediaSourceStatistics[source.name];

      return {
        name: source.name,
        enabled: source.enabled,
        dailyEnabled: source.collectionPolicy.dailyEnabled,
        totalCrawled: mediaStatistics?.total || 0,
        activeMedia: mediaStatistics?.active || 0,
        totalPlaySources: healthSummary?.totalPlaySources || 0,
        activePlaySources: healthSummary?.activePlaySources || 0,
        recentPlaySources24h: healthSummary?.recentPlaySources24h || 0,
        activeRate: healthSummary?.activeRate || 0,
        qualityScore: healthSummary?.qualityScore || 0,
        extractionCoverage: healthSummary?.extractionCoverage || 0,
        recentMedia7d: mediaStatistics?.recentCreated7d || 0,
        qualityBreakdown: healthSummary?.qualityBreakdown || {
          availability: 0,
          freshness: 0,
          extraction: 0,
          inventory: 0,
          validation: 0,
        },
        proxyMode: source.collectionPolicy.proxyMode,
        proxyForDiscovery: source.collectionPolicy.proxyForDiscovery,
        proxyForDetail: source.collectionPolicy.proxyForDetail,
        proxyForConnectivityCheck: source.collectionPolicy.proxyForConnectivityCheck,
        suggestedProxyMode: healthSummary?.suggestedProxyMode || source.collectionPolicy.proxyMode,
        lastCrawled: mediaStatistics?.latestCreatedAt || null,
        lastPlaySourceCreatedAt: healthSummary?.latestCreatedAt || null,
        lastCheckedAt: healthSummary?.latestCheckedAt || null,
      };
    });

    const latestCollectedAt = this.getLatestTimestamp(
      sourceStatistics.map(sourceStatistic => sourceStatistic.lastCrawled),
    );
    const latestValidatedAt = this.getLatestTimestamp(
      sourceStatistics.map(sourceStatistic => sourceStatistic.lastCheckedAt),
    );
    const totalPlaySources = sourceStatistics.reduce(
      (sum, sourceStatistic) => sum + sourceStatistic.totalPlaySources,
      0,
    );
    const activePlaySources = sourceStatistics.reduce(
      (sum, sourceStatistic) => sum + sourceStatistic.activePlaySources,
      0,
    );
    const recentPlaySources24h = sourceStatistics.reduce(
      (sum, sourceStatistic) => sum + sourceStatistic.recentPlaySources24h,
      0,
    );
    const averageActiveRate =
      sourceStatistics.length > 0
        ? Math.round(
            sourceStatistics.reduce((sum, sourceStatistic) => sum + sourceStatistic.activeRate, 0) /
              sourceStatistics.length,
          )
        : 0;
    const averageQualityScore =
      sourceStatistics.length > 0
        ? Math.round(
            sourceStatistics.reduce(
              (sum, sourceStatistic) => sum + sourceStatistic.qualityScore,
              0,
            ) / sourceStatistics.length,
          )
        : 0;

    return {
      totalSources: sources.length,
      enabledSources: sources.filter(source => source.enabled).length,
      dailyEnabledSources: sourceStatistics.filter(source => source.dailyEnabled).length,
      stableSources: sourceStatistics.filter(source => source.qualityScore >= 80).length,
      totalMedia,
      activeMedia,
      totalPlaySources,
      activePlaySources,
      recentPlaySources24h,
      averageActiveRate,
      averageQualityScore,
      latestCollectedAt,
      latestValidatedAt,
      sources: sourceStatistics.sort(
        (left, right) =>
          right.qualityScore - left.qualityScore || right.activeRate - left.activeRate,
      ),
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
      /全(\\d+)\\u96c6/,
      /共(\\d+)\\u96c6/,
      /(\\d+)\\u96c6全/,
      /更新至\\s*(\\d+)\\u96c6/,
      /第\\s*(\\d+)\\u96c6/,
      /(\\d+)\\s*(?:episodes?|eps?)/i,
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
  private extractImageUrl(
    $: cheerio.CheerioAPI,
    selector: string | undefined,
    baseUrl: string,
  ): string | undefined {
    if (!selector) {
      return undefined;
    }

    const rawValue = $(selector).first().attr('src') || $(selector).first().attr('content');
    if (!rawValue) {
      return undefined;
    }

    try {
      return new URL(rawValue, baseUrl).toString();
    } catch {
      return undefined;
    }
  }

  private extractBackdropFallback(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    poster?: string,
  ): string | undefined {
    const fallbackSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.backdrop img',
      '.banner img',
      '.poster img',
    ];

    for (const selector of fallbackSelectors) {
      const imageUrl = this.extractImageUrl($, selector, baseUrl);
      if (imageUrl && imageUrl !== poster) {
        return imageUrl;
      }
    }

    return poster;
  }

  private extractEpisodeCount(
    $: cheerio.CheerioAPI,
    selector: string | undefined,
    title: string,
    description: string,
    pageText: string,
    downloadUrlCount: number,
  ): number | undefined {
    const candidateTexts = [
      this.extractFirstText($, selector),
      title,
      description,
      pageText,
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    const patterns = [
      /全(\\d+)\\u96c6/,
      /共(\\d+)\\u96c6/,
      /(\\d+)\\u96c6全/,
      /更新至\\s*(\\d+)\\u96c6/,
      /第\\s*(\\d+)\\u96c6/,
      /(\\d+)\\s*(?:episodes?|eps?)/i,
    ];

    for (const text of candidateTexts) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) {
          continue;
        }

        const parsed = parseInt(match[1], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    return downloadUrlCount > 1 ? downloadUrlCount : undefined;
  }

  private extractDurationMinutes(
    $: cheerio.CheerioAPI,
    selector: string | undefined,
    pageText: string,
  ): number | undefined {
    const candidateText = [this.extractFirstText($, selector), pageText]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');

    const hourMinuteMatch = candidateText.match(
      /(\\d+)\\s*(?:小时|\\u5c0f\\u65f6)\\s*(\\d+)\\s*(?:分|分钟|\\u5206)/,
    );
    if (hourMinuteMatch) {
      return parseInt(hourMinuteMatch[1], 10) * 60 + parseInt(hourMinuteMatch[2], 10);
    }

    const minuteMatch = candidateText.match(
      /(?:片长|时长|单集片长|\\u7247\\u957f|\\u65f6\\u957f)?\\s*(\\d{2,3})\\s*(?:分钟|\\u5206\\u949f)/,
    );
    if (minuteMatch) {
      const parsed = parseInt(minuteMatch[1], 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private mergeUniqueStrings(
    currentValues?: string[] | null,
    incomingValues?: string[] | null,
  ): string[] {
    const values = [...(currentValues || []), ...(incomingValues || [])]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(value => value.trim());

    return [...new Set(values)];
  }

  private mergeMetadata(
    currentMetadata?: Record<string, unknown> | null,
    incomingMetadata?: Record<string, unknown> | null,
  ) {
    return {
      ...(currentMetadata || {}),
      ...(incomingMetadata || {}),
      extractionHistory: [
        ...(((currentMetadata || {}).extractionHistory as
          | Array<Record<string, unknown>>
          | undefined) || []),
        incomingMetadata || {},
      ].slice(-5),
    };
  }

  private pickLongerText(currentValue?: string, incomingValue?: string) {
    if (!incomingValue) {
      return currentValue;
    }

    if (!currentValue) {
      return incomingValue;
    }

    return incomingValue.length > currentValue.length ? incomingValue : currentValue;
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
      .replace(/[\u5e74\u6708]/g, '-')
      .replace(/\u65e5/g, '')
      .trim();
    const parsedDate = new Date(normalizedText);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private inferMediaType(title: string, genres: string[] = []): MediaType {
    const combinedText = `${title} ${genres.join(' ')}`.toLowerCase();

    if (combinedText.includes('绾綍')) {
      return MediaType.DOCUMENTARY;
    }

    if (combinedText.includes('缁艰壓')) {
      return MediaType.VARIETY;
    }

    if (combinedText.includes('鍔ㄦ极') || combinedText.includes('鍔ㄧ敾')) {
      return MediaType.ANIME;
    }

    if (combinedText.includes('鐢佃鍓?') || combinedText.includes('鍓ч泦')) {
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
      const updatedMedia = await this.enrichExistingMedia(existingMedia, mediaData);
      const syncResult = await this.syncPlaySources(updatedMedia.id, mediaData, sourceName);
      return {
        mediaResourceId: updatedMedia.id,
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
      episodeCount: mediaData.episodeCount,
      duration: mediaData.duration,
      metadata: mediaData.metadata,
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

  private async enrichExistingMedia(existingMedia: MediaResource, mediaData: MediaData) {
    const mergedDownloadUrls = this.mergeUniqueStrings(
      existingMedia.downloadUrls,
      mediaData.downloadUrls,
    );
    const mergedGenres = this.mergeUniqueStrings(existingMedia.genres, mediaData.genres);
    const mergedMetadata = this.mergeMetadata(
      (existingMedia.metadata || undefined) as Record<string, unknown> | undefined,
      mediaData.metadata,
    );

    const updatePayload: UpdateMediaResourceDto = {
      description:
        this.pickLongerText(existingMedia.description, mediaData.description) ??
        existingMedia.description,
      director: existingMedia.director || mediaData.director,
      actors: existingMedia.actors || mediaData.actors,
      genres: mergedGenres.length > 0 ? mergedGenres : existingMedia.genres,
      releaseDate: existingMedia.releaseDate || mediaData.releaseDate,
      poster: existingMedia.poster || mediaData.poster,
      backdrop: existingMedia.backdrop || mediaData.backdrop,
      rating: existingMedia.rating || mediaData.rating,
      source: existingMedia.source || mediaData.source,
      episodeCount:
        Math.max(existingMedia.episodeCount || 0, mediaData.episodeCount || 0) || undefined,
      duration: existingMedia.duration || mediaData.duration,
      metadata: mergedMetadata,
      downloadUrls: mergedDownloadUrls.length > 0 ? mergedDownloadUrls : existingMedia.downloadUrls,
    };

    return this.mediaResourceService.update(existingMedia.id, updatePayload);
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
    purpose: ProxyRequestPurpose,
  ): Pick<AxiosRequestConfig, 'proxy'> {
    const proxyMode = source.collectionPolicy.proxyMode;

    if (proxyMode === 'direct' || !this.shouldUseProxyForRequest(source, purpose)) {
      return {};
    }

    const preferredProtocol = targetUrl.startsWith('https://') ? 'https' : 'http';
    const proxy = this.proxyPoolService.getBestProxy(preferredProtocol);

    if (!proxy) {
      if (proxyMode === 'proxy-required') {
        throw new Error(`数据源 ${source.name} 的 ${purpose} 请求要求代理，但当前没有可用代理`);
      }

      this.logger.warn(`数据源 ${source.name} 的 ${purpose} 请求未找到可用代理，回退到直连模式`);
      return {};
    }

    this.logger.log(`数据源 ${source.name} 的 ${purpose} 请求使用代理 ${proxy.host}:${proxy.port}`);
    return {
      proxy: this.createAxiosProxyConfig(proxy),
    };
  }

  private shouldUseProxyForRequest(source: CrawlerSource, purpose: ProxyRequestPurpose): boolean {
    switch (purpose) {
      case 'discovery':
        return source.collectionPolicy.proxyForDiscovery;
      case 'connectivity':
        return source.collectionPolicy.proxyForConnectivityCheck;
      case 'detail':
      default:
        return source.collectionPolicy.proxyForDetail;
    }
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

  private getLatestTimestamp(values: Array<string | null | undefined>): string | null {
    const timestamps = values
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map(value => new Date(value).getTime())
      .filter(timestamp => !Number.isNaN(timestamp));

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps)).toISOString();
  }
}
