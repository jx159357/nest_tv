// 弹幕相关类型
export interface DanmakuMessage {
  id: string;
  userId: string;
  videoId: string;
  text: string;
  color: string;
  type: 'scroll' | 'top' | 'bottom';
  priority: number;
  timestamp: number;
  isHighlighted?: boolean;
  filters?: {
    containsSensitive?: boolean;
    containsSpam?: boolean;
    containsEmojis?: boolean;
    keywords?: string[];
  };
  metadata?: {
    userAgent?: string;
    location?: string;
    platform?: string;
  };
  position?: {
    x: number;
    y: number;
    startTime: number;
  };
}

// 房间信息类型
export interface RoomInfo {
  videoId: string;
  onlineCount: number;
  timestamp: number;
}

// 心跳响应类型
export interface HeartbeatResponse {
  status: 'ok' | 'error';
  timestamp: number;
  userId: string;
}

// 弹幕设置类型
export interface DanmakuSettings {
  enabled: boolean;
  opacity: number;
  fontSize: number;
  speed: number;
  color: string;
  fontFamily: string;
  filter: {
    profanity: boolean;
    spam: boolean;
    highlight: boolean;
  };
  display: {
    scroll: boolean;
    top: boolean;
    bottom: boolean;
  };
}

// 弹幕服务配置
export interface DanmakuServiceConfig {
  serverUrl: string;
  reconnectDelay: number;
  heartbeatInterval: number;
  maxQueueSize: number;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
}

// 弹幕统计信息
export interface DanmakuStats {
  totalMessages: number;
  activeUsers: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  errorCount: number;
  uptime: number;
}

// 弹幕过滤规则
export interface DanmakuFilterRule {
  id: string;
  type: 'keyword' | 'regex' | 'user' | 'length';
  pattern: string;
  action: 'block' | 'highlight' | 'delay';
  priority: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 弹幕用户信息
export interface DanmakuUser {
  id: string;
  username: string;
  avatar?: string;
  level?: number;
  isVip?: boolean;
  isModerator?: boolean;
  isBanned?: boolean;
  bannedUntil?: Date;
  banReason?: string;
}

// 弹幕房间信息
export interface DanmakuRoom {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isLive: boolean;
  viewerCount: number;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  moderators: string[];
  rules: DanmakuFilterRule[];
  settings: DanmakuSettings;
}

// 弹幕历史记录
export interface DanmakuHistory {
  id: string;
  roomId: string;
  messages: DanmakuMessage[];
  totalMessages: number;
  startTime: Date;
  endTime: Date;
  exportedBy: string;
  exportedAt: Date;
}

// 弹幕导出选项
export interface DanmakuExportOptions {
  format: 'json' | 'xml' | 'ass' | 'srt';
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeFilters?: boolean;
  compress?: boolean;
  includeMetadata?: boolean;
}