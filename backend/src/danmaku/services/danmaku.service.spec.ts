import { DanmakuService } from './danmaku.service';
import { BadRequestException } from '@nestjs/common';

describe('DanmakuService', () => {
  const leaderboardQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const keywordCloudQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const trendQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const realtimeSummaryQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const danmakuRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  let service: DanmakuService;

  beforeEach(() => {
    jest.clearAllMocks();
    danmakuRepository.createQueryBuilder.mockReturnValue(leaderboardQueryBuilder);

    leaderboardQueryBuilder.leftJoin.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.select.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.where.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.andWhere.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.groupBy.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.addGroupBy.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.orderBy.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.addOrderBy.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.limit.mockReturnValue(leaderboardQueryBuilder);

    keywordCloudQueryBuilder.select.mockReturnValue(keywordCloudQueryBuilder);
    keywordCloudQueryBuilder.where.mockReturnValue(keywordCloudQueryBuilder);
    keywordCloudQueryBuilder.andWhere.mockReturnValue(keywordCloudQueryBuilder);

    trendQueryBuilder.select.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.addSelect.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.where.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.andWhere.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.orderBy.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.addOrderBy.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.take.mockReturnValue(trendQueryBuilder);

    realtimeSummaryQueryBuilder.select.mockReturnValue(realtimeSummaryQueryBuilder);
    realtimeSummaryQueryBuilder.addSelect.mockReturnValue(realtimeSummaryQueryBuilder);
    realtimeSummaryQueryBuilder.where.mockReturnValue(realtimeSummaryQueryBuilder);
    realtimeSummaryQueryBuilder.andWhere.mockReturnValue(realtimeSummaryQueryBuilder);

    service = new DanmakuService(danmakuRepository as never);
  });

  it('builds a danmaku user leaderboard from grouped repository rows', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(leaderboardQueryBuilder);
    leaderboardQueryBuilder.getRawMany.mockResolvedValue([
      {
        userId: '2',
        username: 'demo-user',
        nickname: 'Demo',
        count: '5',
        highlightedCount: '2',
        lastCreatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    const result = await service.getUserLeaderboard({
      videoId: 'video-1',
      limit: 10,
      period: 'week',
    });

    expect(leaderboardQueryBuilder.andWhere).toHaveBeenCalledWith('danmaku.videoId = :videoId', {
      videoId: 'video-1',
    });
    expect(leaderboardQueryBuilder.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      {
        userId: 2,
        username: 'demo-user',
        nickname: 'Demo',
        count: 5,
        highlightedCount: 2,
        lastCreatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('builds a keyword cloud from danmaku keyword filters', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(keywordCloudQueryBuilder);
    keywordCloudQueryBuilder.getMany.mockResolvedValue([
      {
        text: '沙丘真的好看',
        filters: { keywords: ['沙丘', '好看'] },
      },
      {
        text: '沙丘氛围感很强',
        filters: { keywords: ['沙丘', '氛围'] },
      },
      {
        text: '氛围很强',
        filters: { keywords: ['氛围'] },
      },
    ]);

    const result = await service.getKeywordCloud({
      mediaResourceId: 11,
      minFrequency: 2,
      limit: 5,
    });

    expect(keywordCloudQueryBuilder.andWhere).toHaveBeenCalledWith(
      'danmaku.mediaResourceId = :mediaResourceId',
      { mediaResourceId: 11 },
    );
    expect(result).toEqual(['氛围', '沙丘']);
  });

  it('builds danmaku trend points grouped by interval', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.getMany.mockResolvedValue([
      {
        createdAt: new Date('2025-01-01T10:10:00.000Z'),
        userId: 1,
        type: 'scroll',
        isHighlighted: false,
      },
      {
        createdAt: new Date('2025-01-01T10:35:00.000Z'),
        userId: 2,
        type: 'top',
        isHighlighted: true,
      },
      {
        createdAt: new Date('2025-01-01T11:05:00.000Z'),
        userId: 1,
        type: 'bottom',
        isHighlighted: false,
      },
    ]);

    const result = await service.getTrendAnalysis({
      videoId: 'video-1',
      interval: 'hour',
    });

    expect(trendQueryBuilder.andWhere).toHaveBeenCalledWith('danmaku.videoId = :videoId', {
      videoId: 'video-1',
    });
    expect(result.activeUsers).toBe(2);
    expect(result.stats.totalDanmaku).toBe(3);
    expect(result.stats.highlightedDanmaku).toBe(1);
    expect(result.points).toEqual([
      {
        bucketStart: '2025-01-01T10:00:00.000Z',
        totalDanmaku: 2,
        highlightedDanmaku: 1,
        uniqueUsers: 2,
      },
      {
        bucketStart: '2025-01-01T11:00:00.000Z',
        totalDanmaku: 1,
        highlightedDanmaku: 0,
        uniqueUsers: 1,
      },
    ]);
  });

  it('persists danmaku reports inside metadata and reuses the same reporter entry', async () => {
    danmakuRepository.findOne.mockResolvedValue({
      id: 7,
      isActive: true,
      metadata: {
        reports: [
          {
            reporterId: 3,
            reason: '剧透',
            createdAt: '2025-01-01T00:00:00.000Z',
            status: 'pending',
          },
        ],
      },
    });
    danmakuRepository.save.mockImplementation(item => Promise.resolve(item));

    const result = await service.reportDanmaku(7, 3, '垃圾信息', '重复刷屏');

    expect(result?.reportCount).toBe(1);
    expect(result?.status).toBe('reported');
    expect(result?.reports[0]).toMatchObject({
      reporterId: 3,
      reason: '垃圾信息',
      description: '重复刷屏',
      status: 'pending',
    });
    expect(danmakuRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns a persisted report snapshot for a danmaku', async () => {
    danmakuRepository.findOne.mockResolvedValue({
      id: 9,
      isActive: true,
      metadata: {
        reports: [
          {
            reporterId: 5,
            reason: '不友善内容',
            createdAt: '2025-01-02T00:00:00.000Z',
            status: 'pending',
          },
        ],
      },
    });

    const result = await service.getReportsSnapshot(9);

    expect(result).toEqual({
      danmakuId: 9,
      reports: [
        {
          reporterId: 5,
          reason: '不友善内容',
          createdAt: '2025-01-02T00:00:00.000Z',
          status: 'pending',
        },
      ],
      reportCount: 1,
      status: 'reported',
    });
  });

  it('returns realtime room summary from persisted danmaku rows', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(realtimeSummaryQueryBuilder);
    realtimeSummaryQueryBuilder.getRawOne.mockResolvedValue({
      totalDanmaku: '7',
      lastActivity: '2025-01-02T03:04:05.000Z',
    });

    const result = await service.getRealtimeRoomSummary('video-1');

    expect(realtimeSummaryQueryBuilder.where).toHaveBeenCalledWith('danmaku.videoId = :videoId', {
      videoId: 'video-1',
    });
    expect(result).toEqual({
      totalDanmaku: 7,
      lastActivity: '2025-01-02T03:04:05.000Z',
    });
  });

  it('builds recent danmaku suggestions ordered by recency and deduplicated by text', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.getMany.mockResolvedValue([
      {
        text: '来了',
        color: '#fff',
        type: 'scroll',
        priority: 1,
        createdAt: new Date(),
        isHighlighted: false,
      },
      {
        text: '来了',
        color: '#fff',
        type: 'scroll',
        priority: 2,
        createdAt: new Date(),
        isHighlighted: false,
      },
      {
        text: '太燃了',
        color: '#f00',
        type: 'top',
        priority: 1,
        createdAt: new Date(),
        isHighlighted: true,
      },
    ]);

    const result = await service.getSuggestions({ type: 'recent', limit: 5, videoId: 'video-1' });

    expect(trendQueryBuilder.andWhere).toHaveBeenCalledWith('danmaku.videoId = :videoId', {
      videoId: 'video-1',
    });
    expect(result).toHaveLength(2);
    expect(result.map(item => item.text)).toEqual(['来了', '太燃了']);
  });

  it('builds relevant danmaku suggestions using keyword density and highlight weight', async () => {
    danmakuRepository.createQueryBuilder.mockReturnValue(trendQueryBuilder);
    trendQueryBuilder.getMany.mockResolvedValue([
      {
        text: '沙丘来了',
        color: '#fff',
        type: 'scroll',
        priority: 1,
        isHighlighted: true,
        filters: { keywords: ['沙丘', '来了'] },
      },
      {
        text: '沙丘氛围拉满',
        color: '#0ff',
        type: 'top',
        priority: 2,
        isHighlighted: false,
        filters: { keywords: ['沙丘', '氛围'] },
      },
    ]);

    const result = await service.getSuggestions({ type: 'relevant', limit: 5, mediaResourceId: 9 });

    expect(result[0]?.text).toBe('沙丘来了');
    expect(result[0]?.score).toBeGreaterThan(result[1]?.score || 0);
  });

  it('lists reported danmaku sorted by report count and latest report time', async () => {
    danmakuRepository.find.mockResolvedValue([
      {
        id: 1,
        text: '剧透了',
        videoId: 'video-1',
        userId: 7,
        isActive: true,
        updatedAt: new Date('2025-01-03T00:00:00.000Z'),
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        metadata: {
          reports: [
            {
              reporterId: 1,
              reason: '剧透',
              createdAt: '2025-01-02T00:00:00.000Z',
              status: 'pending',
            },
            {
              reporterId: 2,
              reason: '不友善',
              createdAt: '2025-01-03T00:00:00.000Z',
              status: 'pending',
            },
          ],
        },
      },
      {
        id: 2,
        text: '广告来了',
        videoId: 'video-2',
        userId: 8,
        isActive: true,
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        metadata: {
          reports: [
            {
              reporterId: 3,
              reason: '广告',
              createdAt: '2025-01-02T00:00:00.000Z',
              status: 'pending',
            },
          ],
        },
      },
    ]);

    const result = await service.getReportedDanmaku(10);

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.reportCount).toBe(2);
    expect(result[0]?.latestReason).toBe('不友善');
  });

  it('moderates danmaku visibility and moderation status', async () => {
    const danmaku = {
      id: 7,
      isActive: true,
      metadata: {
        reports: [
          {
            reporterId: 1,
            reason: '剧透',
            createdAt: '2025-01-02T00:00:00.000Z',
            status: 'pending',
          },
        ],
      },
    };
    danmakuRepository.findOne.mockResolvedValue(danmaku);
    danmakuRepository.save.mockImplementation(item => Promise.resolve(item));

    const hidden = await service.moderateDanmaku(7, 'hide');
    expect(hidden?.isActive).toBe(false);
    expect(hidden?.metadata?.moderationStatus).toBe('hidden');

    const restored = await service.moderateDanmaku(7, 'restore');
    expect(restored?.isActive).toBe(true);
    expect(restored?.metadata?.moderationStatus).toBe('reported');
  });

  it('rejects a blank report reason before persisting metadata', async () => {
    danmakuRepository.findOne.mockResolvedValue({
      id: 13,
      isActive: true,
      metadata: {},
    });

    await expect(service.reportDanmaku(13, 6, '   ')).rejects.toBeInstanceOf(BadRequestException);
    expect(danmakuRepository.save).not.toHaveBeenCalled();
  });
});
