<template>
  <div class="video-player" :class="{ 'video-player--fullscreen': isFullscreen }">
    <!-- 视频容器 -->
    <div ref="playerContainer" class="video-player__container">
      <!-- 视频元素 -->
      <video
        ref="videoRef"
        class="video-player__video"
        :src="src"
        :poster="poster"
        :autoplay="autoplay"
        :loop="loop"
        :muted="muted"
        :controls="false"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @volumechange="onVolumeChange"
        @waiting="onBuffering"
        @playing="onPlaying"
        @error="onError"
        @click="togglePlayPause"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      ></video>

      <!-- 弹幕层 -->
      <div v-if="showDanmaku" ref="danmakuContainer" class="video-player__danmaku-container">
        <!-- 弹幕将在这里动态渲染 -->
      </div>

      <!-- 试看模式指示器 -->
      <PreviewModeIndicator 
        v-if="props.isPreviewMode" 
        :preview-duration="props.previewDuration"
        :current-time="currentTime"
      />

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="video-player__loading">
        <div class="video-player__loading-spinner">
          <div class="video-player__loading-spinner-circle"></div>
        </div>
        <p class="video-player__loading-text">加载中...</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="video-player__error">
        <div class="video-player__error-icon">⚠️</div>
        <p class="video-player__error-text">{{ error }}</p>
        <button class="video-player__error-retry" @click="retry">重试</button>
      </div>

      <!-- 控制栏 -->
      <div
        v-show="showControls"
        ref="controlsRef"
        class="video-player__controls"
        @mouseenter="showControls = true"
        @mouseleave="showControls = showControlsOnHover"
      >
        <!-- 播放/暂停按钮 -->
        <button
          class="video-player__control-button video-player__play-pause"
          @click="togglePlayPause"
        >
          <svg v-if="isPlaying" class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          <svg v-else class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <!-- 时间显示 -->
        <div class="video-player__time">
          <span class="video-player__current-time">{{ formatTime(currentTime) }}</span>
          <span class="video-player__time-separator">/</span>
          <span class="video-player__duration">{{ formatTime(duration) }}</span>
        </div>

        <!-- 进度条 -->
        <div class="video-player__progress-container" @click="onProgressClick">
          <div
            ref="progressBar"
            class="video-player__progress-bar"
            @mousedown="onProgressMouseDown"
          >
            <div
              class="video-player__progress-buffered"
              :style="{ width: bufferedPercentage + '%' }"
            ></div>
            <div
              class="video-player__progress-played"
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div
              ref="progressHandle"
              class="video-player__progress-handle"
              :style="{ left: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="video-player__volume-container">
          <button
            class="video-player__control-button video-player__volume"
            @click="toggleMute"
          >
            <svg v-if="isMuted || volume === 0" class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
            <svg v-else-if="volume > 0.5" class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <svg v-else class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4l-5 5H5z" />
            </svg>
          </button>

          <!-- 音量滑块 -->
          <div
            v-show="showVolumeSlider"
            ref="volumeSlider"
            class="video-player__volume-slider"
            @mouseenter="showVolumeSlider = true"
            @mouseleave="showVolumeSlider = false"
            @click="onVolumeClick"
          >
            <div class="video-player__volume-bar" @mousedown="onVolumeMouseDown">
              <div
                class="video-player__volume-level"
                :style="{ height: volume * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 全屏按钮 -->
        <button
          class="video-player__control-button video-player__fullscreen"
          @click="toggleFullscreen"
        >
          <svg v-if="isFullscreen" class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
          </svg>
          <svg v-else class="video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>

      <!-- 播放提示 -->
      <div v-if="showPlayHint" class="video-player__play-hint" @animationend="showPlayHint = false">
        <svg class="video-player__play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import PreviewModeIndicator from './PreviewModeIndicator.vue'
import { mobileOptimizations } from '@/utils/mobile-optimizations'

interface Props {
  src: string
  poster?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  showControls?: boolean
  showDanmaku?: boolean
  danmakuData?: any[]
  isPreviewMode?: boolean // 是否为试看模式
  previewDuration?: number // 试看时长（分钟）
}

const props = withDefaults(defineProps<Props>(), {
  poster: '',
  autoplay: false,
  loop: false,
  muted: false,
  showControls: true,
  showDanmaku: false,
  danmakuData: () => [],
  isPreviewMode: false,
  previewDuration: 3
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [time: number]
  volumechange: [volume: number]
  buffering: []
  error: [error: string]
}>()

// 视频相关引用
const videoRef = ref<HTMLVideoElement | null>(null)
const playerContainer = ref<HTMLDivElement | null>(null)
const controlsRef = ref<HTMLDivElement | null>(null)
const progressBar = ref<HTMLDivElement | null>(null)
const progressHandle = ref<HTMLDivElement | null>(null)
const volumeSlider = ref<HTMLDivElement | null>(null)

// 状态管理
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isLoading = ref(false)
const error = ref('')
const isFullscreen = ref(false)
const showControls = ref(true)
const showControlsOnHover = ref(true)
const showVolumeSlider = ref(false)
const showPlayHint = ref(false)
const bufferedPercentage = ref(0)
const progressPercentage = ref(0)

// 移动端手势支持
const touchStartTime = ref(0)
const touchStartX = ref(0)
const touchStartY = ref(0)
const isTouchMoving = ref(false)

// 计算属性
const formatTime = computed(() => (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

// 视频事件处理
const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    volume.value = videoRef.value.volume
    isMuted.value = videoRef.value.muted
  }
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    progressPercentage.value = (currentTime.value / duration.value) * 100
    emit('timeupdate', currentTime.value)
    
    // 试看模式下检查是否超过试看时长
    if (props.isPreviewMode && currentTime.value >= props.previewDuration * 60) {
      videoRef.value.pause()
      error.value = `试看时间已结束，请登录后观看完整视频`
      emit('error', error.value)
    }
  }
}

