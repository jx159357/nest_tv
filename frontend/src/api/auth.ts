import ApiClient from './index';
import type { 
  LoginCredentials, 
  RegisterUserData, 
  AuthResponse, 
  User 
} from '@/types/user';

export const authApi = {
  // 用户登录
  login: (credentials: LoginCredentials) => {
    return ApiClient.post<AuthResponse>('/auth/login', credentials);
  },

  // 用户注册
  register: (userData: RegisterUserData) => {
    return ApiClient.post<User>('/auth/register', userData);
  },

  // 获取用户信息
  getProfile: () => {
    return ApiClient.get<User>('/users/profile', undefined, false); // 不使用缓存
  },

  // 更新用户信息
  updateProfile: (userData: Partial<User>) => {
    return ApiClient.put<User>('/users/profile', userData);
  },

  // 修改密码
  changePassword: (passwordData: { oldPassword: string; newPassword: string }) => {
    return ApiClient.put<void>('/users/change-password', passwordData);
  },

  // 检查令牌有效性
  validateToken: () => {
    return ApiClient.get<{ valid: boolean; user: User }>('/auth/validate', undefined, false);
  },

  // 退出登录
  logout: () => {
    return ApiClient.post<void>('/auth/logout');
  },
};
