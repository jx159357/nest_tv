<template>
  <div class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="mb-4 text-3xl font-bold text-gray-900">推荐内容</h1>
        <p class="text-gray-600">根据你的观看历史、偏好标签和全站热度，动态整理更适合你的内容。</p>
      </header>

      <section v-if="authStore.isAuthenticated" class="mb-10 rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900">你的偏好画像</h2>
            <p class="mt-2 text-sm text-gray-600">
              {{
                profile?.strategy === 'history-based'
                  ? '基于最近观看历史、完成度和偏好类型生成推荐。'
                  : '观看历史较少，当前先结合热门内容为你冷启动。'
              }}
            </p>
          </div>
          <button
            class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            :disabled="personalizedLoading || profileLoading"
            @click="refreshRecommendations"
          >
            {{ personalizedLoading || profileLoading ? '刷新中...' : '刷新推荐' }}
          </button>
        </div>

        <div v-if="profileLoading" class="py-8 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">正在分析偏好画像...</p>
        </div>

        <div v-else-if="profileError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ profileError }}
        </div>

        <div v-else-if="profile" class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-xs text-slate-500">观看记录</div>
            <div class="mt-2 text-2xl font-semibold text-slate-900">{{ profile.totalWatched }}</div>
            <div class="mt-1 text-xs text-slate-500">最近活跃 {{ profile.recentWatchCount }} 条</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-xs text-slate-500">完成率</div>
            <div class="mt-2 text-2xl font-semibold text-slate-900">
              {{ profile.averageCompletionRate }}%
            </div>
            <div class="mt-1 text-xs text-slate-500">完整看完 {{ profile.completedCount }} 条</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div class="text-xs text-slate-500">偏好类型 / 标签 / 导演</div>
            <div class="mt-3 space-y-3 text-sm text-slate-700">
              <div>
                <span class="font-medium">类型：</span>
                <span v-if="profile.favoriteTypes.length === 0" class="text-slate-500">暂无明显偏好</span>
                <span v-else class="flex flex-wrap gap-2 pt-2">
                  <span
                    v-for="item in profile.favoriteTypes"
                    :key="`type-${item.key}`"
                    class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                  >
                    {{ formatPreferenceLabel(item.key) }} · {{ item.score }}
                  </span>
                </span>
              </div>
              <div>
                <span class="font-medium">标签：</span>
                <span v-if="profile.favoriteGenres.length === 0" class="text-slate-500">暂无明显偏好</span>
                <span v-else class="flex flex-wrap gap-2 pt-2">
                  <span
                    v-for="item in profile.favoriteGenres"
                    :key="`genre-${item.key}`"
                    class="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700"
                  >
                    {{ item.key }} · {{ item.score }}
                  </span>
                </span>
              </div>
              <div>
                <span class="font-medium">导演：</span>
                <span v-if="profile.favoriteDirectors.length === 0" class="text-slate-500">暂无明显偏好</span>
                <span v-else class="flex flex-wrap gap-2 pt-2">
                  <span
                    v-for="item in profile.favoriteDirectors"
                    :key="`director-${item.key}`"
                    class="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700"
                  >
                    {{ item.key }} · {{ item.score }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="authStore.isAuthenticated" class="mb-12">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900">为你推荐</h2>
            <p class="mt-1 text-sm text-gray-600">带推荐理由的个性化结果，更容易看懂为什么推荐给你。</p>
          </div>
        </div>

        <div v-if="personalizedLoading" class="py-8 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">加载个性化推荐中...</p>
        </div>

        <div v-else-if="personalizedError" class="py-8 text-center">
          <p class="text-red-600">{{ personalizedError }}</p>
          <button class="mt-2 text-blue-500 hover:underline" @click="loadPersonalizedRecommendations">
            重试
          </button>
        </div>

        <div v-else-if="personalizedItems.length === 0" class="py-8 text-center text-gray-500">
          <p>暂无推荐内容</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MediaCard
            v-for="item in personalizedItems"
            :key="item.media.id"
            :media="item.media"
            @click="openMediaDetail"
          >
            <template #badge>
              <div class="space-y-2">
                <div class="text-xs font-medium text-slate-500">推荐分 {{ item.score.toFixed(1) }}</div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="reason in item.reasons"
                    :key="`${item.media.id}-${reason}`"
                    class="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700"
                  >
                    {{ reason }}
                  </span>
                </div>
              </div>
            </template>
          </MediaCard>
        </div>
      </section>

      <section class="mb-12">
        <h2 class="mb-6 text-2xl font-semibold text-gray-900">热门推荐</h2>

        <div v-if="popularLoading" class="py-8 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="popularError" class="py-8 text-center">
          <p class="text-red-600">{{ popularError }}</p>
        </div>

        <div v-else-if="popular.length === 0" class="py-8 text-center text-gray-500">
          <p>暂无热门内容</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MediaCard v-for="item in popular" :key="item.id" :media="item" @click="openMediaDetail" />
        </div>
      </section>

      <section class="mb-12">
        <h2 class="mb-6 text-2xl font-semibold text-gray-900">高分精选</h2>

        <div v-if="editorialLoading" class="py-8 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="editorialError" class="py-8 text-center">
          <p class="text-red-600">{{ editorialError }}</p>
        </div>

        <div v-else-if="editorial.length === 0" class="py-8 text-center text-gray-500">
          <p>暂无高分内容</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MediaCard v-for="item in editorial" :key="item.id" :media="item" @click="openMediaDetail" />
        </div>
      </section>

      <section>
        <h2 class="mb-6 text-2xl font-semibold text-gray-900">最新上新</h2>

        <div v-if="latestLoading" class="py-8 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="latestError" class="py-8 text-center">
          <p class="text-red-600">{{ latestError }}</p>
        </div>

        <div v-else-if="latest.length === 0" class="py-8 text-center text-gray-500">
          <p>暂无最新内容</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MediaCard v-for="item in latest" :key="item.id" :media="item" @click="openMediaDetail" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import {
    recommendationsApi,
    type PersonalizedRecommendationItem,
    type RecommendationProfile,
  } from '@/api/recommendations';
  import MediaCard from '@/components/MediaCard.vue';
  import type { MediaResource } from '@/types/media';

  const router = useRouter();
  const authStore = useAuthStore();

  const personalizedItems = ref<PersonalizedRecommendationItem[]>([]);
  const popular = ref<MediaResource[]>([]);
  const editorial = ref<MediaResource[]>([]);
  const latest = ref<MediaResource[]>([]);
  const profile = ref<RecommendationProfile | null>(null);

  const personalizedLoading = ref(false);
  const popularLoading = ref(false);
  const editorialLoading = ref(false);
  const latestLoading = ref(false);
  const profileLoading = ref(false);

  const personalizedError = ref<string | null>(null);
  const popularError = ref<string | null>(null);
  const editorialError = ref<string | null>(null);
  const latestError = ref<string | null>(null);
  const profileError = ref<string | null>(null);

  const openMediaDetail = (media: MediaResource) => {
    void router.push({ name: 'media-detail', params: { id: media.id } });
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

  const loadPersonalizedRecommendations = async () => {
    personalizedLoading.value = true;
    personalizedError.value = null;
    try {
      personalizedItems.value = await recommendationsApi.getPersonalizedDetailed(8);
    } catch (error: unknown) {
      console.error('加载个性化推荐失败:', error);
      personalizedError.value = getErrorMessage(error, '加载推荐失败');
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
      console.error('加载推荐画像失败:', error);
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
      console.error('加载热门推荐失败:', error);
      popularError.value = getErrorMessage(error, '加载推荐失败');
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
      console.error('加载高分推荐失败:', error);
      editorialError.value = getErrorMessage(error, '加载推荐失败');
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
      console.error('加载最新推荐失败:', error);
      latestError.value = getErrorMessage(error, '加载推荐失败');
    } finally {
      latestLoading.value = false;
    }
  };

  const refreshRecommendations = async () => {
    if (authStore.isAuthenticated) {
      await Promise.all([loadPersonalizedRecommendations(), loadRecommendationProfile()]);
      return;
    }

    await Promise.all([loadPopularRecommendations(), loadEditorialRecommendations(), loadLatestRecommendations()]);
  };

  onMounted(() => {
    if (authStore.isAuthenticated) {
      void loadRecommendationProfile();
      void loadPersonalizedRecommendations();
    }

    void loadPopularRecommendations();
    void loadEditorialRecommendations();
    void loadLatestRecommendations();
  });
</script>
