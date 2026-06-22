import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { PlaySource } from '../entities/play-source.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { CacheService } from '../common/cache/cache.service';
import { Cacheable, CacheEvict } from '../common/decorators/cache.decorator';
import { PlaySourceService } from '../play-sources/play-source.service';

interface MediaStatisticsRow {
  total: string;
  type: string;
  quality: string;
  avgRating: string | null;
}

interface MediaSourceStatisticsRow {
  source: string | null;
  total: string;
  active: string;
  latestCreatedAt: string | null;
  recentCreated7d: string;
  withPoster: string;
  withBackdrop: string;
  withDuration: string;
  withEpisodeCount: string;
  withDownloadUrls: string;
}

interface MediaDedupInput {
  title: string;
  type?: string | null;
  releaseDate?: Date | string | null;
  source?: string | null;
}

const MEDIA_CARD_SELECT_FIELDS = [
  'mediaResource.id',
  'mediaResource.title',
  'mediaResource.description',
  'mediaResource.type',
  'mediaResource.genres',
  'mediaResource.releaseDate',
  'mediaResource.quality',
  'mediaResource.poster',
  'mediaResource.backdrop',
  'mediaResource.rating',
  'mediaResource.viewCount',
  'mediaResource.isActive',
  'mediaResource.source',
  'mediaResource.duration',
  'mediaResource.episodeCount',
  'mediaResource.createdAt',
  'mediaResource.updatedAt',
];

@Injectable()
export class MediaResourceService {
  constructor(
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    private readonly cacheService: CacheService,
    private readonly playSourceService: PlaySourceService,
  ) {}

  private normalizeText(value?: string | null): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private normalizeReleaseDate(value?: Date | string | null): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private extractYear(releaseDate?: string | Date | null): string {
    if (!releaseDate) return '';
    const date = releaseDate instanceof Date ? releaseDate : new Date(releaseDate);
    if (Number.isNaN(date.getTime())) return '';
    return String(date.getFullYear());
  }

  private buildMediaDedupKey(media: MediaDedupInput): string {
    return [
      this.normalizeText(media.title),
      this.normalizeText(media.type),
      this.extractYear(media.releaseDate),
      this.normalizeText(media.source),
    ].join('|');
  }

