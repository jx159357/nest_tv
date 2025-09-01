import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { MediaResource, MediaType, MediaQuality } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';
import { MediaCacheService } from '../common/services/media-cache.service';

@Injectable()
export class MediaResourceService {
  constructor(
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
    private performanceMonitorService: PerformanceMonitorService,
    private mediaCacheService: MediaCacheService,
  ) {}

  /**
   * 创建影视资源
   */
  async create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource> {
    const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
    return await this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 分页查询影视资源（优化版）
   */
  async findAll(queryDto: MediaResourceQueryDto): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, type, genre, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    
    const startTime = Date.now();
    const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');

    // 搜索条件 - 优化为全文搜索
    if (search) {
      queryBuilder.andWhere(
        '(media.title LIKE :search OR media.description LIKE :search OR media.director LIKE :search OR media.actors LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 类型过滤
    if (type && Object.values(MediaType).includes(type as MediaType)) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    // 类型标签过滤 - 优化JSON查询
    if (genre) {
      queryBuilder.andWhere('JSON_CONTAINS(media.genres, :genre)', { genre: `["${genre}"]` });
    }

    // 评分范围过滤
    if (minRating !== undefined || maxRating !== undefined) {
      const min = minRating ?? 0;
      const max = maxRating ?? 10;
      queryBuilder.andWhere('media.rating BETWEEN :min AND :max', { min, max });
    }

    // 只查询激活的资源
    queryBuilder.andWhere('media.isActive = :isActive', { isActive: true });

    // 排序 - 优化只允许索引字段排序
    const validSortFields = ['id', 'title', 'rating', 'viewCount', 'createdAt', 'releaseDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`media.${sortField}`, sortOrder);

    // 分页 - 添加限制避免过大查询
    const validatedLimit = Math.min(Math.max(limit, 1), 100); // 限制每页最多100条
    const offset = (page - 1) * validatedLimit;
    queryBuilder.skip(offset).take(validatedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();
    
    // 记录查询性能
    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.findAll - ${JSON.stringify(queryDto)}`, 
      duration
    );

    return {
      data,
      total,
      page: Number(page),
      limit: validatedLimit,
      totalPages: Math.ceil(total / validatedLimit),
    };
  }

  /**
   * 根据ID查找影视资源（优化版，避免N+1查询）
   */
  async findById(id: number): Promise<MediaResource> {
    const startTime = Date.now();
    
    const mediaResource = await this.mediaResourceRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.playSources', 'playSources')
      .leftJoinAndSelect('media.watchHistory', 'watchHistory')
      .leftJoinAndSelect('media.recommendations', 'recommendations')
      .leftJoinAndSelect('media.iptvChannels', 'iptvChannels')
      .where('media.id = :id', { id })
      .getOne();

    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.findById - ${id}`, 
      duration
    );

    if (!mediaResource) {
      throw new NotFoundException('影视资源不存在');
    }

    return mediaResource;
  }

  /**
   * 更新影视资源
   */
  async update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<MediaResource> {
    const mediaResource = await this.findById(id);
    Object.assign(mediaResource, updateMediaResourceDto);
    return await this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 删除影视资源
   */
  async remove(id: number): Promise<void> {
    const mediaResource = await this.findById(id);
    await this.mediaResourceRepository.remove(mediaResource);
  }

  /**
   * 软删除（标记为不活跃）
   */
  async softDelete(id: number): Promise<MediaResource> {
    const mediaResource = await this.findById(id);
    mediaResource.isActive = false;
    return await this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 增加观看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.mediaResourceRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 获取热门影视资源（优化版，带缓存）
   */
  async getPopular(limit: number = 10): Promise<MediaResource[]> {
    const validatedLimit = Math.min(Math.max(limit, 1), 50); // 限制最多50条
    
    // 先尝试从缓存获取
    const cached = await this.mediaCacheService.getCachedPopularMedia(validatedLimit);
    if (cached) {
      return cached;
    }
    
    const startTime = Date.now();
    
    const mediaResources = await this.mediaResourceRepository
      .createQueryBuilder('media')
      .where('media.isActive = :isActive', { isActive: true })
      .orderBy('media.viewCount', 'DESC')
      .addOrderBy('media.rating', 'DESC')
      .take(validatedLimit)
      .getMany();
      
    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.getPopular - ${validatedLimit}`, 
      duration
    );
    
    // 缓存结果
    await this.mediaCacheService.cachePopularMedia(mediaResources, validatedLimit);
    
    return mediaResources;
  }

  /**
   * 获取最新影视资源（优化版，带缓存）
   */
  async getLatest(limit: number = 10): Promise<MediaResource[]> {
    const validatedLimit = Math.min(Math.max(limit, 1), 50); // 限制最多50条
    
    // 先尝试从缓存获取
    const cached = await this.mediaCacheService.getCachedLatestMedia(validatedLimit);
    if (cached) {
      return cached;
    }
    
    const startTime = Date.now();
    
    const mediaResources = await this.mediaResourceRepository
      .createQueryBuilder('media')
      .where('media.isActive = :isActive', { isActive: true })
      .orderBy('media.createdAt', 'DESC')
      .take(validatedLimit)
      .getMany();
      
    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.getLatest - ${validatedLimit}`, 
      duration
    );
    
    // 缓存结果
    await this.mediaCacheService.cacheLatestMedia(mediaResources, validatedLimit);
    
    return mediaResources;
  }

  /**
   * 获取高评分影视资源（优化版，带缓存）
   */
  async getTopRated(limit: number = 10, minRating: number = 8): Promise<MediaResource[]> {
    const validatedLimit = Math.min(Math.max(limit, 1), 50); // 限制最多50条
    
    // 先尝试从缓存获取
    const cached = await this.mediaCacheService.getCachedTopRatedMedia(validatedLimit, minRating);
    if (cached) {
      return cached;
    }
    
    const startTime = Date.now();
    
    const mediaResources = await this.mediaResourceRepository
      .createQueryBuilder('media')
      .where('media.isActive = :isActive', { isActive: true })
      .andWhere('media.rating BETWEEN :minRating AND :maxRating', { 
        minRating, 
        maxRating: 10 
      })
      .orderBy('media.rating', 'DESC')
      .addOrderBy('media.viewCount', 'DESC')
      .take(validatedLimit)
      .getMany();
      
    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.getTopRated - ${validatedLimit}`, 
      duration
    );
    
    // 缓存结果
    await this.mediaCacheService.cacheTopRatedMedia(mediaResources, validatedLimit, minRating);
    
    return mediaResources;
  }

  /**
   * 根据类型获取影视资源
   */
  async getByType(type: MediaType, limit: number = 20): Promise<MediaResource[]> {
    return await this.mediaResourceRepository.find({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取相关推荐
   */
  async getRecommendations(id: number, limit: number = 6): Promise<MediaResource[]> {
    const mediaResource = await this.findById(id);
    
    return await this.mediaResourceRepository.find({
      where: { 
        type: mediaResource.type,
        isActive: true,
        id: Not(id),
      },
      order: { rating: 'DESC', viewCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * 添加用户收藏（带缓存清除）
   */
  async addToFavorites(userId: number, mediaResourceId: number): Promise<void> {
    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id: mediaResourceId },
      relations: ['favorites'],
    });

    if (!mediaResource) {
      throw new NotFoundException('影视资源不存在');
    }

    const user = await this.mediaResourceRepository.manager
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.favorites', 'favorites')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已经收藏
    const isAlreadyFavorited = user.favorites.some(fav => fav.id === mediaResourceId);
    if (isAlreadyFavorited) {
      throw new HttpException('已经收藏该资源', HttpStatus.BAD_REQUEST);
    }

    user.favorites.push(mediaResource);
    await this.mediaResourceRepository.manager.save(user);
    
    // 清除相关缓存
    await this.mediaCacheService.clearUserCache(userId);
    await this.mediaCacheService.clearMediaCache(mediaResourceId);
  }

  /**
   * 取消用户收藏（带缓存清除）
   */
  async removeFromFavorites(userId: number, mediaResourceId: number): Promise<void> {
    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id: mediaResourceId },
    });

    if (!mediaResource) {
      throw new NotFoundException('影视资源不存在');
    }

    const user = await this.mediaResourceRepository.manager
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.favorites', 'favorites')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.favorites = user.favorites.filter(fav => fav.id !== mediaResourceId);
    await this.mediaResourceRepository.manager.save(user);
    
    // 清除相关缓存
    await this.mediaCacheService.clearUserCache(userId);
    await this.mediaCacheService.clearMediaCache(mediaResourceId);
  }

  /**
   * 检查用户是否收藏了该资源
   */
  async isFavoritedByUser(userId: number, mediaResourceId: number): Promise<boolean> {
    const user = await this.mediaResourceRepository.manager
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.favorites', 'favorites')
      .where('user.id = :userId', { userId })
      .andWhere('favorites.id = :mediaResourceId', { mediaResourceId })
      .getOne();

    return !!user;
  }

  /**
   * 获取用户的收藏列表（优化版，避免N+1查询，带缓存）
   */
  async getUserFavorites(userId: number, page: number = 1, limit: number = 10): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    
    // 先尝试从缓存获取
    const cached = await this.mediaCacheService.getCachedUserFavorites(userId, page, validatedLimit);
    if (cached) {
      return cached;
    }
    
    const startTime = Date.now();
    const offset = (page - 1) * validatedLimit;
    
    // 优化查询：直接查询关联表，避免先查询用户
    const [favorites, totalCount] = await this.mediaResourceRepository.manager
      .createQueryBuilder()
      .select('media')
      .from(MediaResource, 'media')
      .innerJoin('media.favorites', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('media.playSources', 'playSources')
      .leftJoinAndSelect('media.watchHistory', 'watchHistory')
      .orderBy('media.createdAt', 'DESC')
      .skip(offset)
      .take(validatedLimit)
      .getManyAndCount();

    const duration = Date.now() - startTime;
    this.performanceMonitorService.recordDatabaseQuery(
      `MediaResource.getUserFavorites - ${userId}, page: ${page}`, 
      duration
    );

    const result = {
      data: favorites,
      total: totalCount,
      page,
      limit: validatedLimit,
      totalPages: Math.ceil(totalCount / validatedLimit),
    };
    
    // 缓存结果
    await this.mediaCacheService.cacheUserFavorites(userId, result, page, validatedLimit);

    return result;
  }

  /**
   * 用户评分影视资源
   */
  async rateResource(userId: number, mediaResourceId: number, rating: number): Promise<MediaResource> {
    if (rating < 0 || rating > 10) {
      throw new HttpException('评分必须在0-10之间', HttpStatus.BAD_REQUEST);
    }

    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id: mediaResourceId },
      relations: ['watchHistory'],
    });

    if (!mediaResource) {
      throw new NotFoundException('影视资源不存在');
    }

    // TODO: 这里可以添加用户评分记录到单独的评分表
    // 现在简单更新平均评分
    mediaResource.rating = rating;
    return await this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 获取资源评分统计
   */
  async getRatingStats(mediaResourceId: number): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { [key: string]: number };
  }> {
    const mediaResource = await this.findById(mediaResourceId);

    // TODO: 实现真实的评分统计
    // 现在返回模拟数据
    return {
      averageRating: mediaResource.rating,
      totalRatings: 1, // 模拟数据
      ratingDistribution: {
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
        '10': 1,
      },
    };
  }
}