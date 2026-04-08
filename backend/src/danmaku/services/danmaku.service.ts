import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Danmaku,
  type DanmakuMetadata,
  type DanmakuReportRecord,
} from '../entities/danmaku.entity';

export interface CreateDanmakuDto {
  text: string;
  color?: string;
  type?: 'scroll' | 'top' | 'bottom';
  priority?: number;
}

export type DanmakuUpdateDto = Partial<CreateDanmakuDto> & {
  isHighlighted?: boolean;
};

export interface DanmakuQueryDto {
  videoId?: string;
  mediaResourceId?: number;
  userId?: number;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  sort?: 'ASC' | 'DESC';
  sortBy?: 'createdAt' | 'priority' | 'id';
}

export interface DanmakuFilterDto {
  text?: string;
  videoId?: string;
  mediaResourceId?: number;
  userId?: number;
  color?: string;
  type?: string;
  priority?: number;
  isHighlighted?: boolean;
  isActive?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  customFilters?: {
    containsSensitive?: boolean;
    containsSpam?: boolean;
    containsEmojis?: boolean;
  };
}

interface DanmakuContentAnalysis {
  containsSensitive: boolean;
  containsSpam: boolean;
  containsEmojis: boolean;
  keywords: string[];
}

interface DanmakuStatsRaw {
  uniqueUsers?: string;
  totalDanmaku?: string;
  scrollDanmaku?: string;
  topDanmaku?: string;
  bottomDanmaku?: string;
  highlightedDanmaku?: string;
  normalDanmaku?: string;
}

export interface DanmakuStats {
  uniqueUsers: number;
  totalDanmaku: number;
  scrollDanmaku: number;
  topDanmaku: number;
  bottomDanmaku: number;
  highlightedDanmaku: number;
  normalDanmaku: number;
}

export interface DanmakuLeaderboardItem {
  userId: number;
  username: string | null;
  nickname: string | null;
  count: number;
  highlightedCount: number;
  lastCreatedAt: string | null;
}

export interface DanmakuTrendPoint {
  bucketStart: string;
  totalDanmaku: number;
  highlightedDanmaku: number;
  uniqueUsers: number;
}

export interface DanmakuTrendAnalysis {
  interval: 'hour' | 'day' | 'week' | 'month';
  startDate: string | null;
  endDate: string | null;
  activeUsers: number;
  stats: DanmakuStats;
  points: DanmakuTrendPoint[];
}

export interface DanmakuReportsSnapshot {
  danmakuId: number;
  reports: DanmakuReportRecord[];
  reportCount: number;
  status: 'active' | 'reported' | 'hidden';
}

export interface DanmakuSuggestionRecord {
  text: string;
  color: string;
  type: Danmaku['type'];
  priority: number;
  score: number;
}

export interface ReportedDanmakuRecord {
  id: number;
  text: string;
  videoId: string;
  userId: number;
  reportCount: number;
  status: 'active' | 'reported' | 'hidden';
  latestReason: string | null;
  lastReportedAt: string | null;
}

export interface DanmakuRealtimeRoomSummary {
  totalDanmaku: number;
  lastActivity: string | null;
}

interface ImportedDanmakuItem {
  id?: string;
  text?: string;
  color?: string;
  type?: 'scroll' | 'top' | 'bottom';
  priority?: number;
  isHighlighted?: boolean;
  timestamp?: number;
  userAgent?: string;
  userId?: number;
  mediaResourceId?: number;
  videoId?: string;
}

interface DanmakuLeaderboardRaw {
  userId?: string;
  username?: string | null;
  nickname?: string | null;
  count?: string;
  highlightedCount?: string;
  lastCreatedAt?: Date | string | null;
}

@Injectable()
export class DanmakuService {
  private readonly logger = new Logger(DanmakuService.name);

  constructor(
    @InjectRepository(Danmaku)
    private readonly danmakuRepository: Repository<Danmaku>,
  ) {}

