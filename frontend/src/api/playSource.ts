import api from './index'

// 播放源相关API
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

  // 获取媒体资源的所有播放源（按质量排序）
  getPlaySourcesByMediaId: (mediaId: string) => {
    return api.get<PlaySource[]>(`/media/${mediaId}/play-sources`)
  },

  // 添加播放源
  createPlaySource: (data: CreatePlaySourceDto) => {
    return api.post<PlaySource>('/play-sources', data)
  },

  // 更新播放源
  updatePlaySource: (id: string, data: UpdatePlaySourceDto) => {
    return api.put<PlaySource>(`/play-sources/${id}`, data)
  },

  // 删除播放源
  deletePlaySource: (id: string) => {
    return api.delete<void>(`/play-sources/${id}`)
  },

  // 测试播放源连接
  testPlaySource: (id: string) => {
    return api.post<{ success: boolean; message: string }>(`/play-sources/${id}/test`)
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

// 收藏相关API
export const favoriteApi = {
  // 添加到收藏
  addToFavorites: (mediaId: string) => {
    return api.post<void>(`/media/${mediaId}/favorites`)
  },

  // 从收藏中移除
  removeFromFavorites: (mediaId: string) => {
    return api.delete<void>(`/media/${mediaId}/favorites`)
  },

  // 获取用户收藏列表
  getUserFavorites: (params?: { page?: number; limit?: number }) => {
    return api.get<{ data: MediaResource[]; total: number }>('/favorites', { params })
  },

  // 检查是否已收藏
  isFavorite: (mediaId: string) => {
    return api.get<boolean>(`/favorites/check/${mediaId}`)
  }
}

// 观看历史相关API
export const watchHistoryApi = {
  // 记录观看进度
  recordProgress: (data: {
    mediaResourceId: string
    currentTime: number
    duration?: number
    isCompleted?: boolean
  }) => {
    return api.post<WatchHistory>('/watch-history', data)
  },

  // 获取观看历史
  getWatchHistory: (params?: { page?: number; limit?: number }) => {
    return api.get<{ data: WatchHistory[]; total: number }>('/watch-history', { params })
  },

  // 获取媒体资源的观看记录
  getMediaWatchHistory: (mediaId: string) => {
    return api.get<WatchHistory>(`/watch-history/media/${mediaId}`)
  },

  // 删除观看记录
  deleteWatchHistory: (id: string) => {
    return api.delete<void>(`/watch-history/${id}`)
  }
}

// 弹幕相关API
export const danmakuApi = {
  // 发送弹幕
  sendDanmaku: (data: {
    text: string
    color?: string
    type?: 'scroll' | 'top' | 'bottom'
    time: number
    mediaResourceId: string
  }) => {
    return api.post<Danmaku>('/danmaku', data)
  },

  // 获取弹幕列表
  getDanmakuList: (mediaId: string, params?: { startTime?: number; endTime?: number }) => {
    return api.get<Danmaku[]>(`/danmaku/media/${mediaId}`, { params })
  },

  // 删除弹幕
  deleteDanmaku: (id: string) => {
    return api.delete<void>(`/danmaku/${id}`)
  }
}

// 类型定义
export interface PlaySource {
  id: string
  mediaResourceId: string
  type: 'online' | 'offline' | 'torrent' | 'magnet'
  name: string
  url: string
  resolution?: string
  language?: string
  subtitle?: string
  priority: number
  isActive: boolean
  status: 'active' | 'inactive' | 'testing'
  playCount: number
  downloadUrls?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreatePlaySourceDto {
  mediaResourceId: string
  type: 'online' | 'offline' | 'torrent' | 'magnet'
  name: string
  url: string
  resolution?: string
  language?: string
  subtitle?: string
  priority?: number
  isActive?: boolean
  downloadUrls?: string[]
}

export interface UpdatePlaySourceDto {
  type?: 'online' | 'offline' | 'torrent' | 'magnet'
  name?: string
  url?: string
  resolution?: string
  language?: string
  subtitle?: string
  priority?: number
  isActive?: boolean
  status?: 'active' | 'inactive' | 'testing'
  downloadUrls?: string[]
}

export interface MediaResource {
  id: string
  title: string
  description?: string
  type: 'movie' | 'tv_series' | 'anime' | 'documentary'
  director?: string
  actors?: string
  genres?: string[]
  releaseDate?: string
  quality?: string
  poster?: string
  backdrop?: string
  rating?: number
  source?: string
  episodeCount?: number
  seasonCount?: number
  createdAt: string
  updatedAt: string
}

export interface WatchHistory {
  id: string
  userId: string
  mediaResourceId: string
  currentTime: number
  duration?: number
  episodeNumber?: number
  isCompleted: boolean
  device?: string
  quality?: string
  createdAt: string
  updatedAt: string
}

export interface Danmaku {
  id: string
  text: string
  color: string
  type: 'scroll' | 'top' | 'bottom'
  time: number
  userId: string
  mediaResourceId: string
  isHighlighted: boolean
  createdAt: string
}