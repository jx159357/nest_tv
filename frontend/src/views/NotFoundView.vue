<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <!-- 错误图标 -->
      <div class="mb-8">
        <svg
          class="mx-auto h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- 错误标题 -->
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">页面未找到</h2>

      <!-- 错误描述 -->
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        抱歉，您访问的页面不存在。可能是链接有误，或者页面已被移除。
      </p>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link
          to="/"
          class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <!-- 返回首页图标 -->
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          返回首页
        </router-link>

        <button
          class="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          @click="goBack"
        >
          <!-- 返回上页图标 -->
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回上页
        </button>
      </div>

      <!-- 搜索建议 -->
      <div class="mt-12 p-6 bg-white rounded-lg shadow-sm max-w-md mx-auto">
        <h3 class="text-lg font-medium text-gray-900 mb-4">您可能在找...</h3>
        <div class="space-y-2">
          <router-link to="/" class="block text-indigo-600 hover:text-indigo-800 transition-colors">
            热门视频
          </router-link>
          <router-link
            to="/recommendations"
            class="block text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            推荐内容
          </router-link>
          <router-link
            to="/watch-history"
            class="block text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            观看历史
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted } from 'vue';

  const router = useRouter();

  // 返回上一页
  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // 设置页面标题
  onMounted(() => {
    document.title = '404 - 页面未找到 - Nest TV';
  });
</script>

<style scoped>
  /* 自定义动画 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .min-h-screen {
    animation: fadeIn 0.5s ease-out;
  }

  /* 响应式调整 */
  @media (max-width: 640px) {
    .text-6xl {
      font-size: 4rem;
    }

    .text-2xl {
      font-size: 1.5rem;
    }
  }
</style>
