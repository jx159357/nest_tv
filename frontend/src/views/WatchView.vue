<template>
  <div class="watch-view">
    <nav class="watch-nav">
      <div class="nav-content">
        <router-link to="/" class="nav-brand">Nest TV</router-link>
        <button class="nav-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
      </div>
    </nav>

    <main class="watch-main">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="media" class="watch-layout">
        <section class="player-section">
          <div
            ref="playerWrapperRef"
            class="player-wrapper"
            :class="{ 'player-wrapper--web-fullscreen': isWebFullscreen }"
          >
            <ArtPlayerWrapper
              v-if="currentPlaySource"
              :src="videoSrc"
              :title="media.title"
              :poster="media.poster"
              :autoplay="false"
              :current-time="resumeTime"
              @ready="onPlayerReady"
              @timeupdate="onTimeUpdate"
              @play="onPlayerPlay"
              @pause="onPlayerPause"
              @seeked="onPlayerSeeked"
              @ended="onVideoEnded"
              @error="onPlayerError"
              @metrics="onPlaybackMetrics"
            />

            <DanmakuPlayer
              v-if="currentPlaySource"
              :video-id="media.id.toString()"
              :media-resource-id="media.id"
              :show-controls="true"
              :max-danmaku-count="150"
              class="danmaku-overlay"
            />

            <button class="custom-fullscreen-btn" title="全屏（含弹幕）" @click="toggleFullscreen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                />
              </svg>
            </button>

            <button
              class="skip-settings-btn"
              title="跳过片头/片尾"
              @click="showSkipSettings = !showSkipSettings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            <!-- 移动端手势控制 -->
            <PlayerGestureControl
              v-if="isMobile"
              :video-element="videoElement"
              :enabled="true"
              @seek="onGestureSeek"
              @volume-change="onGestureVolumeChange"
            />

            <!-- 断点续播提示 -->
            <Transition name="resume">
              <div v-if="showResumeTip" class="resume-tip">
                <span>上次观看到 {{ formatTime(resumeTime) }}</span>
                <button class="resume-btn" @click="resumeFromTip">继续播放</button>
                <button class="resume-btn resume-btn--skip" @click="showResumeTip = false">
                  从头播放
                </button>
              </div>
            </Transition>
          </div>

          <Transition name="slide-up">
            <div v-if="showSkipSettings" class="skip-settings-panel">
              <h3>跳过片头/片尾</h3>
              <p class="skip-settings-hint">设置后自动跳过，留空表示不跳过</p>
              <div class="skip-settings-row">
                <label>
                  <span>片头结束时间</span>
                  <div class="skip-input-group">
                    <input v-model.number="skipIntroEnd" type="number" min="0" placeholder="秒数" />
                    <button class="skip-set-btn" @click="setCurrentAsIntroEnd">当前时间</button>
                  </div>
                  <span v-if="skipIntroEnd > 0" class="skip-time-display">{{
                    formatTime(skipIntroEnd)
                  }}</span>
                </label>
              </div>
              <div class="skip-settings-row">
                <label>
                  <span>片尾开始时间</span>
                  <div class="skip-input-group">
                    <input
                      v-model.number="skipOutroStart"
                      type="number"
                      min="0"
                      placeholder="秒数"
                    />
                    <button class="skip-set-btn" @click="setCurrentAsOutroStart">当前时间</button>
                  </div>
                  <span v-if="skipOutroStart > 0" class="skip-time-display">{{
                    formatTime(skipOutroStart)
                  }}</span>
                </label>
              </div>
              <div class="skip-settings-actions">
                <button class="skip-save-btn" @click="saveSkipSettings">保存</button>
                <button class="skip-cancel-btn" @click="showSkipSettings = false">取消</button>
              </div>
            </div>
          </Transition>

          <div v-if="!currentPlaySource && !loading" class="no-source-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="no-source-error__icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="no-source-error__title">暂无可用播放线路</p>
            <p class="no-source-error__desc">当前视频没有可用的播放源，请尝试刷新</p>
            <button class="no-source-error__btn" type="button" @click="refreshCurrentMedia">
              刷新播放源
            </button>
          </div>

          <button
            class="source-panel-toggle"
            type="button"
            @click="showSourcePanel = !showSourcePanel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {{ showSourcePanel ? '收起播放源' : '播放源' }}
            <span v-if="currentPlaySource" class="source-panel-toggle__name">
              {{ currentPlaySource.sourceName || `源${currentPlaySource.id}` }}
            </span>
          </button>

          <div
            v-if="isMobile && showSourcePanel"
            class="source-panel-backdrop"
            @click="showSourcePanel = false"
          ></div>

          <div
            :class="[
              'play-source-panel',
              { 'play-source-panel--open': isMobile && showSourcePanel },
            ]"
          >
            <div class="panel-header">
              <h2>
                播放源
                <span
                  v-if="sourceFreshnessBadge"
                  :class="['freshness-badge', `freshness--${media?.sourceFreshness}`]"
                >
                  {{ sourceFreshnessBadge }}
                </span>
              </h2>
              <div class="panel-actions">
                <button
                  class="btn-test-all"
                  :disabled="isRefreshingSource"
                  @click="manualRefreshSource"
                >
                  {{ isRefreshingSource ? '刷新中...' : '刷新源' }}
                </button>
                <button class="btn-test-all" :disabled="isTestingAll" @click="testAllSources">
                  {{ isTestingAll ? '测试中...' : '测速' }}
                </button>
                <span v-if="currentPlaySource" class="current-source">
                  当前：{{ currentPlaySource.sourceName || `播放源 ${currentPlaySource.id}` }}
                </span>
              </div>
            </div>

            <div class="source-grid">
              <button
                v-for="playSource in media.playSources"
                :key="playSource.id"
                :class="[
                  'source-btn',
                  { active: currentPlaySource?.id === playSource.id },
                  getSourceBadgeClass(playSource.id),
                ]"
                @click="
                  selectPlaySource(playSource);
                  showSourcePanel = false;
                "
              >
                <div class="source-info">
                  <div class="source-name">
                    {{ playSource.sourceName || `播放源 ${playSource.id}` }}
                  </div>
                  <div class="source-meta">
                    {{ playSource.resolution }} · {{ playSource.format }}
                    <template v-if="getResolutionDisplay(playSource.id)">
                      · {{ getResolutionDisplay(playSource.id) }}
                    </template>
                  </div>
                </div>
                <div class="source-right">
                  <span
                    v-if="getSpeedDisplay(playSource.id)"
                    class="speed-badge"
                    :class="getSourceBadgeClass(playSource.id)"
                  >
                    {{ getSpeedDisplay(playSource.id) }}
                  </span>
                  <div class="source-type">
                    {{
                      playSource.type === 'magnet'
                        ? '磁力'
                        : playSource.type === 'online'
                          ? '在线'
                          : '本地'
                    }}
                  </div>
                </div>
              </button>
            </div>

            <div v-if="isMagnetSource" class="magnet-notice">
              磁力链接加载中，请稍候（首次连接可能需要 10-30 秒）...
            </div>
          </div>

          <section class="download-section">
            <div class="section-header">
              <div>
                <h2>下载任务</h2>
                <p>当前资源检测到 {{ availableDownloadUrls.length }} 个可用下载链接</p>
              </div>
              <router-link to="/downloads" class="btn-outline">查看列表</router-link>
            </div>

            <div class="download-actions">
              <button
                class="btn-primary"
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
                class="btn-outline"
              >
                打开原始链接
              </a>
            </div>

            <p v-if="downloadMessage" class="msg-success">{{ downloadMessage }}</p>
            <p v-else-if="!currentDownloadUrl" class="msg-warning">
              当前播放源和媒体详情里都没有可用下载链接。
            </p>
          </section>
        </section>

        <aside class="info-sidebar">
          <WatchRoom
            v-if="media"
            ref="watchRoomRef"
            :media-id="media.id"
            :media-title="media.title"
            @sync="onRoomSync"
          />

          <section class="info-card">
            <h1 class="media-title">{{ media.title }}</h1>

            <div class="meta-list">
              <div class="meta-item">
                <span class="meta-label">类型</span>
                <span class="meta-value">{{ formatType(media.type) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">评分</span>
                <span class="meta-value rating">{{ formatRating(media.rating) }}/10</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">观看次数</span>
                <span class="meta-value">{{ media.viewCount }}</span>
              </div>
              <div v-if="media.director" class="meta-item">
                <span class="meta-label">导演</span>
                <span class="meta-value">{{ media.director }}</span>
              </div>
              <div v-if="media.actors" class="meta-item">
                <span class="meta-label">主演</span>
                <span class="meta-value">{{ media.actors }}</span>
              </div>
              <div v-if="media.releaseDate" class="meta-item">
                <span class="meta-label">上映时间</span>
                <span class="meta-value">{{ formatDate(media.releaseDate) }}</span>
              </div>
            </div>

            <div class="action-buttons">
              <button
                :class="['btn-favorite', { active: isFavorite }]"
                :disabled="favoriteLoading"
                @click="toggleFavorite"
              >
                {{ favoriteLoading ? '处理中...' : isFavorite ? '已收藏' : '加入收藏' }}
              </button>
              <button v-if="favoriteMessage && isFavorite" class="btn-link" @click="goToFavorites">
                查看收藏
              </button>
            </div>
            <p v-if="favoriteMessage" class="msg-info">{{ favoriteMessage }}</p>
          </section>

          <section v-if="media.episodeCount" class="info-card">
            <h2>
              剧集选择 <span class="episode-total">共 {{ media.episodeCount }} 集</span>
            </h2>
            <div class="episode-grid">
              <button
                v-for="episode in episodePagination.end - episodePagination.start + 1"
                :key="episodePagination.start + episode - 1"
                :class="[
                  'episode-btn',
                  { active: currentEpisode === episodePagination.start + episode - 1 },
                ]"
                @click="selectEpisode(episodePagination.start + episode - 1)"
              >
                {{ episodePagination.start + episode - 1 }}
              </button>
            </div>
            <div v-if="episodePagination.show" class="episode-pagination">
              <button :disabled="episodePage <= 1" class="episode-page-btn" @click="episodePage--">
                上一页
              </button>
              <span class="episode-page-info"
                >{{ episodePage }} / {{ episodePagination.totalPages }}</span
              >
              <button
                :disabled="episodePage >= episodePagination.totalPages"
                class="episode-page-btn"
                @click="episodePage++"
              >
                下一页
              </button>
            </div>
          </section>

          <section v-if="media.description" class="info-card">
            <h2>剧情简介</h2>
            <p class="description">{{ media.description }}</p>
          </section>

          <section class="info-card shortcuts-card">
            <h2>快捷键</h2>
            <div class="shortcuts-list">
              <div class="shortcut-item">
                <kbd>Space</kbd>
                <span>播放/暂停</span>
              </div>
              <div class="shortcut-item">
                <kbd>F</kbd>
                <span>全屏</span>
              </div>
              <div class="shortcut-item">
                <kbd>M</kbd>
                <span>静音</span>
              </div>
              <div class="shortcut-item">
                <kbd>←</kbd>
                <span>快退 10 秒</span>
              </div>
              <div class="shortcut-item">
                <kbd>→</kbd>
                <span>快进 10 秒</span>
              </div>
              <div class="shortcut-item">
                <kbd>↑</kbd>
                <span>增加音量</span>
              </div>
              <div class="shortcut-item">
                <kbd>↓</kbd>
                <span>减少音量</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div v-else class="error-state">视频加载失败</div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import { useAuthStore } from '@/stores/auth';
  import { useDownloadsStore } from '@/stores/downloads';
  import { watchHistoryApi } from '@/api/watchHistory';
  import { mediaApi } from '@/api/media';
  import { notifyError, notifyInfo, notifySuccess } from '@/composables/useModal';
  import ArtPlayerWrapper from '@/components/ArtPlayerWrapper.vue';
  import type { PlaybackMetrics } from '@/components/ArtPlayerWrapper.vue';
  import { batchTestSources, getSourceScore, type SourceTestResult } from '@/utils/source-test';
  import { playSourceApi } from '@/api/playSource';
  import { buildApiUrl } from '@/api/url';
  import { log } from '@/utils/logger';
  import type { MediaResource, PlaySource, PlayDetailResponse } from '@/types/media';

  const DanmakuPlayer = defineAsyncComponent(() =>
    import('@/components/DanmakuPlayer.vue').then(module => module.default),
  );
  const WatchRoom = defineAsyncComponent(() =>
    import('@/components/WatchRoom.vue').then(module => module.default),
  );
  const PlayerGestureControl = defineAsyncComponent(() =>
    import('@/components/PlayerGestureControl.vue').then(module => module.default),
  );

  interface WatchRoomExpose {
    sendSync: (currentTime: number, playing: boolean) => void;
  }

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();
  const authStore = useAuthStore();
  const downloadsStore = useDownloadsStore();

  const media = ref<MediaResource | null>(null);
  const currentPlaySource = ref<PlaySource | null>(null);
  const currentEpisode = ref(1);
  const playerWrapperRef = ref<HTMLElement | null>(null);
  const watchRoomRef = ref<WatchRoomExpose | null>(null);
  const currentPlayer = ref<any>(null);
  const episodePage = ref(1);
  const EPISODES_PER_PAGE = 50;
  const loading = ref(true);
  const resumeTime = ref(0);
  const lastSavedTime = ref(0);
  const downloadMessage = ref('');
  const isFavorite = ref(false);
  const favoriteLoading = ref(false);
  const favoriteMessage = ref('');

  const testResults = ref<Map<number, SourceTestResult>>(new Map());
  const failedPlaySourceIds = ref<Set<number>>(new Set());
  const mediaRefreshAttempted = ref(false);
  const cmsResolveAttempted = ref(false);
  const isTestingAll = ref(false);
  const isRefreshingSource = ref(false);
  const videoElement = ref<HTMLVideoElement | null>(null);
  const showResumeTip = ref(false);
  const isMobile = ref(false);
  const showSourcePanel = ref(false);
  const isWebFullscreen = ref(false);
  const isApplyingRoomSync = ref(false);
  const lastRoomSyncSentAt = ref(0);
  const macCmsEpisodes = ref<Array<{ episode: string; url: string; sourceName: string }>>([]);
  const showSkipSettings = ref(false);
  const skipIntroEnd = ref(0);
  const skipOutroStart = ref(0);
  let previousBodyOverflow = '';
  let skipNotificationShown = false;

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window;
  };

  const onGestureSeek = (time: number) => {
    if (videoElement.value) {
      videoElement.value.currentTime = time;
    }
  };

  const onGestureVolumeChange = (volume: number) => {
    if (videoElement.value) {
      videoElement.value.volume = volume;
    }
  };

  const resumeFromTip = () => {
    showResumeTip.value = false;
  };

  const getSkipStorageKey = (mediaId: number) => `skip-settings-${mediaId}`;

  const loadSkipSettings = (mediaId: number) => {
    try {
      const saved = localStorage.getItem(getSkipStorageKey(mediaId));
      if (saved) {
        const parsed = JSON.parse(saved) as { introEnd?: number; outroStart?: number };
        skipIntroEnd.value = parsed.introEnd ?? 0;
        skipOutroStart.value = parsed.outroStart ?? 0;
      } else {
        skipIntroEnd.value = 0;
        skipOutroStart.value = 0;
      }
    } catch {
      skipIntroEnd.value = 0;
      skipOutroStart.value = 0;
    }
    skipNotificationShown = false;
  };

  const saveSkipSettings = () => {
    const mediaId = media.value?.id;
    if (!mediaId) return;
    localStorage.setItem(
      getSkipStorageKey(mediaId),
      JSON.stringify({ introEnd: skipIntroEnd.value, outroStart: skipOutroStart.value }),
    );
    showSkipSettings.value = false;
    notifySuccess('跳过设置已保存', '片头/片尾设置已更新');
  };

  const setCurrentAsIntroEnd = () => {
    if (currentPlayer.value) {
      skipIntroEnd.value = Math.floor(currentPlayer.value.currentTime);
    }
  };

  const setCurrentAsOutroStart = () => {
    if (currentPlayer.value) {
      skipOutroStart.value = Math.floor(currentPlayer.value.currentTime);
    }
  };

  const getSpeedDisplay = (sourceId: number) => {
    const r = testResults.value.get(sourceId);
    if (!r) return null;
    if (r.status === 'testing') return '测试中...';
    if (r.status === 'error') return r.error || '超时';
    if (r.speed > 0) return `${r.speed}ms`;
    return null;
  };

  const getResolutionDisplay = (sourceId: number) => {
    const r = testResults.value.get(sourceId);
    return r?.resolution || null;
  };

  const getSourceBadgeClass = (sourceId: number) => {
    const r = testResults.value.get(sourceId);
    if (!r || r.status !== 'success') return '';
    const score = getSourceScore(r.speed, r.resolution);
    if (score >= 80) return 'badge--fast';
    if (score >= 50) return 'badge--medium';
    return 'badge--slow';
  };

  const testAllSources = async () => {
    if (!media.value?.playSources?.length || isTestingAll.value) return;
    isTestingAll.value = true;

    const sources = media.value.playSources
      .filter((ps: PlaySource) => ps.url && !ps.url.startsWith('magnet:'))
      .map((ps: PlaySource) => ({ id: ps.id, url: ps.url }));

    sources.forEach((s: { id: number }) => {
      testResults.value.set(s.id, { id: s.id, speed: 0, resolution: null, status: 'testing' });
    });

    await batchTestSources(sources, 3, result => {
      testResults.value.set(result.id, result);
    });

    isTestingAll.value = false;
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  const isMagnetSource = computed(
    () =>
      currentPlaySource.value?.type === 'magnet' ||
      currentPlaySource.value?.url?.startsWith('magnet:'),
  );

  const sourceFreshnessBadge = computed(() => {
    switch (media.value?.sourceFreshness) {
      case 'fresh':
        return null;
      case 'stale':
        return '线路可能过期';
      case 'refreshing':
        return '正在刷新线路';
      case 'empty':
        return '暂无线路';
      default:
        return null;
    }
  });

  const episodePagination = computed(() => {
    const total = media.value?.episodeCount || 0;
    if (total <= EPISODES_PER_PAGE) {
      return { show: false, total, totalPages: 1, start: 1, end: total };
    }
    const totalPages = Math.ceil(total / EPISODES_PER_PAGE);
    const start = (episodePage.value - 1) * EPISODES_PER_PAGE + 1;
    const end = Math.min(episodePage.value * EPISODES_PER_PAGE, total);
    return { show: true, total, totalPages, start, end };
  });

  const videoSrc = computed(() => {
    const url = currentPlaySource.value?.url;
    if (!url) return '';
    if (!url.startsWith('magnet:')) return url;

    const hashMatch = url.match(/btih:([a-fA-F0-9]{32,40})/i);
    const infoHash = hashMatch ? hashMatch[1].toLowerCase() : '';
    if (!infoHash) return '';

    const token = authStore.token || localStorage.getItem('token') || '';
    return buildApiUrl(
      `/torrent/stream/${infoHash}?magnet=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`,
    );
  });

  const syncFavoriteStatus = async (mediaId: number) => {
    if (!authStore.token) {
      isFavorite.value = false;
      return;
    }

    try {
      isFavorite.value = await mediaStore.fetchFavoriteStatus(String(mediaId));
    } catch {
      isFavorite.value = false;
    }
  };

  const selectBestInitialSource = (sources: PlaySource[]): PlaySource => {
    const candidates = sources.filter(s => s.url && s.isActive !== false && s.status !== 'error');
    if (candidates.length === 0) return sources[0];

    const activeFresh = candidates.filter(s => s.status === 'active' && s.lastCheckedAt);
    if (activeFresh.length > 0) {
      activeFresh.sort(
        (a, b) => new Date(b.lastCheckedAt!).getTime() - new Date(a.lastCheckedAt!).getTime(),
      );
      return activeFresh[0];
    }

    return candidates[0];
  };

  const inferSourceFormat = (url: string): string => {
    const normalized = url.toLowerCase();
    if (normalized.includes('.m3u8') || normalized.includes('m3u8')) return 'm3u8';
    if (normalized.includes('.mp4')) return 'mp4';
    if (normalized.startsWith('magnet:')) return 'magnet';
    return 'online';
  };

  const buildDownloadUrlPlaySources = (mediaData: MediaResource): PlaySource[] => {
    const urls = Array.isArray(mediaData.downloadUrls)
      ? mediaData.downloadUrls.filter(Boolean)
      : [];

    return urls.map((url, index) => {
      const format = inferSourceFormat(url);
      return {
        id: -(index + 1),
        url,
        sourceName: `下载地址 ${index + 1}`,
        type: format === 'magnet' ? 'magnet' : format === 'm3u8' ? 'stream' : 'online',
        status: 'active',
        resolution: mediaData.quality,
        format,
        priority: index + 1,
        isAds: false,
        isActive: true,
        playCount: 0,
        downloadUrls: [url],
        episodeNumber: currentEpisode.value,
        mediaResourceId: mediaData.id,
        createdAt: mediaData.createdAt,
        updatedAt: mediaData.updatedAt,
      } as unknown as PlaySource;
    });
  };

  const resolveFromMacCms = async (): Promise<PlaySource | null> => {
    if (!media.value?.title) return null;
    isRefreshingSource.value = true;
    try {
      const result = await playSourceApi.resolveFromCms(
        media.value.title,
        currentEpisode.value > 1 ? currentEpisode.value : undefined,
      );
      if (result.episodes && result.episodes.length > 0) {
        macCmsEpisodes.value = result.episodes;
        const targetEpisode = currentEpisode.value;
        const matchedEp = result.episodes.find(e => {
          const match = e.episode.match(/(\d+)/);
          return match ? parseInt(match[1], 10) === targetEpisode : false;
        });
        const ep = matchedEp || result.episodes[0];
        return {
          id: Date.now(),
          url: ep.url,
          sourceName: ep.sourceName || 'MacCMS实时解析',
          type: 'online',
          status: 'active',
          isActive: true,
          episodeNumber: targetEpisode,
        } as unknown as PlaySource;
      }
    } catch (error) {
      log.error('WatchView', 'MacCMS 实时解析失败:', error);
    } finally {
      isRefreshingSource.value = false;
    }
    return null;
  };

  const updateSourceInList = (updated: PlaySource) => {
    if (!media.value?.playSources) return;
    const idx = media.value.playSources.findIndex(s => s.id === updated.id);
    if (idx >= 0) {
      media.value.playSources[idx] = updated;
    }
  };

  const manualRefreshSource = async () => {
    if (!media.value?.id) return;
    failedPlaySourceIds.value.clear();
    mediaRefreshAttempted.value = false;
    cmsResolveAttempted.value = false;
    isRefreshingSource.value = true;
    const canPersistSource = Boolean(authStore.token || localStorage.getItem('token'));

    try {
      if (canPersistSource && currentPlaySource.value?.id && currentPlaySource.value.id > 0) {
        try {
          const singleResult = await playSourceApi.refreshPlaySource(
            String(currentPlaySource.value.id),
          );
          if (singleResult.refreshed && singleResult.playSource) {
            currentPlaySource.value = singleResult.playSource as unknown as PlaySource;
            updateSourceInList(singleResult.playSource as unknown as PlaySource);
            notifySuccess('播放源已刷新', singleResult.message || '已从原始页面获取新地址');
            return;
          }
        } catch (e) {
          log.warn('WatchView', '单条刷新失败，尝试媒体级刷新:', e);
        }
      }

      if (canPersistSource) {
        const result = await playSourceApi.refreshMediaPlaySources(String(media.value.id));
        if (result.best) {
          media.value.playSources = result.valid;
          currentPlaySource.value = result.best as unknown as PlaySource;
          notifySuccess(
            '播放源已刷新',
            `已刷新 ${result.refreshed} 个源，${result.valid.length} 个可用`,
          );
          return;
        }
      }
    } catch (error) {
      log.error('WatchView', '刷新失败:', error);
    } finally {
      isRefreshingSource.value = false;
    }

    const cmsSource = await resolveFromMacCms();
    if (cmsSource) {
      if (!canPersistSource) {
        currentPlaySource.value = cmsSource;
        if (media.value.playSources) {
          media.value.playSources.push(cmsSource);
        }
        notifySuccess('播放源已刷新', `已通过实时解析切换到 ${cmsSource.sourceName || '解析源'}`);
        return;
      }

      try {
        const saved = await playSourceApi.createPlaySource({
          mediaResourceId: media.value.id,
          type: 'online',
          url: cmsSource.url,
          sourceName: cmsSource.sourceName,
          episodeNumber: currentEpisode.value,
          priority: 1,
          isActive: true,
        });
        currentPlaySource.value = saved as unknown as PlaySource;
        if (media.value.playSources) {
          media.value.playSources.push(saved as unknown as PlaySource);
        }
        notifySuccess('播放源已刷新', `已通过实时解析获取新源并入库`);
        return;
      } catch (error) {
        log.error('WatchView', 'MacCMS 源入库失败:', error);
        currentPlaySource.value = cmsSource;
        notifySuccess('播放源已刷新', `已通过实时解析切换到 ${cmsSource.sourceName || '解析源'}`);
        return;
      }
    }

    notifyError('刷新失败', '未能找到可用的播放源。');
  };

  const refreshCurrentMedia = async () => {
    if (!media.value) return;
    try {
      const result = await playSourceApi.refreshMediaPlaySources(String(media.value.id));
      if (result.best) {
        media.value.playSources = result.valid;
        currentPlaySource.value = result.best as unknown as PlaySource;
        notifySuccess('播放源已刷新', `${result.valid.length} 个可用`);
      } else {
        await loadMedia();
      }
    } catch {
      await loadMedia();
    }
  };

  const onPlaybackMetrics = (metrics: PlaybackMetrics) => {
    const sourceId = currentPlaySource.value?.id;
    if (!sourceId) return;
    playSourceApi.reportMetrics(sourceId, metrics).catch(() => {});
  };

  const convertSourceGroupsToPlaySources = (playDetail: PlayDetailResponse): PlaySource[] => {
    const sources: PlaySource[] = [];
    for (const group of playDetail.sourceGroups) {
      for (const ep of group.episodes) {
        sources.push({
          id: ep.id,
          url: ep.url,
          sourceName: group.name,
          name: ep.name,
          episodeNumber: ep.episodeNumber,
          resolution: ep.resolution,
          format: ep.format,
          status: (ep.status as any) || 'active',
          isAds: ep.isAds ?? false,
          isActive: true,
          type: 'online' as any,
          priority: 1,
          playCount: 0,
          mediaResourceId: playDetail.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as PlaySource);
      }
    }
    return sources;
  };

  const loadMedia = async () => {
    const mediaId = parseInt(route.params.id as string);
    loading.value = true;
    lastSavedTime.value = 0;
    favoriteMessage.value = '';

    try {
      const playDetail = await mediaApi.getPlayDetail(String(mediaId));
      const playSources = convertSourceGroupsToPlaySources(playDetail);

      const mediaData: MediaResource = {
        id: playDetail.id,
        title: playDetail.title,
        description: playDetail.description,
        type: playDetail.type as any,
        poster: playDetail.poster,
        backdrop: playDetail.backdrop,
        rating: playDetail.rating,
        genres: playDetail.genres,
        quality: playDetail.quality as any,
        releaseDate: playDetail.releaseDate ? new Date(playDetail.releaseDate) : undefined,
        episodeCount: playDetail.episodeCount,
        downloadUrls: playDetail.downloadUrls,
        playSources,
        sourceFreshness: playDetail.sourceFreshness,
        viewCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as MediaResource;

      media.value = mediaData;
      failedPlaySourceIds.value = new Set();
      mediaRefreshAttempted.value = false;
      cmsResolveAttempted.value = false;

      if (playDetail.watchHistory) {
        resumeTime.value = playDetail.watchHistory.currentTime || 0;
        if (playDetail.watchHistory.episodeNumber) {
          currentEpisode.value = playDetail.watchHistory.episodeNumber;
        }
      }

      if (playSources.length > 0) {
        currentPlaySource.value = selectBestInitialSource(playSources);
      } else {
        const cmsSource = await resolveFromMacCms();
        if (cmsSource) {
          mediaData.playSources = [cmsSource];
          currentPlaySource.value = cmsSource;
        } else {
          const fallbackPlaySources = buildDownloadUrlPlaySources(mediaData);
          mediaData.playSources = fallbackPlaySources;
          if (fallbackPlaySources.length > 0) {
            currentPlaySource.value = selectBestInitialSource(fallbackPlaySources);
          }
        }
      }

      if (macCmsEpisodes.value.length > 0 && !mediaData.episodeCount) {
        mediaData.episodeCount = macCmsEpisodes.value.length;
      }

      if (resumeTime.value > 0) {
        showResumeTip.value = true;
      }

      loadSkipSettings(mediaId);

      await syncFavoriteStatus(mediaId);
      await mediaStore.incrementViewCount(String(mediaId));
    } catch (error) {
      log.error('WatchView', '加载视频失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const onPlayerReady = (player: any) => {
    currentPlayer.value = player;
    if (player && player.video) {
      videoElement.value = player.video;
    }
  };

  const sendRoomSync = (currentTime: number, playing: boolean, force = false) => {
    if (isApplyingRoomSync.value) return;
    const now = Date.now();
    if (!force && now - lastRoomSyncSentAt.value < 1000) return;
    lastRoomSyncSentAt.value = now;
    watchRoomRef.value?.sendSync(Math.max(0, currentTime || 0), playing);
  };

  const onPlayerPlay = (currentTime: number) => {
    sendRoomSync(currentTime, true, true);
  };

  const onPlayerPause = (currentTime: number) => {
    sendRoomSync(currentTime, false, true);
  };

  const onPlayerSeeked = (currentTime: number) => {
    const video = videoElement.value;
    sendRoomSync(currentTime, Boolean(video && !video.paused), true);
  };

  const onTimeUpdate = (currentTime: number, duration: number) => {
    void saveWatchProgress(currentTime, false, duration);

    if (skipIntroEnd.value > 0 && currentTime < skipIntroEnd.value && currentTime > 0) {
      if (!skipNotificationShown) {
        skipNotificationShown = true;
        notifyInfo('跳过片头', `已跳转至 ${formatTime(skipIntroEnd.value)}`);
      }
      if (currentPlayer.value) {
        (currentPlayer.value as any).currentTime = skipIntroEnd.value;
      }
    }

    if (skipOutroStart.value > 0 && duration > 0 && currentTime >= skipOutroStart.value) {
      if (!skipNotificationShown) {
        skipNotificationShown = true;
        notifyInfo('跳过片尾', '已自动跳过片尾');
      }
      if (currentPlayer.value) {
        (currentPlayer.value as any).currentTime = duration;
      }
    }
  };

  const onVideoEnded = () => {
    const duration = media.value?.duration || 0;
    void saveWatchProgress(duration, true, duration);
  };

  const classifyPlayerError = (error: string): { category: string; userMessage: string } => {
    const lower = error.toLowerCase();
    if (
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('fetch') ||
      lower.includes('连接') ||
      lower.includes('超时')
    ) {
      return { category: 'network', userMessage: '网络不佳，正在尝试其他线路...' };
    }
    if (
      lower.includes('403') ||
      lower.includes('404') ||
      lower.includes('410') ||
      lower.includes('forbidden') ||
      lower.includes('expired') ||
      lower.includes('过期')
    ) {
      return { category: 'source', userMessage: '播放地址已失效，正在尝试其他线路...' };
    }
    if (
      lower.includes('format') ||
      lower.includes('decode') ||
      lower.includes('codec') ||
      lower.includes('不支持')
    ) {
      return { category: 'format', userMessage: '视频格式不支持，正在切换线路...' };
    }
    if (
      lower.includes('geo') ||
      lower.includes('region') ||
      lower.includes('地区') ||
      lower.includes('限制')
    ) {
      return { category: 'geo', userMessage: '该播放源有地区限制，正在切换线路...' };
    }
    return { category: 'unknown', userMessage: '播放失败，正在尝试其他线路...' };
  };

  const onPlayerError = async (error: string) => {
    const { category, userMessage } = classifyPlayerError(error);
    log.error('WatchView', `播放器错误 [${category}]:`, error);
    notifyInfo('播放异常', userMessage);
    const failedSource = currentPlaySource.value;
    if (!failedSource || !media.value?.playSources?.length) return;

    failedPlaySourceIds.value.add(failedSource.id);
    const canPersistSource = Boolean(authStore.token || localStorage.getItem('token'));

    // Step 1: Try refreshing the current source from origin play page
    if (canPersistSource && failedSource.id > 0) {
      try {
        const singleResult = await playSourceApi.refreshPlaySource(String(failedSource.id));
        if (singleResult.refreshed && singleResult.playSource) {
          currentPlaySource.value = singleResult.playSource as unknown as PlaySource;
          updateSourceInList(singleResult.playSource as unknown as PlaySource);
          notifyInfo('播放源已刷新', singleResult.message || '已从原始页面获取新地址');
          return;
        }
      } catch (e) {
        log.warn('WatchView', '单条刷新失败，尝试其他本地源:', e);
      }
    }

    // Step 2: Try other local sources
    const candidates = media.value.playSources.filter(source => {
      if (!source.url || failedPlaySourceIds.value.has(source.id)) return false;
      if (source.isActive === false || source.status === 'error') return false;
      return source.episodeNumber === failedSource.episodeNumber;
    });

    const nextSource =
      candidates.find(source => source.id !== failedSource.id) ||
      media.value.playSources.find(source => {
        if (!source.url || failedPlaySourceIds.value.has(source.id)) return false;
        if (source.isActive === false || source.status === 'error') return false;
        return source.id !== failedSource.id;
      });

    if (nextSource) {
      notifyInfo('播放源不可用', `已切换到 ${nextSource.sourceName || `播放源 ${nextSource.id}`}`);
      currentPlaySource.value = nextSource;
      return;
    }

    // Step 3: Media-level refresh
    if (canPersistSource && !mediaRefreshAttempted.value) {
      mediaRefreshAttempted.value = true;
      notifyInfo('本地播放源均不可用', '正在尝试媒体级刷新...');
      try {
        const result = await playSourceApi.refreshMediaPlaySources(String(media.value.id));
        if (result.best) {
          media.value.playSources = result.valid;
          currentPlaySource.value = result.best as unknown as PlaySource;
          notifyInfo(
            '已找到可用播放源',
            `已刷新并切换到 ${result.best.sourceName || `播放源 ${result.best.id}`}`,
          );
          return;
        }
      } catch (e) {
        log.error('WatchView', '媒体级刷新失败:', e);
      }
    }

    // Step 4: MacCMS resolve + persist
    if (cmsResolveAttempted.value) {
      const finalMessage =
        category === 'network'
          ? '网络不佳，所有线路均无法连接，请检查网络后重试。'
          : category === 'source'
            ? '所有播放地址均已失效，请尝试重新采集资源。'
            : '所有播放源均不可用，请尝试重新爬取资源。';
      notifyError('播放失败', finalMessage);
      return;
    }
    cmsResolveAttempted.value = true;
    notifyInfo('本地无可用源', '正在尝试实时解析播放地址...');
    const cmsSource = await resolveFromMacCms();
    if (cmsSource) {
      if (!canPersistSource) {
        currentPlaySource.value = cmsSource;
        if (media.value.playSources) {
          media.value.playSources.push(cmsSource);
        }
        notifyInfo('已解析到播放地址', `已切换到 ${cmsSource.sourceName || '实时解析源'}`);
        return;
      }

      try {
        const saved = await playSourceApi.createPlaySource({
          mediaResourceId: media.value.id,
          type: 'online',
          url: cmsSource.url,
          sourceName: cmsSource.sourceName,
          episodeNumber: currentEpisode.value,
          priority: 1,
          isActive: true,
        });
        currentPlaySource.value = saved as unknown as PlaySource;
        if (media.value.playSources) {
          media.value.playSources.push(saved as unknown as PlaySource);
        }
        notifyInfo('已解析到播放地址', `已通过实时解析获取新源并入库`);
        return;
      } catch (saveError) {
        log.error('WatchView', 'MacCMS 源入库失败:', saveError);
        currentPlaySource.value = cmsSource;
        notifyInfo('已解析到播放地址', `已切换到 ${cmsSource.sourceName || '实时解析源'}`);
        return;
      }
    }

    notifyError('播放失败', '所有播放源均不可用，请尝试重新爬取资源。');
  };

  const enterWebFullscreen = () => {
    if (isWebFullscreen.value) return;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    isWebFullscreen.value = true;
  };

  const exitWebFullscreen = () => {
    if (!isWebFullscreen.value) return;
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = '';
    isWebFullscreen.value = false;
  };

  const handleFullscreenChange = () => {
    if (document.fullscreenElement) {
      exitWebFullscreen();
    }
  };

  const handleFullscreenKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isWebFullscreen.value) {
      exitWebFullscreen();
    }
  };

  const toggleFullscreen = async () => {
    const wrapper = playerWrapperRef.value;
    if (!wrapper) return;

    if (isWebFullscreen.value) {
      exitWebFullscreen();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }

    try {
      await wrapper.requestFullscreen();
    } catch {
      enterWebFullscreen();
    }
  };

  const onRoomSync = (currentTime: number, playing: boolean) => {
    resumeTime.value = currentTime;
    const player = currentPlayer.value;
    if (!player) return;

    isApplyingRoomSync.value = true;
    try {
      player.currentTime = Math.max(0, currentTime || 0);
      if (playing) {
        void player.play?.();
      } else {
        player.pause?.();
      }
    } finally {
      window.setTimeout(() => {
        isApplyingRoomSync.value = false;
      }, 500);
    }
  };

  const saveWatchProgress = async (currentTime: number, force = false, playerDuration?: number) => {
    if (!authStore.token || !media.value) return;

    const duration = playerDuration || media.value.duration || 0;

    if (!force && currentTime - lastSavedTime.value < 15) return;
    if (!force && currentTime <= 0) return;

    try {
      await watchHistoryApi.recordProgress({
        mediaResourceId: media.value.id,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        isCompleted: duration > 0 && currentTime >= duration - 5,
      });
      lastSavedTime.value = currentTime;
    } catch (error) {
      log.error('WatchView', '保存观看进度失败:', error);
    }
  };

  const selectPlaySource = (playSource: any) => {
    failedPlaySourceIds.value.delete(playSource.id);
    currentPlaySource.value = playSource;
  };

  const selectEpisode = async (episode: number) => {
    currentEpisode.value = episode;
    resumeTime.value = 0;
    failedPlaySourceIds.value.clear();
    mediaRefreshAttempted.value = false;
    cmsResolveAttempted.value = false;
    const episodePlaySources = media.value?.playSources?.filter(
      (ps: any) => ps.episodeNumber === episode,
    );
    if (episodePlaySources && episodePlaySources.length > 0) {
      selectPlaySource(episodePlaySources[0]);
      return;
    }

    const cmsEp = macCmsEpisodes.value.find(e => {
      const match = e.episode.match(/(\d+)/);
      return match ? parseInt(match[1], 10) === episode : false;
    });
    if (cmsEp) {
      const source = {
        id: Date.now(),
        url: cmsEp.url,
        sourceName: cmsEp.sourceName || 'MacCMS实时解析',
        type: 'online',
        status: 'active',
        isActive: true,
        episodeNumber: episode,
      } as unknown as PlaySource;
      selectPlaySource(source);
      return;
    }

    if (media.value?.title) {
      const cmsSource = await resolveFromMacCms();
      if (cmsSource) {
        selectPlaySource(cmsSource);
      }
    }
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };
    return map[type] || type;
  };

  const formatRating = (rating: number) => {
    return typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : '—';
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const goToFavorites = () => {
    router.push({
      name: 'favorites',
      query: { highlight: String(media.value?.id ?? '') },
    });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const toggleFavorite = async () => {
    if (!media.value) return;

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
        notifySuccess('收藏已更新', `已将《${media.value.title}》加入收藏。`);
      } else {
        notifyInfo('收藏已更新', `已将《${media.value.title}》从收藏中移除。`);
      }
    } catch (error) {
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

  const getCurrentPlayerTime = (): number => {
    const video = videoElement.value;
    return video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
  };

  let saveInterval: ReturnType<typeof setInterval>;

  const handleBeforeUnload = () => {
    if (!authStore.token || !media.value) return;
    const currentTime = getCurrentPlayerTime();
    if (currentTime <= 0) return;
    const duration = media.value.duration || 0;
    const payload = JSON.stringify({
      mediaResourceId: media.value.id,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      isCompleted: duration > 0 && currentTime >= duration - 5,
    });
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/watch-history', blob);
  };

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('keydown', handleFullscreenKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    void loadMedia();

    saveInterval = setInterval(() => {
      const currentTime = getCurrentPlayerTime();
      if (currentTime > 0) {
        void saveWatchProgress(currentTime, true);
      }
    }, 30000);
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onUnmounted(() => {
    const currentTime = getCurrentPlayerTime();
    if (currentTime > 0) {
      void saveWatchProgress(currentTime, true);
    }
    clearInterval(saveInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('resize', checkMobile);
    window.removeEventListener('keydown', handleFullscreenKeydown);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    exitWebFullscreen();
  });
</script>

<style scoped>
  .watch-view {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
  }

  .watch-nav {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-primary);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .nav-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-brand-primary);
    text-decoration: none;
  }

  .nav-back {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .nav-back:hover {
    color: var(--text-primary);
  }

  .nav-back svg {
    width: 16px;
    height: 16px;
  }

  .watch-main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 80px 0;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--bg-tertiary);
    border-top-color: var(--border-focus);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    text-align: center;
    padding: 80px 0;
    color: var(--color-error);
    font-size: 18px;
  }

  .watch-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 24px;
  }

  .player-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .player-wrapper {
    --watch-overlay-edge: clamp(10px, 2vw, 18px);
    --watch-overlay-bottom: calc(env(safe-area-inset-bottom, 0px) + 88px);
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg-player);
    aspect-ratio: 16 / 9;
    isolation: isolate;
  }

  .player-wrapper :deep(.danmaku-player) {
    --danmaku-edge: var(--watch-overlay-edge);
    --danmaku-controls-bottom: var(--watch-overlay-bottom);
  }

  .player-wrapper :deep(.art-player-container),
  .player-wrapper :deep(.artplayer),
  .player-wrapper :deep(.art-video),
  .player-wrapper :deep(video) {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .player-wrapper:fullscreen,
  .player-wrapper.player-wrapper--web-fullscreen {
    --watch-overlay-edge: max(
      16px,
      env(safe-area-inset-left, 0px),
      env(safe-area-inset-right, 0px)
    );
    --watch-overlay-bottom: calc(env(safe-area-inset-bottom, 0px) + 88px);
    display: flex;
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
    aspect-ratio: unset;
    background: #000;
  }

  .player-wrapper.player-wrapper--web-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 10000;
  }

  .player-wrapper:fullscreen :deep(.art-player-container),
  .player-wrapper:fullscreen :deep(.artplayer),
  .player-wrapper:fullscreen :deep(.art-video),
  .player-wrapper:fullscreen :deep(video),
  .player-wrapper.player-wrapper--web-fullscreen :deep(.art-player-container),
  .player-wrapper.player-wrapper--web-fullscreen :deep(.artplayer),
  .player-wrapper.player-wrapper--web-fullscreen :deep(.art-video),
  .player-wrapper.player-wrapper--web-fullscreen :deep(video) {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
  }

  .player-wrapper:fullscreen .danmaku-overlay,
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    --danmaku-controls-max: 820px;
  }

  .player-wrapper:fullscreen .danmaku-overlay :deep(.danmaku-container),
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay :deep(.danmaku-container) {
    pointer-events: none;
  }

  .player-wrapper:fullscreen .danmaku-overlay :deep(.danmaku-settings-panel),
  .player-wrapper:fullscreen .danmaku-overlay :deep(.danmaku-float-toggle),
  .player-wrapper:fullscreen .danmaku-overlay :deep(.report-dialog-backdrop),
  .player-wrapper:fullscreen .danmaku-overlay :deep(.connection-toast),
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay :deep(.danmaku-settings-panel),
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay :deep(.danmaku-float-toggle),
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay :deep(.report-dialog-backdrop),
  .player-wrapper.player-wrapper--web-fullscreen .danmaku-overlay :deep(.connection-toast) {
    pointer-events: all;
  }

  .custom-fullscreen-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 200;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 6px;
    color: var(--text-inverse);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: all;
  }

  .player-wrapper:hover .custom-fullscreen-btn {
    opacity: 1;
  }

  .custom-fullscreen-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .custom-fullscreen-btn svg {
    width: 18px;
    height: 18px;
  }

  .player-wrapper:fullscreen .custom-fullscreen-btn,
  .player-wrapper.player-wrapper--web-fullscreen .custom-fullscreen-btn {
    opacity: 1;
  }

  .skip-settings-btn {
    position: absolute;
    top: 12px;
    right: 56px;
    z-index: 200;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 6px;
    color: var(--text-inverse);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: all;
  }

  .player-wrapper:hover .skip-settings-btn {
    opacity: 1;
  }

  .skip-settings-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .skip-settings-btn svg {
    width: 18px;
    height: 18px;
  }

  .player-wrapper:fullscreen .skip-settings-btn,
  .player-wrapper.player-wrapper--web-fullscreen .skip-settings-btn {
    opacity: 1;
  }

  .skip-settings-panel {
    background: var(--surface-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    padding: 20px;
    margin-top: 12px;
  }

  .skip-settings-panel h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
  }

  .skip-settings-hint {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 16px;
  }

  .skip-settings-row {
    margin-bottom: 12px;
  }

  .skip-settings-row label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .skip-settings-row label > span:first-child {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .skip-input-group {
    display: flex;
    gap: 8px;
  }

  .skip-input-group input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-control);
    background: var(--surface-muted);
    color: var(--text-primary);
    font-size: 14px;
  }

  .skip-set-btn {
    padding: 8px 12px;
    background: var(--color-brand-overlay);
    border: 1px solid var(--color-brand-border);
    border-radius: var(--radius-control);
    color: var(--color-brand-primary-light);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .skip-set-btn:hover {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .skip-time-display {
    font-size: 13px;
    color: var(--text-muted);
  }

  .skip-settings-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .skip-save-btn {
    padding: 8px 20px;
    background: var(--color-brand-primary);
    border: none;
    border-radius: var(--radius-control);
    color: var(--text-inverse);
    font-size: 14px;
    cursor: pointer;
  }

  .skip-save-btn:hover {
    opacity: 0.9;
  }

  .skip-cancel-btn {
    padding: 8px 20px;
    background: var(--surface-muted);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-control);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
  }

  .skip-cancel-btn:hover {
    background: var(--surface-card-hover);
  }

  /* 断点续播提示 */
  .resume-tip {
    position: absolute;
    right: var(--watch-overlay-edge);
    bottom: calc(var(--watch-overlay-bottom) + 54px);
    left: var(--watch-overlay-edge);
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    max-width: calc(100% - var(--watch-overlay-edge) - var(--watch-overlay-edge));
    margin-inline: auto;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    z-index: 300;
    white-space: nowrap;
  }

  .resume-tip span {
    color: white;
    font-size: 14px;
  }

  .resume-btn {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resume-btn:first-of-type {
    background: var(--color-brand-primary);
    color: white;
  }

  .resume-btn:first-of-type:hover {
    background: var(--color-brand-primary-dark);
  }

  .resume-btn--skip {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .resume-btn--skip:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .resume-enter-active,
  .resume-leave-active {
    transition: all 0.3s ease;
  }

  .resume-enter-from,
  .resume-leave-to {
    opacity: 0;
    transform: translateY(16px);
  }

  .danmaku-overlay {
    position: absolute;
    inset: 0;
    z-index: 100;
    pointer-events: none;
  }

  .player-wrapper > :deep(.danmaku-overlay) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    pointer-events: none;
  }

  .play-source-panel {
    background: var(--bg-card);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid var(--border-primary);
  }

  .source-panel-toggle {
    display: none;
  }

  .source-panel-backdrop {
    display: none;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .panel-header h2 {
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .freshness-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .freshness--stale {
    background: rgba(251, 191, 36, 0.15);
    color: var(--color-warning-light);
  }

  .freshness--refreshing {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .freshness--empty {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
  }

  .panel-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .btn-test-all {
    padding: 5px 14px;
    background: rgba(229, 9, 20, 0.15);
    border: 1px solid rgba(229, 9, 20, 0.3);
    border-radius: 8px;
    color: var(--color-brand-primary-light);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-test-all:hover:not(:disabled) {
    background: rgba(229, 9, 20, 0.25);
  }

  .btn-test-all:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .current-source {
    font-size: 12px;
    color: var(--text-muted);
  }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 6px;
  }

  .source-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .source-btn:hover {
    background: var(--border-primary);
  }

  .source-btn.active {
    border-color: var(--border-focus);
    background: rgba(229, 9, 20, 0.1);
  }

  .source-name {
    font-size: 14px;
    font-weight: 500;
  }

  .source-meta {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .source-type {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--border-primary);
    border-radius: 20px;
    color: var(--text-muted);
  }

  .source-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .speed-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
  }

  .speed-badge.badge--fast {
    background: rgba(34, 197, 94, 0.15);
    color: var(--color-success);
  }

  .speed-badge.badge--medium {
    background: rgba(251, 191, 36, 0.15);
    color: var(--color-warning-light);
  }

  .speed-badge.badge--slow {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
  }

  .source-btn.badge--fast {
    border-color: rgba(34, 197, 94, 0.3);
  }

  .source-btn.badge--medium {
    border-color: rgba(251, 191, 36, 0.3);
  }

  .source-btn.badge--slow {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .magnet-notice {
    margin-top: 12px;
    padding: 10px;
    background: rgba(251, 191, 36, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--color-warning-light);
  }

  .download-section {
    background: var(--bg-card);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid var(--border-primary);
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 600;
  }

  .section-header p {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .download-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-primary {
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border: none;
    border-radius: 10px;
    color: var(--text-inverse);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(229, 9, 20, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-outline {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid var(--border-secondary);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-outline:hover {
    background: var(--border-primary);
  }

  .msg-success {
    margin-top: 12px;
    font-size: 13px;
    color: var(--color-success-light);
  }

  .msg-warning {
    margin-top: 12px;
    font-size: 13px;
    color: var(--color-warning-light);
  }

  .info-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-card {
    background: var(--bg-card);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid var(--border-primary);
  }

  .info-card h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .media-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .meta-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .meta-label {
    font-size: 13px;
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .meta-value {
    font-size: 14px;
  }

  .meta-value.rating {
    color: var(--color-warning-light);
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .btn-favorite {
    padding: 10px 20px;
    border: 1px solid var(--border-secondary);
    border-radius: 10px;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-favorite:hover {
    background: var(--border-primary);
  }

  .btn-favorite.active {
    border-color: var(--color-warning-light);
    background: rgba(251, 191, 36, 0.1);
    color: var(--color-warning-light);
  }

  .btn-favorite:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-link {
    background: none;
    border: none;
    color: var(--color-warning-light);
    font-size: 14px;
    cursor: pointer;
  }

  .btn-link:hover {
    color: var(--color-warning-lighter);
  }

  .msg-info {
    margin-top: 8px;
    font-size: 13px;
    color: var(--color-warning-light);
  }

  .episode-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .episode-total {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 8px;
  }

  .episode-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-primary);
  }

  .episode-page-btn {
    padding: 6px 14px;
    background: rgba(229, 9, 20, 0.15);
    border: 1px solid rgba(229, 9, 20, 0.3);
    border-radius: 6px;
    color: var(--color-brand-primary-light);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .episode-page-btn:hover:not(:disabled) {
    background: rgba(229, 9, 20, 0.25);
  }

  .episode-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .episode-page-info {
    font-size: 13px;
    color: var(--text-muted);
  }

  .episode-btn {
    padding: 6px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 36px;
  }

  .episode-btn:hover {
    background: var(--border-primary);
  }

  .episode-btn.active {
    background: var(--color-brand-primary);
    border-color: var(--border-focus);
  }

  .description {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .shortcuts-card {
    display: none;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }

  .shortcut-item kbd {
    padding: 4px 8px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    min-width: 40px;
    text-align: center;
  }

  .shortcut-item span {
    color: var(--text-muted);
  }

  @media (max-width: 1024px) {
    .watch-layout {
      grid-template-columns: 1fr;
    }

    .watch-main {
      padding: 20px var(--page-gutter);
    }

    .shortcuts-card {
      display: block;
    }

    .episode-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  @media (max-width: 640px) {
    .watch-main {
      padding: 14px var(--page-gutter);
    }

    .nav-content {
      padding: 0 var(--page-gutter);
    }

    .player-wrapper {
      --watch-overlay-edge: 8px;
      --watch-overlay-bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
      border-radius: 10px;
    }

    .resume-tip {
      right: var(--watch-overlay-edge);
      bottom: calc(var(--watch-overlay-bottom) + 60px);
      left: var(--watch-overlay-edge);
      width: auto;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      white-space: normal;
    }

    .resume-btn {
      min-height: 34px;
    }

    .panel-header,
    .section-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .panel-actions,
    .download-actions,
    .action-buttons {
      align-items: stretch;
      flex-direction: column;
    }

    .btn-test-all,
    .btn-primary,
    .btn-outline,
    .btn-favorite {
      width: 100%;
      min-height: var(--touch-target);
    }

    .source-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .episode-grid {
      grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      gap: 6px;
    }

    .episode-btn {
      padding: 6px 4px;
      font-size: 13px;
      min-height: 36px;
    }

    .source-btn {
      padding: 8px 10px;
    }

    .source-name {
      font-size: 13px;
    }

    .source-panel-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: var(--touch-target);
      padding: 10px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-primary);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .source-panel-toggle:hover {
      background: var(--border-primary);
    }

    .source-panel-toggle svg {
      width: 16px;
      height: 16px;
      transition: transform 0.25s ease;
    }

    .source-panel-toggle .source-panel-toggle__name {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 400;
    }

    .source-panel-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 49;
      background: rgba(0, 0, 0, 0.45);
    }

    .play-source-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      max-height: 60vh;
      overflow-y: auto;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
      padding: 16px;
      transform: translateY(100%);
      transition: transform 0.28s ease;
    }

    .play-source-panel--open {
      transform: translateY(0);
    }

    .player-wrapper:not(:fullscreen):not(.player-wrapper--web-fullscreen) :deep(.danmaku-controls) {
      display: none;
    }

    .player-wrapper:not(:fullscreen):not(.player-wrapper--web-fullscreen) .resume-tip {
      display: none;
    }
  }

  .no-source-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    background: var(--bg-secondary);
    border-radius: var(--panel-radius, 12px);
    text-align: center;
  }

  .no-source-error__icon {
    width: 48px;
    height: 48px;
    color: var(--color-warning, #f59e0b);
  }

  .no-source-error__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .no-source-error__desc {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }

  .no-source-error__btn {
    margin-top: 8px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-inverse);
    background: var(--color-brand-primary, #6366f1);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .no-source-error__btn:hover {
    opacity: 0.85;
  }
</style>
