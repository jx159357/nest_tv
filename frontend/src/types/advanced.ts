// 高级功能类型定义
export interface WebDiskInfo {
  provider: 'quark' | 'uc' | 'baidu' | 'aliyun';
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  format?: string;
}

export interface MagnetInfo {
  magnetUri: string;
  infoHash: string;
  name: string;
  size: number;
  files: MagnetFile[];
  trackers: string[];
  announceList: string[];
  creationDate?: Date;
  createdBy?: string;
  comment?: string;
  encoding?: string;
}

export interface MagnetFile {
  path: string;
  length: number;
  md5sum?: string;
}

export interface DownloadTask {
  id: string;
  url: string;
  type: 'direct' | 'torrent' | 'magnet';
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
  progress: number;
  speed: number;
  downloaded: number;
  total: number;
  fileName: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: DownloadMetadata;
}

export interface DownloadMetadata {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  format?: string;
  subtitles?: DownloadSubtitle[];
}

export interface DownloadSubtitle {
  language: string;
  url: string;
  label?: string;
  format: 'srt' | 'vtt' | 'ass' | 'ssa';
}

export interface DownloadConfig {
  maxConcurrentDownloads: number;
  downloadPath: string;
  enableDht: boolean;
  enablePex: boolean;
  autoRetry: boolean;
  maxRetries: number;
  timeout: number;
  chunkSize: number;
}

export interface DownloadManager {
  id: string;
  name: string;
  config: DownloadConfig;
  status: 'active' | 'inactive' | 'error';
  activeDownloads: number;
  totalDownloads: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}
