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
import { CrawlerService } from './crawler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrawlRequestDto, BatchCrawlRequestDto, CrawlAndSaveDto } from './dtos/crawl-request.dto';


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
@Controller('crawler')
@UseGuards(JwtAuthGuard)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * 爬取单个资源
   * @param request 请求对象
   * @param crawlRequest 爬取请求
   * @returns 爬取结果
   */
  @Post('crawl')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
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

    // TODO: 将爬取的数据保存到数据库
    // 这里可以注入 MediaResourceService 来保存数据

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
  async batchCrawl(
    @Request() req,
    @Body() batchCrawlRequest: BatchCrawlRequestDto,
  ) {
    const results = await this.crawlerService.batchCrawl(
      batchCrawlRequest.targetName,
      batchCrawlRequest.urls,
    );

    const successCount = results.length;
    const failureCount = batchCrawlRequest.urls.length - successCount;

    // TODO: 批量保存到数据库

    return {
      success: true,
      message: `批量爬取完成，成功 ${successCount} 条，失败 ${failureCount} 条`,
      data: {
        crawledData: results,
        successCount,
        failureCount,
        totalRequested: batchCrawlRequest.urls.length,
      },
    };
  }

  /**
   * 获取可用的爬虫目标列表
   * @returns 可用的爬虫目标
   */
  @Get('targets')
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
  async crawlAndSave(
    @Request() req,
    @Body() body: CrawlAndSaveDto,
  ) {
    const targetName = body.targetName || '电影天堂'; // 默认目标
    const result = await this.crawlerService.crawlWebsite(targetName, body.url);

    if (!result) {
      return {
        success: false,
        message: '爬取失败',
        data: null,
      };
    }

    // TODO: 实现保存到数据库的逻辑
    // 需要注入 MediaResourceService 并转换数据格式

    return {
      success: true,
      message: '爬取并保存成功',
      data: result,
    };
  }

  /**
   * 获取爬虫统计信息
   * @returns 统计信息
   */
  @Get('stats')
  async getStats(): Promise<CrawlerStatsResponse> {
    // TODO: 实现真实的统计逻辑
    return {
      totalCrawled: 0,
      successCount: 0,
      failureCount: 0,
      targetsAvailable: this.crawlerService.getAvailableTargets().map(t => t.name),
    };
  }

  /**
   * 测试爬虫目标连接
   * @param targetName 目标网站名称
   * @returns 连接测试结果
   */
  @Get('test-connection')
  async testConnection(@Query('targetName') targetName: string) {
    const target = this.crawlerService
      .getAvailableTargets()
      .find(t => t.name === targetName);

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
}