  private compareMediaKeepPriority(left: MediaResource, right: MediaResource): number {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }
    if ((left.playSources?.length || 0) !== (right.playSources?.length || 0)) {
      return (right.playSources?.length || 0) - (left.playSources?.length || 0);
    }
    if ((left.rating || 0) !== (right.rating || 0)) {
      return (right.rating || 0) - (left.rating || 0);
    }
    if ((left.viewCount || 0) !== (right.viewCount || 0)) {
      return (right.viewCount || 0) - (left.viewCount || 0);
    }
    return left.id - right.id;
  }

  async findDuplicateCandidate(input: MediaDedupInput): Promise<MediaResource | null> {
    const title = String(input.title || '').trim();
    if (!title) {
      return null;
    }

    const candidates = await this.mediaResourceRepository.find({
      where: { title },
      relations: ['playSources'],
    });
    const targetKey = this.buildMediaDedupKey(input);

    return (
      candidates
        .filter(candidate => this.buildMediaDedupKey(candidate) === targetKey)
        .sort((left, right) => this.compareMediaKeepPriority(left, right))[0] || null
    );
  }

  /**
   * 创建影视资源
   */
  @CacheEvict({
    all: true,
    key: 'media:*',
  })
  async create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource> {
    const existing = await this.findDuplicateCandidate(createMediaResourceDto);
    if (existing) {
      return existing;
    }

    const mediaResource = this.mediaResourceRepository.create({
      ...createMediaResourceDto,
      title: String(createMediaResourceDto.title || '').trim(),
    });
    return this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 获取影视资源列表（支持筛选和分页）
   */
  async findAll(queryDto: MediaResourceQueryDto): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    pageSize: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      search,
      type,
      quality,
      minRating,
      maxRating,
      tags,
      startDate,
      endDate,
    } = queryDto;

    const queryBuilder = this.createCardQueryBuilder();
    queryBuilder.where('mediaResource.isActive = :isActive', { isActive: true });

    // 搜索条件 - 优化索引使用
    if (search) {
      queryBuilder.andWhere(
        '(mediaResource.title LIKE :search OR mediaResource.description LIKE :search)',
        { search: `%${search}%` },
      );

      // 如果标题搜索结果太少，再搜索描述
      // 这样可以利用索引优化性能
    }

    // 类型筛选
    if (type) {
      // 如果 type 是字符串，转换为数组；如果是数组，直接使用
      const typeArray = Array.isArray(type) ? type : [type];
      queryBuilder.andWhere('mediaResource.type IN (:...type)', { type: typeArray });
    }

    // 质量筛选
    if (quality) {
      // 如果 quality 是字符串，转换为数组；如果是数组，直接使用
      const qualityArray = Array.isArray(quality) ? quality : [quality];
      queryBuilder.andWhere('mediaResource.quality IN (:...quality)', { quality: qualityArray });
    }

    // 评分筛选
    if (minRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating >= :minRating', { minRating });
    }
    if (maxRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating <= :maxRating', { maxRating });
    }

    // 标签筛选
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      if (tagsArray.length > 0) {
        const tagConditions = tagsArray
          .map((tag, index) => `mediaResource.genres LIKE :tag${index}`)
          .join(' OR ');

        const tagParams = {};
        tagsArray.forEach((tag, index) => {
          tagParams[`tag${index}`] = `%${tag}%`;
        });

        queryBuilder.andWhere(`(${tagConditions})`, tagParams);
      }
    }

    // 日期范围筛选
    if (startDate && endDate) {
      queryBuilder.andWhere('mediaResource.releaseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 分页查询
    const skip = (page - 1) * pageSize;
    const data = await queryBuilder
      .orderBy('mediaResource.rating', 'DESC')
      .addOrderBy('mediaResource.releaseDate', 'DESC')
      .addOrderBy('mediaResource.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getMany();

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      limit: pageSize,
      totalPages,
    };
  }

  /**
   * 根据ID获取影视资源
   */
  async findById(id: number): Promise<MediaResource & { sourceFreshness?: string }> {
    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id },
      relations: ['watchHistory'],
    });

    if (!mediaResource) {
      throw new NotFoundException(`影视资源ID ${id} 不存在`);
    }

    try {
      const result = await this.playSourceService.getPlayableSources(id);
      mediaResource.playSources = result.sources;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (mediaResource as any).sourceFreshness = result.freshness;
    } catch {
      mediaResource.playSources = await this.playSourceRepository.find({
        where: { mediaResourceId: id, isActive: true },
        order: { priority: 'ASC', updatedAt: 'DESC' },
      });
    }

    return mediaResource;
  }

  async getPlayDetail(id: number, userId?: number) {
    const media = await this.mediaResourceRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`影视资源ID ${id} 不存在`);
    }

    let playSources: PlaySource[] = [];
    let sourceFreshness: 'fresh' | 'stale' | 'refreshing' | 'empty' = 'empty';
    try {
      const result = await this.playSourceService.getPlayableSources(id);
      playSources = result.sources;
      sourceFreshness = result.freshness;
    } catch {
      playSources = await this.playSourceRepository.find({
        where: { mediaResourceId: id, isActive: true },
        order: { priority: 'ASC', updatedAt: 'DESC' },
      });
    }

    const sourceGroupMap = new Map<string, PlaySource[]>();
    for (const source of playSources) {
      const key = source.sourceName || source.providerName || '默认线路';
      const group = sourceGroupMap.get(key) ?? [];
      group.push(source);
      sourceGroupMap.set(key, group);
    }

    const sourceGroups = [...sourceGroupMap.entries()].map(([name, sources]) => {
      const sorted = sources.sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0));
      return {
        name,
        episodes: sorted.map(s => ({
          id: s.id,
          episodeNumber: s.episodeNumber,
          url: s.url,
          name: s.name || (s.episodeNumber ? `第${s.episodeNumber}集` : '播放'),
          resolution: s.resolution,
          format: s.format,
          status: s.status,
          isAds: s.isAds,
        })),
      };
    });

    let watchHistory: { currentTime: number; duration: number; episodeNumber?: number } | null =
      null;
    if (userId) {
      const wh = await this.watchHistoryRepository.findOne({
        where: { userId, mediaResourceId: id },
      });
      if (wh) {
        watchHistory = {
          currentTime: wh.currentTime ?? 0,
          duration: wh.duration ?? 0,
          episodeNumber: wh.episodeNumber,
        };
      }
    }

    return {
      id: media.id,
      title: media.title,
      description: media.description ? media.description.slice(0, 500) : undefined,
      type: media.type,
      poster: media.poster,
      backdrop: media.backdrop,
      rating: media.rating,
      genres: media.genres,
      quality: media.quality,
      releaseDate: media.releaseDate,
      episodeCount: media.episodeCount,
      sourceGroups,
      sourceFreshness,
      downloadUrls: (media.downloadUrls ?? []).slice(0, 5),
      watchHistory,
    };
  }

  /**
   * 更新影视资源
   */
  @CacheEvict({
    all: true,
    key: 'media:*',
  })
  async update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<MediaResource> {
    const mediaResource = await this.findById(id);
    Object.assign(mediaResource, updateMediaResourceDto);
    return this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 删除影视资源
   */
  @CacheEvict({
    all: true,
    key: 'media:*',
  })
  async remove(id: number): Promise<void> {
    const mediaResource = await this.findById(id);
    await this.mediaResourceRepository.remove(mediaResource);
  }

  /**
   * 搜索影视资源 - 优化查询性能
   */
  async search(keyword: string, limit: number = 10): Promise<MediaResource[]> {
    try {
      return await this.mediaResourceRepository
        .createQueryBuilder('m')
        .where('m.title LIKE :prefix', { prefix: `${keyword}%` })
        .orWhere('m.title LIKE :fuzzy', { fuzzy: `%${keyword}%` })
        .orderBy('CASE WHEN m.title LIKE :prefix THEN 0 ELSE 1 END', 'ASC')
        .addOrderBy('m.rating', 'DESC')
        .setParameter('prefix', `${keyword}%`)
        .setParameter('fuzzy', `%${keyword}%`)
        .take(limit)
        .getMany();
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * 获取热门影视
   */
  @Cacheable({
    keyGenerator: (...args: unknown[]) => `media:popular:${String(args[0])}`,
    ttl: 600,
  })
  async getPopular(limit: number = 10): Promise<MediaResource[]> {
    return this.createCardQueryBuilder()
      .where('mediaResource.isActive = :isActive', { isActive: true })
      .andWhere('mediaResource.rating != :rating', { rating: 0 })
      .orderBy('mediaResource.viewCount', 'DESC')
      .addOrderBy('mediaResource.rating', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取最新影视
   */
  @Cacheable({
    keyGenerator: (...args: unknown[]) => `media:latest:${String(args[0])}`,
    ttl: 180,
  })
  async getLatest(limit: number = 10): Promise<MediaResource[]> {
    return this.createCardQueryBuilder()
      .where('mediaResource.isActive = :isActive', { isActive: true })
      .orderBy('mediaResource.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取分类统计（类型 + 流派）
   */
  @Cacheable({ key: 'media:category_stats', ttl: 1800 })
  async getCategoryStats(): Promise<{
    types: Array<{ name: string; label: string; count: number }>;
    genres: Array<{ name: string; count: number }>;
  }> {
    const typeRows = await this.mediaResourceRepository
      .createQueryBuilder('m')
      .select('m.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('m.isActive = :active', { active: true })
      .groupBy('m.type')
      .getRawMany<{ type: string; count: string }>();

    const typeLabelMap: Record<string, string> = {
      movie: '电影',
      tv_series: '电视剧',
      tv: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
      short: '短剧',
    };

    const types = typeRows
      .map(row => ({
        name: row.type,
        label: typeLabelMap[row.type] || row.type,
        count: Number(row.count),
      }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count);

    const genreRows = await this.mediaResourceRepository
      .createQueryBuilder('m')
      .select('m.genres', 'genres')
      .where('m.isActive = :active', { active: true })
      .andWhere('m.genres IS NOT NULL')
      .andWhere("m.genres != ''")
      .getRawMany<{ genres: string }>();

    const genreCountMap = new Map<string, number>();
    for (const row of genreRows) {
      const raw = row.genres;
      if (!raw) continue;
      const parsed = typeof raw === 'string' ? raw.split(',').map(s => s.trim()) : [];
      for (const g of parsed) {
        if (g) {
          genreCountMap.set(g, (genreCountMap.get(g) || 0) + 1);
        }
      }
    }

    const genres = Array.from(genreCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { types, genres };
  }

  /**
   * 获取相似影视
   */
  @Cacheable({
    keyGenerator: (...args: unknown[]) => `media:similar:${String(args[0])}:${String(args[1])}`,
    ttl: 600,
  })
  async getSimilar(id: number, limit: number = 6): Promise<MediaResource[]> {
    const mediaResource = await this.findById(id);

    return this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .where('mediaResource.id != :id', { id })
      .andWhere('mediaResource.type = :type', {
        type: mediaResource.type,
      })
      .orderBy('mediaResource.rating', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 增加观看次数
   */
  async incrementViews(id: number): Promise<void> {
    await this.mediaResourceRepository.increment({ id }, 'viewCount', 1);
  }

  async addToFavorites(userId: number, mediaResourceId: number): Promise<void> {
    const [user, mediaResource] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['favorites'],
      }),
      this.mediaResourceRepository.findOne({
        where: { id: mediaResourceId, isActive: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (!mediaResource) {
      throw new NotFoundException(`影视资源ID ${mediaResourceId} 不存在`);
    }

    const favorites = Array.isArray(user.favorites) ? user.favorites : [];
    if (favorites.some(item => item.id === mediaResourceId)) {
      return;
    }

    user.favorites = [...favorites, mediaResource];
    await this.userRepository.save(user);
    await this.cacheService.clearPattern('media:*');
  }

  async removeFromFavorites(userId: number, mediaResourceId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    const favorites = Array.isArray(user.favorites) ? user.favorites : [];
    user.favorites = favorites.filter(item => item.id !== mediaResourceId);
    await this.userRepository.save(user);
    await this.cacheService.clearPattern('media:*');
  }

  async isFavoritedByUser(userId: number, mediaResourceId: number): Promise<boolean> {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.favorites', 'favorite')
      .where('user.id = :userId', { userId })
      .andWhere('favorite.id = :mediaResourceId', { mediaResourceId })
      .getCount();

    return count > 0;
  }

  async getUserFavorites(userId: number, page: number = 1, limit: number = 10) {
    const nextPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const nextLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 10;

    const [data, total] = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .innerJoin('mediaResource.favorites', 'favoriteUser', 'favoriteUser.id = :userId', { userId })
      .where('mediaResource.isActive = :isActive', { isActive: true })
      .orderBy('mediaResource.updatedAt', 'DESC')
      .skip((nextPage - 1) * nextLimit)
      .take(nextLimit)
      .getManyAndCount();

    const totalPages = total > 0 ? Math.ceil(total / nextLimit) : 0;
    const resolvedPage = totalPages > 0 ? Math.min(nextPage, totalPages) : 1;

    if (resolvedPage !== nextPage) {
      const adjustedData = await this.mediaResourceRepository
        .createQueryBuilder('mediaResource')
        .innerJoin('mediaResource.favorites', 'favoriteUser', 'favoriteUser.id = :userId', {
          userId,
        })
        .where('mediaResource.isActive = :isActive', { isActive: true })
        .orderBy('mediaResource.updatedAt', 'DESC')
        .skip((resolvedPage - 1) * nextLimit)
        .take(nextLimit)
        .getMany();

      return {
        data: adjustedData,
        page: resolvedPage,
        limit: nextLimit,
        total,
        totalPages,
      };
    }

    return {
      data,
      page: resolvedPage,
      limit: nextLimit,
      total,
      totalPages,
    };
  }

  /**
   * 增加点赞数
   */
  incrementLikes(id: number): void {
    void id;
    // 暂时没有likes字段，等需要时可以添加
    // await this.mediaResourceRepository.increment({ id }, 'likes', 1);
  }

  /**
   * 减少点赞数
   */
  decrementLikes(id: number): void {
    void id;
    // 暂时没有likes字段，等需要时可以添加
    // await this.mediaResourceRepository.decrement({ id }, 'likes', 1);
  }

  /**
   * 获取影视统计信息 - 优化为单次查询
   */
  @Cacheable({ key: 'media:statistics', ttl: 900 })
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byQuality: Record<string, number>;
    averageRating: number;
  }> {
    // 使用单次查询获取所有统计数据
    const statisticsQuery = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('COUNT(*)', 'total')
      .addSelect('mediaResource.type', 'type')
      .addSelect('mediaResource.quality', 'quality')
      .addSelect(
        'AVG(CASE WHEN mediaResource.rating != 0 THEN mediaResource.rating ELSE NULL END)',
        'avgRating',
      )
      .groupBy('mediaResource.type, mediaResource.quality')
      .getRawMany<MediaStatisticsRow>();

    // 处理统计数据
    let total = 0;
    const byType: Record<string, number> = {};
    const byQuality: Record<string, number> = {};
    let ratingSum = 0;
    let ratingCount = 0;

    statisticsQuery.forEach(stat => {
      const count = parseInt(stat.total, 10);
      total += count;

      // 按类型统计
      byType[stat.type] = (byType[stat.type] || 0) + count;

      // 按质量统计
      byQuality[stat.quality] = (byQuality[stat.quality] || 0) + count;

      // 计算平均评分
      if (stat.avgRating) {
        ratingSum += parseFloat(stat.avgRating) * count;
        ratingCount += count;
      }
    });

    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    return {
      total,
      byType,
      byQuality,
      averageRating,
    };
  }

  /**
   * 获取媒体资源总数
   */
  async getTotalCount(): Promise<number> {
    return this.mediaResourceRepository.count();
  }

  /**
   * 获取活跃媒体资源数量
   */
  async getActiveCount(): Promise<number> {
    return this.mediaResourceRepository.count({
      where: {
        isActive: true,
      },
    });
  }

  async deduplicateMediaResources(): Promise<{
    duplicateGroups: number;
    deactivated: number;
    movedPlaySources: number;
  }> {
    const mediaResources = await this.mediaResourceRepository.find({
      relations: ['playSources'],
      order: { id: 'ASC' },
    });
    const groups = new Map<string, MediaResource[]>();

    for (const mediaResource of mediaResources) {
      const key = this.buildMediaDedupKey(mediaResource);
      if (!key.split('|')[0]) continue;

      const group = groups.get(key) || [];
      group.push(mediaResource);
      groups.set(key, group);
    }

    const duplicateGroups = Array.from(groups.values()).filter(group => group.length > 1);
    let deactivated = 0;
    let movedPlaySources = 0;

    for (const group of duplicateGroups) {
      const [keeper, ...duplicates] = [...group].sort((left, right) =>
        this.compareMediaKeepPriority(left, right),
      );

      for (const duplicate of duplicates) {
        const duplicateSourceUrls = new Set(
          (keeper.playSources || []).map(source => source.url).filter(Boolean),
        );
        const sourcesToMove = (duplicate.playSources || []).filter(source => {
          if (!source.url || duplicateSourceUrls.has(source.url)) {
            return false;
          }
          duplicateSourceUrls.add(source.url);
          return true;
        });

        if (sourcesToMove.length > 0) {
          await this.playSourceRepository.update(
            sourcesToMove.map(source => source.id),
            { mediaResourceId: keeper.id },
          );
          movedPlaySources += sourcesToMove.length;
        }

        if (duplicate.isActive) {
          duplicate.isActive = false;
          await this.mediaResourceRepository.save(duplicate);
          deactivated++;
        }
      }
    }

    if (deactivated > 0 || movedPlaySources > 0) {
      await this.cacheService.clearPattern('media:*');
    }

    return {
      duplicateGroups: duplicateGroups.length,
      deactivated,
      movedPlaySources,
    };
  }

  async getSourceStatistics(sourceNames?: string[]): Promise<
    Record<
      string,
      {
        total: number;
        active: number;
        latestCreatedAt: string | null;
        recentCreated7d: number;
        withPoster: number;
        withBackdrop: number;
        withDuration: number;
        withEpisodeCount: number;
        withDownloadUrls: number;
      }
    >
  > {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const queryBuilder = this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.source', 'source')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN mediaResource.isActive = true THEN 1 ELSE 0 END)', 'active')
      .addSelect('MAX(mediaResource.createdAt)', 'latestCreatedAt')
      .addSelect(
        'SUM(CASE WHEN mediaResource.createdAt >= :since7d THEN 1 ELSE 0 END)',
        'recentCreated7d',
      )
      .addSelect(
        "SUM(CASE WHEN mediaResource.poster IS NOT NULL AND mediaResource.poster <> '' THEN 1 ELSE 0 END)",
        'withPoster',
      )
      .addSelect(
        "SUM(CASE WHEN mediaResource.backdrop IS NOT NULL AND mediaResource.backdrop <> '' THEN 1 ELSE 0 END)",
        'withBackdrop',
      )
      .addSelect(
        'SUM(CASE WHEN mediaResource.duration IS NOT NULL AND mediaResource.duration > 0 THEN 1 ELSE 0 END)',
        'withDuration',
      )
      .addSelect(
        'SUM(CASE WHEN mediaResource.episodeCount IS NOT NULL AND mediaResource.episodeCount > 0 THEN 1 ELSE 0 END)',
        'withEpisodeCount',
      )
      .addSelect(
        "SUM(CASE WHEN mediaResource.downloadUrls IS NOT NULL AND mediaResource.downloadUrls <> '' THEN 1 ELSE 0 END)",
        'withDownloadUrls',
      )
      .setParameter('since7d', since7d)
      .where('mediaResource.source IS NOT NULL');

    if (sourceNames && sourceNames.length > 0) {
      queryBuilder.andWhere('mediaResource.source IN (:...sourceNames)', { sourceNames });
    }

    const rows = await queryBuilder
      .groupBy('mediaResource.source')
      .getRawMany<MediaSourceStatisticsRow>();

    return rows.reduce<
      Record<
        string,
        {
          total: number;
          active: number;
          latestCreatedAt: string | null;
          recentCreated7d: number;
          withPoster: number;
          withBackdrop: number;
          withDuration: number;
          withEpisodeCount: number;
          withDownloadUrls: number;
        }
      >
    >((accumulator, row) => {
      if (!row.source) {
        return accumulator;
      }

      accumulator[row.source] = {
        total: parseInt(row.total, 10) || 0,
        active: parseInt(row.active, 10) || 0,
        latestCreatedAt: row.latestCreatedAt ?? null,
        recentCreated7d: parseInt(row.recentCreated7d, 10) || 0,
        withPoster: parseInt(row.withPoster, 10) || 0,
        withBackdrop: parseInt(row.withBackdrop, 10) || 0,
        withDuration: parseInt(row.withDuration, 10) || 0,
        withEpisodeCount: parseInt(row.withEpisodeCount, 10) || 0,
        withDownloadUrls: parseInt(row.withDownloadUrls, 10) || 0,
      };

      return accumulator;
    }, {});
  }

  /**
   * 获取数据源列表（用于前台筛选）
   */
  @Cacheable({ key: 'media:source_list', ttl: 1800 })
  async getSourceList(): Promise<Array<{ name: string; count: number }>> {
    const rows = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.source', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('mediaResource.source IS NOT NULL')
      .andWhere("mediaResource.source != ''")
      .groupBy('mediaResource.source')
      .orderBy('count', 'DESC')
      .getRawMany<{ name: string; count: string }>();

    return rows.map(row => ({
      name: row.name,
      count: parseInt(row.count, 10) || 0,
    }));
  }

  /**
   * 获取最后爬取时间
   */
  async getLastCrawlTime(): Promise<Date> {
    const result = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('MAX(mediaResource.createdAt)', 'lastCrawlTime')
      .getRawOne<{ lastCrawlTime: string }>();

    return result?.lastCrawlTime ? new Date(result.lastCrawlTime) : new Date();
  }

  /**
   * 根据标题查找媒体资源
   */
  async findByTitle(title: string): Promise<MediaResource | null> {
    return this.mediaResourceRepository.findOne({
      where: {
        title: title,
      },
    });
  }

  private createCardQueryBuilder() {
    return this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select(MEDIA_CARD_SELECT_FIELDS)
      .loadRelationCountAndMap('mediaResource.playSourceCount', 'mediaResource.playSources');
  }
}
