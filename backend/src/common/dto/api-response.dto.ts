/**
 * 统一API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    id?: string;
  } | null;
  timestamp: string;
  requestId?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  debug?: {
    method: string;
    url: string;
    userAgent: string;
    processingTime: number;
  };
}

/**
 * 分页数据响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 成功响应
 */
export class SuccessResponse<T = any> implements ApiResponse<T> {
  readonly success = true;
  readonly error = null;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly message?: string;
  readonly pagination?: any;
  readonly debug?: any;

  constructor(
    public readonly data?: T,
    options?: {
      message?: string;
      pagination?: any;
      requestId?: string;
    }
  ) {
    this.timestamp = new Date().toISOString();
    this.message = options?.message;
    this.pagination = options?.pagination;
    this.requestId = options?.requestId;
  }

  /**
   * 创建简单成功响应
   */
  static create<T>(data?: T, message?: string): SuccessResponse<T> {
    return new SuccessResponse(data, { message });
  }

  /**
   * 创建分页成功响应
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ): SuccessResponse<PaginatedResponse<T>> {
    const response = new SuccessResponse<PaginatedResponse<T>>(
      { data, pagination },
      { message, pagination }
    );
    return response;
  }

  /**
   * 创建空响应
   */
  static empty(message: string = '操作成功'): SuccessResponse {
    return new SuccessResponse(null, { message });
  }
}

/**
 * 错误响应
 */
export class ErrorResponse implements ApiResponse {
  readonly success = false;
  readonly data = null;
  readonly timestamp: string;
  readonly error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    id?: string;
  };
  readonly requestId?: string;

  constructor(
    errorCode: string,
    message: string,
    options?: {
      details?: any;
      requestId?: string;
      errorId?: string;
    }
  ) {
    this.error = {
      code: errorCode,
      message,
      details: options?.details,
      timestamp: new Date().toISOString(),
      id: options?.errorId,
    };
    this.timestamp = new Date().toISOString();
    this.requestId = options?.requestId;
  }

  /**
   * 创建错误响应
   */
  static create(
    errorCode: string,
    message: string,
    details?: any
  ): ErrorResponse {
    return new ErrorResponse(errorCode, message, { details });
  }

  /**
   * 创建验证错误响应
   */
  static validation(message: string, details?: any): ErrorResponse {
    return new ErrorResponse('VALIDATION_ERROR', message, { details });
  }

  /**
   * 创建未找到错误响应
   */
  static notFound(resource: string = '资源'): ErrorResponse {
    return new ErrorResponse('NOT_FOUND', `${resource}不存在`);
  }

  /**
   * 创建权限错误响应
   */
  static forbidden(message: string = '权限不足'): ErrorResponse {
    return new ErrorResponse('FORBIDDEN', message);
  }

  /**
   * 创建未授权错误响应
   */
  static unauthorized(message: string = '未授权'): ErrorResponse {
    return new ErrorResponse('UNAUTHORIZED', message);
  }

  /**
   * 创建服务器错误响应
   */
  static serverError(message: string = '服务器内部错误', details?: any): ErrorResponse {
    return new ErrorResponse('INTERNAL_ERROR', message, { details });
  }
}