import api from './index'

export const recommendationsApi = {
  // 获取个性化推荐
  getPersonalized: (userId: string, params?: any) => {
    return api.get(`/recommendations/personalized/${userId}`, { params })
  },

  // 获取基于内容的推荐
  getContentBased: (mediaId: string, params?: any) => {
    return api.get(`/recommendations/content-based/${mediaId}`, { params })
  },

  // 获取热门推荐
  getPopular: (params?: any) => {
    return api.get('/recommendations/popular', { params })
  },

  // 获取相似媒体资源
  getSimilar: (mediaId: string, params?: any) => {
    return api.get(`/recommendations/similar/${mediaId}`, { params })
  },

  // 记录用户行为（用于推荐算法）
  recordUserAction: (data: { userId: string; mediaResourceId: string; action: string; value?: any }) => {
    return api.post('/recommendations/user-action', data)
  }
}