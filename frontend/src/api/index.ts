import axios from 'axios';
import { RequestInterceptor, RetryHelper } from '@/utils/api-helpers';
import { GlobalErrorHandler } from '@/utils/global-error-handler';
import { setupCacheInterceptors, withCache } from '@/utils/api-cache';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
    // 生产环境安全头
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  // 生产环境SSL证书验证
  withCredentials: true,
});

// 应用请求拦截器
const interceptor = RequestInterceptor.config();
api.interceptors.request.use(interceptor.onRequest);
api.interceptors.response.use(interceptor.onResponse, interceptor.onResponseError);

// 应用缓存拦截器
setupCacheInterceptors(api);

// 增强的API客户端
class ApiClient {
  private static instance = api;

  // 带缓存的GET请求
  static async get<T>(url: string, config?: Record<string, any>, useCache = true): Promise<T> {
    if (useCache) {
      // 使用缓存配置
      const cacheConfig = config?.cacheConfig || { enabled: true };
      return this.instance
        .get(url, withCache(config || {}, cacheConfig))
        .then(response => response.data)
        .catch(error => {
          if (error?.cached) {
            // 返回缓存的旧数据
            return error.data;
          }
          GlobalErrorHandler.handle(error, `获取数据失败: ${url}`);
          throw error;
        });
    }

    // 不使用缓存
    return RetryHelper.retry(async () => {
      try {
        const response = await this.instance.get(url, config);
        return response.data;
      } catch (error) {
        GlobalErrorHandler.handle(error, `获取数据失败: ${url}`);
        throw error;
      }
    });
  }

  // POST请求
  static async post<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    return RetryHelper.retry(async () => {
      try {
        const response = await this.instance.post(url, data, config);

        // POST请求后清除相关缓存
        // CacheManager.clearPattern(/^GET:/);

        return response.data;
      } catch (error) {
        GlobalErrorHandler.handle(error, `POST请求失败: ${url}`);
        throw error;
      }
    });
  }

  // PUT请求
  static async put<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    return RetryHelper.retry(async () => {
      try {
        const response = await this.instance.put(url, data, config);

        // PUT请求后清除相关缓存
        // CacheManager.clearPattern(/^GET:/);

        return response.data;
      } catch (error) {
        GlobalErrorHandler.handle(error, `PUT请求失败: ${url}`);
        throw error;
      }
    });
  }

  // PATCH请求
  static async patch<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    return RetryHelper.retry(async () => {
      try {
        const response = await this.instance.patch(url, data, config);

        // PATCH请求后清除相关缓存
        // CacheManager.clearPattern(/^GET:/);

        return response.data;
      } catch (error) {
        GlobalErrorHandler.handle(error, `PATCH请求失败: ${url}`);
        throw error;
      }
    });
  }

  // DELETE请求
  static async delete<T>(url: string, config?: Record<string, any>): Promise<T> {
    return RetryHelper.retry(async () => {
      try {
        const response = await this.instance.delete(url, config);

        // DELETE请求后清除相关缓存
        // CacheManager.clearPattern(/^GET:/);

        return response.data;
      } catch (error) {
        GlobalErrorHandler.handle(error, `DELETE请求失败: ${url}`);
        throw error;
      }
    });
  }

  // 文件上传
  static async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      RetryHelper.retry(async () => {
        try {
          const response = await this.instance.post(url, formData, {
            onUploadProgress: progressEvent => {
              if (progressEvent.lengthComputable && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress?.(progress);
              }
            },
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // 上传后清除相关缓存
          // CacheManager.clearPattern(/^GET:/);

          return response.data;
        } catch (error) {
          GlobalErrorHandler.handle(error, `文件上传失败: ${url}`);
          throw error;
        }
      })
        .then(resolve)
        .catch(reject);
    });
  }

  // 批量请求（并行）
  static async batch<T>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      data?: Record<string, any>;
      config?: Record<string, any>;
    }>,
  ): Promise<(T | unknown)[]> {
    return Promise.all(
      requests.map(async request => {
        try {
          switch (request.method) {
            case 'GET':
              return await this.get(request.url, request.config);
            case 'POST':
              return await this.post(request.url, request.data, request.config);
            case 'PUT':
              return await this.put(request.url, request.data, request.config);
            case 'PATCH':
              return await this.patch(request.url, request.data, request.config);
            case 'DELETE':
              return await this.delete(request.url, request.config);
            default:
              throw new Error(`Unsupported method: ${request.method}`);
          }
        } catch (error) {
          GlobalErrorHandler.handle(error, `批量请求失败: ${request.method} ${request.url}`);
          return error;
        }
      }),
    );
  }

  // 请求取消令牌
  static cancelToken = axios.CancelToken.source();

  // 取消所有待处理的请求
  static cancelAll() {
    this.cancelToken.cancel('All requests were cancelled');
    this.cancelToken = axios.CancelToken.source();
  }

  // 获取当前请求配置
  static getConfig() {
    return {
      baseURL: this.instance.defaults.baseURL,
      headers: this.instance.defaults.headers,
      timeout: this.instance.defaults.timeout,
    };
  }

  // 更新请求配置
  static updateConfig(config: Record<string, any>) {
    Object.assign(this.instance.defaults, config);
  }
}

// 统一导出各模块 API
export { mediaApi } from './media';
export { playSourceApi } from './playSource';
export { authApi } from './auth';
// export { recommendationsApi } from './recommendations'; // 暂时注释，文件不存在

export default ApiClient;
