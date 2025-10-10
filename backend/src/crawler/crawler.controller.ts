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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaResourceService } from '../media/media-resource.service';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';
import { CrawlRequestDto, BatchCrawlRequestDto, CrawlAndSaveDto } from './dtos/crawl-request.dto';
import { CRAWLER_TARGETS } from './crawler.config';

export interface CrawlerStatsResponse {
  totalCrawled: number;
  successCount: number;
  failureCount: number;
  lastCrawlTime?: Date;
  targetsAvailable: string[];
}

/**
 * 爬虫控制器
 * 处理资源爬取相关的HTTP请求
 */
@ApiTags('资源爬虫')
@ApiBearerAuth()
@Controller('crawler')
@UseGuards(JwtAuthGuard)
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly mediaResourceService: MediaResourceService,
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
    description: '根据指定的目标网站和URL爬取影视资源信息并保存到数据库'
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
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '参数验证失败' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问'
  })
  async crawlSingle(@Request() req, @Body() crawlRequest: CrawlRequestDto) {
    const result = await this.crawlerService.crawlWebsite(
      crawlRequest.targetName,
      crawlRequest.url,
    );

    if (!result) {
      return {
        success: false,
        message: '爬取失败',
        data: null,
      };
    }

    // 将爬取的数据保存到数据库
    try {
      await this.saveToDatabase(result, crawlRequest.targetName);
    } catch (error) {
      console.warn('保存数据失败:', error.message);
      // 继续返回爬取结果，不因为保存失败而影响用户
    }

    return {
      success: true,
      message: '爬取成功',
      data: result,
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
    description: '批量爬取多个URL的影视资源信息，提高爬取效率'
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
              error: { type: 'string' }
            }
          }
        }
      }
    }
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
        } catch (error) {
          console.warn(`保存数据失败 (${result.title}):`, error.message);
        }
      }
    } catch (error) {
      console.warn('批量保存过程中出现错误:', error.message);
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
    description: '获取所有可用的爬虫目标网站及其配置信息'
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
              enabled: { type: 'boolean', example: true }
            }
          }
        }
      }
    }
  })
  async getTargets() {
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
  async crawlAndSave(@Request() req, @Body() body: CrawlAndSaveDto) {
    const targetName = body.targetName || CRAWLER_TARGETS[0]?.name; // 默认使用配置中的第一个目标
    const result = await this.crawlerService.crawlWebsite(targetName, body.url);

    if (!result) {
      return {
        success: false,
        message: '爬取失败',
        data: null,
      };
    }

    // 实现保存到数据库的逻辑
    try {
      await this.saveToDatabase(result, targetName);
      return {
        success: true,
        message: '爬取并保存成功',
        data: result,
      };
    } catch (error) {
      console.warn('保存数据失败:', error.message);
      return {
        success: false,
        message: '爬取成功但保存失败',
        data: {
          crawledData: result,
          error: error.message,
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
    } catch (error) {
      console.warn('获取统计信息失败:', error.message);
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
    } catch (error) {
      return {
        success: false,
        message: '连接失败',
        data: {
          error: error.message,
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
  private async saveToDatabase(data: any, source: string): Promise<void> {
    if (!data || !data.title) {
      throw new Error('无效的爬取数据：缺少标题');
    }

    // 检查是否已存在相同标题的资源
    const existingMedia = await this.mediaResourceService.findByTitle(data.title);
    if (existingMedia) {
      console.log(`资源已存在，跳过: ${data.title}`);
      return;
    }

    // 转换数据格式
    const mediaData = {
      title: data.title,
      description: data.description || '',
      type: this.mapMediaType(data.type),
      director: data.director || '',
      actors: data.actors || '',
      genres: this.arrayFromString(data.genres),
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      quality: this.mapQuality(data.quality),
      poster: data.poster || '',
      backdrop: data.backdrop || '',
      rating: data.rating || 0,
      viewCount: data.viewCount || 0,
      isActive: true,
      source: source,
      metadata: data.metadata || {},
      duration: data.duration ? parseInt(data.duration) : undefined,
      episodeCount: data.episodeCount ? parseInt(data.episodeCount) : undefined,
      downloadUrls: Array.isArray(data.downloadUrls) ? data.downloadUrls : [],
    };

    // 保存到数据库
    await this.mediaResourceService.create(mediaData);
    console.log(`成功保存资源: ${data.title}`);
  }

  /**
   * 映射媒体类型
   */
  private mapMediaType(type: string): MediaType {
    const typeMap: Record<string, MediaType> = {
      '电影': MediaType.MOVIE,
      '电视剧': MediaType.TV_SERIES,
      '综艺': MediaType.VARIETY,
      '动漫': MediaType.ANIME,
      '纪录片': MediaType.DOCUMENTARY,
    };
    
    return typeMap[type] || MediaType.MOVIE;
  }

  /**
   * 映射质量
   */
  private mapQuality(quality: string): MediaQuality {
    const qualityMap: Record<string, MediaQuality> = {
      '高清': MediaQuality.HD,
      '超清': MediaQuality.FULL_HD,
      '蓝光': MediaQuality.BLUE_RAY,
      '标清': MediaQuality.SD,
    };
    
    return qualityMap[quality] || MediaQuality.HD;
  }

  /**
   * 从字符串创建数组
   */
  private arrayFromString(str: string): string[] {
    if (!str || typeof str !== 'string') {
      return [];
    }
    
    return str.split(/[,，、]/).map(item => item.trim()).filter(item => item.length > 0);
  }
}
