import axios from 'axios'
import { RequestInterceptor, ApiResponseWrapper, CacheManager, RetryHelper } from '@/utils/api-helpers'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30秒超时
})

// 应用请求拦截器
const interceptor = RequestInterceptor.config()
api.interceptors.request.use(interceptor.onRequest)
api.interceptors.response.use(interceptor.onResponse, interceptor.onResponseError)

// 增强的API客户端
class ApiClient {
  private static instance = api

  // 带缓存的GET请求
  static async get<T>(url: string, config?: any, useCache = true): Promise<T> {
    const cacheKey = `GET:${url}:${JSON.stringify(config || {})}`
    
    if (useCache) {
      const cached = CacheManager.get<T>(cacheKey)
      if (cached) {
        return Promise.resolve(cached)
      }
    }

    return RetryHelper.retry(async () => {
      const response = await this.instance.get(url, config)
      
      if (useCache) {
        CacheManager.set(cacheKey, response)
      }
      
      return response
    })
  }

  // POST请求
  static async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.post(url, data, config)
      
      // POST请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response
    })
  }

  // PUT请求
  static async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.put(url, data, config)
      
      // PUT请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response
    })
  }

  // PATCH请求
  static async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.patch(url, data, config)
      
      // PATCH请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response
    })
  }

  // DELETE请求
  static async delete<T>(url: string, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.delete(url, config)
      
      // DELETE请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response
    })
  }

  // 文件上传
  static async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return RetryHelper.retry(async () => {
      return this.instance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      })
    })
  }

  // 批量请求
  static async batch<T>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    url: string
    data?: any
    config?: any
  }>): Promise<T[]> {
    return Promise.all(
      requests.map(request => {
        switch (request.method) {
          case 'GET':
            return this.get(request.url, request.config)
          case 'POST':
            return this.post(request.url, request.data, request.config)
          case 'PUT':
            return this.put(request.url, request.data, request.config)
          case 'PATCH':
            return this.patch(request.url, request.data, request.config)
          case 'DELETE':
            return this.delete(request.url, request.config)
          default:
            throw new Error(`Unsupported method: ${request.method}`)
        }
      })
    )
  }

  // 清除缓存
  static clearCache(pattern?: RegExp): void {
    if (pattern) {
      CacheManager.clearPattern(pattern)
    } else {
      CacheManager.clear()
    }
  }
}

// 具体的API模块
export const authApi = {
  login: (data: any) => ApiClient.post('/auth/login', data),
  register: (data: any) => ApiClient.post('/auth/register', data),
  logout: () => ApiClient.post('/auth/logout'),
  profile: () => ApiClient.get('/auth/profile'),
  updateProfile: (data: any) => ApiClient.put('/auth/profile', data),
}

export const mediaApi = {
  getMediaList: (params?: any) => ApiClient.get('/media', params),
  getMediaDetail: (id: number) => ApiClient.get(`/media/${id}`),
  addMedia: (data: any) => ApiClient.post('/media', data),
  updateMedia: (id: number, data: any) => ApiClient.put(`/media/${id}`, data),
  deleteMedia: (id: number) => ApiClient.delete(`/media/${id}`),
  addFavorite: (id: number) => ApiClient.post(`/media/${id}/favorites`),
  removeFavorite: (id: number) => ApiClient.delete(`/media/${id}/favorites`),
  getPopular: () => ApiClient.get('/media/popular'),
}

export const playSourcesApi = {
  getPlaySources: (mediaId: number) => ApiClient.get(`/play-sources/media/${mediaId}`),
  getBestPlaySource: (mediaId: number) => ApiClient.get(`/play-sources/media/${mediaId}/best`),
  addPlaySource: (data: any) => ApiClient.post('/play-sources', data),
  updatePlaySource: (id: number, data: any) => ApiClient.put(`/play-sources/${id}`, data),
  deletePlaySource: (id: number) => ApiClient.delete(`/play-sources/${id}`),
}

export const watchHistoryApi = {
  getHistory: (params?: any) => ApiClient.get('/watch-history', params),
  addToHistory: (data: any) => ApiClient.post('/watch-history', data),
  updateHistory: (id: number, data: any) => ApiClient.put(`/watch-history/${id}`, data),
  deleteHistory: (id: number) => ApiClient.delete(`/watch-history/${id}`),
  clearHistory: () => ApiClient.delete('/watch-history'),
}

export const recommendationsApi = {
  getRecommendations: (params?: any) => ApiClient.get('/recommendations', params),
  getPersonalized: () => ApiClient.get('/recommendations/personalized'),
  getTrending: () => ApiClient.get('/recommendations/trending'),
  getSimilar: (mediaId: number) => ApiClient.get(`/recommendations/similar/${mediaId}`),
}

export const crawlerApi = {
  getCrawlerStatus: () => ApiClient.get('/crawler/status'),
  startCrawler: (data: any) => ApiClient.post('/crawler/start', data),
  stopCrawler: (id: string) => ApiClient.post(`/crawler/${id}/stop`),
  getCrawlerLogs: (id: string) => ApiClient.get(`/crawler/${id}/logs`),
  getTargets: () => ApiClient.get('/crawler/targets'),
  addTarget: (data: any) => ApiClient.post('/crawler/targets', data),
  updateTarget: (id: number, data: any) => ApiClient.put(`/crawler/targets/${id}`, data),
  deleteTarget: (id: number) => ApiClient.delete(`/crawler/targets/${id}`),
}

export const adminApi = {
  getUsers: (params?: any) => ApiClient.get('/admin/users', params),
  getUser: (id: number) => ApiClient.get(`/admin/users/${id}`),
  createUser: (data: any) => ApiClient.post('/admin/users', data),
  updateUser: (id: number, data: any) => ApiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => ApiClient.delete(`/admin/users/${id}`),
  
  getMedia: (params?: any) => ApiClient.get('/admin/media', params),
  getMediaStats: () => ApiClient.get('/admin/media/stats'),
  
  getWatchHistory: (params?: any) => ApiClient.get('/admin/watch-history', params),
  deleteWatchHistory: (id: number) => ApiClient.delete(`/admin/watch-history/${id}`),
  
  getLogs: (params?: any) => ApiClient.get('/admin/logs', params),
  deleteLog: (id: number) => ApiClient.delete(`/admin/logs/${id}`),
  
  getRoles: () => ApiClient.get('/admin/roles'),
  createRole: (data: any) => ApiClient.post('/admin/roles', data),
  updateRole: (id: number, data: any) => ApiClient.put(`/admin/roles/${id}`, data),
  deleteRole: (id: number) => ApiClient.delete(`/admin/roles/${id}`),
}

export default ApiClient