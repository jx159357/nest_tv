import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { MediaResource, MediaType, MediaQuality } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';

@Injectable()
export class MediaResourceService {
  constructor(
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
  ) {}

  /**
   * 创建影视资源
   */
  async create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource> {
    const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
    return await this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 分页查询影视资源
   */
  async findAll(queryDto: MediaResourceQueryDto): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, type, genre, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    
    const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');

    // 搜索条件
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

    // 类型标签过滤
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

    // 排序
    const validSortFields = ['id', 'title', 'rating', 'viewCount', 'createdAt', 'releaseDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`media.${sortField}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查找影视资源
   */
  async findById(id: number): Promise<MediaResource> {
    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id },
      relations: ['playSources', 'watchHistory'],
    });

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
   * 获取热门影视资源
   */
  async getPopular(limit: number = 10): Promise<MediaResource[]> {
    return await this.mediaResourceRepository.find({
      where: { isActive: true },
      order: { viewCount: 'DESC', rating: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取最新影视资源
   */
  async getLatest(limit: number = 10): Promise<MediaResource[]> {
    return await this.mediaResourceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取高评分影视资源
   */
  async getTopRated(limit: number = 10, minRating: number = 8): Promise<MediaResource[]> {
    return await this.mediaResourceRepository.find({
      where: { 
        isActive: true, 
        rating: Between(minRating, 10) 
      },
      order: { rating: 'DESC' },
      take: limit,
    });
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
   * 添加用户收藏
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
  }

  /**
   * 取消用户收藏
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
   * 获取用户的收藏列表
   */
  async getUserFavorites(userId: number, page: number = 1, limit: number = 10): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const user = await this.mediaResourceRepository.manager
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.favorites', 'favorites')
      .leftJoinAndSelect('favorites.playSources', 'playSources')
      .leftJoinAndSelect('favorites.watchHistory', 'watchHistory')
      .where('user.id = :userId', { userId })
      .orderBy('favorites.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const total = user.favorites.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: user.favorites,
      total,
      page,
      limit,
      totalPages,
    };
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