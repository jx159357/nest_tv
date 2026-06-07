<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="admin-title text-2xl font-bold">内容管理</h1>
        <p class="admin-subtitle mt-2">查看媒体资源、评分和状态</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="search"
          type="text"
          class="admin-input w-56 rounded-lg px-3 py-2 text-sm"
          placeholder="搜索标题 / 描述"
          @keyup.enter="applyFilters(1)"
        />
        <select
          v-model="type"
          class="admin-input rounded-lg px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部类型</option>
          <option value="movie">电影</option>
          <option value="tv_series">电视剧</option>
          <option value="variety">综艺</option>
          <option value="anime">动漫</option>
          <option value="documentary">纪录片</option>
        </select>
        <button
          class="admin-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          @click="applyFilters(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="admin-card rounded-lg">
      <div v-if="loading" class="admin-loading p-8 text-center">加载中...</div>
      <div v-else-if="error" class="admin-error p-8 text-center">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="admin-table min-w-full">
            <thead class="admin-table-head">
              <tr>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  标题
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  类型
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  质量
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  评分
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  观看
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  状态
                </th>
                <th
                  class="admin-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody class="admin-table-body">
              <tr v-for="item in mediaList" :key="item.id">
                <td class="admin-cell-primary px-4 py-3 text-sm">
                  <div class="font-medium">{{ item.title }}</div>
                  <div class="admin-description line-clamp-1 text-xs">
                    {{ item.description || '暂无描述' }}
                  </div>
                  <router-link
                    :to="{
                      name: 'admin-download-tasks',
                      query: { mediaResourceId: String(item.id) },
                    }"
                    class="admin-link mt-2 inline-flex text-xs"
                  >
                    查看下载任务
                  </router-link>
                </td>
                <td class="admin-cell px-4 py-3 text-sm">{{ item.type }}</td>
                <td class="admin-cell px-4 py-3 text-sm">{{ item.quality }}</td>
                <td class="admin-cell px-4 py-3 text-sm">{{ item.rating.toFixed(1) }}</td>
                <td class="admin-cell px-4 py-3 text-sm">{{ item.viewCount }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'status-badge rounded-full px-2 py-1 text-xs font-medium',
                      item.isActive ? 'status-active' : 'status-inactive',
                    ]"
                  >
                    {{ item.isActive ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="admin-cell px-4 py-3 text-sm">{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-pagination flex items-center justify-between px-4 py-3 text-sm">
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="admin-page-btn rounded px-3 py-1 disabled:opacity-50"
              @click="applyFilters(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="admin-page-btn rounded px-3 py-1 disabled:opacity-50"
              @click="applyFilters(page + 1)"
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
  import { ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { adminApi } from '@/api/admin';
  import type { MediaResource } from '@/types/media';

  const route = useRoute();
  const router = useRouter();
  const mediaList = ref<MediaResource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const search = ref('');
  const type = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const querySearch = readSingleQuery(route.query.search);
    const queryType = readSingleQuery(route.query.type);

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    search.value = typeof querySearch === 'string' ? querySearch : '';
    type.value = typeof queryType === 'string' ? queryType : '';
  };

  const buildMediaQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (search.value.trim()) {
      query.search = search.value.trim();
    }
    if (type.value) {
      query.type = type.value;
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'admin-media',
      query: buildMediaQuery(nextPage),
    });
  };

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
      if (response.page !== nextPage) {
        await router.replace({
          name: 'admin-media',
          query: buildMediaQuery(response.page),
        });
      }
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

  watch(
    () => route.query,
    () => {
      syncFiltersFromRoute();
      void loadMedia(page.value);
    },
    { immediate: true },
  );
</script>

<style scoped>
  /* ---- Typography ---- */
  .admin-title {
    color: var(--text-primary);
  }

  .admin-subtitle {
    color: var(--text-muted);
  }

  /* ---- Form Controls ---- */
  .admin-input {
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .admin-input::placeholder {
    color: var(--text-tertiary);
  }

  /* ---- Primary Button ---- */
  .admin-btn-primary {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .admin-btn-primary:hover {
    background: var(--color-brand-primary-dark);
  }

  /* ---- Card Container ---- */
  .admin-card {
    border: 1px solid var(--border-primary);
    background: var(--bg-tertiary);
    box-shadow: var(--shadow-xl);
  }

  .admin-loading {
    color: var(--text-muted);
  }

  .admin-error {
    color: var(--color-error-light);
  }

  /* ---- Table ---- */
  .admin-table {
    border-collapse: separate;
    border-spacing: 0;
  }

  .admin-table-head {
    background: rgba(255, 255, 255, 0.02);
  }

  .admin-th {
    color: var(--text-muted);
  }

  .admin-table-body tr {
    border-bottom: 1px solid var(--border-primary);
  }

  .admin-table-body tr:last-child {
    border-bottom: none;
  }

  .admin-cell-primary {
    color: var(--text-primary);
  }

  .admin-cell {
    color: var(--text-muted);
  }

  .admin-description {
    color: var(--text-tertiary);
  }

  .admin-link {
    color: var(--color-brand-primary-light);
  }

  .admin-link:hover {
    color: var(--color-brand-primary);
  }

  /* ---- Status Badges ---- */
  .status-active {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }

  .status-inactive {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light);
  }

  /* ---- Pagination ---- */
  .admin-pagination {
    border-top: 1px solid var(--border-primary);
    color: var(--text-muted);
  }

  .admin-page-btn {
    border: 1px solid var(--border-primary);
    color: var(--text-muted);
  }

  /* ---- Utility ---- */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
