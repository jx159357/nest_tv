import api from './index';
import type { PaginatedResponse } from '@/types/api';
import type { MediaResource } from '@/types/media';

export interface WatchHistoryItem {
  id: number;
  userId: number;
  mediaResourceId: number;
  currentTime: number;
  duration?: number;
  watchDuration: number;
  isCompleted: boolean;
  episodeNumber?: number;
  playCount: number;
  lastPlayedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  mediaResource: MediaResource;
}

export interface WatchHistoryStats {
  totalWatched: number;
  completed: number;
  watching: number;
  totalWatchTime: number;
}

export const watchHistoryApi = {
  // 获取当前用户观看历史
  getMyWatchHistory: (params?: any) => {
    return api.get<PaginatedResponse<WatchHistoryItem>>('/watch-history/user/me', { params }, false);
  },

  // 获取用户的观看历史
  getUserWatchHistory: (_userId?: string | number, params?: any) => {
    return api.get<PaginatedResponse<WatchHistoryItem>>('/watch-history/user/me', { params }, false);
  },

  // 获取用户统计信息
  getUserStats: (_userId?: string | number) => {
    return api.get<WatchHistoryStats>('/watch-history/user/me/stats', undefined, false);
  },

  // 获取用户继续观看列表
  getContinueWatching: (_userId?: string | number, params?: any) => {
    return api.get<WatchHistoryItem[]>('/watch-history/user/me/continue', { params }, false);
  },

  // 获取用户已看完列表
  getCompleted: (_userId?: string | number, params?: any) => {
    return api.get<PaginatedResponse<WatchHistoryItem>>(
      '/watch-history/user/me/completed',
      { params },
      false,
    );
  },

  // 记录观看进度
  recordProgress: (data: {
    mediaResourceId: string | number;
    currentTime: number;
    duration?: number;
    episodeNumber?: number;
    isCompleted?: boolean;
  }) => {
    return api.post<WatchHistoryItem>('/watch-history', data);
  },

  // 更新观看进度
  updateProgress: (
    mediaResourceId: string | number,
    data: { currentTime: number; duration?: number },
  ) => {
    return api.patch<WatchHistoryItem>('/watch-history/progress', undefined, {
      params: {
        mediaResourceId,
        currentTime: data.currentTime,
        duration: data.duration,
      },
    });
  },

  // 删除观看历史
  deleteWatchHistory: (id: string) => {
    return api.delete<void>(`/watch-history/${id}`);
  },
};
