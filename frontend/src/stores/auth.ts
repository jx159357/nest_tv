import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User } from '@/types/user';
import { log } from '@/utils/logger';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref(localStorage.getItem('token') || '');
  const refreshTokenValue = ref(localStorage.getItem('refreshToken') || '');
  const isLoading = ref(false);
  const tokenRefreshTimer = ref<number | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => {
    const role = user.value?.role;
    return role === 'admin' || role === 'superAdmin';
  });

  // 登录
  const login = async (credentials: { identifier: string; password: string }) => {
    isLoading.value = true;
    try {
      const response = await authApi.login(credentials);
      const { accessToken, refreshToken, user: userData } = response;

      token.value = accessToken;
      refreshTokenValue.value = refreshToken;
      user.value = userData;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // 启动token刷新定时器
      startTokenRefreshTimer();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || '登录失败',
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 注册
  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    phone?: string;
    nickname?: string;
  }) => {
    isLoading.value = true;
    try {
      const response = await authApi.register(userData);
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || '注册失败',
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 登出
  const logout = () => {
    token.value = '';
    refreshTokenValue.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    stopTokenRefreshTimer();
  };

  // 获取用户信息
  const fetchUserProfile = async (): Promise<void> => {
    if (!token.value) return;

    try {
      const response = await authApi.getProfile();
      user.value = response;
    } catch (error) {
      log.error('Auth', '获取用户信息失败:', error);
      // 如果获取用户信息失败，可能是token过期，尝试刷新
      const refreshed = await refreshToken();
      if (!refreshed) {
        logout();
      }
    }
  };

  // 刷新token
  const refreshToken = async (): Promise<boolean> => {
    if (!refreshTokenValue.value) {
      return false;
    }

    try {
      const response = await authApi.refreshToken(refreshTokenValue.value);
      if (response?.accessToken) {
        token.value = response.accessToken;
        refreshTokenValue.value = response.refreshToken;
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      log.error('Auth', '刷新token失败:', error);
      return false;
    }
  };

  // 启动token刷新定时器（每6天刷新一次）
  const startTokenRefreshTimer = () => {
    stopTokenRefreshTimer();
    const sixDaysInMs = 6 * 24 * 60 * 60 * 1000;
    tokenRefreshTimer.value = window.setInterval(async () => {
      await refreshToken();
    }, sixDaysInMs);
  };

  // 停止token刷新定时器
  const stopTokenRefreshTimer = () => {
    if (tokenRefreshTimer.value) {
      clearInterval(tokenRefreshTimer.value);
      tokenRefreshTimer.value = null;
    }
  };

  // 初始化时检查token
  const initAuth = async () => {
    if (token.value) {
      await fetchUserProfile();
      startTokenRefreshTimer();
    }
  };

  return {
    user,
    token,
    refreshTokenValue,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchUserProfile,
    refreshToken,
    initAuth,
  };
});
