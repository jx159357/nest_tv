<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="container-responsive">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">
              {{ title }}
            </router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <!-- 移动端菜单按钮 -->
              <div class="lg:hidden">
                <button
                  @click="showMobileMenu = !showMobileMenu"
                  class="text-gray-700 hover:text-gray-900 p-2"
                  aria-label="打开菜单"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <!-- 桌面端完整导航 -->
              <div class="hidden lg:flex lg:items-center lg:space-x-4">
                <template v-for="item in navigationItems" :key="item.path">
                  <component
                    :is="item.external ? 'a' : 'router-link'"
                    v-bind="getLinkProps(item)"
                    class="nav-link"
                    :class="{ 'nav-link-active': isActive(item) }"
                  >
                    {{ item.title }}
                  </component>
                </template>
                
                <button
                  @click="handleLogout"
                  class="nav-link nav-link-logout"
                >
                  退出登录
                </button>
              </div>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-link">
                登录
              </router-link>
              <router-link to="/register" class="nav-button">
                注册
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 移动端菜单 -->
    <div
      v-if="showMobileMenu && authStore.isAuthenticated"
      class="lg:hidden fixed inset-0 z-50"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75"
        @click="showMobileMenu = false"
      ></div>
      <div class="fixed inset-y-0 left-0 flex w-64 bg-white shadow-xl">
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between px-4 py-6 bg-gray-900">
            <h2 class="text-lg font-medium text-white">菜单</h2>
            <button
              @click="showMobileMenu = false"
              class="text-gray-400 hover:text-white"
              aria-label="关闭菜单"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav class="flex-1 px-4 py-6 space-y-3 bg-white">
            <template v-for="item in navigationItems" :key="item.path">
              <component
                :is="item.external ? 'a' : 'router-link'"
                v-bind="getLinkProps(item)"
                class="mobile-nav-item"
                :class="{ 'mobile-nav-item-active': isActive(item) }"
                @click="showMobileMenu = false"
              >
                <svg
                  v-if="item.icon"
                  class="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path :d="item.icon" />
                </svg>
                {{ item.title }}
              </component>
            </template>
          </nav>
          
          <div class="px-4 py-6 bg-gray-50">
            <button
              @click="handleLogout; showMobileMenu = false"
              class="mobile-logout-button"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4 4m4-4l4-4" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <main class="container-responsive py-8">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface NavigationItem {
  path: string
  title: string
  icon?: string
  external?: boolean
  href?: string
  requiresAuth?: boolean
  activePaths?: string[]
}

interface Props {
  title?: string
  navigationItems?: NavigationItem[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '视频平台',
  navigationItems: () => [
    {
      path: '/crawler',
      title: '爬虫管理',
      icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M7 12h10M7 16h10',
    },
    {
      path: '/play-sources',
      title: '播放源管理',
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.553-4.276A1 1 0 0015 8.618v-6.764a1 1 0 00-1.447-.894L5 10z',
    },
    {
      path: '/watch-history',
      title: '观看历史',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      path: '/recommendations',
      title: '为你推荐',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 5.674a1 1 0 01.753-.066l1.28-1.645c.461-.69.595-1.06.902-1.43.226l1.299.784c.404.287.858.389 1.369.205 2.459-.459l1.204-.355c.697-.205 1.66-.205 2.357 0l1.204.355c1.09.664 2.055 1.172 2.459.46l1.299.784c.307.367.441.74.902 1.43l1.28 1.645a1 1 0 01.753.066l1.52 5.674c.298.921 1.603.921 1.902 0 .577-.844 1.52-.921 1.902 0l-1.52 5.674a1 1 0 01-.753.066l-1.28-1.645c-.461-.69-.595-1.06-.902-1.43l-1.299-.784c-.404-.287-.858-.389-1.369-.205l-1.204.355c-.697.205-1.66-.205-2.357 0l-1.204-.355c-1.09-.664-2.055-1.172-2.459-.46l-1.299-.784c-.307-.367-.441-.74-.902-1.43l-1.28-1.645a1 1 0 01-.753-.066l-1.52-5.674z',
    },
    {
      path: '/admin',
      title: '后台管理',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c-1.543-.94-3.31.826-4.512 1.964-1.863-1.257-3.666-3.35-4.857-1.837-1.953-4.332-2.37-6.85-1.638-2.728-1.878-4.51-1.274z',
    },
    {
      path: '/profile',
      title: '个人中心',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
  ] as NavigationItem[],
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showMobileMenu = ref(false)

const isActive = (item: NavigationItem) => {
  if (item.activePaths) {
    return item.activePaths.some(path => route.path.startsWith(path))
  }
  return route.path === item.path
}

const getLinkProps = (item: NavigationItem) => {
  if (item.external && item.href) {
    return {
      href: item.href,
      target: '_blank',
      rel: 'noopener noreferrer',
    }
  }
  return {
    to: item.path,
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.nav-link-active {
  @apply text-indigo-600 bg-indigo-50;
}

.nav-link-logout {
  @apply text-red-600 hover:text-red-700 hover:bg-red-50;
}

.nav-button {
  @apply bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200;
}

.mobile-nav-item {
  @apply flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200;
}

.mobile-nav-item-active {
  @apply text-indigo-600 bg-indigo-50;
}

.mobile-logout-button {
  @apply w-full flex items-center justify-center px-4 py-3 text-base font-medium text-red-600 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors duration-200;
}

/* Container responsive styles */
.container-responsive {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Grid responsive styles */
.grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6;
}
</style>