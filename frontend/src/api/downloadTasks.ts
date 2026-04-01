import ApiClient from './index';
import type { DownloadTask } from '@/types/advanced';

export interface DownloadTaskRecord {
  id: number;
  clientId: string;
  url: string;
  type: DownloadTask['type'];
  status: DownloadTask['status'];
  progress: number;
  speed: number;
  downloaded: number;
  total: number;
  fileName: string;
  filePath?: string;
  sourceLabel?: string;
  handler?: DownloadTask['handler'];
  launchCount?: number;
  error?: string;
  metadata?: DownloadTask['metadata'];
  mediaResourceId?: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  lastLaunchedAt?: string | null;
}

export interface DownloadTasksResponse {
  data: DownloadTaskRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DownloadTaskPayload {
  clientId: string;
  url: string;
  type: DownloadTask['type'];
  status: DownloadTask['status'];
  progress: number;
  speed: number;
  downloaded: number;
  total: number;
  fileName: string;
  filePath?: string;
  sourceLabel?: string;
  handler?: DownloadTask['handler'];
  launchCount?: number;
  error?: string;
  metadata?: DownloadTask['metadata'];
  mediaResourceId?: number | null;
  completedAt?: string;
  lastLaunchedAt?: string;
}

export const downloadTasksApi = {
  listMine: (params?: {
    page?: number;
    limit?: number;
    status?: DownloadTask['status'];
    type?: DownloadTask['type'];
    search?: string;
    mediaResourceId?: number;
  }) => ApiClient.get<DownloadTasksResponse>('/download-tasks/user/me', { params }, false),

  getMineStats: () => ApiClient.get<{ total: number; active: number; completed: number; failed: number }>(
    '/download-tasks/user/me/stats',
    undefined,
    false,
  ),

  upsert: (payload: DownloadTaskPayload) =>
    ApiClient.post<DownloadTaskRecord>('/download-tasks', payload),

  update: (clientId: string, payload: Partial<DownloadTaskPayload>) =>
    ApiClient.patch<DownloadTaskRecord>(`/download-tasks/${clientId}`, payload),

  remove: (clientId: string) => ApiClient.delete<{ success: true }>(`/download-tasks/${clientId}`),

  clearCompleted: () =>
    ApiClient.delete<{ deleted: number }>('/download-tasks/user/me/completed'),
};
