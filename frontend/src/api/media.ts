import ApiClient from './index'
import type { MediaResource, MediaQueryParams, PlaySource } from '@/types'

export const mediaApi = {
  // 获取媒体资源列表
  getMediaList: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media', { params })
  },

  // 根据ID获取媒体资源详情
  getMediaById: (id: string) => {
    return ApiClient.get<MediaResource>(`/media/${id}`, undefined, false) // 不使用缓存
  },

  // 搜索媒体资源
  searchMedia: (query: string, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/search', { 
      params: { q: query, ...params } 
    })
  },

  // 获取热门媒体资源
  getPopularMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/popular', { 
      params: { limit, ...params } 
    })
  },

  // 获取最新媒体资源
  getLatestMedia: (limit?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/latest', { 
      params: { limit, ...params } 
    })
  },

  // 获取高评分媒体资源
  getTopRatedMedia: (limit?: number, minRating?: number, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/top-rated', { 
      params: { limit, minRating, ...params } 
    })
  },

  // 获取推荐媒体资源
  getRecommendedMedia: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/recommended', { params })
  },

  // 根据类型获取媒体资源
  getMediaByType: (type: string, params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>(`/media/type/${type}`, { params })
  },

  // 获取媒体资源的播放源
  getPlaySources: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/media/${mediaId}/play-sources`)
  },

  // 增加观看次数
  incrementViewCount: (mediaId: string) => {
    return ApiClient.patch(`/media/${mediaId}/view`)
  },

  // 收藏/取消收藏媒体资源
  toggleFavorite: (mediaId: string) => {
    return ApiClient.post(`/media/${mediaId}/favorites`)
  },

  // 获取用户收藏的媒体资源
  getFavorites: (params?: MediaQueryParams) => {
    return ApiClient.get<MediaResource[]>('/media/favorites', { params })
  }
}