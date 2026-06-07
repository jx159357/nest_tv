import axios from 'axios';
import { RequestInterceptor, RetryHelper } from '@/utils/api-helpers';
import { GlobalErrorHandler } from '@/utils/global-error-handler';
import { setupCacheInterceptors, withCache, apiCacheManager } from '@/utils/api-cache';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: Number.parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  withCredentials: true,
});

const interceptor = RequestInterceptor.config();
api.interceptors.request.use(interceptor.onRequest);
api.interceptors.response.use(interceptor.onResponse, interceptor.onResponseError);

setupCacheInterceptors(api);

const assertJsonLikeResponse = (data: unknown, url: string, silent?: boolean): void => {
  if (typeof data === 'string' && data.trim().startsWith('<')) {
    throw Object.assign(new Error(`接口返回了非 JSON 内容: ${url}`), { silent });
  }
};

class ApiClient {
  private static instance = api;

  static async get<T>(url: string, config?: Record<string, any>, useCache = true): Promise<T> {
    if (useCache) {
      const cacheConfig = config?.cacheConfig || { enabled: true };
      return this.instance
        .get(url, withCache(config || {}, cacheConfig))
        .then(response => {
          assertJsonLikeResponse(response.data, url, config?.silent);
          return response.data;
        })
        .catch(error => {
          if (error?.cached) {
            return error.data;
          }
          GlobalErrorHandler.handle(error, `获取数据失败: ${url}`);
          throw error;
        });
    }

    try {
      return await RetryHelper.retry(async () => {
        const response = await this.instance.get(url, config);
        assertJsonLikeResponse(response.data, url, config?.silent);
        return response.data;
      });
    } catch (error) {
      GlobalErrorHandler.handle(error, `获取数据失败: ${url}`);
      throw error;
    }
  }

  static async post<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    try {
      return await RetryHelper.retry(async () => {
        const response = await this.instance.post(url, data, config);
        assertJsonLikeResponse(response.data, url, config?.silent);
        apiCacheManager.clearCacheByPattern(/^GET:/);
        return response.data;
      });
    } catch (error) {
      GlobalErrorHandler.handle(error, `POST请求失败: ${url}`);
      throw error;
    }
  }

  static async put<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    try {
      return await RetryHelper.retry(async () => {
        const response = await this.instance.put(url, data, config);
        assertJsonLikeResponse(response.data, url, config?.silent);
        apiCacheManager.clearCacheByPattern(/^GET:/);
        return response.data;
      });
    } catch (error) {
      GlobalErrorHandler.handle(error, `PUT请求失败: ${url}`);
      throw error;
    }
  }

  static async patch<T>(
    url: string,
    data?: Record<string, any>,
    config?: Record<string, any>,
  ): Promise<T> {
    try {
      return await RetryHelper.retry(async () => {
        const response = await this.instance.patch(url, data, config);
        assertJsonLikeResponse(response.data, url, config?.silent);
        apiCacheManager.clearCacheByPattern(/^GET:/);
        return response.data;
      });
    } catch (error) {
      GlobalErrorHandler.handle(error, `PATCH请求失败: ${url}`);
      throw error;
    }
  }

  static async delete<T>(url: string, config?: Record<string, any>): Promise<T> {
    try {
      return await RetryHelper.retry(async () => {
        const response = await this.instance.delete(url, config);
        assertJsonLikeResponse(response.data, url, config?.silent);
        apiCacheManager.clearCacheByPattern(/^GET:/);
        return response.data;
      });
    } catch (error) {
      GlobalErrorHandler.handle(error, `DELETE请求失败: ${url}`);
      throw error;
    }
  }

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
          apiCacheManager.clearCacheByPattern(/^GET:/);
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

  static cancelToken = axios.CancelToken.source();

  static cancelAll() {
    this.cancelToken.cancel('All requests were cancelled');
    this.cancelToken = axios.CancelToken.source();
  }

  static getConfig() {
    return {
      baseURL: this.instance.defaults.baseURL,
      headers: this.instance.defaults.headers,
      timeout: this.instance.defaults.timeout,
    };
  }

  static updateConfig(config: Record<string, any>) {
    Object.assign(this.instance.defaults, config);
  }
}

export default ApiClient;
