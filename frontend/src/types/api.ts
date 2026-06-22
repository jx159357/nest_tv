// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  pageSize?: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface FilterParams {
  genre?: string;
  type?: string;
  quality?: string;
  minRating?: number;
  maxRating?: number;
  search?: string;
}
