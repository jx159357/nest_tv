import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { Recommendation } from '../entities/recommendation.entity';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(MediaResource)
    private readonly mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取热门推荐（基于观看次数和评分）
   */
  async getTrendingRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `trending_recommendations_${limit}`;

    try {
      // 尝试从缓存获取
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`从缓存获取热门推荐: ${cacheKey}`);
        return cachedRecommendations;
      }

      // 获取热门媒体资源
      const trendingMedia = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: { 
          viewCount: 'DESC',
          rating: 'DESC',
          createdAt: 'DESC'
        },
        take: limit,
      });

      // 缓存结果（5分钟）
      await this.cacheManager.set(cacheKey, trendingMedia, 300000);
      this.logger.log(`缓存热门推荐: ${cacheKey}`);

      return trendingMedia;
    } catch (error) {
      this.logger.error(`获取热门推荐失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取最新推荐
   */
  async getLatestRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `latest_recommendations_${limit}`;

    try {
      // 尝试从缓存获取
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`从缓存获取最新推荐: ${cacheKey}`);
        return cachedRecommendations;
      }

      // 获取最新媒体资源
      const latestMedia = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      // 缓存结果（3分钟，最新内容更新频率较高）
      await this.cacheManager.set(cacheKey, latestMedia, 180000);
      this.logger.log(`缓存最新推荐: ${cacheKey}`);

      return latestMedia;
    } catch (error) {
      this.logger.error(`获取最新推荐失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取高分推荐
   */
  async getTopRatedRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `top_rated_recommendations_${limit}`;

    try {
      // 尝试从缓存获取
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`从缓存获取高分推荐: ${cacheKey}`);
        return cachedRecommendations;
      }

      // 获取高分媒体资源
      const topRatedMedia = await this.mediaResourceRepository.find({
        where: { 
          isActive: true,
          rating: 7.0,
        },
        order: { rating: 'DESC' },
        take: limit,
      });

      // 缓存结果（10分钟，高分内容相对稳定）
      await this.cacheManager.set(cacheKey, topRatedMedia, 600000);
      this.logger.log(`缓存高分推荐: ${cacheKey}`);

      return topRatedMedia;
    } catch (error) {
      this.logger.error(`获取高分推荐失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 清理推荐缓存
   */
  async clearRecommendationsCache(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.log('清理推荐缓存完成');
    } catch (error) {
      this.logger.error(`清理推荐缓存失败: ${error.message}`);
    }
  }
}