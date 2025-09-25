<template>
  <div class="video-watch-page">
    <!-- 页面头部 -->
    <header class="video-watch-header">
      <div class="video-watch-header__back" @click="goBack">
        <svg class="video-watch-header__back-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        返回
      </div>
      <h1 class="video-watch-header__title">{{ mediaTitle }}</h1>
      <div class="video-watch-header__spacer"></div>
    </header>

    <!-- 试看提醒模态框 -->
    <div v-if="showPreviewModal" class="preview-modal">
      <div class="preview-modal__content">
        <div class="preview-modal__icon">🎬</div>
        <h3 class="preview-modal__title">试看提醒</h3>
        <p class="preview-modal__description">
          您正在试看本视频的前 {{ previewDuration }} 分钟内容。<br>
          登录后即可观看完整视频。
        </p>
        <div class="preview-modal__actions">
          <button class="preview-modal__button preview-modal__button--cancel" @click="closePreviewModal">
            继续试看
          </button>
          <button class="preview-modal__button preview-modal__button--confirm" @click="goToLogin">
            立即登录
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="video-watch-main">
      <!-- 视频播放器区域 -->
      <div class="video-player-wrapper">
        <VideoPlayer
          ref="videoPlayerRef"
          :src="currentPlaySource?.url || ''"
          :poster="media?.poster || ''"
          :autoplay="true"
          :show-controls="true"
          :show-danmaku="true"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @ended="onVideoEnded"
          @timeupdate="onVideoTimeUpdate"
          @volumechange="onVideoVolumeChange"
          @error="onVideoError"
        />
        
        <!-- 试看遮罩 -->
        <div v-if="isPreviewMode && currentTime >= previewDuration * 60" class="preview-overlay">
          <div class="preview-overlay__content">
            <div class="preview-overlay__icon">🔒</div>
            <h3 class="preview-overlay__title">试看结束</h3>
            <p class="preview-overlay__description">
              试看时间已结束，登录后即可观看完整视频。
            </p>
            <button class="preview-overlay__button" @click="goToLogin">
              立即登录
            </button>
          </div>
        </div>
      </div>

      <!-- 视频信息区域 -->
      <div class="video-info">
        <h2 class="video-info__title">{{ media?.title }}</h2>
        <div class="video-info__meta">
          <span class="video-info__rating" v-if="media?.rating">
            ⭐ {{ media.rating }}
          </span>
          <span class="video-info__year" v-if="media?.releaseDate">
            {{ new Date(media.releaseDate).getFullYear() }}
          </span>
          <span class="video-info__genres" v-if="media?.genres">
            {{ media.genres.join(', ') }}
          </span>
        </div>
        <p class="video-info__description" v-if="media?.description">
          {{ media.description }}
        </p>

        <!-- 播放源选择 -->
        <div class="play-sources" v-if="playSources.length > 0">
          <h3 class="play-sources__title">播放源</h3>
          <div class="play-sources__list">
            <button
              v-for="source in playSources"
              :key="source.id"
              class="play-source-button"
              :class="{ 'play-source-button--active': currentPlaySource?.id === source.id }"
              @click="switchPlaySource(source)"
            >
              <span class="play-source-button__name">{{ source.name }}</span>
              <span class="play-source-button__quality" v-if="source.resolution">
                {{ source.resolution }}
              </span>
            </button>
          </div>
        </div>

        <!-- 视频操作 -->
        <div class="video-actions">
          <button class="video-action-button" @click="toggleFavorite">
            <svg v-if="isFavorite" class="video-action-button__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <svg v-else class="video-action-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
          </button>

          <button class="video-action-button" @click="shareVideo">
            <svg class="video-action-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M18 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            <span>分享</span>
          </button>

          <button class="video-action-button" @click="downloadVideo">
            <svg class="video-action-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>下载</span>
          </button>
        </div>
      </div>
    </main>

    <!-- 弹幕设置面板 -->
    <div v-if="showDanmakuSettings" class="danmaku-settings-panel">
      <div class="danmaku-settings-header">
        <h3>弹幕设置</h3>
        <button class="danmaku-settings-close" @click="showDanmakuSettings = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="danmaku-settings-content">
        <!-- 弹幕开关 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label">
            <input type="checkbox" v-model="danmakuEnabled" />
            启用弹幕
          </label>
        </div>

        <!-- 弹幕透明度 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label">
            透明度: {{ danmakuOpacity }}%
          </label>
          <input
            type="range"
            v-model="danmakuOpacity"
            min="10"
            max="100"
            step="10"
            class="danmaku-setting-slider"
          />
        </div>

        <!-- 弹幕字体大小 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label">
            字体大小: {{ danmakuFontSize }}px
          </label>
          <input
            type="range"
            v-model="danmakuFontSize"
            min="12"
            max="32"
            step="2"
            class="danmaku-setting-slider"
          />
        </div>

        <!-- 弹幕速度 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label">
            滚动速度: {{ danmakuSpeed }}
          </label>
          <input
            type="range"
            v-model="danmakuSpeed"
            min="1"
            max="10"
            step="1"
            class="danmaku-setting-slider"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mediaApi, playSourceApi } from '@/api'
