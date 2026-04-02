<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <nav class="bg-gray-800 shadow-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <router-link to="/" class="text-xl font-bold text-white">Nest TV</router-link>
        <router-link to="/" class="text-sm text-gray-300 hover:text-white">返回首页</router-link>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div v-if="loading" class="py-16 text-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        <p class="mt-4 text-sm text-gray-300">加载中...</p>
      </div>

      <div v-else-if="media" class="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        <section class="lg:col-span-2 space-y-6">
          <div class="relative overflow-hidden rounded-2xl bg-black shadow-xl">
            <DanmakuPlayer
              v-if="currentPlaySource"
              :video-id="media.id.toString()"
              :width="1280"
              :height="720"
              :show-controls="true"
              :max-danmaku-count="150"
            />

            <div v-if="currentPlaySource" class="relative z-10 aspect-video">
              <video
                ref="videoPlayer"
                class="h-full w-full"
                controls
                @loadedmetadata="applyResumeTime"
                @timeupdate="handleTimeUpdate"
                @ended="handleVideoEnded"
              >
                <source :src="currentPlaySource.url" :type="getVideoType(currentPlaySource.url)" />
                您的浏览器暂不支持当前视频播放。
              </video>
            </div>

            <div class="bg-gray-800 p-4">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">播放源</h2>
                <span v-if="currentPlaySource" class="text-xs text-gray-400">
                  当前：{{ currentPlaySource.sourceName || `播放源 ${currentPlaySource.id}` }}
                </span>
              </div>

              <div class="mt-4 space-y-2">
                <button
                  v-for="playSource in media.playSources"
                  :key="playSource.id"
                  :class="[
                    'w-full rounded-xl p-3 text-left transition-colors',
                    currentPlaySource?.id === playSource.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
                  ]"
                  @click="selectPlaySource(playSource)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="font-medium">{{ playSource.sourceName || `播放源 ${playSource.id}` }}</div>
                      <div class="mt-1 text-xs text-gray-300">
                        {{ playSource.resolution }} · {{ playSource.format }}
                      </div>
                    </div>
                    <div class="text-xs text-gray-300">
                      {{ playSource.type === 'online' ? '在线' : '本地' }}
                    </div>
                  </div>
                </button>
              </div>

              <div class="mt-4 lg:hidden">
                <div class="rounded-xl bg-gray-700 p-3">
                  <h3 class="mb-3 font-medium">播放控制</h3>
                  <div class="grid grid-cols-3 gap-2">
                    <button class="rounded-lg bg-gray-600 p-2 text-white hover:bg-gray-500" @click="togglePlay">
                      <span class="text-sm">{{ isPlaying ? '暂停' : '播放' }}</span>
                    </button>
                    <button class="rounded-lg bg-gray-600 p-2 text-white hover:bg-gray-500" @click="handleVolumeToggle">
                      <span class="text-sm">静音</span>
                    </button>
                    <button class="rounded-lg bg-gray-600 p-2 text-white hover:bg-gray-500" @click="toggleFullscreen">
                      <span class="text-sm">全屏</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section class="rounded-2xl bg-gray-800 p-6 shadow-sm">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-lg font-semibold">下载任务</h2>
                <p class="mt-1 text-sm text-gray-400">
                  当前资源检测到 {{ availableDownloadUrls.length }} 个可用下载链接，可加入任务列表统一处理。
                </p>
              </div>
              <router-link
                to="/downloads"
                class="rounded-lg border border-gray-600 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700"
              >
                查看列表
              </router-link>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-600"
                :disabled="!currentDownloadUrl"
                @click="queueDownloadTask"
              >
                加入下载任务
              </button>
              <a
                v-if="currentDownloadUrl"
                :href="currentDownloadUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
              >
                打开原始链接
              </a>
            </div>

            <p v-if="downloadMessage" class="mt-3 text-sm text-emerald-300">
              {{ downloadMessage }}
            </p>
            <p v-else-if="!currentDownloadUrl" class="mt-3 text-sm text-amber-300">
              当前播放源和媒体详情里都没有可用下载链接。
            </p>
          </section>
        </section>

        <aside class="space-y-6">
          <section class="rounded-2xl bg-gray-800 p-6 shadow-sm">
            <h1 class="text-2xl font-bold">{{ media.title }}</h1>

            <div class="mt-4 space-y-3 text-sm text-gray-300">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">类型</span>
                <span>{{ formatPreferenceLabel(media.type) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400">评分</span>
                <span class="text-yellow-400">{{ formatRating(media.rating) }}/10</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400">观看次数</span>
                <span>{{ media.viewCount }}</span>
              </div>
              <div v-if="media.director" class="flex items-center justify-between gap-4">
                <span class="text-gray-400">导演</span>
                <span class="text-right">{{ media.director }}</span>
              </div>
              <div v-if="media.actors" class="flex items-center justify-between gap-4">
                <span class="text-gray-400">主演</span>
                <span class="text-right">{{ media.actors }}</span>
              </div>
              <div v-if="media.releaseDate" class="flex items-center justify-between">
                <span class="text-gray-400">上映时间</span>
                <span>{{ formatDate(media.releaseDate) }}</span>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <button
                class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                :class="
                  isFavorite
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-gray-600 text-gray-100 hover:bg-gray-700'
                "
                :disabled="favoriteLoading"
                @click="toggleFavorite"
              >
                {{ favoriteLoading ? '处理中...' : isFavorite ? '已收藏' : '加入收藏' }}
              </button>
              <button
                v-if="favoriteMessage && isFavorite"
                class="text-sm font-medium text-amber-300 hover:text-amber-200"
                @click="goToFavorites"
              >
                查看收藏
              </button>
            </div>
            <p v-if="favoriteMessage" class="mt-3 text-sm text-amber-300">
              {{ favoriteMessage }}
            </p>
          </section>

          <section v-if="media.episodeCount" class="rounded-2xl bg-gray-800 p-6 shadow-sm">
            <h2 class="text-lg font-semibold">剧集选择</h2>
            <div class="mt-4 grid grid-cols-4 gap-2">
              <button
                v-for="episode in media.episodeCount"
                :key="episode"
                :class="[
                  'rounded-lg p-2 text-sm transition-colors',
                  currentEpisode === episode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
                ]"
                @click="selectEpisode(episode)"
              >
                第 {{ episode }} 集
              </button>
            </div>
          </section>

          <section v-if="media.description" class="rounded-2xl bg-gray-800 p-6 shadow-sm">
            <h2 class="text-lg font-semibold">剧情简介</h2>
            <p class="mt-4 text-sm leading-6 text-gray-300">{{ media.description }}</p>
          </section>
        </aside>
      </div>

      <div v-else class="py-16 text-center text-red-400">视频加载失败</div>
    </main>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import { useAuthStore } from '@/stores/auth';
  import { useDownloadsStore } from '@/stores/downloads';
  import { watchHistoryApi } from '@/api/watchHistory';
  import { notifyError, notifyInfo, notifySuccess } from '@/composables/useModal';
  import DanmakuPlayer from '@/components/DanmakuPlayer.vue';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();
  const authStore = useAuthStore();
  const downloadsStore = useDownloadsStore();

  const media = ref(null);
  const currentPlaySource = ref(null);
  const currentEpisode = ref(1);
  const loading = ref(true);
  const videoPlayer = ref(null);
  const isPlaying = ref(false);
  const lastSavedTime = ref(0);
  const hasAppliedResumeTime = ref(false);
  const downloadMessage = ref('');
  const isFavorite = ref(false);
  const favoriteLoading = ref(false);
  const favoriteMessage = ref('');

  const availableDownloadUrls = computed(() => {
    const sourceUrls = Array.isArray(currentPlaySource.value?.downloadUrls)
      ? currentPlaySource.value.downloadUrls.filter(Boolean)
      : [];
    const mediaUrls = Array.isArray(media.value?.downloadUrls)
      ? media.value.downloadUrls.filter(Boolean)
      : [];

    return sourceUrls.length > 0 ? sourceUrls : mediaUrls;
  });

  const currentDownloadUrl = computed(() => availableDownloadUrls.value[0] || '');

  const syncFavoriteStatus = async mediaId => {
    if (!authStore.token) {
      isFavorite.value = false;
      return;
    }

    try {
      isFavorite.value = await mediaStore.fetchFavoriteStatus(String(mediaId));
    } catch (error) {
      console.error('加载收藏状态失败:', error);
      isFavorite.value = false;
    }
  };

  const loadMedia = async () => {
    const mediaId = parseInt(route.params.id);
    loading.value = true;
    hasAppliedResumeTime.value = false;
    lastSavedTime.value = 0;
    favoriteMessage.value = '';

    try {
      const mediaData = await mediaStore.fetchMediaDetail(mediaId);
      media.value = mediaData;

      if (mediaData.playSources && mediaData.playSources.length > 0) {
        currentPlaySource.value = mediaData.playSources[0];
      }

      await syncFavoriteStatus(mediaId);
      await mediaStore.incrementViewCount(String(mediaId));
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const getResumeTimeFromQuery = () => {
    const rawValue = Array.isArray(route.query.time) ? route.query.time[0] : route.query.time;
    const parsed = Number(rawValue);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const applyResumeTime = () => {
    if (hasAppliedResumeTime.value || !videoPlayer.value) {
      return;
    }

    const resumeTime = getResumeTimeFromQuery();
    if (resumeTime <= 0) {
      return;
    }

    const duration = Number(videoPlayer.value.duration || media.value?.duration || 0);
    const targetTime = duration > 0 ? Math.min(resumeTime, Math.max(duration - 1, 0)) : resumeTime;

    videoPlayer.value.currentTime = targetTime;
    lastSavedTime.value = targetTime;
    hasAppliedResumeTime.value = true;
  };

  const saveWatchProgress = async (force = false) => {
    if (!authStore.token || !media.value || !videoPlayer.value) {
      return;
    }

    const currentTime = Math.floor(videoPlayer.value.currentTime || 0);
    const duration = Math.floor(videoPlayer.value.duration || media.value.duration || 0);

    if (!force && currentTime - lastSavedTime.value < 15) {
      return;
    }

    if (currentTime <= 0) {
      return;
    }

    try {
      await watchHistoryApi.recordProgress({
        mediaResourceId: media.value.id,
        currentTime,
        duration,
        isCompleted: duration > 0 && currentTime >= duration - 5,
      });
      lastSavedTime.value = currentTime;
    } catch (error) {
      console.error('保存观看进度失败:', error);
    }
  };

  const selectPlaySource = playSource => {
    currentPlaySource.value = playSource;
    if (videoPlayer.value) {
      videoPlayer.value.load();
    }
  };

  const selectEpisode = episode => {
    currentEpisode.value = episode;
    const episodePlaySources = media.value.playSources.filter(ps => ps.episodeNumber === episode);
    if (episodePlaySources.length > 0) {
      selectPlaySource(episodePlaySources[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoPlayer.value) {
      void saveWatchProgress();
    }
  };

  const handleVideoEnded = () => {
    void saveWatchProgress(true);
  };

  const getVideoType = url => {
    const ext = url.split('.').pop().toLowerCase();
    switch (ext) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      default:
        return 'video/mp4';
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatRating = rating => {
    return typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : '—';
  };

  const formatPreferenceLabel = value => {
    const labelMap = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };

    return labelMap[value] || value;
  };

  const goToFavorites = () => {
    router.push({
      name: 'favorites',
      query: { highlight: String(media.value.id) },
    });
  };

  const toggleFavorite = async () => {
    if (!media.value) {
      return;
    }

    if (!authStore.token) {
      notifyInfo('登录后可收藏', '登录后即可将内容加入收藏夹。');
      void router.push('/login');
      return;
    }

    favoriteLoading.value = true;
    favoriteMessage.value = '';

    try {
      const nextState = await mediaStore.toggleFavorite(String(media.value.id), isFavorite.value);
      isFavorite.value = nextState;
      favoriteMessage.value = nextState
        ? `已将《${media.value.title}》加入收藏`
        : `已将《${media.value.title}》移出收藏`;

      if (nextState) {
        notifySuccess('收藏已更新', `已将《${media.value.title}》加入收藏，可前往“我的收藏”继续查看。`);
      } else {
        notifyInfo('收藏已更新', `已将《${media.value.title}》从收藏中移除。`);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      notifyError('收藏操作失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      favoriteLoading.value = false;
    }
  };

  const queueDownloadTask = () => {
    if (!currentDownloadUrl.value || !media.value) {
      downloadMessage.value = '当前资源暂无可用下载链接';
      return;
    }

    const task = downloadsStore.enqueueTask({
      url: currentDownloadUrl.value,
      fileName: `${media.value.title}${currentPlaySource.value?.sourceName ? ` · ${currentPlaySource.value.sourceName}` : ''}`,
      sourceLabel: currentPlaySource.value?.sourceName || media.value.source || '播放页',
      mediaResourceId: media.value.id,
      metadata: {
        title: media.value.title,
        description: media.value.description,
        duration: media.value.duration,
      },
    });

    downloadsStore.startTask(task.id);
    downloadMessage.value = `已加入下载任务：${task.fileName}`;
  };

  let saveInterval;
  onMounted(() => {
    void loadMedia();

    saveInterval = setInterval(() => {
      if (videoPlayer.value && videoPlayer.value.currentTime > 0) {
        void saveWatchProgress(true);
      }
    }, 30000);
  });

  onUnmounted(() => {
    void saveWatchProgress(true);

    if (saveInterval) {
      clearInterval(saveInterval);
    }
  });

  const togglePlay = () => {
    if (videoPlayer.value) {
      if (videoPlayer.value.paused) {
        void videoPlayer.value.play();
        isPlaying.value = true;
      } else {
        videoPlayer.value.pause();
        isPlaying.value = false;
      }
    }
  };

  const handleVolumeToggle = () => {
    if (!videoPlayer.value) {
      return;
    }

    videoPlayer.value.muted = !videoPlayer.value.muted;
  };

  const toggleFullscreen = async () => {
    if (!videoPlayer.value) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await videoPlayer.value.requestFullscreen?.();
  };
</script>
