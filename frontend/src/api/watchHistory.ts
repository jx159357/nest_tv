import api from './index';

export const watchHistoryApi = {
  // 获取当前用户观看历史
  getMyWatchHistory: (params?: any) => {
    return api.get('/watch-history/user/me', { params }, false);
  },

  // 获取用户的观看历史
  getUserWatchHistory: (_userId?: string | number, params?: any) => {
    return api.get('/watch-history/user/me', { params }, false);
  },

  // 获取用户统计信息
  getUserStats: (_userId?: string | number) => {
    return api.get('/watch-history/user/me/stats', undefined, false);
  },

  // 获取用户继续观看列表
  getContinueWatching: (_userId?: string | number, params?: any) => {
    return api.get('/watch-history/user/me/continue', { params }, false);
  },

  // 获取用户已看完列表
  getCompleted: (_userId?: string | number, params?: any) => {
    return api.get('/watch-history/user/me/completed', { params }, false);
  },

  // 记录观看进度
  recordProgress: (data: {
    mediaResourceId: string | number;
    currentTime: number;
    duration?: number;
    episodeNumber?: number;
    isCompleted?: boolean;
  }) => {
    return api.post('/watch-history', data);
  },

  // 更新观看进度
  updateProgress: (
    mediaResourceId: string | number,
    data: { currentTime: number; duration?: number },
  ) => {
    return api.patch('/watch-history/progress', undefined, {
      params: {
        mediaResourceId,
        currentTime: data.currentTime,
        duration: data.duration,
      },
    });
  },

  // 删除观看历史
  deleteWatchHistory: (id: string) => {
    return api.delete(`/watch-history/${id}`);
  },
};
