<template>
  <NavigationLayout>
    <div v-if="loading" class="py-16 text-center">
      <LoadingSpinner text="加载中..." />
    </div>

    <div v-else-if="media" class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <section class="space-y-6 lg:col-span-2">
        <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-[320px_minmax(0,1fr)]">
            <div class="overflow-hidden rounded-2xl bg-slate-100">
              <img v-if="media.poster" :src="media.poster" :alt="media.title" class="h-full w-full object-cover" />
              <div v-else class="flex aspect-[2/3] items-center justify-center text-sm text-slate-400">暂无封面</div>
            </div>

            <div class="space-y-5">
              <div>
                <h1 class="text-3xl font-bold text-slate-900">{{ media.title }}</h1>
                <p v-if="media.description" class="mt-3 text-sm leading-6 text-slate-600">
                  {{ media.description }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  ⭐ {{ formatRating(media.rating) }}/10
                </span>
                <span>播放 {{ media.viewCount || 0 }}</span>
                <span v-if="media.releaseDate">上映 {{ formatDate(media.releaseDate) }}</span>
                <span v-if="media.episodeCount">共 {{ media.episodeCount }} 集</span>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                  {{ formatPreferenceLabel(media.type) }}
                </span>
                <span
                  v-for="genre in media.genres || []"
                  :key="genre"
                  class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {{ genre }}
                </span>
              </div>

              <dl class="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div v-if="media.director">
                  <dt class="font-medium text-slate-800">导演</dt>
                  <dd class="mt-1">{{ media.director }}</dd>
                </div>
                <div v-if="media.actors">
                  <dt class="font-medium text-slate-800">主演</dt>
                  <dd class="mt-1">{{ media.actors }}</dd>
                </div>
                <div v-if="media.source">
                  <dt class="font-medium text-slate-800">来源平台</dt>
                  <dd class="mt-1">{{ media.source }}</dd>
                </div>
              </dl>

              <div class="flex flex-col gap-3 sm:flex-row">
                <button
                  class="w-full rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 sm:flex-1"
                  @click="goToWatch"
                >
                  立即观看
                </button>
                <button
                  class="w-full rounded-xl border px-6 py-3 font-medium transition-colors sm:w-auto"
                  :class="
                    isFavorite
                      ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  "
                  :disabled="favoriteLoading"
                  @click="toggleFavorite"
                >
                  {{ favoriteLoading ? '处理中...' : isFavorite ? '已收藏' : '加入收藏' }}
                </button>
              </div>

              <div
                v-if="favoriteMessage"
                class="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
              >
                <span>{{ favoriteMessage }}</span>
                <button v-if="isFavorite" class="font-medium text-amber-800 hover:underline" @click="goToFavorites">
                  查看收藏
                </button>
              </div>
            </div>
          </div>
        </div>

        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">相关推荐</h2>
              <p class="mt-1 text-sm text-slate-500">基于同类内容和当前画像推荐的相近作品。</p>
            </div>
          </div>

          <div v-if="recommendationsLoading" class="py-8 text-center">
            <LoadingSpinner text="加载中..." />
          </div>
          <div v-else-if="recommendations.length === 0" class="py-8 text-center text-sm text-slate-500">
            暂无相关推荐
          </div>
          <div v-else class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MediaCard
              v-for="item in recommendations"
              :key="item.id"
              :media="item"
              @click="goToMediaDetail(item.id)"
            />
          </div>
        </section>
      </section>

      <aside class="space-y-6">
        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">播放源</h2>
          <div v-if="media.playSources && media.playSources.length > 0" class="mt-4 space-y-3">
            <div
              v-for="playSource in media.playSources"
              :key="playSource.id"
              class="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-medium text-slate-900">{{ playSource.sourceName || `播放源 ${playSource.id}` }}</div>
                  <div class="mt-1 text-xs text-slate-500">{{ playSource.resolution }} {{ playSource.format }}</div>
                </div>
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    playSource.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : playSource.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700',
                  ]"
                >
                  {{ getStatusText(playSource.status) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="mt-4 text-sm text-slate-500">暂无可用播放源</div>
        </section>

        <section v-if="media.downloadUrls && media.downloadUrls.length > 0" class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">下载链接</h2>
              <p class="mt-1 text-sm text-slate-500">可直接打开原始链接，或加入下载任务统一管理。</p>
            </div>
            <router-link
              to="/downloads"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              查看任务
            </router-link>
          </div>

          <div
            v-if="downloadMessage"
            class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          >
            {{ downloadMessage }}
          </div>

          <div class="space-y-2">
            <div
              v-for="(url, index) in media.downloadUrls"
              :key="index"
              class="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div class="min-w-0 flex-1">
                <div class="font-medium text-slate-900">下载链接 {{ index + 1 }}</div>
                <div class="mt-1 break-all text-xs text-slate-500">{{ url }}</div>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  @click="queueDownloadTask(url, index)"
                >
                  加入任务
                </button>
                <a
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  打开原链
                </a>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <div v-else class="py-16 text-center text-red-500">加载失败</div>
  </NavigationLayout>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import { useMediaStore } from '@/stores/media';
  import { useAuthStore } from '@/stores/auth';
  import { useDownloadsStore } from '@/stores/downloads';
  import { notifyError, notifyInfo, notifySuccess } from '@/composables/useModal';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();
  const authStore = useAuthStore();
  const downloadsStore = useDownloadsStore();

  const media = ref(null);
  const recommendations = ref([]);
  const loading = ref(true);
  const recommendationsLoading = ref(false);
  const downloadMessage = ref('');
  const isFavorite = ref(false);
  const favoriteLoading = ref(false);
  const favoriteMessage = ref('');

  const syncFavoriteStatus = async mediaId => {
    if (!authStore.isAuthenticated) {
      isFavorite.value = false;
      return;
    }

    try {
      isFavorite.value = await mediaStore.fetchFavoriteStatus(String(mediaId));
    } catch (error) {
      console.error('加载收藏状态失败:', error);
      isFavorite.value = false;
    }
  };

  const loadMedia = async () => {
    const mediaId = parseInt(route.params.id);
    loading.value = true;
    favoriteMessage.value = '';

    try {
      const mediaData = await mediaStore.fetchMediaDetail(mediaId);
      media.value = mediaData;
      await syncFavoriteStatus(mediaId);
      void loadRecommendations(mediaId);
    } catch (error) {
      console.error('加载媒体详情失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const loadRecommendations = async mediaId => {
    recommendationsLoading.value = true;

    try {
      const data = await mediaStore.fetchRecommendations(mediaId, 6);
      recommendations.value = data;
    } catch (error) {
      console.error('加载推荐失败:', error);
    } finally {
      recommendationsLoading.value = false;
    }
  };

  const goToWatch = () => {
    router.push(`/watch/${media.value.id}`);
  };

  const goToFavorites = () => {
    router.push({
      name: 'favorites',
      query: { highlight: String(media.value.id) },
    });
  };

  const toggleFavorite = async () => {
    if (!media.value) {
      return;
    }

    if (!authStore.isAuthenticated) {
      notifyInfo('登录后可收藏', '登录后即可将内容加入收藏夹。');
      void router.push('/login');
      return;
    }

    favoriteLoading.value = true;
    favoriteMessage.value = '';

    try {
      const nextState = await mediaStore.toggleFavorite(String(media.value.id), isFavorite.value);
      isFavorite.value = nextState;
      favoriteMessage.value = nextState
        ? `已将《${media.value.title}》加入收藏`
        : `已将《${media.value.title}》移出收藏`;

      if (nextState) {
        notifySuccess('收藏已更新', `已将《${media.value.title}》加入收藏，可前往“我的收藏”继续查看。`);
      } else {
        notifyInfo('收藏已更新', `已将《${media.value.title}》从收藏中移除。`);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      notifyError('收藏操作失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      favoriteLoading.value = false;
    }
  };

  const goToMediaDetail = id => {
    router.push(`/media/${id}`);
  };

  const getStatusText = status => {
    const statusMap = {
      active: '可用',
      inactive: '不可用',
      error: '错误',
      checking: '检查中',
    };
    return statusMap[status] || status;
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const formatRating = rating => {
    return typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : '—';
  };

  const formatPreferenceLabel = value => {
    const labelMap = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };

    return labelMap[value] || value;
  };

  const queueDownloadTask = (url, index) => {
    if (!media.value || !url) {
      downloadMessage.value = '当前资源暂无可加入的下载链接';
      return;
    }

    const task = downloadsStore.enqueueTask({
      url,
      fileName: `${media.value.title} · 下载链接 ${index + 1}`,
      sourceLabel: media.value.source || '详情页',
      mediaResourceId: media.value.id,
      metadata: {
        title: media.value.title,
        description: media.value.description,
        duration: media.value.duration,
      },
    });

    downloadsStore.startTask(task.id);
    downloadMessage.value = `已加入下载任务：${task.fileName}`;
  };

  onMounted(() => {
    void loadMedia();
  });
</script>
