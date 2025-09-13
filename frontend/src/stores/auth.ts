import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref(localStorage.getItem('token') || '')
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const login = async (credentials) => {
    isLoading.value = true
    try {
      const response = await authApi.login(credentials)
      const { accessToken, user: userData } = response
      
      token.value = accessToken
      user.value = userData
      localStorage.setItem('token', accessToken)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message || '登录失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    try {
      const response = await authApi.register(userData)
      return { success: true, data: response }
    } catch (error) {
      return {
        success: false,
        error: error.message || '注册失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  const fetchUserProfile = async () => {
    if (!token.value) return
    
    try {
      const response = await authApi.getProfile()
      user.value = response
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserProfile
  }
})