<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">内容管理</h1>
        <p class="mt-2 text-gray-600">查看媒体资源、评分和状态</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="search"
          type="text"
          class="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="搜索标题 / 描述"
          @keyup.enter="loadMedia(1)"
        />
        <select
          v-model="type"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="loadMedia(1)"
        >
          <option value="">全部类型</option>
          <option value="movie">电影</option>
          <option value="tv_series">电视剧</option>
          <option value="variety">综艺</option>
          <option value="anime">动漫</option>
          <option value="documentary">纪录片</option>
        </select>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="loadMedia(1)"
        >
          搜索
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
                  标题
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  类型
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  质量
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  评分
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  观看
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in mediaList" :key="item.id">
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">{{ item.title }}</div>
                  <div class="line-clamp-1 text-xs text-gray-500">
                    {{ item.description || '暂无描述' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.type }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.quality }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.rating.toFixed(1) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.viewCount }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs font-medium',
                      item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ item.isActive ? '启用' : '停用' }}
                  </span>
                </td>
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
              @click="loadMedia(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadMedia(page + 1)"
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
  import type { MediaResource } from '@/types/media';

  const mediaList = ref<MediaResource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const search = ref('');
  const type = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const loadMedia = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getMedia({
        page: nextPage,
        limit: 10,
        type: type.value || undefined,
        search: search.value || undefined,
      });

      mediaList.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载媒体列表失败';
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
    void loadMedia();
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
