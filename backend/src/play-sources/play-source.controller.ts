import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: '获取播放源列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('mediaResourceId') mediaResourceId?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const queryDto = {
      page,
      pageSize,
      mediaResourceId,
      type,
      status,
    };

    return this.playSourceService.findAll(queryDto);
  }

  /**
   * 根据ID获取播放源
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取播放源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '播放源不存在' })
  @ApiParam({ name: 'id', description: '播放源ID' })
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
  async create(@Body() createPlaySourceDto: any) {
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
  async update(@Param('id') id: number, @Body() updatePlaySourceDto: any) {
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
