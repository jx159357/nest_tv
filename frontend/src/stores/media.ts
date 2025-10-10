import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { mediaApi } from '@/api/media';
import type { MediaResource, Pagination, MediaQueryParams } from '@/types';

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

  const hasMore = computed(() => {
    return pagination.value.page < pagination.value.totalPages;
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
      console.error('获取媒体列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchMediaDetail = async (id: string) => {
    loading.value = true;
    try {
      const response = await mediaApi.getMediaById(id);
      currentMedia.value = response;
      return response;
    } catch (error) {
      console.error('获取媒体详情失败:', error);
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
      console.error('获取热门媒体失败:', error);
      throw error;
    }
  };

  const fetchLatestMedia = async (limit = 10, params?: MediaQueryParams) => {
    try {
      const response = await mediaApi.getLatestMedia(limit, params);
      return response;
    } catch (error) {
      console.error('获取最新媒体失败:', error);
      throw error;
    }
  };

  const fetchTopRatedMedia = async (limit = 10, minRating = 8, params?: MediaQueryParams) => {
    try {
      const response = await mediaApi.getTopRatedMedia(limit, minRating, params);
      return response;
    } catch (error) {
      console.error('获取高评分媒体失败:', error);
      throw error;
    }
  };

  const searchMedia = async (query: string, params?: MediaQueryParams) => {
    loading.value = true;
    try {
      const response = await mediaApi.searchMedia(query, params);
      mediaList.value = response.data;
      pagination.value = response.pagination;
      return response;
    } catch (error) {
      console.error('搜索媒体失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchMediaByType = async (type: string, params?: MediaQueryParams) => {
    loading.value = true;
    try {
      const response = await mediaApi.getMediaByType(type, params);
      mediaList.value = response.data;
      pagination.value = response.pagination;
      return response;
    } catch (error) {
      console.error('获取类型媒体失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      await mediaApi.incrementViewCount(id);
    } catch (error) {
      console.error('增加观看次数失败:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await mediaApi.toggleFavorite(id);
      // 清除相关缓存
      mediaApi.clearCache();
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      throw error;
    }
  };

  const fetchFavorites = async (params?: MediaQueryParams) => {
    loading.value = true;
    try {
      const response = await mediaApi.getFavorites(params);
      mediaList.value = response.data;
      pagination.value = response.pagination;
      return response;
    } catch (error) {
      console.error('获取收藏媒体失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const clearCurrentMedia = () => {
    currentMedia.value = null;
  };

  const resetMediaList = () => {
    mediaList.value = [];
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
  };

  const loadMore = async (params?: MediaQueryParams) => {
    if (!hasMore.value || loading.value) return;

    loading.value = true;
    try {
      const nextPage = pagination.value.page + 1;
      const response = await mediaApi.getMediaList({
        ...params,
        page: nextPage,
        limit: pagination.value.limit,
      });

      mediaList.value = [...mediaList.value, ...response.data];
      pagination.value = response.pagination;
      return response;
    } catch (error) {
      console.error('加载更多媒体失败:', error);
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
    hasMore,
    fetchMediaList,
    fetchMediaDetail,
    fetchPopularMedia,
    fetchLatestMedia,
    fetchTopRatedMedia,
    searchMedia,
    fetchMediaByType,
    incrementViewCount,
    toggleFavorite,
    fetchFavorites,
    clearCurrentMedia,
    resetMediaList,
    loadMore,
  };
});
