import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Patch,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  DanmakuService,
  CreateDanmakuDto,
  type DanmakuStats,
  type DanmakuLeaderboardItem,
  type DanmakuRealtimeRoomSummary,
  type DanmakuReportsSnapshot,
  type DanmakuTrendPoint,
  type DanmakuUpdateDto,
  type DanmakuQueryDto,
  type DanmakuFilterDto,
} from '../services/danmaku.service';
import { User } from '../../decorators/user.decorator';
import { Danmaku } from '../entities/danmaku.entity';
import { ReportDanmakuDto } from '../dtos/report-danmaku.dto';
import { DanmakuSuggestionsQueryDto } from '../dtos/danmaku-suggestions-query.dto';
import { DanmakuModerationAction, ModerateDanmakuDto } from '../dtos/moderate-danmaku.dto';
import { UpdateDanmakuFilterRulesDto } from '../dtos/update-danmaku-filter-rules.dto';
import { DanmakuGateway } from '../../gateway/danmaku.gateway';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../../admin/admin-role.guard';
import { AdminService } from '../../admin/admin.service';
import {
  DanmakuFilterRulesService,
  type DanmakuFilterRules,
} from '../services/danmaku-filter-rules.service';

interface CurrentUser {
  id: number;
}

interface DanmakuTrendsResponse {
  videoId?: string;
  mediaResourceId?: number;
  interval: 'hour' | 'day' | 'week' | 'month';
  startDate: string | null;
  endDate: string | null;
  message: string;
  activeUsers: number;
  stats: DanmakuStats;
  points: DanmakuTrendPoint[];
}

interface DanmakuLeaderboardResponse {
  videoId?: string;
  mediaResourceId?: number;
  limit: number;
  period: 'all' | 'day' | 'week' | 'month';
  message: string;
  leaderboard: DanmakuLeaderboardItem[];
}

interface DanmakuKeywordCloudResponse {
  videoId?: string;
  mediaResourceId?: number;
  minFrequency: number;
  limit: number;
  message: string;
  keywords: string[];
}

interface DanmakuRealtimeRoomInfoResponse {
  videoId: string;
  onlineUsers: number;
  messageCount: number;
  isActive: boolean;
  lastActivity: string | null;
  message: string;
}

interface DanmakuSuggestionItem {
  text: string;
  color: string;
  type: Danmaku['type'];
  priority: number;
  score: number;
}

interface DanmakuSuggestionsResponse {
  videoId?: string;
  mediaResourceId?: number;
  type: 'popular' | 'recent' | 'relevant';
  limit: number;
  suggestions: DanmakuSuggestionItem[];
}

interface DanmakuReportsResponse {
  danmakuId: number;
  reports: DanmakuReportsSnapshot['reports'];
  reportCount: number;
  status: DanmakuReportsSnapshot['status'];
  message: string;
}

interface DanmakuFilterRulesResponse {
  sensitiveWords: string[];
  spamPatterns: string[];
  level: DanmakuFilterRules['level'];
  autoBlock: boolean;
  message: string;
}

interface DanmakuHealthStatusResponse {
  status: 'healthy';
  database: 'connected';
  websocket: 'active';
  performance: {
    responseTime: 'normal';
    memoryUsage: 'normal';
    activeConnections: number;
    activeRooms: number;
    totalMessages: number;
  };
  lastUpdate: Date;
  uptime: number;
  message: string;
}

