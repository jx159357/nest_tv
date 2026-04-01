<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 瀵艰埅鏍?-->
    <nav class="bg-white shadow-sm">
      <div class="container-responsive">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">瑙嗛骞冲彴</router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900"> 棣栭〉 </router-link>
            <button class="text-gray-700 hover:text-gray-900" @click="handleLogout">
              閫�鍑虹櫥褰?
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 涓昏鍐呭 -->
    <main class="container-responsive py-8">
      <div class="grid-responsive">
        <!-- 宸︿晶鐢ㄦ埛淇℃伅 -->
        <div class="lg:col-span-1">
          <div class="card-responsive">
            <div class="text-center">
              <div
                class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <span class="text-2xl text-gray-500">
                  {{ getUserInitial() }}
                </span>
              </div>
              <h2 class="text-xl font-bold text-gray-900">{{ authStore.user?.username }}</h2>
              <p class="text-gray-600">{{ authStore.user?.email }}</p>
              <div class="mt-2">
                <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {{ authStore.user?.role }}
                </span>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">娉ㄥ唽鏃堕棿:</span>
                <span class="text-gray-900">{{ formatDate(authStore.user?.createdAt) }}</span>
              </div>
              <div v-if="authStore.user?.lastLoginAt" class="flex justify-between text-sm">
                <span class="text-gray-600">鏈�鍚庣櫥褰?</span>
                <span class="text-gray-900">{{ formatDate(authStore.user?.lastLoginAt) }}</span>
              </div>
              <div class="pt-4">
                <router-link
                  to="/watch-history"
                  class="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  鏌ョ湅瀹屾暣瑙傜湅鍘嗗彶
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 鍙充晶鍐呭鍖哄煙 -->
        <div class="lg:col-span-3 space-y-6">
          <!-- 缁熻淇℃伅 -->
          <div class="card-responsive">
            <h2 class="text-xl font-bold text-gray-900 mb-6">瑙傜湅缁熻</h2>

            <div v-if="statsLoading" class="text-center py-4">鍔犺浇涓?..</div>

            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div class="text-3xl font-bold text-indigo-600">{{ userStats.totalWatched }}</div>
                <div class="text-sm text-gray-600 mt-1">鎬昏鐪嬫暟</div>
              </div>

              <div class="text-center">
                <div class="text-3xl font-bold text-green-600">{{ userStats.completed }}</div>
                <div class="text-sm text-gray-600 mt-1">已看完</div>
              </div>

              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">
                  {{ formatWatchTime(userStats.totalWatchTime) }}
                </div>
                <div class="text-sm text-gray-600 mt-1">总观看时长</div>
              </div>
            </div>
          </div>

          <!-- 缁х画瑙傜湅 -->
          <div class="card-responsive">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-gray-900">缁х画瑙傜湅</h2>
              <router-link
                to="/continue-watching"
                class="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                鏌ョ湅鍏ㄩ儴
              </router-link>
            </div>

            <div v-if="continueLoading" class="text-center py-4">鍔犺浇涓?..</div>

            <div v-else-if="continueWatching.length > 0" class="space-y-4">
              <div
                v-for="item in continueWatching"
                :key="item.id"
                class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                @click="goToWatch(item)"
              >
                <div class="flex-shrink-0">
                  <img
                    v-if="item.mediaResource.poster"
                    :src="item.mediaResource.poster"
                    :alt="item.mediaResource.title"
                    class="w-16 h-16 object-cover rounded"
                  />
                  <div
                    v-else
                    class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"
                  >
                    <span class="text-gray-500 text-xs">鏆傛棤灏侀潰</span>
                  </div>
                </div>

                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ item.mediaResource.title }}</h3>
                  <div class="text-sm text-gray-600 mt-1">
                    瑙傜湅杩涘害: {{ formatProgress(item.currentTime, item.duration) }}
                  </div>
                </div>

                <div class="text-sm text-gray-500">
                  {{ formatDate(item.updatedAt) }}
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">暂无继续观看的内容</div>
          </div>

          <!-- 宸茬湅瀹?-->
          <div class="card-responsive">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-gray-900">已看完</h2>
              <router-link to="/completed" class="text-indigo-600 hover:text-indigo-500 text-sm">
                鏌ョ湅鍏ㄩ儴
              </router-link>
            </div>

            <div v-if="completedLoading" class="text-center py-4">鍔犺浇涓?..</div>

            <div v-else-if="completed.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="item in completed"
                :key="item.id"
                class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                @click="goToMediaDetail(item.mediaResource.id)"
              >
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <img
                      v-if="item.mediaResource.poster"
                      :src="item.mediaResource.poster"
                      :alt="item.mediaResource.title"
                      class="w-12 h-12 object-cover rounded"
                    />
                    <div
                      v-else
                      class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center"
                    >
                      <span class="text-gray-500 text-xs">鏆傛棤灏侀潰</span>
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 truncate">
                      {{ item.mediaResource.title }}
                    </h3>
                    <div class="text-sm text-gray-600">
                      {{ formatRating(item.mediaResource.rating) }} 鍒?
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">鏆傛棤宸茬湅瀹岀殑鍐呭</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { watchHistoryApi } from '@/api/watchHistory';

  const router = useRouter();
  const authStore = useAuthStore();

  const userStats = ref({
    totalWatched: 0,
    completed: 0,
    watching: 0,
    totalWatchTime: 0,
  });

  const continueWatching = ref([]);
  const completed = ref([]);
  const statsLoading = ref(false);
  const continueLoading = ref(false);
  const completedLoading = ref(false);

  const loadUserProfile = async () => {
    if (!authStore.user?.id) {
      await authStore.fetchUserProfile();
    }

    if (!authStore.user?.id) return;

    statsLoading.value = true;
    continueLoading.value = true;
    completedLoading.value = true;

    try {
      // 鍔犺浇鐢ㄦ埛缁熻
      const statsResponse = await watchHistoryApi.getUserStats(authStore.user.id);
      userStats.value = statsResponse;

      // 鍔犺浇缁х画瑙傜湅鍒楄〃
      const continueResponse = await watchHistoryApi.getContinueWatching(authStore.user.id, {
        limit: 5,
      });
      continueWatching.value = continueResponse;

      // 加载已看完列表
      const completedResponse = await watchHistoryApi.getCompleted(authStore.user.id, { limit: 4 });
      completed.value = completedResponse.data || [];
    } catch (error) {
      console.error('鍔犺浇鐢ㄦ埛鏁版嵁澶辫触:', error);
    } finally {
      statsLoading.value = false;
      continueLoading.value = false;
      completedLoading.value = false;
    }
  };

  const getUserInitial = () => {
    if (!authStore.user?.username) return 'U';
    return authStore.user.username.charAt(0).toUpperCase();
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const formatRating = rating => {
    return typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : '—';
  };

  const formatProgress = (currentTime, duration) => {
    if (!currentTime || !duration) return '0%';
    const percentage = Math.round((currentTime / duration) * 100);
    return `${percentage}%`;
  };

  const formatWatchTime = seconds => {
    if (!seconds) return '0灏忔椂';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}灏忔椂${minutes > 0 ? minutes + '鍒嗛挓' : ''}`;
    } else {
      return `${minutes}鍒嗛挓`;
    }
  };

  const goToWatch = item => {
    const mediaId = item?.mediaResource?.id;
    if (!mediaId) {
      return;
    }

    const currentTime = Number(item?.currentTime || 0);
    if (currentTime > 0) {
      router.push(`/watch/${mediaId}?time=${currentTime}`);
      return;
    }

    router.push(`/watch/${mediaId}`);
  };

  const goToMediaDetail = mediaId => {
    router.push(`/media/${mediaId}`);
  };

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };

  onMounted(() => {
    loadUserProfile();
  });
</script>






