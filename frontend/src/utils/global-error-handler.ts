import { showNotification } from '@/composables/useModal';
import { log } from '@/utils/logger';
// import type { AxiosError } from 'axios'; // 暂时注释，以后可能用到

// 定义错误类型
export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface BusinessError {
  code: string;
  message: string;
  data?: any;
}

const isSilentError = (error: any): boolean => {
  return error?.config?.silent === true || error?.silent === true;
};

// 全局错误处理器
export class GlobalErrorHandler {
  // 通用错误处理方法
  static handle(error: any, defaultMessage: string = '操作失败'): ApiError {
    return this.handleApiError(error, defaultMessage);
  }

  // 处理API错误
  static handleApiError(error: any, defaultMessage: string = '操作失败'): ApiError {
    const silent = isSilentError(error);
    if (!silent) {
      log.error('GlobalErrorHandler', 'API Error:', error);
    }

    // 提取错误信息
    let message = defaultMessage;
    let statusCode = 500;

    if (error.response || typeof error.status === 'number') {
      // 服务器响应错误
      statusCode = error.response?.status ?? error.status;
      if (error.message) {
        message = error.message;
      }

      const data = error.response?.data;
      if (data && data.message) {
        message = data.message;
      } else if (data && data.error) {
        message = data.error;
      } else {
        switch (statusCode) {
          case 400:
            message = '请求参数错误';
            break;
          case 401:
            message = '未授权访问，请重新登录';
            break;
          case 403:
            message = '权限不足';
            break;
          case 404:
            message = '请求的资源不存在';
            break;
          case 409:
            message = '资源冲突';
            break;
          case 422:
            message = '数据验证失败';
            break;
          case 500:
            message = '服务器内部错误';
            break;
          case 502:
            message = '网关错误';
            break;
          case 503:
            message = '服务暂时不可用';
            break;
          case 504:
            message = '网关超时';
            break;
          default:
            message = `HTTP ${statusCode} 错误`;
        }
      }
    } else if (error.request) {
      // 网络错误
      message = '网络连接失败，请检查网络设置';
    } else {
      // 其他错误
      message = error.message || defaultMessage;
    }

    // 显示错误提示
    if (!silent) {
      showNotification({
        type: 'error',
        title: '请求错误',
        message,
      });
    }

    // 特殊错误处理（登录页面不触发自动跳转）
    if (statusCode === 401 && !silent && !window.location.pathname.includes('/login')) {
      this.handleUnauthorizedError();
    }

    return {
      message,
      status: statusCode,
      data: error.response?.data,
    };
  }

  // 处理未授权错误
  static handleUnauthorizedError() {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');

    // 显示通知
    showNotification({
      type: 'warning',
      title: '会话过期',
      message: '您的登录会话已过期，请重新登录',
      duration: 0, // 持续显示直到用户操作
    });

    // 3秒后跳转到登录页面
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }

  // 处理表单验证错误
  static handleValidationError(errors: Record<string, string[]>) {
    log.error('GlobalErrorHandler', 'Validation Errors:', errors);

    // 构建错误消息
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    // 显示错误提示
    showNotification({
      type: 'error',
      title: '表单验证失败',
      message: errorMessages,
    });

    return errorMessages;
  }

  // 处理业务逻辑错误
  static handleBusinessError(error: BusinessError) {
    log.error('GlobalErrorHandler', 'Business Error:', error);

    // 根据错误代码显示特定消息
    const errorMap: Record<string, string> = {
      MEDIA_NOT_FOUND: '影视资源不存在',
      PLAY_SOURCE_NOT_FOUND: '播放源不存在',
      USER_ALREADY_EXISTS: '用户已存在',
      INVALID_CREDENTIALS: '用户名或密码错误',
      TOKEN_EXPIRED: '令牌已过期',
      INSUFFICIENT_PERMISSIONS: '权限不足',
      RESOURCE_CONFLICT: '资源冲突',
      VALIDATION_FAILED: '数据验证失败',
      NETWORK_ERROR: '网络连接失败',
      SERVER_ERROR: '服务器错误',
      RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
      INVALID_INPUT: '输入数据无效',
      OPERATION_NOT_ALLOWED: '不允许此操作',
      RESOURCE_LOCKED: '资源已被锁定',
      QUOTA_EXCEEDED: '配额已满',
      SERVICE_UNAVAILABLE: '服务暂时不可用',
    };

    const message = errorMap[error.code] || error.message || '操作失败';

    // 显示错误提示
    showNotification({
      type: 'warning',
      title: '业务错误',
      message,
    });

    return message;
  }

  // 处理网络错误
  static handleNetworkError(error: any) {
    log.error('GlobalErrorHandler', 'Network Error:', error);

    let message = '网络连接失败';

    if (error.code) {
      switch (error.code) {
        case 'ECONNABORTED':
          message = '请求超时';
          break;
        case 'ENOTFOUND':
          message = '域名解析失败';
          break;
        case 'ECONNREFUSED':
          message = '连接被拒绝';
          break;
        case 'ETIMEDOUT':
          message = '连接超时';
          break;
        case 'EHOSTUNREACH':
          message = '主机不可达';
          break;
        case 'ENETUNREACH':
          message = '网络不可达';
          break;
        default:
          message = `网络错误: ${error.code}`;
      }
    }

    // 显示错误提示
    showNotification({
      type: 'error',
      title: '网络错误',
      message,
    });

    return message;
  }

  // 处理播放错误
  static handlePlaybackError(error: any) {
    log.error('GlobalErrorHandler', 'Playback Error:', error);

    let message = '视频播放失败';

    if (error.name) {
      switch (error.name) {
        case 'NotAllowedError':
          message = '播放被阻止，请点击播放按钮';
          break;
        case 'NotSupportedError':
          message = '不支持的视频格式';
          break;
        case 'AbortError':
          message = '播放被中止';
          break;
        case 'NetworkError':
          message = '网络连接问题导致播放失败';
          break;
        case 'DecodeError':
          message = '视频解码失败';
          break;
        case 'SourceUnavailableError':
          message = '视频源不可用';
          break;
        default:
          message = `播放错误: ${error.name}`;
      }
    }

    // 显示错误提示
    showNotification({
      type: 'error',
      title: '播放错误',
      message,
    });

    return message;
  }

  // 处理异步操作错误
  static async handleAsyncError<T>(
    promise: Promise<T>,
    options: {
      defaultMessage?: string;
      showError?: boolean;
      showNotice?: boolean;
    } = {},
  ): Promise<{ success: boolean; data?: T; error?: ApiError }> {
    const { defaultMessage = '操作失败', showNotice = false } = options;

    try {
      const result = await promise;
      return { success: true, data: result };
    } catch (error) {
      const errorInfo = this.handleApiError(error, defaultMessage);

      if (showNotice) {
        showNotification({
          type: 'error',
          title: '操作失败',
          message: errorInfo.message,
        });
      }

      return { success: false, error: errorInfo };
    }
  }
}
