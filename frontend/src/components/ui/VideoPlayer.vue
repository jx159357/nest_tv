<template>
  <div
    ref="playerContainer"
    class="modern-video-player"
    :class="{
      'modern-video-player--fullscreen': isFullscreen,
      'modern-video-player--pip': isPictureInPicture,
      'modern-video-player--mobile': isMobile,
      'modern-video-player--loading': isLoading,
      'modern-video-player--error': !!error,
      'theme-dark': currentTheme === 'dark',
      'theme-light': currentTheme === 'light',
    }"
    tabindex="0"
    role="application"
    :aria-label="`视频播放器${title ? ': ' + title : ''}`"
    :aria-busy="isLoading || isBuffering"
    @keydown="handleKeyDown"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 视频容器 -->
    <div class="modern-video-player__container">
      <!-- 视频元素 -->
      <video
        ref="videoRef"
        class="modern-video-player__video"
        :src="src"
        :poster="poster"
        :autoplay="autoplay"
        :loop="loop"
        :muted="isMuted"
        :controls="false"
        :preload="preload"
        playsinline
        webkit-playsinline
        x5-playsinline
        role="video"
        :aria-label="title || '视频'"
        :aria-describedby="showControls ? 'video-controls' : undefined"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @volumechange="onVolumeChange"
        @waiting="onBuffering"
        @playing="onPlaying"
        @error="onError"
        @canplay="onCanPlay"
        @progress="onProgress"
        @ratechange="onRateChange"
        @seeking="onSeeking"
        @seeked="onSeeked"
        @loadeddata="onLoadedData"
      ></video>

      <!-- 弹幕层 -->
      <div v-if="showDanmaku" ref="danmakuContainer" class="modern-video-player__danmaku-container">
        <!-- 弹幕将在这里动态渲染 -->
        <div
          v-for="danmaku in visibleDanmaku"
          :key="danmaku.id"
          class="modern-video-player__danmaku-item"
          :class="`modern-video-player__danmaku--${danmaku.type}`"
          :style="getDanmakuStyle(danmaku)"
        >
          {{ danmaku.text }}
        </div>
      </div>

      <!-- 画中画预览 -->
      <div
        v-if="showPipPreview"
        class="modern-video-player__pip-preview"
        @click="togglePictureInPicture"
      >
        <div class="modern-video-player__pip-icon">◱</div>
        <span class="modern-video-player__pip-text">画中画</span>
      </div>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="modern-video-player__loading">
        <div class="modern-video-player__loading-spinner">
          <div class="spinner-circle"></div>
        </div>
        <p class="modern-video-player__loading-text">{{ loadingText }}</p>
        <div class="modern-video-player__loading-progress">
          <div
            class="modern-video-player__loading-progress-bar"
            :style="{ width: loadingProgress + '%' }"
          ></div>
        </div>
        <div v-if="isBuffering" class="modern-video-player__buffer-info">
          <span class="modern-video-player__buffer-text"
            >缓冲中... {{ bufferedPercentage.toFixed(1) }}%</span
          >
          <div v-if="bufferWaitTime > 0" class="modern-video-player__buffer-wait-time">
            已等待: {{ (bufferWaitTime / 1000).toFixed(1) }}s
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="modern-video-player__error">
        <div class="modern-video-player__error-icon">⚠️</div>
        <p class="modern-video-player__error-text">{{ error }}</p>
        <div class="modern-video-player__error-actions">
          <button class="modern-video-player__error-button" @click="retry">重试</button>
          <button
            v-if="sources.length > 1"
            class="modern-video-player__error-button"
            @click="switchSource"
          >
            切换线路
          </button>
        </div>
      </div>

      <!-- 播放提示 -->
      <div
        v-if="showPlayHint"
        class="modern-video-player__play-hint"
        @animationend="showPlayHint = false"
      >
        <svg class="modern-video-player__play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      <!-- 快进/快退提示 -->
      <div
        v-if="showSeekHint || touchFeedback.showSeekIndicator"
        class="modern-video-player__seek-hint"
        :class="{
          'seek-forward': seekDirection === 'forward' || touchFeedback.seekDirection === 'forward',
          'seek-backward':
            seekDirection === 'backward' || touchFeedback.seekDirection === 'backward',
        }"
      >
        <div class="modern-video-player__seek-icon">
          {{
            seekDirection === 'forward' || touchFeedback.seekDirection === 'forward' ? '⏩' : '⏪'
          }}
        </div>
        <div class="modern-video-player__seek-amount">
          {{
            touchFeedback.showSeekIndicator
              ? touchFeedback.seekAmount.toFixed(1) + 's'
              : Math.abs(seekAmount) + 's'
          }}
        </div>
      </div>

      <!-- 音量提示 -->
      <div
        v-if="showVolumeHint || touchFeedback.showVolumeIndicator"
        class="modern-video-player__volume-hint"
      >
        <div class="modern-video-player__volume-icon">
          {{ volumeIcon }}
        </div>
        <div class="modern-video-player__volume-bar">
          <div
            class="modern-video-player__volume-level"
            :style="{ width: volume * 100 + '%' }"
          ></div>
        </div>
        <div class="modern-video-player__volume-percent">{{ Math.round(volume * 100) }}%</div>
      </div>

      <!-- 亮度提示 -->
      <div
        v-if="showBrightnessHint || touchFeedback.showBrightnessIndicator"
        class="modern-video-player__brightness-hint"
      >
        <div class="modern-video-player__brightness-icon">☀️</div>
        <div class="modern-video-player__brightness-bar">
          <div
            class="modern-video-player__brightness-level"
            :style="{ width: brightness * 100 + '%' }"
          ></div>
        </div>
        <div class="modern-video-player__brightness-percent">
          {{ Math.round(brightness * 100) }}%
        </div>
      </div>

      <!-- 手势提示 -->
      <div v-if="gestureState.isLongPress" class="modern-video-player__gesture-hint">
        <div class="modern-video-player__gesture-icon">👆</div>
        <div class="modern-video-player__gesture-text">长按检测</div>
      </div>

      <div v-if="gestureState.isDoubleTap" class="modern-video-player__gesture-hint">
        <div class="modern-video-player__gesture-icon">👆👆</div>
        <div class="modern-video-player__gesture-text">双击检测</div>
      </div>

      <!-- 键盘快捷键提示 -->
      <div v-if="keyboardHint.show" class="modern-video-player__keyboard-hint">
        <div class="modern-video-player__keyboard-key">{{ keyboardHint.key }}</div>
        <div class="modern-video-player__keyboard-action">{{ keyboardHint.action }}</div>
      </div>
    </div>

    <!-- 控制栏 -->
    <div
      v-show="showControls || showControlsTemporarily"
      id="video-controls"
      ref="controlsRef"
      class="modern-video-player__controls"
      role="toolbar"
      aria-label="视频控制栏"
      @mouseenter="onControlsMouseEnter"
      @mouseleave="onControlsMouseLeave"
    >
      <!-- 顶部控制栏 -->
      <div class="modern-video-player__top-controls">
        <button
          class="modern-video-player__control-button modern-video-player__back"
          aria-label="返回"
          title="返回 (ESC)"
          @click="onBack"
        >
          <svg class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>

        <div class="modern-video-player__title" role="status" aria-live="polite">{{ title }}</div>

        <div class="modern-video-player__top-spacer"></div>

        <button
          v-if="showCastButton"
          class="modern-video-player__control-button modern-video-player__cast"
          @click="toggleCast"
        >
          <svg class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.9,3 1,3.9 1,5V8H3V5H21V19H14V21H21C22.1,21 23,20.1 23,19V5C23,3.9 22.1,3 21,3Z"
            />
          </svg>
        </button>

        <button
          class="modern-video-player__control-button modern-video-player__settings"
          @click="toggleSettings"
        >
          <svg class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
            />
          </svg>
        </button>
      </div>

      <!-- 中心播放按钮 -->
      <div class="modern-video-player__center-controls">
        <button
          class="modern-video-player__control-button modern-video-player__center-play"
          @click="togglePlayPause"
        >
          <svg
            v-if="isPlaying"
            class="modern-video-player__icon modern-video-player__icon--large"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          <svg
            v-else
            class="modern-video-player__icon modern-video-player__icon--large"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      <!-- 底部控制栏 -->
      <div class="modern-video-player__bottom-controls">
        <!-- 播放/暂停按钮 -->
        <button
          class="modern-video-player__control-button modern-video-player__play-pause"
          :aria-label="isPlaying ? '暂停' : '播放'"
          :title="isPlaying ? '暂停 (空格)' : '播放 (空格)'"
          :aria-pressed="isPlaying"
          @click="togglePlayPause"
        >
          <svg
            v-if="isPlaying"
            class="modern-video-player__icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          <svg
            v-else
            class="modern-video-player__icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <!-- 时间显示 -->
        <div class="modern-video-player__time">
          <span class="modern-video-player__current-time">{{ formatTime(currentTime) }}</span>
          <span class="modern-video-player__time-separator">/</span>
          <span class="modern-video-player__duration">{{ formatTime(duration) }}</span>
        </div>

        <!-- 进度条 -->
        <div
          class="modern-video-player__progress-container"
          @click="onProgressClick"
          @mouseenter="showPreviewTime = true"
          @mouseleave="showPreviewTime = false"
          @mousemove="onProgressMouseMove"
        >
          <div
            ref="progressBar"
            class="modern-video-player__progress-bar"
            @mousedown="onProgressMouseDown"
          >
            <!-- 缓冲进度 -->
            <div
              class="modern-video-player__progress-buffered"
              :style="{ width: bufferedPercentage + '%' }"
            ></div>

            <!-- 播放进度 -->
            <div
              class="modern-video-player__progress-played"
              :style="{ width: progressPercentage + '%' }"
            ></div>

            <!-- 预览时间 -->
            <div
              v-if="showPreviewTime"
              class="modern-video-player__progress-preview"
              :style="{ left: previewProgress + '%' }"
            >
              <div class="modern-video-player__preview-time">{{ formatTime(previewTime) }}</div>
              <div class="modern-video-player__preview-thumb"></div>
            </div>

            <!-- 进度手柄 -->
            <div
              ref="progressHandle"
              class="modern-video-player__progress-handle"
              :style="{ left: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="modern-video-player__volume-container">
          <button
            class="modern-video-player__control-button modern-video-player__volume"
            @click="toggleMute"
            @mouseenter="showVolumeSlider = true"
            @mouseleave="showVolumeSlider = false"
          >
            <svg
              v-if="isMuted || volume === 0"
              class="modern-video-player__icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
              />
            </svg>
            <svg
              v-else-if="volume > 0.5"
              class="modern-video-player__icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              />
            </svg>
            <svg v-else class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4l-5 5H5z"
              />
            </svg>
          </button>

          <!-- 音量滑块 -->
          <div
            v-show="showVolumeSlider"
            ref="volumeSlider"
            class="modern-video-player__volume-slider"
            @mouseenter="showVolumeSlider = true"
            @mouseleave="showVolumeSlider = false"
            @click="onVolumeClick"
          >
            <div class="modern-video-player__volume-bar" @mousedown="onVolumeMouseDown">
              <div
                class="modern-video-player__volume-level"
                :style="{ height: volume * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 播放速度 -->
        <button
          class="modern-video-player__control-button modern-video-player__speed"
          @click="toggleSpeed"
        >
          <span class="modern-video-player__speed-text">{{ playbackRate }}x</span>
        </button>

        <!-- 画中画 -->
        <button
          v-if="showPipButton"
          class="modern-video-player__control-button modern-video-player__pip"
          @click="togglePictureInPicture"
        >
          <svg class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19,11H11V17H19V11M23,19V5C23,3.89 22.1,3 21,3H3A1,1 0 0,0 2,4V20A1,1 0 0,0 3,21H21A1,1 0 0,0 22,20L23,19Z"
            />
          </svg>
        </button>

        <!-- 全屏按钮 -->
        <button
          class="modern-video-player__control-button modern-video-player__fullscreen"
          @click="toggleFullscreen"
        >
          <svg
            v-if="isFullscreen"
            class="modern-video-player__icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
            />
          </svg>
          <svg v-else class="modern-video-player__icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="modern-video-player__settings-panel" @click.stop>
      <div class="modern-video-player__settings-header">
        <h3>播放设置</h3>
        <button class="modern-video-player__settings-close" @click="showSettings = false">✕</button>
      </div>

      <div class="modern-video-player__settings-content">
        <!-- 播放速度 -->
        <div class="modern-video-player__settings-section">
          <h4>播放速度</h4>
          <div class="modern-video-player__speed-options">
            <button
              v-for="rate in speedOptions"
              :key="rate"
              class="modern-video-player__speed-option"
              :class="{ active: playbackRate === rate }"
              @click="setPlaybackRate(rate)"
            >
              {{ rate }}x
            </button>
          </div>
        </div>

        <!-- 画质 -->
        <div v-if="qualities.length > 0" class="modern-video-player__settings-section">
          <h4>画质</h4>
          <div class="modern-video-player__quality-options">
            <button
              v-for="quality in qualities"
              :key="quality.value"
              class="modern-video-player__quality-option"
              :class="{ active: currentQuality === quality.value }"
              @click="setQuality(quality.value)"
            >
              {{ quality.label }}
            </button>
          </div>
        </div>

        <!-- 线路 -->
        <div v-if="sources.length > 1" class="modern-video-player__settings-section">
          <h4>播放线路</h4>
          <div class="modern-video-player__source-options">
            <button
              v-for="(source, index) in sources"
              :key="index"
              class="modern-video-player__source-option"
              :class="{ active: currentSourceIndex === index }"
              @click="switchToSource(index)"
            >
              线路 {{ index + 1 }}
            </button>
          </div>
        </div>

        <!-- 字幕 -->
        <div v-if="subtitles.length > 0" class="modern-video-player__settings-section">
          <h4>字幕</h4>
          <div class="modern-video-player__subtitle-options">
            <button
              v-for="subtitle in subtitles"
              :key="subtitle.id"
              class="modern-video-player__subtitle-option"
              :class="{ active: currentSubtitle === subtitle.id }"
              @click="setSubtitle(subtitle.id)"
            >
              {{ subtitle.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
  import { mobileOptimizations } from '@/utils/mobile-optimizations';

  interface VideoSource {
    url: string;
    type?: string;
    quality?: string;
    label?: string;
  }

  interface VideoQuality {
    value: string;
    label: string;
  }

  interface VideoSubtitle {
    id: string;
    label: string;
    src: string;
    lang?: string;
  }

  interface DanmakuItem {
    id: string;
    text: string;
    time: number;
    type: 'scroll' | 'top' | 'bottom';
    color: string;
    size: number;
    opacity: number;
  }

  interface Props {
    src: string;
    sources?: VideoSource[];
    qualities?: VideoQuality[];
    subtitles?: VideoSubtitle[];
    danmaku?: DanmakuItem[];
    poster?: string;
    title?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    preload?: 'auto' | 'metadata' | 'none';
    showControls?: boolean;
    showDanmaku?: boolean;
    showPipButton?: boolean;
    showCastButton?: boolean;
    isPreviewMode?: boolean;
    previewDuration?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    sources: () => [],
    qualities: () => [],
    subtitles: () => [],
    danmaku: () => [],
    poster: '',
    title: '',
    autoplay: false,
    loop: false,
    muted: false,
    preload: 'metadata',
    showControls: true,
    showDanmaku: false,
    showPipButton: true,
    showCastButton: true,
    isPreviewMode: false,
    previewDuration: 3,
  });

  const emit = defineEmits<{
    (e: 'play'): void;
    (e: 'pause'): void;
    (e: 'ended'): void;
    (e: 'timeupdate', time: number): void;
    (e: 'volumechange', volume: number): void;
    (e: 'loadedmetadata', meta: { duration: number; videoWidth: number; videoHeight: number }): void;
    (e: 'ratechange', rate: number): void;
    (e: 'qualitychange', quality: string): void;
    (e: 'sourcechange', source: VideoSource): void;
    (e: 'subtitlechange', subtitle: VideoSubtitle): void;
    (e: 'fullscreenchange', isFullscreen: boolean): void;
    (e: 'pipchange', isPip: boolean): void;
    (e: 'buffering'): void;
    (e: 'error', error: string): void;
    (e: 'back'): void;
    (e: 'seek', time: number): void;
    (e: 'cast'): void;
  }>();

  // 视频相关引用
  const videoRef = ref<HTMLVideoElement | null>(null);
  const playerContainer = ref<HTMLDivElement | null>(null);
  const controlsRef = ref<HTMLDivElement | null>(null);
  const progressBar = ref<HTMLDivElement | null>(null);
  const progressHandle = ref<HTMLDivElement | null>(null);
  const volumeSlider = ref<HTMLDivElement | null>(null);
  const danmakuContainer = ref<HTMLDivElement | null>(null);

  // 状态管理
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(1);
  const isMuted = ref(false);
  const isLoading = ref(false);
  const error = ref('');
  const isFullscreen = ref(false);
  const isPictureInPicture = ref(false);
  const showControls = ref(true);
  const showControlsTemporarily = ref(false);
  const showVolumeSlider = ref(false);
  const showPlayHint = ref(false);
  const showSettings = ref(false);
  const bufferedPercentage = ref(0);
  const progressPercentage = ref(0);
  const playbackRate = ref(1);
  const currentQuality = ref('');
  const currentSubtitle = ref('');
  const currentSourceIndex = ref(0);
  const loadingText = ref('加载中...');
  const loadingProgress = ref(0);

  // 缓冲和错误恢复相关
  const isBuffering = ref(false);
  const bufferHealth = ref(0);
  const networkState = ref('');
  const readyState = ref(0);
  const autoRetryEnabled = ref(true);
  const lastBufferTime = ref(0);
  const bufferWaitTime = ref(0);
  const adaptiveQuality = ref(false);

  // 移动端相关
  const isMobile = ref(mobileOptimizations.isMobileDevice());
  const isTouchMoving = ref(false);
  const touchStartTime = ref(0);
  const touchStartX = ref(0);
  const touchStartY = ref(0);
  const touchStartDistance = ref(0);
  const brightness = ref(1);

  // 增强的触摸手势状态
  const gestureState = reactive({
    isDoubleTap: false,
    isLongPress: false,
    isSwipe: false,
    swipeDirection: 'none' as 'left' | 'right' | 'up' | 'down' | 'none',
    pinchScale: 1,
    longPressTimer: null as number | null,
    doubleTapTimer: null as number | null,
    tapCount: 0,
    lastTapTime: 0,
  });

  // 触摸反馈状态
  const touchFeedback = reactive({
    showVolumeIndicator: false,
    showBrightnessIndicator: false,
    showSeekIndicator: false,
    seekAmount: 0,
    seekDirection: 'forward' as 'forward' | 'backward',
    vibrationSupported: 'vibrate' in navigator,
  });

  // 手势控制相关
  const showSeekHint = ref(false);
  const seekDirection = ref<'forward' | 'backward'>('forward');
  const seekAmount = ref(0);
  const showVolumeHint = ref(false);
  const showBrightnessHint = ref(false);

  // 进度条相关
  const showPreviewTime = ref(false);
  const previewTime = ref(0);
  const previewProgress = ref(0);

  // 弹幕相关
  const visibleDanmaku = ref<DanmakuItem[]>([]);

  // 快捷键相关
  const hideControlsTimer = ref<number | null>(null);

  // 画中画相关
  const showPipPreview = ref(false);

  // 主题相关
  const currentTheme = ref<'dark' | 'light'>('dark');

  // 计算属性
  const formatTime = computed(() => (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  const volumeIcon = computed(() => {
    if (isMuted.value || volume.value === 0) return '🔇';
    if (volume.value > 0.5) return '🔊';
    return '🔉';
  });

  const speedOptions = computed(() => [0.5, 0.75, 1, 1.25, 1.5, 2]);

  // 弹幕计算属性
  const getDanmakuStyle = (danmaku: DanmakuItem) => {
    return {
      color: danmaku.color,
      fontSize: `${danmaku.size}px`,
      opacity: danmaku.opacity,
      // 根据类型设置不同的位置
      top: danmaku.type === 'top' ? '10%' : danmaku.type === 'bottom' ? '80%' : 'auto',
    };
  };

  // 生命周期
  onMounted(() => {
    setupEventListeners();
    initializePlayer();
  });

  onUnmounted(() => {
    cleanupEventListeners();
    if (hideControlsTimer.value) {
      clearTimeout(hideControlsTimer.value);
    }
  });

  // 监听器
  watch(
    () => props.src,
    newSrc => {
      if (videoRef.value) {
        videoRef.value.src = newSrc;
      }
    },
  );

  watch(
    () => props.muted,
    newMuted => {
      if (videoRef.value) {
        videoRef.value.muted = newMuted;
      }
    },
  );

  // 初始化播放器
  const initializePlayer = () => {
    if (videoRef.value) {
      videoRef.value.volume = volume.value;
      videoRef.value.muted = isMuted.value;
      videoRef.value.playbackRate = playbackRate.value;

      // 设置预加载策略
      if (props.preload === 'auto') {
        // 预加载更多数据以减少缓冲
        videoRef.value.preload = 'auto';
      } else if (props.preload === 'metadata') {
        // 只加载元数据
        videoRef.value.preload = 'metadata';
      } else {
        // 不预加载
        videoRef.value.preload = 'none';
      }

      // 如果有多个源，设置当前源
      if (props.sources.length > 0) {
        currentSourceIndex.value = 0;
        videoRef.value.src = props.sources[0].url;
      }
    }
  };

  // 事件监听器设置
  const setupEventListeners = () => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // 点击外部关闭设置面板
    document.addEventListener('click', e => {
      if (
        showSettings.value &&
        playerContainer.value &&
        !playerContainer.value.contains(e.target as Node)
      ) {
        showSettings.value = false;
      }
    });
  };

  const cleanupEventListeners = () => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    document.removeEventListener('mozfullscreenchange', onFullscreenChange);
    document.removeEventListener('MSFullscreenChange', onFullscreenChange);
  };

  // 视频事件处理
  const onLoadedMetadata = () => {
    if (videoRef.value) {
      duration.value = videoRef.value.duration;
      volume.value = videoRef.value.volume;
      isMuted.value = videoRef.value.muted;
      playbackRate.value = videoRef.value.playbackRate;

      // 发送加载完成事件
      emit('loadedmetadata', {
        duration: duration.value,
        videoWidth: videoRef.value.videoWidth,
        videoHeight: videoRef.value.videoHeight,
      });
    }
  };

  const onTimeUpdate = () => {
    if (videoRef.value) {
      currentTime.value = videoRef.value.currentTime;
      progressPercentage.value = (currentTime.value / duration.value) * 100;
      emit('timeupdate', currentTime.value);

      // 更新可见弹幕
      updateVisibleDanmaku();

      // 试看模式下检查是否超过试看时长
      if (props.isPreviewMode && currentTime.value >= props.previewDuration * 60) {
        videoRef.value.pause();
        error.value = `试看时间已结束，请登录后观看完整视频`;
        emit('error', error.value);
      }
    }
  };

  const onPlay = () => {
    isPlaying.value = true;
    showPlayHint.value = false;
    resetRetryCount(); // 重置重试计数器
    emit('play');
  };

  const onPause = () => {
    isPlaying.value = false;
    emit('pause');
  };

  const onEnded = () => {
    isPlaying.value = false;
    emit('ended');
  };

  const onVolumeChange = () => {
    if (videoRef.value) {
      volume.value = videoRef.value.volume;
      isMuted.value = videoRef.value.muted;
      emit('volumechange', volume.value);
    }
  };

  const onBuffering = () => {
    isBuffering.value = true;
    lastBufferTime.value = Date.now();
    isLoading.value = true;
    loadingText.value = '缓冲中...';
    emit('buffering');

    // 缓冲超时检测
    setTimeout(() => {
      if (isBuffering.value) {
        bufferWaitTime.value = Date.now() - lastBufferTime.value;
        if (bufferWaitTime.value > 10000) {
          // 10秒缓冲超时
          handleBufferTimeout();
        }
      }
    }, 10000);
  };

  const onPlaying = () => {
    isBuffering.value = false;
    isLoading.value = false;
    bufferWaitTime.value = 0;
    resetRetryCount();
  };

  const onError = (e: Event) => {
    const video = videoRef.value;
    if (!video) return;

    // 获取详细错误信息
    const errorCode = video.error?.code || 0;
    const errorMessage = video.error?.message || '未知错误';

    let errorDetail = '';
    switch (errorCode) {
      case MediaError.MEDIA_ERR_ABORTED:
        errorDetail = '视频加载被中断';
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        errorDetail = '网络错误，请检查网络连接';
        break;
      case MediaError.MEDIA_ERR_DECODE:
        errorDetail = '视频解码失败，可能是格式不支持';
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorDetail = '视频源不支持或格式错误';
        break;
      default:
        errorDetail = `视频播放错误 (${errorCode}): ${errorMessage}`;
    }

    error.value = errorDetail;
    isLoading.value = false;
    isBuffering.value = false;

    // 发送错误事件
    emit('error', error.value);

    // 自动恢复尝试
    if (autoRetryEnabled.value && retryCount < maxRetries) {
      setTimeout(() => {
        handleAutoRecovery();
      }, 2000);
    }
  };

  const onCanPlay = () => {
    isLoading.value = false;
  };

  const onProgress = () => {
    if (videoRef.value && duration.value > 0) {
      const buffered = videoRef.value.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        bufferedPercentage.value = (bufferedEnd / duration.value) * 100;

        // 计算缓冲健康度
        const bufferHealth = bufferedEnd - currentTime.value;
        if (bufferHealth > 30) {
          // 缓冲充足，可以停止缓冲指示
          isBuffering.value = false;
          isLoading.value = false;
        }
      }

      // 更新网络状态
      networkState.value = getNetworkStateText(videoRef.value.networkState);
      readyState.value = videoRef.value.readyState;
    }
  };

  // 缓冲超时处理
  const handleBufferTimeout = () => {
    if (!isBuffering.value) return;

    console.warn('缓冲超时，尝试恢复播放');

    // 尝试调整播放位置
    if (videoRef.value && currentTime.value > 5) {
      const savedTime = currentTime.value;
      videoRef.value.currentTime = savedTime - 2; // 回退2秒
    }

    // 如果缓冲时间过长，尝试切换源
    if (bufferWaitTime.value > 20000 && props.sources.length > 1) {
      loadingText.value = '缓冲超时，切换线路...';
      switchSource();
    }
  };

  // 自动恢复处理
  const handleAutoRecovery = () => {
    if (!videoRef.value || !autoRetryEnabled.value) return;

    retryCount++;
    loadingText.value = `尝试重新加载 (${retryCount}/${maxRetries})...`;

    // 尝试不同的恢复策略
    if (retryCount === 1) {
      // 第一次尝试：重新加载当前时间点
      const savedTime = currentTime.value;
      videoRef.value.load();
      videoRef.value.currentTime = savedTime;
    } else if (retryCount === 2) {
      // 第二次尝试：回退5秒重新加载
      const savedTime = Math.max(0, currentTime.value - 5);
      videoRef.value.load();
      videoRef.value.currentTime = savedTime;
    } else if (retryCount === 3 && props.sources.length > 1) {
      // 第三次尝试：切换播放源
      loadingText.value = '切换播放线路...';
      switchSource();
    }

    // 恢复播放
    videoRef.value.play().catch(error => {
      console.error('自动恢复播放失败:', error);
    });
  };

  // 获取网络状态文本
  const getNetworkStateText = (state: number): string => {
    switch (state) {
      case HTMLMediaElement.NETWORK_EMPTY:
        return '未初始化';
      case HTMLMediaElement.NETWORK_IDLE:
        return '空闲';
      case HTMLMediaElement.NETWORK_LOADING:
        return '加载中';
      case HTMLMediaElement.NETWORK_NO_SOURCE:
        return '无有效源';
      default:
        return '未知状态';
    }
  };

  const onRateChange = () => {
    if (videoRef.value) {
      playbackRate.value = videoRef.value.playbackRate;
      emit('ratechange', playbackRate.value);
    }
  };

  const onSeeking = () => {
    isLoading.value = true;
    loadingText.value = '跳转中...';
  };

  const onSeeked = () => {
    isLoading.value = false;
  };

  const onLoadedData = () => {
    // 数据加载完成
  };

  // 控制方法
  const togglePlayPause = () => {
    if (videoRef.value) {
      if (isPlaying.value) {
        videoRef.value.pause();
      } else {
        videoRef.value.play().catch(error => {
          console.error('播放失败:', error);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.value) {
      videoRef.value.muted = !videoRef.value.muted;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainer.value) return;

    const element = playerContainer.value as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      mozCancelFullScreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };

    if (!isFullscreen.value) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const onFullscreenChange = () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };

    isFullscreen.value = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    emit('fullscreenchange', isFullscreen.value);
  };

  const togglePictureInPicture = () => {
    if (!videoRef.value) return;

    if (!isPictureInPicture.value) {
      if (videoRef.value.requestPictureInPicture) {
        videoRef.value
          .requestPictureInPicture()
          .then(() => {
            isPictureInPicture.value = true;
            emit('pipchange', true);
          })
          .catch(error => {
            console.error('画中画模式启动失败:', error);
          });
      }
    } else {
      if (document.exitPictureInPicture) {
        document
          .exitPictureInPicture()
          .then(() => {
            isPictureInPicture.value = false;
            emit('pipchange', false);
          })
          .catch(error => {
            console.error('退出画中画模式失败:', error);
          });
      }
    }
  };

  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };

  const setPlaybackRate = (rate: number) => {
    if (videoRef.value) {
      videoRef.value.playbackRate = rate;
      playbackRate.value = rate;
      showSettings.value = false;
    }
  };

  const toggleSpeed = () => {
    const currentIndex = speedOptions.value.indexOf(playbackRate.value);
    const nextIndex = (currentIndex + 1) % speedOptions.value.length;
    setPlaybackRate(speedOptions.value[nextIndex]);
  };

  const setQuality = (quality: string) => {
    currentQuality.value = quality;
    showSettings.value = false;
    emit('qualitychange', quality);
  };

  const setSubtitle = (subtitleId: string) => {
    currentSubtitle.value = subtitleId;
    showSettings.value = false;
    const subtitle = props.subtitles.find(s => s.id === subtitleId);
    if (subtitle) {
      emit('subtitlechange', subtitle);
    }
  };

  const switchToSource = (index: number) => {
    if (index >= 0 && index < props.sources.length && videoRef.value) {
      currentSourceIndex.value = index;
      const source = props.sources[index];
      videoRef.value.src = source.url;
      showSettings.value = false;
      emit('sourcechange', source);
    }
  };

  const switchSource = () => {
    const nextIndex = (currentSourceIndex.value + 1) % props.sources.length;
    switchToSource(nextIndex);
  };

  const onBack = () => {
    emit('back');
  };

  const toggleCast = () => {
    emit('cast');
  };

  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
  };

  // 设置主题
  const setTheme = (theme: 'dark' | 'light') => {
    currentTheme.value = theme;
  };

  // 进度条控制
  const onProgressClick = (e: MouseEvent) => {
    if (!progressBar.value || !videoRef.value) return;

    const rect = progressBar.value.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration.value;

    videoRef.value.currentTime = newTime;
    emit('seek', newTime);
  };

  const onProgressMouseMove = (e: MouseEvent) => {
    if (!progressBar.value || !duration.value) return;

    const rect = progressBar.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));

    previewProgress.value = percentage * 100;
    previewTime.value = percentage * duration.value;
  };

  const onProgressMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    if (!progressBar.value) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = progressBar.value!.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));

      if (videoRef.value) {
        videoRef.value.currentTime = percentage * duration.value;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 音量控制
  const onVolumeClick = (e: MouseEvent) => {
    if (!volumeSlider.value || !videoRef.value) return;

    const rect = volumeSlider.value.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, 1 - clickY / rect.height));

    videoRef.value.volume = percentage;
    videoRef.value.muted = percentage === 0;
  };

  const onVolumeMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    if (!volumeSlider.value || !videoRef.value) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = volumeSlider.value!.getBoundingClientRect();
      const moveY = moveEvent.clientY - rect.top;
      const percentage = Math.max(0, Math.min(1, 1 - moveY / rect.height));

      videoRef.value!.volume = percentage;
      videoRef.value!.muted = percentage === 0;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 鼠标和触摸控制
  const onMouseMove = () => {
    showControlsTemporarily.value = true;

    if (hideControlsTimer.value) {
      clearTimeout(hideControlsTimer.value);
    }

    hideControlsTimer.value = window.setTimeout(() => {
      showControlsTemporarily.value = false;
    }, 3000);
  };

  const onMouseLeave = () => {
    if (hideControlsTimer.value) {
      clearTimeout(hideControlsTimer.value);
    }
    showControlsTemporarily.value = false;
  };

  const onControlsMouseEnter = () => {
    if (hideControlsTimer.value) {
      clearTimeout(hideControlsTimer.value);
    }
  };

  const onControlsMouseLeave = () => {
    if (hideControlsTimer.value) {
      clearTimeout(hideControlsTimer.value);
    }
    hideControlsTimer.value = window.setTimeout(() => {
      showControlsTemporarily.value = false;
    }, 3000);
  };

  // 触摸控制
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    const currentTime = Date.now();

    touchStartTime.value = currentTime;
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    isTouchMoving.value = false;

    // 双击检测
    const timeSinceLastTap = currentTime - gestureState.lastTapTime;
    if (timeSinceLastTap < 300 && timeSinceLastTap > 50) {
      gestureState.tapCount++;
      if (gestureState.tapCount === 2) {
        handleDoubleTap(touch);
        gestureState.isDoubleTap = true;
      }
    } else {
      gestureState.tapCount = 1;
    }
    gestureState.lastTapTime = currentTime;

    // 长按检测
    gestureState.longPressTimer = window.setTimeout(() => {
      if (!isTouchMoving.value) {
        handleLongPress(touch);
        gestureState.isLongPress = true;
      }
    }, 500);

    // 双指触摸检测
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance.value = Math.sqrt(dx * dx + dy * dy);
    }

    // 触摸振动反馈
    if (touchFeedback.vibrationSupported) {
      navigator.vibrate(10);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0 || touchStartX.value === 0) return;

    isTouchMoving.value = true;

    // 取消长按
    if (gestureState.longPressTimer) {
      clearTimeout(gestureState.longPressTimer);
      gestureState.longPressTimer = null;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.value;
    const deltaY = touch.clientY - touchStartY.value;
    const currentTime = Date.now();
    const deltaTime = currentTime - touchStartTime.value;

    // 检测滑动
    if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
      if (!gestureState.isSwipe && deltaTime < 300) {
        gestureState.isSwipe = true;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          gestureState.swipeDirection = deltaX > 0 ? 'right' : 'left';
          handleSwipe(gestureState.swipeDirection, deltaX);
        } else {
          gestureState.swipeDirection = deltaY > 0 ? 'down' : 'up';
          handleSwipe(gestureState.swipeDirection, deltaY);
        }
      }
    }

    // 单指手势处理
    if (e.touches.length === 1) {
      const containerRect = playerContainer.value?.getBoundingClientRect();
      if (!containerRect) return;

      // 水平滑动控制进度
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        handleHorizontalSwipe(deltaX, containerRect);
      }
      // 垂直滑动控制音量和亮度
      else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        handleVerticalSwipe(deltaY, containerRect);
      }
    }
    // 双指缩放
    else if (e.touches.length === 2) {
      handlePinchZoom(e);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    // 清理长按定时器
    if (gestureState.longPressTimer) {
      clearTimeout(gestureState.longPressTimer);
      gestureState.longPressTimer = null;
    }

    // 单击处理（如果没有其他手势）
    if (
      !isTouchMoving.value &&
      !gestureState.isDoubleTap &&
      !gestureState.isLongPress &&
      !gestureState.isSwipe
    ) {
      const touchDuration = Date.now() - touchStartTime.value;
      if (touchDuration < 200) {
        handleSingleTap(e.changedTouches[0]);
      }
    }

    // 重置手势状态
    if (Date.now() - gestureState.lastTapTime > 300) {
      gestureState.tapCount = 0;
      gestureState.isDoubleTap = false;
    }
    gestureState.isLongPress = false;
    gestureState.isSwipe = false;
    gestureState.swipeDirection = 'none';

    touchStartX.value = 0;
    touchStartY.value = 0;
    isTouchMoving.value = false;

    // 隐藏所有指示器
    setTimeout(() => {
      hideAllTouchIndicators();
    }, 1000);
  };

  // 手势处理函数
  const handleDoubleTap = (touch: Touch) => {
    // 双击切换播放/暂停或全屏
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }

    // 显示播放提示
    showPlayHint.value = true;

    // 振动反馈
    if (touchFeedback.vibrationSupported) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  const handleLongPress = (touch: Touch) => {
    // 长按显示设置面板
    toggleSettings();

    // 振动反馈
    if (touchFeedback.vibrationSupported) {
      navigator.vibrate([50, 30, 50]);
    }
  };

  const handleSwipe = (direction: string, distance: number) => {
    // 基础滑动处理
    console.log(`滑动方向: ${direction}, 距离: ${distance}`);
  };

  const handleSingleTap = (touch: Touch) => {
    // 单击切换控制栏显示
    showControlsTemporarily.value = !showControlsTemporarily.value;

    // 振动反馈
    if (touchFeedback.vibrationSupported) {
      navigator.vibrate(10);
    }
  };

  const handleHorizontalSwipe = (deltaX: number, containerRect: DOMRect) => {
    if (!videoRef.value) return;

    const seekAmount = (deltaX / containerRect.width) * duration.value * 0.1; // 10%的视频时长
    const newTime = Math.max(0, Math.min(duration.value, currentTime.value + seekAmount));

    touchFeedback.showSeekIndicator = true;
    touchFeedback.seekAmount = Math.abs(seekAmount);
    touchFeedback.seekDirection = deltaX > 0 ? 'forward' : 'backward';

    videoRef.value.currentTime = newTime;
    emit('seek', newTime);
  };

  const handleVerticalSwipe = (deltaY: number, containerRect: DOMRect) => {
    // 左侧控制音量，右侧控制亮度
    if (touchStartX.value < containerRect.width / 2) {
      // 音量控制
      const volumeChange = -(deltaY / containerRect.height) * 2;
      const newVolume = Math.max(0, Math.min(1, volume.value + volumeChange));

      if (videoRef.value) {
        videoRef.value.volume = newVolume;
        videoRef.value.muted = newVolume === 0;
      }

      touchFeedback.showVolumeIndicator = true;
      showVolumeHint.value = true;
    } else {
      // 亮度控制
      const brightnessChange = -(deltaY / containerRect.height) * 2;
      brightness.value = Math.max(0.1, Math.min(1, brightness.value + brightnessChange));

      touchFeedback.showBrightnessIndicator = true;
      showBrightnessHint.value = true;
    }
  };

  const handlePinchZoom = (e: TouchEvent) => {
    if (e.touches.length < 2) return;

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = distance / touchStartDistance.value;

    gestureState.pinchScale = Math.max(0.5, Math.min(3, scale));

    // 可以用于画质切换或界面缩放
    if (Math.abs(scale - 1) > 0.2) {
      console.log('缩放比例:', gestureState.pinchScale);
    }
  };

  const hideAllTouchIndicators = () => {
    touchFeedback.showVolumeIndicator = false;
    touchFeedback.showBrightnessIndicator = false;
    touchFeedback.showSeekIndicator = false;
  };

  // 快捷键支持
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!videoRef.value) return;

    // 检查是否在输入框中，避免冲突
    const activeElement = document.activeElement as HTMLElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true')
    ) {
      return;
    }

    // 只有当播放器容器获得焦点或在播放器区域内时才处理快捷键
    const isPlayerFocused =
      document.activeElement === playerContainer.value ||
      playerContainer.value?.contains(document.activeElement);

    if (!isPlayerFocused && !e.ctrlKey && !e.metaKey) return;

    switch (e.key) {
      // 播放控制
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        togglePlayPause();
        showKeyboardHint('空格', isPlaying.value ? '暂停' : '播放');
        break;

      // 方向键控制
      case 'ArrowLeft':
        e.preventDefault();
        const seekBackward = e.shiftKey ? 30 : 10; // Shift+左键快退30秒
        videoRef.value.currentTime = Math.max(0, currentTime.value - seekBackward);
        showKeyboardHint(`← ${seekBackward}秒`, '快退');
        break;
      case 'ArrowRight':
        e.preventDefault();
        const seekForward = e.shiftKey ? 30 : 10; // Shift+右键快进30秒
        videoRef.value.currentTime = Math.min(duration.value, currentTime.value + seekForward);
        showKeyboardHint(`→ ${seekForward}秒`, '快进');
        break;
      case 'ArrowUp':
        e.preventDefault();
        const volumeUp = e.shiftKey ? 0.2 : 0.1;
        videoRef.value.volume = Math.min(1, volume.value + volumeUp);
        showKeyboardHint('↑', `音量 ${Math.round(videoRef.value.volume * 100)}%`);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const volumeDown = e.shiftKey ? 0.2 : 0.1;
        videoRef.value.volume = Math.max(0, volume.value - volumeDown);
        showKeyboardHint('↓', `音量 ${Math.round(videoRef.value.volume * 100)}%`);
        break;

      // 音量控制
      case 'm':
      case 'M':
        e.preventDefault();
        videoRef.value.muted = !videoRef.value.muted;
        showKeyboardHint('M', videoRef.value.muted ? '静音' : '取消静音');
        break;

      // 播放速度控制
      case '>':
      case '.':
        e.preventDefault();
        increaseSpeed();
        showKeyboardHint('>', `播放速度 ${playbackRate.value}x`);
        break;
      case '<':
      case ',':
        e.preventDefault();
        decreaseSpeed();
        showKeyboardHint('<', `播放速度 ${playbackRate.value}x`);
        break;

      // 全屏控制
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        showKeyboardHint('F', isFullscreen.value ? '退出全屏' : '全屏');
        break;

      // 画中画
      case 'p':
      case 'P':
        e.preventDefault();
        togglePictureInPicture();
        showKeyboardHint('P', isPictureInPicture.value ? '退出画中画' : '画中画');
        break;

      // 字幕控制
      case 'c':
      case 'C':
        e.preventDefault();
        if (props.subtitles.length > 0) {
          const currentIndex = props.subtitles.findIndex(sub => sub.id === currentSubtitle.value);
          const nextIndex = (currentIndex + 1) % (props.subtitles.length + 1);
          if (nextIndex === props.subtitles.length) {
            setSubtitle('');
            showKeyboardHint('C', '关闭字幕');
          } else {
            setSubtitle(props.subtitles[nextIndex].id);
            showKeyboardHint('C', `字幕: ${props.subtitles[nextIndex].label}`);
          }
        }
        break;

      // 设置面板
      case 's':
      case 'S':
        e.preventDefault();
        toggleSettings();
        showKeyboardHint('S', showSettings.value ? '关闭设置' : '打开设置');
        break;

      // 播放源切换
      case 'Enter':
        if (props.sources.length > 1) {
          e.preventDefault();
          switchSource();
          showKeyboardHint('Enter', `切换到线路 ${currentSourceIndex.value + 1}`);
        }
        break;

      // 数字键跳转
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        const percentage = parseInt(e.key) / 10;
        const newTime = duration.value * percentage;
        videoRef.value.currentTime = newTime;
        showKeyboardHint(e.key, `跳转到 ${percentage * 100}%`);
        emit('seek', newTime);
        break;

      // 退出功能
      case 'Escape':
        if (isFullscreen.value) {
          toggleFullscreen();
          showKeyboardHint('ESC', '退出全屏');
        } else if (showSettings.value) {
          showSettings.value = false;
          showKeyboardHint('ESC', '关闭设置');
        }
        break;

      // 重置播放
      case 'r':
      case 'R':
        e.preventDefault();
        videoRef.value.currentTime = 0;
        showKeyboardHint('R', '重新开始');
        break;
    }
  };

  // 键盘提示显示
  const keyboardHint = reactive({
    show: false,
    key: '',
    action: '',
    timer: null as number | null,
  });

  const showKeyboardHint = (key: string, action: string) => {
    keyboardHint.key = key;
    keyboardHint.action = action;
    keyboardHint.show = true;

    if (keyboardHint.timer) {
      clearTimeout(keyboardHint.timer);
    }

    keyboardHint.timer = window.setTimeout(() => {
      keyboardHint.show = false;
    }, 1500);
  };

  // 播放速度调整函数
  const increaseSpeed = () => {
    const currentIndex = speedOptions.value.indexOf(playbackRate.value);
    const nextIndex = Math.min(currentIndex + 1, speedOptions.value.length - 1);
    setPlaybackRate(speedOptions.value[nextIndex]);
  };

  const decreaseSpeed = () => {
    const currentIndex = speedOptions.value.indexOf(playbackRate.value);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setPlaybackRate(speedOptions.value[prevIndex]);
  };

  // 弹幕控制
  let lastDanmakuUpdate = 0;
  const updateVisibleDanmaku = () => {
    if (!props.showDanmaku || !props.danmaku.length) return;

    // 使用节流优化性能，每100ms最多更新一次弹幕
    const now = Date.now();
    if (now - lastDanmakuUpdate < 100) return;
    lastDanmakuUpdate = now;

    const visible = props.danmaku.filter(danmaku => {
      return Math.abs(danmaku.time - currentTime.value) < 5; // 5秒内的弹幕
    });

    visibleDanmaku.value = visible;
  };

  // 重试功能
  let retryCount = 0;
  const maxRetries = 3;

  const retry = () => {
    error.value = '';
    isLoading.value = true;
    loadingText.value = '重新加载中...';

    if (videoRef.value) {
      // 如果达到最大重试次数，尝试切换到下一个源
      if (retryCount >= maxRetries && props.sources.length > 1) {
        switchSource();
        retryCount = 0;
        return;
      }

      videoRef.value.load();
      retryCount++;
    }
  };

  // 重置重试计数器
  const resetRetryCount = () => {
    retryCount = 0;
  };

  // 公共方法
  const play = () => {
    if (videoRef.value) {
      return videoRef.value.play();
    }
  };

  const pause = () => {
    if (videoRef.value) {
      videoRef.value.pause();
    }
  };

  const setCurrentTime = (time: number) => {
    if (videoRef.value) {
      videoRef.value.currentTime = time;
    }
  };

  const setVolume = (vol: number) => {
    if (videoRef.value) {
      videoRef.value.volume = vol;
    }
  };

  // 暴露给父组件的方法
  defineExpose({
    play,
    pause,
    setCurrentTime,
    setVolume,
    togglePlayPause,
    toggleFullscreen,
    togglePictureInPicture,
    // 添加更多实用方法
    setPlaybackRate,
    setQuality,
    setSubtitle,
    switchToSource,
    retry,
    toggleTheme,
    setTheme,
    // 获取播放器状态
    getCurrentTime: () => currentTime.value,
    getDuration: () => duration.value,
    getVolume: () => volume.value,
    isMuted: () => isMuted.value,
    isPlaying: () => isPlaying.value,
    isFullscreen: () => isFullscreen.value,
    getCurrentTheme: () => currentTheme.value,
  });