import VideoPlayer from '@/components/ui/VideoPlayer.vue'
import type { MediaResource, PlaySource } from '@/types'

interface DanmakuSettings {
  enabled: boolean
  opacity: number
  fontSize: number
  speed: number
}

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 视频播放器引用
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null)

// 数据状态
const media = ref<MediaResource | null>(null)
const playSources = ref<PlaySource[]>([])
const currentPlaySource = ref<PlaySource | null>(null)
const isFavorite = ref(false)
const showDanmakuSettings = ref(false)

// 试看功能状态
const showPreviewModal = ref(false)
const isPreviewMode = ref(false)
const currentTime = ref(0)
const previewDuration = ref(3) // 试看时长（分钟）

// 弹幕设置
const danmakuSettings = ref<DanmakuSettings>({
  enabled: true,
  opacity: 80,
  fontSize: 16,
  speed: 5
})

// 计算属性
const mediaTitle = computed(() => media.value?.title || '视频播放')
const danmakuEnabled = computed({
  get: () => danmakuSettings.value.enabled,
  set: (value) => danmakuSettings.value.enabled = value
})
const danmakuOpacity = computed({
  get: () => danmakuSettings.value.opacity,
  set: (value) => danmakuSettings.value.opacity = value
})
const danmakuFontSize = computed({
  get: () => danmakuSettings.value.fontSize,
  set: (value) => danmakuSettings.value.fontSize = value
})
const danmakuSpeed = computed({
  get: () => danmakuSettings.value.speed,
  set: (value) => danmakuSettings.value.speed = value
})

// 试看功能方法
const initializePreviewMode = () => {
  // 如果用户未登录，则启用试看模式
  if (!authStore.isAuthenticated) {
    isPreviewMode.value = true
    showPreviewModal.value = true
    
    // 设置试看时长（根据视频时长调整，最长3分钟）
    if (media.value?.duration) {
      const videoMinutes = Math.floor(media.value.duration / 60)
      previewDuration.value = Math.min(videoMinutes, 3)
    }
  } else {
    isPreviewMode.value = false
    showPreviewModal.value = false
  }
}

const closePreviewModal = () => {
  showPreviewModal.value = false
}

const goToLogin = () => {
  closePreviewModal()
  router.push('/login')
}

// 获取视频信息
const fetchMediaInfo = async () => {
  try {
    const mediaId = route.params.id as string
    if (!mediaId) {
      router.push('/404')
      return
    }

    // 获取媒体资源信息
    const mediaData = await mediaApi.getMediaById(mediaId)
    media.value = mediaData

    // 获取播放源列表
    const sources = await playSourceApi.getPlaySourcesByMediaId(mediaId)
    playSources.value = sources

    // 设置默认播放源
    if (sources.length > 0) {
      currentPlaySource.value = sources[0]
    }

    // 初始化试看模式
    initializePreviewMode()

    // 检查是否已收藏
    // 这里应该调用API检查收藏状态
    isFavorite.value = false
  } catch (error) {
    console.error('获取视频信息失败:', error)
    // 可以显示错误提示
  }
}

// 切换播放源
const switchPlaySource = (source: PlaySource) => {
  currentPlaySource.value = source
  // 重新加载视频
  videoPlayerRef.value?.pause()
  nextTick(() => {
    videoPlayerRef.value?.play()
  })
}

// 视频事件处理
const onVideoPlay = () => {
  console.log('视频开始播放')
  // 可以记录播放历史
}

const onVideoPause = () => {
  console.log('视频暂停')
  // 可以保存播放进度
}

const onVideoEnded = () => {
  console.log('视频播放结束')
  // 可以标记为已观看
  
  // 如果是试看模式，播放结束后提示登录
  if (isPreviewMode.value) {
    showPreviewModal.value = true
  }
}

const onVideoTimeUpdate = (time: number) => {
  // 更新当前播放时间
  currentTime.value = time
  
  // 可以定期保存播放进度
  console.log('播放时间更新:', time)
  
  // 试看模式下检查是否超过试看时长
  if (isPreviewMode.value && time >= previewDuration.value * 60) {
    // 暂停视频播放
    videoPlayerRef.value?.pause()
  }
}

