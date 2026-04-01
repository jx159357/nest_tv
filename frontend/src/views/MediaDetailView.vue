<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 瀵艰埅鏍?-->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">瑙嗛骞冲彴</router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900"> 杩斿洖棣栭〉 </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 涓昏鍐呭 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4">鍔犺浇涓?..</p>
      </div>

      <div v-else-if="media" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 濯掍綋淇℃伅涓诲尯鍩?-->
        <div class="lg:col-span-2 space-y-6">
          <!-- 灏侀潰鍜屽熀鏈俊鎭?-->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    v-if="media.poster"
                    :src="media.poster"
                    :alt="media.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                    <span class="text-gray-500">鏆傛棤灏侀潰</span>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h1 class="text-3xl font-bold text-gray-900">{{ media.title }}</h1>

                <div class="flex items-center space-x-4">
                  <div class="flex items-center">
                    <span class="text-yellow-400 text-lg">★</span>
                    <span class="ml-1 text-gray-900 font-semibold">{{
                      formatRating(media.rating)
                    }}</span>
                    <span class="text-gray-500">/10</span>
                  </div>

                  <div class="text-gray-500">观看 {{ media.viewCount }} 次</div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {{ media.type }}
                  </span>
                  <span
                    v-for="genre in media.genres"
                    :key="genre"
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {{ genre }}
                  </span>
                </div>

                <div v-if="media.director" class="text-gray-600">
                  <strong>瀵兼紨:</strong> {{ media.director }}
                </div>

                <div v-if="media.actors" class="text-gray-600">
                  <strong>涓绘紨:</strong> {{ media.actors }}
                </div>

                <div v-if="media.releaseDate" class="text-gray-600">
                  <strong>涓婃槧鏃堕棿:</strong> {{ formatDate(media.releaseDate) }}
                </div>

                <div v-if="media.episodeCount" class="text-gray-600">
                  <strong>鍓ч泦鏁?</strong> {{ media.episodeCount }} 闆?
                </div>

                <button
                  class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  @click="goToWatch"
                >
                  绔嬪嵆瑙傜湅
                </button>
              </div>
            </div>
          </div>

          <!-- 绠�浠?-->
          <div v-if="media.description" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">简介</h2>
            <p class="text-gray-700 leading-relaxed">{{ media.description }}</p>
          </div>

          <!-- 鐩稿叧鎺ㄨ崘 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">鐩稿叧鎺ㄨ崘</h2>
            <div v-if="recommendationsLoading" class="text-center py-4">鍔犺浇涓?..</div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="recommendation in recommendations"
                :key="recommendation.id"
                class="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                @click="goToMediaDetail(recommendation.id)"
              >
                <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    v-if="recommendation.poster"
                    :src="recommendation.poster"
                    :alt="recommendation.title"
                    class="w-full h-32 object-cover"
                  />
                  <div v-else class="w-full h-32 flex items-center justify-center bg-gray-200">
                    <span class="text-gray-500">鏆傛棤灏侀潰</span>
                  </div>
                </div>
                <div class="p-3">
                  <h3 class="font-medium text-gray-900 text-sm line-clamp-2">
                    {{ recommendation.title }}
                  </h3>
                  <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>璇勫垎: {{ formatRating(recommendation.rating) }}</span>
                    <span>瑙傜湅: {{ recommendation.viewCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 渚ц竟鏍?-->
        <div class="space-y-6">
          <!-- 鎾斁婧愪俊鎭?-->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">播放源</h3>
            <div v-if="media.playSources && media.playSources.length > 0" class="space-y-3">
              <div
                v-for="playSource in media.playSources"
                :key="playSource.id"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ playSource.sourceName || `鎾斁婧?${playSource.id}` }}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      {{ playSource.resolution }} {{ playSource.format }}
                    </div>
                  </div>
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs',
                      playSource.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : playSource.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800',
                    ]"
                  >
                    {{ getStatusText(playSource.status) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-sm">暂无可用播放源</div>
          </div>

          <!-- 涓嬭浇閾炬帴 -->
          <div
            v-if="media.downloadUrls && media.downloadUrls.length > 0"
            class="bg-white rounded-lg shadow-sm p-6"
          >
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">涓嬭浇閾炬帴</h3>
                <p class="mt-1 text-sm text-gray-500">可直接打开原始链接，或加入下载任务列表统一管理。</p>
              </div>
              <router-link
                to="/downloads"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                鏌ョ湅浠诲姟
              </router-link>
            </div>
            <div
              v-if="downloadMessage"
              class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              {{ downloadMessage }}
            </div>
            <div class="space-y-2">
              <div
                v-for="(url, index) in media.downloadUrls"
                :key="index"
                class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900">涓嬭浇閾炬帴 {{ index + 1 }}</div>
                  <div class="mt-1 break-all text-xs text-gray-500">{{ url }}</div>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button
                    class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    @click="queueDownloadTask(url, index)"
                  >
                    鍔犲叆浠诲姟
                  </button>
                  <a
                    :href="url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    鎵撳紑鍘熼摼
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- 鏉ユ簮淇℃伅 -->
          <div v-if="media.source" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">鏉ユ簮淇℃伅</h3>
            <div class="text-gray-600">鏉ユ簮骞冲彴: {{ media.source }}</div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-red-400">鍔犺浇澶辫触</p>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMediaStore } from '@/stores/media';
  import { useDownloadsStore } from '@/stores/downloads';

  const route = useRoute();
  const router = useRouter();
  const mediaStore = useMediaStore();
  const downloadsStore = useDownloadsStore();

  const media = ref(null);
  const recommendations = ref([]);
  const loading = ref(true);
  const recommendationsLoading = ref(false);
  const downloadMessage = ref('');

  const loadMedia = async () => {
    const mediaId = parseInt(route.params.id);
    loading.value = true;

    try {
      const mediaData = await mediaStore.fetchMediaDetail(mediaId);
      media.value = mediaData;

      // 鍔犺浇鎺ㄨ崘鍐呭
      loadRecommendations(mediaId);
    } catch (error) {
      console.error('鍔犺浇濯掍綋璇︽儏澶辫触:', error);
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
      console.error('鍔犺浇鎺ㄨ崘澶辫触:', error);
    } finally {
      recommendationsLoading.value = false;
    }
  };

  const goToWatch = () => {
    router.push(`/watch/${media.value.id}`);
  };

  const goToMediaDetail = id => {
    router.push(`/media/${id}`);
  };

  const getStatusText = status => {
    const statusMap = {
      active: '鍙敤',
      inactive: '不可用',
      error: '閿欒',
      checking: '妫�鏌ヤ腑',
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

  const queueDownloadTask = (url, index) => {
    if (!media.value || !url) {
      downloadMessage.value = '褰撳墠璧勬簮鏆傛棤鍙姞鍏ョ殑涓嬭浇閾炬帴';
      return;
    }

    const task = downloadsStore.enqueueTask({
      url,
      fileName: `${media.value.title} 路 涓嬭浇閾炬帴 ${index + 1}`,
      sourceLabel: media.value.source || '详情页',
      mediaResourceId: media.value.id,
      metadata: {
        title: media.value.title,
        description: media.value.description,
        duration: media.value.duration,
      },
    });

    downloadsStore.startTask(task.id);
    downloadMessage.value = `宸插姞鍏ヤ笅杞戒换鍔★細${task.fileName}`;
  };

  onMounted(() => {
    loadMedia();
  });
</script>







