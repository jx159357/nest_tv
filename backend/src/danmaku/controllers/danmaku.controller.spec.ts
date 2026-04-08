import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DanmakuController } from './danmaku.controller';
import { AdminRoleGuard } from '../../admin/admin-role.guard';

describe('DanmakuController', () => {
  const danmakuService = {
    create: jest.fn(),
    getTrendAnalysis: jest.fn(),
    getUserLeaderboard: jest.fn(),
    getKeywordCloud: jest.fn(),
    getReportsSnapshot: jest.fn(),
    reportDanmaku: jest.fn(),
    getRealtimeRoomSummary: jest.fn(),
  };
  const danmakuGateway = {
    sendDanmaku: jest.fn(),
    getRoomInfo: jest.fn(),
    getRoomStats: jest.fn(),
  };
  const danmakuFilterRulesService = {
    getRules: jest.fn(),
    updateRules: jest.fn(),
    resetRules: jest.fn(),
  };
  const adminService = {
    logAction: jest.fn(),
  };

  let controller: DanmakuController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DanmakuController(
      danmakuService as never,
      danmakuGateway as never,
      danmakuFilterRulesService as never,
      adminService as never,
    );
  });

  it('creates danmaku and notifies realtime gateway state', async () => {
    danmakuService.create.mockResolvedValue({
      id: 12,
      text: '来了',
      videoId: 'video-1',
      mediaResourceId: 7,
    });

    await expect(
      controller.createDanmaku(
        {
          text: '来了',
          videoId: 'video-1',
          mediaResourceId: 7,
        },
        { id: 5 },
      ),
    ).resolves.toMatchObject({
      id: 12,
      text: '来了',
    });

    expect(danmakuService.create).toHaveBeenCalledWith({ text: '来了' }, 5, 7, 'video-1');
    expect(danmakuGateway.sendDanmaku).toHaveBeenCalledWith({
      videoId: 'video-1',
      userId: 5,
      danmakuId: 12,
    });
  });

  it('returns trend analysis from the danmaku service', async () => {
    danmakuService.getTrendAnalysis.mockResolvedValue({
      interval: 'hour',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-01T12:00:00.000Z',
      activeUsers: 3,
      stats: {
        uniqueUsers: 3,
        totalDanmaku: 6,
        scrollDanmaku: 4,
        topDanmaku: 1,
        bottomDanmaku: 1,
        highlightedDanmaku: 2,
        normalDanmaku: 4,
      },
      points: [
        {
          bucketStart: '2025-01-01T10:00:00.000Z',
          totalDanmaku: 4,
          highlightedDanmaku: 1,
          uniqueUsers: 2,
        },
      ],
    });

    await expect(
      controller.getDanmakuTrends({
        videoId: 'video-1',
        mediaResourceId: 7,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T12:00:00.000Z',
        interval: 'hour',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      mediaResourceId: 7,
      interval: 'hour',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-01T12:00:00.000Z',
      message: '当前返回基于已入库弹幕的时间趋势摘要。',
      activeUsers: 3,
      stats: {
        uniqueUsers: 3,
        totalDanmaku: 6,
        scrollDanmaku: 4,
        topDanmaku: 1,
        bottomDanmaku: 1,
        highlightedDanmaku: 2,
        normalDanmaku: 4,
      },
      points: [
        {
          bucketStart: '2025-01-01T10:00:00.000Z',
          totalDanmaku: 4,
          highlightedDanmaku: 1,
          uniqueUsers: 2,
        },
      ],
    });

    expect(danmakuService.getTrendAnalysis).toHaveBeenCalledWith({
      videoId: 'video-1',
      mediaResourceId: 7,
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-01T12:00:00.000Z',
      interval: 'hour',
    });
  });

  it('returns a user leaderboard from the danmaku service', async () => {
    danmakuService.getUserLeaderboard.mockResolvedValue([
      {
        userId: 2,
        username: 'demo-user',
        nickname: 'Demo',
        count: 5,
        highlightedCount: 2,
        lastCreatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    await expect(
      controller.getDanmakuUserLeaderboard({
        mediaResourceId: 11,
        limit: 10,
        period: 'week',
      }),
    ).resolves.toEqual({
      videoId: undefined,
      mediaResourceId: 11,
      limit: 10,
      period: 'week',
      message: '当前返回基于已入库弹幕的用户活跃排行榜。',
      leaderboard: [
        {
          userId: 2,
          username: 'demo-user',
          nickname: 'Demo',
          count: 5,
          highlightedCount: 2,
          lastCreatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(danmakuService.getUserLeaderboard).toHaveBeenCalledWith({
      videoId: undefined,
      mediaResourceId: 11,
      limit: 10,
      period: 'week',
    });
  });

  it('returns a keyword cloud from the danmaku service', async () => {
    danmakuService.getKeywordCloud.mockResolvedValue(['氛围', '沙丘']);

    await expect(
      controller.getDanmakuKeywordCloud({
        videoId: 'video-9',
        minFrequency: 3,
        limit: 5,
      }),
    ).resolves.toEqual({
      videoId: 'video-9',
      mediaResourceId: undefined,
      minFrequency: 3,
      limit: 5,
      message: '当前返回基于已入库弹幕关键词聚合的词云结果。',
      keywords: ['氛围', '沙丘'],
    });

    expect(danmakuService.getKeywordCloud).toHaveBeenCalledWith({
      videoId: 'video-9',
      mediaResourceId: undefined,
      minFrequency: 3,
      limit: 5,
    });
  });

  it('returns type-specific danmaku suggestions from the service', async () => {
    danmakuService.getSuggestions = jest.fn().mockResolvedValue([
      {
        text: '太燃了',
        color: '#fff',
        type: 'scroll',
        priority: 1,
        score: 4,
      },
    ]);

    await expect(
      controller.getDanmakuSuggestions({
        mediaResourceId: 9,
        type: 'relevant',
        limit: 5,
      }),
    ).resolves.toEqual({
      videoId: undefined,
      mediaResourceId: 9,
      type: 'relevant',
      limit: 5,
      suggestions: [
        {
          text: '太燃了',
          color: '#fff',
          type: 'scroll',
          priority: 1,
          score: 4,
        },
      ],
    });

    expect(danmakuService.getSuggestions).toHaveBeenCalledWith({
      videoId: undefined,
      mediaResourceId: 9,
      type: 'relevant',
      limit: 5,
    });
  });

  it('returns realtime room info from gateway and persisted danmaku summary', async () => {
    danmakuGateway.getRoomInfo.mockReturnValue({
      videoId: 'video-1',
      onlineCount: 2,
      messageCount: 4,
      isActive: true,
      lastActivity: '2025-01-01T01:00:00.000Z',
    });
    danmakuService.getRealtimeRoomSummary.mockResolvedValue({
      totalDanmaku: 9,
      lastActivity: '2025-01-01T02:00:00.000Z',
    });

    await expect(controller.getRealtimeRoomInfo('video-1')).resolves.toEqual({
      videoId: 'video-1',
      onlineUsers: 2,
      messageCount: 9,
      isActive: true,
      lastActivity: '2025-01-01T01:00:00.000Z',
      message: '当前返回基于网关状态与已入库弹幕汇总的房间信息。',
    });
  });

  it('returns configured danmaku filter rules', () => {
    danmakuFilterRulesService.getRules.mockReturnValue({
      sensitiveWords: ['剧透'],
      spamPatterns: ['spam'],
      level: 'high',
      autoBlock: true,
    });

    expect(controller.getFilterRules()).toEqual({
      sensitiveWords: ['剧透'],
      spamPatterns: ['spam'],
      level: 'high',
      autoBlock: true,
      message: '当前返回内存态弹幕过滤规则快照。',
    });
  });

  it('updates danmaku filter rules through the rules service', () => {
    danmakuFilterRulesService.updateRules.mockReturnValue({
      sensitiveWords: ['广告'],
      spamPatterns: ['http'],
      level: 'low',
      autoBlock: false,
    });

    expect(
      controller.updateFilterRules({
        sensitiveWords: ['广告'],
        level: 'low',
      }),
    ).toEqual({
      success: true,
      message: '过滤规则已更新并已在当前服务进程内生效。',
      updatedRules: {
        sensitiveWords: ['广告'],
        spamPatterns: ['http'],
        level: 'low',
        autoBlock: false,
      },
    });
    expect(adminService.logAction).toHaveBeenCalledWith(
      'update',
      'danmaku_filter_rules',
      expect.objectContaining({ sensitiveWordCount: 1 }),
      1,
      undefined,
      'success',
      'Update danmaku filter rules',
    );
  });

  it('resets danmaku filter rules through the rules service', () => {
    danmakuFilterRulesService.resetRules = jest.fn().mockReturnValue({
      sensitiveWords: ['傻逼'],
      spamPatterns: ['http'],
      level: 'medium',
      autoBlock: false,
    });

    expect(controller.resetFilterRules()).toEqual({
      success: true,
      message: '过滤规则已重置为默认值。',
      updatedRules: {
        sensitiveWords: ['傻逼'],
        spamPatterns: ['http'],
        level: 'medium',
        autoBlock: false,
      },
    });
    expect(adminService.logAction).toHaveBeenCalledWith(
      'reset',
      'danmaku_filter_rules',
      expect.objectContaining({ sensitiveWordCount: 1 }),
      1,
      undefined,
      'success',
      'Reset danmaku filter rules',
    );
  });

  it('lists reported danmaku with a bounded limit', async () => {
    danmakuService.getReportedDanmaku = jest.fn().mockResolvedValue([
      {
        id: 3,
        text: '剧透了',
        videoId: 'video-1',
        userId: 9,
        reportCount: 2,
        status: 'reported',
        latestReason: '剧透',
        lastReportedAt: '2025-01-03T00:00:00.000Z',
      },
    ]);

    await expect(controller.listReportedDanmaku(200 as never)).resolves.toEqual({
      data: [
        {
          id: 3,
          text: '剧透了',
          videoId: 'video-1',
          userId: 9,
          reportCount: 2,
          status: 'reported',
          latestReason: '剧透',
          lastReportedAt: '2025-01-03T00:00:00.000Z',
        },
      ],
      limit: 50,
      message: '当前返回已被举报的弹幕列表快照。',
    });

    expect(danmakuService.getReportedDanmaku).toHaveBeenCalledWith(50);
  });

  it('moderates a reported danmaku through the service', async () => {
    danmakuService.moderateDanmaku = jest.fn().mockResolvedValue({
      id: 5,
      isActive: false,
      videoId: 'video-1',
      userId: 9,
      metadata: { moderationStatus: 'hidden' },
    });

    await expect(controller.moderateDanmaku(5, { action: 'hide' as never })).resolves.toEqual({
      success: true,
      message: '弹幕已隐藏。',
      danmaku: {
        id: 5,
        isActive: false,
        videoId: 'video-1',
        userId: 9,
        metadata: { moderationStatus: 'hidden' },
      },
    });
    expect(adminService.logAction).toHaveBeenCalledWith(
      'hide',
      'danmaku',
      expect.objectContaining({ danmakuId: 5, videoId: 'video-1' }),
      1,
      9,
      'success',
      'Moderate danmaku: hide',
    );
  });

  it('protects admin-only danmaku management endpoints with AdminRoleGuard', () => {
    const adminOnlyMethods = [
      'hardDeleteDanmaku',
      'cleanExpiredDanmaku',
      'setDanmakuHighlight',
      'getDanmakuReports',
      'getFilterRules',
      'updateFilterRules',
      'getHealthStatus',
    ] as const;

    adminOnlyMethods.forEach(methodName => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        DanmakuController.prototype[methodName],
      ) as Array<typeof AdminRoleGuard>;

      expect(guards).toContain(AdminRoleGuard);
    });
  });

  it('returns health status using gateway room stats', () => {
    danmakuGateway.getRoomStats.mockReturnValue({
      totalRooms: 2,
      totalUsers: 5,
      roomDetails: [
        { videoId: 'video-1', messageCount: 4 },
        { videoId: 'video-2', messageCount: 6 },
      ],
    });

    expect(controller.getHealthStatus()).toMatchObject({
      status: 'healthy',
      database: 'connected',
      websocket: 'active',
      performance: {
        activeConnections: 5,
        activeRooms: 2,
        totalMessages: 10,
      },
      message: '弹幕系统运行正常，当前监控 2 个活跃房间。',
    });
  });

  it('returns persisted danmaku reports', async () => {
    danmakuService.getReportsSnapshot.mockResolvedValue({
      danmakuId: 7,
      reports: [
        {
          reporterId: 3,
          reason: '垃圾信息',
          description: '重复刷屏',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T01:00:00.000Z',
          status: 'pending',
        },
      ],
      reportCount: 1,
      status: 'reported',
    });

    await expect(controller.getDanmakuReports(7)).resolves.toEqual({
      danmakuId: 7,
      reports: [
        {
          reporterId: 3,
          reason: '垃圾信息',
          description: '重复刷屏',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T01:00:00.000Z',
          status: 'pending',
        },
      ],
      reportCount: 1,
      status: 'reported',
      message: '当前返回已持久化的弹幕举报记录。',
    });
  });

  it('throws when loading reports for a missing danmaku', async () => {
    danmakuService.getReportsSnapshot.mockResolvedValue(null);

    await expect(controller.getDanmakuReports(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records a danmaku report for the current user', async () => {
    danmakuService.reportDanmaku.mockResolvedValue({
      danmakuId: 12,
      reports: [],
      reportCount: 2,
      status: 'reported',
    });

    await expect(
      controller.reportDanmaku(12, { reason: '剧透', description: '提前透露结局' }, { id: 8 }),
    ).resolves.toEqual({
      success: true,
      message: '已记录对弹幕 12 的举报请求，当前累计举报 2 条。',
      reportCount: 2,
    });

    expect(danmakuService.reportDanmaku).toHaveBeenCalledWith(12, 8, '剧透', '提前透露结局');
  });

  it('throws when reporting a missing danmaku', async () => {
    danmakuService.reportDanmaku.mockResolvedValue(null);

    await expect(
      controller.reportDanmaku(404, { reason: '垃圾信息' }, { id: 7 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
