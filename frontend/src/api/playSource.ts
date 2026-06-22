import ApiClient from './http';
import type { PlaySource, PlaySourceQueryParams } from '@/types/media';

export interface PlaySourceListResponse {
  data: PlaySource[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 播放源相关API
export const playSourceApi = {
  // 获取播放源列表
  getPlaySources: (params?: PlaySourceQueryParams) => {
    const normalizedParams = params
      ? {
          ...params,
          pageSize: params.pageSize ?? params.limit,
        }
      : undefined;

    if (normalizedParams && 'limit' in normalizedParams) {
      delete normalizedParams.limit;
    }

    return ApiClient.get<PlaySourceListResponse>('/play-sources', { params: normalizedParams });
  },

  // 根据ID获取播放源
  getPlaySourceById: (id: string) => {
    return ApiClient.get<PlaySource>(`/play-sources/${id}`);
  },

  // 获取媒体资源的最佳播放源
  getBestPlaySource: (mediaId: string) => {
    return ApiClient.get<PlaySource>(`/play-sources/media/${mediaId}/best`);
  },

  // 获取媒体资源的所有播放源
  getMediaPlaySources: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/play-sources/media/${mediaId}`);
  },

  // 获取媒体资源的所有播放源（按质量排序）
  getPlaySourcesByMediaId: (mediaId: string) => {
    return ApiClient.get<PlaySource[]>(`/play-sources/media/${mediaId}`);
  },

  // 媒体级刷新 - 刷新该媒体下所有失效播放源
  refreshMediaPlaySources: (mediaId: string) => {
    return ApiClient.post<{
      refreshed: number;
      valid: PlaySource[];
      invalid: Array<{ id: number; oldUrl: string; reason: string }>;
      best: PlaySource | null;
    }>(`/play-sources/media/${mediaId}/refresh`);
  },

  // 添加播放源
  createPlaySource: (data: any) => {
    return ApiClient.post<PlaySource>('/play-sources', data);
  },

  // 更新播放源
  updatePlaySource: (id: string, data: any) => {
    return ApiClient.put<PlaySource>(`/play-sources/${id}`, data);
  },

  // 删除播放源
  deletePlaySource: (id: string) => {
    return ApiClient.delete<void>(`/play-sources/${id}`);
  },

  // 验证播放源连接
  testPlaySource: (id: string) => {
    return ApiClient.patch<{ isValid: boolean; message: string; details: Record<string, unknown> }>(
      `/play-sources/${id}/validate`,
    );
  },

  // 单条刷新 - 从原始播放页重新解析 URL
  refreshPlaySource: (id: string) => {
    return ApiClient.patch<{
      refreshed: boolean;
      oldUrl: string;
      newUrl?: string;
      message: string;
      playSource?: PlaySource;
    }>(`/play-sources/${id}/refresh`);
  },

  // 通过 MacCMS 资源站 API 实时解析播放地址
  resolveFromCms: (title: string, episodeNumber?: number) => {
    return ApiClient.post<{ episodes: { episode: string; url: string; sourceName: string }[] }>(
      '/play-sources/resolve',
      { title, episodeNumber },
    );
  },

  // 上报播放性能指标
  reportMetrics: (
    id: number,
    metrics: { firstFrameTimeMs?: number; stallCount?: number; success?: boolean },
  ) => {
    return ApiClient.post<void>(`/play-sources/${id}/metrics`, metrics as Record<string, any>, {
      silent: true,
    });
  },

  batchEnable: (ids: number[]) =>
    ApiClient.post<{ updated: number }>('/play-sources/batch/enable', { ids }),

  batchDisable: (ids: number[]) =>
    ApiClient.post<{ updated: number }>('/play-sources/batch/disable', { ids }),

  batchDelete: (ids: number[]) =>
    ApiClient.post<{ deleted: number }>('/play-sources/batch/delete', { ids }),
};