const onVideoVolumeChange = (volume: number) => {
  console.log('音量变化:', volume)
}

const onVideoError = (error: string) => {
  console.error('视频播放错误:', error)
  // 可以显示错误提示给用户
}

// 收藏/取消收藏
const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    // 未登录用户提示
    if (confirm('收藏功能需要登录，是否前往登录页面？')) {
      router.push('/login')
    }
    return
  }

  try {
    // 使用toggleFavorite方法
    await mediaApi.toggleFavorite(media.value!.id)
    isFavorite.value = !isFavorite.value
  } catch (error) {
    console.error('收藏操作失败:', error)
    // 可以显示错误提示
  }
}

// 分享视频
const shareVideo = () => {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({
      title: media.value?.title,
      text: media.value?.description,
      url: url
    }).catch(console.error)
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板')
    }).catch(console.error)
  }
}

// 下载视频
const downloadVideo = () => {
  if (currentPlaySource.value?.downloadUrls?.length) {
    const downloadUrl = currentPlaySource.value.downloadUrls[0]
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = media.value?.title || 'video'
    link.click()
  } else {
    alert('该视频不支持下载')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 生命周期钩子
onMounted(() => {
  fetchMediaInfo()
})

onUnmounted(() => {
  // 组件销毁时清理资源
  videoPlayerRef.value?.pause()
})
</script>

<style scoped>
.video-watch-page {
  min-height: 100vh;
  background: #000;
  color: white;
}

.video-watch-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.video-watch-header__back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.video-watch-header__back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.video-watch-header__back-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.video-watch-header__title {
  flex: 1;
  margin: 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-watch-header__spacer {
  width: 6rem;
}

/* 试看提醒模态框 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.preview-modal__content {
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  background: #1f2937;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.preview-modal__icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.preview-modal__title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.preview-modal__description {
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #d1d5db;
}

.preview-modal__actions {
  display: flex;
  gap: 1rem;
}

.preview-modal__button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.preview-modal__button--cancel {
  background: #374151;
  color: white;
}

.preview-modal__button--cancel:hover {
  background: #4b5563;
}

.preview-modal__button--confirm {
  background: #667eea;
  color: white;
}

.preview-modal__button--confirm:hover {
  background: #5a67d8;
}

/* 试看遮罩 */
.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  z-index: 50;
}

.preview-overlay__content {
  text-align: center;
  padding: 2rem;
  max-width: 400px;
}

.preview-overlay__icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.preview-overlay__title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.preview-overlay__description {
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #d1d5db;
}

.preview-overlay__button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.preview-overlay__button:hover {
  background: #5a67d8;
}

.video-watch-main {
  padding-top: 4rem;
  padding-bottom: 2rem;
}

.video-player-wrapper {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  position: relative;
}

.video-info {
  padding: 1.5rem;
  background: #111;
}

.video-info__title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

.video-info__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
}

.video-info__rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.video-info__description {
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #d1d5db;
}

.play-sources {
  margin-bottom: 1.5rem;
}

.play-sources__title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.play-sources__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.play-source-button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-source-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.play-source-button--active {
  background: #667eea;
  border-color: #667eea;
}

.play-source-button__name {
  font-weight: 500;
}

.play-source-button__quality {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.video-actions {
  display: flex;
  gap: 1rem;
}

.video-action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.video-action-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.video-action-button__icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* 弹幕设置面板 */
.danmaku-settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  background: #1f2937;
  border-left: 1px solid #374151;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.danmaku-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #374151;
}

.danmaku-settings-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.danmaku-settings-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.2s ease;
}

.danmaku-settings-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.danmaku-settings-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.danmaku-setting-item {
  margin-bottom: 1.5rem;
}

.danmaku-setting-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.danmaku-setting-slider {
  width: 100%;
  height: 0.5rem;
  background: #374151;
  border-radius: 0.25rem;
  outline: none;
  -webkit-appearance: none;
}

.danmaku-setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.danmaku-setting-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-watch-header {
    padding: 0.75rem;
  }
  
  .video-watch-header__title {
    font-size: 1rem;
  }
  
  .video-info {
    padding: 1rem;
  }
  
  .video-info__title {
    font-size: 1.25rem;
  }
  
  .video-actions {
    flex-direction: column;
  }
  
  .video-action-button {
    justify-content: center;
    padding: 0.75rem;
  }
  
  .danmaku-settings-panel {
    width: 100%;
  }
}
</style>