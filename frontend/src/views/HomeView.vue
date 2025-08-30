<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">视频平台</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <!-- 移动端菜单按钮 -->
              <div class="lg:hidden">
                <button
                  @click="showMobileMenu = !showMobileMenu"
                  class="text-gray-700 hover:text-gray-900 p-2"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <!-- 桌面端完整导航 -->
              <div class="hidden lg:flex lg:items-center lg:space-x-4">
                <router-link to="/crawler" class="text-gray-700 hover:text-gray-900">
                  爬虫管理
                </router-link>
                <router-link to="/play-sources" class="text-gray-700 hover:text-gray-900">
                  播放源管理
                </router-link>
                <router-link to="/watch-history" class="text-gray-700 hover:text-gray-900">
                  观看历史
                </router-link>
                <router-link to="/recommendations" class="text-gray-700 hover:text-gray-900">
                  为你推荐
                </router-link>
                <router-link to="/admin" class="text-gray-700 hover:text-gray-900">
                  后台管理
                </router-link>
                <router-link to="/profile" class="text-gray-700 hover:text-gray-900">
                  个人中心
                </router-link>
                <button @click="handleLogout" class="text-gray-700 hover:text-gray-900">
                  退出登录
                </button>
              </div>
            </template>
            <template v-else>
              <router-link to="/login" class="text-gray-700 hover:text-gray-900">
                登录
              </router-link>
              <router-link to="/register" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                注册
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu && authStore.isAuthenticated" class="lg:hidden fixed inset-0 z-50">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showMobileMenu = false"></div>
      <div class="fixed inset-y-0 left-0 flex w-64 bg-white shadow-xl">
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between px-4 py-6 bg-gray-900">
            <h2 class="text-lg font-medium text-white">菜单</h2>
            <button @click="showMobileMenu = false" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="flex-1 px-4 py-6 space-y-3 bg-white">
            <router-link
              to="/crawler"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M7 12h10M7 16h10" />
              </svg>
              爬虫管理
            </router-link>
            <router-link
              to="/play-sources"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.553-4.276A1 1 0 0015 8.618v-6.764a1 1 0 00-1.447-.894L5 10z" />
              </svg>
              播放源管理
            </router-link>
            <router-link
              to="/watch-history"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              观看历史
            </router-link>
            <router-link
              to="/recommendations"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 5.674a1 1 0 01.753-.066l1.28-1.645c.461-.69.595-1.06.902-1.43.226l1.299.784c.404.287.858.389 1.369.205 2.459-.459l1.204-.355c.697-.205 1.66-.205 2.357 0l1.204.355c1.09.664 2.055 1.172 2.459.46l1.299.784c.307.367.441.74.902 1.43l1.28 1.645a1 1 0 01.753.066l1.52 5.674c.298.921 1.603.921 1.902 0 .577-.844 1.52-.921 1.902 0l-1.52 5.674a1 1 0 01-.753.066l-1.28-1.645c-.461-.69-.595-1.06-.902-1.43l-1.299-.784c-.404-.287-.858-.389-1.369-.205l-1.204.355c-.697.205-1.66-.205-2.357 0l-1.204-.355c-1.09-.664-2.055-1.172-2.459-.46l-1.299-.784c-.307-.367-.441-.74-.902-1.43l-1.28-1.645a1 1 0 01-.753-.066l-1.52-5.674z" />
              </svg>
              为你推荐
            </router-link>
            <router-link
              to="/admin"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c-1.543-.94-3.31.826-4.512 1.964-1.863-1.257-3.666-3.35-4.857-1.837-1.953-4.332-2.37-6.85-1.638-2.728-1.878-4.51-1.274z" />
              </svg>
              后台管理
            </router-link>
            <router-link
              to="/profile"
              @click="showMobileMenu = false"
              class="flex items-center px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              个人中心
            </router-link>
          </nav>
          <div class="px-4 py-6 bg-gray-50">
            <button
              @click="handleLogout; showMobileMenu = false"
              class="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-red-600 bg-white rounded-lg border border-red-200 hover:bg-red-50"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4 4m4-4l-4-4m4 4l4-4" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 搜索区域 -->
      <div class="mb-8">
        <div class="flex items-center space-x-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索视频..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keyup.enter="handleSearch"
          />
          <button
            @click="handleSearch"
            class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            搜索
          </button>
        </div>
      </div>

      <!-- 热门视频 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">热门视频</h2>
        <div v-if="popularLoading" class="text-center py-8">
          加载中...
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="media in popularMedia"
            :key="media.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            @click="goToMediaDetail(media.id)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="media.poster"
                :src="media.poster"
                :alt="media.title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ media.title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>评分: {{ media.rating.toFixed(1) }}</span>
                <span>观看: {{ media.viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 最新视频 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">最新视频</h2>
        <div v-if="latestLoading" class="text-center py-8">
          加载中...
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="media in latestMedia"
            :key="media.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            @click="goToMediaDetail(media.id)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="media.poster"
                :src="media.poster"
                :alt="media.title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ media.title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>评分: {{ media.rating.toFixed(1) }}</span>
                <span>观看: {{ media.viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 高评分视频 -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-6">高评分视频</h2>
        <div v-if="topRatedLoading" class="text-center py-8">
          加载中...
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="media in topRatedMedia"
            :key="media.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            @click="goToMediaDetail(media.id)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="media.poster"
                :src="media.poster"
                :alt="media.title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ media.title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>评分: {{ media.rating.toFixed(1) }}</span>
                <span>观看: {{ media.viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'

const router = useRouter()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const searchQuery = ref('')
const popularMedia = ref([])
const latestMedia = ref([])
const topRatedMedia = ref([])
const popularLoading = ref(false)
const latestLoading = ref(false)
const topRatedLoading = ref(false)

const loadHomeData = async () => {
  popularLoading.value = true
  latestLoading.value = true
  topRatedLoading.value = true

  try {
    const [popular, latest, topRated] = await Promise.all([
      mediaStore.fetchPopularMedia(8),
      mediaStore.fetchLatestMedia(8),
      mediaStore.fetchTopRatedMedia(8)
    ])
    
    popularMedia.value = popular
    latestMedia.value = latest
    topRatedMedia.value = topRated
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    popularLoading.value = false
    latestLoading.value = false
    topRatedLoading.value = false
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() }
    })
  }
}

const goToMediaDetail = (id) => {
  router.push(`/media/${id}`)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadHomeData()
})
</script>