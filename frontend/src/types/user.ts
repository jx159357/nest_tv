// 用户相关类型
import type { MediaResource } from './media';

// 临时定义 WatchHistoryItem 类型，等 history.ts 模块完善后再导入
interface WatchHistoryItem {
  id: number;
  userId: number;
  mediaResourceId: number;
  mediaResource?: MediaResource;
  watchProgress: number;
  lastWatchedAt: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  recommendationSettings?: UserRecommendationSettings;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecommendationSettings {
  preferredTypes?: string[];
  preferredGenres?: string[];
  excludedGenres?: string[];
  preferredKeywords?: string[];
  freshnessBias?: 'balanced' | 'fresh' | 'classic';
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role: string;
  watchHistory: WatchHistoryItem[];
  favorites: MediaResource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateData {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  recommendationSettings?: UserRecommendationSettings;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
