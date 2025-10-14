import type { AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, ApiError } from '@/types';

// 成功响应包装器
export class ApiResponseWrapper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string, status?: number, data?: any): ApiError {
    return {
      message,
      status: status || 500,
      data: data || {},
    };
  }
}

// API 错误处理器
export class ApiErrorHandler {
  static handle(error: AxiosError): Promise<never> {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || '请求失败',
      status: error.response?.status || 500,
      data: error.response?.data || {},
    };

    // 处理特定错误状态码
    if (error.response && error.response.status === 401) {
      // 调试信息
      if (process.env.NODE_ENV === 'development') {
        console.warn('Authentication failed, clearing token and redirecting to login');
      }
      
      // 未授权，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      
      // 使用更友好的方式重定向，避免直接 location.href
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.response && error.response.status === 403) {
      // 禁止访问
      apiError.message = '权限不足，无法访问该资源';
    }

    if (error.response?.status === 404) {
      // 资源不存在
      apiError.message = '请求的资源不存在';
    }

    if (error.response?.status === 429) {
      // 请求过于频繁
      apiError.message = '请求过于频繁，请稍后再试';
    }

    if (error.response?.status >= 500) {
      // 服务器错误
      apiError.message = '服务器内部错误，请稍后再试';
    }

    return Promise.reject(apiError);
  }
}

// 请求拦截器配置
export class RequestInterceptor {
  static config() {
    return {
      onRequest: (config: any) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // 调试信息，生产环境可删除
          if (process.env.NODE_ENV === 'development') {
            console.log('Authorization header set:', config.headers.Authorization);
          }
        } else {
          // 调试信息，生产环境可删除
          if (process.env.NODE_ENV === 'development') {
            console.warn('No token found in localStorage');
          }
        }
        return config;
      },
      onResponse: (response: AxiosResponse) => {
        // 统一处理响应数据
        return response.data;
      },
      onResponseError: (error: AxiosError) => {
        // 调试信息，生产环境可删除
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.response?.data?.message,
            headers: error.config?.headers,
          });
        }
        return ApiErrorHandler.handle(error);
      },
    };
  }
}

// 分页数据处理工具
export class PaginationHelper {
  static processPaginationData<T>(response: any): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      data: response.data || [],
      pagination: {
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      },
    };
  }

  static buildQueryParams(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    [key: string]: any;
  }): Record<string, any> {
    const query: Record<string, any> = {};

    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;

    // 添加其他查询参数
    Object.keys(params).forEach(key => {
      if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key) && params[key] !== undefined) {
        query[key] = params[key];
      }
    });

    return query;
  }
}

// 缓存管理工具
export class CacheManager {
  private static cache = new Map<string, { data: any; expires: number }>();
  private static defaultTTL = 5 * 60 * 1000; // 5分钟

  static set(key: string, data: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearPattern(pattern: RegExp): void {
    for (const [key] of this.cache) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// 重试机制工具
export class RetryHelper {
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoff: number = 2,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // 指数退避
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// 数据验证工具
export class ValidationHelper {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // 移除HTML标签字符
      .replace(/javascript:/gi, '') // 移除JavaScript协议
      .replace(/on\w+\s*=/gi, ''); // 移除事件处理器
  }
}

// 本地存储工具
export class StorageHelper {
  static setItem(key: string, value: any, ttl?: number): void {
    const item = {
      value,
      expires: ttl ? Date.now() + ttl : null,
    };

    localStorage.setItem(key, JSON.stringify(item));
  }

  static getItem<T>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);

      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

// 日期格式化工具
export class DateHelper {
  static formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (format === 'long') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }

    if (format === 'time') {
      delete options.year;
      delete options.month;
      delete options.day;
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return d.toLocaleDateString('zh-CN', options);
  }

  static relativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return this.formatDate(d, 'short');
  }
}
