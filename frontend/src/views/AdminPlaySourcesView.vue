<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">播放源管理</h1>
        <p class="mt-2 text-gray-600">查看播放源状态、优先级和关联媒体</p>
      </div>
      <div class="flex gap-3">
        <select
          v-model="type"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="loadPlaySources(1)"
        >
          <option value="">全部类型</option>
          <option value="online">online</option>
          <option value="stream">stream</option>
          <option value="download">download</option>
          <option value="parser">parser</option>
          <option value="iptv">iptv</option>
          <option value="magnet">magnet</option>
        </select>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="loadPlaySources(1)"
        >
          刷新
        </button>
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
                  来源
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  媒体
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  类型
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  优先级
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in playSources" :key="item.id">
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">
                    {{ item.sourceName || item.name || '未命名播放源' }}
                  </div>
                  <div class="line-clamp-1 text-xs text-gray-500">{{ item.url }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ item.mediaResource?.title || `#${item.mediaResourceId}` }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.type }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.priority }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.createdAt) }}</td>
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
              @click="loadPlaySources(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadPlaySources(page + 1)"
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
  import { onMounted, ref } from 'vue';
  import { adminApi } from '@/api/admin';
  import type { PlaySource } from '@/types/media';

  const playSources = ref<PlaySource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const type = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const loadPlaySources = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getPlaySources({
        page: nextPage,
        limit: 10,
        type: type.value || undefined,
      });

      playSources.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载播放源列表失败';
    } finally {
      loading.value = false;
    }
  };

  const formatDate = (value?: Date | string | null) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('zh-CN');
  };

  onMounted(() => {
    void loadPlaySources();
  });
</script>

<style scoped>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
