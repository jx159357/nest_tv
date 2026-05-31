<template>
  <div class="media-detail">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <template v-else-if="media">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>
      <div class="detail-banner">
        <div
          class="banner-bg"
          :style="media.poster ? { backgroundImage: `url(${media.poster})` } : {}"
        ></div>
        <div class="banner-content">
          <div class="poster-wrapper">
            <img v-if="media.poster" :src="media.poster" :alt="media.title" class="poster-img" />
            <div v-else class="poster-placeholder">暂无封面</div>
          </div>
          <div class="detail-info">
            <h1 class="detail-title">{{ media.title }}</h1>
            <p v-if="media.description" class="detail-desc">{{ media.description }}</p>
            <div class="detail-meta">
              <span v-if="media.rating" class="meta-rating">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
                {{ formatRating(media.rating) }}
              </span>
              <span class="meta-item">{{ formatPreferenceLabel(media.type) }}</span>
              <span v-if="media.releaseDate" class="meta-item">{{
                formatDate(media.releaseDate)
              }}</span>
              <span v-if="media.episodeCount" class="meta-item"
                >共 {{ media.episodeCount }} 集</span
              >
              <span class="meta-item">{{ media.viewCount || 0 }} 次播放</span>
            </div>
            <div class="detail-tags">
              <span v-for="genre in visibleGenres" :key="genre" class="tag" :title="genre">
                {{ genre }}
              </span>
              <span v-if="hiddenGenreCount > 0" class="tag tag--more">
                +{{ hiddenGenreCount }}
              </span>
            </div>
            <div class="detail-extra">
              <div v-if="media.director" class="extra-line">
                <strong>导演：</strong>{{ media.director }}
              </div>
              <div v-if="media.actors" class="extra-line">
                <strong>主演：</strong><TextClamp :text="media.actors" :max-lines="2" />
              </div>
              <div v-if="media.source" class="extra-line">
                <strong>来源：</strong>{{ media.source }}
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn-watch" @click="goToWatch">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                立即观看
              </button>
              <button
                class="btn-fav"
                :class="{ 'btn-fav--active': isFavorite }"
                :disabled="favoriteLoading"
                @click="toggleFavorite"
              >
                <svg
                  viewBox="0 0 24 24"
                  :fill="isFavorite ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                {{ favoriteLoading ? '处理中...' : isFavorite ? '已收藏' : '收藏' }}
              </button>
            </div>
            <div v-if="favoriteMessage" class="fav-message">
              <span>{{ favoriteMessage }}</span>
              <button v-if="isFavorite" class="fav-message__link" @click="goToFavorites">
                查看收藏
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <section class="detail-main">
          <h2 class="section-title">相关推荐</h2>
          <div v-if="recommendationsLoading" class="loading-row">
            <div v-for="i in 4" :key="i" class="skeleton-card"></div>
          </div>
          <div v-else-if="recommendations.length > 0" class="media-grid">
            <MediaCard
              v-for="item in recommendations"
              :key="item.id"
              :media="item"
              @click="goToMediaDetail(item.id)"
            />
          </div>
          <div v-else class="empty-row">暂无相关推荐</div>
        </section>

        <aside class="detail-sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">播放源</h3>
            <div v-if="media.playSources && media.playSources.length > 0" class="source-list">
              <div v-for="playSource in media.playSources" :key="playSource.id" class="source-item">
                <div class="source-info">
                  <span class="source-name">{{
                    playSource.sourceName || `播放源 ${playSource.id}`
                  }}</span>
                  <span class="source-meta"
                    >{{ playSource.resolution }} {{ playSource.format }}</span
                  >
                </div>
                <span class="source-status" :class="`status--${playSource.status}`">{{
                  getStatusText(playSource.status)
                }}</span>
              </div>
            </div>
            <div v-else class="empty-source">暂无可用播放源</div>
          </div>

          <div v-if="media.downloadUrls && media.downloadUrls.length > 0" class="sidebar-card">
            <h3 class="sidebar-title">下载链接</h3>
            <div v-if="downloadMessage" class="download-msg">{{ downloadMessage }}</div>
            <div class="download-list">
              <div v-for="(url, index) in media.downloadUrls" :key="index" class="download-item">
                <div class="download-info">
                  <span class="download-name">下载链接 {{ index + 1 }}</span>
                  <span class="download-url">{{ url }}</span>
                </div>
                <div class="download-actions">
                  <button class="btn-sm btn-primary" @click="queueDownloadTask(url, index)">
                    加入任务
                  </button>
                  <a
                    :href="url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-sm btn-outline"
                    >打开</a
                  >
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <div v-else class="error-state">加载失败</div>

    <button
      v-if="media && authStore.isAuthenticated"
      class="ai-fab"
      title="AI 推荐"
      @click="showAiChat = true"
    >
      AI
    </button>

    <AIChatPanel :visible="showAiChat" :context="aiContext" @close="showAiChat = false" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import MediaCard from '@/components/MediaCard.vue';
  import AIChatPanel from '@/components/AIChatPanel.vue';
  import TextClamp from '@/components/TextClamp.vue';
  import { useMediaStore } from '@/stores/media';
  import { useAuthStore } from '@/stores/auth';
  import { useDownloadsStore } from '@/stores/downloads';
  import { notifyError, notifyInfo, notifySuccess } from '@/composables/useModal';
  import { log } from '@/utils/logger';
  import type { MediaResource } from '@/types/media';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();
  const authStore = useAuthStore();
  const downloadsStore = useDownloadsStore();

  const media = ref<MediaResource | null>(null);
  const recommendations = ref<MediaResource[]>([]);
  const loading = ref(true);
  const recommendationsLoading = ref(false);
  const downloadMessage = ref('');
  const isFavorite = ref(false);
  const favoriteLoading = ref(false);
  const favoriteMessage = ref('');

  const syncFavoriteStatus = async (mediaId: number) => {
    if (!authStore.isAuthenticated) {
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
    favoriteMessage.value = '';
    try {
      media.value = await mediaStore.fetchMediaDetail(mediaId);
      await syncFavoriteStatus(mediaId);
      void loadRecommendations(mediaId);
    } catch (e) {
      log.error('MediaDetail', '加载媒体详情失败:', e);
    } finally {
      loading.value = false;
    }
  };

  const loadRecommendations = async (mediaId: number) => {
    recommendationsLoading.value = true;
    try {
      recommendations.value = await mediaStore.fetchRecommendations(mediaId, 6);
    } catch {
      recommendations.value = [];
    } finally {
      recommendationsLoading.value = false;
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  const goToWatch = () => {
    if (media.value) router.push(`/watch/${media.value.id}`);
  };
  const goToMediaDetail = (id: number) => router.push(`/media/${id}`);
  const goToFavorites = () => {
    router.push({
      name: 'favorites',
      query: { highlight: String(media.value?.id ?? '') },
    });
  };

  const toggleFavorite = async () => {
    if (!media.value) return;
    if (!authStore.isAuthenticated) {
      notifyInfo('提示', '登录后可收藏');
      void router.push('/login');
      return;
    }
    favoriteLoading.value = true;
    try {
      const next = await mediaStore.toggleFavorite(String(media.value.id), isFavorite.value);
      isFavorite.value = next;
      favoriteMessage.value = next
        ? `已收藏《${media.value.title}》`
        : `已取消收藏《${media.value.title}》`;
      next ? notifySuccess('收藏成功', '已添加到收藏夹') : notifyInfo('提示', '已取消收藏');
    } catch (e) {
      notifyError('操作失败', '收藏操作失败，请稍后重试');
    } finally {
      favoriteLoading.value = false;
    }
  };

  const getStatusText = (s: string) =>
    (
      ({ active: '可用', inactive: '不可用', error: '错误', checking: '检查中' }) as Record<
        string,
        string
      >
    )[s] || s;
  const formatDate = (d: string | Date) => (d ? new Date(d).toLocaleDateString('zh-CN') : '');
  const formatRating = (r: unknown) => (typeof r === 'number' ? r.toFixed(1) : '—');
  const formatPreferenceLabel = (v: string) =>
    (
      ({
        movie: '电影',
        tv_series: '电视剧',
        variety: '综艺',
        anime: '动漫',
        documentary: '纪录片',
      }) as Record<string, string>
    )[v] || v;

  const queueDownloadTask = (url: string, index: number) => {
    if (!media.value || !url) return;
    const task = downloadsStore.enqueueTask({
      url,
      fileName: `${media.value.title} · 链接 ${index + 1}`,
      sourceLabel: media.value.source || '详情页',
      mediaResourceId: media.value.id,
    });
    downloadsStore.startTask(task.id);
    downloadMessage.value = `已加入下载任务：${task.fileName}`;
  };

  const showAiChat = ref(false);
  const aiContext = computed(() => {
    if (!media.value) return undefined;
    return {
      title: media.value.title,
      year: media.value.releaseDate
        ? new Date(media.value.releaseDate).getFullYear().toString()
        : undefined,
      type: media.value.type,
      genres: media.value.genres,
      rating: media.value.rating,
    };
  });

  const visibleGenres = computed(() => media.value?.genres?.filter(Boolean).slice(0, 3) || []);
  const hiddenGenreCount = computed(() =>
    Math.max((media.value?.genres?.filter(Boolean).length || 0) - visibleGenres.value.length, 0),
  );

  onMounted(() => void loadMedia());
</script>

<style scoped>
  .media-detail {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
  }
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 100px 0;
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
    padding: 100px 0;
    color: var(--color-error);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 16px 24px 0;
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
    position: relative;
  }
  .back-btn:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
  .back-btn svg {
    width: 16px;
    height: 16px;
  }

  .detail-banner {
    position: relative;
    padding: 48px 0;
    overflow: hidden;
  }
  .banner-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(40px) brightness(0.3);
    transform: scale(1.2);
  }
  .banner-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(10, 15, 26, 0.6), var(--bg-page));
  }
  .banner-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 40px;
  }
  .poster-wrapper {
    width: 240px;
    height: 340px;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  }
  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .poster-placeholder {
    width: 100%;
    height: 100%;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
  }
  .detail-info {
    flex: 1;
    min-width: 0;
  }
  .detail-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .detail-desc {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.8;
    margin-bottom: 20px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .detail-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    font-size: 14px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }
  .meta-rating {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-warning-light);
    font-weight: 600;
  }
  .meta-rating svg {
    width: 16px;
    height: 16px;
  }
  .meta-item {
    padding: 4px 12px;
    background: var(--border-primary);
    border-radius: 6px;
  }
  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    max-width: 680px;
  }
  .tag {
    max-width: 128px;
    padding: 4px 14px;
    background: rgba(229, 9, 20, 0.15);
    color: var(--text-link-hover);
    border-radius: 8px;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag--more {
    color: var(--text-tertiary);
    background: var(--surface-muted);
  }
  .detail-extra {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .detail-extra strong {
    color: var(--text-primary);
  }
  .extra-line {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.6;
  }
  .extra-line strong {
    flex-shrink: 0;
    white-space: nowrap;
  }
  .detail-actions {
    display: flex;
    gap: 12px;
  }
  .btn-watch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-watch:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);
  }
  .btn-watch svg {
    width: 18px;
    height: 18px;
  }
  .btn-fav {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-fav:hover {
    background: var(--bg-tertiary);
  }
  .btn-fav--active {
    color: var(--color-error);
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
  }
  .btn-fav svg {
    width: 18px;
    height: 18px;
  }
  .fav-message {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
    padding: 10px 16px;
    background: rgba(229, 9, 20, 0.1);
    border-radius: 10px;
    font-size: 13px;
    color: var(--text-link-hover);
  }
  .fav-message__link {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .detail-body {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
  }
  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  .loading-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
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
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
  .empty-row {
    text-align: center;
    padding: 40px 0;
    color: var(--text-tertiary);
    font-size: 14px;
  }

  .sidebar-card {
    background: var(--bg-card);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid var(--border-primary);
  }
  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  .source-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .source-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
  }
  .source-name {
    font-size: 14px;
    font-weight: 500;
  }
  .source-meta {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 2px;
  }
  .source-status {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .status--active {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }
  .status--error {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light);
  }
  .status--inactive {
    background: rgba(245, 158, 11, 0.15);
    color: var(--color-warning-light);
  }
  .empty-source {
    font-size: 13px;
    color: var(--text-tertiary);
  }
  .download-msg {
    margin-bottom: 12px;
    padding: 10px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--color-success-light);
  }
  .download-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .download-item {
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
  }
  .download-name {
    font-size: 14px;
    font-weight: 500;
  }
  .download-url {
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 4px;
    display: block;
    word-break: break-all;
  }
  .download-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .btn-sm {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  .btn-primary {
    background: var(--color-brand-primary);
    color: white;
    border: none;
  }
  .btn-primary:hover {
    background: var(--color-brand-primary-dark);
  }
  .btn-outline {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-secondary);
  }
  .btn-outline:hover {
    background: var(--border-primary);
  }

  .detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  @media (max-width: 1024px) {
    .detail-body {
      grid-template-columns: 1fr;
    }
    .banner-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .poster-wrapper {
      width: 180px;
      height: 252px;
    }
    .detail-meta {
      justify-content: center;
    }
    .detail-tags {
      justify-content: center;
      margin-inline: auto;
    }
    .detail-extra {
      justify-content: center;
    }
    .detail-actions {
      justify-content: center;
    }
  }

  .ai-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    z-index: 8000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.4);
    transition: all 0.3s ease;
  }

  .ai-fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(229, 9, 20, 0.55);
  }

  @media (max-width: 640px) {
    .detail-title {
      font-size: 24px;
    }
    .detail-actions {
      flex-direction: column;
    }
    .btn-watch,
    .btn-fav {
      width: 100%;
      justify-content: center;
    }
    .ai-fab {
      bottom: 80px;
      right: 16px;
    }
    .detail-tags {
      flex-wrap: nowrap;
      justify-content: flex-start;
      max-width: 100%;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .tag {
      flex: 0 0 auto;
    }
  }
</style>
