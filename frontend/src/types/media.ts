// 媒体资源相关类型
export interface MediaResource {
  id: number;
  title: string;
  description?: string;
  type: MediaType;
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: Date;
  quality: MediaQuality;
  poster?: string;
  backdrop?: string;
  rating: number;
  viewCount: number;
  isActive: boolean;
  source?: string;
  metadata?: any;
  episodeCount?: number;
  downloadUrls?: string[];
  duration?: number; // 添加时长字段
  createdAt: Date;
  updatedAt: Date;
}

export enum MediaType {
  MOVIE = 'movie',
  TV_SERIES = 'tv_series',
  VARIETY = 'variety',
  ANIME = 'anime',
  DOCUMENTARY = 'documentary',
}

export enum MediaQuality {
  HD = 'hd',
  FULL_HD = 'full_hd',
  BLUE_RAY = 'blue_ray',
  SD = 'sd',
}

// 播放源相关类型
export interface PlaySource {
  id: number;
  url: string;
  type: PlaySourceType;
  status: PlaySourceStatus;
  resolution?: string;
  format?: string;
  subtitleUrl?: string;
  priority: number;
  isAds: boolean;
  name?: string; // 添加名称字段
  downloadUrls?: string[]; // 添加下载链接字段
  playCount: number;
  description?: string;
  sourceName?: string;
  isActive: boolean;
  headers?: any;
  expireDate?: Date;
  channelGroup?: string;
  channelLogo?: string;
  providerName?: string;
  magnetInfo?: any;
  webDiskInfo?: any;
  episodeNumber?: number;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date;
  mediaResourceId: number;
  mediaResource?: MediaResource;
}

export enum PlaySourceType {
  ONLINE = 'online',
  DOWNLOAD = 'download',
  STREAM = 'stream',
  THIRD_PARTY = 'third_party',
  MAGNET = 'magnet',
  IPTV = 'iptv',
  WEBDISK = 'webdisk',
  PARSER = 'parser',
}

export enum PlaySourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CHECKING = 'checking',
}

// 查询参数类型
export interface MediaQueryParams {
  page?: number;
  limit?: number;
  type?: MediaType;
  genre?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'viewCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PlaySourceQueryParams {
  page?: number;
  limit?: number;
  type?: PlaySourceType;
  status?: PlaySourceStatus;
  mediaResourceId?: number;
  sortBy?: 'priority' | 'createdAt' | 'playCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PlaySourceCreateData {
  mediaResourceId: number;
  url: string;
  type: PlaySourceType;
  resolution?: string;
  format?: string;
  subtitleUrl?: string;
  priority: number;
  isAds: boolean;
  description?: string;
  sourceName?: string;
  headers?: any;
  expireDate?: Date;
  channelGroup?: string;
  channelLogo?: string;
  providerName?: string;
  magnetInfo?: any;
  webDiskInfo?: any;
  episodeNumber?: number;
}

export interface PlaySourceUpdateData {
  url?: string;
  type?: PlaySourceType;
  status?: PlaySourceStatus;
  resolution?: string;
  format?: string;
  subtitleUrl?: string;
  priority?: number;
  isAds?: boolean;
  description?: string;
  sourceName?: string;
  isActive?: boolean;
  headers?: any;
  expireDate?: Date;
  channelGroup?: string;
  channelLogo?: string;
  providerName?: string;
  magnetInfo?: any;
  webDiskInfo?: any;
  episodeNumber?: number;
}
