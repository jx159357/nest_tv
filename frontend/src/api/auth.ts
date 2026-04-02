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
    return ApiClient.post<AuthResponse>('/users/login', credentials);
  },

  // 用户注册
  register: (userData: RegisterUserData) => {
    return ApiClient.post<User>('/users/register', userData);
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
    return ApiClient.put<{ success: true }>('/users/change-password', passwordData);
  },

  // 检查令牌有效性
  validateToken: async () => {
    try {
      const user = await ApiClient.get<User>('/users/profile', undefined, false);
      return {
        valid: true,
        user,
      };
    } catch {
      return {
        valid: false,
        user: null,
      };
    }
  },

  // 退出登录由前端本地清理令牌完成；当前后端没有单独的 /auth/logout 端点
  logout: async () => undefined,
};
