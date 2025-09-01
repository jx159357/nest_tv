// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  phone?: string
  nickname?: string
  role: string
  isActive: boolean
  avatar?: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterUserData {
  username: string
  email: string
  password: string
  phone?: string
  nickname?: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// 媒体资源相关类型
export interface MediaResource {
  id: number
  title: string
  description?: string
  type: MediaType
  director?: string
  actors?: string
  genres?: string[]
  releaseDate?: Date
  quality: MediaQuality
  poster?: string
  backdrop?: string
  rating: number
  viewCount: number
  isActive: boolean
  source?: string
  metadata?: any
  episodeCount?: number
  downloadUrls?: string[]
  createdAt: Date
  updatedAt: Date
}

export enum MediaType {
  MOVIE = 'movie',
  TV_SERIES = 'tv_series',
  VARIETY = 'variety',
  ANIME = 'anime',
  DOCUMENTARY = 'documentary'
}

export enum MediaQuality {
  HD = 'hd',
  FULL_HD = 'full_hd',
  BLUE_RAY = 'blue_ray',
  SD = 'sd'
}

// 播放源相关类型
export interface PlaySource {
  id: number
  url: string
  type: PlaySourceType
  status: PlaySourceStatus
  resolution?: string
  format?: string
  subtitleUrl?: string
  priority: number
  isAds: boolean
  playCount: number
  description?: string
  sourceName?: string
  isActive: boolean
  headers?: any
  expireDate?: Date
  channelGroup?: string
  channelLogo?: string
  providerName?: string
  magnetInfo?: any
  webDiskInfo?: any
  episodeNumber?: number
  createdAt: Date
  updatedAt: Date
  lastCheckedAt?: Date
  mediaResourceId: number
  mediaResource?: MediaResource
}

export enum PlaySourceType {
  ONLINE = 'online',
  DOWNLOAD = 'download',
  STREAM = 'stream',
  THIRD_PARTY = 'third_party',
  MAGNET = 'magnet',
  IPTV = 'iptv',
  WEBDISK = 'webdisk',
  PARSER = 'parser'
}

export enum PlaySourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CHECKING = 'checking'
}

// 观看历史相关类型
export interface WatchHistory {
  id: number
  userId: number
  user?: User
  mediaResourceId: number
  mediaResource?: MediaResource
  playSourceId?: number
  playSource?: PlaySource
  currentTime: number
  duration: number
  completed: boolean
  watchedAt: Date
  createdAt: Date
  updatedAt: Date
}

// 推荐相关类型
export interface Recommendation {
  id: number
  userId: number
  user?: User
  mediaResourceId: number
  mediaResource?: MediaResource
  type: RecommendationType
  score: number
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export enum RecommendationType {
  PERSONALIZED = 'personalized',
  POPULAR = 'popular',
  EDITORIAL = 'editorial',
  SIMILAR = 'similar',
  TRENDING = 'trending'
}

// 查询参数类型
export interface MediaQueryParams {
  page?: number
  limit?: number
  type?: MediaType
  genre?: string
  minRating?: number
  maxRating?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'viewCount'
  sortOrder?: 'ASC' | 'DESC'
}

export interface PlaySourceQueryParams {
  page?: number
  limit?: number
  type?: PlaySourceType
  status?: PlaySourceStatus
  mediaResourceId?: number
}

export interface WatchHistoryQueryParams {
  page?: number
  limit?: number
  userId?: number
  mediaResourceId?: number
  completed?: boolean
}

export interface RecommendationQueryParams {
  page?: number
  limit?: number
  type?: RecommendationType
  userId?: number
  minScore?: number
}

// API 错误类型
export interface ApiError {
  message: string
  status: number
  data?: any
}

// 分页类型
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 组件 Props 类型
export interface MediaCardProps {
  media: MediaResource
  showRating?: boolean
  showViewCount?: boolean
  clickable?: boolean
  size?: 'small' | 'medium' | 'large'
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: {
    text: string
    onClick: () => void
  }
}

// 路由类型
export interface RouteMeta {
  requiresAuth?: boolean
  requiresAdmin?: boolean
  title?: string
}

// 表单类型
export interface LoginForm {
  username: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  nickname?: string
}