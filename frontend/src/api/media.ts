import ApiClient from './index';
import type { PaginatedResponse } from '@/types/api';
import type { 
  MediaResource, 
  MediaQueryParams, 
  PlaySource 
} from '@/types/media';

export const mediaApi = {
  // 获取媒体资源列表
  getMediaList: (params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', { params });
  },

  // 根据ID获取媒体资源详情
  getMediaById: (id: string) => {
    return ApiClient.get<MediaResource>(`/media/${id}`, undefined, false); // 不使用缓存
  },

  // 创建媒体资源
  createMedia: (data: any) => {
    return ApiClient.post<MediaResource>('/media', data);
  },

  // 更新媒体资源
  updateMedia: (id: string, data: any) => {
    return ApiClient.put<MediaResource>(`/media/${id}`, data);
  },

  // 删除媒体资源
  deleteMedia: (id: string) => {
    return ApiClient.delete<void>(`/media/${id}`);
  },

  // 搜索媒体资源
  searchMedia: (query: string, params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media/search', {
      params: { keyword: query, ...params },
    });
  },

  // 获取热门媒体资源
  getPopularMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/popular', {
      params: { limit, ...params },
    });
  },

  // 获取最新媒体资源
  getLatestMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/latest', {
      params: { limit, ...params },
    });
  },

  // 获取高评分媒体资源
  getTopRatedMedia: (limit?: number, minRating?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/recommendations/top-rated', {
      params: { limit, minRating, ...params },
    });
  },

  // 获取推荐媒体资源
  getRecommendedMedia: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/recommendations/trending', { params });
  },

  // 根据类型获取媒体资源
  getMediaByType: (type: string, params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media', {
      params: { ...params, type },
    });
  },

  // 获取相似媒体资源
  getSimilarMedia: (mediaId: string | number, limit = 6) => {
    return ApiClient.get<MediaResource[]>(`/media/${mediaId}/similar`, {
      params: { limit },
    });
  },

  // 获取媒体资源的播放源
  getPlaySources: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/play-sources/media/${mediaId}`);
  },

  // 增加观看次数
  incrementViewCount: (mediaId: string) => {
    return ApiClient.put<void>(`/media/${mediaId}/views`);
  },

  // 收藏/取消收藏媒体资源
  toggleFavorite: (mediaId: string) => {
    return ApiClient.post<void>(`/media/${mediaId}/favorites`);
  },

  // 获取用户收藏的媒体资源
  getFavorites: (params?: MediaQueryParams) => {
    return ApiClient.get<PaginatedResponse<MediaResource>>('/media/favorites', { params });
  },

  // 获取观看历史
  getWatchHistory: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/watch-history', { params });
  },

  // 获取统计信息
  getStatistics: () => {
    return ApiClient.get<any>('/media/statistics');
  },

  clearCache: () => undefined,
};
