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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WatchHistoryService } from './watch-history.service';
import { CreateWatchHistoryDto } from './dtos/create-watch-history.dto';
import { UpdateWatchHistoryDto } from './dtos/update-watch-history.dto';
import { WatchHistoryQueryDto } from './dtos/watch-history-query.dto';
import { WatchHistory } from '../entities/watch-history.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('观看历史')
@Controller('watch-history')
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建或更新观看历史' })
  @ApiResponse({ status: 201, description: '观看历史创建成功', type: WatchHistory })
  async create(@Body() createWatchHistoryDto: CreateWatchHistoryDto): Promise<WatchHistory> {
    return await this.watchHistoryService.create(createWatchHistoryDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询观看历史' })
  @ApiResponse({ status: 200, description: '成功获取观看历史列表' })
  async findAll(@Query() queryDto: WatchHistoryQueryDto) {
    return await this.watchHistoryService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户观看历史' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功获取用户观看历史' })
  async findByUserId(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.watchHistoryService.findByUserId(userId, page, limit);
  }

  @Get('user/:userId/continue')
  @ApiOperation({ summary: '获取用户继续观看列表' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功获取继续观看列表', type: [WatchHistory] })
  async getContinueWatching(
    @Param('userId') userId: number,
    @Query('limit') limit: number = 10,
  ): Promise<WatchHistory[]> {
    return await this.watchHistoryService.getContinueWatching(userId, limit);
  }

  @Get('user/:userId/completed')
  @ApiOperation({ summary: '获取用户已看完的影视' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功获取已看完的影视列表' })
  async getCompleted(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.watchHistoryService.getCompleted(userId, page, limit);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: '获取用户观看统计' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '成功获取用户观看统计' })
  async getUserStats(@Param('userId') userId: number) {
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
  @ApiQuery({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'mediaResourceId', description: '影视资源ID' })
  @ApiQuery({ name: 'currentTime', description: '当前观看时间（秒）' })
  @ApiQuery({ name: 'duration', required: false, description: '总时长（秒）' })
  @ApiResponse({ status: 200, description: '观看进度更新成功', type: WatchHistory })
  async updateProgress(
    @Query('userId') userId: number,
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

  @Delete('user/:userId/all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '清空用户观看历史' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '用户观看历史清空成功' })
  async clearUserHistory(@Param('userId') userId: number): Promise<void> {
    await this.watchHistoryService.clearUserHistory(userId);
  }
}
