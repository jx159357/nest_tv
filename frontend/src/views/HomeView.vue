<template>
  <NavigationLayout>
    <!-- 搜索区域 -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索视频..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @keyup.enter="handleSearch"
        />
        <button
          class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 热门视频 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">热门视频</h2>
      <div v-if="popularLoading" class="text-center py-8">
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

    <!-- 最新视频 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">最新视频</h2>
      <div v-if="latestLoading" class="text-center py-8">
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

    <!-- 高评分视频 -->
    <section>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">高评分视频</h2>
      <div v-if="topRatedLoading" class="text-center py-8">
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
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useMediaStore } from '@/stores/media';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import type { MediaResource } from '@/types/media';

  const router = useRouter();
  const authStore = useAuthStore();
  const mediaStore = useMediaStore();

  const searchQuery = ref('');
  const popularMedia = ref<MediaResource[]>([]);
  const latestMedia = ref<MediaResource[]>([]);
  const topRatedMedia = ref<MediaResource[]>([]);
  const popularLoading = ref(false);
  const latestLoading = ref(false);
  const topRatedLoading = ref(false);

  const loadHomeData = async () => {
    popularLoading.value = true;
    latestLoading.value = true;
    topRatedLoading.value = true;

    try {
      const [popular, latest, topRated] = await Promise.all([
        mediaStore['fetchPopularMedia'](8),
        mediaStore['fetchLatestMedia'](8),
        mediaStore['fetchTopRatedMedia'](8),
      ]);

      popularMedia.value = popular;
      latestMedia.value = latest;
      topRatedMedia.value = topRated;
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      popularLoading.value = false;
      latestLoading.value = false;
      topRatedLoading.value = false;
    }
  };

  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      router.push({
        path: '/search',
        query: { q: searchQuery.value.trim() },
      });
    }
  };

  const goToMediaDetail = (id: number) => {
    router.push(`/media/${id}`);
  };

  onMounted(() => {
    loadHomeData();
  });
</script>
