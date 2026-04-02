import ApiClient from './index';
import type { MediaResource } from '@/types/media';

export interface RecommendationProfilePreference {
  key: string;
  score: number;
}

export interface RecommendationProfile {
  strategy: 'history-based' | 'search-based' | 'fallback-trending';
  totalWatched: number;
  completedCount: number;
  recentWatchCount: number;
  averageCompletionRate: number;
  favoriteTypes: RecommendationProfilePreference[];
  favoriteGenres: RecommendationProfilePreference[];
  favoriteDirectors: RecommendationProfilePreference[];
  recentSearchKeywords: RecommendationProfilePreference[];
}

export interface PersonalizedRecommendationItem {
  media: MediaResource;
  score: number;
  reasons: string[];
}

export const recommendationsApi = {
  getPersonalized: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/personalized', {
      params: { limit },
    }, false);
  },

  getPersonalizedDetailed: (limit = 8) => {
    return ApiClient.get<PersonalizedRecommendationItem[]>('/recommendations/personalized-detailed', {
      params: { limit },
    }, false);
  },

  getProfile: () => {
    return ApiClient.get<RecommendationProfile>('/recommendations/profile', undefined, false);
  },

  getTrending: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/trending', {
      params: { limit },
    });
  },

  getLatest: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/latest', {
      params: { limit },
    });
  },

  getTopRated: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/top-rated', {
      params: { limit },
    });
  },
};
