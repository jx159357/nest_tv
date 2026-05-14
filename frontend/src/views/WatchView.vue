<template>
  <div class="watch-view">
    <nav class="watch-nav">
      <div class="nav-content">
        <router-link to="/" class="nav-brand">Nest TV</router-link>
        <router-link to="/" class="nav-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </router-link>
      </div>
    </nav>

    <main class="watch-main">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="media" class="watch-layout">
        <section class="player-section">
          <div class="player-wrapper">
            <ArtPlayerWrapper
              v-if="currentPlaySource"
              :src="videoSrc"
              :title="media.title"
              :poster="media.poster"
              :autoplay="false"
              :current-time="resumeTime"
              @ready="onPlayerReady"
              @timeupdate="onTimeUpdate"
              @ended="onVideoEnded"
              @error="onPlayerError"
            />

            <DanmakuPlayer
              v-if="currentPlaySource"
              :video-id="media.id.toString()"
              :media-resource-id="media.id"
              :show-controls="true"
              :max-danmaku-count="150"
              class="danmaku-overlay"
            />
          </div>

          <div class="play-source-panel">
            <div class="panel-header">
              <h2>播放源</h2>
              <div class="panel-actions">
                <button
                  class="btn-test-all"
                  :disabled="isTestingAll"
                  @click="testAllSources"
                >
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
                :class="['source-btn', { active: currentPlaySource?.id === playSource.id }, getSourceBadgeClass(playSource.id)]"
                @click="selectPlaySource(playSource)"
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
                  <span v-if="getSpeedDisplay(playSource.id)" class="speed-badge" :class="getSourceBadgeClass(playSource.id)">
                    {{ getSpeedDisplay(playSource.id) }}
                  </span>
                  <div class="source-type">
                    {{ playSource.type === 'magnet' ? '磁力' : playSource.type === 'online' ? '在线' : '本地' }}
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
              <button
                v-if="favoriteMessage && isFavorite"
                class="btn-link"
                @click="goToFavorites"
              >
                查看收藏
              </button>
            </div>
            <p v-if="favoriteMessage" class="msg-info">{{ favoriteMessage }}</p>
          </section>

          <section v-if="media.episodeCount" class="info-card">
            <h2>剧集选择</h2>
            <div class="episode-grid">
              <button
                v-for="episode in media.episodeCount"
                :key="episode"
                :class="['episode-btn', { active: currentEpisode === episode }]"
                @click="selectEpisode(episode)"
              >
                第 {{ episode }} 集
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

          <WatchRoom
            v-if="media"
            :media-id="media.id"
            :media-title="media.title"
            @sync="onRoomSync"
          />
        </aside>
      </div>

      <div v-else class="error-state">视频加载失败</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMediaStore } from '@/stores/media';
import { useAuthStore } from '@/stores/auth';
import { useDownloadsStore } from '@/stores/downloads';
import { watchHistoryApi } from '@/api/watchHistory';
import { notifyError, notifyInfo, notifySuccess } from '@/composables/useModal';
import ArtPlayerWrapper from '@/components/ArtPlayerWrapper.vue';
import DanmakuPlayer from '@/components/DanmakuPlayer.vue';
import WatchRoom from '@/components/WatchRoom.vue';
import { batchTestSources, getSourceScore, type SourceTestResult } from '@/utils/source-test';
import { log } from '@/utils/logger';
import type { MediaResource, PlaySource } from '@/types/media';

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const authStore = useAuthStore();
const downloadsStore = useDownloadsStore();

const media = ref<MediaResource | null>(null);
const currentPlaySource = ref<PlaySource | null>(null);
const currentEpisode = ref(1);
const loading = ref(true);
const resumeTime = ref(0);
const lastSavedTime = ref(0);
const downloadMessage = ref('');
const isFavorite = ref(false);
const favoriteLoading = ref(false);
const favoriteMessage = ref('');

const testResults = ref<Map<number, SourceTestResult>>(new Map());
const isTestingAll = ref(false);

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

  await batchTestSources(sources, 3, (result) => {
    testResults.value.set(result.id, result);
  });

  isTestingAll.value = false;
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
  () => currentPlaySource.value?.type === 'magnet' || currentPlaySource.value?.url?.startsWith('magnet:'),
);

