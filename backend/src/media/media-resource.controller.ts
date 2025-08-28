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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MediaResourceService } from './media-resource.service';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { MediaResource } from '../entities/media-resource.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('影视资源')
@Controller('media')
export class MediaResourceController {
  constructor(private readonly mediaResourceService: MediaResourceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建影视资源' })
  @ApiResponse({ status: 201, description: '影视资源创建成功', type: MediaResource })
  async create(@Body() createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource> {
    return await this.mediaResourceService.create(createMediaResourceDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询影视资源' })
  @ApiResponse({ status: 200, description: '成功获取影视资源列表' })
  async findAll(@Query() queryDto: MediaResourceQueryDto) {
    return await this.mediaResourceService.findAll(queryDto);
  }

  @Get('popular')
  @ApiOperation({ summary: '获取热门影视资源' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功获取热门影视资源', type: [MediaResource] })
  async getPopular(@Query('limit') limit: number = 10): Promise<MediaResource[]> {
    return await this.mediaResourceService.getPopular(limit);
  }

  @Get('latest')
  @ApiOperation({ summary: '获取最新影视资源' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功获取最新影视资源', type: [MediaResource] })
  async getLatest(@Query('limit') limit: number = 10): Promise<MediaResource[]> {
    return await this.mediaResourceService.getLatest(limit);
  }

  @Get('top-rated')
  @ApiOperation({ summary: '获取高评分影视资源' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: '最低评分' })
  @ApiResponse({ status: 200, description: '成功获取高评分影视资源', type: [MediaResource] })
  async getTopRated(
    @Query('limit') limit: number = 10,
    @Query('minRating') minRating: number = 8
  ): Promise<MediaResource[]> {
    return await this.mediaResourceService.getTopRated(limit, minRating);
  }

  @Get('type/:type')
  @ApiOperation({ summary: '根据类型获取影视资源' })
  @ApiParam({ name: 'type', description: '影视类型' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '成功获取指定类型的影视资源', type: [MediaResource] })
  async getByType(
    @Param('type') type: string,
    @Query('limit') limit: number = 20
  ): Promise<MediaResource[]> {
    return await this.mediaResourceService.getByType(type as any, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取影视资源详情' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '成功获取影视资源详情', type: MediaResource })
  async findById(@Param('id') id: number): Promise<MediaResource> {
    return await this.mediaResourceService.findById(id);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: '获取相关推荐' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '推荐数量限制' })
  @ApiResponse({ status: 200, description: '成功获取相关推荐', type: [MediaResource] })
  async getRecommendations(
    @Param('id') id: number,
    @Query('limit') limit: number = 6
  ): Promise<MediaResource[]> {
    return await this.mediaResourceService.getRecommendations(id, limit);
  }

  @Patch(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '增加观看次数' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '观看次数增加成功' })
  async incrementViewCount(@Param('id') id: number): Promise<void> {
    await this.mediaResourceService.incrementViewCount(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新影视资源' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '影视资源更新成功', type: MediaResource })
  async update(
    @Param('id') id: number,
    @Body() updateMediaResourceDto: UpdateMediaResourceDto
  ): Promise<MediaResource> {
    return await this.mediaResourceService.update(id, updateMediaResourceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除影视资源' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '影视资源删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    await this.mediaResourceService.remove(id);
  }

  @Patch(':id/soft-delete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '软删除影视资源' })
  @ApiParam({ name: 'id', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '影视资源软删除成功', type: MediaResource })
  async softDelete(@Param('id') id: number): Promise<MediaResource> {
    return await this.mediaResourceService.softDelete(id);
  }
}