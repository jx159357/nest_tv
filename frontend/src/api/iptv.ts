import ApiClient from './index';

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
  isLive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export const iptvApi = {
  getChannels: (params?: IPTVQueryParams) =>
    ApiClient.get<IPTVChannelListResponse>('/iptv', { params }, false),

  getChannel: (id: number) => ApiClient.get<IPTVChannel>(`/iptv/${id}`, undefined, false),

  getStats: () => ApiClient.get<IPTVStats>('/iptv/stats', undefined, false),

  getGroups: () => ApiClient.get<string[]>('/iptv/groups/list', undefined, false),

  getByGroup: (group: string, activeOnly = true) =>
    ApiClient.get<IPTVChannel[]>(
      `/iptv/group/${encodeURIComponent(group)}`,
      {
        params: { activeOnly },
      },
      false,
    ),

  searchChannels: (keyword: string, limit = 20) =>
    ApiClient.get<IPTVChannel[]>(
      `/iptv/search/${encodeURIComponent(keyword)}`,
      {
        params: { limit },
      },
      false,
    ),

  validateChannel: (id: number) =>
    ApiClient.get<{ isValid: boolean }>(`/iptv/${id}/validate`, undefined, false),

  importFromM3U: (m3uUrl: string) =>
    ApiClient.post<IPTVChannel[]>(`/iptv/import/m3u?m3uUrl=${encodeURIComponent(m3uUrl)}`, {}),
};
