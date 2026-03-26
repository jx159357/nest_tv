import ApiClient from './index';

export interface CrawlerTarget {
  name: string;
  baseUrl: string;
  enabled?: boolean;
  status?: 'online' | 'offline' | 'unknown';
}

export interface CrawlPersistence {
  mediaResourceId: number;
  created: boolean;
  playSourceCount: number;
  skippedPlaySources: number;
}

export interface CrawlResultData {
  title: string;
  description?: string;
  type: string;
  rating: number;
  source: string;
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: string;
  episodeCount?: number;
  poster?: string;
  downloadUrls?: string[];
}

export interface CrawlResultResponse {
  success: boolean;
  message: string;
  data?: CrawlResultData;
  persistence?: CrawlPersistence | null;
  error?: string;
}

export interface BatchCrawlResponse {
  success: boolean;
  message: string;
  data?: {
    crawledData: CrawlResultData[];
    successCount: number;
    failureCount: number;
    savedCount: number;
    totalRequested: number;
  };
}

export interface CollectedSourceSummary {
  sourceName: string;
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoPlayableUrls: number;
  createdMedia: number;
  createdPlaySources: number;
  skippedPlaySources: number;
  urls: string[];
  errors: string[];
}

export interface CollectPopularResponse {
  success: boolean;
  message: string;
  data?: CollectedSourceSummary;
}

export interface SourceHealthSummary {
  name: string;
  baseUrl: string;
  dailyEnabled: boolean;
  dailyLimit: number;
  proxyMode: 'direct' | 'prefer-proxy' | 'proxy-required';
  requirePlayableUrls: boolean;
  minimumPlayableUrls: number;
  suggestedProxyMode: 'direct' | 'prefer-proxy' | 'proxy-required';
  qualityScore: number;
  recommendation: string;
  totalPlaySources: number;
  activePlaySources: number;
  inactivePlaySources: number;
  recentPlaySources24h: number;
  activeRate: number;
  latestCreatedAt: string | null;
  latestCheckedAt: string | null;
}

export interface SourcePolicyUpdatePayload {
  dailyEnabled?: boolean;
  dailyLimit?: number;
  proxyMode?: 'direct' | 'prefer-proxy' | 'proxy-required';
  requirePlayableUrls?: boolean;
  minimumPlayableUrls?: number;
}

export const crawlerApi = {
  getTargets: async (): Promise<CrawlerTarget[]> => {
    const response = await ApiClient.get<{ success: boolean; data: CrawlerTarget[] }>(
      '/crawler/targets',
    );
    return response.data || [];
  },

  testConnection: (targetName: string) =>
    ApiClient.get<{ success: boolean }>(
      `/crawler/test-connection?targetName=${encodeURIComponent(targetName)}`,
    ),

  crawl: (payload: { url: string; targetName: string }) =>
    ApiClient.post<CrawlResultResponse>('/crawler/crawl', payload),

  crawlAndSave: (payload: { url: string; targetName: string }) =>
    ApiClient.post<CrawlResultResponse>('/crawler/crawl-and-save', payload),

  batchCrawl: (payload: { targetName: string; urls: string[] }) =>
    ApiClient.post<BatchCrawlResponse>('/crawler/batch-crawl', payload),

  collectPopularResources: (sourceName: string, limit = 10) =>
    ApiClient.post<CollectPopularResponse>(
      `/data-collection/collect-popular/${encodeURIComponent(sourceName)}?limit=${limit}`,
      {},
    ),

  getSourceHealth: () => ApiClient.get<SourceHealthSummary[]>('/data-collection/source-health'),

  updateSourcePolicy: (sourceName: string, payload: SourcePolicyUpdatePayload) =>
    ApiClient.patch<CrawlerTarget>(
      `/data-collection/sources/${encodeURIComponent(sourceName)}/policy`,
      payload,
    ),
};
