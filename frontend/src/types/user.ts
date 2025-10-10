// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
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
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}