const onPlay = () => {
  isPlaying.value = true
  showPlayHint.value = false
  emit('play')
}

const onPause = () => {
  isPlaying.value = false
  emit('pause')
}

const onEnded = () => {
  isPlaying.value = false
  emit('ended')
}

const onVolumeChange = () => {
  if (videoRef.value) {
    volume.value = videoRef.value.volume
    isMuted.value = videoRef.value.muted
    emit('volumechange', volume.value)
  }
}

const onBuffering = () => {
  isLoading.value = true
  emit('buffering')
}

const onPlaying = () => {
  isLoading.value = false
}

const onError = (e: Event) => {
  error.value = '视频加载失败'
  isLoading.value = false
  emit('error', error.value)
}

// 手势控制
const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    touchStartTime.value = Date.now()
    touchStartX.value = e.touches[0].clientX
    touchStartY.value = e.touches[0].clientY
    isTouchMoving.value = false
  }
}

const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 0 && touchStartX.value !== 0) {
    isTouchMoving.value = true
    const deltaX = e.touches[0].clientX - touchStartX.value
    const deltaY = e.touches[0].clientY - touchStartY.value
    
    // 水平滑动控制进度
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (videoRef.value) {
        const seekAmount = (deltaX / window.innerWidth) * 10
        videoRef.value.currentTime = Math.max(0, Math.min(duration.value, currentTime.value + seekAmount))
      }
    }
    // 垂直滑动左侧控制亮度，右侧控制音量
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      const screenWidth = window.innerWidth
      if (touchStartX.value < screenWidth / 2) {
        // 左侧滑动控制亮度
        console.log('左侧滑动控制亮度')
      } else {
        // 右侧滑动控制音量
        if (videoRef.value) {
          const volumeChange = -(deltaY / window.innerHeight) * 0.1
          videoRef.value.volume = Math.max(0, Math.min(1, volume.value + volumeChange))
        }
      }
    }
  }
}

// 控制方法
const togglePlayPause = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play().catch(err => {
      error.value = '播放失败: ' + err.message
      emit('error', error.value)
    })
  }
}

const toggleMute = () => {
  if (!videoRef.value) return

  videoRef.value.muted = !videoRef.value.muted
}

const toggleFullscreen = () => {
  if (!playerContainer.value) return

  if (!isFullscreen.value) {
    if (playerContainer.value.requestFullscreen) {
      playerContainer.value.requestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

// 进度条控制
const onProgressClick = (e: MouseEvent) => {
  if (!videoRef.value || !progressBar.value) return

  const rect = progressBar.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
  
  videoRef.value.currentTime = percentage * duration.value
}

const onProgressMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  document.addEventListener('mousemove', onProgressMouseMove)
  document.addEventListener('mouseup', onProgressMouseUp)
}

const onProgressMouseMove = (e: MouseEvent) => {
  if (!videoRef.value || !progressBar.value) return

  const rect = progressBar.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
  
  videoRef.value.currentTime = percentage * duration.value
}

const onProgressMouseUp = () => {
  document.removeEventListener('mousemove', onProgressMouseMove)
  document.removeEventListener('mouseup', onProgressMouseUp)
}

// 音量控制
const onVolumeClick = (e: MouseEvent) => {
  if (!videoRef.value || !volumeSlider.value) return

  const rect = volumeSlider.value.getBoundingClientRect()
  const offsetY = rect.bottom - e.clientY
  const percentage = Math.max(0, Math.min(1, offsetY / rect.height))
  
  videoRef.value.volume = percentage
}

const onVolumeMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  document.addEventListener('mousemove', onVolumeMouseMove)
  document.addEventListener('mouseup', onVolumeMouseUp)
}

const onVolumeMouseMove = (e: MouseEvent) => {
  if (!videoRef.value || !volumeSlider.value) return

  const rect = volumeSlider.value.getBoundingClientRect()
  const offsetY = rect.bottom - e.clientY
  const percentage = Math.max(0, Math.min(1, offsetY / rect.height))
  
  videoRef.value.volume = percentage
}

const onVolumeMouseUp = () => {
  document.removeEventListener('mousemove', onVolumeMouseMove)
  document.removeEventListener('mouseup', onVolumeMouseUp)
}

// 全屏事件处理
const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 重试方法
const retry = () => {
  error.value = ''
  if (videoRef.value) {
    videoRef.value.load()
  }
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  
  // 初始化音量
  if (videoRef.value) {
    videoRef.value.volume = volume.value
    videoRef.value.muted = isMuted.value
  }
  
  // 移动端优化
  if (mobileOptimizations.isMobileDevice() && videoRef.value) {
    // 为移动端添加触摸事件处理
    mobileOptimizations.addTouchHandlers(videoRef.value, {
      onTouchStart: onTouchStart,
      onTouchMove: onTouchMove,
      onTouchEnd: onTouchEnd
    });
    
    // 优化触摸目标大小
    mobileOptimizations.optimizeTouchTargets();
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('mousemove', onProgressMouseMove)
  document.removeEventListener('mouseup', onProgressMouseUp)
  document.removeEventListener('mousemove', onVolumeMouseMove)
  document.removeEventListener('mouseup', onVolumeMouseUp)
  
  // 清理移动端事件监听器
  if (mobileOptimizations.isMobileDevice() && videoRef.value) {
    mobileOptimizations.removeTouchHandlers(videoRef.value, {
      onTouchStart: onTouchStart,
      onTouchMove: onTouchMove,
      onTouchEnd: onTouchEnd
    });
  }
})

// 暴露方法给父组件
defineExpose({
  play: () => videoRef.value?.play(),
  pause: () => videoRef.value?.pause(),
  setCurrentTime: (time: number) => {
    if (videoRef.value) {
      videoRef.value.currentTime = time
    }
  },
  setVolume: (vol: number) => {
    if (videoRef.value) {
      videoRef.value.volume = Math.max(0, Math.min(1, vol))
    }
  },
  toggleMute: () => toggleMute(),
  toggleFullscreen: () => toggleFullscreen(),
})
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-player--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
}

