import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { RequestInterceptor, RetryHelper } from '@/utils/api-helpers';
import { GlobalErrorHandler } from '@/utils/global-error-handler';
import { setupCacheInterceptors, withCache, apiCacheManager } from '@/utils/api-cache';
import { useAuthStore } from '@/stores/auth';
import { log } from '@/utils/logger';

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

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processPendingQueue = (token: string | null, error: unknown) => {
  for (const p of pendingQueue) {
    if (token) p.resolve(token);
    else p.reject(error);
  }
  pendingQueue = [];
};

const handle401 = async (error: AxiosError) => {
  const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
  const silent = (originalConfig as unknown as { silent?: boolean })?.silent;

  if (originalConfig._retry || silent) {
    return Promise.reject(error);
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).then(token => {
      originalConfig.headers.Authorization = `Bearer ${token}`;
      originalConfig._retry = true;
      return api.request(originalConfig);
    });
  }

  originalConfig._retry = true;
  isRefreshing = true;

  try {
    const authStore = useAuthStore();
    const refreshed = await authStore.refreshToken();
    if (refreshed && authStore.token) {
      processPendingQueue(authStore.token, null);
      originalConfig.headers.Authorization = `Bearer ${authStore.token}`;
      return api.request(originalConfig);
    }

    processPendingQueue(null, error);
    authStore.logout();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  } catch (refreshError) {
    processPendingQueue(null, refreshError);
    const authStore = useAuthStore();
    authStore.logout();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

const interceptor = RequestInterceptor.config();
api.interceptors.request.use(interceptor.onRequest);
api.interceptors.response.use(interceptor.onResponse, async (error: AxiosError) => {
  if (error.response?.status === 401) {
    return handle401(error);
  }
  return interceptor.onResponseError(error);
});

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
