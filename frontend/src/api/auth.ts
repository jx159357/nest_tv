import ApiClient from './index'
import type { LoginCredentials, RegisterUserData } from '@/types'

export const authApi = {
  // 用户登录
  login: (credentials: LoginCredentials) => {
    return ApiClient.post('/auth/login', credentials)
  },

  // 用户注册
  register: (userData: RegisterUserData) => {
    return ApiClient.post('/auth/register', userData)
  },

  // 获取用户信息
  getProfile: () => {
    return ApiClient.get('/users/profile', undefined, false) // 不使用缓存
  },

  // 更新用户信息
  updateProfile: (userData: any) => {
    return ApiClient.put('/users/profile', userData)
  },

  // 修改密码
  changePassword: (passwordData: { oldPassword: string; newPassword: string }) => {
    return ApiClient.put('/users/change-password', passwordData)
  },

  // 检查令牌有效性
  validateToken: () => {
    return ApiClient.get<{ valid: boolean; user: any }>('/auth/validate', undefined, false)
  },

  // 退出登录
  logout: () => {
    return ApiClient.post('/auth/logout')
  }
}