.video-player__container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-player__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
}

.video-player__danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.video-player__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  z-index: 20;
}

.video-player__loading-spinner {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.video-player__loading-spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.video-player__loading-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.video-player__error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
  z-index: 20;
}

.video-player__error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.video-player__error-text {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 500;
}

.video-player__error-retry {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.video-player__error-retry:hover {
  background: #5a67d8;
}

.video-player__controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  transition: opacity 0.3s ease;
  z-index: 15;
}

.video-player__control-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.video-player__control-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.video-player__icon {
  width: 1.5rem;
  height: 1.5rem;
}

.video-player__time {
  display: flex;
  align-items: center;
  margin: 0 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.video-player__time-separator {
  margin: 0 0.25rem;
  color: rgba(255, 255, 255, 0.7);
}

.video-player__progress-container {
  flex: 1;
  height: 1.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.video-player__progress-bar {
  position: relative;
  width: 100%;
  height: 0.25rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.125rem;
}

.video-player__progress-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.125rem;
}

.video-player__progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #667eea;
  border-radius: 0.125rem;
}

.video-player__progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.75rem;
  height: 0.75rem;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-player__progress-container:hover .video-player__progress-handle {
  opacity: 1;
}

.video-player__volume-container {
  position: relative;
  display: flex;
  align-items: center;
}

.video-player__volume-slider {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 2rem;
  height: 6rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.video-player__volume-bar {
  position: relative;
  width: 0.25rem;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.125rem;
  cursor: pointer;
}

.video-player__volume-level {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #667eea;
  border-radius: 0.125rem;
}

.video-player__play-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4rem;
  height: 4rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: playHint 0.5s ease;
  z-index: 10;
}

@keyframes playHint {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.video-player__play-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-player__control-button {
    padding: 0.5rem;
    min-width: 44px; /* 符合移动端触摸目标大小 */
    min-height: 44px;
  }
  
  .video-player__icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .video-player__time {
    margin: 0 0.75rem;
    font-size: 0.875rem;
    min-width: 40px; /* 确保时间显示不会跳动 */
  }
  
  .video-player__volume-slider {
    width: 2rem;
    height: 5rem;
  }
  
  .video-player__play-hint {
    width: 3.5rem;
    height: 3.5rem;
  }
  
  .video-player__play-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  /* 移动端特殊优化 */
  .video-player__controls {
    padding: 0.75rem 1rem;
  }
  
  .video-player__progress-container {
    height: 2rem; /* 增大触摸区域 */
  }
  
  .video-player__progress-bar {
    height: 0.5rem;
  }
  
  .video-player__progress-handle {
    width: 1.25rem;
    height: 1.25rem;
  }
}

/* 小屏幕设备优化 */
@media (max-width: 480px) {
  .video-player__control-button {
    padding: 0.5rem;
  }
  
  .video-player__time {
    font-size: 0.75rem;
    margin: 0 0.5rem;
  }
  
  .video-player__controls {
    padding: 0.5rem 0.75rem;
  }
  
  .video-player__volume-slider {
    width: 1.5rem;
    height: 4rem;
  }
}
</style>