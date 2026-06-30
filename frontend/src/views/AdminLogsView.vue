<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="logs-title text-2xl font-bold">系统日志</h1>
        <p class="logs-subtitle mt-2">查看后台操作记录、错误信息和状态变化</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="action"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="操作类型，如 create"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="resource"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="资源类型，如 media"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="clientId"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 clientId，如 task-21"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="hash"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 Hash，如 hash-demo"
          @input="hash = normalizeHashInput(($event.target as HTMLInputElement).value)"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="downloadTaskId"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 ID，如 21"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="selectedLogId ? String(selectedLogId) : ''"
          type="text"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          placeholder="日志 ID，如 7"
          @input="selectedLogId = parseLogId(($event.target as HTMLInputElement).value)"
          @keyup.enter="applyFilters(1)"
        />
        <select
          v-model="status"
          class="logs-input rounded-lg border px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部状态</option>
          <option value="success">success</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>
        <button
          class="logs-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          @click="applyFilters(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="logs-card rounded-lg border p-4 shadow-xl">
        <div class="logs-card-label text-sm">总日志数</div>
        <div class="logs-card-value mt-2 text-2xl font-semibold">{{ total }}</div>
      </div>
      <div class="logs-card rounded-lg border p-4 shadow-xl">
        <div class="logs-card-label text-sm">错误日志</div>
        <div class="logs-card-value--error mt-2 text-2xl font-semibold">{{ errorCount }}</div>
      </div>
      <div class="logs-card rounded-lg border p-4 shadow-xl">
        <div class="logs-card-label text-sm">警告日志</div>
        <div class="logs-card-value--warning mt-2 text-2xl font-semibold">{{ warningCount }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <button
        class="logs-card logs-card--clickable rounded-lg border p-4 text-left shadow-xl transition"
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        <div class="logs-card-label text-sm">下载任务日志</div>
        <div class="logs-card-value mt-2 text-2xl font-semibold">{{ downloadTaskLogCount }}</div>
      </button>
      <button
        class="logs-card logs-card--clickable rounded-lg border p-4 text-left shadow-xl transition"
        @click="setActionFilter(action === 'retry' ? '' : 'retry')"
      >
        <div class="logs-card-label text-sm">retry 动作</div>
        <div class="logs-card-value--success mt-2 text-2xl font-semibold">
          {{ retryActionCount }}
        </div>
      </button>
      <button
        class="logs-card logs-card--clickable rounded-lg border p-4 text-left shadow-xl transition"
        @click="setActionFilter(action === 'cancel' ? '' : 'cancel')"
      >
        <div class="logs-card-label text-sm">cancel 动作</div>
        <div class="logs-card-value--error mt-2 text-2xl font-semibold">
          {{ cancelActionCount }}
        </div>
      </button>
      <button
        class="logs-card logs-card--clickable rounded-lg border p-4 text-left shadow-xl transition"
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        <div class="logs-card-label text-sm">24h 下载动作</div>
        <div class="logs-card-value--brand mt-2 text-2xl font-semibold">
          {{ recentDownloadTaskActionCount }}
        </div>
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="logs-chip rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="resource === 'download_task' ? 'logs-chip--active-brand' : 'logs-chip--default'"
        @click="setResourceFilter(resource === 'download_task' ? '' : 'download_task')"
      >
        下载任务日志
      </button>
      <button
        class="logs-chip rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="action === 'retry' ? 'logs-chip--active-success' : 'logs-chip--default'"
        @click="setActionFilter(action === 'retry' ? '' : 'retry')"
      >
        retry 动作
      </button>
      <button
        class="logs-chip rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="action === 'cancel' ? 'logs-chip--active-error' : 'logs-chip--default'"
        @click="setActionFilter(action === 'cancel' ? '' : 'cancel')"
      >
        cancel 动作
      </button>
    </div>

    <div v-if="activeFilterChips.length > 0" class="flex flex-wrap gap-2">
      <span
        v-for="chip in activeFilterChips"
        :key="chip.key"
        class="logs-filter-tag inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
      >
        {{ chip.label }}
        <button class="logs-filter-tag__close" @click="chip.clear">&times;</button>
      </span>
    </div>

    <div class="logs-table-wrap rounded-lg border shadow-xl">
      <div v-if="loading" class="logs-empty-text p-8 text-center">加载中...</div>
      <div v-else-if="error" class="logs-error-text p-8 text-center">{{ error }}</div>
      <template v-else>
        <EmptyState
          v-if="logs.length === 0"
          title="暂无日志记录"
          description="当前筛选条件下没有日志"
          icon="document"
        />
        <template v-else>
          <div class="overflow-x-auto">
            <table class="logs-table min-w-full">
              <thead class="logs-table-thead">
                <tr>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    时间
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    操作
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    资源
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    状态
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    角色
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    用户
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    说明
                  </th>
                  <th
                    class="logs-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    详情
                  </th>
                </tr>
              </thead>
              <tbody class="logs-table-body">
                <template v-for="log in logs" :key="log.id">
                  <tr>
                    <td class="logs-td-muted px-4 py-3 text-sm">{{ formatDate(log.createdAt) }}</td>
                    <td class="logs-td-primary px-4 py-3 text-sm">{{ log.action }}</td>
                    <td class="logs-td-muted px-4 py-3 text-sm">{{ log.resource }}</td>
                    <td class="px-4 py-3 text-sm">
                      <span
                        :class="[
                          'logs-badge rounded-full px-2 py-1 text-xs font-medium',
                          log.status === 'success'
                            ? 'logs-badge--success'
                            : log.status === 'warning'
                              ? 'logs-badge--warning'
                              : 'logs-badge--error',
                        ]"
                      >
                        {{ log.status }}
                      </span>
                    </td>
                    <td class="logs-td-muted px-4 py-3 text-sm">
                      {{ log.role?.name || `#${log.roleId}` }}
                    </td>
                    <td class="logs-td-muted px-4 py-3 text-sm">
                      {{ log.user?.username || (log.userId ? `#${log.userId}` : '系统') }}
                    </td>
                    <td class="logs-td-muted px-4 py-3 text-sm">
                      <div class="line-clamp-2">
                        {{ log.errorMessage || log.description || '—' }}
                      </div>
                    </td>
                    <td class="logs-td-muted px-4 py-3 text-sm">
                      <button
                        class="logs-detail-btn rounded border px-3 py-1 text-xs font-medium"
                        @click="toggleLogDetails(log.id)"
                      >
                        {{ selectedLogId === log.id ? '收起' : '详情' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="selectedLogId === log.id" class="logs-expanded-row">
                    <td colspan="8" class="px-4 py-4">
                      <div class="grid gap-4 lg:grid-cols-2">
                        <div class="logs-detail-panel rounded-xl border px-4 py-3">
                          <div
                            class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                          >
                            元数据
                          </div>
                          <div
                            v-if="metadataEntries(log).length === 0"
                            class="logs-detail-empty mt-2 text-sm"
                          >
                            暂无元数据
                          </div>
                          <div v-else class="logs-detail-text mt-2 space-y-2 text-sm">
                            <div
                              v-for="item in metadataEntries(log)"
                              :key="`${log.id}-${item.key}`"
                            >
                              <div
                                class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                              >
                                {{ item.key }}
                              </div>
                              <div class="mt-1 break-all">{{ item.value }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="logs-detail-panel rounded-xl border px-4 py-3">
                          <div
                            class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                          >
                            请求信息
                          </div>
                          <div v-if="!log.requestInfo" class="logs-detail-empty mt-2 text-sm">
                            暂无请求信息
                          </div>
                          <div v-else class="logs-detail-text mt-2 space-y-2 text-sm">
                            <div>
                              <div
                                class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                              >
                                Method / URL
                              </div>
                              <div class="mt-1 break-all">
                                {{ log.requestInfo.method || '—' }} {{ log.requestInfo.url || '' }}
                              </div>
                            </div>
                            <div>
                              <div
                                class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                              >
                                IP
                              </div>
                              <div class="mt-1 break-all">{{ log.requestInfo.ip || '—' }}</div>
                            </div>
                            <div>
                              <div
                                class="logs-detail-label text-xs font-medium uppercase tracking-wide"
                              >
                                User Agent
                              </div>
                              <div class="mt-1 break-all">
                                {{ log.requestInfo.userAgent || '—' }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="downloadTaskLogTarget(log)"
                          class="logs-download-panel rounded-xl border px-4 py-3 lg:col-span-2"
                        >
                          <div
                            class="logs-download-label text-xs font-medium uppercase tracking-wide"
                          >
                            关联下载任务
                          </div>
                          <div class="logs-detail-text mt-2 text-sm">
                            该日志包含下载任务客户端 ID，可直接跳回下载任务管理页继续排查。
                          </div>
                          <RouterLink
                            :to="downloadTaskLogTarget(log)!"
                            class="logs-download-link mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-medium"
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

          <div class="logs-pagination flex items-center justify-between border-t px-4 py-3 text-sm">
            <span>共 {{ total }} 条</span>
            <div class="flex items-center gap-3">
              <button
                :disabled="page <= 1"
                class="logs-pagination-btn rounded border px-3 py-1 disabled:opacity-50"
                @click="applyFilters(page - 1)"
              >
                上一页
              </button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button
                :disabled="page >= totalPages"
                class="logs-pagination-btn rounded border px-3 py-1 disabled:opacity-50"
                @click="applyFilters(page + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { adminApi } from '@/api/admin';
  import type { AdminLogItem } from '@/api/admin';
  import EmptyState from '@/components/EmptyState.vue';

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
  /* ===== Typography ===== */
  .logs-title {
    color: var(--text-primary);
  }

  .logs-subtitle {
    color: var(--text-muted);
  }

  /* ===== Form inputs ===== */
  .logs-input {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .logs-input::placeholder {
    color: var(--text-muted);
  }

  /* ===== Primary button ===== */
  .logs-btn-primary {
    background-color: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .logs-btn-primary:hover {
    background-color: var(--color-brand-primary-dark);
  }

  /* ===== Cards ===== */
  .logs-card {
    border-color: var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  .logs-card--clickable:hover {
    background-color: var(--bg-secondary);
  }

  .logs-card-label {
    color: var(--text-tertiary);
  }

  .logs-card-value {
    color: var(--text-primary);
  }

  .logs-card-value--error {
    color: var(--color-error-light);
  }

  .logs-card-value--warning {
    color: var(--color-warning-light);
  }

  .logs-card-value--success {
    color: var(--color-success-light);
  }

  .logs-card-value--brand {
    color: var(--color-brand-primary-light);
  }

  /* ===== Filter chips ===== */
  .logs-chip--default {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .logs-chip--default:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .logs-chip--active-brand {
    border-color: var(--color-info-border);
    background-color: var(--color-info-overlay);
    color: var(--color-brand-primary-light);
  }

  .logs-chip--active-success {
    border-color: var(--color-success-border);
    background-color: var(--color-success-overlay);
    color: var(--color-success-light);
  }

  .logs-chip--active-error {
    border-color: var(--color-error-border);
    background-color: var(--color-error-overlay);
    color: var(--color-error-light);
  }

  /* ===== Active filter tags ===== */
  .logs-filter-tag {
    border-color: rgba(100, 116, 139, 0.3);
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--text-secondary);
  }

  .logs-filter-tag__close {
    color: var(--text-muted);
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    line-height: 1;
  }

  .logs-filter-tag__close:hover {
    color: var(--text-secondary);
  }

  /* ===== Table ===== */
  .logs-table-wrap {
    border-color: var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  .logs-table {
    border-collapse: separate;
    border-spacing: 0;
  }

  .logs-table-thead {
    background-color: rgba(255, 255, 255, 0.02);
  }

  .logs-table-body tr {
    border-bottom: 1px solid var(--border-primary);
  }

  .logs-table-body tr:last-child {
    border-bottom: none;
  }

  .logs-th {
    color: var(--text-tertiary);
  }

  .logs-td-muted {
    color: var(--text-tertiary);
  }

  .logs-td-primary {
    color: var(--text-primary);
  }

  /* ===== Status badges ===== */
  .logs-badge--success {
    background-color: var(--color-success-overlay);
    color: var(--color-success-light);
  }

  .logs-badge--warning {
    background-color: var(--color-warning-overlay);
    color: var(--color-warning-light);
  }

  .logs-badge--error {
    background-color: var(--color-error-overlay);
    color: var(--color-error-light);
  }

  /* ===== Detail button ===== */
  .logs-detail-btn {
    border-color: rgba(100, 116, 139, 0.3);
    color: var(--text-secondary);
  }

  .logs-detail-btn:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  /* ===== Expanded row ===== */
  .logs-expanded-row {
    background-color: rgba(255, 255, 255, 0.02);
  }

  /* ===== Detail panels ===== */
  .logs-detail-panel {
    border-color: rgba(51, 65, 85, 0.5);
    background-color: var(--bg-tertiary);
  }

  .logs-detail-label {
    color: var(--text-muted);
  }

  .logs-detail-text {
    color: var(--text-secondary);
  }

  .logs-detail-empty {
    color: var(--text-muted);
  }

  /* ===== Download task section ===== */
  .logs-download-panel {
    border-color: var(--color-info-border);
    background-color: var(--color-info-overlay);
  }

  .logs-download-label {
    color: var(--color-brand-primary-light);
  }

  .logs-download-link {
    border-color: var(--color-info-border);
    background-color: var(--color-info-overlay);
    color: var(--color-brand-primary-light);
  }

  .logs-download-link:hover {
    background-color: var(--color-info-border);
  }

  /* ===== Empty / error states ===== */
  .logs-empty-text {
    color: var(--text-tertiary);
  }

  .logs-error-text {
    color: var(--color-error-light);
  }

  /* ===== Pagination ===== */
  .logs-pagination {
    border-color: var(--border-primary);
    color: var(--text-tertiary);
  }

  .logs-pagination-btn {
    border-color: var(--border-primary);
    color: var(--text-secondary);
  }

  /* ===== Utility ===== */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
