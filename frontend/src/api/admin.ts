import ApiClient from './index';
import type { MediaResource, PlaySource } from '@/types/media';
import type { User } from '@/types/user';

export interface AdminPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSystemStats {
  userCount: number;
  mediaCount: number;
  playSourceCount: number;
  watchHistoryCount: number;
  recentActivity: Array<Record<string, unknown>>;
}

export interface AdminHealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

export interface AdminLogItem {
  id: number;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'warning';
  description?: string;
  errorMessage?: string;
  roleId: number;
  userId?: number;
  createdAt: string;
  role?: { name?: string };
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

export interface AdminWatchHistoryItem {
  id: number;
  currentTime: number;
  duration?: number;
  watchDuration: number;
  isCompleted: boolean;
  playCount: number;
  updatedAt: string;
  createdAt: string;
  userId: number;
  mediaResourceId: number;
  user?: Pick<User, 'id' | 'username' | 'email' | 'avatar'>;
  mediaResource?: Pick<MediaResource, 'id' | 'title' | 'type' | 'poster'>;
  progress?: {
    currentTime: number;
    duration: number;
    percentage: number;
  };
}

export const adminApi = {
  getStats: () => ApiClient.get<AdminSystemStats>('/admin/stats', undefined, false),

  getHealth: () => ApiClient.get<AdminHealthStatus>('/admin/health', undefined, false),

  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    ApiClient.get<AdminPaginatedResponse<User>>('/admin/users', { params }, false),

  getMedia: (params?: { page?: number; limit?: number; type?: string; search?: string }) =>
    ApiClient.get<AdminPaginatedResponse<MediaResource>>('/admin/media', { params }, false),

  getPlaySources: (params?: { page?: number; limit?: number; type?: string }) =>
    ApiClient.get<AdminPaginatedResponse<PlaySource>>('/admin/play-sources', { params }, false),

  getWatchHistory: (params?: { page?: number; limit?: number; userId?: number }) =>
    ApiClient.get<AdminPaginatedResponse<AdminWatchHistoryItem>>(
      '/admin/watch-history',
      { params },
      false,
    ),

  getLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    status?: 'success' | 'error' | 'warning';
    roleId?: number;
  }) => ApiClient.get<AdminPaginatedResponse<AdminLogItem>>('/admin/logs', { params }, false),
};
