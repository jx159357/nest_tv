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
        <div v-else-if="homeLoadError" class="home-offline-hero">
          <div class="home-offline-hero__content">
            <span class="home-offline-hero__eyebrow">Nest TV</span>
            <h1 class="home-offline-hero__title">视频库暂时连不上</h1>
            <p class="home-offline-hero__desc">
              前端已经可用。启动后端服务后，首页会自动加载热门、最新和高分内容。
            </p>
            <button class="home-offline-hero__button" @click="loadHomeData">重新加载</button>
          </div>
        </div>
      </section>

      <section class="home-search">
        <div class="home-search__content">
          <div class="home-search__copy">
            <span class="home-search__eyebrow">Nest TV</span>
            <h1 class="home-search__title">找片、续看、直播和下载</h1>
          </div>
          <form class="home-search__form" @submit.prevent="submitHomeSearch">
            <svg
              class="home-search__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="homeSearchQuery"
              class="home-search__input"
              type="search"
              autocomplete="off"
              placeholder="搜索电影、剧集、演员、磁力资源"
              @focus="openHomeSearchMenu"
              @input="onHomeSearchInput"
              @blur="closeHomeSearchMenu"
            />
            <button class="home-search__button" type="submit">搜索</button>
            <div
              v-if="
                showHomeSearchMenu && (searchSuggestions.length > 0 || recentSearches.length > 0)
              "
              class="home-search__menu"
            >
              <div v-if="searchSuggestions.length > 0" class="home-search__menu-group">
                <div class="home-search__menu-title">搜索建议</div>
                <button
                  v-for="item in searchSuggestions"
                  :key="`suggestion-${item.text}`"
                  type="button"
                  class="home-search__menu-item"
                  @mousedown.prevent="selectSearchKeyword(item.text)"
                >
                  {{ item.text }}
                </button>
              </div>
              <div v-if="recentSearches.length > 0" class="home-search__menu-group">
                <div class="home-search__menu-title">
                  <span>搜索历史</span>
                  <button type="button" @mousedown.prevent="clearRecentSearches">清空</button>
                </div>
                <button
                  v-for="keyword in recentSearches"
                  :key="`history-${keyword}`"
                  type="button"
                  class="home-search__menu-item"
                  @mousedown.prevent="selectSearchKeyword(keyword)"
                >
                  {{ keyword }}
                </button>
              </div>
            </div>
          </form>
          <div class="home-search__quick">
            <router-link to="/categories?type=movie">电影</router-link>
            <router-link to="/categories?type=tv_series">剧集</router-link>
            <router-link to="/categories?type=anime">动漫</router-link>
            <router-link to="/iptv">直播</router-link>
          </div>
        </div>
      </section>

      <!-- 继续观看 -->
      <section
        v-if="authStore.isAuthenticated && continueWatching.length > 0"
        class="content-section"
      >
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            继续观看
          </h2>
          <router-link
            to="/watch-history?isCompleted=false&sortBy=updatedAt&sortOrder=DESC"
            class="section-more"
          >
            查看更多
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </router-link>
        </div>
        <div class="continue-row">
          <div
            v-for="item in continueWatching"
            :key="item.id"
            class="continue-card"
            @click="goToWatch(item.mediaResourceId, item.currentTime)"
          >
            <div class="continue-card__poster">
              <img
                :src="item.mediaResource?.poster || '/placeholder.png'"
                :alt="item.mediaResource?.title"
                loading="lazy"
              />
              <div class="continue-card__progress">
                <div
                  class="continue-card__progress-bar"
                  :style="{ width: `${getProgress(item)}%` }"
                ></div>
              </div>
              <div class="continue-card__overlay">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span v-if="item.episodeNumber" class="continue-card__episode">
                第{{ item.episodeNumber }}集
              </span>
            </div>
            <div class="continue-card__info">
              <h4 class="continue-card__title">{{ item.mediaResource?.title }}</h4>
              <p class="continue-card__meta">观看至 {{ formatTime(item.currentTime) }}</p>
            </div>
          </div>
        </div>
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
        <div v-else-if="popularMedia.length > 0" class="media-row media-row--rail">
          <MediaCard
            v-for="media in popularMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>{{ homeLoadError || '暂无热门视频' }}</p>
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
        <div v-else-if="latestMedia.length > 0" class="media-row media-row--rail">
          <MediaCard
            v-for="media in latestMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>{{ homeLoadError || '暂无最新视频' }}</p>
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
        <div v-else-if="topRatedMedia.length > 0" class="media-row media-row--rail">
          <MediaCard
            v-for="media in topRatedMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <div v-else class="empty-row">
          <p>{{ homeLoadError || '暂无高分视频' }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onUnmounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import { useAuthStore } from '@/stores/auth';
  import MediaCard from '@/components/MediaCard.vue';
  import BannerCarousel from '@/components/BannerCarousel.vue';
  import { log } from '@/utils/logger';
  import { searchApi } from '@/api/search';
  import { watchHistoryApi, type WatchHistoryItem } from '@/api/watchHistory';
  import type { SearchSuggestionItem, SseSearchEvent } from '@/api/search';
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
  const authStore = useAuthStore();

  const mediaResults = ref<MediaResource[]>([]);
  const mediaResultsTotal = ref(0);
  const torrentResults = ref<TorrentItem[]>([]);
  const torrentResultsTotal = ref(0);
  const popularMedia = ref<MediaResource[]>([]);
  const latestMedia = ref<MediaResource[]>([]);
  const topRatedMedia = ref<MediaResource[]>([]);
  const bannerItems = ref<MediaResource[]>([]);
  const continueWatching = ref<WatchHistoryItem[]>([]);
  const homeSearchQuery = ref('');
  const searchSuggestions = ref<SearchSuggestionItem[]>([]);
  const recentSearches = ref<string[]>([]);
  const showHomeSearchMenu = ref(false);

  const searchStreaming = ref(false);
  const popularLoading = ref(false);
  const latestLoading = ref(false);
  const topRatedLoading = ref(false);
  const searchError = ref<string | null>(null);
  const homeLoadError = ref<string | null>(null);

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

  const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getProgress = (item: WatchHistoryItem) => {
    if (!item.duration || item.duration === 0) return 0;
    return Math.min(100, Math.round((item.currentTime / item.duration) * 100));
  };

  const goToWatch = (mediaId: number, currentTime?: number) => {
    const query = currentTime ? `?t=${Math.floor(currentTime)}` : '';
    void router.push(`/watch/${mediaId}${query}`);
  };

  const submitHomeSearch = async () => {
    const query = homeSearchQuery.value.trim();
    if (!query) return;
    try {
      await searchApi.recordHistory({ keyword: query });
    } catch (error) {
      log.error('Home', '记录搜索历史失败:', error);
    }
    showHomeSearchMenu.value = false;
    void router.push({ path: '/', query: { q: query } });
  };

  const loadRecentSearches = async () => {
    try {
      recentSearches.value = await searchApi.getHistory(6);
    } catch {
      recentSearches.value = [];
    }
  };

  const loadSearchSuggestions = async () => {
    const query = homeSearchQuery.value.trim();
    if (!query) {
      searchSuggestions.value = [];
      return;
    }
    try {
      searchSuggestions.value = await searchApi.getSuggestions(query, 6);
    } catch {
      searchSuggestions.value = [];
    }
  };

  const openHomeSearchMenu = () => {
    showHomeSearchMenu.value = true;
    void loadRecentSearches();
    void loadSearchSuggestions();
  };

  const closeHomeSearchMenu = () => {
    window.setTimeout(() => {
      showHomeSearchMenu.value = false;
    }, 120);
  };

  const onHomeSearchInput = () => {
    showHomeSearchMenu.value = true;
    void loadSearchSuggestions();
  };

  const selectSearchKeyword = (keyword: string) => {
    homeSearchQuery.value = keyword;
    void submitHomeSearch();
  };

  const clearRecentSearches = async () => {
    await searchApi.clearHistory();
    recentSearches.value = [];
  };

  const loadContinueWatching = async () => {
    if (!authStore.isAuthenticated) return;
    try {
      const result = await watchHistoryApi.getContinueWatching(undefined, { limit: 6 });
      continueWatching.value = Array.isArray(result) ? result : [];
    } catch (error) {
      log.error('Home', '加载继续观看失败:', error);
    }
  };

  const loadHomeData = async () => {
    popularLoading.value = true;
    latestLoading.value = true;
    topRatedLoading.value = true;
    homeLoadError.value = null;

    const results = await Promise.allSettled([
      mediaStore.fetchPopularMedia(8, { silent: true }),
      mediaStore.fetchLatestMedia(8, { silent: true }),
      mediaStore.fetchTopRatedMedia(8, 8, { silent: true }),
    ]);

    const [popularResult, latestResult, topRatedResult] = results;
    const failedCount = results.filter(result => result.status === 'rejected').length;

    if (popularResult.status === 'fulfilled') {
      popularMedia.value = popularResult.value;
      bannerItems.value = popularResult.value.slice(0, 5);
    } else {
      popularMedia.value = [];
      bannerItems.value = [];
      if (!popularResult.reason?.silent) {
        log.error('Home', '加载热门推荐失败:', popularResult.reason);
      }
    }

    if (latestResult.status === 'fulfilled') {
      latestMedia.value = latestResult.value;
    } else {
      latestMedia.value = [];
      if (!latestResult.reason?.silent) {
        log.error('Home', '加载最新上线失败:', latestResult.reason);
      }
    }

    if (topRatedResult.status === 'fulfilled') {
      topRatedMedia.value = topRatedResult.value;
    } else {
      topRatedMedia.value = [];
      if (!topRatedResult.reason?.silent) {
        log.error('Home', '加载高分佳作失败:', topRatedResult.reason);
      }
    }

    if (failedCount === results.length) {
      homeLoadError.value = '内容服务暂时不可用';
    } else if (failedCount > 0) {
      homeLoadError.value = '部分内容暂时不可用';
    }

    try {
      await loadContinueWatching();
    } catch (error) {
      log.error('Home', '加载继续观看失败:', error);
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
    --home-floating-bg: rgba(255, 255, 255, 0.92);
    --home-floating-border: rgba(15, 23, 42, 0.1);
    --home-floating-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
    --home-menu-bg: rgba(255, 255, 255, 0.98);
    --home-card-bg: rgba(255, 255, 255, 0.82);
    --home-card-hover-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
    --home-offline-bg: linear-gradient(135deg, #ffffff 0%, #eef2f7 100%);
    --home-offline-title: var(--text-primary);
    --home-offline-desc: var(--text-secondary);
    min-height: 100vh;
    background: transparent;
    color: var(--text-primary);
    padding-bottom: 36px;
  }

  :global([data-theme='dark'] .home-view),
  :global(.dark .home-view) {
    --home-floating-bg: rgba(8, 9, 13, 0.86);
    --home-floating-border: rgba(255, 255, 255, 0.1);
    --home-floating-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
    --home-menu-bg: rgba(10, 11, 16, 0.98);
    --home-card-bg: rgba(255, 255, 255, 0.045);
    --home-card-hover-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);
    --home-offline-bg:
      linear-gradient(90deg, rgba(5, 6, 9, 0.96), rgba(5, 6, 9, 0.68)),
      var(--bg-cinema-soft);
    --home-offline-title: var(--text-inverse);
    --home-offline-desc: rgba(226, 232, 240, 0.76);
  }

  /* 轮播区域 */
  .home-search {
    max-width: var(--content-max-width);
    position: relative;
    z-index: 4;
    margin: -34px auto 0;
    padding: 0 var(--page-gutter);
  }

  .home-search__content {
    display: grid;
    grid-template-columns: minmax(170px, 250px) minmax(320px, 1fr) auto;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--home-floating-border);
    border-radius: 8px;
    background: var(--home-floating-bg);
    padding: 12px;
    box-shadow: var(--home-floating-shadow);
    backdrop-filter: blur(18px) saturate(125%);
  }

  .home-search__eyebrow {
    color: var(--color-brand-primary-light);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }

  .home-search__title {
    margin: 4px 0 0;
    font-size: 16px;
    line-height: var(--line-height-tight);
    color: var(--text-primary);
  }

  .home-search__form {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .home-search__icon {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: var(--text-muted);
  }

  .home-search__input {
    width: 100%;
    height: 42px;
    padding: 0 112px 0 46px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-control);
    background: var(--surface-control);
    color: var(--text-primary);
    font-size: 15px;
    transition: all var(--transition-fast);
  }

  .home-search__input:focus {
    border-color: var(--border-focus);
    background: var(--surface-card-hover);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  .home-search__button {
    position: absolute;
    right: 7px;
    height: 32px;
    padding: 0 22px;
    border-radius: var(--radius-control);
    background: var(--color-brand-primary);
    color: var(--text-inverse);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
  }

  .home-search__button:hover {
    background: var(--color-brand-primary-light);
    box-shadow: 0 10px 28px var(--color-brand-glow);
  }

  .home-search__menu {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    z-index: 20;
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    background: var(--home-menu-bg);
    box-shadow: var(--shadow-popover);
  }

  .home-search__menu-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  .home-search__menu-title button {
    color: var(--color-brand-primary-light);
    font-size: var(--font-size-xs);
  }

  .home-search__menu-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-control);
    color: var(--text-secondary);
    text-align: left;
  }

  .home-search__menu-item:hover {
    background: var(--surface-card-hover);
    color: var(--text-primary);
  }

  .home-search__quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    min-width: 210px;
  }

  .home-search__quick a {
    min-height: var(--tag-height);
    padding: 5px 10px;
    border: 1px solid var(--border-primary);
    border-radius: var(--badge-radius);
    background: var(--surface-muted);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  .home-search__quick a:hover {
    border-color: var(--color-brand-border);
    background: var(--color-brand-overlay);
    color: var(--color-brand-primary-light);
  }

  .carousel-section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 18px var(--page-gutter) 0;
  }

  .banner-skeleton {
    aspect-ratio: 21 / 9;
    min-height: 300px;
    max-height: 500px;
    border-radius: var(--panel-radius);
    background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
    animation: pulse 2s ease-in-out infinite;
  }

  .home-offline-hero {
    min-height: 360px;
    display: flex;
    align-items: center;
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    background: var(--home-offline-bg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .home-offline-hero__content {
    width: min(520px, 100%);
    padding: 44px 52px;
  }

  .home-offline-hero__eyebrow {
    display: inline-flex;
    margin-bottom: 12px;
    padding: 5px 12px;
    border-radius: 6px;
    background: var(--color-brand-primary);
    color: var(--text-inverse);
    font-size: 12px;
    font-weight: 700;
  }

  .home-offline-hero__title {
    margin: 0;
    color: var(--home-offline-title);
    font-size: 34px;
    line-height: 1.2;
  }

  .home-offline-hero__desc {
    margin: 14px 0 22px;
    color: var(--home-offline-desc);
    font-size: 14px;
    line-height: 1.7;
  }

  .home-offline-hero__button {
    padding: 11px 20px;
    border-radius: 8px;
    background: var(--color-brand-primary);
    color: var(--text-inverse);
    font-size: 14px;
    font-weight: 700;
    transition: all var(--transition-fast);
  }

  .home-offline-hero__button:hover {
    background: var(--color-brand-primary-light);
    box-shadow: 0 10px 28px var(--color-brand-glow);
  }

  /* 内容区域 */
  .content-section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 32px var(--page-gutter) 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .section-title svg {
    width: 22px;
    height: 22px;
    color: var(--color-brand-primary-light);
  }

  .section-more {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .section-more:hover {
    color: var(--color-brand-primary-light);
  }

  .section-more svg {
    width: 16px;
    height: 16px;
  }

  /* 继续观看行 */
  .continue-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    padding-bottom: 6px;
  }

  .continue-card {
    display: grid;
    grid-template-columns: 132px 1fr;
    min-height: 82px;
    background: var(--home-card-bg);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-primary);
  }

  .continue-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--home-card-hover-shadow);
    border-color: var(--color-brand-border);
  }

  .continue-card__poster {
    position: relative;
    height: 100%;
    min-height: 82px;
    overflow: hidden;
  }

  .continue-card__poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .continue-card__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--overlay-light);
  }

  .continue-card__progress-bar {
    height: 100%;
    background: var(--color-brand-primary);
    transition: width 0.3s ease;
  }

  .continue-card__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--overlay-medium);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .continue-card:hover .continue-card__overlay {
    opacity: 1;
  }

  .continue-card__overlay svg {
    width: 40px;
    height: 40px;
    color: white;
  }

  .continue-card__episode {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 8px;
    background: var(--overlay-heavy);
    border-radius: 4px;
    font-size: 12px;
    color: white;
  }

  .continue-card__info {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    padding: 12px 14px;
  }

  .continue-card__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .continue-card__meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* 媒体行 - 横向滚动 */
  .media-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-card-min), 1fr));
    gap: var(--grid-card-gap);
    padding-bottom: 4px;
  }

  .media-row--rail {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(156px, 184px);
    grid-template-columns: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px 18px;
    scroll-snap-type: x proximity;
    scroll-padding-inline: 2px;
  }

  .media-row--rail > * {
    scroll-snap-align: start;
  }

  .media-row--rail::-webkit-scrollbar {
    height: 6px;
  }

  .media-row--rail::-webkit-scrollbar-thumb {
    background: var(--border-secondary);
    border-radius: 999px;
  }

  /* 媒体网格 */
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-card-min), 1fr));
    gap: var(--grid-card-gap);
    padding-bottom: 24px;
  }

  /* 加载状态 */
  .loading-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-card-min), 1fr));
    gap: var(--grid-card-gap);
  }

  .skeleton-card {
    aspect-ratio: 2/3;
    background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-card-elevated));
    border-radius: var(--poster-radius);
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
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 28px var(--page-gutter);
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
    background: var(--surface-muted);
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-back:hover {
    background: var(--border-primary);
    border-color: var(--border-secondary);
  }

  .btn-back svg {
    width: 16px;
    height: 16px;
  }

  .streaming-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(229, 9, 20, 0.2);
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
    border-bottom: 1px solid var(--border-primary);
  }

  .torrent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }

  .torrent-card {
    background: var(--surface-muted);
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .torrent-card:hover {
    background: var(--surface-hover);
    border-color: var(--border-focus);
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
    .home-search {
      margin-top: 12px;
    }

    .home-search__content {
      grid-template-columns: 1fr;
      gap: 12px;
      background: var(--home-floating-bg);
    }

    .home-search__quick {
      justify-content: flex-start;
    }

    .continue-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .home-search {
      padding: 18px var(--page-gutter) 0;
    }

    .home-search__content {
      padding: 18px;
    }

    .home-search__title {
      font-size: 18px;
    }

    .section-title {
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .continue-card {
      grid-template-columns: 112px 1fr;
    }

    .media-row,
    .media-grid,
    .loading-row {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .media-row--rail {
      grid-auto-columns: minmax(136px, 42vw);
      grid-template-columns: none;
    }

    .home-search__input {
      height: 50px;
      padding-right: 88px;
    }

    .home-search__button {
      padding: 0 16px;
    }
  }
</style>
