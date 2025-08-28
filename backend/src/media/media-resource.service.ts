import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { MediaResource, MediaType, MediaQuality } from '../entities/media-resource.entity';
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
}