import ApiClient from './http';
import { buildApiUrl } from './url';

export interface IPTVChannel {
  id: number;
  name: string;
  url: string;
  group: string;
  logo?: string;
  epgId?: string;
  language?: string;
  country?: string;
  region?: string;
  description?: string;
  resolution?: string;
  isActive: boolean;
  viewCount: number;
  metadata?: Record<string, unknown> | null;
  expireDate?: string;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt?: string;
  isLive: boolean;
  streamFormat?: string;
  backupUrls?: string[];
  qualityScore?: number;
  responseTime?: number;
  sourceName?: string;
  sourceUrl?: string;
  consecutiveFailures?: number;
  isIpv6?: boolean;
  category?: string;
}

export interface IPTVChannelListResponse {
  data: IPTVChannel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPTVStats {
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
  popularChannels: IPTVChannel[];
  recentChannels: IPTVChannel[];
}

export interface IPTVQueryParams {
  page?: number;
  limit?: number;
  group?: string;
  language?: string;
  country?: string;
  region?: string;
  resolution?: string;
  streamFormat?: string;
  activeOnly?: boolean;
  isActive?: boolean;
  isLive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface EpgProgram {
  start: number;
  end: number;
  title: string;
  description?: string;
  category?: string;
}

export interface ChannelEpg {
  channelId: number;
  channelName: string;
  epgId: string | null;
  programs: EpgProgram[];
  lastUpdated: string;
}

export interface StreamTestResult {
  channelId: number;
  channelName: string;
  url: string;
  isAvailable: boolean;
  responseTime: number;
  statusCode?: number;
  contentType?: string;
  error?: string;
}

export interface BatchTestResult {
  total: number;
  available: number;
  unavailable: number;
  results: StreamTestResult[];
  duration: number;
}

export interface QualityStats {
  totalChannels: number;
  activeChannels: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  averageResponseTime: number;
  neverChecked: number;
}

export interface IptvSourceConfig {
  name: string;
  url: string;
  group?: string;
  enabled: boolean;
  updateInterval: number;
  lastUpdated?: string;
  category?: string;
  description?: string;
}

export interface CollectionResult {
  sourceName: string;
  totalCollected: number;
  newChannels: number;
  updatedChannels: number;
  errors: string[];
  duration: number;
}

export interface BatchCollectionResult {
  totalSources: number;
  successSources: number;
  failedSources: number;
  totalChannels: number;
  newChannels: number;
  results: CollectionResult[];
  duration: number;
}

export interface ChannelLogo {
  id: number;
  name: string;
  url: string;
  category?: string;
  country?: string;
  region?: string;
  isVerified: boolean;
  isActive: boolean;
  usageCount: number;
  source?: string;
  aliases?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LogoMatchResult {
  channelId: number;
  channelName: string;
  logoUrl: string | null;
  matched: boolean;
}

export const iptvApi = {
  // ==================== 频道基础 ====================
  getChannels: (params?: IPTVQueryParams) =>
    ApiClient.get<IPTVChannelListResponse>('/iptv', { params }, false),

  getChannel: (id: number) => ApiClient.get<IPTVChannel>(`/iptv/${id}`, undefined, false),

  getStats: () => ApiClient.get<IPTVStats>('/iptv/stats', undefined, false),

  getGroups: () => ApiClient.get<string[]>('/iptv/groups/list', undefined, false),

  getByGroup: (group: string, activeOnly = true) =>
    ApiClient.get<IPTVChannel[]>(
      `/iptv/group/${encodeURIComponent(group)}`,
      { params: { activeOnly } },
      false,
    ),

  searchChannels: (keyword: string, limit = 20) =>
    ApiClient.get<IPTVChannel[]>(
      `/iptv/search/${encodeURIComponent(keyword)}`,
      { params: { limit } },
      false,
    ),

  createChannel: (data: Partial<IPTVChannel>) => ApiClient.post<IPTVChannel>('/iptv', data),

  updateChannel: (id: number, data: Partial<IPTVChannel>) =>
    ApiClient.put<IPTVChannel>(`/iptv/${id}`, data),

  deleteChannel: (id: number) => ApiClient.delete(`/iptv/${id}`),

  validateChannel: (id: number) =>
    ApiClient.get<{ isValid: boolean }>(`/iptv/${id}/validate`, undefined, false),

  incrementViewCount: (id: number) => ApiClient.put(`/iptv/${id}/view`),

  deduplicateChannels: () =>
    ApiClient.post<{
      duplicateGroups: number;
      deactivated: number;
      kept: number;
    }>('/iptv/deduplicate'),

  // ==================== 导入导出 ====================
  importFromM3U: (m3uUrl: string, group?: string) => {
    const params = new URLSearchParams({ m3uUrl });
    if (group) params.set('group', group);
    return ApiClient.post<IPTVChannel[]>(`/iptv/import/m3u?${params.toString()}`, {});
  },

  importFromJson: (
    channels: { name: string; url: string; group?: string; logo?: string }[],
    group?: string,
  ) => {
    const params = group ? `?group=${encodeURIComponent(group)}` : '';
    return ApiClient.post<IPTVChannel[]>(`/iptv/import/json${params}`, { channels });
  },

  importFromTxt: (content: string, group?: string) => {
    const params = group ? `?group=${encodeURIComponent(group)}` : '';
    return ApiClient.post<IPTVChannel[]>(`/iptv/import/txt${params}`, { content });
  },

  exportM3U: (group?: string) => {
    const params = group ? `?group=${encodeURIComponent(group)}` : '';
    return buildApiUrl(`/iptv/export/m3u${params}`);
  },

  exportTxt: (group?: string) => {
    const params = group ? `?group=${encodeURIComponent(group)}` : '';
    return buildApiUrl(`/iptv/export/txt${params}`);
  },

  // ==================== EPG节目单 ====================
  getEpg: (id: number, days?: number) =>
    ApiClient.get<ChannelEpg>(`/iptv/${id}/epg`, days ? { params: { days } } : undefined, false),

  getCurrentProgram: (id: number) =>
    ApiClient.get<EpgProgram | null>(`/iptv/${id}/epg/current`, undefined, false),

  getUpcomingPrograms: (id: number, count?: number) =>
    ApiClient.get<EpgProgram[]>(
      `/iptv/${id}/epg/upcoming`,
      count ? { params: { count } } : undefined,
      false,
    ),

  exportXmltv: () => buildApiUrl('/iptv/epg/xml'),

  getStreamProxyUrl: (url: string, cache = false) => {
    const params = new URLSearchParams({ url });
    if (cache) params.set('cache', 'true');
    return buildApiUrl(`/iptv/stream/proxy?${params.toString()}`);
  },

  getImageProxyUrl: (url: string) => {
    return buildApiUrl(`/iptv/image/proxy?url=${encodeURIComponent(url)}`);
  },

  getKeyProxyUrl: (url: string) => {
    return buildApiUrl(`/iptv/key/proxy?url=${encodeURIComponent(url)}`);
  },

  // ==================== 流质量测试 ====================
  testChannelQuality: (id: number) => ApiClient.post<StreamTestResult>(`/iptv/quality/test/${id}`),

  testAllChannelsQuality: () => ApiClient.post<BatchTestResult>('/iptv/quality/test-all'),

  testGroupQuality: (group: string) =>
    ApiClient.post<BatchTestResult>(`/iptv/quality/test-group/${encodeURIComponent(group)}`),

  getQualityStats: () => ApiClient.get<QualityStats>('/iptv/quality/stats', undefined, false),

  disableLowQualityChannels: (minScore?: number) =>
    ApiClient.post<{ disabledCount: number }>(
      '/iptv/quality/disable-low',
      undefined,
      minScore ? { params: { minScore } } : undefined,
    ),

  // ==================== 直播源收集 ====================
  getSources: () => ApiClient.get<IptvSourceConfig[]>('/iptv/sources', undefined, false),

  addSource: (source: IptvSourceConfig) => ApiClient.post('/iptv/sources', source),

  removeSource: (name: string) => ApiClient.delete(`/iptv/sources/${encodeURIComponent(name)}`),

  toggleSource: (name: string, enabled: boolean) =>
    ApiClient.put(`/iptv/sources/${encodeURIComponent(name)}/toggle`, undefined, {
      params: { enabled },
    }),

  collectFromAllSources: () => ApiClient.post<BatchCollectionResult>('/iptv/sources/collect'),

  collectFromSource: (name: string) =>
    ApiClient.post<CollectionResult>(`/iptv/sources/collect/${encodeURIComponent(name)}`),

  getCollectionStats: () => ApiClient.get('/iptv/sources/stats', undefined, false),

  // ==================== 台标管理 ====================
  getLogos: (category?: string) =>
    ApiClient.get<ChannelLogo[]>(
      '/iptv/logos',
      category ? { params: { category } } : undefined,
      false,
    ),

  searchLogos: (keyword: string) =>
    ApiClient.get<ChannelLogo[]>(
      `/iptv/logos/search/${encodeURIComponent(keyword)}`,
      undefined,
      false,
    ),

  createLogo: (data: Partial<ChannelLogo>) => ApiClient.post<ChannelLogo>('/iptv/logos', data),

  updateLogo: (id: number, data: Partial<ChannelLogo>) =>
    ApiClient.put<ChannelLogo>(`/iptv/logos/${id}`, data),

  deleteLogo: (id: number) => ApiClient.delete(`/iptv/logos/${id}`),

  initLogos: () => ApiClient.post<{ initializedCount: number }>('/iptv/logos/init'),

  matchLogos: () => ApiClient.post<LogoMatchResult[]>('/iptv/logos/match'),

  getLogoStats: () => ApiClient.get('/iptv/logos/stats', undefined, false),

  // ==================== 代理缓存 ====================
  getProxyCacheStats: () =>
    ApiClient.get<{ size: number; entries: number }>('/iptv/proxy/cache/stats', undefined, false),

  clearProxyCache: () => ApiClient.post('/iptv/proxy/cache/clear'),
};
