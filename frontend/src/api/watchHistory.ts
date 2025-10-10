import api from './index';

export const watchHistoryApi = {
  // 获取用户的观看历史
  getUserWatchHistory: (userId: string, params?: any) => {
    return api.get(`/watch-history/user/${userId}`, { params });
  },

  // 获取用户统计信息
  getUserStats: (userId: string) => {
    return api.get(`/watch-history/user/${userId}/stats`);
  },

  // 获取用户继续观看列表
  getContinueWatching: (userId: string, params?: any) => {
    return api.get(`/watch-history/user/${userId}/continue`, { params });
  },

  // 获取用户已看完列表
  getCompleted: (userId: string, params?: any) => {
    return api.get(`/watch-history/user/${userId}/completed`, { params });
  },

  // 记录观看进度
  recordProgress: (data: { mediaResourceId: string; currentTime: number; duration: number }) => {
    return api.post('/watch-history', data);
  },

  // 更新观看进度
  updateProgress: (id: string, data: { currentTime: number; duration: number }) => {
    return api.put(`/watch-history/${id}`, data);
  },

  // 删除观看历史
  deleteWatchHistory: (id: string) => {
    return api.delete(`/watch-history/${id}`);
  },
};
