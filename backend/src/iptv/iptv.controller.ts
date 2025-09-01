import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IPTVService } from './iptv.service';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('IPTV频道管理')
@Controller('iptv')
@UseGuards(JwtAuthGuard)
export class IPTVController {
  constructor(private readonly iptvService: IPTVService) {}

  @Post()
  @ApiOperation({ summary: '创建IPTV频道' })
  @ApiResponse({ status: 201, description: 'IPTV频道创建成功', type: IPTVChannel })
  async create(@Body() createIPTVChannelDto: CreateIPTVChannelDto): Promise<IPTVChannel> {
    return await this.iptvService.create(createIPTVChannelDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询IPTV频道' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: IPTVChannelQueryDto) {
    return await this.iptvService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查找IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: IPTVChannel })
  async findById(@Param('id') id: number): Promise<IPTVChannel> {
    return await this.iptvService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: IPTVChannel })
  async update(
    @Param('id') id: number,
    @Body() updateIPTVChannelDto: UpdateIPTVChannelDto,
  ): Promise<IPTVChannel> {
    return await this.iptvService.update(id, updateIPTVChannelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    await this.iptvService.remove(id);
  }

  @Put(':id/soft-delete')
  @ApiOperation({ summary: '软删除IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '软删除成功', type: IPTVChannel })
  async softDelete(@Param('id') id: number): Promise<IPTVChannel> {
    return await this.iptvService.softDelete(id);
  }

  @Put(':id/view')
  @ApiOperation({ summary: '增加观看次数' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '观看次数增加成功' })
  async incrementViewCount(@Param('id') id: number): Promise<void> {
    await this.iptvService.incrementViewCount(id);
  }

  @Get('groups/list')
  @ApiOperation({ summary: '获取所有频道分组' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllGroups(): Promise<string[]> {
    return await this.iptvService.getAllGroups();
  }

  @Get('group/:group')
  @ApiOperation({ summary: '根据分组获取频道' })
  @ApiParam({ name: 'group', description: '频道分组' })
  @ApiQuery({ name: 'activeOnly', description: '只查询活跃频道', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByGroup(
    @Param('group') group: string,
    @Query('activeOnly') activeOnly: boolean = true,
  ): Promise<IPTVChannel[]> {
    return await this.iptvService.getByGroup(group, activeOnly);
  }

  @Post('bulk')
  @ApiOperation({ summary: '批量创建IPTV频道' })
  @ApiResponse({ status: 201, description: '批量创建成功' })
  async createBulk(@Body() createIPTVChannelDtos: CreateIPTVChannelDto[]): Promise<IPTVChannel[]> {
    return await this.iptvService.createBulk(createIPTVChannelDtos);
  }

  @Put('bulk/status')
  @ApiOperation({ summary: '批量更新频道状态' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  async updateBulkStatus(
    @Body('ids') ids: number[],
    @Body('isActive') isActive: boolean,
  ): Promise<void> {
    await this.iptvService.updateBulkStatus(ids, isActive);
  }

  @Post('import/m3u')
  @ApiOperation({ summary: '导入M3U播放列表' })
  @ApiQuery({ name: 'm3uUrl', description: 'M3U播放列表URL' })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importFromM3U(@Query('m3uUrl') m3uUrl: string): Promise<IPTVChannel[]> {
    return await this.iptvService.importFromM3U(m3uUrl);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: '验证频道链接有效性' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async validateChannel(@Param('id') id: number): Promise<{ isValid: boolean }> {
    const isValid = await this.iptvService.validateChannel(id);
    return { isValid };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取IPTV频道统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStats(): Promise<any> {
    return await this.iptvService.getStats();
  }

  @Get('search/:keyword')
  @ApiOperation({ summary: '搜索频道' })
  @ApiParam({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '返回数量限制', required: false, type: Number })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchChannels(
    @Param('keyword') keyword: string,
    @Query('limit') limit: number = 20,
  ): Promise<IPTVChannel[]> {
    return await this.iptvService.searchChannels(keyword, limit);
  }
}