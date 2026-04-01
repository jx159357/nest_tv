<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">系统日志</h1>
        <p class="mt-2 text-gray-600">查看后台操作记录、错误信息和状态变化</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="action"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="操作类型，如 create"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="resource"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="资源类型，如 media"
          @keyup.enter="applyFilters(1)"
        />
        <select
          v-model="status"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部状态</option>
          <option value="success">success</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="applyFilters(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">总日志数</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ total }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">错误日志</div>
        <div class="mt-2 text-2xl font-semibold text-red-600">{{ errorCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">警告日志</div>
        <div class="mt-2 text-2xl font-semibold text-amber-600">{{ warningCount }}</div>
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
                  时间
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  操作
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  资源
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  角色
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  用户
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  说明
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="log in logs" :key="log.id">
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(log.createdAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ log.action }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ log.resource }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs font-medium',
                      log.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ log.role?.name || `#${log.roleId}` }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ log.user?.username || (log.userId ? `#${log.userId}` : '系统') }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div class="line-clamp-2">{{ log.errorMessage || log.description || '—' }}</div>
                </td>
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
              @click="applyFilters(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border px-3 py-1 disabled:opacity-50"
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
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { adminApi } from '@/api/admin';
  import type { AdminLogItem } from '@/api/admin';

  const route = useRoute();
  const router = useRouter();
  const logs = ref<AdminLogItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const action = ref('');
  const resource = ref('');
  const status = ref<'success' | 'error' | 'warning' | ''>('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const errorCount = computed(() => logs.value.filter(log => log.status === 'error').length);
  const warningCount = computed(() => logs.value.filter(log => log.status === 'warning').length);

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const queryAction = readSingleQuery(route.query.action);
    const queryResource = readSingleQuery(route.query.resource);
    const queryStatus = readSingleQuery(route.query.status);

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    action.value = typeof queryAction === 'string' ? queryAction : '';
    resource.value = typeof queryResource === 'string' ? queryResource : '';
    status.value =
      queryStatus === 'success' || queryStatus === 'warning' || queryStatus === 'error'
        ? queryStatus
        : '';
  };

  const buildLogsQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (action.value.trim()) {
      query.action = action.value.trim();
    }
    if (resource.value.trim()) {
      query.resource = resource.value.trim();
    }
    if (status.value) {
      query.status = status.value;
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'admin-logs',
      query: buildLogsQuery(nextPage),
    });
  };

  const loadLogs = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getLogs({
        page: nextPage,
        limit: 10,
        action: action.value || undefined,
        resource: resource.value || undefined,
        status: status.value || undefined,
      });

      logs.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
      if (response.page !== nextPage) {
        await router.replace({
          name: 'admin-logs',
          query: buildLogsQuery(response.page),
        });
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载系统日志失败';
    } finally {
      loading.value = false;
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('zh-CN');
  };

  watch(
    () => route.query,
    () => {
      syncFiltersFromRoute();
      void loadLogs(page.value);
    },
    { immediate: true },
  );
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
