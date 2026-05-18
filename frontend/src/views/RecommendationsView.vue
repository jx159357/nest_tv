<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="page-title">推荐中心</h1>
      <p class="page-desc">
        结合你的观看历史、收藏兴趣、搜索线索和站内内容热度，持续生成更贴近偏好的推荐结果。
      </p>
    </header>

    <section
      v-if="authStore.isAuthenticated"
      class="section-card profile-section"
      :class="{ 'profile-section--focused': focusedSection === 'profile' }"
    >
      <div v-if="focusedSection === 'profile'" class="profile-hint">
        已从"推荐设置"入口进入，可先查看你的偏好画像，再刷新个性化推荐。
      </div>

      <div class="profile-header">
        <div>
          <h2 class="section-title">偏好画像</h2>
          <p class="section-desc">{{ strategyDescription }}</p>
        </div>
        <button
          class="btn-primary"
          :disabled="personalizedLoading || profileLoading"
          @click="refreshRecommendations"
        >
          {{ personalizedLoading || profileLoading ? '刷新中...' : '刷新推荐' }}
        </button>
      </div>

      <div v-if="profileLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在分析你的推荐画像...</p>
      </div>

      <div v-else-if="profileError" class="error-state">
        {{ profileError }}
      </div>

      <div v-else-if="profile" class="profile-stats">
        <div class="stat-card">
          <div class="stat-label">观看记录</div>
          <div class="stat-value">{{ profile.totalWatched }}</div>
          <div class="stat-sub">近期活跃 {{ profile.recentWatchCount }} 条</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">完成度</div>
          <div class="stat-value">{{ profile.averageCompletionRate }}%</div>
          <div class="stat-sub">已看完 {{ profile.completedCount }} 条</div>
        </div>
        <div class="stat-card stat-card--wide">
          <div class="stat-label">偏好类型 / 标签 / 导演 / 搜索兴趣</div>
          <div class="preference-list">
            <div class="preference-group">
              <span class="preference-key">偏好类型：</span>
              <span v-if="profile.favoriteTypes.length === 0" class="preference-empty">暂无明显偏好</span>
              <span v-else class="preference-tags">
                <span
                  v-for="item in profile.favoriteTypes"
                  :key="`type-${item.key}`"
                  class="tag tag--type"
                >
                  {{ formatPreferenceLabel(item.key) }} · {{ item.score }}
                </span>
              </span>
            </div>

            <div class="preference-group">
              <span class="preference-key">偏好标签：</span>
              <span v-if="profile.favoriteGenres.length === 0" class="preference-empty">暂无明显偏好</span>
              <span v-else class="preference-tags">
                <span
                  v-for="item in profile.favoriteGenres"
                  :key="`genre-${item.key}`"
                  class="tag tag--genre"
                >
                  {{ item.key }} · {{ item.score }}
                </span>
              </span>
            </div>

            <div class="preference-group">
              <span class="preference-key">导演偏好：</span>
              <span v-if="profile.favoriteDirectors.length === 0" class="preference-empty">暂无明显偏好</span>
              <span v-else class="preference-tags">
                <span
                  v-for="item in profile.favoriteDirectors"
                  :key="`director-${item.key}`"
                  class="tag tag--director"
                >
                  {{ item.key }} · {{ item.score }}
                </span>
              </span>
            </div>

            <div class="preference-group">
              <span class="preference-key">最近搜索：</span>
              <span v-if="profile.recentSearchKeywords.length === 0" class="preference-empty">暂无明显搜索兴趣</span>
              <span v-else class="preference-tags">
                <span
                  v-for="item in profile.recentSearchKeywords"
                  :key="`search-${item.key}`"
                  class="tag tag--search"
                >
                  {{ item.key }} · {{ item.score }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="authStore.isAuthenticated" class="section-card">
      <div class="section-header">
        <div>
          <h2 class="section-title">搜索兴趣</h2>
          <p class="section-desc">
            结合你最近搜索过的内容，提供一个更直接的继续探索入口。
          </p>
        </div>
        <button
          class="btn-outline"
          :disabled="searchHistoryLoading || searchHistory.length === 0"
          @click="clearSearchHistory"
        >
          {{ searchHistoryLoading ? '处理中...' : '清空搜索历史' }}
        </button>
      </div>

      <div v-if="searchHistoryLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载搜索兴趣...</p>
      </div>

      <div v-else-if="searchHistoryError" class="error-state">
        {{ searchHistoryError }}
      </div>

      <div v-else-if="searchHistory.length === 0" class="empty-hint">
        暂无服务端搜索历史。你在顶部搜索或首页搜索后，这里会逐步形成你的搜索兴趣画像。
      </div>

      <div v-else class="search-interests">
        <div>
          <div class="group-label">最近搜索</div>
          <div class="keyword-list">
            <button
              v-for="keyword in searchHistory"
              :key="`history-${keyword}`"
              type="button"
              class="keyword-btn"
              @click="searchByKeyword(keyword)"
            >
              {{ keyword }}
            </button>
          </div>
        </div>

        <div v-if="relatedKeywords.length > 0">
          <div class="group-label">继续探索 {{ searchHistory[0] }}</div>
          <div class="keyword-list">
            <button
              v-for="keyword in relatedKeywords"
              :key="`related-${keyword}`"
              type="button"
              class="keyword-btn keyword-btn--related"
              @click="searchByKeyword(keyword)"
            >
              {{ keyword }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="authStore.isAuthenticated" class="section-block">
      <div class="section-header">
        <div>
          <h2 class="section-title">为你推荐</h2>
          <p class="section-desc">
            展示推荐理由，帮助你快速理解这条内容为什么值得现在打开。
          </p>
        </div>
      </div>

      <div v-if="personalizedLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载个性化推荐...</p>
      </div>

      <div v-else-if="personalizedError" class="loading-state">
        <p class="error-text">{{ personalizedError }}</p>
        <button class="btn-link" @click="loadPersonalizedRecommendations">重试</button>
      </div>

      <div v-else-if="personalizedItems.length === 0" class="loading-state">
        <p>暂无个性化推荐</p>
      </div>

      <div v-else class="media-grid">
        <MediaCard
          v-for="item in personalizedItems"
          :key="item.media.id"
          :media="item.media"
          @click="openMediaDetail"
        >
          <template #badge>
            <div class="recommend-badge">
              <div class="recommend-score">推荐分 {{ item.score.toFixed(1) }}</div>
              <div class="recommend-reasons">
                <span
                  v-for="reason in item.reasons"
                  :key="`${item.media.id}-${reason}`"
                  class="reason-tag"
                >
                  {{ reason }}
                </span>
              </div>
            </div>
          </template>
        </MediaCard>
      </div>
    </section>

    <section class="section-block">
      <h2 class="section-title">热门推荐</h2>

      <div v-if="popularLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="popularError" class="loading-state">
        <p class="error-text">{{ popularError }}</p>
      </div>

      <div v-else-if="popular.length === 0" class="loading-state">
        <p>暂无热门推荐</p>
      </div>

      <div v-else class="media-grid">
        <MediaCard v-for="item in popular" :key="item.id" :media="item" @click="openMediaDetail" />
      </div>
    </section>

    <section class="section-block">
      <h2 class="section-title">高分精选</h2>

      <div v-if="editorialLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="editorialError" class="loading-state">
        <p class="error-text">{{ editorialError }}</p>
      </div>

      <div v-else-if="editorial.length === 0" class="loading-state">
        <p>暂无高分内容</p>
      </div>

      <div v-else class="media-grid">
        <MediaCard
          v-for="item in editorial"
          :key="item.id"
          :media="item"
          @click="openMediaDetail"
        />
      </div>
    </section>

    <section class="section-block">
      <h2 class="section-title">最新上架</h2>

      <div v-if="latestLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="latestError" class="loading-state">
        <p class="error-text">{{ latestError }}</p>
      </div>

      <div v-else-if="latest.length === 0" class="loading-state">
        <p>暂无最新内容</p>
      </div>

      <div v-else class="media-grid">
        <MediaCard v-for="item in latest" :key="item.id" :media="item" @click="openMediaDetail" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { searchApi } from '@/api/search';
  import { useAuthStore } from '@/stores/auth';
  import {
    recommendationsApi,
    type PersonalizedRecommendationItem,
    type RecommendationProfile,
  } from '@/api/recommendations';
  import MediaCard from '@/components/MediaCard.vue';
  import type { MediaResource } from '@/types/media';
  import { log } from '@/utils/logger';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const focusedSection = computed(() => {
    const value = Array.isArray(route.query.focus) ? route.query.focus[0] : route.query.focus;
    return value === 'profile' ? value : null;
  });

  const personalizedItems = ref<PersonalizedRecommendationItem[]>([]);
  const popular = ref<MediaResource[]>([]);
  const editorial = ref<MediaResource[]>([]);
  const latest = ref<MediaResource[]>([]);
  const profile = ref<RecommendationProfile | null>(null);
  const searchHistory = ref<string[]>([]);
  const relatedKeywords = ref<string[]>([]);

  const personalizedLoading = ref(false);
  const popularLoading = ref(false);
  const editorialLoading = ref(false);
  const latestLoading = ref(false);
  const profileLoading = ref(false);
  const searchHistoryLoading = ref(false);

  const personalizedError = ref<string | null>(null);
  const popularError = ref<string | null>(null);
  const editorialError = ref<string | null>(null);
  const latestError = ref<string | null>(null);
  const profileError = ref<string | null>(null);
  const searchHistoryError = ref<string | null>(null);

  const strategyDescription = computed(() => {
    if (!profile.value) {
      return '根据你的观看、收藏和搜索信号动态更新推荐。';
    }

    if (profile.value.strategy === 'history-based') {
      return '当前推荐主要基于你的观看历史、完成度和偏好标签生成。';
    }

    if (profile.value.strategy === 'search-based') {
      return '当前观看历史较少，已结合你最近搜索的兴趣关键词生成推荐。';
    }

    return '当前画像信号较少，先优先展示站内热门内容。';
  });

  const clearPersonalizedState = () => {
    personalizedItems.value = [];
    profile.value = null;
    personalizedError.value = null;
    profileError.value = null;
  };

  const openMediaDetail = (media: MediaResource) => {
    void router.push({ name: 'media-detail', params: { id: media.id } });
  };

  const searchByKeyword = (keyword: string) => {
    void router.push({ path: '/search', query: { q: keyword } });
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const formatPreferenceLabel = (value: string) => {
    const labelMap: Record<string, string> = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };

    return labelMap[value] || value;
  };

  const loadRelatedKeywords = async (keyword: string) => {
    try {
      relatedKeywords.value = await searchApi.getRelatedKeywords(keyword, 6);
    } catch (error: unknown) {
      log.error('Recommendations', '加载相关搜索建议失败:', error);
      relatedKeywords.value = [];
    }
  };

  const loadSearchHistory = async () => {
    if (!authStore.isAuthenticated) {
      searchHistory.value = [];
      relatedKeywords.value = [];
      return;
    }

    searchHistoryLoading.value = true;
    searchHistoryError.value = null;

    try {
      searchHistory.value = await searchApi.getHistory(8);
      if (searchHistory.value.length > 0) {
        await loadRelatedKeywords(searchHistory.value[0]);
      } else {
        relatedKeywords.value = [];
      }
    } catch (error: unknown) {
      log.error('Recommendations', '加载搜索历史失败:', error);
      searchHistory.value = [];
      relatedKeywords.value = [];
      searchHistoryError.value = getErrorMessage(error, '加载搜索历史失败');
    } finally {
      searchHistoryLoading.value = false;
    }
  };

  const clearSearchHistory = async () => {
    if (!authStore.isAuthenticated || searchHistory.value.length === 0) {
      return;
    }

    searchHistoryLoading.value = true;
    searchHistoryError.value = null;

    try {
      await searchApi.clearHistory();
      searchHistory.value = [];
      relatedKeywords.value = [];
    } catch (error: unknown) {
      log.error('Recommendations', '清空搜索历史失败:', error);
      searchHistoryError.value = getErrorMessage(error, '清空搜索历史失败');
    } finally {
      searchHistoryLoading.value = false;
    }
  };

  const loadPersonalizedRecommendations = async () => {
    personalizedLoading.value = true;
    personalizedError.value = null;
    try {
      personalizedItems.value = await recommendationsApi.getPersonalizedDetailed(8);
    } catch (error: unknown) {
      log.error('Recommendations', '加载个性化推荐失败:', error);
      personalizedItems.value = [];
      personalizedError.value = getErrorMessage(error, '加载个性化推荐失败');
    } finally {
      personalizedLoading.value = false;
    }
  };

  const loadRecommendationProfile = async () => {
    if (!authStore.isAuthenticated) {
      profile.value = null;
      return;
    }

    profileLoading.value = true;
    profileError.value = null;
    try {
      profile.value = await recommendationsApi.getProfile();
    } catch (error: unknown) {
      log.error('Recommendations', '加载推荐画像失败:', error);
      profile.value = null;
      profileError.value = getErrorMessage(error, '加载推荐画像失败');
    } finally {
      profileLoading.value = false;
    }
  };

  const loadPopularRecommendations = async () => {
    popularLoading.value = true;
    popularError.value = null;
    try {
      popular.value = await recommendationsApi.getTrending(8);
    } catch (error: unknown) {
      log.error('Recommendations', '加载热门推荐失败:', error);
      popularError.value = getErrorMessage(error, '加载热门推荐失败');
    } finally {
      popularLoading.value = false;
    }
  };

  const loadEditorialRecommendations = async () => {
    editorialLoading.value = true;
    editorialError.value = null;
    try {
      editorial.value = await recommendationsApi.getTopRated(8);
    } catch (error: unknown) {
      log.error('Recommendations', '加载高分推荐失败:', error);
      editorialError.value = getErrorMessage(error, '加载高分推荐失败');
    } finally {
      editorialLoading.value = false;
    }
  };

  const loadLatestRecommendations = async () => {
    latestLoading.value = true;
    latestError.value = null;
    try {
      latest.value = await recommendationsApi.getLatest(8);
    } catch (error: unknown) {
      log.error('Recommendations', '加载最新推荐失败:', error);
      latestError.value = getErrorMessage(error, '加载最新推荐失败');
    } finally {
      latestLoading.value = false;
    }
  };

  const refreshRecommendations = async () => {
    if (authStore.isAuthenticated) {
      clearPersonalizedState();
      await Promise.all([loadPersonalizedRecommendations(), loadRecommendationProfile()]);
      return;
    }

    await Promise.all([
      loadPopularRecommendations(),
      loadEditorialRecommendations(),
      loadLatestRecommendations(),
    ]);
  };

  onMounted(() => {
    void loadPopularRecommendations();
    void loadEditorialRecommendations();
    void loadLatestRecommendations();
    void loadSearchHistory();
  });

  watch(
    () => authStore.token,
    token => {
      if (!token) {
        clearPersonalizedState();
        searchHistory.value = [];
        relatedKeywords.value = [];
        searchHistoryError.value = null;
        return;
      }

      clearPersonalizedState();
      void loadRecommendationProfile();
      void loadPersonalizedRecommendations();
      void loadSearchHistory();
    },
    { immediate: true },
  );
</script>

<style scoped>
  .page-container {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-title {
    font-size: 30px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .page-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .section-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 40px;
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
  }

  .section-block {
    margin-bottom: 48px;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .section-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .profile-section--focused {
    ring: 2px solid var(--color-brand-primary);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }

  .profile-hint {
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
    font-size: 13px;
    color: var(--color-brand-primary-light);
  }

  .profile-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (min-width: 1024px) {
    .profile-header {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .profile-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 24px;
  }

  @media (min-width: 768px) {
    .profile-stats {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (min-width: 1280px) {
    .profile-stats {
      grid-template-columns: 1fr 1fr 2fr;
    }
  }

  .stat-card {
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid var(--border-primary);
  }

  .stat-card--wide {
    grid-column: 1 / -1;
  }

  @media (min-width: 1280px) {
    .stat-card--wide {
      grid-column: auto;
    }
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .preference-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .preference-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preference-key {
    font-weight: 500;
    color: var(--text-primary);
  }

  .preference-empty {
    color: var(--text-muted);
  }

  .preference-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
  }

  .tag--type {
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-brand-primary-light);
  }

  .tag--genre {
    background: rgba(16, 185, 129, 0.12);
    color: var(--color-success-light);
  }

  .tag--director {
    background: rgba(245, 158, 11, 0.12);
    color: var(--color-warning-light);
  }

  .tag--search {
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--bg-tertiary);
    border-top-color: var(--color-brand-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.08);
    font-size: 13px;
    color: var(--color-error-light);
  }

  .error-text {
    color: var(--color-error-light);
  }

  .empty-hint {
    margin-top: 24px;
    padding: 16px;
    border-radius: 12px;
    border: 1px dashed var(--border-primary);
    background: var(--bg-secondary);
    font-size: 13px;
    color: var(--text-muted);
  }

  .search-interests {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-top: 24px;
  }

  .group-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .keyword-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .keyword-btn:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
    color: var(--color-brand-primary-light);
  }

  .keyword-btn--related {
    background: rgba(99, 102, 241, 0.06);
    color: var(--color-brand-primary-light);
    border-color: transparent;
  }

  .keyword-btn--related:hover {
    background: rgba(99, 102, 241, 0.12);
  }

  .btn-primary {
    padding: 10px 20px;
    border-radius: 10px;
    background: var(--color-brand-primary);
    color: white;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background: var(--color-brand-primary-dark);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-outline {
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-secondary);
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-outline:hover {
    background: var(--bg-secondary);
  }

  .btn-outline:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-link {
    margin-top: 8px;
    background: none;
    border: none;
    color: var(--color-brand-primary-light);
    font-size: 14px;
    cursor: pointer;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  @media (max-width: 640px) {
    .media-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
  }

  .recommend-badge {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .recommend-score {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
  }

  .recommend-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .reason-tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    background: rgba(99, 102, 241, 0.08);
    color: var(--color-brand-primary-light);
  }
</style>
