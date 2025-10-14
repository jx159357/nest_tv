import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePlaySourceDto,
  UpdatePlaySourceDto,
} from './dtos/play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';

@ApiTags('播放源管理')
@Controller('play-sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlaySourceController {
  constructor(private readonly playSourceService: PlaySourceService) {}

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
              url: { type: 'string', example: 'https://example.com/video.mp4' },
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
  @ApiQuery({ name: 'isActive', description: '是否激活', example: true, required: false })
  @ApiQuery({ name: 'mediaResourceId', description: '媒体资源ID', example: 1, required: false })
  @UsePipes(new ValidationPipe({ transform: true }))
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
        subtitle: { type: 'string', example: 'https://example.com/subtitle.srt' },
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
  async findById(@Param('id') id: number) {
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
  async update(@Param('id') id: number, @Body() updatePlaySourceDto: UpdatePlaySourceDto) {
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
  async remove(@Param('id') id: number) {
    await this.playSourceService.remove(id);
    return { message: '删除成功' };
  }

  /**
   * 验证播放源有效性
   */
  @Put(':id/validate')
  @ApiOperation({ summary: '验证播放源有效性' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  async validate(@Param('id') id: number) {
    return this.playSourceService.validate(id);
  }

  /**
   * 获取媒体资源的最佳播放源
   */
  @Get('media/:mediaId/best')
  @ApiOperation({ summary: '获取媒体资源的最佳播放源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'mediaId', description: '媒体资源ID' })
  async getBestPlaySource(@Param('mediaId') mediaId: number) {
    return this.playSourceService.getBestPlaySource(mediaId);
  }

  /**
   * 获取媒体资源的播放源列表
   */
  @Get('media/:mediaId')
  @ApiOperation({ summary: '获取媒体资源的播放源列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'mediaId', description: '媒体资源ID' })
  async getByMediaResource(@Param('mediaId') mediaId: number) {
    return this.playSourceService.getByMediaResource(mediaId);
  }
}
