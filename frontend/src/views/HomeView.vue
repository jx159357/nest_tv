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
              <router-link to="/crawler" class="text-gray-700 hover:text-gray-900">
                爬虫管理
              </router-link>
              <router-link to="/play-sources" class="text-gray-700 hover:text-gray-900">
                播放源管理
              </router-link>
              <router-link to="/recommendations" class="text-gray-700 hover:text-gray-900">
                为你推荐
              </router-link>
              <router-link to="/profile" class="text-gray-700 hover:text-gray-900">
                个人中心
              </router-link>
              <button @click="handleLogout" class="text-gray-700 hover:text-gray-900">
                退出登录
              </button>
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