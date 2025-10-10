// 系统日志相关类型
export interface SystemLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  module: LogModule;
  message: string;
  user?: LogUser;
  ipAddress?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export enum LogModule {
  AUTH = 'auth',
  USERS = 'users',
  MEDIA = 'media',
  CRAWLER = 'crawler',
  SYSTEM = 'system',
}

export interface LogUser {
  id: number;
  username: string;
  nickname?: string;
  role: string;
}

export interface LogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: LogLevel;
  module?: LogModule;
  date?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LogStats {
  total: number;
  errorCount: number;
  warningCount: number;
  todayCount: number;
  byLevel: Record<LogLevel, number>;
  byModule: Record<LogModule, number>;
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'txt';
  level?: LogLevel[];
  module?: LogModule[];
  startDate?: Date;
  endDate?: Date;
  includeMetadata?: boolean;
}