import ApiClient from './index';
import type { PaginatedResponse } from '@/types/api';
import type { MediaResource, MediaQueryParams, PlaySource } from '@/types/media';
import type { WatchHistoryItem } from './watchHistory';

export const mediaApi = {
  getMediaList: (params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', { params });
  },

  getMediaById: (id: string) => {
    return ApiClient.get<MediaResource>(`/media/${id}`, undefined, false);
  },

  createMedia: (data: any) => {
    return ApiClient.post<MediaResource>('/media', data);
  },

  updateMedia: (id: string, data: any) => {
    return ApiClient.put<MediaResource>(`/media/${id}`, data);
  },

  deleteMedia: (id: string) => {
    return ApiClient.delete<void>(`/media/${id}`);
  },

  searchMedia: (query: string, params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media/search', {
      params: { keyword: query, ...params },
    });
  },

  getPopularMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/popular', {
      params: { limit, ...params },
    });
  },

  getLatestMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/latest', {
      params: { limit, ...params },
    });
  },

  getTopRatedMedia: (limit?: number, minRating?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/recommendations/top-rated', {
      params: { limit, minRating, ...params },
    });
  },

  getRecommendedMedia: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/recommendations/trending', { params });
  },

  getMediaByType: (type: string, params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', {
      params: { ...params, type },
    });
  },

  getSimilarMedia: (mediaId: string | number, limit = 6) => {
    return ApiClient.get<MediaResource[]>(`/media/${mediaId}/similar`, {
      params: { limit },
    });
  },

  getPlaySources: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/play-sources/media/${mediaId}`);
  },

  incrementViewCount: (mediaId: string) => {
    return ApiClient.put<void>(`/media/${mediaId}/views`);
  },

  addFavorite: (mediaId: string) => {
    return ApiClient.post<void>(`/media/${mediaId}/favorites`);
  },

  removeFavorite: (mediaId: string) => {
    return ApiClient.delete<void>(`/media/${mediaId}/favorites`);
  },

  getFavoriteStatus: (mediaId: string) => {
    return ApiClient.get<{ isFavorited: boolean }>(`/media/${mediaId}/favorites/status`, undefined, false);
  },

  toggleFavorite: async (mediaId: string, currentState?: boolean) => {
    const isFavorited =
      typeof currentState === 'boolean'
        ? currentState
        : (await mediaApi.getFavoriteStatus(mediaId)).isFavorited;

    if (isFavorited) {
      await mediaApi.removeFavorite(mediaId);
      return { isFavorited: false };
    }

    await mediaApi.addFavorite(mediaId);
    return { isFavorited: true };
  },

  getFavorites: (params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media/favorites', { params }, false);
  },

  getWatchHistory: (params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<WatchHistoryItem>>('/watch-history/user/me', { params }, false);
  },

  getStatistics: () => {
    return ApiClient.get<any>('/media/statistics');
  },

  clearCache: () => undefined,
};
