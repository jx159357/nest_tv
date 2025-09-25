import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MediaResourceService } from './media-resource.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import {
  MediaListResponseDto,
  MediaDetailResponseDto,
  ErrorResponse,
} from './dtos/media-resource-response.dto';

@ApiTags('影视资源管理')
@Controller('media')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@ApiBearerAuth()
export class MediaResourceController {
  constructor(private readonly mediaResourceService: MediaResourceService) {}

  /**
   * 获取影视资源列表（支持筛选和分页）
   */
  @Get()
  @ApiOperation({
    summary: '获取影视资源列表',
    description: '支持分页、搜索、分类筛选、评分范围、日期范围等多种筛选条件的影视资源列表查询',
  })
  @RateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100, // 最多100次请求
    handler: (key: string, info: any) => {
      console.log(`媒体列表查询限流: ${key}`, info);
    },
  })
  @ApiQuery({ name: 'page', description: '页码，从1开始', example: 1 })
  @ApiQuery({ name: 'pageSize', description: '每页数量，默认10条，最大100条', example: 10 })
  @ApiQuery({ name: 'search', description: '搜索关键词，支持标题和描述模糊搜索', required: false })
  @ApiQuery({
    name: 'type',
    description: '影视类型',
    example: 'movie',
    enum: ['movie', 'tv', 'variety', 'documentary'],
  })
  @ApiQuery({
    name: 'quality',
    description: '视频质量',
    example: '1080p',
    enum: ['1080p', '720p', '480p', '360p'],
  })
  @ApiQuery({ name: 'minRating', description: '最低评分', example: 6.0, required: false })
  @ApiQuery({ name: 'maxRating', description: '最高评分', example: 10.0, required: false })
  @ApiQuery({ name: 'tags', description: '影视标签，多个标签用逗号分隔', required: false })
  @ApiQuery({ name: 'startDate', description: '开始日期，格式：YYYY-MM-DD', required: false })
  @ApiQuery({ name: 'endDate', description: '结束日期，格式：YYYY-MM-DD', required: false })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: MediaListResponseDto,
    example: {
      data: [
        {
          id: 1,
          title: '复仇者联盟4',
          description: '经典的超级英雄电影',
          type: 'movie',
          quality: '1080p',
          rating: 8.7,
          tags: ['动作', '科幻'],
          coverUrl: 'https://example.com/cover.jpg',
          playUrl: 'https://example.com/video.mp4',
          duration: 8820,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 100,
      totalPages: 10,
      hasNext: true,
      hasPrevious: false,
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: ErrorResponse,
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: ['page must be greater than 0', 'pageSize must not be greater than 100'],
    },
  })
  @ApiResponse({ status: 401, description: '未授权', type: ErrorResponse })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('quality') quality?: string,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('tags') tags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const queryDto = {
      page,
      pageSize,
      search,
      type: type as any,
      quality: quality as any,
      minRating,
      maxRating,
      tags: tags ? tags : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.mediaResourceService.findAll(queryDto);
  }

  /**
   * 根据ID获取影视资源
   */
  @Get(':id')
  @ApiOperation({
    summary: '根据ID获取影视资源',
    description: '通过ID获取单个影视资源的详细信息，包括推荐和相关播放源',
  })
  @ApiParam({
    name: 'id',
    description: '影视资源ID，正整数',
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: MediaDetailResponseDto,
    example: {
      data: {
        id: 1,
        title: '复仇者联盟4',
        description: '经典的超级英雄电影',
        type: 'movie',
        quality: '1080p',
        rating: 8.7,
        tags: ['动作', '科幻'],
        coverUrl: 'https://example.com/cover.jpg',
        playUrl: 'https://example.com/video.mp4',
        duration: 8820,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      recommendations: [
        {
          id: 2,
          title: '复仇者联盟3',
          type: 'movie',
          coverUrl: 'https://example.com/cover2.jpg',
        },
      ],
      playSources: [
        {
          quality: '1080p',
          url: 'https://example.com/video1080.mp4',
          size: '2.5GB',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '影视资源不存在',
    type: ErrorResponse,
    example: {
      statusCode: 404,
      message: 'Media resource with ID 1 not found',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({ status: 401, description: '未授权', type: ErrorResponse })
  async findById(@Param('id') id: number) {
    return this.mediaResourceService.findById(id);
  }

  /**
   * 创建影视资源
   */
  @Post()
  @ApiOperation({
    summary: '创建影视资源',
    description: '创建新的影视资源，支持标题、描述、类型、封面等信息',
  })
  @ApiBody({
    description: '创建影视资源请求体',
    type: CreateMediaResourceDto,
    examples: {
      movie: {
        summary: '电影创建示例',
        value: {
          title: '复仇者联盟4',
          description: '经典的超级英雄电影',
          type: 'movie',
          quality: '1080p',
          tags: ['动作', '科幻'],
          coverUrl: 'https://example.com/cover.jpg',
          playUrl: 'https://example.com/video.mp4',
          duration: 8820,
          rating: 8.7,
          isActive: true,
        },
      },
      tv: {
        summary: '电视剧创建示例',
        value: {
          title: '权力的游戏',
          description: '史诗奇幻电视剧',
          type: 'tv',
          quality: '1080p',
          tags: ['奇幻', '冒险'],
          coverUrl: 'https://example.com/got-cover.jpg',
          playUrl: 'https://example.com/got-video.mp4',
          duration: 3600,
          rating: 9.2,
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: MediaDetailResponseDto,
    example: {
      data: {
        id: 101,
        title: '复仇者联盟4',
        description: '经典的超级英雄电影',
        type: 'movie',
        quality: '1080p',
        rating: 8.7,
        tags: ['动作', '科幻'],
        coverUrl: 'https://example.com/cover.jpg',
        playUrl: 'https://example.com/video.mp4',
        duration: 8820,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      recommendations: [],
      playSources: [],
    },
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败',
    type: ErrorResponse,
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: ['title is required', 'type must be valid', 'coverUrl must be a valid URL'],
    },
  })
  @ApiResponse({ status: 401, description: '未授权', type: ErrorResponse })
  @ApiResponse({ status: 403, description: '权限不足', type: ErrorResponse })
  async create(@Body() createMediaResourceDto: CreateMediaResourceDto) {
    return this.mediaResourceService.create(createMediaResourceDto);
  }

  /**
   * 更新影视资源
   */
  @Put(':id')
  @ApiOperation({
    summary: '更新影视资源',
    description: '根据ID更新影视资源信息，支持部分更新',
  })
  @ApiParam({
    name: 'id',
    description: '要更新的影视资源ID',
    example: 1,
    required: true,
  })
  @ApiBody({
    description: '更新影视资源请求体',
    type: UpdateMediaResourceDto,
    examples: {
      partial_update: {
        summary: '部分更新示例',
        value: {
          title: '复仇者联盟4：终极版',
          description: '更新后的电影描述',
          quality: '4K',
          tags: ['动作', '科幻', '终极版'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: MediaDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '影视资源不存在',
    type: ErrorResponse,
    example: {
      statusCode: 404,
      message: 'Media resource with ID 1 not found',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
    type: ErrorResponse,
  })
  async update(@Param('id') id: number, @Body() updateMediaResourceDto: UpdateMediaResourceDto) {
    return this.mediaResourceService.update(id, updateMediaResourceDto);
  }

  /**
   * 删除影视资源
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除影视资源',
    description: '根据ID删除指定的影视资源，删除后无法恢复',
  })
  @ApiParam({
    name: 'id',
    description: '要删除的影视资源ID',
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    example: {
      statusCode: 200,
      message: 'Media resource deleted successfully',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: '影视资源不存在',
    type: ErrorResponse,
    example: {
      statusCode: 404,
      message: 'Media resource with ID 1 not found',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({ status: 401, description: '未授权', type: ErrorResponse })
  @ApiResponse({ status: 403, description: '权限不足', type: ErrorResponse })
  async remove(@Param('id') id: number) {
    await this.mediaResourceService.remove(id);
    return {
      statusCode: 200,
      message: 'Media resource deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 搜索影视资源
   */
  @Get('search')
  @ApiOperation({ summary: '搜索影视资源' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async search(@Query('keyword') keyword: string, @Query('limit') limit: number = 10) {
    return this.mediaResourceService.search(keyword, limit);
  }

  /**
   * 获取热门影视
   */
  @Get('popular')
  @ApiOperation({ summary: '获取热门影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getPopular(@Query('limit') limit: number = 20) {
    return this.mediaResourceService.getPopular(limit);
  }

  /**
   * 获取最新影视
   */
  @Get('latest')
  @ApiOperation({ summary: '获取最新影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getLatest(@Query('limit') limit: number = 20) {
    return this.mediaResourceService.getLatest(limit);
  }

  /**
   * 获取相似影视
   */
  @Get(':id/similar')
  @ApiOperation({ summary: '获取相似影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getSimilar(@Param('id') id: number, @Query('limit') limit: number = 6) {
    return this.mediaResourceService.getSimilar(id, limit);
  }

  /**
   * 增加观看次数
   */
  @Put(':id/views')
  @ApiOperation({ summary: '增加观看次数' })
  @ApiResponse({ status: 200, description: '增加成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async incrementViews(@Param('id') id: number) {
    await this.mediaResourceService.incrementViews(id);
    return { message: '增加观看次数成功' };
  }

  /**
   * 增加点赞数
   */
  @Put(':id/likes')
  @ApiOperation({ summary: '增加点赞数' })
  @ApiResponse({ status: 200, description: '增加成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async incrementLikes(@Param('id') id: number) {
    await this.mediaResourceService.incrementLikes(id);
    return { message: '增加点赞数成功' };
  }

  /**
   * 减少点赞数
   */
  @Put(':id/unlikes')
  @ApiOperation({ summary: '减少点赞数' })
  @ApiResponse({ status: 200, description: '减少成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async decrementLikes(@Param('id') id: number) {
    await this.mediaResourceService.decrementLikes(id);
    return { message: '减少点赞数成功' };
  }

  /**
   * 获取影视统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取影视统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics() {
    return this.mediaResourceService.getStatistics();
  }
}
