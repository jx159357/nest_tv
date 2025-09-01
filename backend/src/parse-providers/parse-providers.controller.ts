import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ParseProvidersService } from './parse-providers.service';
import { CreateParseProviderDto } from './dto/create-parse-provider.dto';
import { UpdateParseProviderDto } from './dto/update-parse-provider.dto';
import { ParseProviderQueryDto } from './dto/parse-provider-query.dto';
import { ParseProvider } from '../entities/parse-provider.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('解析提供商管理')
@Controller('parse-providers')
@UseGuards(JwtAuthGuard)
export class ParseProvidersController {
  constructor(private readonly parseProvidersService: ParseProvidersService) {}

  @Post()
  @ApiOperation({ summary: '创建解析提供商' })
  @ApiResponse({ status: 201, description: '解析提供商创建成功', type: ParseProvider })
  async create(@Body() createParseProviderDto: CreateParseProviderDto): Promise<ParseProvider> {
    return await this.parseProvidersService.create(createParseProviderDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询解析提供商' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: ParseProviderQueryDto) {
    return await this.parseProvidersService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查找解析提供商' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: ParseProvider })
  async findById(@Param('id') id: number): Promise<ParseProvider> {
    return await this.parseProvidersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新解析提供商' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: ParseProvider })
  async update(
    @Param('id') id: number,
    @Body() updateParseProviderDto: UpdateParseProviderDto,
  ): Promise<ParseProvider> {
    return await this.parseProvidersService.update(id, updateParseProviderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除解析提供商' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    await this.parseProvidersService.remove(id);
  }

  @Put(':id/soft-delete')
  @ApiOperation({ summary: '软删除解析提供商' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiResponse({ status: 200, description: '软删除成功', type: ParseProvider })
  async softDelete(@Param('id') id: number): Promise<ParseProvider> {
    return await this.parseProvidersService.softDelete(id);
  }

  @Get('categories/list')
  @ApiOperation({ summary: '获取所有分类' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllCategories(): Promise<string[]> {
    return await this.parseProvidersService.getAllCategories();
  }

  @Get('category/:category')
  @ApiOperation({ summary: '根据分类获取解析提供商' })
  @ApiParam({ name: 'category', description: '分类名称' })
  @ApiQuery({ name: 'activeOnly', description: '只查询活跃提供商', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByCategory(
    @Param('category') category: string,
    @Query('activeOnly') activeOnly: boolean = true,
  ): Promise<ParseProvider[]> {
    return await this.parseProvidersService.getByCategory(category, activeOnly);
  }

  @Post('bulk')
  @ApiOperation({ summary: '批量创建解析提供商' })
  @ApiResponse({ status: 201, description: '批量创建成功' })
  async createBulk(@Body() createParseProviderDtos: CreateParseProviderDto[]): Promise<ParseProvider[]> {
    return await this.parseProvidersService.createBulk(createParseProviderDtos);
  }

  @Put('bulk/status')
  @ApiOperation({ summary: '批量更新解析提供商状态' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  async updateBulkStatus(
    @Body('ids') ids: number[],
    @Body('isActive') isActive: boolean,
  ): Promise<void> {
    await this.parseProvidersService.updateBulkStatus(ids, isActive);
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试解析提供商' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiQuery({ name: 'testUrl', description: '测试URL', required: false })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testProvider(
    @Param('id') id: number,
    @Query('testUrl') testUrl?: string,
  ): Promise<any> {
    return await this.parseProvidersService.testProvider(id, testUrl);
  }

  @Post(':id/parse')
  @ApiOperation({ summary: '解析视频链接' })
  @ApiParam({ name: 'id', description: '解析提供商ID' })
  @ApiResponse({ status: 200, description: '解析成功' })
  async parseVideoUrl(
    @Param('id') id: number,
    @Body('videoUrl') videoUrl: string,
  ): Promise<any> {
    return await this.parseProvidersService.parseVideoUrl(id, videoUrl);
  }

  @Get('best')
  @ApiOperation({ summary: '获取最佳解析提供商' })
  @ApiQuery({ name: 'category', description: '分类', required: false })
  @ApiQuery({ name: 'supportOnlinePlay', description: '支持在线播放', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getBestProvider(
    @Query('category') category?: string,
    @Query('supportOnlinePlay') supportOnlinePlay: boolean = true,
  ): Promise<ParseProvider | null> {
    return await this.parseProvidersService.getBestProvider(category, supportOnlinePlay);
  }

  @Put('daily/reset')
  @ApiOperation({ summary: '重置每日请求计数' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetDailyCounts(): Promise<void> {
    await this.parseProvidersService.resetDailyCounts();
  }

  @Get('stats')
  @ApiOperation({ summary: '获取解析提供商统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStats(): Promise<any> {
    return await this.parseProvidersService.getStats();
  }

  @Get('search/:keyword')
  @ApiOperation({ summary: '搜索解析提供商' })
  @ApiParam({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '返回数量限制', required: false, type: Number })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchProviders(
    @Param('keyword') keyword: string,
    @Query('limit') limit: number = 20,
  ): Promise<ParseProvider[]> {
    return await this.parseProvidersService.searchProviders(keyword, limit);
  }
}