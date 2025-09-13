<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- 导航栏 -->
    <nav class="bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-white">视频平台</router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-300 hover:text-white">
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 视频播放区域 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p class="mt-4">加载中...</p>
      </div>

      <div v-else-if="media" class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
        <!-- 视频播放器 -->
        <div class="lg:col-span-2">
          <div class="bg-black rounded-lg overflow-hidden relative">
            <!-- 弹幕层 -->
            <DanmakuPlayer
              v-if="currentPlaySource"
              :video-id="media.id.toString()"
              :width="1280"
              :height="720"
              :show-controls="true"
              :max-danmaku-count="150"
            />
            
            <div v-if="currentPlaySource" class="aspect-w-16 aspect-h-9 relative z-10">
              <video
                ref="videoPlayer"
                class="w-full h-auto"
                controls
                @timeupdate="handleTimeUpdate"
                @ended="handleVideoEnded"
              >
                <source :src="currentPlaySource.url" :type="getVideoType(currentPlaySource.url)" />
                您的浏览器不支持视频播放。
              </video>
            </div>
            
            <!-- 播放源选择 -->
            <div class="p-4 bg-gray-800">
              <h3 class="text-lg font-semibold mb-3">选择播放源</h3>
              <div class="space-y-2">
                <button
                  v-for="playSource in media.playSources"
                  :key="playSource.id"
                  @click="selectPlaySource(playSource)"
                  :class="[
                    'w-full text-left p-3 rounded-lg transition-colors',
                    currentPlaySource?.id === playSource.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  ]"
                >
                  <div class="flex justify-between items-start lg:items-center">
                    <div class="flex-1 min-w-0">
                      <div class="font-medium">{{ playSource.sourceName || `播放源 ${playSource.id}` }}</div>
                      <div class="text-sm text-gray-400 mt-1 lg:mt-0">
                        {{ playSource.resolution }} • {{ playSource.format }}
                      </div>
                    </div>
                    <div class="text-xs lg:text-sm text-gray-400 ml-2 lg:ml-0">
                      {{ playSource.type === 'online' ? '在线' : '本地' }}
                    </div>
                  </div>
                </button>
              </div>
              
              <!-- 移动端播放控制 -->
              <div class="mt-4 lg:hidden">
                <div class="bg-gray-700 rounded-lg p-3">
                  <h4 class="font-medium mb-2">播放控制</h4>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      @click="togglePlay"
                      class="col-span-1 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg"
                    >
                      <svg class="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path v-if="!isPlaying" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 001.94-.832l3-2z" clip-rule="evenodd" />
                        <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 012 0zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8a1 1 0 012 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button
                      @click="handleVolumeToggle"
                      class="col-span-1 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg"
                    >
                      <svg class="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.383 13.076A1 1 0 013.414 11H14a1 1 0 110-2V5a1 1 0 10-2 2.586A1 1 0 009.383 3.076zM12.293 7.293a1 1 0 011.414 0l3 3a1 1 0 010-1.414l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button
                      @click="toggleFullscreen"
                      class="col-span-1 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg"
                    >
                      <svg class="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1V3a1 1 0 011-1h1a1 1 0 011-1v1a1 1 0 11-2 0V3a1 1 0 10-1-1h1a1 1 0 10-1 1v1a1 1 0 102 0v1a1 1 0 11-2 0V6a1 1 0 011-1zm0 8a1 1 0 011-1v1a1 1 0 11-2 0v1a1 1 0 10-1-1h1a1 1 0 10-1 1v1a1 1 0 102 0v1a1 1 0 11-2 0v1a1 1 0 011-1h1a1 1 0 011-1zm8-8a1 1 0 011-1v1a1 1 0 11-2 0V3a1 1 0 10-1-1h1a1 1 0 10-1 1v1a1 1 0 102 0v1a1 1 0 11-2 0V6a1 1 0 011-1zm0 8a1 1 0 011-1v1a1 1 0 11-2 0v1a1 1 0 10-1-1h1a1 1 0 10-1 1v1a1 1 0 102 0v1a1 1 0 11-2 0v1a1 1 0 011-1h1a1 1 0 011-1z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频信息侧边栏 -->
        <div class="space-y-6">
          <!-- 视频基本信息 -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-4">{{ media.title }}</h1>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">类型:</span>
                <span>{{ media.type }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-400">评分:</span>
                <span class="text-yellow-400">{{ media.rating.toFixed(1) }}/10</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-400">观看次数:</span>
                <span>{{ media.viewCount }}</span>
              </div>
              
              <div v-if="media.director" class="flex items-center justify-between">
                <span class="text-gray-400">导演:</span>
                <span>{{ media.director }}</span>
              </div>
              
              <div v-if="media.actors" class="flex items-center justify-between">
                <span class="text-gray-400">主演:</span>
                <span>{{ media.actors }}</span>
              </div>
              
              <div v-if="media.releaseDate" class="flex items-center justify-between">
                <span class="text-gray-400">上映时间:</span>
                <span>{{ formatDate(media.releaseDate) }}</span>
              </div>
            </div>
          </div>

          <!-- 剧集选择（如果是电视剧） -->
          <div v-if="media.episodeCount" class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">剧集选择</h3>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="episode in media.episodeCount"
                :key="episode"
                @click="selectEpisode(episode)"
                :class="[
                  'p-2 rounded text-sm transition-colors',
                  currentEpisode === episode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                第{{ episode }}集
              </button>
            </div>
          </div>

          <!-- 简介 -->
          <div v-if="media.description" class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">简介</h3>
            <p class="text-gray-300 leading-relaxed">{{ media.description }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-red-400">视频加载失败</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import DanmakuPlayer from '@/components/DanmakuPlayer.vue'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const media = ref(null)
const currentPlaySource = ref(null)
const currentEpisode = ref(1)
const loading = ref(true)
const videoPlayer = ref(null)
const isPlaying = ref(false)

const loadMedia = async () => {
  const mediaId = parseInt(route.params.id)
  loading.value = true
  
  try {
    const mediaData = await mediaStore.fetchMediaDetail(mediaId)
    media.value = mediaData
    
    // 选择第一个可用的播放源
    if (mediaData.playSources && mediaData.playSources.length > 0) {
      currentPlaySource.value = mediaData.playSources[0]
    }
    
    // 增加观看次数
    await mediaStore.incrementViewCount(mediaId)
  } catch (error) {
    console.error('加载视频失败:', error)
  } finally {
    loading.value = false
  }
}

const selectPlaySource = (playSource) => {
  currentPlaySource.value = playSource
  // 重新加载视频
  if (videoPlayer.value) {
    videoPlayer.value.load()
  }
}

const selectEpisode = (episode) => {
  currentEpisode.value = episode
  // 这里应该根据剧集号选择对应的播放源
  // 简化处理，实际应用中需要更复杂的逻辑
  const episodePlaySources = media.value.playSources.filter(
    ps => ps.episodeNumber === episode
  )
  
  if (episodePlaySources.length > 0) {
    selectPlaySource(episodePlaySources[0])
  }
}

const handleTimeUpdate = () => {
  // 处理播放进度更新
  if (videoPlayer.value) {
    const currentTime = Math.floor(videoPlayer.value.currentTime)
    const duration = Math.floor(videoPlayer.value.duration)
    
    // 这里可以调用API保存观看进度
    // saveWatchProgress(currentTime, duration)
  }
}

const handleVideoEnded = () => {
  // 处理视频播放结束
  console.log('视频播放结束')
}

const getVideoType = (url) => {
  const ext = url.split('.').pop().toLowerCase()
  switch (ext) {
    case 'mp4': return 'video/mp4'
    case 'webm': return 'video/webm'
    case 'ogg': return 'video/ogg'
    default: return 'video/mp4'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 自动保存观看进度
let saveInterval
onMounted(() => {
  loadMedia()
  
  // 每30秒保存一次观看进度
  saveInterval = setInterval(() => {
    if (videoPlayer.value && videoPlayer.value.currentTime > 0) {
      handleTimeUpdate()
    }
  }, 30000)
})

onUnmounted(() => {
  if (saveInterval) {
    clearInterval(saveInterval)
  }
})

// 移动端播放控制方法
const togglePlay = () => {
  if (videoPlayer.value) {
    if (videoPlayer.value.paused) {
      videoPlayer.value.play()
      isPlaying.value = true
    } else {
      videoPlayer.value.pause()
      isPlaying.value = false
    }
  }
}

const handleVolumeToggle = () => {
  if (videoPlayer.value) {
    if (videoPlayer.value.muted) {
      videoPlayer.value.muted = false
    } else {
      videoPlayer.value.muted = true
    }
  }
}

const toggleFullscreen = () => {
  if (videoPlayer.value) {
    if (videoPlayer.value.requestFullscreen) {
      videoPlayer.value.requestFullscreen()
    } else if (videoPlayer.value.webkitRequestFullscreen) {
      videoPlayer.value.webkitRequestFullscreen()
    } else if (videoPlayer.value.msRequestFullscreen) {
      videoPlayer.value.msRequestFullscreen()
    }
  }
}

// 监听播放状态
onMounted(() => {
  if (videoPlayer.value) {
    videoPlayer.value.addEventListener('play', () => {
      isPlaying.value = true
    })
    videoPlayer.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
  }
})
</script>