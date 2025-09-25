import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThan } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { MediaType, MediaQuality } from '../entities/media-resource.entity';
import { MediaResourceService } from '../media/media-resource.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(MediaResource)
    private readonly mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepository: Repository<WatchHistory>,
    private readonly mediaResourceService: MediaResourceService,
  ) {}

  /**
   * 获取热门推荐
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  async getTrendingRecommendations(limit: number = 10): Promise<Recommendation[]> {
    // 获取热门影视资源
    const popularMedia = await this.mediaResourceService.getPopular(limit * 2);

    // 为每个推荐项创建推荐记录
    const recommendations: Recommendation[] = [];
    for (let i = 0; i < Math.min(popularMedia.length, limit); i++) {
      const media = popularMedia[i];
      const recommendation = this.recommendationRepository.create({
        userId: 0, // 通用推荐
        mediaResourceId: media.id,
        type: 'trending',
        score: media.viewCount,
        priority: i + 1,
        metadata: {
          reason: '热门影视内容',
          algorithm: 'popularity-based',
        },
      });
      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * 获取编辑推荐
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  async getEditorialRecommendations(limit: number = 10): Promise<Recommendation[]> {
    // 查找编辑推荐（手动标记的推荐）
    const editorialRecommendations = await this.recommendationRepository.find({
      where: {
        type: 'editorial',
        isActive: true,
      },
      order: {
        priority: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
    });

    return editorialRecommendations;
  }

  /**
   * 获取用户的推荐列表
   * @param userId 用户ID
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  async getUserRecommendations(userId: number, limit: number = 10): Promise<Recommendation[]> {
    // 先尝试获取个性化推荐
    let recommendations = await this.recommendationRepository.find({
      where: {
        userId,
        isActive: true,
        type: 'personalized',
        expiresAt: MoreThan(new Date()),
      },
      order: {
        priority: 'ASC',
        score: 'DESC',
      },
      take: limit,
    });

    // 如果个性化推荐不足，补充热门推荐
    if (recommendations.length < limit) {
      const trending = await this.getTrendingRecommendations(limit - recommendations.length);
      recommendations = [...recommendations, ...trending];
    }

    return recommendations;
  }

  /**
   * 获取推荐详情
   * @param recommendationId 推荐ID
   * @returns 推荐详情
   */
  async getRecommendationDetail(recommendationId: number): Promise<Recommendation> {
    const recommendation = await this.recommendationRepository.findOne({
      where: { id: recommendationId },
      relations: ['user', 'mediaResource'],
    });

    if (!recommendation) {
      throw new NotFoundException('推荐记录不存在');
    }

    return recommendation;
  }

  /**
   * 计算类型偏好
   * @param watchedMedia 观看过的影视资源
   * @returns 类型偏好统计
   */
  private calculateTypePreferences(watchedMedia: MediaResource[]): Record<string, number> {
    const typeCount: Record<string, number> = {};

    watchedMedia.forEach(media => {
      if (typeCount[media.type]) {
        typeCount[media.type]++;
      } else {
        typeCount[media.type] = 1;
      }
    });

    return typeCount;
  }

  /**
   * 根据类型偏好查找相似影视资源
   * @param typePreferences 类型偏好
   * @param excludeIds 排除的ID列表
   * @param limit 数量限制
   * @returns 相似影视资源列表
   */
  private async findSimilarMediaByType(
    typePreferences: Record<string, number>,
    excludeIds: number[],
    limit: number,
  ): Promise<MediaResource[]> {
    // 获取偏好最高的类型
    const preferredTypes = Object.keys(typePreferences)
      .sort((a, b) => typePreferences[b] - typePreferences[a])
      .slice(0, 3); // 取前3个偏好类型

    // 查找这些类型的高评分影视资源
    const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');

    queryBuilder
      .where('media.type IN (:...types)', { types: preferredTypes })
      .andWhere('media.isActive = :isActive', { isActive: true })
      .andWhere('media.rating >= :minRating', { minRating: 7.0 })
      .andWhere('media.id NOT IN (:...excludeIds)', { excludeIds })
      .orderBy('media.rating', 'DESC')
      .addOrderBy('media.viewCount', 'DESC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  /**
   * 计算推荐得分
   * @param media 影视资源
   * @param typePreferences 类型偏好
   * @returns 推荐得分
   */
  private calculateRecommendationScore(
    media: MediaResource,
    typePreferences: Record<string, number>,
  ): number {
    // 基础得分：评分 * 10
    let score = media.rating * 10;

    // 类型偏好加成
    if (typePreferences[media.type]) {
      score += typePreferences[media.type] * 5;
    }

    // 观看次数加成
    score += Math.log(media.viewCount + 1) * 2;

    return Math.min(score, 100); // 最高100分
  }

  /**
   * 为用户生成个性化推荐
   */
  async generatePersonalizedRecommendations(
    userId: number,
    limit: number = 10,
  ): Promise<Recommendation[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['watchHistory', 'favorites'],
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 清除过期的推荐
    await this.cleanupExpiredRecommendations(userId);

    // 获取现有推荐数量
    const existingCount = await this.recommendationRepository.count({
      where: { userId, isActive: true },
    });

    // 如果现有推荐不足，生成新的推荐
    if (existingCount < limit) {
      await this.generateNewRecommendations(user, limit - existingCount);
    }

    // 获取推荐列表
    return this.recommendationRepository.find({
      where: { userId, isActive: true },
      relations: ['mediaResource'],
      order: { priority: 'ASC', score: 'DESC' },
      take: limit,
    });
  }

  /**
   * 基于内容的推荐
   */
  async generateContentBasedRecommendations(
    userId: number,
    limit: number = 5,
  ): Promise<MediaResource[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['watchHistory', 'favorites'],
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 获取用户观看历史和收藏的影视资源
    const watchedMedia = user.watchHistory.map(h => h.mediaResource);
    const favoriteMedia = user.favorites;
    const allUserMedia = [...watchedMedia, ...favoriteMedia];

    // 提取用户偏好的类型、导演、演员等特征
    const userPreferences = this.extractUserPreferences(allUserMedia);

    // 基于偏好找到相似的影视资源
    const recommendations = await this.findSimilarMedia(userPreferences, allUserMedia, limit);

    return recommendations;
  }

  /**
   * 协同过滤推荐
   */
  async generateCollaborativeRecommendations(
    userId: number,
    limit: number = 5,
  ): Promise<MediaResource[]> {
    // 找到相似用户
    const similarUsers = await this.findSimilarUsers(userId);

    if (similarUsers.length === 0) {
      return [];
    }

    // 获取相似用户喜欢的影视资源
    const similarUserMedia = await this.getSimilarUserMedia(similarUsers, userId);

    // 按相似度排序并返回推荐
    return similarUserMedia.slice(0, limit);
  }

  /**
   * 记录用户对推荐的反馈
   */
  async recordRecommendationFeedback(
    userId: number,
    mediaResourceId: number,
    feedback: 'click' | 'like' | 'dislike',
  ): Promise<void> {
    const recommendation = await this.recommendationRepository.findOne({
      where: { userId, mediaResourceId },
    });

    if (recommendation) {
      // 根据反馈调整推荐得分
      switch (feedback) {
        case 'click':
          recommendation.score += 5;
          break;
        case 'like':
          recommendation.score += 10;
          break;
        case 'dislike':
          recommendation.score -= 20;
          recommendation.isActive = false;
          break;
      }

      await this.recommendationRepository.save(recommendation);
    }
  }

  /**
   * 清除过期的推荐
   */
  private async cleanupExpiredRecommendations(userId: number): Promise<void> {
    const now = new Date();
    await this.recommendationRepository.delete({
      userId,
      expiresAt: LessThan(now),
    });
  }

  /**
   * 生成新的推荐
   */
  private async generateNewRecommendations(user: User, count: number): Promise<void> {
    const recommendations: Recommendation[] = [];

    // 生成内容推荐
    const contentRecs = await this.generateContentBasedRecommendations(
      user.id,
      Math.ceil(count / 2),
    );
    contentRecs.forEach((media, index) => {
      recommendations.push(
        this.createRecommendation(user, media, 'content', 80 - index, 1 + index),
      );
    });

    // 生成协同过滤推荐
    const collabRecs = await this.generateCollaborativeRecommendations(
      user.id,
      Math.ceil(count / 2),
    );
    collabRecs.forEach((media, index) => {
      recommendations.push(
        this.createRecommendation(user, media, 'collaborative', 70 - index, 10 + index),
      );
    });

    // 生成热门推荐
    if (recommendations.length < count) {
      const trendingRecs = await this.getTrendingRecommendations(count - recommendations.length);
      trendingRecs.forEach((rec, index) => {
        recommendations.push(
          this.createRecommendation(user, rec.mediaResource, 'trending', 60 - index, 20 + index),
        );
      });
    }

    // 保存推荐
    await this.recommendationRepository.save(recommendations);
  }

  /**
   * 创建推荐记录
   */
  private createRecommendation(
    user: User,
    media: MediaResource,
    type: string,
    score: number,
    priority: number,
  ): Recommendation {
    const recommendation = new Recommendation();
    recommendation.user = user;
    recommendation.mediaResource = media;
    recommendation.type = type as any;
    recommendation.score = score;
    recommendation.priority = priority;
    recommendation.isActive = true;
    recommendation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
    recommendation.metadata = {
      reason: this.getRecommendationReason(type),
      algorithm: 'hybrid',
    };

    return recommendation;
  }

  /**
   * 提取用户偏好
   */
  private extractUserPreferences(mediaList: MediaResource[]): any {
    const preferences = {
      genres: new Map<string, number>(),
      directors: new Map<string, number>(),
      actors: new Map<string, number>(),
      types: new Map<string, number>(),
      qualities: new Map<string, number>(),
    };

    mediaList.forEach(media => {
      // 统计类型偏好
      media.genres?.forEach(genre => {
        preferences.genres.set(genre, (preferences.genres.get(genre) || 0) + 1);
      });

      // 统计导演偏好
      if (media.director) {
        preferences.directors.set(
          media.director,
          (preferences.directors.get(media.director) || 0) + 1,
        );
      }

      // 统计演员偏好
      media.actors?.split(',')?.forEach(actor => {
        const trimmedActor = actor.trim();
        if (trimmedActor) {
          preferences.actors.set(trimmedActor, (preferences.actors.get(trimmedActor) || 0) + 1);
        }
      });

      // 统计影视类型偏好
      preferences.types.set(media.type, (preferences.types.get(media.type) || 0) + 1);

      // 统计质量偏好
      preferences.qualities.set(media.quality, (preferences.qualities.get(media.quality) || 0) + 1);
    });

    return preferences;
  }

  /**
   * 找到相似影视资源
   */
  private async findSimilarMedia(
    preferences: any,
    excludeMedia: MediaResource[],
    limit: number,
  ): Promise<MediaResource[]> {
    const excludeIds = excludeMedia.map(m => m.id);

    // 构建查询条件
    const queryBuilder = this.mediaResourceRepository
      .createQueryBuilder('media')
      .where('media.isActive = :isActive', { isActive: true })
      .andWhere('media.id NOT IN (:...excludeIds)', { excludeIds });

    // 根据用户偏好添加查询条件
    const topGenres = Array.from(preferences.genres.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    if (topGenres.length > 0) {
      queryBuilder.andWhere('media.genres && :genres', { genres: topGenres });
    }

    // 按评分和观看次数排序
    queryBuilder.orderBy('media.rating', 'DESC').addOrderBy('media.viewCount', 'DESC').take(limit);

    return queryBuilder.getMany();
  }

  /**
   * 找到相似用户
   */
  private async findSimilarUsers(userId: number): Promise<User[]> {
    // 获取目标用户的观看历史
    const userHistory = await this.watchHistoryRepository.find({
      where: { userId },
      relations: ['mediaResource'],
    });

    const userMediaIds = userHistory.map(h => h.mediaResource.id);

    if (userMediaIds.length === 0) {
      return [];
    }

    // 找到观看过相同影视的用户
    const similarUsers = await this.watchHistoryRepository
      .createQueryBuilder('history')
      .select('history.userId', 'userId')
      .addSelect('COUNT(*)', 'commonCount')
      .where('history.mediaResourceId IN (:...mediaIds)', { mediaIds: userMediaIds })
      .andWhere('history.userId != :userId', { userId })
      .groupBy('history.userId')
      .having('COUNT(*) > 0')
      .orderBy('COUNT(*)', 'DESC')
      .take(10)
      .getRawMany();

    if (similarUsers.length === 0) {
      return [];
    }

    // 获取用户详情
    const userIds = similarUsers.map(u => u.userId);
    return this.userRepository.findByIds(userIds);
  }

  /**
   * 获取相似用户的媒体资源
   */
  private async getSimilarUserMedia(
    similarUsers: User[],
    excludeUserId: number,
  ): Promise<MediaResource[]> {
    const userIds = similarUsers.map(u => u.id);

    // 获取相似用户观看过但目标用户未观看的影视资源
    const similarUserMedia = await this.watchHistoryRepository
      .createQueryBuilder('history')
      .select('DISTINCT history.mediaResourceId', 'mediaResourceId')
      .where('history.userId IN (:...userIds)', { userIds })
      .andWhere(
        'history.mediaResourceId NOT IN (SELECT h.mediaResourceId FROM watch_history h WHERE h.userId = :excludeUserId)',
        { excludeUserId },
      )
      .getRawMany();

    if (similarUserMedia.length === 0) {
      return [];
    }

    const mediaIds = similarUserMedia.map(m => m.mediaResourceId);
    return this.mediaResourceRepository.findByIds(mediaIds);
  }

  /**
   * 获取推荐理由
   */
  private getRecommendationReason(type: string): string {
    switch (type) {
      case 'content':
        return '基于您的观看历史推荐';
      case 'collaborative':
        return '基于相似用户的喜好推荐';
      case 'trending':
        return '热门推荐';
      case 'editorial':
        return '编辑精选';
      default:
        return '个性化推荐';
    }
  }

  /**
   * 获取类型显示名称
   * @param type 类型
   * @returns 显示名称
   */
  private getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };

    return typeMap[type] || type;
  }
}
