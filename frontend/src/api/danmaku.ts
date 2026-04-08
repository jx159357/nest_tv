import ApiClient from './index';

export interface DanmakuRealtimeRoomInfo {
  videoId: string;
  onlineUsers: number;
  messageCount: number;
  isActive: boolean;
  lastActivity: string | null;
  message: string;
}

export interface DanmakuFilterRulesSnapshot {
  sensitiveWords: string[];
  spamPatterns: string[];
  level: 'low' | 'medium' | 'high';
  autoBlock: boolean;
  message: string;
}

export interface DanmakuHealthStatus {
  status: 'healthy';
  database: 'connected';
  websocket: 'active';
  performance: {
    responseTime: 'normal';
    memoryUsage: 'normal';
    activeConnections: number;
    activeRooms: number;
    totalMessages: number;
  };
  lastUpdate: string;
  uptime: number;
  message: string;
}

export interface ReportedDanmakuItem {
  id: number;
  text: string;
  videoId: string;
  userId: number;
  reportCount: number;
  status: 'active' | 'reported' | 'hidden';
  latestReason: string | null;
  lastReportedAt: string | null;
}

export interface ModerateDanmakuPayload {
  action: 'hide' | 'restore';
}

export interface DanmakuSuggestionItem {
  text: string;
  color: string;
  type: 'scroll' | 'top' | 'bottom';
  priority: number;
  score: number;
}

export interface DanmakuSuggestionsResponse {
  videoId?: string;
  mediaResourceId?: number;
  type: 'popular' | 'recent' | 'relevant';
  limit: number;
  suggestions: DanmakuSuggestionItem[];
}

export interface DanmakuCreatePayload {
  text: string;
  color?: string;
  type?: 'scroll' | 'top' | 'bottom';
  priority?: number;
  videoId: string;
  mediaResourceId: number;
}

export interface DanmakuRecord {
  id: number;
  text: string;
  color: string;
  type: 'scroll' | 'top' | 'bottom';
  priority: number;
  videoId: string;
  userId: number;
  isHighlighted?: boolean;
  metadata?: {
    timestamp?: number;
  };
  createdAt?: string;
}

export const danmakuApi = {
  getRoomInfo: (videoId: string) =>
    ApiClient.get<DanmakuRealtimeRoomInfo>(`/danmaku/realtime/rooms/${videoId}`, undefined, false),

  getFilterRules: () =>
    ApiClient.get<DanmakuFilterRulesSnapshot>('/danmaku/filter/rules', undefined, false),

  updateFilterRules: (payload: {
    sensitiveWords?: string[];
    spamPatterns?: string[];
    level?: 'low' | 'medium' | 'high';
    autoBlock?: boolean;
  }) =>
    ApiClient.put<{
      success: boolean;
      message: string;
      updatedRules: Omit<DanmakuFilterRulesSnapshot, 'message'>;
    }>('/danmaku/filter/rules', payload),

  resetFilterRules: () =>
    ApiClient.post<{
      success: boolean;
      message: string;
      updatedRules: Omit<DanmakuFilterRulesSnapshot, 'message'>;
    }>('/danmaku/filter/rules/reset', {}),

  getHealth: () => ApiClient.get<DanmakuHealthStatus>('/danmaku/health', undefined, false),

  getReportedDanmaku: (limit = 10) =>
    ApiClient.get<{ data: ReportedDanmakuItem[]; limit: number; message: string }>(
      '/danmaku/reports',
      { params: { limit } },
      false,
    ),

  moderateDanmaku: (id: number, payload: ModerateDanmakuPayload) =>
    ApiClient.patch<{
      success: boolean;
      message: string;
      danmaku: { id: number; isActive: boolean };
    }>(`/danmaku/${id}/moderation`, payload),

  getSuggestions: (params: {
    videoId?: string;
    mediaResourceId?: number;
    type?: 'popular' | 'recent' | 'relevant';
    limit?: number;
  }) => ApiClient.get<DanmakuSuggestionsResponse>('/danmaku/suggestions', { params }, false),

  sendDanmaku: (payload: DanmakuCreatePayload) =>
    ApiClient.post<DanmakuRecord>('/danmaku', payload),
};
