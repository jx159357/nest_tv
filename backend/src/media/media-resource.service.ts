import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { MediaResource, MediaType, MediaQuality } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { CacheService } from '../common/cache/cache.service';
import { Cacheable, CacheEvict } from '../common/decorators/cache.decorator';

@Injectable()
export class MediaResourceService {
  constructor(
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 创建影视资源
   */
  @CacheEvict({
    all: true, // 清除所有媒体相关的缓存
    key: 'media:list:*', // 清除媒体列表缓存
  })
  async create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource> {
    const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
    return this.mediaResourceRepository.save(mediaResource);
  }

  /**
   * 获取影视资源列表（支持筛选和分页）
   */
  @Cacheable({
    ttl: 600, // 10分钟缓存
    key: 'media:list:default', // 简化缓存键
  })
  async findAll(queryDto: MediaResourceQueryDto): Promise<{
    data: MediaResource[];
    total: number;
    page: number;
    pageSize: number;
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

    const queryBuilder = this.mediaResourceRepository
      .createQueryBuilder('mediaResource');

    // 搜索条件 - 优化索引使用
    if (search) {
      queryBuilder.andWhere(
        '(mediaResource.title LIKE :search OR mediaResource.originalTitle LIKE :search)',
        { search: `%${search}%` },
      );
      
      // 如果标题搜索结果太少，再搜索描述
      // 这样可以利用索引优化性能
    }

    // 类型筛选
    if (type) {
      queryBuilder.andWhere('mediaResource.type IN (:...type)', { type });
    }

    // 质量筛选
    if (quality) {
      queryBuilder.andWhere('mediaResource.quality IN (:...quality)', { quality });
    }

    // 评分筛选
    if (minRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating >= :minRating', { minRating });
    }
    if (maxRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating <= :maxRating', { maxRating });
    }

    // 标签筛选
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('mediaResource.tags && JSON_CONTAINS(mediaResource.tags, :tags)', {
        tags,
      });
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
      totalPages,
    };
  }

  /**
   * 根据ID获取影视资源
   */
  async findById(id: number): Promise<MediaResource> {
    const mediaResource = await this.mediaResourceRepository.findOne({
      where: { id },
      relations: ['watchHistory', 'playSources'],
    });

    if (!mediaResource) {
      throw new NotFoundException(`影视资源ID ${id} 不存在`);
    }

    return mediaResource;
  }

  /**
   * 更新影视资源
   */
  @CacheEvict({
    all: true, // 清除所有媒体相关的缓存
    key: 'media:list:*', // 清除媒体列表缓存
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
    all: true, // 清除所有媒体相关的缓存
    key: 'media:list:*', // 清除媒体列表缓存
  })
  async remove(id: number): Promise<void> {
    const mediaResource = await this.findById(id);
    await this.mediaResourceRepository.remove(mediaResource);
  }

  /**
   * 搜索影视资源 - 优化查询性能
   */
  async search(keyword: string, limit: number = 10): Promise<MediaResource[]> {
    // 首先尝试精确匹配和前缀匹配（可以利用索引）
    const exactMatches = await this.mediaResourceRepository.find({
      where: [
        { title: Like(`${keyword}%`) }, // 前缀匹配
      ],
      take: Math.min(limit, 5), // 限制精确匹配数量
      order: {
        rating: 'DESC',
      },
    });

    // 如果精确匹配数量不足，再进行模糊匹配
    if (exactMatches.length < limit) {
      const remainingLimit = limit - exactMatches.length;
      const fuzzyMatches = await this.mediaResourceRepository.find({
        where: [
          { title: Like(`%${keyword}%`) }, // 模糊匹配
        ],
        take: remainingLimit,
        order: {
          rating: 'DESC',
        },
      });

      // 合并结果，去重
      const allResults = [...exactMatches, ...fuzzyMatches];
      const uniqueResults = allResults.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      return uniqueResults.slice(0, limit);
    }

    return exactMatches;
  }

  /**
   * 获取热门影视
   */
  async getPopular(limit: number = 10): Promise<MediaResource[]> {
    return this.mediaResourceRepository.find({
      where: {
        rating: Not(0),
      },
      order: {
        rating: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * 获取最新影视
   */
  async getLatest(limit: number = 10): Promise<MediaResource[]> {
    return this.mediaResourceRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * 获取相似影视
   */
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
    await this.mediaResourceRepository.increment({ id }, 'views', 1);
  }

  /**
   * 增加点赞数
   */
  async incrementLikes(id: number): Promise<void> {
    await this.mediaResourceRepository.increment({ id }, 'likes', 1);
  }

  /**
   * 减少点赞数
   */
  async decrementLikes(id: number): Promise<void> {
    await this.mediaResourceRepository.decrement({ id }, 'likes', 1);
  }

  /**
   * 获取影视统计信息 - 优化为单次查询
   */
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
      .addSelect('AVG(CASE WHEN mediaResource.rating != 0 THEN mediaResource.rating ELSE NULL END)', 'avgRating')
      .groupBy('mediaResource.type, mediaResource.quality')
      .getRawMany<Array<{
        total: string;
        type: string;
        quality: string;
        avgRating: string;
      }>>();

    // 处理统计数据
    let total = 0;
    const byType: Record<string, number> = {};
    const byQuality: Record<string, number> = {};
    let ratingSum = 0;
    let ratingCount = 0;

    statisticsQuery.forEach((stat: any) => {
      const count = parseInt(stat.total);
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
}
