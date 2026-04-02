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
          您正在试看本视频的前 {{ previewDuration }} 分钟内容。<br />
          登录后即可观看完整视频。
        </p>
        <div class="preview-modal__actions">
          <button
            class="preview-modal__button preview-modal__button--cancel"
            @click="closePreviewModal"
          >
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
          :is-preview-mode="isPreviewMode"
          :preview-duration="previewDuration"
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
            <p class="preview-overlay__description">试看时间已结束，登录后即可观看完整视频。</p>
            <div class="preview-overlay__actions">
              <button
                class="preview-overlay__button preview-overlay__button--primary"
                @click="goToLogin"
              >
                立即登录
              </button>
              <button
                class="preview-overlay__button preview-overlay__button--secondary"
                @click="switchToNextSource"
              >
                切换线路
              </button>
            </div>
          </div>
        </div>

        <!-- 试看时间显示 -->
        <div v-if="isPreviewMode && previewTimeRemaining > 0" class="preview-time-indicator">
          <div class="preview-time-indicator__content">
            <div class="preview-time-indicator__icon">⏱️</div>
            <span class="preview-time-indicator__text"
              >试看剩余: {{ formatPreviewTime(previewTimeRemaining) }}</span
            >
          </div>
        </div>

        <!-- 试看警告 -->
        <div v-if="showPreviewWarning" class="preview-warning">
          <div class="preview-warning__content">
            <div class="preview-warning__icon">⚠️</div>
            <span class="preview-warning__text">试看即将结束，请登录观看完整视频</span>
            <button class="preview-warning__button" @click="goToLogin">登录</button>
          </div>
        </div>
      </div>

      <!-- 视频信息区域 -->
      <div class="video-info">
        <h2 class="video-info__title">{{ media?.title }}</h2>
        <div class="video-info__meta">
          <span v-if="media?.rating" class="video-info__rating"> ⭐ {{ media.rating }} </span>
          <span v-if="media?.releaseDate" class="video-info__year">
            {{ new Date(media.releaseDate).getFullYear() }}
          </span>
          <span v-if="media?.genres" class="video-info__genres">
            {{ media.genres.join(', ') }}
          </span>
        </div>
        <p v-if="media?.description" class="video-info__description">
          {{ media.description }}
        </p>

        <!-- 本地视频上传 -->
        <div class="local-video-upload">
          <LocalVideoUpload
            @file-selected="onLocalVideoSelected"
            @file-removed="onLocalVideoRemoved"
            @play-video="onLocalVideoPlay"
            @upload-complete="onLocalVideoUploadComplete"
            @upload-error="onLocalVideoUploadError"
          />
        </div>

        <!-- 播放源选择 -->
        <div v-if="playSources.length > 0 || localVideoFile" class="play-sources">
          <div class="play-sources__header">
            <h3 class="play-sources__title">播放源</h3>
            <div class="play-sources__actions">
              <button
                v-if="playSources.length > 0"
                class="play-sources__action-button"
                title="切换到最佳播放源"
                @click="switchToBestSource"
              >
                <svg class="play-sources__action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </button>
              <button
                v-if="playSources.length > 0"
                class="play-sources__action-button"
                title="切换到下一个播放源"
                @click="switchToNextSource"
              >
                <svg class="play-sources__action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6h2v12H4zm7 0h2v12h-2zm7 0h2v12h-2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 播放源切换状态 -->
          <div v-if="isSourceSwitching" class="play-sources__switching">
            <div class="play-sources__switching-spinner"></div>
            <span class="play-sources__switching-text">正在切换播放源...</span>
          </div>

          <!-- 播放源错误提示 -->
          <div v-if="sourceSwitchError" class="play-sources__error">
            <div class="play-sources__error-icon">⚠️</div>
            <span class="play-sources__error-text">{{ sourceSwitchError }}</span>
            <button class="play-sources__error-retry" @click="switchToBestSource">重试</button>
          </div>

          <div class="play-sources__list">
            <!-- 本地视频播放源 -->
            <button
              v-if="localVideoFile"
              class="play-source-button"
              :class="{
                'play-source-button--active': String(currentPlaySource?.id) === 'local',
                'play-source-button--switching':
                  isSourceSwitching && String(currentPlaySource?.id) === 'local',
              }"
              :disabled="isSourceSwitching"
              @click="switchToLocalVideo"
            >
              <div class="play-source-button__content">
                <span class="play-source-button__name">📁 本地视频</span>
                <div class="play-source-button__meta">
                  <span class="play-source-button__quality">
                    {{ localVideoMetadata?.width }}×{{ localVideoMetadata?.height }}
                  </span>
                  <span class="play-source-button__type"> 本地 </span>
                  <span class="play-source-button__status">
                    {{ formatFileSize(localVideoFile.size) }}
                  </span>
                </div>
              </div>
              <div v-if="String(currentPlaySource?.id) === 'local'" class="play-source-button__indicator">
                <div class="play-source-button__indicator-dot"></div>
              </div>
            </button>

            <!-- 在线播放源 -->
            <button
              v-for="source in playSources"
              :key="source.id"
              class="play-source-button"
              :class="{
                'play-source-button--active': String(currentPlaySource?.id) === String(source.id),
                'play-source-button--switching':
                  isSourceSwitching && currentPlaySource?.id === source.id,
              }"
              :disabled="isSourceSwitching"
              @click="switchPlaySource(source)"
            >
              <div class="play-source-button__content">
                <span class="play-source-button__name">{{ source.name }}</span>
                <div class="play-source-button__meta">
                  <span v-if="source.resolution" class="play-source-button__quality">
                    {{ source.resolution }}
                  </span>
                  <span v-if="source.type" class="play-source-button__type">
                    {{ getSourceTypeLabel(source.type) }}
                  </span>
                  <span v-if="source.status" class="play-source-button__status">
                    {{ source.status }}
                  </span>
                </div>
              </div>
              <div v-if="currentPlaySource?.id === source.id" class="play-source-button__indicator">
                <div class="play-source-button__indicator-dot"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- 视频操作 -->
        <div class="video-actions">
          <button class="video-action-button" @click="toggleFavorite">
            <svg
              v-if="isFavorite"
              class="video-action-button__icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <svg
              v-else
              class="video-action-button__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
          </button>

          <button class="video-action-button" @click="shareVideo">
            <svg
              class="video-action-button__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M18 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            <span>分享</span>
          </button>

          <button class="video-action-button" @click="downloadVideo">
            <svg
              class="video-action-button__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
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
            <input v-model="danmakuEnabled" type="checkbox" />
            启用弹幕
          </label>
        </div>

        <!-- 弹幕透明度 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label"> 透明度: {{ danmakuOpacity }}% </label>
          <input
            v-model="danmakuOpacity"
            type="range"
            min="10"
            max="100"
            step="10"
            class="danmaku-setting-slider"
          />
        </div>

        <!-- 弹幕字体大小 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label"> 字体大小: {{ danmakuFontSize }}px </label>
          <input
            v-model="danmakuFontSize"
            type="range"
            min="12"
            max="32"
            step="2"
            class="danmaku-setting-slider"
          />
        </div>

        <!-- 弹幕速度 -->
        <div class="danmaku-setting-item">
          <label class="danmaku-setting-label"> 滚动速度: {{ danmakuSpeed }} </label>
          <input
            v-model="danmakuSpeed"
            type="range"
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
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useDownloadsStore } from '@/stores/downloads';
  import { mediaApi, playSourceApi } from '@/api';
  import { notifyError, notifySuccess, showConfirm } from '@/composables/useModal';
  import VideoPlayer from '@/components/ui/VideoPlayer.vue';
  import LocalVideoUpload from '@/components/ui/LocalVideoUpload.vue';
  import { formatFileSize, formatDuration } from '@/utils/file-size';
  import type { MediaResource, PlaySource } from '@/types/media';

  interface DanmakuSettings {
    enabled: boolean;
    opacity: number;
    fontSize: number;
    speed: number;
  }

  // 路由和状态管理
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const downloadsStore = useDownloadsStore();

  // 视频播放器引用
  const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null);

  // 视频元数据接口
  interface VideoMetadata {
    width: number;
    height: number;
    duration: number;
    size: number;
    format: string;
    codec?: string;
    bitrate?: number;
  }

  // 数据状态
  const media = ref<MediaResource | null>(null);
  const playSources = ref<PlaySource[]>([]);
  const currentPlaySource = ref<PlaySource | null>(null);
  const isFavorite = ref(false);
  const showDanmakuSettings = ref(false);

  // 本地视频相关状态
  const localVideoFile = ref<File | null>(null);
  const localVideoUrl = ref<string>('');
  const localVideoMetadata = ref<VideoMetadata | null>(null);

  // 试看功能状态
  const showPreviewModal = ref(false);
  const isPreviewMode = ref(false);
  const currentTime = ref(0);
  const previewDuration = ref(3); // 试看时长（分钟）

  // 弹幕设置
  const danmakuSettings = ref<DanmakuSettings>({
    enabled: true,
    opacity: 80,
    fontSize: 16,
    speed: 5,
  });

  // 计算属性
  const mediaTitle = computed(() => media.value?.title || '视频播放');
  const danmakuEnabled = computed({
    get: () => danmakuSettings.value.enabled,
    set: value => (danmakuSettings.value.enabled = value),
  });
  const danmakuOpacity = computed({
    get: () => danmakuSettings.value.opacity,
    set: value => (danmakuSettings.value.opacity = value),
  });
  const danmakuFontSize = computed({
    get: () => danmakuSettings.value.fontSize,
    set: value => (danmakuSettings.value.fontSize = value),
  });
  const danmakuSpeed = computed({
    get: () => danmakuSettings.value.speed,
    set: value => (danmakuSettings.value.speed = value),
  });

  // 试看功能状态
  const previewTimeRemaining = ref(0);
  const showPreviewWarning = ref(false);
  const previewWarningTimer = ref<number | null>(null);

  // 试看功能方法
  const initializePreviewMode = () => {
    // 如果用户未登录，则启用试看模式
    if (!authStore.isAuthenticated) {
      isPreviewMode.value = true;
      showPreviewModal.value = true;

      // 设置试看时长（根据视频时长调整，最长3分钟）
      if (media.value?.duration) {
        const videoMinutes = Math.floor(media.value.duration / 60);
        previewDuration.value = Math.min(videoMinutes, 3);
      }

      // 计算剩余试看时间
      updatePreviewTimeRemaining();
    } else {
      isPreviewMode.value = false;
      showPreviewModal.value = false;
    }
  };

  const closePreviewModal = () => {
    showPreviewModal.value = false;
  };

  const goToLogin = () => {
    closePreviewModal();
    router.push('/login');
  };

  // 更新剩余试看时间
  const updatePreviewTimeRemaining = () => {
    if (isPreviewMode.value) {
      const remaining = Math.max(0, previewDuration.value * 60 - currentTime.value);
      previewTimeRemaining.value = remaining;

      // 在试看结束前10秒显示警告
      if (remaining <= 10 && remaining > 0 && !showPreviewWarning.value) {
        showPreviewWarning.value = true;

        // 10秒后隐藏警告
        if (previewWarningTimer.value) {
          clearTimeout(previewWarningTimer.value);
        }
        previewWarningTimer.value = window.setTimeout(() => {
          showPreviewWarning.value = false;
        }, 8000);
      }
    }
  };

  // 开始完整观看
  const startFullVideo = () => {
    if (!authStore.isAuthenticated) {
      // 显示登录提示
      showPreviewModal.value = true;
      return;
    }

    isPreviewMode.value = false;
    showPreviewModal.value = false;
    showPreviewWarning.value = false;

    // 从暂停位置继续播放
    if (videoPlayerRef.value) {
      videoPlayerRef.value.play();
    }
  };

  // 获取视频信息
  const fetchMediaInfo = async () => {
    try {
      const mediaId = route.params.id as string;
      if (!mediaId) {
        router.push('/404');
        return;
      }

      // 获取媒体资源信息
      const mediaData = await mediaApi.getMediaById(mediaId);
      media.value = mediaData;

      // 获取播放源列表
      const sources = await playSourceApi.getPlaySourcesByMediaId(mediaId);
      playSources.value = sources;

      // 设置默认播放源
      if (sources.length > 0) {
        currentPlaySource.value = sources[0];
      }

      // 初始化试看模式
      initializePreviewMode();

      // 检查是否已收藏
      // 这里应该调用API检查收藏状态
      isFavorite.value = false;
    } catch (error) {
      console.error('获取视频信息失败:', error);
      // 这里可以添加错误处理逻辑，比如显示错误提示
    }
  };

  // 播放源切换状态
  const isSourceSwitching = ref(false);
  const sourceSwitchError = ref('');
  const sourceSwitchStartTime = ref(0);

  // 切换播放源
  const switchPlaySource = async (source: PlaySource) => {
    if (currentPlaySource.value?.id === source.id) {
      return; // 相同源不需要切换
    }

    try {
      isSourceSwitching.value = true;
      sourceSwitchError.value = '';
      sourceSwitchStartTime.value = Date.now();

      // 暂停当前播放
      if (videoPlayerRef.value) {
        videoPlayerRef.value.pause();
      }

      // 设置新的播放源
      currentPlaySource.value = source;

      // 等待一下确保源切换完成
      await nextTick();

      // 尝试恢复播放
      if (videoPlayerRef.value) {
        await videoPlayerRef.value.play();
      }
    } catch (error) {
      console.error('播放源切换失败:', error);
      sourceSwitchError.value = '播放源切换失败，请重试';

      // 切换回上一个可用源
      const previousSource = playSources.value.find(s => s.id !== source.id);
      if (previousSource) {
        currentPlaySource.value = previousSource;
      }
    } finally {
      isSourceSwitching.value = false;
    }
  };

  // 智能切换到最佳播放源
  const switchToBestSource = async () => {
    if (playSources.value.length === 0) return;

    // 按优先级排序：在线 > 本地 > 其他
    const prioritizedSources = [...playSources.value].sort((a, b) => {
      const priority = { online: 3, local: 2, other: 1 };
      const aPriority = priority[a.type as keyof typeof priority] || 1;
      const bPriority = priority[b.type as keyof typeof priority] || 1;
      return bPriority - aPriority;
    });

    await switchPlaySource(prioritizedSources[0]);
  };

  // 切换到下一个播放源
  const switchToNextSource = async () => {
    if (playSources.value.length <= 1) return;

    const currentIndex = playSources.value.findIndex(s => s.id === currentPlaySource.value?.id);
    const nextIndex = (currentIndex + 1) % playSources.value.length;
    await switchPlaySource(playSources.value[nextIndex]);
  };

  // 视频事件处理
  const onVideoPlay = () => undefined;

  const onVideoPause = () => undefined;

  const onVideoEnded = () => {
    // 可以标记为已观看

    // 如果是试看模式，播放结束后提示登录
    if (isPreviewMode.value) {
      showPreviewModal.value = true;
    }
  };

  const onVideoTimeUpdate = (time: number) => {
    // 更新当前播放时间
    currentTime.value = time;

    // 更新剩余试看时间
    updatePreviewTimeRemaining();

    // 试看模式下检查是否超过试看时长
    if (isPreviewMode.value && time >= previewDuration.value * 60) {
      // 暂停视频播放
      videoPlayerRef.value?.pause();

      // 显示试看结束提示
      showPreviewModal.value = true;
    }
  };

  const onVideoVolumeChange = (_volume: number) => undefined;

  const onVideoError = (error: string) => {
    console.error('视频播放错误:', error);
    // 这里可以添加视频播放错误处理逻辑
  };

  // 收藏/取消收藏
  const toggleFavorite = async () => {
    if (!authStore.isAuthenticated) {
      showConfirm('收藏功能需要登录，是否前往登录页面？', () => {
        void router.push('/login');
      });
      return;
    }

    try {
      // 使用toggleFavorite方法
      await mediaApi.toggleFavorite(media.value!.id.toString());
      isFavorite.value = !isFavorite.value;
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 这里可以添加收藏失败的处理逻辑
    }
  };

  // 分享视频
  const shareVideo = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: media.value?.title || '',
          text: media.value?.description || '',
          url: url,
        })
        .catch(console.error);
    } else {
      // 复制到剪贴板
      navigator.clipboard
        .writeText(url)
        .then(() => {
          notifySuccess('链接已复制', '当前视频链接已复制到剪贴板。');
        })
        .catch(() => {
          notifyError('复制失败', '复制视频链接失败，请稍后重试。');
        });
    }
  };

  // 下载视频
  const downloadVideo = () => {
    const downloadUrl =
      currentPlaySource.value?.downloadUrls?.[0] || media.value?.downloadUrls?.[0] || '';

    if (!downloadUrl || !media.value) {
      notifyError('暂不支持下载', '当前视频没有可用的下载链接。');
      return;
    }

    const task = downloadsStore.enqueueTask({
      url: downloadUrl,
      fileName: media.value.title || 'video',
      sourceLabel: currentPlaySource.value?.sourceName || media.value.source || '播放页',
      mediaResourceId: media.value.id,
      metadata: {
        title: media.value.title,
        description: media.value.description,
        duration: media.value.duration,
      },
    });

    downloadsStore.startTask(task.id);
    notifySuccess('已加入下载任务', `已将《${task.fileName}》加入下载任务。`);
  };

  // 格式化试看时间
  const formatPreviewTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 本地视频处理方法
  const onLocalVideoSelected = async (file: File, metadata?: VideoMetadata) => {
    localVideoFile.value = file;
    localVideoMetadata.value = metadata;

    // 创建本地URL
    if (localVideoUrl.value) {
      URL.revokeObjectURL(localVideoUrl.value);
    }
    localVideoUrl.value = URL.createObjectURL(file);
  };

  const onLocalVideoRemoved = () => {
    // 清理本地视频资源
    if (localVideoUrl.value) {
      URL.revokeObjectURL(localVideoUrl.value);
      localVideoUrl.value = '';
    }

    localVideoFile.value = null;
    localVideoMetadata.value = null;

    // 如果当前播放的是本地视频，切换到其他源
    if (String(currentPlaySource.value?.id) === 'local' && playSources.value.length > 0) {
      switchToBestSource();
    }

  };

  const onLocalVideoPlay = (file: File, url: string) => {
    void file;
    void url;
    // 切换到本地视频播放
    switchToLocalVideo();
  };

  const onLocalVideoUploadComplete = (_response: unknown) => undefined;

  const onLocalVideoUploadError = (error: string) => {
    console.error('本地视频上传失败:', error);
    // 可以在这里显示错误提示
  };

  // 切换到本地视频播放源
  const switchToLocalVideo = async () => {
    if (!localVideoFile.value || !localVideoUrl.value) {
      console.warn('没有可用的本地视频文件');
      return;
    }

    try {
      isSourceSwitching.value = true;
      sourceSwitchError.value = '';
      sourceSwitchStartTime.value = Date.now();

      // 暂停当前播放
      if (videoPlayerRef.value) {
        videoPlayerRef.value.pause();
      }

      // 设置本地视频为当前播放源
      currentPlaySource.value = {
        id: 'local',
        name: '本地视频',
        url: localVideoUrl.value,
        type: 'local',
        resolution: `${localVideoMetadata.value?.width || 0}×${localVideoMetadata.value?.height || 0}`,
        isActive: true,
        status: 'active',
        priority: 10,
        isAds: false,
        playCount: 0,
        mediaResourceId: media.value?.id || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as PlaySource;

      // 等待一下确保源切换完成
      await nextTick();

      // 恢复播放
      if (videoPlayerRef.value) {
        await videoPlayerRef.value.play();
      }
    } catch (error) {
      console.error('本地视频切换失败:', error);
      sourceSwitchError.value = '本地视频切换失败，请重试';
    } finally {
      isSourceSwitching.value = false;
    }
  };

  // 获取播放源类型标签
  const getSourceTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      online: '在线',
      local: '本地',
      cdn: 'CDN',
      p2p: 'P2P',
      backup: '备用',
    };
    return typeLabels[type] || type.toUpperCase();
  };

  // 返回上一页
  const goBack = () => {
    router.back();
  };

  // 生命周期钩子
  onMounted(() => {
    fetchMediaInfo();
  });

  onUnmounted(() => {
    // 组件销毁时清理资源
    videoPlayerRef.value?.pause();

    // 清理本地视频资源
    if (localVideoUrl.value) {
      URL.revokeObjectURL(localVideoUrl.value);
      localVideoUrl.value = '';
    }

    // 清理定时器
    if (previewWarningTimer.value) {
      clearTimeout(previewWarningTimer.value);
    }
  });
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
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

  .preview-overlay__actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .preview-overlay__button--primary {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    flex: 1;
  }

  .preview-overlay__button--primary:hover {
    background: #5a67d8;
  }

  .preview-overlay__button--secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
  }

  .preview-overlay__button--secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  /* 试看时间指示器 */
  .preview-time-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    z-index: 30;
    animation: fadeIn 0.5s ease;
  }

  .preview-time-indicator__content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .preview-time-indicator__icon {
    font-size: 1rem;
  }

  /* 试看警告 */
  .preview-warning {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(244, 63, 94, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1.5rem;
    z-index: 40;
    animation: slideInBounce 0.5s ease;
    max-width: 90%;
    width: 350px;
  }

  .preview-warning__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    color: white;
  }

  .preview-warning__icon {
    font-size: 2rem;
    animation: pulse 1s ease infinite;
  }

  .preview-warning__text {
    font-size: 0.95rem;
    line-height: 1.4;
    font-weight: 500;
  }

  .preview-warning__button {
    background: white;
    color: #f43f5e;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .preview-warning__button:hover {
    transform: scale(1.05);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInBounce {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .video-watch-main {
    padding-top: 4rem;
    padding-bottom: 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .video-player-wrapper {
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .video-info {
    padding: 1.5rem;
    background: #111;
    border-radius: 0 0 8px 8px;
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

  .play-sources__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .play-sources__actions {
    display: flex;
    gap: 0.5rem;
  }

  .play-sources__action-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    color: white;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-sources__action-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .play-sources__action-icon {
    width: 1rem;
    height: 1rem;
  }

  .play-sources__switching {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    color: #667eea;
  }

  .play-sources__switching-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .play-sources__switching-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .play-sources__error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    color: #ef4444;
  }

  .play-sources__error-icon {
    font-size: 1rem;
  }

  .play-sources__error-text {
    flex: 1;
    font-size: 0.875rem;
  }

  .play-sources__error-retry {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.25rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .play-sources__error-retry:hover {
    background: #dc2626;
  }

  .play-source-button__content {
    flex: 1;
    text-align: left;
  }

  .play-source-button__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .play-source-button__type {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .play-source-button__status {
    color: #10b981;
    font-weight: 500;
  }

  .play-source-button__indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.75rem;
  }

  .play-source-button__indicator-dot {
    width: 0.5rem;
    height: 0.5rem;
    background: #667eea;
    border-radius: 50%;
    animation: pulse 2s ease infinite;
  }

  .play-source-button--switching {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .play-source-button--switching .play-source-button__indicator-dot {
    animation: spin 1s linear infinite;
    border: 2px solid #667eea;
    border-top: 2px solid transparent;
    width: 0.75rem;
    height: 0.75rem;
    background: transparent;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .local-video-upload {
    margin-bottom: 1.5rem;
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
  @media (max-width: 1024px) {
    .video-watch-main {
      padding-top: 3.5rem;
    }

    .video-player-wrapper {
      margin: 0 1rem;
      border-radius: 12px;
    }

    .video-info {
      padding: 1.25rem;
    }
  }

  @media (max-width: 768px) {
    .video-watch-header {
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(15px);
    }

    .video-watch-header__title {
      font-size: 1rem;
    }

    .video-watch-main {
      padding-top: 3.5rem;
      padding-bottom: 1rem;
    }

    .video-player-wrapper {
      margin: 0 0.5rem;
      aspect-ratio: 16/9;
      border-radius: 8px;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.4);
    }

    .video-info {
      padding: 1rem;
      background: #0a0a0a;
      margin: 0 0.5rem;
      border-radius: 8px;
    }

    .video-info__title {
      font-size: 1.25rem;
      line-height: 1.4;
    }

    .video-info__meta {
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.8rem;
    }

    .video-info__description {
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .video-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .video-action-button {
      justify-content: center;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }

    .play-sources__list {
      gap: 0.5rem;
    }

    .play-source-button {
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
    }

    .danmaku-settings-panel {
      width: 100%;
      right: 0;
    }

    .preview-time-indicator {
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.4rem 0.8rem;
    }

    .preview-time-indicator__content {
      font-size: 0.8rem;
    }

    .preview-warning {
      width: 90%;
      padding: 1rem;
    }

    .preview-warning__content {
      gap: 0.75rem;
    }

    .preview-warning__icon {
      font-size: 1.5rem;
    }

    .preview-warning__text {
      font-size: 0.85rem;
    }

    .preview-overlay__actions {
      flex-direction: column;
      gap: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .video-watch-header {
      padding: 0.5rem;
    }

    .video-watch-header__title {
      font-size: 0.9rem;
    }

    .video-watch-main {
      padding-top: 3rem;
    }

    .video-player-wrapper {
      margin: 0;
      border-radius: 0;
    }

    .video-info {
      margin: 0;
      border-radius: 0;
      padding: 1rem 0.75rem;
    }

    .video-info__title {
      font-size: 1.1rem;
    }

    .video-action-button {
      padding: 0.6rem 0.8rem;
      font-size: 0.85rem;
    }

    .video-action-button__icon {
      width: 1rem;
      height: 1rem;
    }
  }

  /* 横屏模式优化 */
  @media (orientation: landscape) and (max-height: 600px) {
    .video-watch-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 0.5rem 1rem;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(10px);
    }

    .video-watch-header__title {
      font-size: 0.9rem;
    }

    .video-watch-main {
      padding-top: 3rem;
      padding-bottom: 0;
      margin-top: 0;
    }

    .video-player-wrapper {
      width: 100vw;
      height: calc(100vh - 3rem);
      margin: 0;
      border-radius: 0;
      aspect-ratio: auto;
      position: fixed;
      top: 3rem;
      left: 0;
      z-index: 50;
    }

    .video-info {
      display: none; /* 横屏模式隐藏视频信息 */
    }

    /* 全屏播放器优化 */
    .video-player-wrapper:fullscreen {
      border-radius: 0;
    }
  }

  /* 超宽屏优化 */
  @media (min-width: 1400px) {
    .video-watch-main {
      max-width: 1200px;
      margin: 0 auto;
    }

    .video-player-wrapper {
      max-width: 1200px;
      margin: 0 auto;
    }

    .video-info {
      max-width: 1200px;
      margin: 0 auto;
    }
  }
</style>
