<template>
  <NavigationLayout>
    <div class="space-y-8">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">个人中心</h1>
          <p class="mt-2 text-sm text-gray-600">聚合你的观看、收藏、搜索和推荐画像，形成一个更完整的兴趣中心。</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            @click="goToRecommendations"
          >
            推荐设置
          </button>
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            @click="goToSearchHistory"
          >
            搜索历史
          </button>
          <button
            class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            @click="handleLogout"
          >
            退出登录
          </button>
        </div>
      </header>

      <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside class="space-y-6">
          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-500">
                {{ getUserInitial() }}
              </div>
              <h2 class="text-xl font-bold text-gray-900">{{ authStore.user?.nickname || authStore.user?.username }}</h2>
              <p class="mt-1 text-sm text-gray-500">{{ authStore.user?.email }}</p>
              <div class="mt-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                {{ authStore.user?.role }}
              </div>
            </div>

            <dl class="mt-6 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-gray-500">注册时间</dt>
                <dd class="text-gray-900">{{ formatDate(authStore.user?.createdAt) }}</dd>
              </div>
              <div v-if="authStore.user?.lastLoginAt" class="flex items-center justify-between gap-4">
                <dt class="text-gray-500">最近登录</dt>
                <dd class="text-gray-900">{{ formatDate(authStore.user?.lastLoginAt) }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">快捷入口</h2>
            <div class="mt-4 space-y-3">
              <router-link
                to="/watch-history"
                class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>观看历史</span>
                <span>→</span>
              </router-link>
              <router-link
                to="/favorites"
                class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>我的收藏</span>
                <span>→</span>
              </router-link>
              <router-link
                to="/search-history"
                class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>搜索历史</span>
                <span>→</span>
              </router-link>
              <router-link
                :to="{ name: 'recommendations', query: { focus: 'profile' } }"
                class="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>推荐设置</span>
                <span>→</span>
              </router-link>
            </div>
          </section>
        </aside>

        <div class="space-y-6">
          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="text-xl font-bold text-gray-900">观看统计</h2>
            <div v-if="statsLoading" class="py-6 text-center">
              <LoadingSpinner text="加载中..." />
            </div>
            <div v-else class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs text-slate-500">总观看数</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ userStats.totalWatched }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs text-slate-500">已看完</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ userStats.completed }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs text-slate-500">总观看时长</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ formatWatchTime(userStats.totalWatchTime) }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs text-slate-500">收藏数</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ favoriteSummary.total }}</div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">兴趣中心</h2>
                <p class="mt-2 text-sm text-gray-600">把观看偏好、最近搜索和收藏内容放到一个视图里，方便快速回到感兴趣的方向。</p>
              </div>
              <router-link
                :to="{ name: 'recommendations', query: { focus: 'profile' } }"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                打开推荐画像
              </router-link>
            </div>

            <div v-if="interestLoading" class="py-6 text-center">
              <LoadingSpinner text="加载中..." />
            </div>
            <div v-else-if="interestError" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ interestError }}
            </div>
            <div v-else class="mt-6 grid gap-6 lg:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">推荐画像</div>
                <div class="mt-3 text-sm text-slate-600">
                  {{ getStrategyDescription() }}
                </div>
                <div class="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <div class="font-medium">偏好类型</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span v-for="item in recommendationProfile.favoriteTypes" :key="`type-${item.key}`" class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                        {{ formatPreferenceLabel(item.key) }} · {{ item.score }}
                      </span>
                      <span v-if="recommendationProfile.favoriteTypes.length === 0" class="text-slate-500">暂无明显偏好</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium">偏好标签</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span v-for="item in recommendationProfile.favoriteGenres" :key="`genre-${item.key}`" class="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                        {{ item.key }} · {{ item.score }}
                      </span>
                      <span v-if="recommendationProfile.favoriteGenres.length === 0" class="text-slate-500">暂无明显偏好</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium">最近搜索</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button
                        v-for="item in recommendationProfile.recentSearchKeywords"
                        :key="`search-${item.key}`"
                        type="button"
                        class="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700 transition-colors hover:bg-violet-200"
                        @click="searchByKeyword(item.key)"
                      >
                        {{ item.key }} · {{ item.score }}
                      </button>
                      <span v-if="recommendationProfile.recentSearchKeywords.length === 0" class="text-slate-500">暂无搜索兴趣</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">近期收藏</div>
                <div v-if="favoriteSummary.items.length > 0" class="mt-4 space-y-3">
                  <button
                    v-for="media in favoriteSummary.items"
                    :key="media.id"
                    type="button"
                    class="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-100"
                    @click="goToMediaDetail(media.id)"
                  >
                    <div>
                      <div class="font-medium text-slate-900">{{ media.title }}</div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ formatPreferenceLabel(media.type) }} · {{ formatRating(media.rating) }}
                      </div>
                    </div>
                    <span class="text-slate-400">→</span>
                  </button>
                </div>
                <div v-else class="mt-4 text-sm text-slate-500">暂无收藏内容</div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-bold text-gray-900">继续观看</h2>
              <router-link to="/continue-watching" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">查看全部</router-link>
            </div>

            <div v-if="continueLoading" class="py-6 text-center">
              <LoadingSpinner text="加载中..." />
            </div>
            <div v-else-if="continueWatching.length > 0" class="mt-6 space-y-4">
              <button
                v-for="item in continueWatching"
                :key="item.id"
                type="button"
                class="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
                data-testid="continue-item"
                @click="goToWatch(item)"
              >
                <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-200">
                  <img v-if="item.mediaResource.poster" :src="item.mediaResource.poster" :alt="item.mediaResource.title" class="h-full w-full object-cover" />
                  <span v-else class="text-xs text-slate-500">暂无封面</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium text-slate-900">{{ item.mediaResource.title }}</div>
                  <div class="mt-1 text-sm text-slate-500">观看进度：{{ formatProgress(item.currentTime, item.duration) }}</div>
                </div>
                <div class="text-xs text-slate-400">{{ formatDate(item.updatedAt) }}</div>
              </button>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-500">暂无继续观看内容</div>
          </section>

          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-bold text-gray-900">已看完</h2>
              <router-link to="/completed" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">查看全部</router-link>
            </div>

            <div v-if="completedLoading" class="py-6 text-center">
              <LoadingSpinner text="加载中..." />
            </div>
            <div v-else-if="completed.length > 0" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="item in completed"
                :key="item.id"
                type="button"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
                @click="goToMediaDetail(item.mediaResource.id)"
              >
                <div class="truncate font-medium text-slate-900">{{ item.mediaResource.title }}</div>
                <div class="mt-2 text-sm text-slate-500">评分：{{ formatRating(item.mediaResource.rating) }}</div>
              </button>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-500">暂无已看完内容</div>
          </section>
        </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import { useAuthStore } from '@/stores/auth';
  import { watchHistoryApi, type WatchHistoryItem, type WatchHistoryStats } from '@/api/watchHistory';
  import { recommendationsApi, type RecommendationProfile } from '@/api/recommendations';
  import { searchApi } from '@/api/search';
  import { mediaApi } from '@/api/media';
  import type { MediaResource } from '@/types/media';

  const router = useRouter();
  const authStore = useAuthStore();

  const userStats = ref<WatchHistoryStats>({
    totalWatched: 0,
    completed: 0,
    watching: 0,
    totalWatchTime: 0,
  });

  const recommendationProfile = ref<RecommendationProfile>({
    strategy: 'fallback-trending',
    totalWatched: 0,
    completedCount: 0,
    recentWatchCount: 0,
    averageCompletionRate: 0,
    favoriteTypes: [],
    favoriteGenres: [],
    favoriteDirectors: [],
    recentSearchKeywords: [],
  });

  const favoriteSummary = ref<{ total: number; items: MediaResource[] }>({
    total: 0,
    items: [],
  });

  const continueWatching = ref<WatchHistoryItem[]>([]);
  const completed = ref<WatchHistoryItem[]>([]);
  const statsLoading = ref(false);
  const continueLoading = ref(false);
  const completedLoading = ref(false);
  const interestLoading = ref(false);
  const interestError = ref<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const loadUserProfile = async () => {
    if (!authStore.user?.id) {
      await authStore.fetchUserProfile();
    }

    if (!authStore.user?.id) {
      return;
    }

    statsLoading.value = true;
    continueLoading.value = true;
    completedLoading.value = true;
    interestLoading.value = true;
    interestError.value = null;

    try {
      const [statsResponse, continueResponse, completedResponse, recommendationResponse, searchHistory, favoritesResponse] = await Promise.all([
        watchHistoryApi.getUserStats(authStore.user.id),
        watchHistoryApi.getContinueWatching(authStore.user.id, { limit: 5 }),
        watchHistoryApi.getCompleted(authStore.user.id, { limit: 4 }),
        recommendationsApi.getProfile(),
        searchApi.getHistory(6),
        mediaApi.getFavorites({ page: 1, limit: 4 }),
      ]);

      userStats.value = statsResponse;
      continueWatching.value = continueResponse;
      completed.value = completedResponse.data || [];
      recommendationProfile.value = {
        ...recommendationResponse,
        recentSearchKeywords: recommendationResponse.recentSearchKeywords?.length
          ? recommendationResponse.recentSearchKeywords
          : (searchHistory || []).map((keyword: string, index: number) => ({
              key: keyword,
              score: Math.max(1, 6 - index),
            })),
      };
      favoriteSummary.value = {
        total: favoritesResponse.total || 0,
        items: favoritesResponse.data || [],
      };
    } catch (error) {
      console.error('加载个人中心数据失败:', error);
      interestError.value = getErrorMessage(error, '加载兴趣中心失败');
    } finally {
      statsLoading.value = false;
      continueLoading.value = false;
      completedLoading.value = false;
      interestLoading.value = false;
    }
  };

  const getUserInitial = () => {
    const username = authStore.user?.username || authStore.user?.nickname;
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const formatRating = (rating?: number) => {
    return typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : '—';
  };

  const formatProgress = (currentTime?: number, duration?: number) => {
    if (!currentTime || !duration) return '0%';
    return `${Math.round((currentTime / duration) * 100)}%`;
  };

  const formatWatchTime = (seconds?: number) => {
    if (!seconds) return '0小时';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
    }

    return `${minutes}分钟`;
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

  const getStrategyDescription = () => {
    switch (recommendationProfile.value.strategy) {
      case 'history-based':
        return '推荐画像主要来自你的观看历史、完成度和偏好标签。';
      case 'search-based':
        return '当前观看历史较少，推荐会更多参考你最近搜索过的内容方向。';
      default:
        return '当前画像信号较少，系统会优先为你展示站内热门内容。';
    }
  };

  const goToWatch = (item: any) => {
    const mediaId = item?.mediaResource?.id;
    if (!mediaId) {
      return;
    }

    const currentTime = Number(item?.currentTime || 0);
    if (currentTime > 0) {
      void router.push(`/watch/${mediaId}?time=${currentTime}`);
      return;
    }

    void router.push(`/watch/${mediaId}`);
  };

  const goToMediaDetail = (mediaId: number) => {
    void router.push(`/media/${mediaId}`);
  };

  const goToRecommendations = () => {
    void router.push({ name: 'recommendations', query: { focus: 'profile' } });
  };

  const goToSearchHistory = () => {
    void router.push('/search-history');
  };

  const searchByKeyword = (keyword: string) => {
    void router.push({ path: '/search', query: { q: keyword } });
  };

  const handleLogout = () => {
    authStore.logout();
    void router.push('/login');
  };

  onMounted(() => {
    void loadUserProfile();
  });
</script>
