<template>
  <NavigationLayout>
    <div class="space-y-8">
      <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">我的收藏</h1>
          <p class="mt-2 text-sm text-gray-600">集中查看你收藏的影视内容，支持翻页分享与刷新后恢复上下文。</p>
        </div>
      </header>

      <section>
        <div v-if="loading" class="py-10 text-center">
          <LoadingSpinner text="加载中..." />
        </div>

        <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ error }}
        </div>

        <template v-else-if="favorites.length > 0">
          <div class="grid-responsive">
            <MediaCard
              v-for="media in favorites"
              :key="media.id"
              :media="media"
              @click="goToMediaDetail(media.id)"
            />
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
  import { ref, watch } from 'vue';
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

  const favorites = ref<MediaResource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

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
      }
    } catch (loadError) {
      favorites.value = [];
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
      syncPageFromRoute();
      void loadFavorites(pagination.value.page);
    },
    { immediate: true },
  );
</script>
