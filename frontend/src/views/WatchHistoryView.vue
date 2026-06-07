<template>
  <div class="page-container">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold" style="color: var(--text-primary)">观看历史</h1>
      </div>

      <!-- 筛选区域 -->
      <div class="rounded-lg shadow-sm p-6 mb-6" style="background: var(--bg-card)">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)"
              >观看状态</label
            >
            <select
              v-model="filters.isCompleted"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style="
                border-color: var(--border-primary);
                background: var(--bg-secondary);
                color: var(--text-primary);
              "
            >
              <option value="">全部</option>
              <option :value="true">已看完</option>
              <option :value="false">观看中</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)"
              >排序方式</label
            >
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style="
                border-color: var(--border-primary);
                background: var(--bg-secondary);
                color: var(--text-primary);
              "
            >
              <option value="updatedAt">最近观看</option>
              <option value="createdAt">添加时间</option>
              <option value="currentTime">观看进度</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)"
              >排序顺序</label
            >
            <select
              v-model="filters.sortOrder"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style="
                border-color: var(--border-primary);
                background: var(--bg-secondary);
                color: var(--text-primary);
              "
            >
              <option value="DESC">降序</option>
              <option value="ASC">升序</option>
            </select>
          </div>

          <div class="flex items-end space-x-2">
            <button
              class="flex-1 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style="background: var(--color-brand-primary)"
              @click="applyFilters()"
            >
              搜索
            </button>
            <button
              class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style="border-color: var(--border-primary); color: var(--text-secondary)"
              @click="resetFilters"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 观看历史列表 -->
      <div class="rounded-lg shadow-sm overflow-hidden" style="background: var(--bg-card)">
        <div v-if="loading" class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
          ></div>
          <p class="mt-4">加载中...</p>
        </div>

        <div v-else-if="watchHistory.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y" style="border-color: var(--border-primary)">
            <thead style="background: var(--bg-secondary)">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style="color: var(--text-muted)"
                >
                  影视
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style="color: var(--text-muted)"
                >
                  进度
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style="color: var(--text-muted)"
                >
                  状态
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style="color: var(--text-muted)"
                >
                  观看时间
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style="color: var(--text-muted)"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody style="background: var(--bg-card)">
              <tr v-for="item in watchHistory" :key="item.id" class="wh-history-row">
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
                        class="h-16 w-12 rounded flex items-center justify-center"
                        style="background: var(--bg-tertiary)"
                      >
                        <span class="text-xs" style="color: var(--text-muted)">暂无</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium" style="color: var(--text-primary)">
                        {{ item.mediaResource.title }}
                      </div>
                      <div class="text-sm" style="color: var(--text-muted)">
                        {{ item.mediaResource.type }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm" style="color: var(--text-primary)">
                    {{ formatTime(item.currentTime) }} / {{ formatTime(item.duration) }}
                  </div>
                  <div class="mt-1 w-32 rounded-full h-2" style="background: var(--bg-tertiary)">
                    <div
                      class="h-2 rounded-full wh-progress-fill"
                      :style="{ width: calculateProgress(item) + '%' }"
                    ></div>
                  </div>
                  <div class="text-xs mt-1" style="color: var(--text-muted)">
                    {{ calculateProgress(item) }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      item.isCompleted ? 'wh-status-completed' : 'wh-status-watching',
                    ]"
                  >
                    {{ item.isCompleted ? '已看完' : '观看中' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-muted)">
                  {{ formatDate(item.updatedAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button class="wh-action-continue" @click="continueWatching(item)">
                      继续观看
                    </button>
                    <button
                      class="wh-action-delete"
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
          <p style="color: var(--text-muted)">暂无观看历史</p>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm" style="color: var(--text-secondary)">
          显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} 到
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条记录， 共
          {{ pagination.total }} 条记录
        </div>
        <div class="flex space-x-2">
          <button
            :disabled="pagination.page <= 1"
            class="wh-page-btn"
            @click="applyFilters(pagination.page - 1)"
          >
            上一页
          </button>
          <button
            v-for="page in getPageNumbers()"
            :key="page"
            :class="['wh-page-btn', page === pagination.page ? 'wh-page-btn--active' : '']"
            @click="typeof page === 'number' ? applyFilters(page) : undefined"
          >
            {{ page }}
          </button>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            class="wh-page-btn"
            @click="applyFilters(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { showConfirm } from '@/composables/useModal';
  import { useAuthStore } from '@/stores/auth';
  import { watchHistoryApi } from '@/api/watchHistory';
  import { log } from '@/utils/logger';

  const route = useRoute();
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

  const readSingleQuery = value => (Array.isArray(value) ? value[0] : value);

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const queryIsCompleted = readSingleQuery(route.query.isCompleted);
    const querySortBy = readSingleQuery(route.query.sortBy);
    const querySortOrder = readSingleQuery(route.query.sortOrder);

    pagination.value.page = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    filters.value = {
      isCompleted: queryIsCompleted === 'true' ? true : queryIsCompleted === 'false' ? false : '',
      sortBy:
        querySortBy === 'createdAt' || querySortBy === 'currentTime' || querySortBy === 'updatedAt'
          ? querySortBy
          : 'updatedAt',
      sortOrder: querySortOrder === 'ASC' ? 'ASC' : 'DESC',
    };
  };

  const buildWatchHistoryQuery = (nextPage = 1) => {
    const query = {
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
    };

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (filters.value.isCompleted === true) {
      query.isCompleted = 'true';
    } else if (filters.value.isCompleted === false) {
      query.isCompleted = 'false';
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'watch-history',
      query: buildWatchHistoryQuery(nextPage),
    });
  };

  // 加载观看历史
  const loadWatchHistory = async (nextPage = pagination.value.page) => {
    if (!authStore.user?.id) {
      await authStore.fetchUserProfile();
    }

    if (!authStore.user?.id) return;

    loading.value = true;

    try {
      const params = {
        page: nextPage,
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

      const response = await watchHistoryApi.getMyWatchHistory(params);

      if (response?.data) {
        watchHistory.value = response.data;
        pagination.value = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        };
        if (response.page !== nextPage) {
          await router.replace({
            name: 'watch-history',
            query: buildWatchHistoryQuery(response.page),
          });
        }
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
      log.error('WatchHistoryView', '加载观看历史失败:', error);
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
    void applyFilters(1);
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
    showConfirm('确定要删除这条观看历史记录吗？', async () => {
      try {
        deletingId.value = id;
        await watchHistoryApi.deleteWatchHistory(String(id));
        await loadWatchHistory(pagination.value.page);
      } catch (error) {
        log.error('WatchHistoryView', '删除观看历史失败:', error);
      } finally {
        deletingId.value = null;
      }
    });
  };

  // 组件挂载时加载数据
  watch(
    () => route.query,
    () => {
      syncFiltersFromRoute();
      void loadWatchHistory(pagination.value.page);
    },
    { immediate: true },
  );
</script>

<style scoped>
  .wh-history-row {
    border-bottom: 1px solid var(--border-primary);
  }

  .wh-progress-fill {
    background: var(--color-brand-primary);
  }

  .wh-status-completed {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .wh-status-watching {
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }

  .wh-action-continue {
    color: var(--color-brand-primary);
  }

  .wh-action-continue:hover {
    color: var(--color-brand-primary-light);
  }

  .wh-action-delete {
    color: var(--color-danger);
  }

  .wh-action-delete:hover {
    opacity: 0.8;
  }

  .wh-page-btn {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--border-primary);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
  }

  .wh-page-btn:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .wh-page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .wh-page-btn--active {
    border-color: var(--color-brand-primary);
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-brand-primary-light);
  }
</style>
