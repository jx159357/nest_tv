<template>
  <NavigationLayout>
    <div class="mb-8">
      <div ref="searchPanelRef" class="relative flex items-center space-x-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索视频..."
          class="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @focus="openSearchSuggestions"
          @keyup.enter="handleSearch"
          @keyup.esc="showSearchSuggestions = false"
        />
        <button
          class="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="handleSearch"
        >
          搜索
        </button>

        <div
          v-if="showSearchSuggestions && hasSearchSuggestions"
          class="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
        >
          <section v-if="recentSuggestionItems.length > 0">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="text-xs font-semibold text-gray-400">最近搜索</div>
              <button
                type="button"
                class="text-xs font-semibold text-gray-400 hover:text-gray-600"
                @mousedown.prevent="clearSearchHistory"
              >
                清空
              </button>
            </div>
            <button
              v-for="item in recentSuggestionItems"
              :key="`recent-${item}`"
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @mousedown.prevent="selectSuggestion(item)"
            >
              <span>{{ item }}</span>
              <span class="text-xs text-gray-400">最近搜索</span>
            </button>
          </section>

          <section v-if="keywordSuggestionItems.length > 0" :class="{ 'mt-3 border-t border-gray-100 pt-3': recentSuggestionItems.length > 0 }">
            <div class="mb-2 text-xs font-semibold text-gray-400">
              {{ normalizedSearchQuery ? '推荐搜索' : '热门搜索' }}
            </div>
            <button
              v-for="item in keywordSuggestionItems"
              :key="`${item.source}-${item.text}`"
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @mousedown.prevent="selectSuggestion(item.text)"
            >
              <span>{{ item.text }}</span>
              <span class="text-xs text-gray-400">{{ item.meta }}</span>
            </button>
          </section>
        </div>
      </div>
    </div>

    <section v-if="isSearchMode" class="mb-12">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">搜索结果</h2>
          <p class="mt-1 text-sm text-gray-600">关键词：{{ activeSearchQuery }}</p>
        </div>
        <button
          class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          @click="clearSearch"
        >
          返回首页推荐
        </button>
      </div>

      <div v-if="searchLoading" class="py-8 text-center">
        <LoadingSpinner text="加载中..." />
      </div>
      <div v-else-if="searchError" class="py-8 text-center text-red-600">
        {{ searchError }}
      </div>
      <div v-else-if="searchResults.length > 0" class="grid-responsive">
        <MediaCard
          v-for="media in searchResults"
          :key="media.id"
          :media="media"
          @click="goToMediaDetail(media.id)"
        />
      </div>
      <EmptyState v-else title="暂无搜索结果" description="换个关键词试试" icon="search" />
    </section>

    <template v-else>
      <section class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-gray-900">热门视频</h2>
        <div v-if="popularLoading" class="py-8 text-center">
          <LoadingSpinner text="加载中..." />
        </div>
        <div v-else-if="popularMedia.length > 0" class="grid-responsive">
          <MediaCard
            v-for="media in popularMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <EmptyState v-else title="暂无热门视频" description="敬请期待更多精彩内容" icon="film" />
      </section>

      <section class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-gray-900">最新视频</h2>
        <div v-if="latestLoading" class="py-8 text-center">
          <LoadingSpinner text="加载中..." />
        </div>
        <div v-else-if="latestMedia.length > 0" class="grid-responsive">
          <MediaCard
            v-for="media in latestMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <EmptyState v-else title="暂无最新视频" description="敬请期待更多精彩内容" icon="film" />
      </section>

      <section>
        <h2 class="mb-6 text-2xl font-bold text-gray-900">高评分视频</h2>
        <div v-if="topRatedLoading" class="py-8 text-center">
          <LoadingSpinner text="加载中..." />
        </div>
        <div v-else-if="topRatedMedia.length > 0" class="grid-responsive">
          <MediaCard
            v-for="media in topRatedMedia"
            :key="media.id"
            :media="media"
            @click="goToMediaDetail(media.id)"
          />
        </div>
        <EmptyState v-else title="暂无高评分视频" description="敬请期待更多精彩内容" icon="film" />
      </section>
    </template>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { searchApi, type SearchSuggestionItem } from '@/api/search';
  import { notifyError, notifySuccess } from '@/composables/useModal';
  import { useMediaStore } from '@/stores/media';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import type { MediaResource } from '@/types/media';
  import {
    clearRecentSearches,
    dedupeKeywords,
    filterRecentSearches,
    normalizeSearchKeyword,
    readRecentSearches,
    saveRecentSearch,
  } from '@/utils/search-suggestions';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();

  const searchPanelRef = ref<HTMLElement | null>(null);
  const searchQuery = ref('');
  const searchResults = ref<MediaResource[]>([]);
  const popularMedia = ref<MediaResource[]>([]);
  const latestMedia = ref<MediaResource[]>([]);
  const topRatedMedia = ref<MediaResource[]>([]);
  const recentSearches = ref<string[]>(readRecentSearches());
  const serverRecentSearches = ref<string[]>([]);
  const remoteSuggestions = ref<SearchSuggestionItem[]>([]);
  const popularKeywords = ref<string[]>([]);
  const showSearchSuggestions = ref(false);
  const hasLoadedPopularKeywords = ref(false);
  const hasLoadedSearchHistory = ref(false);
  let searchRequestId = 0;

  const searchLoading = ref(false);
  const popularLoading = ref(false);
  const latestLoading = ref(false);
  const topRatedLoading = ref(false);
  const searchError = ref<string | null>(null);

  const activeSearchQuery = computed(() => {
    const value = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q;
    return typeof value === 'string' ? value.trim() : '';
  });

  const isSearchMode = computed(() => activeSearchQuery.value.length > 0);
  const normalizedSearchQuery = computed(() => normalizeSearchKeyword(searchQuery.value));

  const recentSuggestionItems = computed(() => {
    return filterRecentSearches(
      dedupeKeywords([...serverRecentSearches.value, ...recentSearches.value], 8),
      normalizedSearchQuery.value,
      4,
    );
  });

  const formatSuggestionMeta = (type: SearchSuggestionItem['type']) => {
    const labelMap: Record<SearchSuggestionItem['type'], string> = {
      keyword: '关键词',
      title: '片名',
      actor: '主演',
      director: '导演',
      genre: '类型',
    };

    return labelMap[type] || '推荐';
  };

  const keywordSuggestionItems = computed(() => {
    if (!normalizedSearchQuery.value) {
      return dedupeKeywords(popularKeywords.value, 6).map(keyword => ({
        text: keyword,
        source: 'popular',
        meta: '热门搜索',
      }));
    }

    const recentKeys = new Set(recentSuggestionItems.value.map(item => item.toLocaleLowerCase()));
    return remoteSuggestions.value
      .filter(item => !recentKeys.has(item.text.toLocaleLowerCase()))
      .slice(0, 6)
      .map(item => ({
        text: item.text,
        source: item.type,
        meta: formatSuggestionMeta(item.type),
      }));
  });

  const hasSearchSuggestions = computed(
    () => recentSuggestionItems.value.length > 0 || keywordSuggestionItems.value.length > 0,
  );

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
    } catch (error) {
      console.error('加载首页数据失败:', error);
    } finally {
      popularLoading.value = false;
      latestLoading.value = false;
      topRatedLoading.value = false;
    }
  };

  const loadSearchResults = async (query: string) => {
    searchLoading.value = true;
    searchError.value = null;

    try {
      const response = await mediaStore.searchMedia(query, { page: 1, limit: 12 });
      searchResults.value = response.data || [];
    } catch (error) {
      console.error('搜索媒体失败:', error);
      searchResults.value = [];
      searchError.value = error instanceof Error ? error.message : '搜索失败';
    } finally {
      searchLoading.value = false;
    }
  };

  const loadPopularKeywords = async () => {
    if (hasLoadedPopularKeywords.value) {
      return;
    }

    hasLoadedPopularKeywords.value = true;

    try {
      popularKeywords.value = dedupeKeywords(await searchApi.getPopularKeywords(6), 6);
    } catch (error) {
      console.error('加载热门搜索失败:', error);
      popularKeywords.value = [];
    }
  };

  const loadSearchHistory = async () => {
    if (hasLoadedSearchHistory.value) {
      return;
    }

    hasLoadedSearchHistory.value = true;

    try {
      serverRecentSearches.value = dedupeKeywords(await searchApi.getHistory(8), 8);
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      serverRecentSearches.value = [];
    }
  };

  const persistSearchHistory = (keyword: string) => {
    serverRecentSearches.value = dedupeKeywords([keyword, ...serverRecentSearches.value], 8);
    hasLoadedSearchHistory.value = true;

    void searchApi.recordHistory({ keyword }).catch(error => {
      console.error('记录搜索历史失败:', error);
    });
  };

  const clearSearchHistory = () => {
    recentSearches.value = clearRecentSearches();
    serverRecentSearches.value = [];
    hasLoadedSearchHistory.value = true;

    void searchApi.clearHistory().catch(error => {
      console.error('清空搜索历史失败:', error);
      notifyError('清空失败', '搜索历史清空失败，请稍后重试。');
    });

    notifySuccess('搜索历史已清空', '最近搜索和服务端搜索历史都已重置。');
  };

  const loadRemoteSuggestions = async (keyword: string) => {
    const nextKeyword = normalizeSearchKeyword(keyword);
    if (!nextKeyword || nextKeyword.length < 2) {
      remoteSuggestions.value = [];
      if (!nextKeyword) {
        await loadPopularKeywords();
      }
      return;
    }

    const currentRequestId = ++searchRequestId;

    try {
      const suggestions = await searchApi.getSuggestions(nextKeyword, 6);
      if (currentRequestId !== searchRequestId) {
        return;
      }

      remoteSuggestions.value = suggestions;
    } catch (error) {
      if (currentRequestId !== searchRequestId) {
        return;
      }

      console.error('加载搜索建议失败:', error);
      remoteSuggestions.value = [];
    }
  };

  const openSearchSuggestions = () => {
    showSearchSuggestions.value = true;
    void loadSearchHistory();
    void loadRemoteSuggestions(searchQuery.value);
  };

  const handleSearch = () => {
    const keyword = normalizedSearchQuery.value;
    if (!keyword) {
      return;
    }

    recentSearches.value = saveRecentSearch(keyword);
    persistSearchHistory(keyword);
    showSearchSuggestions.value = false;

    void router.push({
      path: '/search',
      query: { q: keyword },
    });
  };

  const selectSuggestion = (keyword: string) => {
    searchQuery.value = keyword;
    handleSearch();
  };

  const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
    searchError.value = null;
    showSearchSuggestions.value = false;
    void router.push({ path: '/' });
  };

  const goToMediaDetail = (id: number) => {
    void router.push(`/media/${id}`);
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (searchPanelRef.value && !searchPanelRef.value.contains(event.target as Node)) {
      showSearchSuggestions.value = false;
    }
  };

  watch(
    () => searchQuery.value,
    value => {
      if (!showSearchSuggestions.value) {
        return;
      }

      void loadRemoteSuggestions(value);
    },
  );

  watch(
    () => activeSearchQuery.value,
    query => {
      searchQuery.value = query;
      showSearchSuggestions.value = false;

      if (query) {
        void loadSearchResults(query);
        return;
      }

      searchResults.value = [];
      searchError.value = null;
      void loadHomeData();
    },
    { immediate: true },
  );

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick);
  });
</script>
