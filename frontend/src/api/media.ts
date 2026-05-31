import ApiClient from './index';
import { apiCacheManager } from '@/utils/api-cache';
import type { PaginatedResponse } from '@/types/api';
import type { MediaResource, MediaQueryParams } from '@/types/media';

const splitRequestOptions = (params?: MediaQueryParams) => {
  const { silent, limit, ...query } = params ?? {};
  const normalizedQuery = {
    ...query,
    ...(limit !== undefined ? { pageSize: limit } : {}),
  };
  return { query: normalizedQuery, silent };
};

const splitLimitRequestOptions = (params?: MediaQueryParams) => {
  const { silent, ...query } = params ?? {};
  return { query, silent };
};

export const mediaApi = {
  getMediaList: (params?: MediaQueryParams) => {
    const { query, silent } = splitRequestOptions(params);
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', {
      params: query,
      silent,
    });
  },

  getMediaById: (id: string) => {
    return ApiClient.get<MediaResource>(`/media/${id}`, undefined, false);
  },

  searchMedia: (query: string, params?: MediaQueryParams) => {
    const { query: normalizedQuery, silent } = splitLimitRequestOptions(params);
    return ApiClient.get<MediaResource[]>('/media/search', {
      params: { keyword: query, ...normalizedQuery },
      silent,
    });
  },

  getPopularMedia: (limit?: number, params?: MediaQueryParams) => {
    const { query, silent } = splitRequestOptions(params);
    return ApiClient.get<MediaResource[]>('/media/popular', {
      params: { limit, ...query },
      silent,
    });
  },

  getLatestMedia: (limit?: number, params?: MediaQueryParams) => {
    const { query, silent } = splitRequestOptions(params);
    return ApiClient.get<MediaResource[]>('/media/latest', {
      params: { limit, ...query },
      silent,
    });
  },

  getTopRatedMedia: (limit?: number, minRating?: number, params?: MediaQueryParams) => {
    const { query, silent } = splitRequestOptions(params);
    return ApiClient.get<MediaResource[]>('/recommendations/top-rated', {
      params: { limit, minRating, ...query },
      silent,
    });
  },

  getMediaByType: (type: string, params?: MediaQueryParams) => {
    const { query, silent } = splitRequestOptions(params);
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', {
      params: { ...query, type },
      silent,
    });
  },

  getSimilarMedia: (mediaId: string | number, limit = 6) => {
    return ApiClient.get<MediaResource[]>(`/media/${mediaId}/similar`, {
      params: { limit },
    });
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
    return ApiClient.get<{ isFavorited: boolean }>(
      `/media/${mediaId}/favorites/status`,
      undefined,
      false,
    );
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
    const { query, silent } = splitLimitRequestOptions(params);
    return ApiClient.get<PaginatedResponse<MediaResource>>(
      '/media/favorites',
      { params: query, silent },
      false,
    );
  },

  getCategoryStats: () => {
    return ApiClient.get<{
      types: Array<{ name: string; label: string; count: number }>;
      genres: Array<{ name: string; count: number }>;
    }>('/media/categories');
  },

  getSources: () => {
    return ApiClient.get<Array<{ name: string; count: number }>>('/media/sources', undefined, false);
  },

  deduplicateMedia: () =>
    ApiClient.post<{
      duplicateGroups: number;
      deactivated: number;
      movedPlaySources: number;
    }>('/media/deduplicate'),

  clearCache: () => apiCacheManager.clearCacheByPattern(/^GET:/),
};
