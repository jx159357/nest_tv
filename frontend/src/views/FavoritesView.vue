<template>
  <NavigationLayout>
    <div class="space-y-8">
      <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">我的收藏</h1>
          <p class="mt-2 text-sm text-gray-600">集中查看你收藏的影视内容，支持翻页分享与刷新后恢复上下文。</p>
        </div>
      </header>

      <section
        v-if="highlightedFavoritePreview"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
        data-testid="highlighted-favorite-banner"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-amber-900">刚加入收藏</h2>
            <p class="mt-1 text-sm text-amber-700">
              {{
                highlightedFavoriteInList
                  ? '已在当前收藏列表中为你高亮显示，可直接定位查看。'
                  : '当前分页里未展示该条目，先为你固定显示，避免翻页后找不到。'
              }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="highlightedFavoriteInList"
              class="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              @click="scrollToHighlightedFavorite"
            >
              定位到列表
            </button>
            <button
              v-else
              class="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              @click="goToMediaDetail(highlightedFavoritePreview.id)"
            >
              打开详情
            </button>
            <button
              class="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              data-testid="dismiss-highlight"
              @click="dismissHighlight"
            >
              知道了
            </button>
          </div>
        </div>

        <div v-if="!highlightedFavoriteInList" class="mt-4 max-w-sm" data-testid="highlighted-favorite-pinned">
          <div class="rounded-2xl ring-2 ring-amber-300 ring-offset-2 ring-offset-amber-50">
            <MediaCard :media="highlightedFavoritePreview" @click="goToMediaDetail(highlightedFavoritePreview.id)" />
          </div>
        </div>
      </section>

      <section>
        <div v-if="loading" class="py-10 text-center">
          <LoadingSpinner text="加载中..." />
        </div>

        <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ error }}
        </div>

        <template v-else-if="favorites.length > 0">
          <div class="grid-responsive">
            <div
              v-for="media in favorites"
              :key="media.id"
              class="rounded-2xl transition-all duration-300"
              :class="media.id === highlightedFavoriteId ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-amber-50' : ''"
              :data-highlighted="media.id === highlightedFavoriteId ? 'true' : undefined"
              :data-testid="media.id === highlightedFavoriteId ? 'favorite-highlighted' : undefined"
            >
              <MediaCard :media="media" @click="goToMediaDetail(media.id)" />
            </div>
          </div>

          <div
            v-if="pagination.totalPages > 1"
            class="mt-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600"
          >
            <span>
              显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} 到
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条，共
              {{ pagination.total }} 条
            </span>
            <div class="flex items-center gap-3">
              <button
                :disabled="pagination.page <= 1"
                class="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                @click="changePage(pagination.page - 1)"
              >
                上一页
              </button>
              <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
              <button
                :disabled="pagination.page >= pagination.totalPages"
                class="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                @click="changePage(pagination.page + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </template>

        <EmptyState v-else title="暂无收藏内容" description="去首页挑一些喜欢的内容收藏起来吧" icon="film" />
      </section>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { mediaApi } from '@/api/media';
  import { useMediaStore } from '@/stores/media';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import type { MediaResource } from '@/types/media';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();

  const favorites = ref<MediaResource[]>([]);
  const activeHighlightId = ref<number | null>(null);
  const highlightedPinnedFavorite = ref<MediaResource | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

  const readHighlightedQuery = () => {
    const queryValue = Number(readSingleQuery(route.query.highlight));
    return Number.isFinite(queryValue) && queryValue > 0 ? queryValue : null;
  };

  const highlightedFavoriteId = computed(() => {
    return activeHighlightId.value;
  });

  const highlightedFavoriteInList = computed(
    () => favorites.value.find(media => media.id === highlightedFavoriteId.value) ?? null,
  );

  const highlightedFavoritePreview = computed(
    () => highlightedFavoriteInList.value ?? highlightedPinnedFavorite.value,
  );

  const syncPageFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    pagination.value.page = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
  };

  const buildFavoritesQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};
    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    return query;
  };

  const dismissHighlight = async () => {
    activeHighlightId.value = null;
    highlightedPinnedFavorite.value = null;

    if (readHighlightedQuery()) {
      await router.replace({
        name: 'favorites',
        query: buildFavoritesQuery(pagination.value.page),
      });
    }
  };

  const scrollToHighlightedFavorite = async () => {
    await nextTick();

    const highlightedElement = document.querySelector<HTMLElement>('[data-highlighted="true"]');
    highlightedElement?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  const syncHighlightedFavorite = async () => {
    if (!highlightedFavoriteId.value) {
      highlightedPinnedFavorite.value = null;
      return;
    }

    if (highlightedFavoriteInList.value) {
      highlightedPinnedFavorite.value = null;
      await scrollToHighlightedFavorite();
      return;
    }

    try {
      highlightedPinnedFavorite.value = await mediaApi.getMediaById(String(highlightedFavoriteId.value));
    } catch (highlightError) {
      console.error('加载高亮收藏预览失败:', highlightError);
      highlightedPinnedFavorite.value = null;
    }
  };

  const changePage = async (nextPage: number) => {
    await router.replace({
      name: 'favorites',
      query: buildFavoritesQuery(nextPage),
    });
  };

  const loadFavorites = async (nextPage = pagination.value.page) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await mediaStore.fetchFavorites({
        page: nextPage,
        limit: pagination.value.limit,
      });

      favorites.value = response.data || [];
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      };

      if (response.page !== nextPage) {
        await router.replace({
          name: 'favorites',
          query: buildFavoritesQuery(response.page),
        });
        return;
      }

      await syncHighlightedFavorite();
    } catch (loadError) {
      favorites.value = [];
      highlightedPinnedFavorite.value = null;
      error.value = loadError instanceof Error ? loadError.message : '加载收藏内容失败';
    } finally {
      loading.value = false;
    }
  };

  const goToMediaDetail = (id: number) => {
    void router.push(`/media/${id}`);
  };

  watch(
    () => route.query,
    () => {
      const routeHighlightId = readHighlightedQuery();
      if (routeHighlightId) {
        activeHighlightId.value = routeHighlightId;
      }

      syncPageFromRoute();
      void loadFavorites(pagination.value.page);
    },
    { immediate: true },
  );
</script>
