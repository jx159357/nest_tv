import api from './index'

export const playSourceApi = {
  // 获取播放源列表
  getPlaySources: (params?: any) => {
    return api.get('/play-sources', { params })
  },

  // 根据ID获取播放源
  getPlaySourceById: (id: string) => {
    return api.get(`/play-sources/${id}`)
  },

  // 获取媒体资源的最佳播放源
  getBestPlaySource: (mediaId: string) => {
    return api.get(`/play-sources/media/${mediaId}/best`)
  },

  // 获取媒体资源的所有播放源
  getMediaPlaySources: (mediaId: string) => {
    return api.get(`/play-sources/media/${mediaId}`)
  },

  // 添加播放源到收藏
  addToFavorites: (playSourceId: string) => {
    return api.post(`/play-sources/${playSourceId}/favorites`)
  },

  // 从收藏中移除
  removeFromFavorites: (playSourceId: string) => {
    return api.delete(`/play-sources/${playSourceId}/favorites`)
  },

  // 检查是否已收藏
  isFavorite: (playSourceId: string) => {
    return api.get(`/play-sources/${playSourceId}/favorites`)
  }
}