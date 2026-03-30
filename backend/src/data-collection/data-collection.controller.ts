import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DataCollectionService } from './data-collection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('数据采集')
@Controller('data-collection')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataCollectionController {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '未知错误';
  }

  /**
   * 获取所有可用的爬虫源
   */
  @Get('sources')
  @ApiOperation({ summary: '获取所有可用的爬虫源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getSources() {
    return this.dataCollectionService.getSources();
  }

  @Get('source-health')
  @ApiOperation({ summary: '获取采集来源健康摘要' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSourceHealth() {
    return this.dataCollectionService.getSourceHealthSummaries();
  }

  /**
   * 根据名称获取爬虫源
   */
  @Get('sources/:name')
  @ApiOperation({ summary: '根据名称获取爬虫源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '爬虫源不存在' })
  @ApiParam({ name: 'name', description: '爬虫源名称' })
  getSource(@Param('name') name: string) {
    const source = this.dataCollectionService.getSourceConfig(name);
    if (!source) {
      throw new Error(`爬虫源 ${name} 不存在或已禁用`);
    }
    return source;
  }

  @Patch('sources/:name/policy')
  @ApiOperation({ summary: '更新采集来源策略' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiParam({ name: 'name', description: '爬虫源名称' })
  updateSourcePolicy(
    @Param('name') name: string,
    @Body()
    body: {
      dailyEnabled?: boolean;
      dailyLimit?: number;
      proxyMode?: 'direct' | 'prefer-proxy' | 'proxy-required';
      proxyForDiscovery?: boolean;
      proxyForDetail?: boolean;
      proxyForConnectivityCheck?: boolean;
      requirePlayableUrls?: boolean;
      minimumPlayableUrls?: number;
    },
  ) {
    return this.dataCollectionService.updateSourcePolicy(name, body);
  }

  /**
   * 爬取单个URL
   */
  @Post('crawl')
  @ApiOperation({ summary: '爬取单个URL' })
  @ApiResponse({ status: 200, description: '爬取成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async crawlUrl(@Body() body: { sourceName: string; url: string; userId?: number }) {
    const { sourceName, url } = body;

    try {
      const result = await this.dataCollectionService.crawlAndSave(sourceName, url);
      return {
        success: true,
        data: result,
        message: '爬取成功',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * 批量爬取URL
   */
  @Post('batch-crawl')
  @ApiOperation({ summary: '批量爬取URL' })
  @ApiResponse({ status: 200, description: '批量爬取成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async batchCrawl(@Body() body: { sourceName: string; urls: string[]; userId?: number }) {
    const { sourceName, urls } = body;

    try {
      const results = await this.dataCollectionService.crawlBatch(sourceName, urls);
      return {
        success: true,
        data: results,
        message: `批量爬取完成: ${results.length} 个URL`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * 获取热门资源URL
   */
  @Get('popular-urls/:sourceName')
  @ApiOperation({ summary: '获取热门资源URL' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '爬虫源不存在' })
  @ApiParam({ name: 'sourceName', description: '爬虫源名称' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getPopularUrls(
    @Param('sourceName') sourceName: string,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const urls = await this.dataCollectionService.getPopularUrls(sourceName, limit);
      return {
        success: true,
        data: urls,
        message: `获取到 ${urls.length} 个热门URL`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * 从指定来源批量采集热门资源并同步播放源
   */
  @Post('collect-popular/:sourceName')
  @ApiOperation({ summary: '按来源批量采集热门资源' })
  @ApiResponse({ status: 200, description: '采集成功' })
  @ApiResponse({ status: 404, description: '爬虫源不存在' })
  @ApiParam({ name: 'sourceName', description: '爬虫源名称' })
  @ApiQuery({ name: 'limit', description: '采集数量上限', required: false })
  async collectPopularResources(
    @Param('sourceName') sourceName: string,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const summary = await this.dataCollectionService.collectPopularResources(sourceName, limit);
      return {
        success: true,
        data: summary,
        message: `来源 ${sourceName} 采集完成`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * 测试爬虫源连接
   */
  @Get('test-connection/:sourceName')
  @ApiOperation({ summary: '测试爬虫源连接' })
  @ApiResponse({ status: 200, description: '测试成功' })
  @ApiResponse({ status: 404, description: '爬虫源不存在' })
  @ApiParam({ name: 'sourceName', description: '爬虫源名称' })
  async testConnection(@Param('sourceName') sourceName: string) {
    const result = await this.dataCollectionService.testConnection(sourceName);
    return {
      success: result.success,
      message: result.message,
      responseTime: result.responseTime,
    };
  }

  /**
   * 获取爬虫统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取爬虫统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics() {
    const statistics = await this.dataCollectionService.getStatistics();
    return {
      success: true,
      data: statistics,
      message: '获取统计信息成功',
    };
  }
}
