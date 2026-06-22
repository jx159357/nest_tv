import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlaySourceService } from './play-source.service';
import { MacCmsResolverService } from './mac-cms-resolver.service';
import { PlaySourceHealthService } from './play-source-health.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CreatePlaySourceDto, UpdatePlaySourceDto } from './dtos/play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { ResolveCmsDto } from './dto/resolve-cms.dto';
import { PlaySourceStatus } from '../entities/play-source.entity';

@ApiTags('播放源管理')
@Controller('play-sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlaySourceController {
  constructor(
    private readonly playSourceService: PlaySourceService,
    private readonly macCmsResolver: MacCmsResolverService,
    private readonly healthService: PlaySourceHealthService,
  ) {}

  /**
   * 获取播放源列表（支持筛选和分页）
   */
  @Get()
  @ApiOperation({
    summary: '获取播放源列表',
    description: '支持分页、搜索、类型筛选、质量筛选、状态筛选等多种条件的播放源列表查询',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              url: {
                type: 'string',
                example: 'https://cdn.streaming-platform.com/media/movie1-1080p.mp4',
              },
              quality: { type: 'string', example: '1080p' },
              type: { type: 'string', example: 'online' },
              isActive: { type: 'boolean', example: true },
              mediaResourceId: { type: 'number', example: 1 },
              priority: { type: 'number', example: 1 },
            },
          },
        },
        page: { type: 'number', example: 1 },
        pageSize: { type: 'number', example: 10 },
        total: { type: 'number', example: 50 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiQuery({ name: 'page', description: '页码，从1开始', example: 1 })
  @ApiQuery({ name: 'pageSize', description: '每页数量，默认10条，最大100条', example: 10 })
  @ApiQuery({ name: 'search', description: '搜索关键词，支持URL和描述模糊搜索', required: false })
  @ApiQuery({
    name: 'type',
    description: '播放源类型',
    example: 'online',
    enum: ['online', 'local', 'torrent', 'm3u8'],
  })
  @ApiQuery({
    name: 'quality',
    description: '视频质量',
    example: '1080p',
    enum: ['4K', '1080p', '720p', '480p', '360p'],
  })
  @ApiQuery({
    name: 'status',
    description: '播放源状态',
    required: false,
    enum: PlaySourceStatus,
  })
  @ApiQuery({ name: 'isActive', description: '是否激活', example: true, required: false })
  @ApiQuery({ name: 'mediaResourceId', description: '媒体资源ID', example: 1, required: false })
  async findAll(@Query() queryDto: PlaySourceQueryDto) {
    return this.playSourceService.findAll(queryDto);
  }

  /**
   * 根据ID获取播放源
   */
  @Get(':id')
  @ApiOperation({
    summary: '根据ID获取播放源',
    description: '通过ID获取单个播放源的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        url: { type: 'string', example: 'https://example.com/video.mp4' },
        quality: { type: 'string', example: '1080p' },
        type: { type: 'string', example: 'online' },
        isActive: { type: 'boolean', example: true },
        mediaResourceId: { type: 'number', example: 1 },
        priority: { type: 'number', example: 1 },
        size: { type: 'string', example: '2.5GB' },
        language: { type: 'string', example: '中文' },
        subtitle: {
          type: 'string',
          example: 'https://cdn.streaming-platform.com/subtitles/movie1-zh.srt',
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '播放源不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Play source with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: '播放源ID，正整数',
    example: 1,
    required: true,
  })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.playSourceService.findById(id);
  }

  /**
   * 创建播放源
   */
  @Post()
  @ApiOperation({ summary: '创建播放源' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createPlaySourceDto: CreatePlaySourceDto) {
    return this.playSourceService.create(createPlaySourceDto);
  }

  /**
   * 更新播放源
   */
  @Put(':id')
  @ApiOperation({ summary: '更新播放源' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlaySourceDto: UpdatePlaySourceDto,
  ) {
    return this.playSourceService.update(id, updatePlaySourceDto);
  }

  /**
   * 删除播放源
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除播放源' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.playSourceService.remove(id);
    return { message: '删除成功' };
  }

  /**
   * 验证播放源有效性
   */
  @Put(':id/validate')
  @Patch(':id/validate')
  @ApiOperation({ summary: '验证播放源有效性' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async validate(@Param('id', ParseIntPipe) id: number) {
    const result = await this.playSourceService.validate(id);
    const circuitBreaker = this.playSourceService.getCircuitBreakerStatus(id);
    return { ...result, circuitBreaker };
  }

  @Get(':id/circuit-breaker')
  @ApiOperation({ summary: '获取播放源熔断状态' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async getCircuitBreakerStatus(@Param('id', ParseIntPipe) id: number) {
    await this.playSourceService.findById(id);
    return this.playSourceService.getCircuitBreakerStatus(id);
  }

  @Post(':id/circuit-breaker/reset')
  @ApiOperation({ summary: '重置播放源熔断状态' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async resetCircuitBreaker(@Param('id', ParseIntPipe) id: number) {
    await this.playSourceService.findById(id);
    this.playSourceService.resetCircuitBreaker(id);
    return { message: 'Circuit breaker reset successfully.' };
  }

  @Post('batch/enable')
  @ApiOperation({ summary: '批量启用播放源' })
  @ApiResponse({ status: 200, description: '批量启用成功' })
  async batchEnable(@Body('ids') ids: number[]) {
    return this.playSourceService.batchUpdateStatus(ids, true);
  }

  @Post('batch/disable')
  @ApiOperation({ summary: '批量禁用播放源' })
  @ApiResponse({ status: 200, description: '批量禁用成功' })
  async batchDisable(@Body('ids') ids: number[]) {
    return this.playSourceService.batchUpdateStatus(ids, false);
  }

  @Post('batch/delete')
  @ApiOperation({ summary: '批量删除播放源' })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  async batchDelete(@Body('ids') ids: number[]) {
    return this.playSourceService.batchDelete(ids);
  }

  /**
   * 从原始播放页刷新播放源
   */
  @Patch(':id/refresh')
  @ApiOperation({ summary: '从原始播放页刷新播放源' })
  @ApiResponse({ status: 200, description: '刷新完成' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async refresh(@Param('id', ParseIntPipe) id: number) {
    return this.playSourceService.refreshFromOrigin(id);
  }

  /**
   * 获取媒体资源的最佳播放源
   */
  @Get('media/:mediaId/best')
  @ApiOperation({ summary: '获取媒体资源的最佳播放源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'mediaId', description: '媒体资源ID' })
  async getBestPlaySource(@Param('mediaId', ParseIntPipe) mediaId: number) {
    return this.playSourceService.getBestPlaySource(mediaId);
  }

  /**
   * 获取媒体资源的播放源列表
   */
  @Get('media/:mediaId')
  @ApiOperation({ summary: '获取媒体资源的播放源列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'mediaId', description: '媒体资源ID' })
  async getByMediaResource(@Param('mediaId', ParseIntPipe) mediaId: number) {
    return this.playSourceService.getByMediaResource(mediaId);
  }

  /**
   * 媒体级刷新 - 刷新该媒体下所有失效播放源
   */
  @Post('media/:mediaId/refresh')
  @ApiOperation({ summary: '媒体级刷新播放源' })
  @ApiResponse({ status: 200, description: '刷新完成' })
  @ApiParam({ name: 'mediaId', description: '媒体资源ID' })
  async refreshMediaSources(@Param('mediaId', ParseIntPipe) mediaId: number) {
    return this.playSourceService.refreshMediaSources(mediaId);
  }

  /**
   * 通过 MacCMS 资源站 API 实时解析播放地址
   */
  @Post('resolve')
  @Public()
  @ApiOperation({
    summary: '实时解析播放地址',
    description: '通过 MacCMS 资源站 API 根据标题实时获取 m3u8 播放地址',
  })
  @ApiResponse({ status: 200, description: '解析成功' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async resolveFromCms(@Body() body: ResolveCmsDto) {
    const episodes = await this.macCmsResolver.resolveByTitle(body.title, body.episodeNumber);
    return { episodes };
  }

  /**
   * 获取播放源健康状态统计
   */
  @Get('health/stats')
  @ApiOperation({ summary: '获取播放源健康状态统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHealthStats() {
    return this.healthService.getHealthStats();
  }

  /**
   * 手动触发播放源健康检查
   */
  @Post('health/check')
  @ApiOperation({ summary: '手动触发播放源健康检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async triggerHealthCheck() {
    return this.healthService.validateAndReplace(100);
  }

  /**
   * 手动触发过期播放源清理
   */
  @Post('health/cleanup')
  @ApiOperation({ summary: '手动触发过期播放源清理' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async triggerCleanup() {
    const cleaned = await this.healthService.cleanupExpiredSources(30);
    return { cleaned };
  }

  /**
   * 上报播放性能指标
   */
  @Post(':id/metrics')
  @Public()
  @ApiOperation({ summary: '上报播放性能指标', description: '前端播放器上报首帧时间、卡顿次数等播放性能数据' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '上报成功' })
  async reportMetrics(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { firstFrameTimeMs?: number; stallCount?: number; success?: boolean },
  ) {
    return this.playSourceService.recordPlayMetrics(id, {
      firstFrameTimeMs: body.firstFrameTimeMs,
      stallCount: body.stallCount,
      success: body.success !== false,
    });
  }
}
