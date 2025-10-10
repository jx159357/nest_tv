<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900"> 首页 </router-link>
            <router-link to="/profile" class="text-gray-700 hover:text-gray-900">
              个人中心
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">爬虫管理</h1>
        <p class="text-gray-600 mt-1">管理和监控影视资源爬虫任务</p>
      </div>

      <!-- 爬虫目标列表 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">可用爬虫目标</h2>
          <button
            :disabled="refreshing"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            @click="refreshTargets"
          >
            {{ refreshing ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div v-if="targetsLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-gray-500">加载中...</p>
        </div>

        <div
          v-else-if="crawlerTargets.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="target in crawlerTargets"
            :key="target.name"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900">{{ target.name }}</h3>
                <p class="text-sm text-gray-500 mt-1 truncate">{{ target.baseUrl }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs',
                  target.status === 'online'
                    ? 'bg-green-100 text-green-800'
                    : target.status === 'offline'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800',
                ]"
              >
                {{
                  target.status === 'online'
                    ? '在线'
                    : target.status === 'offline'
                      ? '离线'
                      : '未知'
                }}
              </span>
            </div>

            <div class="mt-4 flex space-x-2">
              <button
                :disabled="testingTarget === target.name"
                class="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
                @click="testConnection(target.name)"
              >
                {{ testingTarget === target.name ? '测试中...' : '测试连接' }}
              </button>
              <button
                class="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                @click="crawlFromTarget(target.name)"
              >
                爬取资源
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-gray-500">暂无可用的爬虫目标</p>
        </div>
      </div>

      <!-- 快速爬取 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">快速爬取</h2>

        <form class="space-y-4" @submit.prevent="quickCrawl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择爬虫目标 *</label>
            <select
              v-model="quickCrawlForm.targetName"
              required
              class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">请选择爬虫目标</option>
              <option v-for="target in crawlerTargets" :key="target.name" :value="target.name">
                {{ target.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资源URL *</label>
            <input
              v-model="quickCrawlForm.url"
              type="url"
              required
              placeholder="请输入要爬取的资源URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="flex items-center">
            <input
              v-model="quickCrawlForm.saveToDatabase"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900"> 爬取后自动保存到数据库 </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="quickCrawling"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ quickCrawling ? '爬取中...' : '开始爬取' }}
            </button>
          </div>
        </form>
      </div>

      <!-- 爬取结果展示 -->
      <div v-if="crawlResult" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">爬取结果</h2>

        <div v-if="crawlResult.success" class="space-y-4">
          <div class="p-4 bg-green-50 rounded-lg">
            <h3 class="font-medium text-green-800">爬取成功！</h3>
            <p class="text-green-700 mt-1">{{ crawlResult.message }}</p>
          </div>

          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">爬取数据</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span class="font-medium">标题:</span> {{ crawlResult.data.title }}</p>
                <p><span class="font-medium">类型:</span> {{ crawlResult.data.type }}</p>
                <p><span class="font-medium">评分:</span> {{ crawlResult.data.rating }}</p>
                <p>
                  <span class="font-medium">导演:</span> {{ crawlResult.data.director || '无' }}
                </p>
                <p><span class="font-medium">主演:</span> {{ crawlResult.data.actors || '无' }}</p>
              </div>
              <div>
                <p><span class="font-medium">来源:</span> {{ crawlResult.data.source }}</p>
                <p>
                  <span class="font-medium">上映日期:</span>
                  {{ crawlResult.data.releaseDate || '无' }}
                </p>
                <p>
                  <span class="font-medium">剧集数:</span>
                  {{ crawlResult.data.episodeCount || '无' }}
                </p>
                <p v-if="crawlResult.data.poster">
                  <span class="font-medium">海报:</span> {{ crawlResult.data.poster }}
                </p>
              </div>
            </div>

            <div v-if="crawlResult.data.description" class="mt-3">
              <p class="font-medium">简介:</p>
              <p class="text-gray-700 mt-1">{{ crawlResult.data.description }}</p>
            </div>

            <div v-if="crawlResult.data.genres && crawlResult.data.genres.length > 0" class="mt-3">
              <p class="font-medium">类型标签:</p>
              <div class="flex flex-wrap gap-2 mt-1">
                <span
                  v-for="genre in crawlResult.data.genres"
                  :key="genre"
                  class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="quickCrawlForm.saveToDatabase && crawlResult.data.id"
            class="p-4 bg-blue-50 rounded-lg"
          >
            <p class="text-blue-800">数据已自动保存到数据库，ID: {{ crawlResult.data.id }}</p>
          </div>
        </div>

        <div v-else class="p-4 bg-red-50 rounded-lg">
          <h3 class="font-medium text-red-800">爬取失败</h3>
          <p class="text-red-700 mt-1">{{ crawlResult.message }}</p>
        </div>

        <div class="mt-4">
          <button
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @click="clearCrawlResult"
          >
            清除结果
          </button>
        </div>
      </div>

      <!-- 批量爬取 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">批量爬取</h2>

        <form class="space-y-4" @submit.prevent="batchCrawl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择爬虫目标 *</label>
            <select
              v-model="batchCrawlForm.targetName"
              required
              class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">请选择爬虫目标</option>
              <option v-for="target in crawlerTargets" :key="target.name" :value="target.name">
                {{ target.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL列表 *</label>
            <textarea
              v-model="batchCrawlForm.urls"
              rows="5"
              required
              placeholder="请输入要爬取的URL列表，每行一个URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div class="flex items-center">
            <input
              v-model="batchCrawlForm.saveToDatabase"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900"> 爬取后自动保存到数据库 </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="batchCrawling"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ batchCrawling ? '批量爬取中...' : '开始批量爬取' }}
            </button>
          </div>
        </form>

        <!-- 批量爬取结果 -->
        <div v-if="batchCrawlResult" class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-medium text-gray-900 mb-2">批量爬取结果</h3>
          <div class="text-sm">
            <p>成功: {{ batchCrawlResult.successCount }}</p>
            <p>失败: {{ batchCrawlResult.failureCount }}</p>
            <p>总计: {{ batchCrawlResult.totalRequested }}</p>
          </div>

          <div v-if="batchCrawlResult.data && batchCrawlResult.data.crawledData" class="mt-3">
            <h4 class="font-medium text-gray-900 mb-2">成功爬取的数据:</h4>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="(data, index) in batchCrawlResult.data.crawledData"
                :key="index"
                class="p-3 bg-white border border-gray-200 rounded"
              >
                <p class="font-medium">{{ data.title }}</p>
                <p class="text-gray-600 text-sm">
                  评分: {{ data.rating }} | 来源: {{ data.source }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <button
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @click="clearBatchCrawlResult"
            >
              清除结果
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '@/stores/auth';

  const authStore = useAuthStore();

  // 状态管理
  const crawlerTargets = ref([]);
  const targetsLoading = ref(false);
  const refreshing = ref(false);
  const testingTarget = ref('');
  const quickCrawling = ref(false);
  const batchCrawling = ref(false);

  // 爬取结果
  const crawlResult = ref(null);
  const batchCrawlResult = ref(null);

  // 表单数据
  const quickCrawlForm = ref({
    targetName: '',
    url: '',
    saveToDatabase: true,
  });

  const batchCrawlForm = ref({
    targetName: '',
    urls: '',
    saveToDatabase: true,
  });

  // 加载爬虫目标
  const loadCrawlerTargets = async () => {
    targetsLoading.value = true;

    try {
      const response = await authStore.api.get('/crawler/targets');
      if (response.data && response.data.data) {
        crawlerTargets.value = response.data.data.map(target => ({
          ...target,
          status: 'unknown', // 默认状态
        }));
      }
    } catch (error) {
      console.error('加载爬虫目标失败:', error);
      crawlerTargets.value = [];
    } finally {
      targetsLoading.value = false;
    }
  };

  // 刷新爬虫目标
  const refreshTargets = async () => {
    refreshing.value = true;
    await loadCrawlerTargets();
    refreshing.value = false;
  };

  // 测试连接
  const testConnection = async targetName => {
    try {
      testingTarget.value = targetName;
      const response = await authStore.api.get(
        `/crawler/test-connection?targetName=${encodeURIComponent(targetName)}`,
      );

      // 更新目标状态
      const targetIndex = crawlerTargets.value.findIndex(t => t.name === targetName);
      if (targetIndex !== -1) {
        crawlerTargets.value[targetIndex].status = response.data.success ? 'online' : 'offline';
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      // 更新目标状态为离线
      const targetIndex = crawlerTargets.value.findIndex(t => t.name === targetName);
      if (targetIndex !== -1) {
        crawlerTargets.value[targetIndex].status = 'offline';
      }
    } finally {
      testingTarget.value = '';
    }
  };

  // 从目标爬取资源
  const crawlFromTarget = targetName => {
    quickCrawlForm.value.targetName = targetName;
  };

  // 快速爬取
  const quickCrawl = async () => {
    try {
      quickCrawling.value = true;

      const endpoint = quickCrawlForm.value.saveToDatabase
        ? '/crawler/crawl-and-save'
        : '/crawler/crawl';

      const response = await authStore.api.post(endpoint, {
        url: quickCrawlForm.value.url,
        targetName: quickCrawlForm.value.targetName,
      });

      crawlResult.value = response.data;
    } catch (error) {
      console.error('快速爬取失败:', error);
      crawlResult.value = {
        success: false,
        message: error.response?.data?.message || '爬取失败',
      };
    } finally {
      quickCrawling.value = false;
    }
  };

  // 批量爬取
  const batchCrawl = async () => {
    try {
      batchCrawling.value = true;

      // 解析URL列表
      const urls = batchCrawlForm.value.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const endpoint = batchCrawlForm.value.saveToDatabase
        ? '/crawler/batch-crawl'
        : '/crawler/batch-crawl';

      const response = await authStore.api.post(endpoint, {
        targetName: batchCrawlForm.value.targetName,
        urls: urls,
      });

      batchCrawlResult.value = response.data;
    } catch (error) {
      console.error('批量爬取失败:', error);
      batchCrawlResult.value = {
        success: false,
        message: error.response?.data?.message || '批量爬取失败',
      };
    } finally {
      batchCrawling.value = false;
    }
  };

  // 清除爬取结果
  const clearCrawlResult = () => {
    crawlResult.value = null;
  };

  // 清除批量爬取结果
  const clearBatchCrawlResult = () => {
    batchCrawlResult.value = null;
  };

  // 组件挂载时加载数据
  onMounted(() => {
    loadCrawlerTargets();
  });
</script>
