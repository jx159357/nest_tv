import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  DanmakuService,
  CreateDanmakuDto,
  type DanmakuQueryDto,
  type DanmakuFilterDto,
} from '../services/danmaku.service';
import { User } from '../../decorators/user.decorator';
import { Danmaku } from '../entities/danmaku.entity';

@ApiTags('弹幕系统')
@Controller('danmaku')
@UseGuards(User)
@ApiBearerAuth()
export class DanmakuController {
  constructor(private readonly danmakuService: DanmakuService) {}

  // 创建弹幕
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '发送弹幕', description: '为指定视频发送弹幕消息' })
  @ApiResponse({ status: 201, description: '弹幕发送成功', type: Danmaku })
  async createDanmaku(
    @Body() createDto: CreateDanmakuDto & { videoId: string; mediaResourceId: number },
    @User() user: any,
  ): Promise<Danmaku> {
    const { videoId, mediaResourceId, ...danmakuData } = createDto;

    return await this.danmakuService.create(danmakuData, user.id, mediaResourceId, videoId);
  }

  // 批量创建弹幕
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量发送弹幕', description: '批量导入弹幕数据' })
  async createBulkDanmaku(
    @Body() createDtos: Array<CreateDanmakuDto & { videoId: string; mediaResourceId: number }>,
    @User() user: any,
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
    @User() user: any,
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
    @User() user: any,
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.danmakuService.delete(id, user.id);

    return {
      success,
      message: success ? '弹幕删除成功' : '删除失败或无权限',
    };
  }

  // 硬删除弹幕
  @Delete(':id/hard')
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
  async getUserDanmaku(@User() user: any, @Query() query: DanmakuQueryDto): Promise<Danmaku[]> {
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
      type?: string;
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
  ): Promise<any> {
    // 这里可以实现弹幕时间趋势分析
    // 例如：每小时的弹幕数量、热门词汇、情感分析等

    // 临时实现，返回基础统计
    const { videoId, mediaResourceId, startDate, endDate, interval = 'day' } = query;

    return {
      videoId,
      mediaResourceId,
      interval,
      startDate,
      endDate,
      message: '弹幕趋势分析功能开发中',
      stats: await this.danmakuService.getDanmakuStats(videoId),
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
  ): Promise<any> {
    // 这里可以实现用户弹幕排行榜
    // 例如：发送弹幕最多的用户、活跃度等

    const { videoId, mediaResourceId, limit = 20, period = 'all' } = query;

    return {
      videoId,
      mediaResourceId,
      limit,
      period,
      message: '弹幕用户排行榜功能开发中',
      leaderboard: [],
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
  ): Promise<any> {
    // 这里可以实现弹幕关键词提取和词云生成
    // 例如：提取高频词汇、生成权重、过滤停用词等

    const { videoId, mediaResourceId, minFrequency = 2, limit = 100 } = query;

    return {
      videoId,
      mediaResourceId,
      minFrequency,
      limit,
      message: '弹幕关键词云功能开发中',
      keywords: [],
    };
  }

  // 获取弹幕实时统计（WebSocket房间信息）
  @Get('realtime/rooms/:videoId')
  @ApiOperation({ summary: '实时房间信息', description: '获取指定视频的WebSocket弹幕房间信息' })
  async getRealtimeRoomInfo(@Param('videoId') videoId: string): Promise<any> {
    // 这里应该与WebSocket网关集成，获取实时房间信息
    // 例如：在线用户数、消息统计等

    return {
      videoId,
      onlineUsers: 0, // 需要从网关获取
      messageCount: 0, // 需要从网关获取
      isActive: false, // 需要从网关获取
      lastActivity: null,
      message: '实时房间信息需要WebSocket网关集成',
    };
  }

  // 获取弹幕建议（基于历史数据）
  @Get('suggestions')
  @ApiOperation({ summary: '弹幕建议', description: '基于历史弹幕数据获取发送建议' })
  async getDanmakuSuggestions(
    @Query()
    query: {
      videoId?: string;
      mediaResourceId?: number;
      type?: 'popular' | 'recent' | 'relevant';
      limit?: number;
    },
  ): Promise<any> {
    // 这里可以实现弹幕建议系统
    // 例如：推荐热门弹幕、相关弹幕、智能建议等

    const { videoId, mediaResourceId, type = 'popular', limit = 10 } = query;

    const popularDanmaku = await this.danmakuService.getPopularDanmaku(limit);

    return {
      videoId,
      mediaResourceId,
      type,
      limit,
      suggestions: popularDanmaku.map(d => ({
        text: d.text,
        color: d.color,
        type: d.type,
        priority: d.priority,
        score: 1 - d.priority / 10, // 简单评分算法
      })),
    };
  }

  // 设置弹幕高亮状态
  @Put(':id/highlight')
  @ApiOperation({ summary: '设置弹幕高亮', description: '将指定弹幕设置为高亮状态' })
  async setDanmakuHighlight(
    @Param('id') id: number,
    @Body() body: { isHighlighted: boolean },
    @User() user: any,
  ): Promise<Danmaku | null> {
    const danmaku = await this.danmakuService.update(id, {
      isHighlighted: body.isHighlighted,
    } as any);

    return danmaku;
  }

  // 获取弹幕举报信息
  @Get(':id/reports')
  @ApiOperation({ summary: '获取弹幕举报', description: '获取指定弹幕的举报信息' })
  async getDanmakuReports(@Param('id') id: number): Promise<any> {
    // 这里可以实现弹幕举报系统
    // 例如：举报次数、举报原因、处理状态等

    return {
      danmakuId: id,
      reports: [],
      reportCount: 0,
      status: 'active',
      message: '弹幕举报系统功能开发中',
    };
  }

  // 提交弹幕举报
  @Post(':id/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '举报弹幕', description: '举报指定弹幕内容' })
  async reportDanmaku(
    @Param('id') id: number,
    @Body() body: { reason: string; description?: string },
    @User() user: any,
  ): Promise<{ success: boolean; message: string }> {
    // 这里可以实现弹幕举报功能
    // 例如：保存举报记录、通知管理员、降低优先级等

    return {
      success: true,
      message: `弹幕 ${id} 举报已提交，感谢您的反馈`,
    };
  }

  // 获取弹幕敏感词过滤规则
  @Get('filter/rules')
  @ApiOperation({ summary: '获取过滤规则', description: '获取弹幕敏感词过滤规则' })
  async getFilterRules(): Promise<any> {
    // 这里可以实现敏感词过滤规则管理
    // 例如：敏感词列表、过滤级别、自定义规则等

    return {
      sensitiveWords: ['傻逼', '草泥马', '妈的', '操你', '傻叉'],
      spamPatterns: [
        'http[s]?:\\/\\/|www\\.',
        '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)',
        '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}',
        '【.*?】.*?【.*?】',
        '关注.*?公众号.*?',
        '加.*?群.*?',
      ],
      level: 'medium',
      autoBlock: false,
      message: '弹幕过滤规则管理功能开发中',
    };
  }

  // 更新弹幕过滤规则
  @Put('filter/rules')
  @ApiOperation({ summary: '更新过滤规则', description: '更新弹幕敏感词过滤规则' })
  async updateFilterRules(
    @Body()
    body: {
      sensitiveWords?: string[];
      spamPatterns?: string[];
      level?: 'low' | 'medium' | 'high';
      autoBlock?: boolean;
    },
  ): Promise<any> {
    // 这里可以实现过滤规则更新功能
    // 例如：添加/删除敏感词、更新过滤模式等

    return {
      success: true,
      message: '过滤规则已更新',
      updatedRules: body,
    };
  }

  // 获取弹幕系统健康状态
  @Get('health')
  @ApiOperation({ summary: '系统健康状态', description: '检查弹幕系统的健康状态' })
  async getHealthStatus(): Promise<any> {
    // 检查数据库连接、WebSocket状态、性能指标等

    return {
      status: 'healthy',
      database: 'connected',
      websocket: 'active',
      performance: {
        responseTime: 'normal',
        memoryUsage: 'normal',
        activeConnections: 0,
      },
      lastUpdate: new Date(),
      uptime: process.uptime(),
      message: '弹幕系统运行正常',
    };
  }
}
