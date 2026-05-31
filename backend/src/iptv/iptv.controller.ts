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
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { IPTVService } from './iptv.service';
import { StreamQualityTester } from './stream-quality-tester.service';
import { IptvSourceCollector } from './iptv-source-collector.service';
import type { IptvSourceConfig } from './iptv-source-collector.service';
import { EpgService } from './epg.service';
import { ChannelLogoService } from './channel-logo.service';
import { HlsProxyService } from './hls-proxy.service';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('IPTV频道管理')
@Controller('iptv')
@UseGuards(JwtAuthGuard)
export class IPTVController {
  constructor(
    private readonly iptvService: IPTVService,
    private readonly qualityTester: StreamQualityTester,
    private readonly sourceCollector: IptvSourceCollector,
    private readonly epgService: EpgService,
    private readonly logoService: ChannelLogoService,
    private readonly hlsProxyService: HlsProxyService,
  ) {}

  private toBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return Boolean(value);
  }

  // ==================== 频道基础管理 ====================

  @Post()
  @ApiOperation({ summary: '创建IPTV频道' })
  @ApiResponse({ status: 201, description: 'IPTV频道创建成功', type: IPTVChannel })
  async create(@Body() createIPTVChannelDto: CreateIPTVChannelDto): Promise<IPTVChannel> {
    return await this.iptvService.create(createIPTVChannelDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '分页查询IPTV频道' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: IPTVChannelQueryDto) {
    return await this.iptvService.findAll(queryDto);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: '获取IPTV频道统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStats(): Promise<Record<string, unknown>> {
    return await this.iptvService.getStats();
  }

  @Get('groups/list')
  @Public()
  @ApiOperation({ summary: '获取所有频道分组' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllGroups(): Promise<string[]> {
    return await this.iptvService.getAllGroups();
  }

  @Get('group/:group')
  @Public()
  @ApiOperation({ summary: '根据分组获取频道' })
  @ApiParam({ name: 'group', description: '频道分组' })
  @ApiQuery({ name: 'activeOnly', description: '只查询活跃频道', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByGroup(
    @Param('group') group: string,
    @Query('activeOnly') activeOnly: boolean | string = true,
  ): Promise<IPTVChannel[]> {
    return await this.iptvService.getByGroup(group, this.toBoolean(activeOnly, true));
  }

  @Get('search/:keyword')
  @Public()
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

  @Post('deduplicate')
  @ApiOperation({ summary: '清理重复IPTV频道' })
  @ApiQuery({ name: 'dryRun', description: '仅预览，不执行修改', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '清理成功' })
  async deduplicateChannels(@Query('dryRun') dryRun: boolean | string = true) {
    return this.iptvService.deduplicateChannels(this.toBoolean(dryRun, true));
  }

  // ==================== 导入导出 ====================

  @Post('import/m3u')
  @ApiOperation({ summary: '导入M3U播放列表' })
  @ApiQuery({ name: 'm3uUrl', description: 'M3U播放列表URL' })
  @ApiQuery({ name: 'group', description: '默认分组名（可选）', required: false })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importFromM3U(
    @Query('m3uUrl') m3uUrl: string,
    @Query('group') group?: string,
  ): Promise<IPTVChannel[]> {
    return await this.iptvService.importFromM3U(m3uUrl, group);
  }

  @Post('import/json')
  @ApiOperation({ summary: '导入JSON格式频道列表' })
  @ApiQuery({ name: 'group', description: '默认分组名（可选）', required: false })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importFromJson(
    @Body() body: { channels: { name: string; url: string; group?: string; logo?: string }[] },
    @Query('group') defaultGroup?: string,
  ): Promise<IPTVChannel[]> {
    return await this.iptvService.importFromJson(body.channels, defaultGroup);
  }

  @Post('import/txt')
  @ApiOperation({ summary: '导入TXT格式频道列表（频道名,URL格式）' })
  @ApiQuery({ name: 'group', description: '默认分组名（可选）', required: false })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importFromTxt(
    @Body() body: { content: string },
    @Query('group') defaultGroup?: string,
  ): Promise<IPTVChannel[]> {
    const channels = this.parseTxtFormat(body.content, defaultGroup);
    return await this.iptvService.importFromJson(channels, defaultGroup);
  }

  @Get('export/m3u')
  @Public()
  @ApiOperation({ summary: '导出M3U格式播放列表' })
  @ApiQuery({ name: 'group', description: '导出指定分组（可选）', required: false })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportM3U(@Query('group') group?: string, @Res() res?: Response): Promise<void> {
    const channels = group
      ? await this.iptvService.getByGroup(group)
      : (await this.iptvService.findAll({ page: 1, limit: 10000 })).data;

    let m3u = '#EXTM3U\n';
    for (const channel of channels) {
      const attrs = [
        `tvg-name="${channel.name}"`,
        `tvg-logo="${channel.logo || ''}"`,
        `group-title="${channel.group}"`,
        channel.epgId ? `tvg-id="${channel.epgId}"` : '',
        channel.language ? `tvg-language="${channel.language}"` : '',
        channel.country ? `tvg-country="${channel.country}"` : '',
      ]
        .filter(Boolean)
        .join(' ');

      m3u += `#EXTINF:-1 ${attrs},${channel.name}\n`;
      m3u += `${channel.url}\n`;
    }

    res?.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res?.setHeader('Content-Disposition', 'attachment; filename="channels.m3u"');
    res?.send(m3u);
  }

  @Get('export/txt')
  @Public()
  @ApiOperation({ summary: '导出TXT格式频道列表' })
  @ApiQuery({ name: 'group', description: '导出指定分组（可选）', required: false })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportTxt(@Query('group') group?: string, @Res() res?: Response): Promise<void> {
    const channels = group
      ? await this.iptvService.getByGroup(group)
      : (await this.iptvService.findAll({ page: 1, limit: 10000 })).data;

    let txt = '';
    for (const channel of channels) {
      txt += `${channel.name},${channel.url}\n`;
    }

    res?.setHeader('Content-Type', 'text/plain');
    res?.setHeader('Content-Disposition', 'attachment; filename="channels.txt"');
    res?.send(txt);
  }

  // ==================== 流代理 ====================

  @Get('stream/proxy')
  @Public()
  @ApiOperation({ summary: '代理IPTV流媒体' })
  @ApiQuery({ name: 'url', description: '流媒体URL', required: true })
  @ApiQuery({ name: 'cache', description: '启用缓存', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '流媒体内容' })
  async proxyStream(
    @Query('url') url: string,
    @Query('cache') cache: boolean = false,
    @Res() res: Response,
  ) {
    return this.hlsProxyService.proxyHlsStream(url, res, { enableCache: cache });
  }

  @Get('key/proxy')
  @Public()
  @ApiOperation({ summary: '代理AES-128密钥请求' })
  @ApiQuery({ name: 'url', description: '密钥URL', required: true })
  @ApiResponse({ status: 200, description: '密钥内容' })
  async proxyKey(@Query('url') url: string, @Res() res: Response) {
    return this.hlsProxyService.proxyKeyRequest(url, res);
  }

  @Get('image/proxy')
  @Public()
  @ApiOperation({ summary: '代理图片请求（绕过防盗链）' })
  @ApiQuery({ name: 'url', description: '图片URL', required: true })
  @ApiResponse({ status: 200, description: '图片内容' })
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    return this.iptvService.proxyImage(url, res);
  }

  @Get('proxy/cache/stats')
  @Public()
  @ApiOperation({ summary: '获取代理缓存统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getProxyCacheStats() {
    return this.hlsProxyService.getCacheStats();
  }

  @Post('proxy/cache/clear')
  @ApiOperation({ summary: '清除代理缓存' })
  @ApiResponse({ status: 200, description: '清除成功' })
  clearProxyCache() {
    this.hlsProxyService.clearCache();
    return { success: true, message: '缓存已清除' };
  }

  // ==================== EPG节目单 ====================

  @Get('epg/xml')
  @Public()
  @ApiOperation({ summary: '导出XMLTV格式EPG' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportXmltv(@Res() res: Response): Promise<void> {
    const xml = await this.epgService.exportXmltv();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="epg.xml"');
    res.send(xml);
  }

  // ==================== 流质量测试 ====================

  @Post('quality/test-all')
  @ApiOperation({ summary: '测试所有活跃频道质量' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testAllChannelsQuality() {
    return this.qualityTester.testAllActiveChannels();
  }

  @Post('quality/test-group/:group')
  @ApiOperation({ summary: '测试指定分组频道质量' })
  @ApiParam({ name: 'group', description: '频道分组' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testGroupQuality(@Param('group') group: string) {
    return this.qualityTester.testChannelsByGroup(group);
  }

  @Get('quality/stats')
  @Public()
  @ApiOperation({ summary: '获取频道质量统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getQualityStats() {
    return this.qualityTester.getQualityStats();
  }

  @Post('quality/disable-low')
  @ApiOperation({ summary: '禁用低质量频道' })
  @ApiQuery({ name: 'minScore', description: '最低评分阈值', required: false, type: Number })
  @ApiResponse({ status: 200, description: '操作成功' })
  async disableLowQualityChannels(@Query('minScore') minScore?: number) {
    const count = await this.qualityTester.disableLowQualityChannels(minScore || 30);
    return { disabledCount: count };
  }

  // ==================== 直播源收集 ====================

  @Get('sources')
  @Public()
  @ApiOperation({ summary: '获取所有直播源配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getSources() {
    return this.sourceCollector.getSources();
  }

  @Post('sources')
  @ApiOperation({ summary: '添加直播源' })
  @ApiResponse({ status: 201, description: '添加成功' })
  addSource(@Body() source: IptvSourceConfig) {
    this.sourceCollector.addSource(source);
    return { success: true, message: '源添加成功' };
  }

  @Delete('sources/:name')
  @ApiOperation({ summary: '删除直播源' })
  @ApiParam({ name: 'name', description: '源名称' })
  @ApiResponse({ status: 200, description: '删除成功' })
  removeSource(@Param('name') name: string) {
    const success = this.sourceCollector.removeSource(name);
    return { success, message: success ? '源删除成功' : '源不存在' };
  }

  @Put('sources/:name/toggle')
  @ApiOperation({ summary: '启用/禁用直播源' })
  @ApiParam({ name: 'name', description: '源名称' })
  @ApiQuery({ name: 'enabled', description: '是否启用', type: Boolean })
  @ApiResponse({ status: 200, description: '操作成功' })
  toggleSource(@Param('name') name: string, @Query('enabled') enabled: boolean) {
    const success = this.sourceCollector.toggleSource(name, enabled);
    return { success, message: success ? `源已${enabled ? '启用' : '禁用'}` : '源不存在' };
  }

  @Post('sources/collect')
  @ApiOperation({ summary: '从所有源收集频道' })
  @ApiResponse({ status: 200, description: '收集成功' })
  async collectFromAllSources() {
    return this.sourceCollector.collectFromAllSources();
  }

  @Post('sources/collect/:name')
  @ApiOperation({ summary: '从指定源收集频道' })
  @ApiParam({ name: 'name', description: '源名称' })
  @ApiResponse({ status: 200, description: '收集成功' })
  async collectFromSource(@Param('name') name: string) {
    const sources = this.sourceCollector.getSources();
    const source = sources.find(s => s.name === name);
    if (!source) {
      return { success: false, message: '源不存在' };
    }
    return this.sourceCollector.collectFromSource(source);
  }

  @Get('sources/stats')
  @Public()
  @ApiOperation({ summary: '获取收集统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCollectionStats() {
    return this.sourceCollector.getCollectionStats();
  }

  // ==================== 台标管理 ====================

  @Get('logos')
  @Public()
  @ApiOperation({ summary: '获取所有台标' })
  @ApiQuery({ name: 'category', description: '分类筛选', required: false })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getLogos(@Query('category') category?: string) {
    return this.logoService.findAll(category);
  }

  @Get('logos/search/:keyword')
  @Public()
  @ApiOperation({ summary: '搜索台标' })
  @ApiParam({ name: 'keyword', description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchLogos(@Param('keyword') keyword: string) {
    return this.logoService.search(keyword);
  }

  @Post('logos')
  @ApiOperation({ summary: '添加台标' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async createLogo(@Body() data: Record<string, unknown>) {
    return this.logoService.create(data);
  }

  @Put('logos/:id')
  @ApiOperation({ summary: '更新台标' })
  @ApiParam({ name: 'id', description: '台标ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateLogo(@Param('id', ParseIntPipe) id: number, @Body() data: Record<string, unknown>) {
    return this.logoService.update(id, data);
  }

  @Delete('logos/:id')
  @ApiOperation({ summary: '删除台标' })
  @ApiParam({ name: 'id', description: '台标ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async removeLogo(@Param('id', ParseIntPipe) id: number) {
    await this.logoService.remove(id);
    return { success: true, message: '台标删除成功' };
  }

  @Post('logos/init')
  @ApiOperation({ summary: '初始化预置台标' })
  @ApiResponse({ status: 200, description: '初始化成功' })
  async initLogos() {
    const count = await this.logoService.initPresetLogos();
    return { success: true, initializedCount: count };
  }

  @Post('logos/match')
  @ApiOperation({ summary: '自动匹配频道台标' })
  @ApiResponse({ status: 200, description: '匹配成功' })
  async matchLogos() {
    return this.logoService.matchLogosForChannels();
  }

  @Get('logos/stats')
  @Public()
  @ApiOperation({ summary: '获取台标统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getLogoStats() {
    return this.logoService.getStats();
  }

  // ==================== 频道详情（参数路由放最后） ====================

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '根据ID查找IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: IPTVChannel })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<IPTVChannel> {
    return await this.iptvService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: IPTVChannel })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIPTVChannelDto: UpdateIPTVChannelDto,
  ): Promise<IPTVChannel> {
    return await this.iptvService.update(id, updateIPTVChannelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.iptvService.remove(id);
  }

  @Put(':id/soft-delete')
  @ApiOperation({ summary: '软删除IPTV频道' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '软删除成功', type: IPTVChannel })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<IPTVChannel> {
    return await this.iptvService.softDelete(id);
  }

  @Put(':id/view')
  @Public()
  @ApiOperation({ summary: '增加观看次数' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '观看次数增加成功' })
  async incrementViewCount(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.iptvService.incrementViewCount(id);
  }

  @Get(':id/validate')
  @Public()
  @ApiOperation({ summary: '验证频道链接有效性' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async validateChannel(@Param('id', ParseIntPipe) id: number): Promise<{ isValid: boolean }> {
    const isValid = await this.iptvService.validateChannel(id);
    return { isValid };
  }

  @Get(':id/epg')
  @Public()
  @ApiOperation({ summary: '获取频道节目单' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiQuery({ name: 'days', description: '获取天数', required: false, type: Number })
  @ApiResponse({ status: 200, description: '节目单查询成功' })
  async getEpg(@Param('id', ParseIntPipe) id: number, @Query('days') days?: number) {
    return this.epgService.getChannelEpg(id, days || 7);
  }

  @Get(':id/epg/current')
  @Public()
  @ApiOperation({ summary: '获取频道当前节目' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCurrentProgram(@Param('id', ParseIntPipe) id: number) {
    return this.epgService.getCurrentProgram(id);
  }

  @Get(':id/epg/upcoming')
  @Public()
  @ApiOperation({ summary: '获取频道接下来的节目' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiQuery({ name: 'count', description: '节目数量', required: false, type: Number })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUpcomingPrograms(@Param('id', ParseIntPipe) id: number, @Query('count') count?: number) {
    return this.epgService.getUpcomingPrograms(id, count || 5);
  }

  @Post('quality/test/:id')
  @ApiOperation({ summary: '测试单个频道质量' })
  @ApiParam({ name: 'id', description: 'IPTV频道ID' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testChannelQuality(@Param('id', ParseIntPipe) id: number) {
    const channel = await this.iptvService.findById(id);
    return this.qualityTester.testChannel(channel);
  }

  // ==================== 辅助方法 ====================

  /**
   * 解析TXT格式（频道名,URL）
   */
  private parseTxtFormat(
    content: string,
    defaultGroup?: string,
  ): { name: string; url: string; group?: string }[] {
    const channels: { name: string; url: string; group?: string }[] = [];
    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    for (const line of lines) {
      if (line.startsWith('#')) continue;

      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const url = parts[1].trim();
        if (url.startsWith('http://') || url.startsWith('https://')) {
          channels.push({ name, url, group: defaultGroup });
        }
      }
    }

    return channels;
  }
}
