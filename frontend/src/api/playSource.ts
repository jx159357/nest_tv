import ApiClient from './index';
import type { PlaySource, PlaySourceQueryParams } from '@/types/media';

// 播放源相关API
export const playSourceApi = {
  // 获取播放源列表
  getPlaySources: (params?: PlaySourceQueryParams) => {
    return ApiClient.get<PlaySource[]>('/play-sources', { params });
  },

  // 根据ID获取播放源
  getPlaySourceById: (id: string) => {
    return ApiClient.get<PlaySource>(`/play-sources/${id}`);
  },

  // 获取媒体资源的最佳播放源
  getBestPlaySource: (mediaId: string) => {
    return ApiClient.get<PlaySource>(`/play-sources/media/${mediaId}/best`);
  },

  // 获取媒体资源的所有播放源
  getMediaPlaySources: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/play-sources/media/${mediaId}`);
  },

  // 获取媒体资源的所有播放源（按质量排序）
  getPlaySourcesByMediaId: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/media/${mediaId}/play-sources`);
  },

  // 添加播放源
  createPlaySource: (data: any) => {
    return ApiClient.post<PlaySource>('/play-sources', data);
  },

  // 更新播放源
  updatePlaySource: (id: string, data: any) => {
    return ApiClient.put<PlaySource>(`/play-sources/${id}`, data);
  },

  // 删除播放源
  deletePlaySource: (id: string) => {
    return ApiClient.delete<void>(`/play-sources/${id}`);
  },

  // 测试播放源连接
  testPlaySource: (id: string) => {
    return ApiClient.post<{ success: boolean; message: string }>(`/play-sources/${id}/test`);
  },

  // 添加播放源到收藏
  addToFavorites: (playSourceId: string) => {
    return ApiClient.post(`/play-sources/${playSourceId}/favorites`);
  },

  // 从收藏中移除
  removeFromFavorites: (playSourceId: string) => {
    return ApiClient.delete(`/play-sources/${playSourceId}/favorites`);
  },

  // 检查是否已收藏
  isFavorite: (playSourceId: string) => {
    return ApiClient.get(`/play-sources/${playSourceId}/favorites`);
  },
};
