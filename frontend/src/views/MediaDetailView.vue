<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900">
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4">加载中...</p>
      </div>

      <div v-else-if="media" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 媒体信息主区域 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 封面和基本信息 -->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    v-if="media.poster"
                    :src="media.poster"
                    :alt="media.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                    <span class="text-gray-500">暂无封面</span>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                <h1 class="text-3xl font-bold text-gray-900">{{ media.title }}</h1>
                
                <div class="flex items-center space-x-4">
                  <div class="flex items-center">
                    <span class="text-yellow-400 text-lg">★</span>
                    <span class="ml-1 text-gray-900 font-semibold">{{ media.rating.toFixed(1) }}</span>
                    <span class="text-gray-500">/10</span>
                  </div>
                  
                  <div class="text-gray-500">
                    观看 {{ media.viewCount }} 次
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {{ media.type }}
                  </span>
                  <span 
                    v-for="genre in media.genres" 
                    :key="genre"
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {{ genre }}
                  </span>
                </div>

                <div v-if="media.director" class="text-gray-600">
                  <strong>导演:</strong> {{ media.director }}
                </div>

                <div v-if="media.actors" class="text-gray-600">
                  <strong>主演:</strong> {{ media.actors }}
                </div>

                <div v-if="media.releaseDate" class="text-gray-600">
                  <strong>上映时间:</strong> {{ formatDate(media.releaseDate) }}
                </div>

                <div v-if="media.episodeCount" class="text-gray-600">
                  <strong>剧集数:</strong> {{ media.episodeCount }} 集
                </div>

                <button
                  @click="goToWatch"
                  class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  立即观看
                </button>
              </div>
            </div>
          </div>

          <!-- 简介 -->
          <div v-if="media.description" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">简介</h2>
            <p class="text-gray-700 leading-relaxed">{{ media.description }}</p>
          </div>

          <!-- 相关推荐 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">相关推荐</h2>
            <div v-if="recommendationsLoading" class="text-center py-4">
              加载中...
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="recommendation in recommendations"
                :key="recommendation.id"
                class="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                @click="goToMediaDetail(recommendation.id)"
              >
                <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    v-if="recommendation.poster"
                    :src="recommendation.poster"
                    :alt="recommendation.title"
                    class="w-full h-32 object-cover"
                  />
                  <div v-else class="w-full h-32 flex items-center justify-center bg-gray-200">
                    <span class="text-gray-500">暂无封面</span>
                  </div>
                </div>
                <div class="p-3">
                  <h3 class="font-medium text-gray-900 text-sm line-clamp-2">{{ recommendation.title }}</h3>
                  <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>评分: {{ recommendation.rating.toFixed(1) }}</span>
                    <span>观看: {{ recommendation.viewCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="space-y-6">
          <!-- 播放源信息 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">播放源</h3>
            <div v-if="media.playSources && media.playSources.length > 0" class="space-y-3">
              <div
                v-for="playSource in media.playSources"
                :key="playSource.id"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ playSource.sourceName || `播放源 ${playSource.id}` }}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      {{ playSource.resolution }} {{ playSource.format }}
                    </div>
                  </div>
                  <span 
                    :class="[
                      'px-2 py-1 rounded text-xs',
                      playSource.status === 'active' ? 'bg-green-100 text-green-800' :
                      playSource.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ getStatusText(playSource.status) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-sm">
              暂无可用播放源
            </div>
          </div>

          <!-- 下载链接 -->
          <div v-if="media.downloadUrls && media.downloadUrls.length > 0" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">下载链接</h3>
            <div class="space-y-2">
              <a
                v-for="(url, index) in media.downloadUrls"
                :key="index"
                :href="url"
                target="_blank"
                class="block p-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors text-sm"
              >
                下载链接 {{ index + 1 }}
              </a>
            </div>
          </div>

          <!-- 来源信息 -->
          <div v-if="media.source" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">来源信息</h3>
            <div class="text-gray-600">
              来源平台: {{ media.source }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-red-400">加载失败</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const media = ref(null)
const recommendations = ref([])
const loading = ref(true)
const recommendationsLoading = ref(false)

const loadMedia = async () => {
  const mediaId = parseInt(route.params.id)
  loading.value = true
  
  try {
    const mediaData = await mediaStore.fetchMediaDetail(mediaId)
    media.value = mediaData
    
    // 加载推荐内容
    loadRecommendations(mediaId)
  } catch (error) {
    console.error('加载媒体详情失败:', error)
  } finally {
    loading.value = false
  }
}

const loadRecommendations = async (mediaId) => {
  recommendationsLoading.value = true
  
  try {
    const data = await mediaStore.fetchRecommendations(mediaId, 6)
    recommendations.value = data
  } catch (error) {
    console.error('加载推荐失败:', error)
  } finally {
    recommendationsLoading.value = false
  }
}

const goToWatch = () => {
  router.push(`/watch/${media.value.id}`)
}

const goToMediaDetail = (id) => {
  router.push(`/media/${id}`)
}

const getStatusText = (status) => {
  const statusMap = {
    'active': '可用',
    'inactive': '不可用',
    'error': '错误',
    'checking': '检查中'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadMedia()
})
</script>