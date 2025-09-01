<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="container-responsive">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <router-link to="/crawler" class="text-gray-700 hover:text-gray-900">
                爬虫管理
              </router-link>
              <router-link to="/play-sources" class="text-gray-700 hover:text-gray-900">
                播放源管理
              </router-link>
              <router-link to="/recommendations" class="text-indigo-600 font-medium">
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
    <main class="container-responsive py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">为你推荐</h1>
      
      <!-- 个性化推荐 -->
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">个性化推荐</h2>
          <button 
            @click="refreshRecommendations" 
            :disabled="refreshing"
            class="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {{ refreshing ? '刷新中...' : '刷新推荐' }}
          </button>
        </div>
        
        <div v-if="personalizedLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">正在为你生成个性化推荐...</p>
        </div>
        
        <div v-else-if="personalizedRecommendations.length > 0" class="grid-responsive">
          <div
            v-for="item in personalizedRecommendations"
            :key="item.id"
            class="card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            @click="goToMediaDetail(item.mediaResource.id)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="item.mediaResource.poster"
                :src="item.mediaResource.poster"
                :alt="item.mediaResource.title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ item.mediaResource.title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>评分: {{ item.mediaResource.rating.toFixed(1) }}</span>
                <span>观看: {{ item.mediaResource.viewCount }}</span>
              </div>
              <div class="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                {{ item.metadata?.reason || '个性化推荐' }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-1">暂无个性化推荐</h3>
          <p class="text-gray-500">观看更多视频以获得个性化推荐</p>
        </div>
      </section>
      
      <!-- 热门推荐 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">热门推荐</h2>
        
        <div v-if="trendingLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">正在加载热门推荐...</p>
        </div>
        
        <div v-else-if="trendingRecommendations.length > 0" class="grid-responsive">
          <div
            v-for="item in trendingRecommendations"
            :key="item.id"
            class="card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            @click="goToMediaDetail(item.mediaResource?.id || item.mediaResourceId)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="getMediaResource(item).poster"
                :src="getMediaResource(item).poster"
                :alt="getMediaResource(item).title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ getMediaResource(item).title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>评分: {{ getMediaResource(item).rating.toFixed(1) }}</span>
                <span>观看: {{ getMediaResource(item).viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 编辑推荐 -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-6">编辑推荐</h2>
        
        <div v-if="editorialLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">正在加载编辑推荐...</p>
        </div>
        
        <div v-else-if="editorialRecommendations.length > 0" class="grid-responsive">
          <div
            v-for="item in editorialRecommendations"
            :key="item.id"
            class="card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            @click="goToMediaDetail(item.mediaResource?.id || item.mediaResourceId)"
          >
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                v-if="getMediaResource(item).poster"
                :src="getMediaResource(item).poster"
                :alt="getMediaResource(item).title"
                class="w-full h-48 object-cover"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
                <span class="text-gray-500">暂无封面</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ getMediaResource(item).title }}</h3>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>评分: {{ getMediaResource(item).rating.toFixed(1) }}</span>
                <span>观看: {{ getMediaResource(item).viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-1">暂无编辑推荐</h3>
          <p class="text-gray-500">敬请期待更多精选内容</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { recommendationsApi, mediaApi } from '@/api'

const router = useRouter()
const authStore = useAuthStore()

// 推荐数据
const personalizedRecommendations = ref([])
const trendingRecommendations = ref([])
const editorialRecommendations = ref([])

// 加载状态
const personalizedLoading = ref(false)
const trendingLoading = ref(false)
const editorialLoading = ref(false)
const refreshing = ref(false)

// 获取推荐数据
const loadRecommendations = async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) {
    router.push('/login')
    return
  }

  // 加载个性化推荐
  personalizedLoading.value = true
  try {
    const response = await recommendationsApi.getPersonalized(authStore.user.id, { limit: 8 })
    // 获取推荐对应的影视资源详情
    const recommendationsWithMedia = await Promise.all(
      response.map(async (rec) => {
        try {
          const mediaResponse = await mediaApi.getMediaById(rec.mediaResourceId)
          return {
            ...rec,
            mediaResource: mediaResponse
          }
        } catch (error) {
          console.error('获取影视资源详情失败:', error)
          return rec
        }
      })
    )
    personalizedRecommendations.value = recommendationsWithMedia
  } catch (error) {
    console.error('加载个性化推荐失败:', error)
  } finally {
    personalizedLoading.value = false
  }

  // 加载热门推荐
  trendingLoading.value = true
  try {
    const response = await recommendationsApi.getPopular({ limit: 8 })
    // 获取推荐对应的影视资源详情
    const recommendationsWithMedia = await Promise.all(
      response.map(async (rec) => {
        try {
          const mediaResponse = await mediaApi.getMediaById(rec.mediaResourceId)
          return {
            ...rec,
            mediaResource: mediaResponse
          }
        } catch (error) {
          console.error('获取影视资源详情失败:', error)
          return rec
        }
      })
    )
    trendingRecommendations.value = recommendationsWithMedia
  } catch (error) {
    console.error('加载热门推荐失败:', error)
  } finally {
    trendingLoading.value = false
  }

  // 加载编辑推荐
  editorialLoading.value = true
  try {
    const response = await recommendationsApi.getPopular({ limit: 8, type: 'editorial' })
    // 获取推荐对应的影视资源详情
    const recommendationsWithMedia = await Promise.all(
      response.map(async (rec) => {
        try {
          const mediaResponse = await mediaApi.getMediaById(rec.mediaResourceId)
          return {
            ...rec,
            mediaResource: mediaResponse
          }
        } catch (error) {
          console.error('获取影视资源详情失败:', error)
          return rec
        }
      })
    )
    editorialRecommendations.value = recommendationsWithMedia
  } catch (error) {
    console.error('加载编辑推荐失败:', error)
  } finally {
    editorialLoading.value = false
  }
}

// 刷新个性化推荐
const refreshRecommendations = async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) return

  refreshing.value = true
  try {
    // 注意：这里可能需要根据实际API调整
    const response = await recommendationsApi.getPersonalized(authStore.user.id, { limit: 8, refresh: true })
    // 获取推荐对应的影视资源详情
    const recommendationsWithMedia = await Promise.all(
      response.map(async (rec) => {
        try {
          const mediaResponse = await mediaApi.getMediaById(rec.mediaResourceId)
          return {
            ...rec,
            mediaResource: mediaResponse
          }
        } catch (error) {
          console.error('获取影视资源详情失败:', error)
          return rec
        }
      })
    )
    personalizedRecommendations.value = recommendationsWithMedia
  } catch (error) {
    console.error('刷新个性化推荐失败:', error)
  } finally {
    refreshing.value = false
  }
}

// 获取影视资源对象
const getMediaResource = (recommendation) => {
  return recommendation.mediaResource || {
    id: recommendation.mediaResourceId,
    title: '未知影视',
    rating: 0,
    viewCount: 0,
    poster: ''
  }
}

// 跳转到影视详情页
const goToMediaDetail = (mediaId) => {
  router.push(`/media/${mediaId}`)
}

// 退出登录
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 页面加载时获取推荐数据
onMounted(() => {
  loadRecommendations()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>