</script>

<style scoped>
  /* 基础样式重置 */
  .modern-video-player {
    --player-bg: #000;
    --player-color: #fff;
    --player-control-bg: rgba(0, 0, 0, 0.7);
    --player-control-hover-bg: rgba(255, 255, 255, 0.2);
    --player-progress-bg: rgba(255, 255, 255, 0.3);
    --player-progress-buffered-bg: rgba(255, 255, 255, 0.5);
    --player-progress-played-bg: #4caf50;
    --player-button-bg: transparent;
    --player-button-hover-bg: rgba(255, 255, 255, 0.2);
    --player-panel-bg: rgba(25, 25, 25, 0.95);
    --player-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

    position: relative;
    width: 100%;
    height: 100%;
    background: var(--player-bg);
    color: var(--player-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    outline: none;
  }

  /* 深色主题 */
  .modern-video-player.theme-dark {
    --player-bg: #000;
    --player-color: #fff;
    --player-control-bg: rgba(0, 0, 0, 0.7);
    --player-control-hover-bg: rgba(255, 255, 255, 0.2);
    --player-progress-bg: rgba(255, 255, 255, 0.3);
    --player-progress-buffered-bg: rgba(255, 255, 255, 0.5);
    --player-progress-played-bg: #4caf50;
    --player-button-bg: transparent;
    --player-button-hover-bg: rgba(255, 255, 255, 0.2);
    --player-panel-bg: rgba(25, 25, 25, 0.95);
    --player-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  /* 浅色主题 */
  .modern-video-player.theme-light {
    --player-bg: #fff;
    --player-color: #000;
    --player-control-bg: rgba(255, 255, 255, 0.7);
    --player-control-hover-bg: rgba(0, 0, 0, 0.2);
    --player-progress-bg: rgba(0, 0, 0, 0.3);
    --player-progress-buffered-bg: rgba(0, 0, 0, 0.5);
    --player-progress-played-bg: #4caf50;
    --player-button-bg: transparent;
    --player-button-hover-bg: rgba(0, 0, 0, 0.2);
    --player-panel-bg: rgba(255, 255, 255, 0.95);
    --player-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  /* 全屏样式 */
  .modern-video-player--fullscreen {
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999;
  }

  /* 移动端样式 */
  .modern-video-player--mobile {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  /* 加载状态 */
  .modern-video-player--loading {
    cursor: wait;
  }

  /* 错误状态 */
  .modern-video-player--error {
    cursor: not-allowed;
  }

  /* 视频容器 */
  .modern-video-player__container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* 视频元素 */
  .modern-video-player__video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    outline: none;
  }

  /* 弹幕容器 */
  .modern-video-player__danmaku-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  /* 弹幕项 */
  .modern-video-player__danmaku-item {
    position: absolute;
    white-space: nowrap;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    font-weight: bold;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .modern-video-player__danmaku--scroll {
    right: 100%;
    animation: danmaku-scroll linear;
  }

  .modern-video-player__danmaku--top {
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .modern-video-player__danmaku--bottom {
    left: 50%;
    bottom: 20%;
    transform: translateX(-50%);
    text-align: center;
  }

  @keyframes danmaku-scroll {
    from {
      transform: translateX(100vw);
    }
    to {
      transform: translateX(-100%);
    }
  }

  /* 画中画预览 */
  .modern-video-player__pip-preview {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .modern-video-player__pip-preview:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.05);
  }

  .modern-video-player__pip-icon {
    font-size: 16px;
  }

  .modern-video-player__pip-text {
    font-size: 12px;
    font-weight: 500;
  }

  /* 加载指示器 */
  .modern-video-player__loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--player-control-bg);
    z-index: 10;
  }

  .modern-video-player__loading-spinner {
    width: 50px;
    height: 50px;
    margin-bottom: 20px;
  }

  .spinner-circle {
    width: 100%;
    height: 100%;
    border: 3px solid var(--player-progress-bg);
    border-top: 3px solid var(--player-progress-played-bg);
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

  .modern-video-player__loading-text {
    font-size: 16px;
    margin-bottom: 15px;
    color: var(--player-color);
  }

  .modern-video-player__loading-progress {
    width: 200px;
    height: 4px;
    background: var(--player-progress-bg);
    border-radius: 2px;
    overflow: hidden;
  }

  .modern-video-player__loading-progress-bar {
    height: 100%;
    background: var(--player-progress-played-bg);
    transition: width 0.3s ease;
  }

  .modern-video-player__buffer-info {
    margin-top: 15px;
    text-align: center;
    color: var(--player-color);
  }

  .modern-video-player__buffer-text {
    font-size: 14px;
    opacity: 0.8;
    display: block;
    margin-bottom: 5px;
  }

  .modern-video-player__buffer-wait-time {
    font-size: 12px;
    opacity: 0.6;
    color: #ff9800;
  }

  /* 错误提示 */
  .modern-video-player__error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--player-control-bg);
    z-index: 10;
    padding: 20px;
    text-align: center;
  }

  .modern-video-player__error-icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #ff6b6b;
  }

  .modern-video-player__error-text {
    font-size: 16px;
    margin-bottom: 20px;
    color: #ff6b6b;
    max-width: 80%;
  }

  .modern-video-player__error-actions {
    display: flex;
    gap: 15px;
  }

  .modern-video-player__error-button {
    padding: 10px 20px;
    background: var(--player-progress-played-bg);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s ease;
  }

  .modern-video-player__error-button:hover {
    background: #45a049;
  }

  /* 播放提示 */
  .modern-video-player__play-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    background: var(--player-control-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    animation: fadeOut 1s ease forwards;
  }

  @keyframes fadeOut {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.5);
    }
  }

  .modern-video-player__play-icon {
    width: 40px;
    height: 40px;
    color: var(--player-color);
  }

  /* 快进/快退提示 */
  .modern-video-player__seek-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--player-control-bg);
    border-radius: 8px;
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 15;
    backdrop-filter: blur(10px);
  }

  .modern-video-player__seek-icon {
    font-size: 24px;
    margin-bottom: 5px;
    color: var(--player-color);
  }

  .modern-video-player__seek-amount {
    font-size: 14px;
    font-weight: 500;
    color: var(--player-color);
  }

  /* 音量和亮度提示 */
  .modern-video-player__volume-hint,
  .modern-video-player__brightness-hint {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    background: var(--player-control-bg);
    border-radius: 8px;
    padding: 15px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 15;
    backdrop-filter: blur(10px);
  }

  .modern-video-player__volume-icon,
  .modern-video-player__brightness-icon {
    font-size: 20px;
    margin-bottom: 10px;
    color: var(--player-color);
  }

  .modern-video-player__volume-bar,
  .modern-video-player__brightness-bar {
    width: 6px;
    height: 80px;
    background: var(--player-progress-bg);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .modern-video-player__volume-level,
  .modern-video-player__brightness-level {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    background: var(--player-progress-played-bg);
    border-radius: 3px;
  }

  .modern-video-player__volume-percent,
  .modern-video-player__brightness-percent {
    font-size: 12px;
    margin-top: 8px;
    color: var(--player-color);
    font-weight: 500;
  }

  /* 手势提示 */
  .modern-video-player__gesture-hint {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--player-control-bg);
    border-radius: 8px;
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 15;
    backdrop-filter: blur(10px);
    animation: fadeInOut 1s ease forwards;
  }

  .modern-video-player__gesture-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: var(--player-color);
  }

  .modern-video-player__gesture-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--player-color);
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
  }

  /* 键盘快捷键提示 */
  .modern-video-player__keyboard-hint {
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 25;
    backdrop-filter: blur(10px);
    animation: fadeInOut 1.5s ease forwards;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modern-video-player__keyboard-key {
    background: var(--player-progress-played-bg);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    min-width: 40px;
    text-align: center;
  }

  .modern-video-player__keyboard-action {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  /* 控制栏 */
  .modern-video-player__controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      var(--player-control-bg) 0%,
      transparent 30%,
      transparent 70%,
      var(--player-control-bg) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 20;
  }

  .modern-video-player:hover .modern-video-player__controls,
  .modern-video-player__controls:hover,
  .modern-video-player:focus-within .modern-video-player__controls {
    opacity: 1;
  }

  /* 顶部控制栏 */
  .modern-video-player__top-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .modern-video-player__back {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modern-video-player__title {
    font-size: 16px;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  .modern-video-player__top-spacer {
    flex: 1;
  }

  /* 中心控制按钮 */
  .modern-video-player__center-controls {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 15;
  }

  .modern-video-player__center-play {
    width: 70px;
    height: 70px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .modern-video-player__center-play:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }

  .modern-video-player__icon--large {
    width: 32px;
    height: 32px;
  }

  /* 底部控制栏 */
  .modern-video-player__bottom-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    background: linear-gradient(to top, var(--player-control-bg) 0%, transparent 100%);
  }

  /* 控制按钮 */
  .modern-video-player__control-button {
    background: var(--player-button-bg);
    border: none;
    color: var(--player-color);
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    outline: none;
  }

  .modern-video-player__control-button:hover {
    background: var(--player-button-hover-bg);
  }

  .modern-video-player__icon {
    width: 20px;
    height: 20px;
  }

  /* 时间显示 */
  .modern-video-player__time {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--player-color);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  .modern-video-player__time-separator {
    opacity: 0.7;
  }

  /* 进度条容器 */
  .modern-video-player__progress-container {
    flex: 1;
    height: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  /* 进度条 */
  .modern-video-player__progress-bar {
    position: relative;
    width: 100%;
    height: 4px;
    background: var(--player-progress-bg);
    border-radius: 2px;
    overflow: hidden;
  }

  .modern-video-player__progress-buffered {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--player-progress-buffered-bg);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .modern-video-player__progress-played {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--player-progress-played-bg);
    border-radius: 2px;
    transition: width 0.1s ease;
  }

  /* 进度预览 */
  .modern-video-player__progress-preview {
    position: absolute;
    bottom: 100%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    border-radius: 4px;
    padding: 5px 10px;
    margin-bottom: 10px;
    backdrop-filter: blur(10px);
    z-index: 25;
  }

  .modern-video-player__preview-time {
    font-size: 12px;
    font-weight: 500;
    color: white;
    margin-bottom: 5px;
  }

  .modern-video-player__preview-thumb {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid rgba(0, 0, 0, 0.8);
  }

  /* 进度手柄 */
  .modern-video-player__progress-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: #4caf50;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 20;
  }

  .modern-video-player__progress-container:hover .modern-video-player__progress-handle {
    opacity: 1;
  }

  /* 音量容器 */
  .modern-video-player__volume-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  /* 音量滑块 */
  .modern-video-player__volume-slider {
    position: absolute;
    bottom: 100%;
    right: 50%;
    transform: translateX(50%);
    width: 30px;
    height: 100px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 4px;
    padding: 10px 0;
    margin-bottom: 10px;
    backdrop-filter: blur(10px);
    z-index: 25;
  }

  .modern-video-player__volume-bar {
    width: 4px;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 0 auto;
    position: relative;
    cursor: pointer;
  }

  .modern-video-player__volume-level {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #4caf50;
    border-radius: 2px;
    transition: height 0.1s ease;
  }

  /* 播放速度 */
  .modern-video-player__speed-text {
    font-size: 14px;
    font-weight: 500;
    min-width: 30px;
    text-align: center;
  }

  /* 设置面板 */
  .modern-video-player__settings-panel {
    position: absolute;
    top: 50px;
    right: 20px;
    width: 250px;
    background: var(--player-panel-bg);
    border-radius: 8px;
    backdrop-filter: blur(20px);
    box-shadow: var(--player-shadow);
    z-index: 30;
    color: var(--player-color);
    overflow: hidden;
  }

  .modern-video-player__settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modern-video-player__settings-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--player-color);
  }

  .modern-video-player__settings-close {
    background: transparent;
    border: none;
    color: var(--player-color);
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modern-video-player__settings-close:hover {
    background: var(--player-button-hover-bg);
  }

  .modern-video-player__settings-content {
    padding: 15px 20px;
    max-height: 300px;
    overflow-y: auto;
  }

  .modern-video-player__settings-section {
    margin-bottom: 20px;
  }

  .modern-video-player__settings-section:last-child {
    margin-bottom: 0;
  }

  .modern-video-player__settings-section h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 500;
    color: #aaa;
  }

  /* 设置选项按钮 */
  .modern-video-player__speed-options,
  .modern-video-player__quality-options,
  .modern-video-player__source-options,
  .modern-video-player__subtitle-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .modern-video-player__speed-option,
  .modern-video-player__quality-option,
  .modern-video-player__source-option,
  .modern-video-player__subtitle-option {
    padding: 8px 12px;
    background: var(--player-button-bg);
    border: 1px solid var(--player-button-hover-bg);
    border-radius: 4px;
    color: var(--player-color);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .modern-video-player__speed-option:hover,
  .modern-video-player__quality-option:hover,
  .modern-video-player__source-option:hover,
  .modern-video-player__subtitle-option:hover {
    background: var(--player-button-hover-bg);
  }

  .modern-video-player__speed-option.active,
  .modern-video-player__quality-option.active,
  .modern-video-player__source-option.active,
  .modern-video-player__subtitle-option.active {
    background: var(--player-progress-played-bg);
    color: white;
    border-color: var(--player-progress-played-bg);
  }

  /* 移动端适配 - 平板设备 */
  @media (max-width: 1024px) and (min-width: 769px) {
    .modern-video-player__top-controls {
      padding: 12px 18px;
    }

    .modern-video-player__bottom-controls {
      padding: 12px 18px;
    }

    .modern-video-player__time {
      font-size: 13px;
    }

    .modern-video-player__control-button {
      padding: 7px;
    }

    .modern-video-player__icon {
      width: 19px;
      height: 19px;
    }

    .modern-video-player__center-play {
      width: 65px;
      height: 65px;
    }

    .modern-video-player__icon--large {
      width: 30px;
      height: 30px;
    }

    .modern-video-player__settings-panel {
      width: 240px;
    }

    .modern-video-player__speed-options,
    .modern-video-player__quality-options,
    .modern-video-player__source-options,
    .modern-video-player__subtitle-options {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
  }

  /* 移动端适配 - 手机设备 */
  @media (max-width: 768px) {
    .modern-video-player__top-controls {
      padding: 10px 15px;
    }

    .modern-video-player__bottom-controls {
      padding: 10px 15px;
    }

    .modern-video-player__time {
      font-size: 12px;
    }

    .modern-video-player__control-button {
      padding: 6px;
    }

    .modern-video-player__icon {
      width: 18px;
      height: 18px;
    }

    .modern-video-player__center-play {
      width: 60px;
      height: 60px;
    }

    .modern-video-player__icon--large {
      width: 28px;
      height: 28px;
    }

    .modern-video-player__settings-panel {
      right: 10px;
      width: 220px;
    }

    .modern-video-player__settings-content {
      padding: 12px 15px;
    }

    .modern-video-player__speed-options,
    .modern-video-player__quality-options,
    .modern-video-player__source-options,
    .modern-video-player__subtitle-options {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .modern-video-player__speed-option,
    .modern-video-player__quality-option,
    .modern-video-player__source-option,
    .modern-video-player__subtitle-option {
      padding: 6px 10px;
      font-size: 11px;
    }

    /* 优化触摸目标 */
    .modern-video-player__control-button {
      min-width: 44px;
      min-height: 44px;
    }

    .modern-video-player__progress-container {
      height: 24px;
    }

    .modern-video-player__progress-bar {
      height: 6px;
    }

    .modern-video-player__progress-handle {
      width: 16px;
      height: 16px;
    }
  }

  /* 小屏幕适配 */
  @media (max-width: 480px) {
    .modern-video-player__title {
      display: none;
    }

    .modern-video-player__top-controls {
      gap: 8px;
      padding: 8px 12px;
    }

    .modern-video-player__bottom-controls {
      gap: 8px;
      padding: 8px 12px;
    }

    .modern-video-player__time {
      font-size: 11px;
    }

    .modern-video-player__speed-text {
      font-size: 12px;
      min-width: 25px;
    }

    .modern-video-player__settings-panel {
      width: 200px;
      top: 40px;
      right: 5px;
    }

    .modern-video-player__settings-header h3 {
      font-size: 14px;
    }

    .modern-video-player__settings-section h4 {
      font-size: 12px;
    }

    .modern-video-player__speed-option,
    .modern-video-player__quality-option,
    .modern-video-player__source-option,
    .modern-video-player__subtitle-option {
      font-size: 10px;
      padding: 5px 8px;
    }

    /* 增强小屏幕触摸体验 */
    .modern-video-player__control-button {
      min-width: 40px;
      min-height: 40px;
      padding: 5px;
    }

    .modern-video-player__center-play {
      width: 50px;
      height: 50px;
    }

    .modern-video-player__icon--large {
      width: 24px;
      height: 24px;
    }

    .modern-video-player__progress-container {
      height: 20px;
    }

    .modern-video-player__progress-bar {
      height: 4px;
    }

    .modern-video-player__progress-handle {
      width: 14px;
      height: 14px;
    }

    /* 调整音量滑块 */
    .modern-video-player__volume-slider {
      width: 25px;
      height: 80px;
    }

    /* 缓冲信息优化 */
    .modern-video-player__buffer-info {
      margin-top: 10px;
    }

    .modern-video-player__buffer-text {
      font-size: 12px;
    }

    .modern-video-player__buffer-wait-time {
      font-size: 10px;
    }
  }

  /* 超小屏幕适配 */
  @media (max-width: 360px) {
    .modern-video-player__top-controls,
    .modern-video-player__bottom-controls {
      padding: 6px 10px;
    }

    .modern-video-player__control-button {
      min-width: 36px;
      min-height: 36px;
      padding: 4px;
    }

    .modern-video-player__icon {
      width: 16px;
      height: 16px;
    }

    .modern-video-player__center-play {
      width: 45px;
      height: 45px;
    }

    .modern-video-player__icon--large {
      width: 20px;
      height: 20px;
    }

    .modern-video-player__time {
      font-size: 10px;
    }

    .modern-video-player__speed-text {
      font-size: 10px;
      min-width: 22px;
    }

    .modern-video-player__settings-panel {
      width: 180px;
      right: 2px;
    }

    .modern-video-player__settings-header h3 {
      font-size: 13px;
    }

    .modern-video-player__settings-content {
      padding: 10px 12px;
    }

    .modern-video-player__settings-section {
      margin-bottom: 12px;
    }

    .modern-video-player__speed-option,
    .modern-video-player__quality-option,
    .modern-video-player__source-option,
    .modern-video-player__subtitle-option {
      font-size: 9px;
      padding: 4px 6px;
    }
  }

  /* 触摸设备优化 */
  @media (hover: none) {
    .modern-video-player__control-button:hover {
      background: transparent;
    }

    .modern-video-player__control-button:active {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(0.95);
    }

    .modern-video-player__progress-container:hover .modern-video-player__progress-handle {
      opacity: 1;
    }

    .modern-video-player__progress-handle {
      width: 16px;
      height: 16px;
    }

    /* 增大触摸目标以提高可访问性 */
    .modern-video-player__control-button {
      min-width: 44px;
      min-height: 44px;
      padding: 10px;
    }

    .modern-video-player__top-controls,
    .modern-video-player__bottom-controls {
      padding: 20px 15px;
    }
  }

  /* 移动端横屏优化 */
  @media (max-height: 480px) and (orientation: landscape) {
    .modern-video-player__title {
      display: none;
    }

    .modern-video-player__top-controls,
    .modern-video-player__bottom-controls {
      padding: 10px 15px;
    }

    .modern-video-player__settings-panel {
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  /* 高对比度模式 */
  @media (prefers-contrast: high) {
    .modern-video-player__progress-played {
      background: #00ff00;
    }

    .modern-video-player__volume-level {
      background: #00ff00;
    }

    .modern-video-player__speed-option.active,
    .modern-video-player__quality-option.active,
    .modern-video-player__source-option.active,
    .modern-video-player__subtitle-option.active {
      background: #00ff00;
      color: #000;
    }
  }

  /* 减少动画模式 */
  @media (prefers-reduced-motion: reduce) {
    .modern-video-player__controls,
    .modern-video-player__progress-played,
    .modern-video-player__volume-level,
    .modern-video-player__play-hint {
      transition: none;
      animation: none;
    }

    .spinner-circle {
      animation: none;
      border-top-color: #4caf50;
    }
  }

  /* 打印样式 */
  @media print {
    .modern-video-player {
      display: none;
    }
  }
</style>
