// 统一导出所有类型定义

// API 相关类型
export * from './api';

// 用户相关类型
export * from './user';

// 媒体相关类型
export * from './media';

// 历史记录相关类型
export * from './history';

// 组件相关类型
export * from './components';

// 高级功能相关类型
export * from './advanced';

// 播放器相关类型
export * from './player';

// 弹幕相关类型
export * from './danmaku';

// 系统日志相关类型
export * from './logs';

// 兼容性：重新导出一些常用类型以确保向后兼容
import { ApiResponse, PaginatedResponse, PaginationParams, FilterParams } from './api';

import {
  User,
  LoginCredentials,
  RegisterUserData,
  AuthResponse,
  UserProfile,
  UserUpdateData,
  ChangePasswordData,
} from './user';

import {
  MediaResource,
  MediaType,
  MediaQuality,
  PlaySource,
  PlaySourceType,
  PlaySourceStatus,
  MediaQueryParams,
  PlaySourceQueryParams,
  PlaySourceCreateData,
  PlaySourceUpdateData,
} from './media';

import {
  WatchHistory,
  WatchHistoryItem,
  WatchHistoryQueryParams,
  WatchHistoryCreateData,
  WatchHistoryUpdateData,
  Recommendation,
  RecommendationType,
  RecommendationQueryParams,
  RecommendationCreateData,
} from './history';

import {
  MediaCardProps,
  LoadingSpinnerProps,
  EmptyStateProps,
  PaginationProps,
  SearchInputProps,
  SearchSuggestion,
  LoginForm,
  RegisterForm,
  MediaFilterForm,
  RouteMeta,
} from './components';

import {
  WebDiskInfo,
  MagnetInfo,
  MagnetFile,
  DownloadTask,
  DownloadMetadata,
  DownloadSubtitle,
  DownloadConfig,
  DownloadManager,
} from './advanced';

import {
  PlayerConfig,
  PlayerOptions,
  SubtitleTrack,
  DanmakuConfig,
  CacheConfig,
  CacheEntry,
  CacheStats,
  PerformanceMetrics,
  PerformanceConfig,
} from './player';

import {
  DanmakuMessage,
  RoomInfo,
  HeartbeatResponse,
  DanmakuSettings,
  DanmakuServiceConfig,
  DanmakuStats,
  DanmakuFilterRule,
  DanmakuUser,
  DanmakuRoom,
  DanmakuHistory,
  DanmakuExportOptions,
} from './danmaku';

import {
  SystemLog,
  LogLevel,
  LogModule,
  LogUser,
  LogQueryParams,
  LogStats,
  LogExportOptions,
} from './logs';

// 重新导出以保持向后兼容
export {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  User,
  LoginCredentials,
  RegisterUserData,
  AuthResponse,
  UserProfile,
  UserUpdateData,
  ChangePasswordData,
  MediaResource,
  MediaType,
  MediaQuality,
  PlaySource,
  PlaySourceType,
  PlaySourceStatus,
  MediaQueryParams,
  PlaySourceQueryParams,
  PlaySourceCreateData,
  PlaySourceUpdateData,
  WatchHistory,
  WatchHistoryItem,
  WatchHistoryQueryParams,
  WatchHistoryCreateData,
  WatchHistoryUpdateData,
  Recommendation,
  RecommendationType,
  RecommendationQueryParams,
  RecommendationCreateData,
  MediaCardProps,
  LoadingSpinnerProps,
  EmptyStateProps,
  PaginationProps,
  SearchInputProps,
  SearchSuggestion,
  LoginForm,
  RegisterForm,
  MediaFilterForm,
  RouteMeta,
  WebDiskInfo,
  MagnetInfo,
  MagnetFile,
  DownloadTask,
  DownloadMetadata,
  DownloadSubtitle,
  DownloadConfig,
  DownloadManager,
  PlayerConfig,
  PlayerOptions,
  SubtitleTrack,
  DanmakuConfig,
  CacheConfig,
  CacheEntry,
  CacheStats,
  PerformanceMetrics,
  PerformanceConfig,
  DanmakuMessage,
  RoomInfo,
  HeartbeatResponse,
  DanmakuSettings,
  DanmakuServiceConfig,
  DanmakuStats,
  DanmakuFilterRule,
  DanmakuUser,
  DanmakuRoom,
  DanmakuHistory,
  DanmakuExportOptions,
  SystemLog,
  LogLevel,
  LogModule,
  LogUser,
  LogQueryParams,
  LogStats,
  LogExportOptions,
};
