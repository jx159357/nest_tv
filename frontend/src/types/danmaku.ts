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
  messageCount?: number;
  isActive?: boolean;
  lastActivity?: string | null;
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
  maxReconnectAttempts: number;
}