  // 创建弹幕
  async create(
    createDto: CreateDanmakuDto,
    userId: number,
    mediaResourceId: number,
    videoId: string,
  ): Promise<Danmaku> {
    const danmaku = this.danmakuRepository.create({
      danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: this.filterText(createDto.text),
      color: createDto.color || '#FFFFFF',
      type: createDto.type || 'scroll',
      priority: createDto.priority || 1,
      isHighlighted: false,
      isActive: true,
      filters: this.analyzeContent(createDto.text),
      metadata: {
        timestamp: Date.now(),
        userAgent: 'server-generated',
      },
      userId,
      mediaResourceId,
      videoId,
    });

    return await this.danmakuRepository.save(danmaku);
  }

  // 批量创建弹幕（用于导入）
  async createBulk(createDtos: CreateDanmakuDto[], userId: number): Promise<Danmaku[]> {
    const danmakuEntities = createDtos.map(dto => ({
      danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: this.filterText(dto.text),
      color: dto.color || '#FFFFFF',
      type: dto.type || 'scroll',
      priority: dto.priority || 1,
      isHighlighted: false,
      isActive: true,
      filters: this.analyzeContent(dto.text),
      metadata: {
        timestamp: Date.now(),
        userAgent: 'bulk-import',
      },
      userId,
      // 需要从dto中提取mediaResourceId和videoId
      mediaResourceId: 0, // 临时值
      videoId: '', // 临时值
    }));

    return await this.danmakuRepository.save(danmakuEntities);
  }

