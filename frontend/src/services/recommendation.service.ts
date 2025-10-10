import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { mediaApi } from '@/api';
import type { MediaResource, Recommendation, RecommendationType } from '@/types';

export const useRecommendationService = () => {
  const authStore = useAuthStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const recommendations = ref<Recommendation[]>([]);
  const personalizedMedia = ref<MediaResource[]>([]);

  // 基于用户观看历史生成推荐
  const generatePersonalizedRecommendations = async (limit: number = 10) => {
    if (!authStore.isAuthenticated) {
      return [];
    }

    try {
      isLoading.value = true;
      error.value = null;

      // 获取用户观看历史
      const watchHistory = await mediaApi.getWatchHistory({ limit: 20 });

      // 获取用户收藏
      const favorites = await mediaApi.getFavorites({ limit: 20 });

      // 提取用户偏好的类型和标签
      const userPreferences = analyzeUserPreferences([...watchHistory, ...favorites]);

      // 基于偏好获取推荐
      const recommendedMedia = await mediaApi.getRecommendedMedia({
        limit,
        type: userPreferences.preferredTypes,
      });

      personalizedMedia.value = recommendedMedia;
      return recommendedMedia;
    } catch (err) {
      console.error('生成个性化推荐失败:', err);
      error.value = '获取推荐失败';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 分析用户偏好
  const analyzeUserPreferences = (mediaList: any[]) => {
    const typeCount: Record<string, number> = {};
    const genreCount: Record<string, number> = {};
    const ratingSum: Record<string, number> = {};
    const ratingCount: Record<string, number> = {};

    mediaList.forEach(media => {
      // 统计类型偏好
      if (media.type) {
        typeCount[media.type] = (typeCount[media.type] || 0) + 1;
      }

      // 统计类型偏好
      if (media.genres) {
        media.genres.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }

      // 统计评分偏好
      if (media.rating) {
        const type = media.type;
        ratingSum[type] = (ratingSum[type] || 0) + media.rating;
        ratingCount[type] = (ratingCount[type] || 0) + 1;
      }
    });

    // 找出最偏好的类型
    const preferredTypes = Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // 找出最偏好的类型
    const preferredGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // 计算平均评分偏好
    const avgRatingByType: Record<string, number> = {};
    Object.keys(ratingSum).forEach(type => {
      avgRatingByType[type] = ratingSum[type] / ratingCount[type];
    });

    return {
      preferredTypes,
      preferredGenres,
      avgRatingByType,
      totalWatched: mediaList.length,
    };
  };

  // 获取相似推荐
  const getSimilarMedia = async (mediaId: string, limit: number = 8) => {
    try {
      const media = await mediaApi.getMediaById(mediaId);

      // 基于当前媒体的特征获取相似内容
      const similarMedia = await mediaApi.getMediaByType(media.type, {
        limit,
        minRating: Math.max(0, (media.rating || 0) - 1),
        sortBy: 'rating',
        sortOrder: 'DESC',
      });

      return similarMedia.filter(m => m.id !== parseInt(mediaId));
    } catch (err) {
      console.error('获取相似媒体失败:', err);
      return [];
    }
  };

  // 获取趋势内容
  const getTrendingMedia = async (limit: number = 10) => {
    try {
      const trending = await mediaApi.getPopularMedia(limit, {
        sortBy: 'viewCount',
        sortOrder: 'DESC',
      });
      return trending;
    } catch (err) {
      console.error('获取趋势内容失败:', err);
      return [];
    }
  };

  // 计算推荐分数
  const calculateRecommendationScore = (
    media: MediaResource,
    userPreferences: ReturnType<typeof analyzeUserPreferences>,
  ) => {
    let score = 0;

    // 类型匹配分数 (40%)
    if (userPreferences.preferredTypes.includes(media.type)) {
      score += 40;
    }

    // 类型匹配分数 (30%)
    if (media.genres) {
      const matchingGenres = media.genres.filter(genre =>
        userPreferences.preferredGenres.includes(genre),
      );
      score += (matchingGenres.length / Math.max(1, userPreferences.preferredGenres.length)) * 30;
    }

    // 评分匹配分数 (20%)
    if (media.rating && userPreferences.avgRatingByType[media.type]) {
      const ratingDiff = Math.abs(media.rating - userPreferences.avgRatingByType[media.type]);
      score += Math.max(0, 20 - ratingDiff * 5);
    }

    // 观看次数分数 (10%)
    if (media.viewCount) {
      score += Math.min(10, Math.log10(media.viewCount + 1));
    }

    return score;
  };

  // 生成推荐理由
  const generateRecommendationReason = (
    media: MediaResource,
    userPreferences: ReturnType<typeof analyzeUserPreferences>,
    type: RecommendationType,
  ) => {
    const reasons = [];

    switch (type) {
      case 'personalized':
        if (userPreferences.preferredTypes.includes(media.type)) {
          reasons.push(`根据您喜欢的${media.type}类型推荐`);
        }
        if (media.genres && media.genres.some(g => userPreferences.preferredGenres.includes(g))) {
          reasons.push(
            `包含您偏好的${media.genres.find(g => userPreferences.preferredGenres.includes(g))}类型`,
          );
        }
        if (media.rating && media.rating >= 8) {
          reasons.push('高评分内容');
        }
        break;

      case 'similar':
        reasons.push('与您观看的内容相似');
        break;

      case 'trending':
        reasons.push('热门推荐');
        break;

      case 'popular':
        reasons.push('受欢迎内容');
        break;
    }

    return reasons.join('，') || '为您推荐';
  };

  // 深度学习推荐算法（简化版）
  const mlRecommendation = async (limit: number = 10) => {
    if (!authStore.isAuthenticated) {
      return [];
    }

    try {
      // 获取用户历史数据
      const userHistory = await mediaApi.getWatchHistory({ limit: 50 });
      const userFavorites = await mediaApi.getFavorites({ limit: 30 });

      // 构建用户画像
      const userProfile = {
        watchedTypes: {} as Record<string, number>,
        watchedGenres: {} as Record<string, number>,
        avgWatchTime: 0,
        completionRate: 0,
        ratingTrend: 'stable' as 'increasing' | 'stable' | 'decreasing',
      };

      // 分析用户画像
      userHistory.forEach((item: any) => {
        if (item.mediaResource?.type) {
          userProfile.watchedTypes[item.mediaResource.type] =
            (userProfile.watchedTypes[item.mediaResource.type] || 0) + 1;
        }
        if (item.mediaResource?.genres) {
          item.mediaResource.genres.forEach((genre: string) => {
            userProfile.watchedGenres[genre] = (userProfile.watchedGenres[genre] || 0) + 1;
          });
        }

        // 计算观看完成度
        if (item.duration && item.currentTime) {
          userProfile.completionRate += item.currentTime / item.duration;
        }
      });

      userProfile.completionRate /= userHistory.length;
      userProfile.avgWatchTime =
        userHistory.reduce((sum: number, item: any) => sum + (item.currentTime || 0), 0) /
        userHistory.length;

      // 获取候选媒体
      const candidateMedia = await mediaApi.getMediaList({ limit: 100 });

      // 计算推荐分数
      const scoredMedia = candidateMedia.map(media => {
        const score = calculateMLScore(media, userProfile);
        return { ...media, score };
      });

      // 返回最高分的媒体
      return scoredMedia
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...media }) => media);
    } catch (err) {
      console.error('ML推荐失败:', err);
      return [];
    }
  };

  // ML分数计算
  const calculateMLScore = (media: MediaResource, userProfile: any) => {
    let score = 0;

    // 类型权重 (30%)
    const typeScore = userProfile.watchedTypes[media.type] || 0;
    score +=
      (typeScore /
        Math.max(
          1,
          Object.values(userProfile.watchedTypes).reduce((a, b) => a + b, 0),
        )) *
      30;

    // 类型权重 (25%)
    if (media.genres) {
      const genreScore = media.genres.reduce(
        (sum, genre) => sum + (userProfile.watchedGenres[genre] || 0),
        0,
      );
      const totalGenreViews = Object.values(userProfile.watchedGenres).reduce((a, b) => a + b, 0);
      score += (genreScore / Math.max(1, totalGenreViews)) * 25;
    }

    // 评分权重 (20%)
    if (media.rating) {
      score += Math.min(20, media.rating * 2);
    }

    // 观看完成度匹配 (15%)
    if (userProfile.completionRate > 0.7 && media.duration) {
      // 为观看完成度高的用户推荐较长内容
      score += media.duration > 120 ? 15 : 5;
    } else if (userProfile.completionRate < 0.3 && media.duration) {
      // 为观看完成度低的用户推荐较短内容
      score += media.duration < 60 ? 15 : 5;
    }

    // 新鲜度权重 (10%)
    const daysSinceCreated =
      (Date.now() - new Date(media.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score += 10;
    } else if (daysSinceCreated < 90) {
      score += 5;
    }

    return score;
  };

  return {
    // 状态
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    recommendations: computed(() => recommendations.value),
    personalizedMedia: computed(() => personalizedMedia.value),

    // 方法
    generatePersonalizedRecommendations,
    getSimilarMedia,
    getTrendingMedia,
    mlRecommendation,
    analyzeUserPreferences,
    calculateRecommendationScore,
    generateRecommendationReason,

    // 计算属性
    isAuthenticated: computed(() => authStore.isAuthenticated),
    hasRecommendations: computed(() => recommendations.value.length > 0),
  };
};
