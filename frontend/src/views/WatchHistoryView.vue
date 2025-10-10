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
        <h1 class="text-2xl font-bold text-gray-900">观看历史</h1>
      </div>

      <!-- 筛选区域 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">观看状态</label>
            <select
              v-model="filters.isCompleted"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              <option :value="true">已看完</option>
              <option :value="false">观看中</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="updatedAt">最近观看</option>
              <option value="createdAt">添加时间</option>
              <option value="currentTime">观看进度</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序顺序</label>
            <select
              v-model="filters.sortOrder"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DESC">降序</option>
              <option value="ASC">升序</option>
            </select>
          </div>

          <div class="flex items-end space-x-2">
            <button
              class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @click="loadWatchHistory"
            >
              搜索
            </button>
            <button
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @click="resetFilters"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 观看历史列表 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div v-if="loading" class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
          ></div>
          <p class="mt-4">加载中...</p>
        </div>

        <div v-else-if="watchHistory.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  影视
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  进度
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  状态
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  观看时间
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in watchHistory" :key="item.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-16 w-12">
                      <img
                        v-if="item.mediaResource.poster"
                        :src="item.mediaResource.poster"
                        :alt="item.mediaResource.title"
                        class="h-16 w-12 object-cover rounded"
                      />
                      <div
                        v-else
                        class="h-16 w-12 bg-gray-200 rounded flex items-center justify-center"
                      >
                        <span class="text-gray-500 text-xs">暂无</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ item.mediaResource.title }}
                      </div>
                      <div class="text-sm text-gray-500">{{ item.mediaResource.type }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ formatTime(item.currentTime) }} / {{ formatTime(item.duration) }}
                  </div>
                  <div class="mt-1 w-32 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-indigo-600 h-2 rounded-full"
                      :style="{ width: calculateProgress(item) + '%' }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ calculateProgress(item) }}%</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      item.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800',
                    ]"
                  >
                    {{ item.isCompleted ? '已看完' : '观看中' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(item.updatedAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="continueWatching(item)"
                    >
                      继续观看
                    </button>
                    <button
                      class="text-red-600 hover:text-red-900"
                      :disabled="deletingId === item.id"
                      @click="deleteHistory(item.id)"
                    >
                      {{ deletingId === item.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-gray-500">暂无观看历史</p>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} 到
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条记录， 共
          {{ pagination.total }} 条记录
        </div>
        <div class="flex space-x-2">
          <button
            :disabled="pagination.page <= 1"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="goToPage(pagination.page - 1)"
          >
            上一页
          </button>
          <button
            v-for="page in getPageNumbers()"
            :key="page"
            :class="[
              'px-3 py-1 border rounded-md text-sm font-medium',
              page === pagination.page
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="goToPage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const router = useRouter();
  const authStore = useAuthStore();

  // 状态管理
  const watchHistory = ref([]);
  const loading = ref(false);
  const deletingId = ref(null);

  // 分页和筛选
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const filters = ref({
    isCompleted: '',
    sortBy: 'updatedAt',
    sortOrder: 'DESC',
  });

  // 加载观看历史
  const loadWatchHistory = async () => {
    if (!authStore.user?.id) return;

    loading.value = true;

    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
      };

      // 清理空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      // 特殊处理布尔值
      if (params.isCompleted === 'true') {
        params.isCompleted = true;
      } else if (params.isCompleted === 'false') {
        params.isCompleted = false;
      }

      const response = await authStore.api.get(`/watch-history/user/${authStore.user.id}`, {
        params,
      });

      if (response.data && response.data.data) {
        watchHistory.value = response.data.data;
        pagination.value = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        };
      } else {
        watchHistory.value = [];
        pagination.value = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };
      }
    } catch (error) {
      console.error('加载观看历史失败:', error);
      watchHistory.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 重置筛选条件
  const resetFilters = () => {
    filters.value = {
      isCompleted: '',
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
    pagination.value.page = 1;
    loadWatchHistory();
  };

  // 分页导航
  const goToPage = page => {
    if (page >= 1 && page <= pagination.value.totalPages) {
      pagination.value.page = page;
      loadWatchHistory();
    }
  };

  // 获取分页数字
  const getPageNumbers = () => {
    const totalPages = pagination.value.totalPages;
    const currentPage = pagination.value.page;
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  // 计算观看进度百分比
  const calculateProgress = item => {
    if (!item.duration || item.duration === 0) return 0;
    return Math.round((item.currentTime / item.duration) * 100);
  };

  // 格式化时间
  const formatTime = seconds => {
    if (!seconds || seconds === 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // 格式化日期
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  // 继续观看
  const continueWatching = item => {
    router.push(`/watch/${item.mediaResourceId}?time=${item.currentTime}`);
  };

  // 删除观看历史
  const deleteHistory = async id => {
    if (!confirm('确定要删除这条观看历史记录吗？')) {
      return;
    }

    try {
      deletingId.value = id;
      await authStore.api.delete(`/watch-history/${id}`);
      loadWatchHistory(); // 重新加载数据
    } catch (error) {
      console.error('删除观看历史失败:', error);
    } finally {
      deletingId.value = null;
    }
  };

  // 组件挂载时加载数据
  onMounted(() => {
    loadWatchHistory();
  });
</script>
