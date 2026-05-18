import { defineStore } from 'pinia';
import { ref } from 'vue';
import { mediaApi } from '@/api/media';
import type { MediaResource, MediaQueryParams } from '@/types/media';
import { log } from '@/utils/logger';

// 定义分页类型
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useMediaStore = defineStore('media', () => {
  const mediaList = ref<MediaResource[]>([]);
  const currentMedia = ref<MediaResource | null>(null);
  const loading = ref(false);
  const pagination = ref<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchMediaList = async (params: MediaQueryParams = {}) => {
    loading.value = true;
    try {
      const response = await mediaApi.getMediaList(params);
      mediaList.value = response.data;
      pagination.value = {
        page: params.page || 1,
        limit: params.limit || 10,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (params.limit || 10)),
      };
      return response;
    } catch (error) {
      log.error('MediaStore', '获取媒体列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchMediaDetail = async (id: string | number) => {
    loading.value = true;
    try {
      const response = await mediaApi.getMediaById(String(id));
      currentMedia.value = response;
      return response;
    } catch (error) {
      log.error('MediaStore', '获取媒体详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchPopularMedia = async (limit = 10, params?: MediaQueryParams) => {
    try {
      const response = await mediaApi.getPopularMedia(limit, params);
      return response;
    } catch (error) {
      log.error('MediaStore', '获取热门媒体失败:', error);
      throw error;
    }
  };

  const fetchLatestMedia = async (limit = 10, params?: MediaQueryParams) => {
    try {
      const response = await mediaApi.getLatestMedia(limit, params);
      return response;
    } catch (error) {
      log.error('MediaStore', '获取最新媒体失败:', error);
      throw error;
    }
  };

  const fetchTopRatedMedia = async (limit = 10, minRating = 8, params?: MediaQueryParams) => {
    try {
      const response = await mediaApi.getTopRatedMedia(limit, minRating, params);
      return response;
    } catch (error) {
      log.error('MediaStore', '获取高评分媒体失败:', error);
      throw error;
    }
  };

  const fetchRecommendations = async (mediaId: string | number, limit = 6) => {
    try {
      return await mediaApi.getSimilarMedia(mediaId, limit);
    } catch (error) {
      log.error('MediaStore', '获取推荐媒体失败:', error);
      throw error;
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      await mediaApi.incrementViewCount(id);
    } catch (error) {
      log.error('MediaStore', '增加观看次数失败:', error);
    }
  };

  const toggleFavorite = async (id: string, currentState?: boolean) => {
    try {
      const response = await mediaApi.toggleFavorite(id, currentState);
      // 清除相关缓存
      mediaApi.clearCache();
      return response.isFavorited;
    } catch (error) {
      log.error('MediaStore', '切换收藏状态失败:', error);
      throw error;
    }
  };

  const fetchFavoriteStatus = async (id: string) => {
    try {
      const response = await mediaApi.getFavoriteStatus(id);
      return response.isFavorited;
    } catch (error) {
      log.error('MediaStore', '获取收藏状态失败:', error);
      throw error;
    }
  };

  const fetchFavorites = async (params?: MediaQueryParams) => {
    loading.value = true;
    try {
      const response = await mediaApi.getFavorites(params);
      mediaList.value = response.data;
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      };
      return response;
    } catch (error) {
      log.error('MediaStore', '获取收藏媒体失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    mediaList,
    currentMedia,
    loading,
    pagination,
    fetchMediaList,
    fetchMediaDetail,
    fetchPopularMedia,
    fetchLatestMedia,
    fetchTopRatedMedia,
    fetchRecommendations,
    incrementViewCount,
    toggleFavorite,
    fetchFavoriteStatus,
    fetchFavorites,
  };
});
