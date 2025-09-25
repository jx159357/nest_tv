<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import AppErrorBoundary from '@/components/AppErrorBoundary.vue'
import AppLayout from '@/components/AppLayout.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const { locale } = useI18n()

// 初始化应用
const initializeApp = async () => {
  try {
    // 初始化主题
    themeStore.initTheme()
    
    // 加载保存的语言设置
    const savedLocale = localStorage.getItem('app-locale')
    if (savedLocale && savedLocale !== locale.value) {
      locale.value = savedLocale
    }
    
    // 如果已登录，获取用户信息
    if (authStore.token) {
      await authStore.fetchUserProfile()
    }
  } catch (error) {
    console.error('App initialization error:', error)
  }
}

onMounted(() => {
  initializeApp()
})
</script>

<template>
  <AppLayout />
</template>
