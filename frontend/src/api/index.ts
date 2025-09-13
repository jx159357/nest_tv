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
      const data = response.data
      
      if (useCache) {
        CacheManager.set(cacheKey, data)
      }
      
      return data
    })
  }

  // POST请求
  static async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.post(url, data, config)
      
      // POST请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response.data
    })
  }

  // PUT请求
  static async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.put(url, data, config)
      
      // PUT请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response.data
    })
  }

  // PATCH请求
  static async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.patch(url, data, config)
      
      // PATCH请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response.data
    })
  }

  // DELETE请求
  static async delete<T>(url: string, config?: any): Promise<T> {
    return RetryHelper.retry(async () => {
      const response = await this.instance.delete(url, config)
      
      // DELETE请求后清除相关缓存
      CacheManager.clearPattern(/^GET:/)
      
      return response.data
    })
  }

  // 文件上传
  static async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      RetryHelper.retry(async () => {
        const response = await this.instance.post(url, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              onProgress?.(progress)
            }
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        // 上传后清除相关缓存
        CacheManager.clearPattern(/^GET:/)
        
        return response.data
      }).then(resolve).catch(reject)
    })
  }

  // 批量请求（并行）
  static async batch<T>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    url: string
    data?: any
    config?: any
  }>): Promise<(T | unknown)[]> {
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

  // 请求取消令牌
  static cancelToken = axios.CancelToken.source()

  // 取消所有待处理的请求
  static cancelAll() {
    this.cancelToken.cancel('All requests were cancelled')
    this.cancelToken = axios.CancelToken.source()
  }

  // 获取当前请求配置
  static getConfig() {
    return {
      baseURL: this.instance.defaults.baseURL,
      headers: this.instance.defaults.headers,
      timeout: this.instance.defaults.timeout
    }
  }

  // 更新请求配置
  static updateConfig(config: any) {
    Object.assign(this.instance.defaults, config)
  }
}

// 便捷的API方法
export const recommendationsApi = {
  getRecommendations: (params?: any) => ApiClient.get('/recommendations', params),
  getRecommendationById: (id: string) => ApiClient.get(`/recommendations/${id}`),
  createRecommendation: (data: any) => ApiClient.post('/recommendations', data),
  updateRecommendation: (id: string, data: any) => ApiClient.put(`/recommendations/${id}`, data),
  deleteRecommendation: (id: string) => ApiClient.delete(`/recommendations/${id}`)
}

export const mediaApi = {
  getMediaList: (params?: any) => ApiClient.get('/media', params),
  getMediaById: (id: string) => ApiClient.get(`/media/${id}`),
  createMedia: (data: any) => ApiClient.post('/media', data),
  updateMedia: (id: string, data: any) => ApiClient.put(`/media/${id}`, data),
  deleteMedia: (id: string) => ApiClient.delete(`/media/${id}`),
  incrementViewCount: (id: string) => ApiClient.post(`/media/${id}/view`),
  getPlaySources: (mediaId: string) => ApiClient.get(`/media/${mediaId}/play-sources`)
}

export default ApiClient