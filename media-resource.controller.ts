import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MediaResourceService } from './media-resource.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('影视资源管理')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaResourceController {
  constructor(private readonly mediaResourceService: MediaResourceService) {}

  /**
   * 获取影视资源列表（支持筛选和分页）
   */
  @Get()
  @ApiOperation({ summary: '获取影视资源列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
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
      tags: tags ? tags.split(',') : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    
    return this.mediaResourceService.findAll(queryDto);
  }

  /**
   * 根据ID获取影视资源
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取影视资源' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async findById(@Param('id') id: number) {
    return this.mediaResourceService.findById(id);
  }

  /**
   * 创建影视资源
   */
  @Post()
  @ApiOperation({ summary: '创建影视资源' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() createMediaResourceDto: any) {
    return this.mediaResourceService.create(createMediaResourceDto);
  }

  /**
   * 更新影视资源
   */
  @Put(':id')
  @ApiOperation({ summary: '更新影视资源' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async update(@Param('id') id: number, @Body() updateMediaResourceDto: any) {
    return this.mediaResourceService.update(id, updateMediaResourceDto);
  }

  /**
   * 删除影视资源
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除影视资源' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '影视资源不存在' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  async remove(@Param('id') id: number) {
    await this.mediaResourceService.remove(id);
    return { message: '删除成功' };
  }
}
