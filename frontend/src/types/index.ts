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

// 高级功能类型定义
export interface WebDiskInfo {
  provider: 'quark' | 'uc' | 'baidu' | 'aliyun'
  fileId: string
  fileName: string
  fileSize: number
  fileUrl: string
  downloadUrl?: string
  thumbnailUrl?: string
  duration?: number
  resolution?: string
  format?: string
}

export interface MagnetInfo {
  hash: string
  name: string
  size: number
  files?: Array<{
    name: string
    size: number
    format?: string
  }>
  trackers: string[]
  peers: number
  seeds: number
  status: 'downloading' | 'seeding' | 'completed' | 'error'
  progress: number
  downloadSpeed: number
  uploadSpeed: number
  localPath?: string
}

export interface IPTVChannel {
  id: string
  name: string
  url: string
  logo?: string
  group: string
  category: 'live' | 'movie' | 'series' | 'variety' | 'sports'
  resolution?: string
  language?: string
  epgUrl?: string
  tvgId?: string
  tvgName?: string
  tvgLogo?: string
  isActive: boolean
  quality: number
  lastChecked: Date
  createdAt: Date
  updatedAt: Date
}

export interface LivePlatform {
  id: string
  name: string
  platform: 'huya' | 'douyin' | 'bilibili' | 'douyu' | 'yy'
  roomId: string
  roomTitle: string
  streamer: string
  avatar?: string
  cover?: string
  category: string
  tags: string[]
  isLive: boolean
  viewers: number
  likeCount?: number
  streamUrl?: string
  hlsUrl?: string
  flvUrl?: string
  quality: '720p' | '1080p' | '4k' | 'origin'
  status: 'online' | 'offline' | 'banned' | 'error'
  lastUpdated: Date
  createdAt: Date
}

export interface SearchEngine {
  id: string
  name: string
  type: 'webdisk' | 'iptv' | 'live' | 'magnet' | 'general'
  baseUrl: string
  searchEndpoint: string
  enabled: boolean
  priority: number
  config: Record<string, any>
  successRate: number
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SearchResult {
  id: string
  engine: string
  type: 'media' | 'webdisk' | 'iptv' | 'live' | 'magnet'
  title: string
  description?: string
  url?: string
  thumbnail?: string
  size?: number
  quality?: string
  format?: string
  duration?: number
  resolution?: string
  source: string
  score: number
  metadata?: Record<string, any>
  parsedData?: {
    playSources?: PlaySource[]
    mediaResource?: MediaResource
  }
  createdAt: Date
}

export interface TVBoxSubscription {
  id: string
  name: string
  url: string
  type: 'json' | 'm3u' | 'txt'
  description?: string
  icon?: string
  version: string
  author?: string
  website?: string
  lastUpdate?: Date
  isActive: boolean
  categories: string[]
  channelsCount: number
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DoubanRecommendation {
  id: string
  title: string
  originalTitle?: string
  year: number
  rating: number
  votes: number
  genres: string[]
  directors: string[]
  actors: string[]
  duration: number
  poster: string
  backdrop?: string
  imdbId?: string
  doubanUrl: string
  summary: string
  type: 'movie' | 'tv'
  seasons?: number
  episodes?: number
  releaseDate: Date
  country: string
  language: string
  alsoKnownAs?: string[]
  keywords: string[]
  recommendationScore: number
  reason: string
  source: 'douban_movie' | 'douban_tv' | 'douban_book'
}

export interface HotSearchItem {
  id: string
  keyword: string
  category: 'entertainment' | 'news' | 'sports' | 'tech' | 'life'
  rank: number
  heat: number
  trend: 'up' | 'down' | 'stable'
  relatedKeywords?: string[]
  searchCount: number
  icon?: string
  url?: string
  description?: string
  updatedAt: Date
}

export interface SearchSuggestion {
  text: string
  type: 'keyword' | 'media' | 'person' | 'tag'
  category?: string
  count?: number
  popularity?: number
  thumbnail?: string
  metadata?: Record<string, any>
}

// 网盘解析器类型
export interface WebDiskParser {
  id: string
  name: string
  provider: 'quark' | 'uc' | 'baidu' | 'aliyun'
  version: string
  enabled: boolean
  priority: number
  config: {
    apiKey?: string
    apiSecret?: string
    userId?: string
    cookie?: string
    token?: string
    timeout: number
    retryCount: number
  }
  status: 'active' | 'inactive' | 'error'
  lastUsed?: Date
  successRate: number
  averageTime: number
  createdAt: Date
  updatedAt: Date
}

// 磁力链接解析器类型
export interface MagnetParser {
  id: string
  name: string
  version: string
  enabled: boolean
  priority: number
  config: {
    trackers: string[]
    timeout: number
    maxConnections: number
    downloadPath: string
    enableDht: boolean
    enablePex: boolean
  }
  status: 'active' | 'inactive' | 'error'
  activeDownloads: number
  totalDownloads: number
  successRate: number
  createdAt: Date
  updatedAt: Date
}

// 播放器类型
export interface PlayerConfig {
  id: string
  name: string
  type: 'dplayer' | 'artplayer' | 'videojs' | 'hls' | 'flv'
  config: Record<string, any>
  enabled: boolean
  priority: number
  supportedFormats: string[]
  supportedProtocols: string[]
  features: {
    autoplay?: boolean
    pip?: boolean
    airplay?: boolean
    chromecast?: boolean
    subtitle?: boolean
    danmaku?: boolean
    screenshot?: boolean
    record?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

// 缓存管理类型
export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
  compression: boolean
  persist: boolean
  storage: 'memory' | 'local' | 'session'
  excludePatterns: string[]
}

// 性能监控类型
export interface PerformanceMetrics {
  timestamp: Date
  pageLoadTime: number
  domReadyTime: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
  memoryUsage: {
    used: number
    total: number
    limit: number
  }
  networkInfo: {
    downlink: number
    rtt: number
    effectiveType: string
  saveData: boolean
  }
  userAgent: string
  viewport: {
    width: number
    height: number
  }
}