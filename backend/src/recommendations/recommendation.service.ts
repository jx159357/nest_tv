import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { Recommendation } from '../entities/recommendation.entity';
import { WatchHistory } from '../entities/watch-history.entity';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(MediaResource)
    private readonly mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepository: Repository<WatchHistory>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取个性化推荐（基于观看历史偏好）
   */
  async getPersonalizedRecommendations(
    userId: number,
    limit: number = 10,
  ): Promise<MediaResource[]> {
    const cacheKey = `personalized_recommendations_${userId}_${limit}`;

    try {
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`从缓存获取个性化推荐: ${cacheKey}`);
        return cachedRecommendations;
      }

      const histories = await this.watchHistoryRepository.find({
        where: { userId },
        relations: ['mediaResource'],
        order: { updatedAt: 'DESC' },
        take: 50,
      });

      const watchedMedia = histories
        .map(history => history.mediaResource)
        .filter((media): media is MediaResource => Boolean(media?.id) && media.isActive);

      if (watchedMedia.length === 0) {
        return this.getTrendingRecommendations(limit);
      }

      const watchedIds = new Set(watchedMedia.map(media => media.id));
      const typeWeights = new Map<string, number>();
      const genreWeights = new Map<string, number>();
      const directorWeights = new Map<string, number>();

      histories.forEach(history => {
        const media = history.mediaResource;
        if (!media?.id || !media.isActive) {
          return;
        }

        const engagementScore = this.calculateEngagementScore(history);

        typeWeights.set(media.type, (typeWeights.get(media.type) || 0) + engagementScore * 3);

        media.genres?.forEach(genre => {
          genreWeights.set(genre, (genreWeights.get(genre) || 0) + engagementScore);
        });

        if (media.director) {
          directorWeights.set(
            media.director,
            (directorWeights.get(media.director) || 0) + engagementScore * 0.5,
          );
        }
      });

      const candidates = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: {
          rating: 'DESC',
          viewCount: 'DESC',
          createdAt: 'DESC',
        },
        take: 120,
      });

      const recommendations = candidates
        .filter(candidate => !watchedIds.has(candidate.id))
        .map(candidate => ({
          media: candidate,
          score: this.calculateRecommendationScore(
            candidate,
            typeWeights,
            genreWeights,
            directorWeights,
          ),
        }))
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.media.rating - a.media.rating ||
            b.media.viewCount - a.media.viewCount,
        )
        .slice(0, limit)
        .map(item => item.media);

      await this.cacheManager.set(cacheKey, recommendations, 300000);
      this.logger.log(`缓存个性化推荐: ${cacheKey}`);

      return recommendations;
    } catch (error: unknown) {
      this.logger.error(
        `获取个性化推荐失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      return this.getTrendingRecommendations(limit);
    }
  }

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
          createdAt: 'DESC',
        },
        take: limit,
      });

      // 缓存结果（5分钟）
      await this.cacheManager.set(cacheKey, trendingMedia, 300000);
      this.logger.log(`缓存热门推荐: ${cacheKey}`);

      return trendingMedia;
    } catch (error: unknown) {
      this.logger.error(`获取热门推荐失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
    } catch (error: unknown) {
      this.logger.error(`获取最新推荐失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
    } catch (error: unknown) {
      this.logger.error(`获取高分推荐失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
    } catch (error: unknown) {
      this.logger.error(`清理推荐缓存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private calculateEngagementScore(history: WatchHistory): number {
    const progressPercentage = history.progress?.percentage || 0;
    const completedBonus = history.isCompleted ? 2 : 0;
    const playCountBonus = Math.min(history.playCount, 3) * 0.5;

    return 1 + progressPercentage / 100 + completedBonus + playCountBonus;
  }

  private calculateRecommendationScore(
    media: MediaResource,
    typeWeights: Map<string, number>,
    genreWeights: Map<string, number>,
    directorWeights: Map<string, number>,
  ): number {
    let score = 0;

    score += typeWeights.get(media.type) || 0;

    media.genres?.forEach(genre => {
      score += genreWeights.get(genre) || 0;
    });

    if (media.director) {
      score += directorWeights.get(media.director) || 0;
    }

    score += media.rating * 1.5;
    score += Math.min(media.viewCount / 1000, 10);

    return score;
  }
}
