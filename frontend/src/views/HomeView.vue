<template>
  <div class="home-view">
    <!-- 搜索模式 -->
    <section v-if="isSearchMode" class="search-section">
      <div class="search-header">
        <div>
          <h2 class="search-title">搜索结果</h2>
          <p class="search-subtitle">
            关键词：{{ activeSearchQuery }}
            <span v-if="searchStreaming" class="streaming-badge">搜索中...</span>
          </p>
        </div>
        <button class="btn-back" @click="clearSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>
      </div>

      <div v-if="searchError" class="error-state">{{ searchError }}</div>

      <div v-if="mediaResults.length > 0" class="source-group">
        <h3 class="source-title">媒体库 ({{ mediaResultsTotal }})</h3>
        <div class="media-grid">
          <MediaCard
            v-for="media in mediaResults"
            :key="`media-${media.id}`"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
      </div>

      <div v-if="torrentResults.length > 0" class="source-group">
        <h3 class="source-title">磁力资源 ({{ torrentResultsTotal }})</h3>
        <div class="torrent-grid">
          <div
            v-for="torrent in torrentResults"
            :key="`torrent-${torrent.infoHash}`"
            class="torrent-card"
            @click="goToMediaDetail(torrent.mediaResourceId)"
          >
            <div class="torrent-name">{{ torrent.name || torrent.mediaTitle || '未知资源' }}</div>
            <div class="torrent-meta">
              <span v-if="torrent.size">{{ formatSize(torrent.size) }}</span>
              <span v-if="torrent.seeders !== null">做种: {{ torrent.seeders }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="searchStreaming && mediaResults.length === 0 && torrentResults.length === 0"
        class="loading-state"
      >
        <div class="loading-spinner"></div>
        <span>正在搜索多个源...</span>
      </div>

      <div
        v-if="
          !searchStreaming &&
          mediaResults.length === 0 &&
          torrentResults.length === 0 &&
          !searchError
        "
        class="empty-state"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>暂无搜索结果</p>
        <span>换个关键词试试</span>
      </div>
    </section>

    <!-- 主页内容 -->
    <template v-else>
      <!-- 轮播区域 -->
      <section class="carousel-section">
        <BannerCarousel
          v-if="bannerItems.length > 0"
          :items="bannerItems"
          @play="item => goToMediaDetail(item.id)"
          @detail="item => goToMediaDetail(item.id)"
        />
        <div v-else-if="popularLoading" class="banner-skeleton"></div>
      </section>

      <!-- 热门推荐 -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            热门推荐
          </h2>
          <router-link to="/recommendations" class="section-more">
            查看更多
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </router-link>
        </div>
        <div v-if="popularLoading" class="loading-row">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>
        <div v-else-if="popularMedia.length > 0" class="media-row">
          <MediaCard
            v-for="media in popularMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>暂无热门视频</p>
        </div>
      </section>

      <!-- 最新上线 -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            最新上线
          </h2>
        </div>
        <div v-if="latestLoading" class="loading-row">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>
        <div v-else-if="latestMedia.length > 0" class="media-row">
          <MediaCard
            v-for="media in latestMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>暂无最新视频</p>
        </div>
      </section>

      <!-- 高分佳作 -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </svg>
            高分佳作
          </h2>
        </div>
        <div v-if="topRatedLoading" class="loading-row">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>
        <div v-else-if="topRatedMedia.length > 0" class="media-row">
          <MediaCard
            v-for="media in topRatedMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>暂无高分视频</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onUnmounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import MediaCard from '@/components/MediaCard.vue';
  import BannerCarousel from '@/components/BannerCarousel.vue';
  import { log } from '@/utils/logger';
  import { searchApi } from '@/api/search';
  import type { SseSearchEvent } from '@/api/search';
  import type { MediaResource } from '@/types/media';

  interface TorrentItem {
    infoHash: string;
    name: string;
    size: string | number | null;
    seeders: number | null;
    mediaResourceId: number;
    mediaTitle?: string;
  }

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();

  const mediaResults = ref<MediaResource[]>([]);
  const mediaResultsTotal = ref(0);
  const torrentResults = ref<TorrentItem[]>([]);
  const torrentResultsTotal = ref(0);
  const popularMedia = ref<MediaResource[]>([]);
  const latestMedia = ref<MediaResource[]>([]);
  const topRatedMedia = ref<MediaResource[]>([]);
  const bannerItems = ref<MediaResource[]>([]);

  const searchStreaming = ref(false);
  const popularLoading = ref(false);
  const latestLoading = ref(false);
  const topRatedLoading = ref(false);
  const searchError = ref<string | null>(null);

  let cancelSse: (() => void) | null = null;

  const activeSearchQuery = computed(() => {
    const value = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q;
    return typeof value === 'string' ? value.trim() : '';
  });

  const isSearchMode = computed(() => activeSearchQuery.value.length > 0);

  const formatSize = (size: string | number) => {
    if (typeof size === 'number') {
      if (size > 1073741824) return `${(size / 1073741824).toFixed(1)} GB`;
      if (size > 1048576) return `${(size / 1048576).toFixed(1)} MB`;
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return String(size);
  };

  const loadHomeData = async () => {
    popularLoading.value = true;
    latestLoading.value = true;
    topRatedLoading.value = true;

    try {
      const [popular, latest, topRated] = await Promise.all([
        mediaStore.fetchPopularMedia(8),
        mediaStore.fetchLatestMedia(8),
        mediaStore.fetchTopRatedMedia(8),
      ]);

      popularMedia.value = popular;
      latestMedia.value = latest;
      topRatedMedia.value = topRated;

      bannerItems.value = popular.slice(0, 5);
    } catch (error) {
      log.error('Home', '加载首页数据失败:', error);
    } finally {
      popularLoading.value = false;
      latestLoading.value = false;
      topRatedLoading.value = false;
    }
  };

  const startStreamSearch = (query: string) => {
    cancelSse?.();
    searchStreaming.value = true;
    searchError.value = null;
    mediaResults.value = [];
    mediaResultsTotal.value = 0;
    torrentResults.value = [];
    torrentResultsTotal.value = 0;

    cancelSse = searchApi.streamSearch(query, {
      limit: 20,
      onEvent: (event: SseSearchEvent) => {
        if (event.type === 'media' && Array.isArray(event.data)) {
          mediaResults.value = event.data as MediaResource[];
          mediaResultsTotal.value = event.total ?? event.data.length;
        } else if (event.type === 'torrents' && Array.isArray(event.data)) {
          torrentResults.value = event.data as TorrentItem[];
          torrentResultsTotal.value = event.total ?? event.data.length;
        } else if (event.type === 'error') {
          searchError.value = event.message || '部分搜索源失败';
        }
      },
      onError: err => {
        searchError.value = err.message;
        searchStreaming.value = false;
      },
      onDone: () => {
        searchStreaming.value = false;
      },
    });
  };

  const clearSearch = () => {
    cancelSse?.();
    cancelSse = null;
    mediaResults.value = [];
    torrentResults.value = [];
    searchError.value = null;
    void router.push({ path: '/' });
  };

  const goToMediaDetail = (id: number) => {
    if (id) {
      void router.push(`/media/${id}`);
    }
  };

  watch(
    () => activeSearchQuery.value,
    query => {
      if (query) {
        startStreamSearch(query);
        return;
      }
      cancelSse?.();
      mediaResults.value = [];
      torrentResults.value = [];
      searchError.value = null;
      void loadHomeData();
    },
    { immediate: true },
  );

  onUnmounted(() => {
    cancelSse?.();
  });
</script>

<style scoped>
  .home-view {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
  }

  /* 轮播区域 */
  .carousel-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 24px 0;
  }

  .banner-skeleton {
    aspect-ratio: 21 / 9;
    min-height: 300px;
    max-height: 500px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
    animation: pulse 2s ease-in-out infinite;
  }

  /* 内容区域 */
  .content-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 24px 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .section-title svg {
    width: 22px;
    height: 22px;
    color: var(--color-brand-primary);
  }

  .section-more {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-brand-primary);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .section-more:hover {
    color: var(--color-brand-primary-light);
  }

  .section-more svg {
    width: 16px;
    height: 16px;
  }

  /* 媒体行 - 横向滚动 */
  .media-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding-bottom: 24px;
  }

  /* 媒体网格 */
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding-bottom: 24px;
  }

  /* 加载状态 */
  .loading-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }

  .skeleton-card {
    aspect-ratio: 2/3;
    background: linear-gradient(135deg, var(--bg-tertiary), var(--color-gray-700));
    border-radius: 12px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px 0;
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
    padding: 60px 0;
    color: var(--color-error);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--text-muted);
  }

  .empty-state svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 16px;
    color: var(--text-muted);
  }

  .empty-state span {
    font-size: 14px;
  }

  .empty-row {
    text-align: center;
    padding: 40px 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  /* 搜索区域 */
  .search-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  .search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .search-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .search-subtitle {
    font-size: 14px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .btn-back {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .btn-back svg {
    width: 16px;
    height: 16px;
  }

  .streaming-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    font-size: 12px;
    color: var(--color-brand-primary-light);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .source-group {
    margin-bottom: 32px;
  }

  .source-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .torrent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }

  .torrent-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .torrent-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .torrent-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .torrent-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .media-row,
    .media-grid,
    .loading-row {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .section-title {
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .media-row,
    .media-grid,
    .loading-row {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }
</style>
