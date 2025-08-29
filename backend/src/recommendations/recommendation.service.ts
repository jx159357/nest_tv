import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { MediaResourceService } from '../media/media-resource.service';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Recommendation)
    private recommendationRepository: Repository<Recommendation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
    private mediaResourceService: MediaResourceService,
  ) {}

  /**
   * 生成个性化推荐
   * @param userId 用户ID
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  async generatePersonalizedRecommendations(userId: number, limit: number = 10): Promise<Recommendation[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['watchHistory', 'favorites'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取用户观看历史和收藏
    const watchedMediaIds = user.watchHistory?.map(history => history.mediaResourceId) || [];
    const favoritedMediaIds = user.favorites?.map(media => media.id) || [];
    const allViewedMediaIds = [...new Set([...watchedMediaIds, ...favoritedMediaIds])];

    // 查找用户观看过的影视资源类型偏好
    const watchedMedia = await this.mediaResourceRepository.findByIds(watchedMediaIds);
    const typePreferences = this.calculateTypePreferences(watchedMedia);

    // 查找用户可能喜欢的相似类型影视资源
    const similarMedia = await this.findSimilarMediaByType(typePreferences, allViewedMediaIds, limit * 2);

    // 为每个推荐项创建推荐记录
    const recommendations: Recommendation[] = [];
    for (let i = 0; i < Math.min(similarMedia.length, limit); i++) {
      const media = similarMedia[i];
      const recommendation = this.recommendationRepository.create({
        userId,
        mediaResourceId: media.id,
        type: 'personalized',
        score: this.calculateRecommendationScore(media, typePreferences),
        priority: i + 1,
        metadata: {
          reason: `基于您观看过的${this.getTypeDisplayName(media.type)}类型内容推荐`,
          algorithm: 'content-based-filtering',
          category: media.type,
        },
      });
      recommendations.push(recommendation);
    }

    // 保存推荐记录
    await this.recommendationRepository.save(recommendations);
    return recommendations;
  }

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
  private calculateRecommendationScore(media: MediaResource, typePreferences: Record<string, number>): number {
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
   * 获取类型显示名称
   * @param type 类型
   * @returns 显示名称
   */
  private getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'movie': '电影',
      'tv_series': '电视剧',
      'variety': '综艺',
      'anime': '动漫',
      'documentary': '纪录片',
    };
    
    return typeMap[type] || type;
  }
}