  // 查询弹幕
  async findAll(queryDto: DanmakuQueryDto = {}): Promise<{ data: Danmaku[]; total: number }> {
    const {
      videoId,
      mediaResourceId,
      userId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      isActive = true,
      sort = 'DESC',
      sortBy = 'createdAt',
    } = queryDto;

    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .leftJoinAndSelect('danmaku.user', 'user')
      .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource');

    // 条件过滤
    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (userId) {
      queryBuilder.andWhere('danmaku.userId = :userId', { userId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive });
    }

    // 日期范围过滤
    if (startDate && endDate) {
      queryBuilder.andWhere('danmaku.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('danmaku.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('danmaku.createdAt <= :endDate', { endDate });
    }

    // 排序和分页
    queryBuilder.orderBy(`danmaku.${sortBy}`, sort).skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  // 高级搜索
  async search(
    filters: DanmakuFilterDto,
    queryDto: DanmakuQueryDto = {},
  ): Promise<{ data: Danmaku[]; total: number }> {
    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .leftJoinAndSelect('danmaku.user', 'user')
      .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource');

    // 应用基础查询条件
    this.applyFilters(queryBuilder, filters);

    // 应用查询参数
    this.applyQueryParams(queryBuilder, queryDto);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  // 根据ID查找弹幕
  async findById(id: number): Promise<Danmaku | null> {
    return await this.danmakuRepository.findOne({
      where: { id },
      relations: ['user', 'mediaResource'],
    });
  }

  // 更新弹幕
  async update(id: number, updateDto: DanmakuUpdateDto): Promise<Danmaku | null> {
    const danmaku = await this.findById(id);
    if (!danmaku) {
      this.logger.warn(`弹幕未找到: ${id}`);
      return null;
    }

    // 如果更新文本，重新分析内容
    if (updateDto.text) {
      updateDto.text = this.filterText(updateDto.text);
      danmaku.filters = this.analyzeContent(updateDto.text);
    }

    Object.assign(danmaku, updateDto);

    return await this.danmakuRepository.save(danmaku);
  }

  // 删除弹幕（软删除）
  async delete(id: number, userId?: number): Promise<boolean> {
    const danmaku = await this.findById(id);
    if (!danmaku) {
      this.logger.warn(`弹幕未找到: ${id}`);
      return false;
    }

    // 权限检查：只有发送者或管理员可以删除
    if (userId && danmaku.userId !== userId) {
      this.logger.warn(`用户 ${userId} 无权限删除弹幕 ${id}`);
      return false;
    }

    danmaku.isActive = false;
    await this.danmakuRepository.save(danmaku);

    return true;
  }

  // 硬删除
  async hardDelete(id: number): Promise<boolean> {
    const result = await this.danmakuRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  // 清理过期弹幕
  async cleanExpired(daysOld = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.danmakuRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isActive = false') // 只删除已停用的过期弹幕
      .execute();

    return result.affected || 0;
  }

  // 获取热门弹幕
  async getPopularDanmaku(limit = 50): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { isActive: true },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      relations: ['user', 'mediaResource'],
    });
  }

  // 获取用户弹幕历史
  async getUserDanmaku(userId: number, limit = 50, offset = 0): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { userId, isActive: true },
      order: {
        createdAt: 'DESC',
      },
      skip: offset,
      take: limit,
      relations: ['mediaResource'],
    });
  }

  // 获取媒体资源弹幕
  async getMediaDanmaku(mediaResourceId: number, limit = 100, offset = 0): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { mediaResourceId, isActive: true },
      order: {
        createdAt: 'ASC', // 按时间正序排列，用于播放时显示
      },
      skip: offset,
      take: limit,
      relations: ['user'],
    });
  }

  // 统计弹幕数量
  async getDanmakuStats(videoId?: string): Promise<DanmakuStats> {
    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select([
        'COUNT(DISTINCT userId) as uniqueUsers',
        'COUNT(*) as totalDanmaku',
        'COUNT(CASE WHEN type = :scroll THEN 1 END) as scrollDanmaku',
        'COUNT(CASE WHEN type = :top THEN 1 END) as topDanmaku',
        'COUNT(CASE WHEN type = :bottom THEN 1 END) as bottomDanmaku',
        'COUNT(CASE WHEN isHighlighted = true THEN 1 END) as highlightedDanmaku',
        'COUNT(CASE WHEN isHighlighted = false THEN 1 END) as normalDanmaku',
      ])
      .where('isActive = true', { isActive: true });

    if (videoId) {
      queryBuilder.andWhere('videoId = :videoId', { videoId });
    }

    const stats = await queryBuilder.getRawOne<DanmakuStatsRaw>();

    return {
      uniqueUsers: this.parseCount(stats?.uniqueUsers),
      totalDanmaku: this.parseCount(stats?.totalDanmaku),
      scrollDanmaku: this.parseCount(stats?.scrollDanmaku),
      topDanmaku: this.parseCount(stats?.topDanmaku),
      bottomDanmaku: this.parseCount(stats?.bottomDanmaku),
      highlightedDanmaku: this.parseCount(stats?.highlightedDanmaku),
      normalDanmaku: this.parseCount(stats?.normalDanmaku),
    };
  }

  async getUserLeaderboard(options: {
    videoId?: string;
    mediaResourceId?: number;
    limit?: number;
    period?: 'all' | 'day' | 'week' | 'month';
  }): Promise<DanmakuLeaderboardItem[]> {
    const { videoId, mediaResourceId, limit = 20, period = 'all' } = options;

    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .leftJoin('danmaku.user', 'user')
      .select([
        'danmaku.userId as userId',
        'user.username as username',
        'user.nickname as nickname',
        'COUNT(*) as count',
        'SUM(CASE WHEN danmaku.isHighlighted = true THEN 1 ELSE 0 END) as highlightedCount',
        'MAX(danmaku.createdAt) as lastCreatedAt',
      ])
      .where('danmaku.isActive = :isActive', { isActive: true })
      .andWhere('danmaku.userId IS NOT NULL');

    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    const periodStart = this.getPeriodStart(period);
    if (periodStart) {
      queryBuilder.andWhere('danmaku.createdAt >= :periodStart', { periodStart });
    }

    const rows = await queryBuilder
      .groupBy('danmaku.userId')
      .addGroupBy('user.username')
      .addGroupBy('user.nickname')
      .orderBy('count', 'DESC')
      .addOrderBy('highlightedCount', 'DESC')
      .addOrderBy('lastCreatedAt', 'DESC')
      .limit(limit)
      .getRawMany<DanmakuLeaderboardRaw>();

    return rows.map(row => ({
      userId: this.parseCount(row.userId),
      username: row.username ?? null,
      nickname: row.nickname ?? null,
      count: this.parseCount(row.count),
      highlightedCount: this.parseCount(row.highlightedCount),
      lastCreatedAt: row.lastCreatedAt ? new Date(row.lastCreatedAt).toISOString() : null,
    }));
  }

  async getKeywordCloud(options: {
    videoId?: string;
    mediaResourceId?: number;
    minFrequency?: number;
    limit?: number;
  }): Promise<string[]> {
    const { videoId, mediaResourceId, minFrequency = 2, limit = 100 } = options;

    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select(['danmaku.text', 'danmaku.filters'])
      .where('danmaku.isActive = :isActive', { isActive: true });

    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    const danmakuItems = await queryBuilder.getMany();
    const counts = new Map<string, number>();

    danmakuItems.forEach(item => {
      const derivedKeywords =
        Array.isArray(item.filters?.keywords) && item.filters.keywords.length > 0
          ? item.filters.keywords
          : this.analyzeContent(item.text).keywords;

      derivedKeywords
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length >= 2)
        .forEach(keyword => {
          counts.set(keyword, (counts.get(keyword) || 0) + 1);
        });
    });

    return [...counts.entries()]
      .filter(([, count]) => count >= minFrequency)
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0], 'zh-CN');
      })
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  async getTrendAnalysis(options: {
    videoId?: string;
    mediaResourceId?: number;
    startDate?: string;
    endDate?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<DanmakuTrendAnalysis> {
    const { videoId, mediaResourceId, startDate, endDate, interval = 'day' } = options;

    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select(['danmaku.createdAt', 'danmaku.userId', 'danmaku.type', 'danmaku.isHighlighted'])
      .where('danmaku.isActive = :isActive', { isActive: true });

    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (startDate) {
      queryBuilder.andWhere('danmaku.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('danmaku.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    const danmakuItems = await queryBuilder.getMany();
    const activeUsers = new Set(danmakuItems.map(item => item.userId)).size;

    const stats: DanmakuStats = {
      uniqueUsers: activeUsers,
      totalDanmaku: danmakuItems.length,
      scrollDanmaku: danmakuItems.filter(item => item.type === 'scroll').length,
      topDanmaku: danmakuItems.filter(item => item.type === 'top').length,
      bottomDanmaku: danmakuItems.filter(item => item.type === 'bottom').length,
      highlightedDanmaku: danmakuItems.filter(item => item.isHighlighted).length,
      normalDanmaku: danmakuItems.filter(item => !item.isHighlighted).length,
    };

    const bucketMap = new Map<
      string,
      {
        totalDanmaku: number;
        highlightedDanmaku: number;
        users: Set<number>;
      }
    >();

    danmakuItems.forEach(item => {
      const bucketStart = this.getTrendBucketStart(item.createdAt, interval).toISOString();
      const currentBucket = bucketMap.get(bucketStart) ?? {
        totalDanmaku: 0,
        highlightedDanmaku: 0,
        users: new Set<number>(),
      };

      currentBucket.totalDanmaku += 1;
      if (item.isHighlighted) {
        currentBucket.highlightedDanmaku += 1;
      }
      currentBucket.users.add(item.userId);
      bucketMap.set(bucketStart, currentBucket);
    });

    const points = [...bucketMap.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([bucketStart, value]) => ({
        bucketStart,
        totalDanmaku: value.totalDanmaku,
        highlightedDanmaku: value.highlightedDanmaku,
        uniqueUsers: value.users.size,
      }));

    const parsedStartDate = startDate
      ? new Date(startDate).toISOString()
      : danmakuItems[0]?.createdAt
        ? this.getTrendBucketStart(danmakuItems[0].createdAt, interval).toISOString()
        : null;

    const parsedEndDate = endDate
      ? new Date(endDate).toISOString()
      : danmakuItems.length > 0
        ? this.getTrendBucketStart(
            danmakuItems[danmakuItems.length - 1].createdAt,
            interval,
          ).toISOString()
        : null;

    return {
      interval,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      activeUsers,
      stats,
      points,
    };
  }

  async getReportsSnapshot(id: number): Promise<DanmakuReportsSnapshot | null> {
    const danmaku = await this.findById(id);
    if (!danmaku) {
      return null;
    }

    const metadata = this.getMetadata(danmaku);
    const reports = metadata.reports ?? [];

    return {
      danmakuId: id,
      reports,
      reportCount: reports.length,
      status: this.getModerationStatus(danmaku, reports),
    };
  }

  async reportDanmaku(
    id: number,
    reporterId: number,
    reason: string,
    description?: string,
  ): Promise<DanmakuReportsSnapshot | null> {
    const danmaku = await this.findById(id);
    if (!danmaku) {
      return null;
    }

    const metadata = this.getMetadata(danmaku);
    const reports = [...(metadata.reports ?? [])];
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      throw new BadRequestException('举报原因不能为空');
    }

    const normalizedDescription = description?.trim() || undefined;
    const now = new Date().toISOString();

    const existingIndex = reports.findIndex(report => report.reporterId === reporterId);
    if (existingIndex >= 0) {
      reports[existingIndex] = {
        ...reports[existingIndex],
        reason: normalizedReason,
        description: normalizedDescription,
        updatedAt: now,
      };
    } else {
      reports.push({
        reporterId,
        reason: normalizedReason,
        description: normalizedDescription,
        createdAt: now,
        status: 'pending',
      });
    }

    danmaku.metadata = {
      ...metadata,
      reports,
      moderationStatus: reports.length > 0 ? 'reported' : 'active',
    };

    await this.danmakuRepository.save(danmaku);

    return {
      danmakuId: id,
      reports,
      reportCount: reports.length,
      status: this.getModerationStatus(danmaku, reports),
    };
  }

  async getRealtimeRoomSummary(videoId: string): Promise<DanmakuRealtimeRoomSummary> {
    const summary = await this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select('COUNT(*)', 'totalDanmaku')
      .addSelect('MAX(danmaku.createdAt)', 'lastActivity')
      .where('danmaku.videoId = :videoId', { videoId })
      .andWhere('danmaku.isActive = :isActive', { isActive: true })
      .getRawOne<{ totalDanmaku?: string; lastActivity?: Date | string | null }>();

    return {
      totalDanmaku: this.parseCount(summary?.totalDanmaku),
      lastActivity: summary?.lastActivity ? new Date(summary.lastActivity).toISOString() : null,
    };
  }

  async getSuggestions(options: {
    videoId?: string;
    mediaResourceId?: number;
    type?: 'popular' | 'recent' | 'relevant';
    limit?: number;
  }): Promise<DanmakuSuggestionRecord[]> {
    const { videoId, mediaResourceId, type = 'popular', limit = 10 } = options;

    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select([
        'danmaku.id',
        'danmaku.text',
        'danmaku.color',
        'danmaku.type',
        'danmaku.priority',
        'danmaku.isHighlighted',
        'danmaku.createdAt',
        'danmaku.filters',
      ])
      .where('danmaku.isActive = :isActive', { isActive: true });

    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (type === 'recent') {
      const recentDanmaku = await queryBuilder
        .orderBy('danmaku.createdAt', 'DESC')
        .take(limit * 3)
        .getMany();
      return this.buildSuggestionRecords(recentDanmaku, 'recent').slice(0, limit);
    }

    if (type === 'relevant') {
      const relevantDanmaku = await queryBuilder
        .orderBy('danmaku.createdAt', 'DESC')
        .addOrderBy('danmaku.isHighlighted', 'DESC')
        .take(limit * 5)
        .getMany();
      return this.buildRelevantSuggestionRecords(relevantDanmaku).slice(0, limit);
    }

    const popularDanmaku = await queryBuilder
      .orderBy('danmaku.isHighlighted', 'DESC')
      .addOrderBy('danmaku.createdAt', 'DESC')
      .take(limit * 4)
      .getMany();

    return this.buildSuggestionRecords(popularDanmaku, 'popular').slice(0, limit);
  }

  async getReportedDanmaku(limit = 20): Promise<ReportedDanmakuRecord[]> {
    const danmakuItems = await this.danmakuRepository.find({
      where: { isActive: true },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
      take: Math.max(limit * 4, limit),
    });

    const reportedItems: Array<ReportedDanmakuRecord | null> = danmakuItems.map(item => {
      const reports = item.metadata?.reports ?? [];
      if (reports.length === 0) {
        return null;
      }

      const latestReport = [...reports].sort((left, right) => {
        const leftTime = new Date(left.updatedAt || left.createdAt).getTime();
        const rightTime = new Date(right.updatedAt || right.createdAt).getTime();
        return rightTime - leftTime;
      })[0];

      return {
        id: item.id,
        text: item.text,
        videoId: item.videoId,
        userId: item.userId,
        reportCount: reports.length,
        status: this.getModerationStatus(item, reports),
        latestReason: latestReport?.reason ?? null,
        lastReportedAt: latestReport
          ? new Date(latestReport.updatedAt || latestReport.createdAt).toISOString()
          : null,
      };
    });

    return reportedItems
      .filter((item): item is ReportedDanmakuRecord => item !== null)
      .sort((left, right) => {
        if (right.reportCount !== left.reportCount) {
          return right.reportCount - left.reportCount;
        }

        return (
          new Date(right.lastReportedAt || 0).getTime() -
          new Date(left.lastReportedAt || 0).getTime()
        );
      })
      .slice(0, limit);
  }

  async moderateDanmaku(id: number, action: 'hide' | 'restore'): Promise<Danmaku | null> {
    const danmaku = await this.findById(id);
    if (!danmaku) {
      return null;
    }

    const metadata = this.getMetadata(danmaku);
    const reports = metadata.reports ?? [];

    danmaku.isActive = action === 'restore';
    danmaku.metadata = {
      ...metadata,
      moderationStatus: action === 'hide' ? 'hidden' : reports.length > 0 ? 'reported' : 'active',
    };

    return await this.danmakuRepository.save(danmaku);
  }

  // 应用查询过滤器
  private applyFilters(queryBuilder: SelectQueryBuilder<Danmaku>, filters: DanmakuFilterDto): void {
    if (filters.text) {
      queryBuilder.andWhere('danmaku.text LIKE :text', { text: `%${filters.text}%` });
    }

    if (filters.videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId: filters.videoId });
    }

    if (filters.mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', {
        mediaResourceId: filters.mediaResourceId,
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('danmaku.userId = :userId', { userId: filters.userId });
    }

    if (filters.color) {
      queryBuilder.andWhere('danmaku.color = :color', { color: filters.color });
    }

    if (filters.type) {
      queryBuilder.andWhere('danmaku.type = :type', { type: filters.type });
    }

    if (filters.priority !== undefined) {
      queryBuilder.andWhere('danmaku.priority = :priority', { priority: filters.priority });
    }

    if (filters.isHighlighted !== undefined) {
      queryBuilder.andWhere('danmaku.isHighlighted = :isHighlighted', {
        isHighlighted: filters.isHighlighted,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive: filters.isActive });
    }

    // 日期范围过滤
    if (filters.dateRange?.start && filters.dateRange?.end) {
      queryBuilder.andWhere('danmaku.createdAt BETWEEN :start AND :end', {
        start: filters.dateRange.start,
        end: filters.dateRange.end,
      });
    } else if (filters.dateRange?.start) {
      queryBuilder.andWhere('danmaku.createdAt >= :start', {
        start: filters.dateRange.start,
      });
    } else if (filters.dateRange?.end) {
      queryBuilder.andWhere('danmaku.createdAt <= :end', {
        end: filters.dateRange.end,
      });
    }

    // 内容过滤
    if (filters.customFilters?.containsSensitive) {
      queryBuilder.andWhere('danmaku.filters.containsSensitive = :containsSensitive', {
        containsSensitive: true,
      });
    }

    if (filters.customFilters?.containsSpam) {
      queryBuilder.andWhere('danmaku.filters.containsSpam = :containsSpam', {
        containsSpam: true,
      });
    }

    if (filters.customFilters?.containsEmojis) {
      queryBuilder.andWhere('danmaku.filters.containsEmojis = :containsEmojis', {
        containsEmojis: true,
      });
    }
  }

  // 应用查询参数
  private applyQueryParams(
    queryBuilder: SelectQueryBuilder<Danmaku>,
    queryDto: DanmakuQueryDto,
  ): void {
    const { limit = 50, offset = 0, sort = 'DESC', sortBy = 'createdAt' } = queryDto;

    queryBuilder.orderBy(`danmaku.${sortBy}`, sort).skip(offset).take(limit);
  }

  // 文本过滤和清理
  private filterText(text: string): string {
    let filtered = text.trim();

    // 移除HTML标签
    filtered = filtered.replace(/<[^>]*>/g, '');

    // 移除脚本标签
    filtered = filtered.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // 移除样式标签
    filtered = filtered.replace(/<style[^>]*>.*?<\/style>/gi, '');

    // 截断超长文本
    filtered = filtered.length > 200 ? filtered.substring(0, 200) + '...' : filtered;

    // 替换行符为空格
    filtered = filtered.replace(/\s+/g, ' ');

    return filtered;
  }

  // 内容分析（用于自动过滤）
  private analyzeContent(text: string): DanmakuContentAnalysis {
    const filters: DanmakuContentAnalysis = {
      containsSensitive: false,
      containsSpam: false,
      containsEmojis: false,
      keywords: [],
    };

    // 敏感词检测（简单示例）
    const sensitiveWords = ['傻逼', '草泥马', '妈的', '操你', '傻叉'];
    filters.containsSensitive = sensitiveWords.some(word =>
      text.toLowerCase().includes(word.toLowerCase()),
    );

    // 垃圾信息检测
    const spamPatterns = [
      /http[s]?:\/\/|www\./gi, // 链接
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)/gi, // 电话号码
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/gi, // 邮箱
      /【.*?】.*?【.*?】/g, // 特殊格式
      /关注.*?公众号.*?/gi,
      /加.*?群.*?/gi,
    ];
    filters.containsSpam = spamPatterns.some(pattern => pattern.test(text));

    // 表情符号检测
    const emojiRegex = /\p{Extended_Pictographic}/u;
    filters.containsEmojis = emojiRegex.test(text);

    // 关键词提取
    const keywords = text.match(/[\u4e00-\u9fa5]+/g) || [];
    filters.keywords = [...new Set(keywords)].slice(0, 10); // 去重并限制数量

    return filters;
  }

  // 导入弹幕数据
  async importData(data: ImportedDanmakuItem[]): Promise<number> {
    let importedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const processedBatch = batch.map(item => ({
        danmakuId: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: this.filterText(item.text || ''),
        color: item.color || '#FFFFFF',
        type: item.type || 'scroll',
        priority: item.priority || 1,
        isHighlighted: item.isHighlighted || false,
        isActive: true,
        filters: this.analyzeContent(item.text || ''),
        metadata: {
          timestamp: item.timestamp || Date.now(),
          userAgent: item.userAgent || 'imported',
        },
        userId: item.userId || 1,
        mediaResourceId: item.mediaResourceId || 0,
        videoId: item.videoId || '',
      }));

      const savedBatch = await this.danmakuRepository.save(processedBatch);
      importedCount += savedBatch.length;
    }

    this.logger.log(`导入完成，共导入 ${importedCount} 条弹幕`);
    return importedCount;
  }

  private parseCount(value?: string): number {
    return value ? parseInt(value, 10) : 0;
  }

  private getMetadata(danmaku: Danmaku): DanmakuMetadata {
    return danmaku.metadata ?? {};
  }

  private getModerationStatus(
    danmaku: Danmaku,
    reports: DanmakuReportRecord[],
  ): 'active' | 'reported' | 'hidden' {
    if (!danmaku.isActive) {
      return 'hidden';
    }

    return reports.length > 0 ? 'reported' : 'active';
  }

  private getPeriodStart(period: 'all' | 'day' | 'week' | 'month'): Date | null {
    if (period === 'all') {
      return null;
    }

    const current = new Date();

    switch (period) {
      case 'day':
        current.setDate(current.getDate() - 1);
        break;
      case 'week':
        current.setDate(current.getDate() - 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() - 1);
        break;
      default:
        return null;
    }

    return current;
  }

  private getTrendBucketStart(date: Date, interval: 'hour' | 'day' | 'week' | 'month'): Date {
    const bucket = new Date(date);

    switch (interval) {
      case 'hour':
        bucket.setUTCMinutes(0, 0, 0);
        break;
      case 'day':
        bucket.setUTCHours(0, 0, 0, 0);
        break;
      case 'week': {
        bucket.setUTCHours(0, 0, 0, 0);
        const currentDay = bucket.getUTCDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        bucket.setUTCDate(bucket.getUTCDate() + diff);
        break;
      }
      case 'month':
        bucket.setUTCDate(1);
        bucket.setUTCHours(0, 0, 0, 0);
        break;
      default:
        bucket.setUTCHours(0, 0, 0, 0);
        break;
    }

    return bucket;
  }

  private buildSuggestionRecords(
    danmakuItems: Danmaku[],
    strategy: 'popular' | 'recent',
  ): DanmakuSuggestionRecord[] {
    const seenTexts = new Set<string>();

    return danmakuItems
      .filter(item => {
        const normalizedText = item.text.trim();
        if (!normalizedText || seenTexts.has(normalizedText)) {
          return false;
        }

        seenTexts.add(normalizedText);
        return true;
      })
      .map(item => ({
        text: item.text,
        color: item.color,
        type: item.type,
        priority: item.priority,
        score:
          strategy === 'popular'
            ? (item.isHighlighted ? 1 : 0.8) - item.priority / 20
            : 0.9 - item.priority / 20,
      }));
  }

  private buildRelevantSuggestionRecords(danmakuItems: Danmaku[]): DanmakuSuggestionRecord[] {
    const keywordCounts = new Map<string, number>();

    danmakuItems.forEach(item => {
      const keywords = item.filters?.keywords ?? [];
      keywords.forEach(keyword => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase();
        if (normalizedKeyword.length < 2) {
          return;
        }

        keywordCounts.set(normalizedKeyword, (keywordCounts.get(normalizedKeyword) || 0) + 1);
      });
    });

    const seenTexts = new Set<string>();

    return danmakuItems
      .map(item => {
        const keywords = item.filters?.keywords ?? [];
        const keywordScore = keywords.reduce(
          (total, keyword) => total + (keywordCounts.get(keyword.trim().toLocaleLowerCase()) || 0),
          0,
        );

        return {
          item,
          score: keywordScore + (item.isHighlighted ? 3 : 0) + Math.max(0, 5 - item.priority),
        };
      })
      .sort((left, right) => right.score - left.score)
      .filter(({ item }) => {
        const normalizedText = item.text.trim();
        if (!normalizedText || seenTexts.has(normalizedText)) {
          return false;
        }

        seenTexts.add(normalizedText);
        return true;
      })
      .map(({ item, score }) => ({
        text: item.text,
        color: item.color,
        type: item.type,
        priority: item.priority,
        score,
      }));
  }
}
