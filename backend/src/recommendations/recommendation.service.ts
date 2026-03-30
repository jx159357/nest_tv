import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { Recommendation } from '../entities/recommendation.entity';
import { WatchHistory } from '../entities/watch-history.entity';

interface WeightedPreference {
  key: string;
  score: number;
}

export interface RecommendationProfile {
  strategy: 'history-based' | 'fallback-trending';
  totalWatched: number;
  completedCount: number;
  recentWatchCount: number;
  averageCompletionRate: number;
  favoriteTypes: WeightedPreference[];
  favoriteGenres: WeightedPreference[];
  favoriteDirectors: WeightedPreference[];
}

export interface PersonalizedRecommendationItem {
  media: MediaResource;
  score: number;
  reasons: string[];
}

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

  async getPersonalizedRecommendations(
    userId: number,
    limit: number = 10,
  ): Promise<MediaResource[]> {
    const items = await this.getPersonalizedRecommendationItems(userId, limit);
    return items.map(item => item.media);
  }

  async getPersonalizedRecommendationItems(
    userId: number,
    limit: number = 10,
  ): Promise<PersonalizedRecommendationItem[]> {
    const cacheKey = `personalized_recommendation_items_${userId}_${limit}`;

    try {
      const cached = await this.cacheManager.get<PersonalizedRecommendationItem[]>(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit: ${cacheKey}`);
        return cached;
      }

      const histories = await this.watchHistoryRepository.find({
        where: { userId },
        relations: ['mediaResource'],
        order: { updatedAt: 'DESC' },
        take: 60,
      });

      const profile = this.buildRecommendationProfile(histories);
      if (profile.strategy === 'fallback-trending') {
        const fallback = await this.getTrendingRecommendations(limit);
        const items = fallback.map(media => ({
          media,
          score: this.calculateBaseQualityScore(media),
          reasons: ['你最近观看数据较少，先为你展示站内热门内容'],
        }));

        await this.cacheManager.set(cacheKey, items, 300000);
        return items;
      }

      const watchedIds = new Set(
        histories
          .map(history => history.mediaResource?.id)
          .filter((id): id is number => typeof id === 'number'),
      );

      const typeWeights = this.toWeightMap(profile.favoriteTypes);
      const genreWeights = this.toWeightMap(profile.favoriteGenres);
      const directorWeights = this.toWeightMap(profile.favoriteDirectors);

      const candidates = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: {
          rating: 'DESC',
          viewCount: 'DESC',
          createdAt: 'DESC',
        },
        take: 160,
      });

      const items = candidates
        .filter(candidate => !watchedIds.has(candidate.id))
        .map(candidate => {
          const reasons = this.buildRecommendationReasons(
            candidate,
            profile,
            typeWeights,
            genreWeights,
            directorWeights,
          );

          return {
            media: candidate,
            score: this.calculateRecommendationScore(
              candidate,
              typeWeights,
              genreWeights,
              directorWeights,
            ),
            reasons,
          };
        })
        .sort(
          (left, right) =>
            right.score - left.score ||
            right.media.rating - left.media.rating ||
            right.media.viewCount - left.media.viewCount,
        );

      const selectedItems = this.applyDiversityLimit(items, limit);
      await this.cacheManager.set(cacheKey, selectedItems, 300000);
      this.logger.log(`Cache set: ${cacheKey}`);

      return selectedItems;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get personalized recommendation items: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      const fallback = await this.getTrendingRecommendations(limit);
      return fallback.map(media => ({
        media,
        score: this.calculateBaseQualityScore(media),
        reasons: ['推荐服务暂时回退到热门内容'],
      }));
    }
  }

  async getRecommendationProfile(userId: number): Promise<RecommendationProfile> {
    const cacheKey = `recommendation_profile_${userId}`;

    try {
      const cached = await this.cacheManager.get<RecommendationProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      const histories = await this.watchHistoryRepository.find({
        where: { userId },
        relations: ['mediaResource'],
        order: { updatedAt: 'DESC' },
        take: 60,
      });

      const profile = this.buildRecommendationProfile(histories);
      await this.cacheManager.set(cacheKey, profile, 300000);
      return profile;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get recommendation profile: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        strategy: 'fallback-trending',
        totalWatched: 0,
        completedCount: 0,
        recentWatchCount: 0,
        averageCompletionRate: 0,
        favoriteTypes: [],
        favoriteGenres: [],
        favoriteDirectors: [],
      };
    }
  }

  async getTrendingRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `trending_recommendations_${limit}`;

    try {
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`Cache hit: ${cacheKey}`);
        return cachedRecommendations;
      }

      const trendingMedia = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: {
          viewCount: 'DESC',
          rating: 'DESC',
          createdAt: 'DESC',
        },
        take: limit,
      });

      await this.cacheManager.set(cacheKey, trendingMedia, 300000);
      this.logger.log(`Cache set: ${cacheKey}`);

      return trendingMedia;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get trending recommendations: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return [];
    }
  }

  async getLatestRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `latest_recommendations_${limit}`;

    try {
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`Cache hit: ${cacheKey}`);
        return cachedRecommendations;
      }

      const latestMedia = await this.mediaResourceRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      await this.cacheManager.set(cacheKey, latestMedia, 180000);
      this.logger.log(`Cache set: ${cacheKey}`);

      return latestMedia;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get latest recommendations: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return [];
    }
  }

  async getTopRatedRecommendations(limit: number = 10): Promise<MediaResource[]> {
    const cacheKey = `top_rated_recommendations_${limit}`;

    try {
      const cachedRecommendations = await this.cacheManager.get<MediaResource[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.log(`Cache hit: ${cacheKey}`);
        return cachedRecommendations;
      }

      const topRatedMedia = await this.mediaResourceRepository
        .createQueryBuilder('media')
        .where('media.isActive = :isActive', { isActive: true })
        .andWhere('media.rating >= :minRating', { minRating: 7 })
        .orderBy('media.rating', 'DESC')
        .addOrderBy('media.viewCount', 'DESC')
        .addOrderBy('media.createdAt', 'DESC')
        .take(limit)
        .getMany();

      await this.cacheManager.set(cacheKey, topRatedMedia, 600000);
      this.logger.log(`Cache set: ${cacheKey}`);

      return topRatedMedia;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get top-rated recommendations: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return [];
    }
  }

  async clearRecommendationsCache(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.log('Recommendation cache cleared');
    } catch (error: unknown) {
      this.logger.error(
        `Failed to clear recommendation cache: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private buildRecommendationProfile(histories: WatchHistory[]): RecommendationProfile {
    const validHistories = histories.filter(
      history => history.mediaResource?.id && history.mediaResource.isActive,
    );
    if (validHistories.length === 0) {
      return {
        strategy: 'fallback-trending',
        totalWatched: 0,
        completedCount: 0,
        recentWatchCount: 0,
        averageCompletionRate: 0,
        favoriteTypes: [],
        favoriteGenres: [],
        favoriteDirectors: [],
      };
    }

    const typeWeights = new Map<string, number>();
    const genreWeights = new Map<string, number>();
    const directorWeights = new Map<string, number>();
    let completionRateSum = 0;
    let completedCount = 0;
    let recentWatchCount = 0;

    validHistories.forEach(history => {
      const media = history.mediaResource;
      if (!media) {
        return;
      }

      const engagementScore = this.calculateEngagementScore(history);
      const recencyWeight = this.calculateRecencyWeight(history.updatedAt || history.createdAt);
      const weightedScore = engagementScore * recencyWeight;

      typeWeights.set(media.type, (typeWeights.get(media.type) || 0) + weightedScore * 3);

      media.genres?.forEach(genre => {
        genreWeights.set(genre, (genreWeights.get(genre) || 0) + weightedScore);
      });

      if (media.director) {
        directorWeights.set(
          media.director,
          (directorWeights.get(media.director) || 0) + weightedScore * 0.8,
        );
      }

      completionRateSum += history.progress?.percentage || 0;
      if (history.isCompleted) {
        completedCount += 1;
      }
      if (recencyWeight >= 0.8) {
        recentWatchCount += 1;
      }
    });

    return {
      strategy: 'history-based',
      totalWatched: validHistories.length,
      completedCount,
      recentWatchCount,
      averageCompletionRate: Math.round(completionRateSum / Math.max(validHistories.length, 1)),
      favoriteTypes: this.toSortedPreferences(typeWeights, 3),
      favoriteGenres: this.toSortedPreferences(genreWeights, 5),
      favoriteDirectors: this.toSortedPreferences(directorWeights, 3),
    };
  }

  private calculateEngagementScore(history: WatchHistory): number {
    const progressPercentage = history.progress?.percentage || 0;
    const completedBonus = history.isCompleted ? 2 : 0;
    const playCountBonus = Math.min(history.playCount, 3) * 0.5;
    const watchDurationBonus = Math.min((history.watchDuration || 0) / 1800, 2);

    return 1 + progressPercentage / 100 + completedBonus + playCountBonus + watchDurationBonus;
  }

  private calculateRecencyWeight(date?: Date): number {
    if (!date) {
      return 0.7;
    }

    const daysSince = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 3) {
      return 1.2;
    }
    if (daysSince <= 14) {
      return 1;
    }
    if (daysSince <= 30) {
      return 0.85;
    }
    return 0.7;
  }

  private calculateBaseQualityScore(media: MediaResource): number {
    return media.rating * 2 + Math.min(media.viewCount / 1000, 10);
  }

  private calculateFreshnessBonus(media: MediaResource): number {
    if (!media.releaseDate) {
      return 0;
    }

    const daysSinceRelease =
      (Date.now() - new Date(media.releaseDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease <= 60) {
      return 3;
    }
    if (daysSinceRelease <= 180) {
      return 1.5;
    }
    return 0;
  }

  private calculateRecommendationScore(
    media: MediaResource,
    typeWeights: Map<string, number>,
    genreWeights: Map<string, number>,
    directorWeights: Map<string, number>,
  ): number {
    let score = this.calculateBaseQualityScore(media) + this.calculateFreshnessBonus(media);

    score += typeWeights.get(media.type) || 0;

    media.genres?.forEach(genre => {
      score += genreWeights.get(genre) || 0;
    });

    if (media.director) {
      score += directorWeights.get(media.director) || 0;
    }

    return score;
  }

  private buildRecommendationReasons(
    media: MediaResource,
    profile: RecommendationProfile,
    typeWeights: Map<string, number>,
    genreWeights: Map<string, number>,
    directorWeights: Map<string, number>,
  ): string[] {
    const reasons: string[] = [];

    if ((typeWeights.get(media.type) || 0) > 0) {
      reasons.push(`匹配你最近偏好的 ${media.type} 类型`);
    }

    const matchingGenres = (media.genres || []).filter(genre => (genreWeights.get(genre) || 0) > 0);
    if (matchingGenres.length > 0) {
      reasons.push(`命中偏好标签：${matchingGenres.slice(0, 2).join(' / ')}`);
    }

    if (media.director && (directorWeights.get(media.director) || 0) > 0) {
      reasons.push(`导演偏好相关：${media.director}`);
    }

    if (media.rating >= 8) {
      reasons.push(`高评分 ${media.rating.toFixed(1)}`);
    }

    if (reasons.length === 0 && profile.averageCompletionRate >= 70) {
      reasons.push('基于你近期较高完成度的观看偏好推荐');
    }

    return reasons.slice(0, 3);
  }

  private applyDiversityLimit(
    items: PersonalizedRecommendationItem[],
    limit: number,
  ): PersonalizedRecommendationItem[] {
    const selected: PersonalizedRecommendationItem[] = [];
    const typeCounter = new Map<string, number>();

    for (const item of items) {
      const currentCount = typeCounter.get(item.media.type) || 0;
      if (currentCount >= 3 && selected.length + 1 < limit) {
        continue;
      }

      selected.push(item);
      typeCounter.set(item.media.type, currentCount + 1);

      if (selected.length >= limit) {
        break;
      }
    }

    return selected.slice(0, limit);
  }

  private toSortedPreferences(weights: Map<string, number>, limit: number): WeightedPreference[] {
    return [...weights.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
      .map(([key, score]) => ({
        key,
        score: Math.round(score * 10) / 10,
      }));
  }

  private toWeightMap(items: WeightedPreference[]): Map<string, number> {
    return new Map(items.map(item => [item.key, item.score]));
  }
}
