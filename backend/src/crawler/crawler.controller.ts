import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import type { CrawledData, CrawlWebsiteResult } from './crawler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaResourceService } from '../media/media-resource.service';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';
import { PlaySourceType } from '../entities/play-source.entity';
import { CrawlRequestDto, BatchCrawlRequestDto, CrawlAndSaveDto } from './dtos/crawl-request.dto';
import { CRAWLER_TARGETS } from './crawler.config';
import { PlaySourceService } from '../play-sources/play-source.service';

export interface CrawlerStatsResponse {
  totalCrawled: number;
  successCount: number;
  failureCount: number;
  lastCrawlTime?: Date;
  targetsAvailable: string[];
}

interface SaveResult {
  mediaResourceId: number;
  created: boolean;
  playSourceCount: number;
  skippedPlaySources: number;
}

interface PersistableCrawledData {
  title: string;
  description?: string;
  type?: string;
  director?: string;
  actors?: string;
  genres?: string | string[];
  releaseDate?: string | number | Date;
  quality?: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  viewCount?: number;
  metadata?: Record<string, unknown>;
  duration?: string | number;
  episodeCount?: string | number;
  downloadUrls?: string[];
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '未知错误';

/**
 * 爬虫控制器
 * 处理资源爬取相关的HTTP请求
 */
@ApiTags('资源爬虫')
@Controller('crawler')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly mediaResourceService: MediaResourceService,
    private readonly playSourceService: PlaySourceService,
  ) {}

  /**
   * 爬取单个资源
   * @param request 请求对象
   * @param crawlRequest 爬取请求
   * @returns 爬取结果
   */
  @Post('crawl')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: '爬取单个资源',
    description: '根据指定的目标网站和URL爬取影视资源信息并保存到数据库',
  })
  @ApiBody({
    description: '爬取请求参数',
    type: CrawlRequestDto,
  })
  @ApiResponse({
    status: 200,
    description: '爬取成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '爬取成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: '电影标题' },
            description: { type: 'string', example: '电影描述' },
            type: { type: 'string', example: 'movie' },
            quality: { type: 'string', example: '1080p' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '参数验证失败' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async crawlSingle(@Request() req, @Body() crawlRequest: CrawlRequestDto) {
    const result = await this.crawlerService.crawlWebsite(
      crawlRequest.targetName,
      crawlRequest.url,
    );

    if (!result.success) {
      return {
        success: false,
        message: `爬取失败: ${result.error}`,
        data: null,
        error: result.error,
        details: result.details,
      };
    }

    // 将爬取的数据保存到数据库
    let saveResult: SaveResult | null = null;
    try {
      saveResult = await this.saveToDatabase(result.data!, crawlRequest.targetName);
    } catch (error: unknown) {
      this.logger.warn(`保存数据失败: ${getErrorMessage(error)}`);
      // 继续返回爬取结果，不因为保存失败而影响用户
    }

    return {
      success: true,
      message: '爬取成功',
      data: result.data,
      persistence: saveResult,
    };
  }

  /**
   * 批量爬取资源
   * @param request 请求对象
   * @param batchCrawlRequest 批量爬取请求
   * @returns 爬取结果
   */
  @Post('batch-crawl')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: '批量爬取资源',
    description: '批量爬取多个URL的影视资源信息，提高爬取效率',
  })
  @ApiBody({
    description: '批量爬取请求参数',
    type: BatchCrawlRequestDto,
  })
  @ApiResponse({
    status: 200,
    description: '批量爬取成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '批量爬取完成' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              success: { type: 'boolean' },
              data: { type: 'object' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async batchCrawl(@Request() req, @Body() batchCrawlRequest: BatchCrawlRequestDto) {
    const results = await this.crawlerService.batchCrawl(
      batchCrawlRequest.targetName,
      batchCrawlRequest.urls,
    );

    const successCount = results.length;
    const failureCount = batchCrawlRequest.urls.length - successCount;

    // 批量保存到数据库
    let savedCount = 0;
    try {
      for (const result of results) {
        try {
          await this.saveToDatabase(result, batchCrawlRequest.targetName);
          savedCount++;
        } catch (error: unknown) {
          this.logger.warn(`保存数据失败 (${result.title}): ${getErrorMessage(error)}`);
        }
      }
    } catch (error: unknown) {
      this.logger.warn(`批量保存过程中出现错误: ${getErrorMessage(error)}`);
    }

    return {
      success: true,
      message: `批量爬取完成，成功 ${successCount} 条，失败 ${failureCount} 条，保存成功 ${savedCount} 条`,
      data: {
        crawledData: results,
        successCount,
        failureCount,
        savedCount,
        totalRequested: batchCrawlRequest.urls.length,
      },
    };
  }

  /**
   * 获取可用的爬虫目标列表
   * @returns 可用的爬虫目标
   */
  @Get('targets')
  @ApiOperation({
    summary: '获取爬虫目标列表',
    description: '获取所有可用的爬虫目标网站及其配置信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '获取爬虫目标列表成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'example-site' },
              baseUrl: { type: 'string', example: 'https://example.com' },
              description: { type: 'string', example: '示例网站' },
              enabled: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  getTargets() {
    const targets = this.crawlerService.getAvailableTargets();
    return {
      success: true,
      data: targets,
    };
  }

  /**
   * 爬取指定URL并自动保存到数据库
   * @param request 请求对象
   * @param url 要爬取的URL
   * @param targetName 目标网站名称
   * @returns 爬取和保存结果
   */
  @Post('crawl-and-save')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '爬取并保存资源',
    description: '根据指定的目标网站和URL爬取影视资源信息并保存到数据库，需要JWT认证',
  })
  @ApiBody({
    description: '爬取请求参数',
    type: CrawlAndSaveDto,
  })
  @ApiResponse({
    status: 200,
    description: '爬取并保存成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '爬取并保存成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: '电影标题' },
            description: { type: 'string', example: '电影描述' },
            type: { type: 'string', example: 'movie' },
            quality: { type: 'string', example: '1080p' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async crawlAndSave(@Request() req, @Body() body: CrawlAndSaveDto) {
    const targetName = body.targetName ?? CRAWLER_TARGETS[0]?.name ?? '电影天堂';
    const result = await this.crawlerService.crawlWebsite(targetName, body.url);

    if (!result.success) {
      return {
        success: false,
        message: `爬取失败: ${result.error}`,
        data: null,
        error: result.error,
        details: result.details,
      };
    }

    // 实现保存到数据库的逻辑
    try {
      const saveResult = await this.saveToDatabase(result.data!, targetName);
      return {
        success: true,
        message: '爬取并保存成功',
        data: result.data,
        persistence: saveResult,
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.warn(`保存数据失败: ${errorMessage}`);

      return {
        success: false,
        message: '爬取成功但保存失败',
        data: {
          crawledData: result.data,
          error: errorMessage,
        },
      };
    }
  }

  /**
   * 获取爬虫统计信息
   * @returns 统计信息
   */
  @Get('stats')
  async getStats(): Promise<CrawlerStatsResponse> {
    try {
      // 实现真实的统计逻辑
      const totalMedia = await this.mediaResourceService.getTotalCount();
      const activeMedia = await this.mediaResourceService.getActiveCount();
      const targetsAvailable = this.crawlerService.getAvailableTargets().map(t => t.name);

      // 这里可以扩展为更详细的统计信息
      return {
        totalCrawled: totalMedia,
        successCount: activeMedia,
        failureCount: totalMedia - activeMedia,
        lastCrawlTime: await this.mediaResourceService.getLastCrawlTime(),
        targetsAvailable,
      };
    } catch (error: unknown) {
      this.logger.warn(`获取统计信息失败: ${getErrorMessage(error)}`);
      // 降级处理
      return {
        totalCrawled: 0,
        successCount: 0,
        failureCount: 0,
        targetsAvailable: this.crawlerService.getAvailableTargets().map(t => t.name),
      };
    }
  }

  /**
   * 测试爬虫目标连接
   * @param targetName 目标网站名称
   * @returns 连接测试结果
   */
  @Get('test-connection')
  async testConnection(@Query('targetName') targetName: string) {
    const target = this.crawlerService.getAvailableTargets().find(t => t.name === targetName);

    if (!target) {
      return {
        success: false,
        message: `未找到目标网站: ${targetName}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(target.baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: response.ok,
        message: response.ok ? '连接成功' : '连接失败',
        data: {
          status: response.status,
          url: target.baseUrl,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: '连接失败',
        data: {
          error: getErrorMessage(error),
          url: target.baseUrl,
        },
      };
    }
  }

  /**
   * 将爬取的数据保存到数据库
   * @param data 爬取的数据
   * @param source 来源网站
   */
  private async saveToDatabase(data: PersistableCrawledData, source: string): Promise<SaveResult> {
    if (!data || !data.title) {
      throw new Error('无效的爬取数据：缺少标题');
    }

    // 检查是否已存在相同标题的资源
    const existingMedia = await this.mediaResourceService.findByTitle(data.title);
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

    // 转换数据格式
    const mediaData = {
      title: data.title,
      description: data.description || '',
      type: this.mapMediaType(data.type),
      director: data.director || '',
      actors: data.actors || '',
      genres: this.arrayFromString(data.genres),
      releaseDate: this.parseOptionalDate(data.releaseDate),
      quality: this.mapQuality(data.quality),
      poster: data.poster || '',
      backdrop: data.backdrop || '',
      rating: data.rating || 0,
      viewCount: data.viewCount || 0,
      isActive: true,
      source,
      metadata: data.metadata || {},
      duration: this.parseOptionalInteger(data.duration),
      episodeCount: this.parseOptionalInteger(data.episodeCount),
      downloadUrls: Array.isArray(data.downloadUrls) ? data.downloadUrls : [],
    };

    // 保存到数据库
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
    data: PersistableCrawledData,
    source: string,
  ): Promise<{ created: number; skipped: number }> {
    const urls = Array.isArray(data.downloadUrls)
      ? data.downloadUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : [];

    if (urls.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const existingSources = await this.playSourceService.getByMediaResource(mediaResourceId);
    const existingUrls = new Set(existingSources.map(sourceItem => sourceItem.url));
    let created = 0;
    let skipped = 0;

    for (const [index, url] of urls.entries()) {
      if (existingUrls.has(url)) {
        skipped++;
        continue;
      }

      await this.playSourceService.create({
        mediaResourceId,
        type: this.inferPlaySourceType(url),
        url,
        priority: index + 1,
        resolution: data.quality,
        sourceName: `${source}源 ${index + 1}`,
        description: data.description,
      });

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

  /**
   * 映射媒体类型
   */
  private mapMediaType(type?: string): MediaType {
    const typeMap: Record<string, MediaType> = {
      电影: MediaType.MOVIE,
      电视剧: MediaType.TV_SERIES,
      综艺: MediaType.VARIETY,
      动漫: MediaType.ANIME,
      纪录片: MediaType.DOCUMENTARY,
    };

    return type ? (typeMap[type] ?? MediaType.MOVIE) : MediaType.MOVIE;
  }

  /**
   * 映射质量
   */
  private mapQuality(quality?: string): MediaQuality {
    const qualityMap: Record<string, MediaQuality> = {
      高清: MediaQuality.HD,
      超清: MediaQuality.FULL_HD,
      蓝光: MediaQuality.BLUE_RAY,
      标清: MediaQuality.SD,
    };

    return quality ? (qualityMap[quality] ?? MediaQuality.HD) : MediaQuality.HD;
  }

  /**
   * 从字符串创建数组
   */
  private arrayFromString(value?: string | string[]): string[] {
    if (Array.isArray(value)) {
      return value.map(item => item.trim()).filter(item => item.length > 0);
    }

    if (!value || typeof value !== 'string') {
      return [];
    }

    return value
      .split(/[,，、]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private parseOptionalDate(value?: string | number | Date): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private parseOptionalInteger(value?: string | number): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? undefined : parsedValue;
  }

  /**
   * 测试爬虫功能
   * @param targetName 目标网站名称
   * @returns 测试结果
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '测试爬虫功能',
    description: '测试指定爬虫目标的连接和基本功能',
  })
  @ApiQuery({
    name: 'targetName',
    required: false,
    description: '目标网站名称，默认为电影天堂',
    example: '电影天堂',
  })
  @ApiResponse({
    status: 200,
    description: '测试成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '爬虫功能正常' },
        data: {
          type: 'object',
          properties: {
            target: { type: 'string', example: '电影天堂' },
            connection: { type: 'boolean', example: true },
            responseTime: { type: 'number', example: 1500 },
            selectors: {
              type: 'object',
              properties: {
                title: { type: 'string', example: '测试标题' },
                description: { type: 'string', example: '测试描述' },
              },
            },
          },
        },
      },
    },
  })
  async testCrawler(@Query('targetName') targetName?: string) {
    const target = targetName || '电影天堂';

    try {
      // 测试连接
      const startTime = Date.now();
      const connectionOk = await this.crawlerService.testConnection(target);
      const responseTime = Date.now() - startTime;

      if (!connectionOk) {
        return {
          success: false,
          message: `无法连接到目标网站: ${target}`,
          data: {
            target,
            connection: false,
            responseTime,
            error: '连接失败',
          },
        };
      }

      // 如果是电影天堂，测试一个示例URL
      let testData: CrawledData | null = null;
      if (target === '电影天堂') {
        const testUrl = 'http://www.dytt8899.com'; // 使用主页进行测试
        try {
          const testResult: CrawlWebsiteResult = await this.crawlerService.crawlWebsite(
            target,
            testUrl,
          );
          testData = testResult.success ? (testResult.data ?? null) : null;
        } catch (error: unknown) {
          this.logger.warn(`测试爬取失败: ${getErrorMessage(error)}`);
        }
      }

      return {
        success: true,
        message: '爬虫功能测试完成',
        data: {
          target,
          connection: true,
          responseTime,
          testData: testData
            ? {
                title: testData.title || '未知标题',
                hasDownloadUrls:
                  Array.isArray(testData.downloadUrls) && testData.downloadUrls.length > 0,
                description: testData.description
                  ? testData.description.substring(0, 100) + '...'
                  : '无描述',
              }
            : null,
        },
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      return {
        success: false,
        message: `测试失败: ${errorMessage}`,
        data: {
          target,
          error: errorMessage,
        },
      };
    }
  }
}
