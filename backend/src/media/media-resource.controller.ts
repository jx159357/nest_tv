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
  ParseIntPipe,
} from '@nestjs/common';
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
import { Public } from '../auth/public.decorator';
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard';
import { GetCurrentUserId } from '../decorators/current-user.decorator';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import {
  MediaListResponseDto,
  MediaDetailResponseDto,
  ErrorResponse,
} from './dtos/media-resource-response.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';

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
  @Public()
  @ApiOperation({
    summary: '获取影视资源列表',
    description: '支持分页、搜索、分类筛选、评分范围、日期范围等多种筛选条件的影视资源列表查询',
  })
  @RateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: MediaListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: ErrorResponse,
  })
  @ApiResponse({ status: 401, description: '未授权', type: ErrorResponse })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() queryDto: MediaResourceQueryDto) {
    return this.mediaResourceService.findAll(queryDto);
  }

  /**
   * 搜索影视资源
   */
  @Get('search')
  @Public()
  @ApiOperation({ summary: '搜索影视资源' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async search(@Query('keyword') keyword: string, @Query('limit') limit: number = 10) {
    // 参数验证
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      limit = 10;
    }

    return this.mediaResourceService.search(keyword.trim(), limit);
  }

  /**
   * 获取热门影视
   */
  @Get('popular')
  @Public()
  @ApiOperation({ summary: '获取热门影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getPopular(@Query('limit') limit: number = 20) {
    // 参数验证
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      limit = 20;
    }

    return this.mediaResourceService.getPopular(limit);
  }

  /**
   * 获取最新影视
   */
  @Get('latest')
  @Public()
  @ApiOperation({ summary: '获取最新影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getLatest(@Query('limit') limit: number = 20) {
    return this.mediaResourceService.getLatest(limit);
  }

  /**
   * 获取影视统计信息
   */
  @Get('statistics')
  @Public()
  @ApiOperation({ summary: '获取影视统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics() {
    return this.mediaResourceService.getStatistics();
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: '获取分类统计（类型和流派）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategoryStats() {
    return this.mediaResourceService.getCategoryStats();
  }

  @Get('sources')
  @Public()
  @ApiOperation({ summary: '获取数据源列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSources() {
    return this.mediaResourceService.getSourceList();
  }

  @Post('deduplicate')
  @ApiOperation({ summary: '清理重复影视资源' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async deduplicateMediaResources() {
    return this.mediaResourceService.deduplicateMediaResources();
  }

  @Get('favorites')
  @ApiOperation({ summary: '获取当前用户收藏列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'limit', description: '每页数量', required: false })
  async getFavorites(
    @GetCurrentUserId() userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const nextPage = Number(page);
    const nextLimit = Number(limit);

    return this.mediaResourceService.getUserFavorites(userId, nextPage, nextLimit);
  }

  @Post(':id/favorites')
  @ApiOperation({ summary: '添加影视资源到收藏' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  async addToFavorites(
    @Param('id', ParseIntPipe) mediaResourceId: number,
    @GetCurrentUserId() userId: number,
  ): Promise<void> {
    await this.mediaResourceService.addToFavorites(userId, mediaResourceId);
  }

  @Delete(':id/favorites')
  @ApiOperation({ summary: '从收藏中移除影视资源' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '取消收藏成功' })
  async removeFromFavorites(
    @Param('id', ParseIntPipe) mediaResourceId: number,
    @GetCurrentUserId() userId: number,
  ): Promise<void> {
    await this.mediaResourceService.removeFromFavorites(userId, mediaResourceId);
  }

  @Get(':id/favorites/status')
  @ApiOperation({ summary: '检查影视资源收藏状态' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFavoriteStatus(
    @Param('id', ParseIntPipe) mediaResourceId: number,
    @GetCurrentUserId() userId: number,
  ) {
    const isFavorited = await this.mediaResourceService.isFavoritedByUser(userId, mediaResourceId);

    return { isFavorited };
  }

  @Get(':id/play-detail')
  @Public()
  @ApiOperation({
    summary: '获取播放详情',
    description: '返回媒体信息、线路分组、剧集列表、下载链接',
  })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPlayDetail(@Param('id', ParseIntPipe) id: number) {
    return this.mediaResourceService.getPlayDetail(id);
  }

  /**
   * 根据ID获取影视资源
   */
  @Get(':id')
  @Public()
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
        coverUrl: 'https://cdn.streaming-platform.com/media/cover-movie1.jpg',
        playUrl: 'https://cdn.streaming-platform.com/media/movie1-1080p.mp4',
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
  async findById(@Param('id', ParseIntPipe) id: number) {
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
          coverUrl: 'https://cdn.streaming-platform.com/media/cover-movie1.jpg',
          playUrl: 'https://cdn.streaming-platform.com/media/movie1-1080p.mp4',
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
        coverUrl: 'https://cdn.streaming-platform.com/media/cover-movie1.jpg',
        playUrl: 'https://cdn.streaming-platform.com/media/movie1-1080p.mp4',
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
  @UsePipes(new ValidationPipe({ transform: true }))
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMediaResourceDto: UpdateMediaResourceDto,
  ) {
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mediaResourceService.remove(id);
    return {
      statusCode: 200,
      message: 'Media resource deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取相似影视
   */
  @Get(':id/similar')
  @Public()
  @ApiOperation({ summary: '获取相似影视' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiQuery({ name: 'limit', description: '限制数量', required: false })
  async getSimilar(@Param('id', ParseIntPipe) id: number, @Query('limit') limit: number = 6) {
    return this.mediaResourceService.getSimilar(id, limit);
  }

  /**
   * 增加观看次数
   */
  @Put(':id/views')
  @Public()
  @ApiOperation({ summary: '增加观看次数' })
  @ApiResponse({ status: 200, description: '增加成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async incrementViews(@Param('id', ParseIntPipe) id: number) {
    await this.mediaResourceService.incrementViews(id);
    return { success: true, message: '增加观看次数成功' };
  }
}
