// 播放器类型
export interface PlayerConfig {
  id: string;
  name: string;
  type: 'dplayer' | 'artplayer' | 'videojs' | 'hls' | 'flv';
  config: Record<string, any>;
  enabled: boolean;
  priority: number;
  supportedFormats: string[];
  supportedProtocols: string[];
  features: {
    autoplay?: boolean;
    pip?: boolean;
    airplay?: boolean;
    chromecast?: boolean;
    subtitle?: boolean;
    danmaku?: boolean;
    screenshot?: boolean;
    record?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerOptions {
  autoplay?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  volume?: number;
  playbackRate?: number;
  quality?: string;
  subtitle?: SubtitleTrack[];
  danmaku?: DanmakuConfig;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
  format: 'srt' | 'vtt' | 'ass' | 'ssa';
  default?: boolean;
}

export interface DanmakuConfig {
  enabled: boolean;
  opacity: number;
  fontSize: number;
  speed: number;
  area: number;
  bottom: number;
  color?: string;
  borderColor?: string;
  shadow?: boolean;
  bold?: boolean;
  filter?: {
    level?: number;
    keywords?: string[];
  };
}

// 缓存管理类型
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
  compression: boolean;
  persist: boolean;
  storage: 'memory' | 'local' | 'session';
  excludePatterns: string[];
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictedCount: number;
  lastCleanup: Date;
}

// 性能监控类型
export interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number;
  domReadyTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  };
  networkInfo: {
    downlink: number;
    rtt: number;
    effectiveType: string;
    saveData: boolean;
  };
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface PerformanceConfig {
  enabled: boolean;
  interval: number;
  metrics: string[];
  reporting: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number;
    endpoint?: string;
  };
  optimization: {
    lazyLoad: boolean;
    preLoad: boolean;
    cache: boolean;
    compress: boolean;
  };
}