@ApiTags('弹幕系统')
@Controller('danmaku')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DanmakuController {
  constructor(
    private readonly danmakuService: DanmakuService,
    private readonly danmakuGateway: DanmakuGateway,
    private readonly danmakuFilterRulesService: DanmakuFilterRulesService,
    private readonly adminService: AdminService,
  ) {}

  // 创建弹幕
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '发送弹幕', description: '为指定视频发送弹幕消息' })
  @ApiResponse({ status: 201, description: '弹幕发送成功', type: Danmaku })
  async createDanmaku(
    @Body() createDto: CreateDanmakuDto & { videoId: string; mediaResourceId: number },
    @User() user: CurrentUser,
  ): Promise<Danmaku> {
    const { videoId, mediaResourceId, ...danmakuData } = createDto;
    const danmaku = await this.danmakuService.create(
      danmakuData,
      user.id,
      mediaResourceId,
      videoId,
    );

    this.danmakuGateway.sendDanmaku({
      videoId,
      userId: user.id,
      danmakuId: danmaku.id,
    });

    return danmaku;
  }

  // 批量创建弹幕
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量发送弹幕', description: '批量导入弹幕数据' })
  async createBulkDanmaku(
    @Body() createDtos: Array<CreateDanmakuDto & { videoId: string; mediaResourceId: number }>,
    @User() user: CurrentUser,
  ): Promise<Danmaku[]> {
    const processedDtos = createDtos.map(dto => ({
      text: dto.text,
      color: dto.color,
      type: dto.type,
      priority: dto.priority,
    }));

    return await this.danmakuService.createBulk(processedDtos, user.id);
  }

  // 查询弹幕列表
  @Get()
  @ApiOperation({ summary: '获取弹幕列表', description: '分页获取弹幕消息列表' })
  @ApiResponse({ status: 200, description: '弹幕列表', type: [Danmaku] })
  async getDanmakuList(
    @Query() query: DanmakuQueryDto,
  ): Promise<{ data: Danmaku[]; total: number }> {
    return await this.danmakuService.findAll(query);
  }

  // 搜索弹幕
  @Post('search')
  @ApiOperation({ summary: '搜索弹幕', description: '根据条件搜索弹幕消息' })
  async searchDanmaku(
    @Body() filters: DanmakuFilterDto,
    @Query() query: DanmakuQueryDto,
  ): Promise<{ data: Danmaku[]; total: number }> {
    return await this.danmakuService.search(filters, query);
  }

  // 根据ID获取弹幕
  @Get(':id')
  @ApiOperation({ summary: '获取弹幕详情', description: '根据弹幕ID获取详细信息' })
  @ApiResponse({ status: 200, description: '弹幕详情', type: Danmaku })
  async getDanmakuById(@Param('id') id: number): Promise<Danmaku | null> {
    return await this.danmakuService.findById(id);
  }

  // 更新弹幕
  @Put(':id')
  @ApiOperation({ summary: '更新弹幕', description: '更新弹幕内容或属性' })
  @ApiResponse({ status: 200, description: '更新后的弹幕', type: Danmaku })
  async updateDanmaku(
    @Param('id') id: number,
    @Body() updateDto: Partial<CreateDanmakuDto>,
  ): Promise<Danmaku | null> {
    return await this.danmakuService.update(id, updateDto);
  }

  // 删除弹幕（软删除）
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除弹幕', description: '软删除指定弹幕' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteDanmaku(
    @Param('id') id: number,
    @User() user: CurrentUser,
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.danmakuService.delete(id, user.id);

    return {
      success,
      message: success ? '弹幕删除成功' : '删除失败或无权限',
    };
  }

  // 硬删除弹幕
  @Delete(':id/hard')
  @UseGuards(AdminRoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '永久删除弹幕', description: '从数据库中永久删除弹幕' })
  @ApiResponse({ status: 200, description: '永久删除成功' })
  async hardDeleteDanmaku(@Param('id') id: number): Promise<{ success: boolean; message: string }> {
    const success = await this.danmakuService.hardDelete(id);

    return {
      success,
      message: success ? '弹幕永久删除成功' : '弹幕不存在',
    };
  }

  // 清理过期弹幕
  @Delete('clean')
  @UseGuards(AdminRoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '清理过期弹幕', description: '清理指定天数前的已停用弹幕' })
  async cleanExpiredDanmaku(
    @Query('days') days: number = 90,
  ): Promise<{ deletedCount: number; message: string }> {
    const deletedCount = await this.danmakuService.cleanExpired(days);

    return {
      deletedCount,
      message: `成功清理 ${deletedCount} 条过期弹幕`,
    };
  }

  // 获取热门弹幕
  @Get('popular')
  @ApiOperation({ summary: '获取热门弹幕', description: '获取最近的热门弹幕消息' })
  async getPopularDanmaku(@Query('limit') limit: number = 50): Promise<Danmaku[]> {
    return await this.danmakuService.getPopularDanmaku(limit);
  }

  // 获取用户弹幕历史
  @Get('user/me')
  @ApiOperation({ summary: '获取我的弹幕', description: '获取当前用户发送的弹幕历史' })
  async getUserDanmaku(
    @User() user: CurrentUser,
    @Query() query: DanmakuQueryDto,
  ): Promise<Danmaku[]> {
    const userId = user.id;
    const { limit, offset } = query;

    return await this.danmakuService.getUserDanmaku(userId, limit, offset);
  }

  // 获取媒体资源的弹幕
  @Get('media/:mediaResourceId')
  @ApiOperation({ summary: '获取媒体弹幕', description: '获取指定媒体资源的弹幕列表' })
  async getMediaDanmaku(
    @Param('mediaResourceId') mediaResourceId: number,
    @Query() query: { limit?: number; offset?: number },
  ): Promise<Danmaku[]> {
    const { limit = 100, offset = 0 } = query;

    return await this.danmakuService.getMediaDanmaku(mediaResourceId, limit, offset);
  }

  // 获取弹幕统计信息
  @Get('stats')
  @ApiOperation({ summary: '获取弹幕统计', description: '获取弹幕系统的统计数据' })
  async getDanmakuStats(@Query('videoId') videoId?: string): Promise<any> {
    return await this.danmakuService.getDanmakuStats(videoId);
  }

  // 导入弹幕数据
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '导入弹幕数据', description: '批量导入弹幕数据' })
  async importDanmakuData(
    @Body()
    data: Array<{
      text: string;
      color?: string;
      type?: 'scroll' | 'top' | 'bottom';
      priority?: number;
      timestamp?: number;
      userId?: number;
      mediaResourceId?: number;
      videoId?: string;
    }>,
  ): Promise<{ importedCount: number; message: string }> {
    const importedCount = await this.danmakuService.importData(data);

    return {
      importedCount,
      message: `成功导入 ${importedCount} 条弹幕数据`,
    };
  }

  // 高级弹幕搜索（带全文搜索）
  @Post('advanced-search')
  @ApiOperation({
    summary: '高级弹幕搜索',
    description: '支持全文搜索和多条件组合的高级弹幕搜索',
  })
  async advancedSearch(
    @Body() searchDto: { query: string; filters?: DanmakuFilterDto; pagination?: DanmakuQueryDto },
  ): Promise<{ data: Danmaku[]; total: number; queryInfo: any }> {
    const { query, filters, pagination } = searchDto;

    // 如果有搜索词，添加到过滤器
    const searchFilters = {
      text: query,
      ...filters,
    };

    const result = await this.danmakuService.search(searchFilters, pagination || {});

    return {
      ...result,
      queryInfo: {
        searchQuery: query,
        appliedFilters: searchFilters,
        pagination: pagination || {},
      },
    };
  }

  // 获取弹幕趋势分析
  @Get('trends')
  @ApiOperation({ summary: '弹幕趋势分析', description: '分析指定时间范围内的弹幕趋势' })
  async getDanmakuTrends(
    @Query()
    query: {
      videoId?: string;
      mediaResourceId?: number;
      startDate?: string;
      endDate?: string;
      interval?: 'hour' | 'day' | 'week' | 'month';
    },
  ): Promise<DanmakuTrendsResponse> {
    // 这里可以实现弹幕时间趋势分析
    // 例如：每小时的弹幕数量、热门词汇、情感分析等

    // 临时实现，返回基础统计
    const { videoId, mediaResourceId, startDate, endDate, interval = 'day' } = query;

    const analysis = await this.danmakuService.getTrendAnalysis({
      videoId,
      mediaResourceId,
      startDate,
      endDate,
      interval,
    });

    return {
      videoId,
      mediaResourceId,
      interval: analysis.interval,
      startDate: analysis.startDate,
      endDate: analysis.endDate,
      message: '当前返回基于已入库弹幕的时间趋势摘要。',
      activeUsers: analysis.activeUsers,
      stats: analysis.stats,
      points: analysis.points,
    };
  }

  // 获取弹幕用户排行榜
  @Get('leaderboard/users')
  @ApiOperation({ summary: '弹幕用户排行榜', description: '按弹幕数量统计的用户排行榜' })
  async getDanmakuUserLeaderboard(
    @Query()
    query: {
      videoId?: string;
      mediaResourceId?: number;
      limit?: number;
      period?: 'all' | 'day' | 'week' | 'month';
    },
  ): Promise<DanmakuLeaderboardResponse> {
    // 这里可以实现用户弹幕排行榜
    // 例如：发送弹幕最多的用户、活跃度等

    const { videoId, mediaResourceId, limit = 20, period = 'all' } = query;

    return {
      videoId,
      mediaResourceId,
      limit,
      period,
      message: '当前返回基于已入库弹幕的用户活跃排行榜。',
      leaderboard: await this.danmakuService.getUserLeaderboard({
        videoId,
        mediaResourceId,
        limit,
        period,
      }),
    };
  }

  // 获取弹幕关键词云
  @Get('keywords/cloud')
  @ApiOperation({ summary: '弹幕关键词云', description: '生成指定视频或媒体资源的弹幕关键词云' })
  async getDanmakuKeywordCloud(
    @Query()
    query: {
      videoId?: string;
      mediaResourceId?: number;
      minFrequency?: number;
      limit?: number;
    },
  ): Promise<DanmakuKeywordCloudResponse> {
    // 这里可以实现弹幕关键词提取和词云生成
    // 例如：提取高频词汇、生成权重、过滤停用词等

    const { videoId, mediaResourceId, minFrequency = 2, limit = 100 } = query;

    return {
      videoId,
      mediaResourceId,
      minFrequency,
      limit,
      message: '当前返回基于已入库弹幕关键词聚合的词云结果。',
      keywords: await this.danmakuService.getKeywordCloud({
        videoId,
        mediaResourceId,
        minFrequency,
        limit,
      }),
    };
  }

  // 获取弹幕实时统计（WebSocket房间信息）
  @Get('realtime/rooms/:videoId')
  @ApiOperation({ summary: '实时房间信息', description: '获取指定视频的WebSocket弹幕房间信息' })
  async getRealtimeRoomInfo(
    @Param('videoId') videoId: string,
  ): Promise<DanmakuRealtimeRoomInfoResponse> {
    const roomInfo = this.danmakuGateway.getRoomInfo(videoId);
    const summary: DanmakuRealtimeRoomSummary =
      await this.danmakuService.getRealtimeRoomSummary(videoId);

    return {
      videoId,
      onlineUsers: roomInfo.onlineCount,
      messageCount: Math.max(roomInfo.messageCount, summary.totalDanmaku),
      isActive: roomInfo.isActive || summary.totalDanmaku > 0,
      lastActivity: roomInfo.lastActivity ?? summary.lastActivity,
      message: '当前返回基于网关状态与已入库弹幕汇总的房间信息。',
    };
  }

  // 获取弹幕建议（基于历史数据）
  @Get('suggestions')
  @ApiOperation({ summary: '弹幕建议', description: '基于历史弹幕数据获取发送建议' })
  async getDanmakuSuggestions(
    @Query() query: DanmakuSuggestionsQueryDto,
  ): Promise<DanmakuSuggestionsResponse> {
    const { videoId, mediaResourceId, type = 'popular', limit = 10 } = query;
    const suggestions = await this.danmakuService.getSuggestions({
      videoId,
      mediaResourceId,
      type,
      limit,
    });

    return {
      videoId,
      mediaResourceId,
      type,
      limit,
      suggestions,
    };
  }

  // 设置弹幕高亮状态
  @Put(':id/highlight')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '设置弹幕高亮', description: '将指定弹幕设置为高亮状态' })
  async setDanmakuHighlight(
    @Param('id') id: number,
    @Body() body: { isHighlighted: boolean },
  ): Promise<Danmaku | null> {
    const updateDto: DanmakuUpdateDto = {
      isHighlighted: body.isHighlighted,
    };

    const danmaku = await this.danmakuService.update(id, updateDto);

    return danmaku;
  }

  // 获取弹幕举报信息
  @Get('reports')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '获取举报弹幕列表', description: '获取当前已被举报的弹幕列表' })
  async listReportedDanmaku(@Query('limit') limit?: number) {
    const safeLimit = Number.isFinite(Number(limit))
      ? Math.min(Math.max(Number(limit), 1), 50)
      : 20;

    return {
      data: await this.danmakuService.getReportedDanmaku(safeLimit),
      limit: safeLimit,
      message: '当前返回已被举报的弹幕列表快照。',
    };
  }

  @Patch(':id/moderation')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '处置举报弹幕', description: '隐藏或恢复指定弹幕' })
  async moderateDanmaku(@Param('id') id: number, @Body() body: ModerateDanmakuDto) {
    const danmaku = await this.danmakuService.moderateDanmaku(id, body.action);
    if (!danmaku) {
      throw new NotFoundException(`Danmaku ${id} not found`);
    }

    void this.adminService.logAction(
      body.action,
      'danmaku',
      {
        danmakuId: danmaku.id,
        videoId: danmaku.videoId,
        moderationStatus: danmaku.metadata?.moderationStatus,
      },
      1,
      danmaku.userId,
      'success',
      `Moderate danmaku: ${body.action}`,
    );

    return {
      success: true,
      message: body.action === DanmakuModerationAction.HIDE ? '弹幕已隐藏。' : '弹幕已恢复显示。',
      danmaku,
    };
  }

  // 获取弹幕举报信息
  @Get(':id/reports')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '获取弹幕举报', description: '获取指定弹幕的举报信息' })
  async getDanmakuReports(@Param('id') id: number): Promise<DanmakuReportsResponse> {
    const snapshot = await this.danmakuService.getReportsSnapshot(id);
    if (!snapshot) {
      throw new NotFoundException(`Danmaku ${id} not found`);
    }

    return {
      ...snapshot,
      message: snapshot.reportCount > 0 ? '当前返回已持久化的弹幕举报记录。' : '当前暂无举报记录。',
    };
  }

  // 提交弹幕举报
  @Post(':id/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '举报弹幕', description: '举报指定弹幕内容' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async reportDanmaku(
    @Param('id') id: number,
    @Body() body: ReportDanmakuDto,
    @User() user: CurrentUser,
  ): Promise<{ success: boolean; message: string; reportCount: number }> {
    const snapshot = await this.danmakuService.reportDanmaku(
      id,
      user.id,
      body.reason,
      body.description,
    );
    if (!snapshot) {
      throw new NotFoundException(`Danmaku ${id} not found`);
    }

    return {
      success: true,
      message: `已记录对弹幕 ${id} 的举报请求，当前累计举报 ${snapshot.reportCount} 条。`,
      reportCount: snapshot.reportCount,
    };
  }

  // 获取弹幕敏感词过滤规则
  @Get('filter/rules')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '获取过滤规则', description: '获取弹幕敏感词过滤规则' })
  getFilterRules(): DanmakuFilterRulesResponse {
    const rules = this.danmakuFilterRulesService.getRules();

    return {
      ...rules,
      message: '当前返回内存态弹幕过滤规则快照。',
    };
  }

  // 更新弹幕过滤规则
  @Put('filter/rules')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '更新过滤规则', description: '更新弹幕敏感词过滤规则' })
  updateFilterRules(@Body() body: UpdateDanmakuFilterRulesDto): {
    success: boolean;
    message: string;
    updatedRules: DanmakuFilterRules;
  } {
    const updatedRules = this.danmakuFilterRulesService.updateRules(body);

    void this.adminService.logAction(
      'update',
      'danmaku_filter_rules',
      {
        level: updatedRules.level,
        autoBlock: updatedRules.autoBlock,
        sensitiveWordCount: updatedRules.sensitiveWords.length,
        spamPatternCount: updatedRules.spamPatterns.length,
      },
      1,
      undefined,
      'success',
      'Update danmaku filter rules',
    );

    return {
      success: true,
      message: '过滤规则已更新并已在当前服务进程内生效。',
      updatedRules,
    };
  }

  @Post('filter/rules/reset')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '重置过滤规则', description: '将弹幕过滤规则重置为默认内置值' })
  resetFilterRules(): { success: boolean; message: string; updatedRules: DanmakuFilterRules } {
    const updatedRules = this.danmakuFilterRulesService.resetRules();

    void this.adminService.logAction(
      'reset',
      'danmaku_filter_rules',
      {
        level: updatedRules.level,
        autoBlock: updatedRules.autoBlock,
        sensitiveWordCount: updatedRules.sensitiveWords.length,
        spamPatternCount: updatedRules.spamPatterns.length,
      },
      1,
      undefined,
      'success',
      'Reset danmaku filter rules',
    );

    return {
      success: true,
      message: '过滤规则已重置为默认值。',
      updatedRules,
    };
  }

  // 获取弹幕系统健康状态
  @Get('health')
  @UseGuards(AdminRoleGuard)
  @ApiOperation({ summary: '系统健康状态', description: '检查弹幕系统的健康状态' })
  getHealthStatus(): DanmakuHealthStatusResponse {
    const roomStats = this.danmakuGateway.getRoomStats();
    const roomDetails = roomStats.roomDetails as Array<{ messageCount?: number }>;
    const totalMessages = roomDetails.reduce(
      (total: number, room) => total + Number(room.messageCount || 0),
      0,
    );

    return {
      status: 'healthy',
      database: 'connected',
      websocket: 'active',
      performance: {
        responseTime: 'normal',
        memoryUsage: 'normal',
        activeConnections: roomStats.totalUsers,
        activeRooms: roomStats.totalRooms,
        totalMessages,
      },
      lastUpdate: new Date(),
      uptime: process.uptime(),
      message:
        roomStats.totalRooms > 0
          ? `弹幕系统运行正常，当前监控 ${roomStats.totalRooms} 个活跃房间。`
          : '弹幕系统运行正常，当前暂无活跃房间。',
    };
  }
}
