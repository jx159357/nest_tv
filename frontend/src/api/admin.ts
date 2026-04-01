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
  downloadTaskCount: number;
  activeDownloadTaskCount: number;
  completedDownloadTaskCount: number;
  failedDownloadTaskCount: number;
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

export interface AdminRoleItem {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRolePayload {
  name: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface AdminPermissionItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPermissionPayload {
  code: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
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

export interface AdminDownloadTaskItem {
  id: number;
  clientId: string;
  url: string;
  type: 'direct' | 'torrent' | 'magnet';
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
  progress: number;
  speed: number;
  downloaded: number;
  total: number;
  fileName: string;
  filePath?: string;
  sourceLabel?: string;
  handler?: 'browser' | 'system';
  launchCount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  userId: number;
  mediaResourceId?: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  lastLaunchedAt?: string | null;
  user?: Pick<User, 'id' | 'username' | 'email' | 'nickname'>;
  mediaResource?: Pick<MediaResource, 'id' | 'title' | 'type' | 'poster'>;
}

export const adminApi = {
  getStats: () => ApiClient.get<AdminSystemStats>('/admin/stats', undefined, false),

  getHealth: () => ApiClient.get<AdminHealthStatus>('/admin/health', undefined, false),

  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    ApiClient.get<AdminPaginatedResponse<User>>('/admin/users', { params }, false),

  getMedia: (params?: { page?: number; limit?: number; type?: string; search?: string }) =>
    ApiClient.get<AdminPaginatedResponse<MediaResource>>('/admin/media', { params }, false),

  getRoles: () => ApiClient.get<AdminRoleItem[]>('/admin/roles', undefined, false),

  createRole: (payload: AdminRolePayload) =>
    ApiClient.post<AdminRoleItem>('/admin/roles', payload),

  updateRole: (id: number, payload: Partial<AdminRolePayload>) =>
    ApiClient.patch<AdminRoleItem>(`/admin/roles/${id}`, payload),

  getPermissions: () => ApiClient.get<AdminPermissionItem[]>('/admin/permissions', undefined, false),

  createPermission: (payload: AdminPermissionPayload) =>
    ApiClient.post<AdminPermissionItem>('/admin/permissions', payload),

  updatePermission: (id: number, payload: Partial<AdminPermissionPayload>) =>
    ApiClient.patch<AdminPermissionItem>(`/admin/permissions/${id}`, payload),

  getPlaySources: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    source?: string;
    sources?: string;
    search?: string;
    status?: string;
    sortBy?: 'createdAt' | 'lastCheckedAt' | 'priority';
    sortOrder?: 'ASC' | 'DESC';
  }) =>
    ApiClient.get<AdminPaginatedResponse<PlaySource>>('/admin/play-sources', { params }, false),

  getWatchHistory: (params?: { page?: number; limit?: number; userId?: number }) =>
    ApiClient.get<AdminPaginatedResponse<AdminWatchHistoryItem>>(
      '/admin/watch-history',
      { params },
      false,
    ),

  getDownloadTasks: (params?: {
    page?: number;
    limit?: number;
    status?: AdminDownloadTaskItem['status'];
    type?: AdminDownloadTaskItem['type'];
    userId?: number;
    mediaResourceId?: number;
    search?: string;
  }) =>
    ApiClient.get<AdminPaginatedResponse<AdminDownloadTaskItem>>(
      '/admin/download-tasks',
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
