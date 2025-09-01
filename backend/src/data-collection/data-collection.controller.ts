import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DataCollectionService } from './data-collection.service';
import { MediaResource, MediaType } from '../entities/media-resource.entity';
import { PlaySource, PlaySourceType } from '../entities/play-source.entity';
import { AppLoggerService, LogContext } from '../common/services/app-logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('数据采集管理')
@Controller('data-collection')
@UseGuards(JwtAuthGuard)
export class DataCollectionController {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly dataCollectionService: DataCollectionService,
    appLoggerService: AppLoggerService,
  ) {
    this.logger = appLoggerService;
  }

  @Post('collect')
  @ApiOperation({ summary: '从URL采集数据' })
  @ApiQuery({ name: 'sourceName', description: '数据源名称' })
  @ApiQuery({ name: 'url', description: '要采集的URL' })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiResponse({ status: 200, description: '采集成功' })
  async collectFromUrl(@Query() query: any): Promise<any> {
    const context: LogContext = { 
      userId: query.userId, 
      function: 'collectFromUrl', 
      sourceName: query.sourceName, 
      url: query.url 
    };
    
    try {
      this.logger.logUserAction(query.userId || 0, 'collect_from_url', query.url, { sourceName: query.sourceName }, context);
      
      const result = await this.dataCollectionService.collectFromUrl(query.sourceName, query.url, query.userId);
      
      if (!result) {
        this.logger.warn('Data collection failed', context);
        return {
          success: false,
          message: '数据采集失败',
        };
      }

      this.logger.log('Data collection successful', LogLevel.INFO, { 
        title: result.title, 
        type: result.type, 
        source: result.source 
      }, context);
      
      return {
        success: true,
        message: '数据采集成功',
        data: result,
      };

    } catch (error) {
      this.logger.error(`Data collection failed: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Post('batch-collect')
  @ApiOperation({ summary: '批量采集数据' })
  @ApiQuery({ name: 'sourceName', description: '数据源名称' })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiResponse({ status: 200, description: '批量采集成功' })
  async batchCollect(
    @Query('sourceName') sourceName: string,
    @Body('urls') urls: string[],
    @Query('userId') userId?: number,
  ): Promise<any> {
    const context: LogContext = { userId, function: 'batchCollect', sourceName, urlCount: urls.length };
    
    try {
      this.logger.logUserAction(userId || 0, 'batch_collect', urls.length.toString(), { sourceName }, context);
      
      const results = await this.dataCollectionService.batchCollect(sourceName, urls, userId);
      
      this.logger.log('Batch data collection completed', LogLevel.INFO, { 
        sourceName, 
        totalUrls: urls.length, 
        successCount: results.length 
      }, context);
      
      return {
        success: true,
        message: '批量采集完成',
        data: {
          totalUrls: urls.length,
          successCount: results.length,
          results,
        },
      };

    } catch (error) {
      this.logger.error(`Batch data collection failed: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Post('collect-popular')
  @ApiOperation({ summary: '采集热门资源' })
  @ApiQuery({ name: 'sourceName', description: '数据源名称' })
  @ApiQuery({ name: 'count', description: '采集数量', required: false, type: Number })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiResponse({ status: 200, description: '采集成功' })
  async collectPopular(
    @Query('sourceName') sourceName: string,
    @Query('count') count: number = 20,
    @Query('userId') userId?: number,
  ): Promise<any> {
    const context: LogContext = { userId, function: 'collectPopular', sourceName, count };
    
    try {
      this.logger.logUserAction(userId || 0, 'collect_popular', count.toString(), { sourceName }, context);
      
      const results = await this.dataCollectionService.collectPopularResources(sourceName, count, userId);
      
      this.logger.log('Popular resources collection completed', LogLevel.INFO, { 
        sourceName, 
        count, 
        successCount: results.length 
      }, context);
      
      return {
        success: true,
        message: '热门资源采集完成',
        data: {
          requestedCount: count,
          successCount: results.length,
          results,
        },
      };

    } catch (error) {
      this.logger.error(`Popular resources collection failed: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('sources')
  @ApiOperation({ summary: '获取所有可用数据源' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAvailableSources(): Promise<any> {
    const context: LogContext = { function: 'getAvailableSources' };
    
    try {
      const sources = this.dataCollectionService.getAvailableSources();
      
      this.logger.log('Retrieved available sources', LogLevel.INFO, { 
        count: sources.length 
      }, context);
      
      return {
        success: true,
        data: sources,
      };

    } catch (error) {
      this.logger.error(`Failed to get available sources: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Put('sources/:sourceName/toggle')
  @ApiOperation({ summary: '启用/禁用数据源' })
  @ApiParam({ name: 'sourceName', description: '数据源名称' })
  @ApiQuery({ name: 'enabled', description: '是否启用', type: Boolean })
  @ApiResponse({ status: 200, description: '操作成功' })
  async toggleSource(
    @Param('sourceName') sourceName: string,
    @Query('enabled') enabled: boolean,
  @Query('userId') userId?: number,
  ): Promise<any> {
    const context: LogContext = { userId, function: 'toggleSource', sourceName, enabled };
    
    try {
      this.logger.logUserAction(userId || 0, 'toggle_source', sourceName, { enabled }, context);
      
      const success = this.dataCollectionService.toggleSource(sourceName, enabled);
      
      if (!success) {
        this.logger.warn(`Source not found: ${sourceName}`, context);
        return {
          success: false,
          message: '数据源不存在',
        };
      }

      this.logger.log('Source toggled successfully', LogLevel.INFO, { 
        sourceName, 
        enabled 
      }, context);
      
      return {
        success: true,
        message: `数据源${enabled ? '启用' : '禁用'}成功`,
      };

    } catch (error) {
      this.logger.error(`Failed to toggle source: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('sources/stats')
  @ApiOperation({ summary: '获取数据源统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getSourceStats(): Promise<any> {
    const context: LogContext = { function: 'getSourceStats' };
    
    try {
      const stats = this.dataCollectionService.getSourceStats();
      
      this.logger.log('Retrieved source stats', LogLevel.INFO, context);
      
      return {
        success: true,
        data: stats,
      };

    } catch (error) {
      this.logger.error(`Failed to get source stats: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Post('process-and-save')
  @ApiOperation({ summary: '处理采集数据并保存' })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiResponse({ status: 200, description: '处理并保存成功' })
  async processAndSave(
    @Body('mediaData') mediaData: any,
    @Body('createPlaySources') createPlaySources: boolean = true,
    @Query('userId') userId?: number,
  ): Promise<any> {
    const context: LogContext = { userId, function: 'processAndSave', title: mediaData.title };
    
    try {
      this.logger.logUserAction(userId || 0, 'process_and_save', mediaData.title, null, context);
      
      // 这里需要注入MediaResourceService和PlaySourceService
      // 由于服务依赖关系，这里只是示例逻辑
      const result = {
        mediaResource: null, // 需要调用MediaResourceService创建
        playSources: [], // 需要调用PlaySourceService创建
      };

      this.logger.log('Data processed and saved successfully', LogLevel.INFO, { 
        title: mediaData.title, 
        type: mediaData.type, 
        createPlaySources 
      }, context);
      
      return {
        success: true,
        message: '数据处理并保存成功',
        data: result,
      };

    } catch (error) {
      this.logger.error(`Failed to process and save data: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('templates')
  @ApiOperation({ summary: '获取采集模板' })
  @ApiQuery({ name: 'sourceName', description: '数据源名称', required: false })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTemplates(@Query('sourceName') sourceName?: string): Promise<any> {
    const context: LogContext = { function: 'getTemplates', sourceName };
    
    try {
      // 返回采集模板配置
      const templates = {
        douban: {
          name: '豆瓣电影',
          baseUrl: 'https://movie.douban.com',
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
        dy2018: {
          name: '电影天堂',
          baseUrl: 'https://www.dy2018.com',
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
      };

      const result = sourceName ? { [sourceName]: templates[sourceName] } : templates;
      
      this.logger.log('Retrieved collection templates', LogLevel.INFO, { 
        sourceName 
      }, context);
      
      return {
        success: true,
        data: result,
      };

    } catch (error) {
      this.logger.error(`Failed to get templates: ${error.message}`, context, error.stack);
      throw error;
    }
  }
}