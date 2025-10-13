import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WatchHistoryService } from './watch-history.service';
import { CreateWatchHistoryDto } from './dtos/create-watch-history.dto';
import { UpdateWatchHistoryDto } from './dtos/update-watch-history.dto';
import { WatchHistoryQueryDto } from './dtos/watch-history-query.dto';
import { WatchHistory } from '../entities/watch-history.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUserId } from '../decorators/current-user.decorator';

@ApiTags('观看历史')
@Controller('watch-history')
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '创建或更新观看历史',
    description: '创建新的观看历史记录，如果已存在则更新进度信息',
  })
  @ApiResponse({
    status: 201,
    description: '观看历史创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        mediaResourceId: { type: 'number', example: 1 },
        currentTime: { type: 'number', example: 1200 },
        duration: { type: 'number', example: 3600 },
        isCompleted: { type: 'boolean', example: false },
        lastWatchedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @GetCurrentUserId() userId: number,
    @Body() createWatchHistoryDto: CreateWatchHistoryDto,
  ): Promise<WatchHistory> {
    // 确保使用当前用户的ID
    const dtoWithUserId = {
      ...createWatchHistoryDto,
      userId,
    };
    return await this.watchHistoryService.create(dtoWithUserId);
  }

  @Get()
  @ApiOperation({ summary: '分页查询观看历史' })
  @ApiResponse({ status: 200, description: '成功获取观看历史列表' })
  async findAll(@Query() queryDto: WatchHistoryQueryDto) {
    return await this.watchHistoryService.findAll(queryDto);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户观看历史' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功获取用户观看历史' })
  async findMyHistory(
    @GetCurrentUserId() userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.watchHistoryService.findByUserId(userId, page, limit);
  }

  @Get('user/me/continue')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户继续观看列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功获取继续观看列表', type: [WatchHistory] })
  async getMyContinueWatching(
    @GetCurrentUserId() userId: number,
    @Query('limit') limit: number = 10,
  ): Promise<WatchHistory[]> {
    return await this.watchHistoryService.getContinueWatching(userId, limit);
  }

  @Get('user/me/completed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户已看完的影视' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功获取已看完的影视列表' })
  async getMyCompleted(
    @GetCurrentUserId() userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.watchHistoryService.getCompleted(userId, page, limit);
  }

  @Get('user/me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户观看统计' })
  @ApiResponse({ status: 200, description: '成功获取用户观看统计' })
  async getMyStats(@GetCurrentUserId() userId: number) {
    return await this.watchHistoryService.getUserStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取观看历史详情' })
  @ApiParam({ name: 'id', description: '观看历史ID' })
  @ApiResponse({ status: 200, description: '成功获取观看历史详情', type: WatchHistory })
  async findById(@Param('id') id: number): Promise<WatchHistory> {
    return await this.watchHistoryService.findById(id);
  }

  @Get('user/:userId/media/:mediaResourceId')
  @ApiOperation({ summary: '根据用户ID和影视资源ID获取观看历史' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiParam({ name: 'mediaResourceId', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '成功获取观看历史', type: WatchHistory })
  async findByUserAndMedia(
    @Param('userId') userId: number,
    @Param('mediaResourceId') mediaResourceId: number,
  ): Promise<WatchHistory | null> {
    return await this.watchHistoryService.findByUserAndMedia(userId, mediaResourceId);
  }

  @Patch('progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新观看进度' })
  @ApiQuery({ name: 'mediaResourceId', description: '影视资源ID' })
  @ApiQuery({ name: 'currentTime', description: '当前观看时间（秒）' })
  @ApiQuery({ name: 'duration', required: false, description: '总时长（秒）' })
  @ApiResponse({ status: 200, description: '观看进度更新成功', type: WatchHistory })
  async updateProgress(
    @GetCurrentUserId() userId: number,
    @Query('mediaResourceId') mediaResourceId: number,
    @Query('currentTime') currentTime: number,
    @Query('duration') duration?: number,
  ): Promise<WatchHistory> {
    return await this.watchHistoryService.updateProgress(
      userId,
      mediaResourceId,
      currentTime,
      duration,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新观看历史' })
  @ApiParam({ name: 'id', description: '观看历史ID' })
  @ApiResponse({ status: 200, description: '观看历史更新成功', type: WatchHistory })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: number,
    @Body() updateWatchHistoryDto: UpdateWatchHistoryDto,
  ): Promise<WatchHistory> {
    return await this.watchHistoryService.update(id, updateWatchHistoryDto);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '标记为已看完' })
  @ApiParam({ name: 'id', description: '观看历史ID' })
  @ApiResponse({ status: 200, description: '标记完成成功', type: WatchHistory })
  async markAsCompleted(@Param('id') id: number): Promise<WatchHistory> {
    return await this.watchHistoryService.markAsCompleted(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除观看历史' })
  @ApiParam({ name: 'id', description: '观看历史ID' })
  @ApiResponse({ status: 200, description: '观看历史删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    await this.watchHistoryService.remove(id);
  }

  @Delete('user/me/all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '清空当前用户观看历史' })
  @ApiResponse({ status: 200, description: '用户观看历史清空成功' })
  async clearMyHistory(@GetCurrentUserId() userId: number): Promise<void> {
    await this.watchHistoryService.clearUserHistory(userId);
  }
}
