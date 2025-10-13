<template>
  <div class="recommendations-page">
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">推荐内容</h1>
        <p class="text-gray-600">根据您的观看历史和偏好为您推荐</p>
      </header>

      <!-- 个性化推荐 -->
      <section v-if="authStore.isAuthenticated" class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-gray-900">为您推荐</h2>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            :disabled="personalizedLoading"
            @click="refreshRecommendations"
          >
            {{ personalizedLoading ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div v-if="personalizedLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          ></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="personalizedError" class="text-center py-8">
          <p class="text-red-600">{{ personalizedError }}</p>
          <button
            class="mt-2 text-blue-500 hover:underline"
            @click="loadPersonalizedRecommendations"
          >
            重试
          </button>
        </div>

        <div v-else-if="personalized.length === 0" class="text-center py-8 text-gray-500">
          <p>暂无推荐内容</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 推荐内容将在这里显示 -->
        </div>
      </section>

      <!-- 热门推荐 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-900 mb-6">热门推荐</h2>

        <div v-if="popularLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          ></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="popularError" class="text-center py-8">
          <p class="text-red-600">{{ popularError }}</p>
        </div>

        <div v-else-if="popular.length === 0" class="text-center py-8 text-gray-500">
          <p>暂无热门内容</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 热门内容将在这里显示 -->
        </div>
      </section>

      <!-- 编辑推荐 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-900 mb-6">编辑精选</h2>

        <div v-if="editorialLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          ></div>
          <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="editorialError" class="text-center py-8">
          <p class="text-red-600">{{ editorialError }}</p>
        </div>

        <div v-else-if="editorial.length === 0" class="text-center py-8 text-gray-500">
          <p>暂无编辑精选内容</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 编辑精选内容将在这里显示 -->
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  // import { recommendationsApi } from '@/api'; // 暂时注释

  const router = useRouter();
  const authStore = useAuthStore();

  // 响应式数据
  const personalized = ref([]);
  const popular = ref([]);
  const editorial = ref([]);

  const personalizedLoading = ref(false);
  const popularLoading = ref(false);
  const editorialLoading = ref(false);

  const personalizedError = ref(null);
  const popularError = ref(null);
  const editorialError = ref(null);

  // 加载个性化推荐
  const loadPersonalizedRecommendations = async () => {
    personalizedLoading.value = true;
    personalizedError.value = null;
    try {
      // const response = await recommendationsApi.getPersonalized(authStore.user.id, { limit: 8 });
      personalized.value = []; // 暂时空数组，直到API可用
    } catch (error) {
      console.error('加载个性化推荐失败:', error);
      personalizedError.value = '加载推荐失败';
    } finally {
      personalizedLoading.value = false;
    }
  };

  // 加载热门推荐
  const loadPopularRecommendations = async () => {
    popularLoading.value = true;
    popularError.value = null;
    try {
      // const response = await recommendationsApi.getPopular({ limit: 8 });
      popular.value = []; // 暂时空数组，直到API可用
    } catch (error) {
      console.error('加载热门推荐失败:', error);
      popularError.value = '加载推荐失败';
    } finally {
      popularLoading.value = false;
    }
  };

  // 加载编辑推荐
  const loadEditorialRecommendations = async () => {
    editorialLoading.value = true;
    editorialError.value = null;
    try {
      // const response = await recommendationsApi.getPopular({ limit: 8, type: 'editorial' });
      editorial.value = []; // 暂时空数组，直到API可用
    } catch (error) {
      console.error('加载编辑推荐失败:', error);
      editorialError.value = '加载推荐失败';
    } finally {
      editorialLoading.value = false;
    }
  };

  // 刷新推荐
  const refreshRecommendations = async () => {
    try {
      // await recommendationsApi.refreshRecommendations(authStore.user.id);
      console.log('刷新推荐功能暂时不可用');
      // 刷新后重新加载
      await loadPersonalizedRecommendations();
    } catch (error) {
      console.error('刷新推荐失败:', error);
    }
  };

  // 页面加载时获取推荐数据
  onMounted(() => {
    if (authStore.isAuthenticated) {
      loadPersonalizedRecommendations();
    }
    loadPopularRecommendations();
    loadEditorialRecommendations();
  });
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
