import ApiClient from './index';

export interface ParsedMagnetResult {
  infoHash: string;
  name: string;
  announce: string[];
  urlList: string[];
  keywords: string[];
  exactSources: string[];
}

export interface TorrentLinkedMedia {
  id: number;
  title: string;
  type: string;
  poster?: string;
}

export interface TorrentInfoResult {
  infoHash: string;
  name: string;
  size: string | number | null;
  files: Array<{ name: string; size?: number }>;
  announce: string[];
  relatedSourcesCount: number;
  linkedMedia: TorrentLinkedMedia[];
}

export interface TorrentHealthResult {
  infoHash: string;
  isHealthy: boolean;
  seeders: number | null;
  leechers: number | null;
  knownSources: number;
  lastChecked: string | null;
}

export interface TorrentListItem {
  infoHash: string;
  name: string;
  size: string | number | null;
  seeders: number | null;
  leechers: number | null;
  added: string;
  category: string | null;
  mediaResourceId: number;
  mediaTitle?: string;
}

export interface TorrentSearchResponse {
  data: TorrentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const torrentApi = {
  getInfo: (hash: string) =>
    ApiClient.get<TorrentInfoResult>(`/torrent/info/${hash}`, undefined, false),

  getHealth: (hash: string) =>
    ApiClient.get<TorrentHealthResult>(`/torrent/health/${hash}`, undefined, false),

  parseMagnet: (magnetUri: string) =>
    ApiClient.post<ParsedMagnetResult>('/torrent/parse', { magnetUri }),

  search: (params: { keyword: string; page?: number; pageSize?: number }) =>
    ApiClient.get<TorrentSearchResponse>('/torrent/search', { params }, false),

  getPopular: (params?: { limit?: number; category?: string }) =>
    ApiClient.get<TorrentListItem[]>('/torrent/popular', { params }, false),

  getLatest: (params?: { limit?: number; category?: string }) =>
    ApiClient.get<TorrentListItem[]>('/torrent/latest', { params }, false),
};