const videoSrc = computed(() => {
  const url = currentPlaySource.value?.url;
  if (!url) return '';
  if (!url.startsWith('magnet:')) return url;

  const hashMatch = url.match(/btih:([a-fA-F0-9]{32,40})/i);
  const infoHash = hashMatch ? hashMatch[1].toLowerCase() : '';
  if (!infoHash) return '';

  const token = authStore.token || localStorage.getItem('token') || '';
  return `/torrent/stream/${infoHash}?magnet=${encodeURIComponent(url)}&token=${token}`;
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

const loadMedia = async () => {
  const mediaId = parseInt(route.params.id as string);
  loading.value = true;
  lastSavedTime.value = 0;
  favoriteMessage.value = '';

  try {
    const mediaData = await mediaStore.fetchMediaDetail(mediaId);
    media.value = mediaData;

    if (mediaData.playSources?.length > 0) {
      currentPlaySource.value = mediaData.playSources[0];
    }

    const timeParam = Array.isArray(route.query.time) ? route.query.time[0] : route.query.time;
    const parsedTime = Number(timeParam);
    resumeTime.value = Number.isFinite(parsedTime) && parsedTime > 0 ? parsedTime : 0;

    await syncFavoriteStatus(mediaId);
    await mediaStore.incrementViewCount(String(mediaId));
  } catch (error) {
    log.error('WatchView', '加载视频失败:', error);
  } finally {
    loading.value = false;
  }
};

const onPlayerReady = () => {
  // Player ready
};

const onTimeUpdate = (currentTime: number) => {
  void saveWatchProgress(currentTime);
};

const onVideoEnded = () => {
  void saveWatchProgress(0, true);
};

const onPlayerError = (error: string) => {
  log.error('WatchView', '播放器错误:', error);
};

const onRoomSync = (currentTime: number, playing: boolean) => {
  resumeTime.value = currentTime;
  // Note: ArtPlayer playback state would need to be controlled via ref
  // This is a placeholder for the sync mechanism
  void playing;
};

const saveWatchProgress = async (currentTime: number, force = false) => {
  if (!authStore.token || !media.value) return;

  const duration = media.value.duration || 0;

  if (!force && currentTime - lastSavedTime.value < 15) return;
  if (currentTime <= 0) return;

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
  currentPlaySource.value = playSource;
};

const selectEpisode = (episode: number) => {
  currentEpisode.value = episode;
  const episodePlaySources = media.value.playSources.filter(
    (ps: any) => ps.episodeNumber === episode,
  );
  if (episodePlaySources.length > 0) {
    selectPlaySource(episodePlaySources[0]);
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
    query: { highlight: String(media.value.id) },
  });
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

let saveInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  void loadMedia();

  saveInterval = setInterval(() => {
    void saveWatchProgress(0, true);
  }, 30000);
});

onUnmounted(() => {
  void saveWatchProgress(0, true);
  clearInterval(saveInterval);
});
</script>

<style scoped>
.watch-view {
  min-height: 100vh;
  background: #0a0f1a;
  color: #e2e8f0;
}

.watch-nav {
  background: #141a2a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
  color: #fff;
  text-decoration: none;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-back:hover {
  color: #e2e8f0;
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
  color: #94a3b8;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #1e293b;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 80px 0;
  color: #ef4444;
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
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 16 / 9;
}

.danmaku-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.play-source-panel {
  background: #141a2a;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
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
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-test-all {
  padding: 5px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: #818cf8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-test-all:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
}

.btn-test-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-source {
  font-size: 12px;
  color: #64748b;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.source-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.source-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.source-btn.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.source-name {
  font-size: 14px;
  font-weight: 500;
}

.source-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.source-type {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  color: #94a3b8;
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
  color: #22c55e;
}

.speed-badge.badge--medium {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.speed-badge.badge--slow {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
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
  color: #fbbf24;
}

.download-section {
  background: #141a2a;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  color: #64748b;
  margin-top: 4px;
}

.download-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
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
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.06);
}

.msg-success {
  margin-top: 12px;
  font-size: 13px;
  color: #34d399;
}

.msg-warning {
  margin-top: 12px;
  font-size: 13px;
  color: #fbbf24;
}

.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: #141a2a;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
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
}

.meta-label {
  font-size: 13px;
  color: #64748b;
}

.meta-value {
  font-size: 14px;
}

.meta-value.rating {
  color: #fbbf24;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-favorite {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: transparent;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-favorite:hover {
  background: rgba(255, 255, 255, 0.06);
}

.btn-favorite.active {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.btn-favorite:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #fbbf24;
  font-size: 14px;
  cursor: pointer;
}

.btn-link:hover {
  color: #fde68a;
}

.msg-info {
  margin-top: 8px;
  font-size: 13px;
  color: #fbbf24;
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.episode-btn {
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.episode-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.episode-btn.active {
  background: #6366f1;
  border-color: #6366f1;
}

.description {
  font-size: 14px;
  line-height: 1.6;
  color: #94a3b8;
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.shortcut-item span {
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .watch-layout {
    grid-template-columns: 1fr;
  }

  .shortcuts-card {
    display: block;
  }

  .episode-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .source-grid {
    grid-template-columns: 1fr;
  }

  .episode-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
