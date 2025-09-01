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

export default ApiClient