/**
 * API 错误码枚举
 */
export enum ApiErrorCode {
  // 通用错误 (1000-1999)
  SUCCESS = 0,
  INTERNAL_ERROR = 1000,
  VALIDATION_ERROR = 1001,
  AUTHENTICATION_ERROR = 1002,
  AUTHORIZATION_ERROR = 1003,
  NOT_FOUND = 1004,
  BAD_REQUEST = 1005,
  CONFLICT = 1006,
  RATE_LIMIT_EXCEEDED = 1007,
  RESOURCE_EXPIRED = 1008,

  // 用户相关错误 (2000-2999)
  USER_NOT_FOUND = 2000,
  USER_ALREADY_EXISTS = 2001,
  USER_INACTIVE = 2002,
  INVALID_CREDENTIALS = 2003,
  TOKEN_EXPIRED = 2004,
  TOKEN_INVALID = 2005,
  PERMISSION_DENIED = 2006,

  // 媒体资源错误 (3000-3999)
  MEDIA_NOT_FOUND = 3000,
  MEDIA_ALREADY_EXISTS = 3001,
  MEDIA_INACTIVE = 3002,
  INVALID_MEDIA_TYPE = 3003,
  PLAY_SOURCE_NOT_FOUND = 3004,
  PLAY_SOURCE_INACTIVE = 3005,
  FAVORITE_ALREADY_EXISTS = 3006,
  FAVORITE_NOT_FOUND = 3007,

  // 系统错误 (4000-4999)
  DATABASE_ERROR = 4000,
  CACHE_ERROR = 4001,
  EXTERNAL_SERVICE_ERROR = 4002,
  FILE_UPLOAD_ERROR = 4003,
  CONFIGURATION_ERROR = 4004,

  // 网络错误 (5000-5999)
  NETWORK_ERROR = 5000,
  TIMEOUT_ERROR = 5001,
  SERVICE_UNAVAILABLE = 5002,
}

/**
 * API 错误消息映射
 */
export const ApiErrorMessage: { [key in ApiErrorCode]: string } = {
  [ApiErrorCode.SUCCESS]: '操作成功',
  [ApiErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ApiErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ApiErrorCode.AUTHENTICATION_ERROR]: '身份验证失败',
  [ApiErrorCode.AUTHORIZATION_ERROR]: '权限不足',
  [ApiErrorCode.NOT_FOUND]: '资源不存在',
  [ApiErrorCode.BAD_REQUEST]: '请求参数错误',
  [ApiErrorCode.CONFLICT]: '资源冲突',
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: '请求频率超限',
  [ApiErrorCode.RESOURCE_EXPIRED]: '资源已过期',

  [ApiErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ApiErrorCode.USER_ALREADY_EXISTS]: '用户已存在',
  [ApiErrorCode.USER_INACTIVE]: '用户已被禁用',
  [ApiErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ApiErrorCode.TOKEN_EXPIRED]: '令牌已过期',
  [ApiErrorCode.TOKEN_INVALID]: '令牌无效',
  [ApiErrorCode.PERMISSION_DENIED]: '权限不足',

  [ApiErrorCode.MEDIA_NOT_FOUND]: '媒体资源不存在',
  [ApiErrorCode.MEDIA_ALREADY_EXISTS]: '媒体资源已存在',
  [ApiErrorCode.MEDIA_INACTIVE]: '媒体资源已禁用',
  [ApiErrorCode.INVALID_MEDIA_TYPE]: '无效的媒体类型',
  [ApiErrorCode.PLAY_SOURCE_NOT_FOUND]: '播放源不存在',
  [ApiErrorCode.PLAY_SOURCE_INACTIVE]: '播放源已禁用',
  [ApiErrorCode.FAVORITE_ALREADY_EXISTS]: '已收藏该资源',
  [ApiErrorCode.FAVORITE_NOT_FOUND]: '未收藏该资源',

  [ApiErrorCode.DATABASE_ERROR]: '数据库操作失败',
  [ApiErrorCode.CACHE_ERROR]: '缓存操作失败',
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [ApiErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
  [ApiErrorCode.CONFIGURATION_ERROR]: '配置错误',

  [ApiErrorCode.NETWORK_ERROR]: '网络错误',
  [ApiErrorCode.TIMEOUT_ERROR]: '请求超时',
  [ApiErrorCode.SERVICE_UNAVAILABLE]: '服务不可用',
};

/**
 * HTTP 状态码映射
 */
export const HttpStatusCodeMap: { [key in ApiErrorCode]: number } = {
  [ApiErrorCode.SUCCESS]: 200,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.AUTHENTICATION_ERROR]: 401,
  [ApiErrorCode.AUTHORIZATION_ERROR]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ApiErrorCode.RESOURCE_EXPIRED]: 410,

  [ApiErrorCode.USER_NOT_FOUND]: 404,
  [ApiErrorCode.USER_ALREADY_EXISTS]: 409,
  [ApiErrorCode.USER_INACTIVE]: 403,
  [ApiErrorCode.INVALID_CREDENTIALS]: 401,
  [ApiErrorCode.TOKEN_EXPIRED]: 401,
  [ApiErrorCode.TOKEN_INVALID]: 401,
  [ApiErrorCode.PERMISSION_DENIED]: 403,

  [ApiErrorCode.MEDIA_NOT_FOUND]: 404,
  [ApiErrorCode.MEDIA_ALREADY_EXISTS]: 409,
  [ApiErrorCode.MEDIA_INACTIVE]: 404,
  [ApiErrorCode.INVALID_MEDIA_TYPE]: 400,
  [ApiErrorCode.PLAY_SOURCE_NOT_FOUND]: 404,
  [ApiErrorCode.PLAY_SOURCE_INACTIVE]: 404,
  [ApiErrorCode.FAVORITE_ALREADY_EXISTS]: 409,
  [ApiErrorCode.FAVORITE_NOT_FOUND]: 404,

  [ApiErrorCode.DATABASE_ERROR]: 500,
  [ApiErrorCode.CACHE_ERROR]: 500,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ApiErrorCode.FILE_UPLOAD_ERROR]: 400,
  [ApiErrorCode.CONFIGURATION_ERROR]: 500,

  [ApiErrorCode.NETWORK_ERROR]: 500,
  [ApiErrorCode.TIMEOUT_ERROR]: 504,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * 自定义 API 异常类
 */
