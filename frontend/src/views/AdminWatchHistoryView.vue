<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">观看历史管理</h1>
        <p class="mt-2 text-gray-600">查看用户观看进度、播放次数和最近活动</p>
      </div>
      <div class="flex gap-3">
        <select
          v-model="selectedUserId"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="loadWatchHistory(1)"
        >
          <option value="">全部用户</option>
          <option v-for="item in users" :key="item.id" :value="String(item.id)">
            {{ item.nickname || item.username }}
          </option>
        </select>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="loadWatchHistory(1)"
        >
          刷新
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">总记录数</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ total }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">已看完</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ completedCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">继续观看</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ inProgressCount }}</div>
      </div>
    </div>

    <div class="rounded-lg bg-white shadow">
      <div v-if="loading" class="p-8 text-center text-gray-500">加载中...</div>
      <div v-else-if="error" class="p-8 text-center text-red-600">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  用户
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  媒体
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  进度
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  观看时长
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  播放次数
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  最近更新
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in historyItems" :key="item.id">
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">{{ item.user?.username || `用户#${item.userId}` }}</div>
                  <div class="text-xs text-gray-500">{{ item.user?.email || '—' }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">
                    {{ item.mediaResource?.title || `资源#${item.mediaResourceId}` }}
                  </div>
                  <div class="text-xs text-gray-500">{{ item.mediaResource?.type || '—' }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div class="h-2 w-28 overflow-hidden rounded-full bg-gray-200">
                    <div
                      class="h-full bg-green-500"
                      :style="{ width: `${getProgress(item)}%` }"
                    ></div>
                  </div>
                  <div class="mt-1 text-xs text-gray-500">{{ getProgress(item) }}%</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ formatDuration(item.watchDuration) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.playCount }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadWatchHistory(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadWatchHistory(page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { adminApi } from '@/api/admin';
  import type { AdminWatchHistoryItem } from '@/api/admin';
  import type { User } from '@/types/user';

  const historyItems = ref<AdminWatchHistoryItem[]>([]);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedUserId = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const completedCount = computed(() => historyItems.value.filter(item => item.isCompleted).length);
  const inProgressCount = computed(
    () => historyItems.value.filter(item => !item.isCompleted).length,
  );

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers({ page: 1, limit: 100 });
      users.value = response.data;
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  };

  const loadWatchHistory = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getWatchHistory({
        page: nextPage,
        limit: 10,
        userId: selectedUserId.value ? Number(selectedUserId.value) : undefined,
      });

      historyItems.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载观看历史失败';
    } finally {
      loading.value = false;
    }
  };

  const getProgress = (item: AdminWatchHistoryItem) => {
    return Math.round(item.progress?.percentage || 0);
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('zh-CN');
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.max(seconds || 0, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}时 ${minutes}分 ${remainSeconds}秒`;
    }

    if (minutes > 0) {
      return `${minutes}分 ${remainSeconds}秒`;
    }

    return `${remainSeconds}秒`;
  };

  onMounted(() => {
    void Promise.all([loadUsers(), loadWatchHistory()]);
  });
</script>
