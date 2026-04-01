<template>
  <NavigationLayout>
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索视频..."
          class="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @keyup.enter="handleSearch"
        />
        <button
          class="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="handleSearch"
        >
          搜索
        </button>
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
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import type { MediaResource } from '@/types/media';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();

  const searchQuery = ref('');
  const searchResults = ref<MediaResource[]>([]);
  const popularMedia = ref<MediaResource[]>([]);
  const latestMedia = ref<MediaResource[]>([]);
  const topRatedMedia = ref<MediaResource[]>([]);

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

  const handleSearch = () => {
    if (!searchQuery.value.trim()) {
      return;
    }

    void router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() },
    });
  };

  const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
    searchError.value = null;
    void router.push({ path: '/' });
  };

  const goToMediaDetail = (id: number) => {
    void router.push(`/media/${id}`);
  };

  watch(
    () => activeSearchQuery.value,
    query => {
      searchQuery.value = query;

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
</script>