export class ApiException extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message?: string,
    public readonly details?: any,
    public readonly statusCode?: number
  ) {
    super(message || ApiErrorMessage[code]);
    this.name = 'ApiException';
    
    // 如果没有指定状态码，使用映射的状态码
    this.statusCode = statusCode || HttpStatusCodeMap[code];
    
    // 确保堆栈追踪可用
    Error.captureStackTrace(this, ApiException);
  }

  /**
   * 创建用户不存在异常
   */
  static userNotFound(details?: any): ApiException {
    return new ApiException(ApiErrorCode.USER_NOT_FOUND, undefined, details);
  }

  /**
   * 创建用户已存在异常
   */
  static userAlreadyExists(details?: any): ApiException {
    return new ApiException(ApiErrorCode.USER_ALREADY_EXISTS, undefined, details);
  }

  /**
   * 创建媒体资源不存在异常
   */
  static mediaNotFound(details?: any): ApiException {
    return new ApiException(ApiErrorCode.MEDIA_NOT_FOUND, undefined, details);
  }

  /**
   * 创建权限不足异常
   */
  static permissionDenied(details?: any): ApiException {
    return new ApiException(ApiErrorCode.PERMISSION_DENIED, undefined, details);
  }

  /**
   * 创建验证失败异常
   */
  static validationError(message?: string, details?: any): ApiException {
    return new ApiException(ApiErrorCode.VALIDATION_ERROR, message, details);
  }

  /**
   * 创建数据库错误异常
   */
  static databaseError(details?: any): ApiException {
    return new ApiException(ApiErrorCode.DATABASE_ERROR, undefined, details);
  }

  /**
   * 创建缓存错误异常
   */
  static cacheError(details?: any): ApiException {
    return new ApiException(ApiErrorCode.CACHE_ERROR, undefined, details);
  }

  /**
   * 创建外部服务错误异常
   */
  static externalServiceError(details?: any): ApiException {
    return new ApiException(ApiErrorCode.EXTERNAL_SERVICE_ERROR, undefined, details);
  }

  /**
   * 创建请求频率超限异常
   */
  static rateLimitExceeded(details?: any): ApiException {
    return new ApiException(ApiErrorCode.RATE_LIMIT_EXCEEDED, undefined, details);
  }

  /**
   * 转换为 JSON 响应格式
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
      data: null,
    };
  }
}