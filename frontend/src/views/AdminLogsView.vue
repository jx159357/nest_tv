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
        <input
          v-model="clientId"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="任务 clientId，如 task-21"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="hash"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="任务 Hash，如 hash-demo"
          @input="hash = normalizeHashInput(($event.target as HTMLInputElement).value)"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="downloadTaskId"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="任务 ID，如 21"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="selectedLogId ? String(selectedLogId) : ''"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="日志 ID，如 7"
          @input="selectedLogId = parseLogId(($event.target as HTMLInputElement).value)"
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

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <button
        class="rounded-lg bg-white p-4 text-left shadow transition hover:bg-slate-50"
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        <div class="text-sm text-gray-500">下载任务日志</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ downloadTaskLogCount }}</div>
      </button>
      <button
        class="rounded-lg bg-white p-4 text-left shadow transition hover:bg-slate-50"
        @click="setActionFilter(action === 'retry' ? '' : 'retry')"
      >
        <div class="text-sm text-gray-500">retry 动作</div>
        <div class="mt-2 text-2xl font-semibold text-emerald-600">{{ retryActionCount }}</div>
      </button>
      <button
        class="rounded-lg bg-white p-4 text-left shadow transition hover:bg-slate-50"
        @click="setActionFilter(action === 'cancel' ? '' : 'cancel')"
      >
        <div class="text-sm text-gray-500">cancel 动作</div>
        <div class="mt-2 text-2xl font-semibold text-rose-600">{{ cancelActionCount }}</div>
      </button>
      <button
        class="rounded-lg bg-white p-4 text-left shadow transition hover:bg-slate-50"
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        <div class="text-sm text-gray-500">24h 下载动作</div>
        <div class="mt-2 text-2xl font-semibold text-indigo-600">
          {{ recentDownloadTaskActionCount }}
        </div>
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="
          resource === 'download_task'
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        下载任务日志
      </button>
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="
          action === 'retry'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="setActionFilter(action === 'retry' ? '' : 'retry')"
      >
        retry 动作
      </button>
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="
          action === 'cancel'
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="setActionFilter(action === 'cancel' ? '' : 'cancel')"
      >
        cancel 动作
      </button>
    </div>

    <div v-if="activeFilterChips.length > 0" class="flex flex-wrap gap-2">
      <span
        v-for="chip in activeFilterChips"
        :key="chip.key"
        class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
      >
        {{ chip.label }}
        <button class="text-slate-400 hover:text-slate-700" @click="chip.clear">×</button>
      </span>
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
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  详情
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <template v-for="log in logs" :key="log.id">
                <tr>
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
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <button
                      class="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      @click="toggleLogDetails(log.id)"
                    >
                      {{ selectedLogId === log.id ? '收起' : '详情' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="selectedLogId === log.id" class="bg-slate-50">
                  <td colspan="8" class="px-4 py-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                          元数据
                        </div>
                        <div
                          v-if="metadataEntries(log).length === 0"
                          class="mt-2 text-sm text-slate-500"
                        >
                          暂无元数据
                        </div>
                        <div v-else class="mt-2 space-y-2 text-sm text-slate-700">
                          <div v-for="item in metadataEntries(log)" :key="`${log.id}-${item.key}`">
                            <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                              {{ item.key }}
                            </div>
                            <div class="mt-1 break-all">{{ item.value }}</div>
                          </div>
                        </div>
                      </div>
                      <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                          请求信息
                        </div>
                        <div v-if="!log.requestInfo" class="mt-2 text-sm text-slate-500">
                          暂无请求信息
                        </div>
                        <div v-else class="mt-2 space-y-2 text-sm text-slate-700">
                          <div>
                            <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Method / URL
                            </div>
                            <div class="mt-1 break-all">
                              {{ log.requestInfo.method || '—' }} {{ log.requestInfo.url || '' }}
                            </div>
                          </div>
                          <div>
                            <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                              IP
                            </div>
                            <div class="mt-1 break-all">{{ log.requestInfo.ip || '—' }}</div>
                          </div>
                          <div>
                            <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                              User Agent
                            </div>
                            <div class="mt-1 break-all">{{ log.requestInfo.userAgent || '—' }}</div>
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="downloadTaskLogTarget(log)"
                        class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 lg:col-span-2"
                      >
                        <div class="text-xs font-medium uppercase tracking-wide text-indigo-500">
                          关联下载任务
                        </div>
                        <div class="mt-2 text-sm text-slate-700">
                          该日志包含下载任务客户端 ID，可直接跳回下载任务管理页继续排查。
                        </div>
                        <RouterLink
                          :to="downloadTaskLogTarget(log)!"
                          class="mt-3 inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          打开关联下载任务
                        </RouterLink>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
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
  import { RouterLink, useRoute, useRouter } from 'vue-router';
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
  const clientId = ref('');
  const hash = ref('');
  const downloadTaskId = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);
  const selectedLogId = ref<number | null>(null);

  const errorCount = computed(() => logs.value.filter(log => log.status === 'error').length);
  const warningCount = computed(() => logs.value.filter(log => log.status === 'warning').length);
  const downloadTaskLogCount = computed(
    () => logs.value.filter(log => log.resource === 'download_task').length,
  );
  const retryActionCount = computed(
    () =>
      logs.value.filter(log => log.resource === 'download_task' && log.action === 'retry').length,
  );
  const cancelActionCount = computed(
    () =>
      logs.value.filter(log => log.resource === 'download_task' && log.action === 'cancel').length,
  );
  const recentDownloadTaskActionCount = computed(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return logs.value.filter(log => {
      if (log.resource !== 'download_task') {
        return false;
      }

      const createdAt = new Date(log.createdAt).getTime();
      return !Number.isNaN(createdAt) && now - createdAt <= oneDayMs;
    }).length;
  });

  const activeFilterChips = computed(() => {
    const chips: Array<{ key: string; label: string; clear: () => Promise<void> }> = [];

    if (action.value.trim()) {
      chips.push({
        key: 'action',
        label: `操作：${action.value.trim()}`,
        clear: async () => {
          action.value = '';
          await applyFilters(1);
        },
      });
    }

    if (resource.value.trim()) {
      chips.push({
        key: 'resource',
        label: `资源：${resource.value.trim()}`,
        clear: async () => {
          resource.value = '';
          await applyFilters(1);
        },
      });
    }

    if (status.value) {
      chips.push({
        key: 'status',
        label: `状态：${status.value}`,
        clear: async () => {
          status.value = '';
          await applyFilters(1);
        },
      });
    }

    if (clientId.value.trim()) {
      chips.push({
        key: 'clientId',
        label: `clientId：${clientId.value.trim()}`,
        clear: async () => {
          clientId.value = '';
          await applyFilters(1);
        },
      });
    }

    if (hash.value.trim()) {
      chips.push({
        key: 'hash',
        label: `Hash：${hash.value.trim()}`,
        clear: async () => {
          hash.value = '';
          await applyFilters(1);
        },
      });
    }

    if (downloadTaskId.value.trim()) {
      chips.push({
        key: 'downloadTaskId',
        label: `任务：#${downloadTaskId.value.trim()}`,
        clear: async () => {
          downloadTaskId.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedLogId.value) {
      chips.push({
        key: 'logId',
        label: `日志：#${selectedLogId.value}`,
        clear: async () => {
          selectedLogId.value = null;
          await applyFilters(page.value);
        },
      });
    }

    return chips;
  });

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const normalizeHashInput = (value: string) => value.trim().toLowerCase();
  const parseLogId = (value: string) => {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  };

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const queryAction = readSingleQuery(route.query.action);
    const queryResource = readSingleQuery(route.query.resource);
    const queryStatus = readSingleQuery(route.query.status);
    const queryClientId = readSingleQuery(route.query.clientId);
    const queryHash = readSingleQuery(route.query.hash);
    const queryDownloadTaskId = readSingleQuery(route.query.downloadTaskId);
    const queryLogId = Number(readSingleQuery(route.query.logId));

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    action.value = typeof queryAction === 'string' ? queryAction : '';
    resource.value = typeof queryResource === 'string' ? queryResource : '';
    status.value =
      queryStatus === 'success' || queryStatus === 'warning' || queryStatus === 'error'
        ? queryStatus
        : '';
    clientId.value = typeof queryClientId === 'string' ? queryClientId : '';
    hash.value = typeof queryHash === 'string' ? normalizeHashInput(queryHash) : '';
    downloadTaskId.value = typeof queryDownloadTaskId === 'string' ? queryDownloadTaskId : '';
    selectedLogId.value = Number.isFinite(queryLogId) && queryLogId > 0 ? queryLogId : null;
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
    if (clientId.value.trim()) {
      query.clientId = clientId.value.trim();
    }
    if (hash.value.trim()) {
      query.hash = hash.value.trim().toLowerCase();
    }
    if (downloadTaskId.value.trim()) {
      query.downloadTaskId = downloadTaskId.value.trim();
    }
    if (selectedLogId.value) {
      query.logId = String(selectedLogId.value);
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'admin-logs',
      query: buildLogsQuery(nextPage),
    });
  };

  const setActionFilter = async (nextAction: string) => {
    action.value = nextAction;
    await applyFilters(1);
  };

  const setResourceFilter = async (nextResource: string) => {
    resource.value = nextResource;
    await applyFilters(1);
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
        clientId: clientId.value || undefined,
        hash: hash.value || undefined,
        downloadTaskId: downloadTaskId.value ? Number(downloadTaskId.value) : undefined,
        logId: selectedLogId.value || undefined,
      });

      logs.value = response.data;
      if (selectedLogId.value && !response.data.some(log => log.id === selectedLogId.value)) {
        selectedLogId.value = null;
        await router.replace({
          name: 'admin-logs',
          query: buildLogsQuery(response.page),
        });
        return;
      }
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

  const formatMetadataValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return JSON.stringify(value, null, 2);
  };

  const metadataEntries = (log: AdminLogItem) =>
    Object.entries(log.metadata || {}).map(([key, value]) => ({
      key,
      value: formatMetadataValue(value),
    }));

  const downloadTaskLogTarget = (log: AdminLogItem) => {
    if (log.resource !== 'download_task') {
      return null;
    }

    const clientId = typeof log.metadata?.clientId === 'string' ? log.metadata.clientId.trim() : '';
    const infoHash = typeof log.metadata?.infoHash === 'string' ? log.metadata.infoHash.trim() : '';
    const taskId =
      typeof log.metadata?.downloadTaskId === 'number'
        ? log.metadata.downloadTaskId
        : typeof log.metadata?.downloadTaskId === 'string'
          ? Number(log.metadata.downloadTaskId)
          : undefined;

    if (!clientId && !infoHash && !(Number.isFinite(taskId) && taskId)) {
      return null;
    }

    return {
      name: 'admin-download-tasks',
      query: {
        ...(infoHash ? { type: 'magnet' } : {}),
        ...(!infoHash && clientId ? { clientId } : {}),
        ...(infoHash ? { hash: infoHash } : {}),
        ...(Number.isFinite(taskId) && taskId ? { taskId: String(taskId) } : {}),
      },
    };
  };

  const toggleLogDetails = async (id: number) => {
    selectedLogId.value = selectedLogId.value === id ? null : id;
    await router.replace({
      name: 'admin-logs',
      query: buildLogsQuery(page.value),
    });
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
