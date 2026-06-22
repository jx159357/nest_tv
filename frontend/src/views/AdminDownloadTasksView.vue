<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold dt-text-primary">下载任务管理</h1>
        <p class="mt-2 dt-text-muted">查看用户下载任务、关联媒体、启动状态和异常信息。</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="search"
          type="text"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          placeholder="文件名 / clientId / 来源 / 链接 / 用户"
          @keyup.enter="applyFilters(1)"
        />
        <input
          v-model="selectedClientId"
          type="text"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 clientId，如 task-21"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="selectedHash"
          type="text"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 Hash，如 hash-demo"
          @input="selectedHash = normalizeHashInput(($event.target as HTMLInputElement).value)"
          @keyup.enter="applyFilters(1)"
        />
        <input
          :value="selectedTaskId ? String(selectedTaskId) : ''"
          type="text"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          placeholder="任务 ID，如 21"
          @input="selectedTaskId = parseTaskId(($event.target as HTMLInputElement).value)"
          @keyup.enter="applyFilters(1)"
        />
        <select
          v-model="selectedStatus"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部状态</option>
          <option value="pending">pending</option>
          <option value="downloading">downloading</option>
          <option value="paused">paused</option>
          <option value="completed">completed</option>
          <option value="error">error</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select
          v-model="selectedType"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部类型</option>
          <option value="direct">direct</option>
          <option value="torrent">torrent</option>
          <option value="magnet">magnet</option>
        </select>
        <select
          v-model="selectedUserId"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部用户</option>
          <option v-for="user in users" :key="user.id" :value="String(user.id)">
            {{ user.nickname || user.username }}
          </option>
        </select>
        <select
          v-model="sortMode"
          class="dt-input rounded-lg border px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="updated">最近更新</option>
          <option value="started">最近启动</option>
          <option value="exceptions">异常优先</option>
        </select>
        <button
          class="dt-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          @click="applyFilters(1)"
        >
          刷新
        </button>
        <button
          class="dt-btn-secondary rounded-lg border px-4 py-2 text-sm font-medium"
          @click="resetFilters"
        >
          清空筛选
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="selectedStatus === '' ? 'dt-pill-active-brand' : 'dt-pill-inactive'"
        @click="setStatusFilter('')"
      >
        全部任务
      </button>
      <button
        v-for="item in quickStatusFilters"
        :key="item.value"
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="selectedStatus === item.value ? 'dt-pill-active-brand' : 'dt-pill-inactive'"
        @click="setStatusFilter(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="selectedType === '' ? 'dt-pill-active-success' : 'dt-pill-inactive'"
        @click="setTypeFilter('')"
      >
        全部类型
      </button>
      <button
        v-for="item in quickTypeFilters"
        :key="item.value"
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="selectedType === item.value ? 'dt-pill-active-success' : 'dt-pill-inactive'"
        @click="setTypeFilter(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div v-if="activeFilterChips.length > 0" class="flex flex-wrap gap-2">
      <span
        v-for="chip in activeFilterChips"
        :key="chip.key"
        class="dt-chip inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
      >
        {{ chip.label }}
        <button class="dt-chip-close" @click="chip.clear">×</button>
      </span>
    </div>

    <div
      v-if="actionState"
      class="rounded-xl border px-4 py-3 text-sm"
      :class="actionState.status === 'success' ? 'dt-alert-success' : 'dt-alert-error'"
    >
      {{ actionState.message }}
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">当前结果</div>
        <div class="mt-2 text-2xl font-semibold dt-text-primary">{{ total }}</div>
      </div>
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">进行中 / 待处理</div>
        <div class="mt-2 text-2xl font-semibold dt-text-brand">{{ activeCount }}</div>
      </div>
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">已完成</div>
        <div class="mt-2 text-2xl font-semibold dt-text-success-light">{{ completedCount }}</div>
      </div>
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">异常 / 取消</div>
        <div class="mt-2 text-2xl font-semibold dt-text-error-light">{{ failedCount }}</div>
      </div>
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">覆盖用户 / 媒体</div>
        <div class="mt-2 text-2xl font-semibold dt-text-primary">
          {{ uniqueUserCount }} / {{ uniqueMediaCount }}
        </div>
      </div>
      <div class="dt-stat-card rounded-lg border shadow-xl p-4">
        <div class="text-sm dt-text-muted">24h 内启动 / Magnet</div>
        <div class="mt-2 text-2xl font-semibold dt-text-primary">
          {{ startedRecentlyCount }} / {{ magnetCount }}
        </div>
      </div>
    </div>

    <div v-if="showExceptionBanner" class="dt-alert-error rounded-xl border px-4 py-3 text-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          当前结果中有 {{ failedCount }} 条异常 / 取消任务，建议切换到"异常优先"或直接筛选异常任务。
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="dt-btn-rose rounded-lg border px-3 py-1.5 font-medium"
            @click="setStatusFilter('error')"
          >
            只看异常
          </button>
          <button
            class="dt-btn-rose rounded-lg border px-3 py-1.5 font-medium"
            @click="setSortMode('exceptions')"
          >
            异常优先
          </button>
          <button
            class="dt-btn-rose rounded-lg border px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="bulkActionLoading"
            @click="retryVisibleFailedTasks"
          >
            {{ bulkActionLoading ? '处理中...' : '重置当前页异常' }}
          </button>
          <button
            class="dt-btn-secondary rounded-lg border px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="bulkActionLoading || cancellableTaskCount === 0"
            @click="cancelVisiblePendingTasks"
          >
            {{ bulkActionLoading ? '处理中...' : '取消当前页未完成' }}
          </button>
        </div>
      </div>
    </div>

    <div class="dt-section-card rounded-lg border shadow-xl">
      <div v-if="loading" class="p-8 text-center dt-text-muted">加载中...</div>
      <div v-else-if="error" class="p-8 text-center dt-text-error-light">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="dt-table min-w-full divide-y">
            <thead class="dt-table-head">
              <tr>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  用户 / 媒体
                </th>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  文件
                </th>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  状态
                </th>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  进度
                </th>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  类型
                </th>
                <th class="dt-th px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  最近更新
                </th>
              </tr>
            </thead>
            <tbody class="dt-table-body divide-y">
              <template v-for="task in displayedTasks" :key="task.id">
                <tr :class="rowClass(task)">
                  <td class="px-4 py-3 text-sm dt-text-primary">
                    <div class="font-medium">
                      {{ task.user?.username || `用户#${task.userId}` }}
                    </div>
                    <div class="text-xs dt-text-muted">{{ task.user?.email || '—' }}</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button
                        class="dt-tag-btn rounded-full border px-2.5 py-1 text-xs"
                        @click="setUserFilter(task.userId)"
                      >
                        同用户任务
                      </button>
                      <button
                        v-if="task.mediaResourceId"
                        class="dt-tag-btn rounded-full border px-2.5 py-1 text-xs"
                        @click="setMediaFilter(task.mediaResourceId)"
                      >
                        同媒体任务
                      </button>
                      <button
                        class="dt-tag-btn rounded-full border px-2.5 py-1 text-xs"
                        @click="setTypeFilter(task.type)"
                      >
                        同类型任务
                      </button>
                    </div>
                    <RouterLink
                      v-if="task.mediaResourceId"
                      :to="{ name: 'media-detail', params: { id: task.mediaResourceId } }"
                      class="dt-link mt-2 inline-flex text-xs"
                    >
                      {{ task.mediaResource?.title || `媒体#${task.mediaResourceId}` }}
                    </RouterLink>
                    <div v-else class="mt-2 text-xs dt-text-tertiary">未关联媒体</div>
                  </td>
                  <td class="px-4 py-3 text-sm dt-text-primary">
                    <div class="font-medium">{{ task.fileName }}</div>
                    <div class="mt-1 text-xs dt-text-muted">
                      {{ task.sourceLabel || '未标记来源' }}
                    </div>
                    <div class="dt-text-tertiary mt-1 max-w-md break-all text-xs">
                      {{ task.url }}
                    </div>
                    <div v-if="task.error" class="dt-text-error-light mt-2 text-xs">
                      {{ task.error }}
                    </div>
                    <button
                      class="dt-detail-btn task-detail-toggle mt-3 rounded-lg border px-3 py-1.5 text-xs font-medium"
                      @click="toggleTaskDetails(task.id)"
                    >
                      {{ selectedTaskId === task.id ? '收起详情' : '查看详情' }}
                    </button>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span
                      :class="statusClass(task.status)"
                      class="rounded-full px-2 py-1 text-xs font-medium"
                    >
                      {{ task.status }}
                    </span>
                    <div class="dt-text-muted mt-2 text-xs">
                      启动 {{ task.launchCount || 0 }} 次
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm dt-text-muted">
                    <div class="dt-progress-track h-2 w-28 overflow-hidden rounded-full">
                      <div
                        class="dt-progress-bar h-full"
                        :style="{ width: `${displayProgress(task)}%` }"
                      ></div>
                    </div>
                    <div class="dt-text-muted mt-1 text-xs">
                      {{ displayProgress(task) }}% · {{ formatBytes(task.downloaded) }} /
                      {{ formatBytes(task.total) }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm dt-text-muted">
                    <div>{{ task.type }}</div>
                    <div class="dt-text-tertiary mt-1 text-xs">{{ task.handler || 'browser' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm dt-text-muted">
                    <div>{{ formatDate(task.updatedAt) }}</div>
                    <div class="dt-text-tertiary mt-1 text-xs">
                      {{
                        task.lastLaunchedAt
                          ? `启动：${formatDate(task.lastLaunchedAt)}`
                          : '尚未启动'
                      }}
                    </div>
                  </td>
                </tr>
                <tr v-if="selectedTaskId === task.id" class="dt-row-bg-subtle">
                  <td colspan="6" class="px-4 py-4">
                    <div class="task-detail-panel grid gap-4 lg:grid-cols-2">
                      <div
                        class="dt-recommend-box rounded-xl border px-4 py-4 lg:col-span-2"
                        data-testid="task-recommendation"
                      >
                        <div class="text-xs font-medium uppercase tracking-wide dt-text-brand">
                          Recommended Action
                        </div>
                        <div
                          class="dt-text-primary mt-2 text-sm font-semibold"
                          data-testid="task-recommendation-title"
                        >
                          {{ taskRecommendation(task).title }}
                        </div>
                        <div class="dt-text-muted mt-2 text-sm">
                          {{ taskRecommendation(task).description }}
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                          <router-link
                            v-for="action in taskRecommendation(task).actions"
                            :key="`${task.id}-${action.label}`"
                            :to="action.to"
                            class="dt-action-brand rounded-full border px-3 py-1.5 text-xs font-medium"
                          >
                            {{ action.label }}
                          </router-link>
                          <button
                            v-if="task.status === 'error' || task.status === 'cancelled'"
                            class="dt-action-success rounded-full border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="actionLoadingTaskId === task.id"
                            @click="handleTaskAction(task, 'retry')"
                          >
                            {{ actionLoadingTaskId === task.id ? '处理中...' : '重置为待处理' }}
                          </button>
                          <button
                            v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                            class="dt-action-error rounded-full border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="actionLoadingTaskId === task.id"
                            @click="handleTaskAction(task, 'cancel')"
                          >
                            {{ actionLoadingTaskId === task.id ? '处理中...' : '标记取消' }}
                          </button>
                        </div>
                      </div>
                      <div class="space-y-3 text-sm dt-text-muted">
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            Task ID
                          </div>
                          <div class="mt-1">{{ task.clientId }}</div>
                        </div>
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            创建 / 完成
                          </div>
                          <div class="mt-1">{{ formatDate(task.createdAt) }}</div>
                          <div class="dt-text-tertiary mt-1 text-xs">
                            {{
                              task.completedAt
                                ? `完成：${formatDate(task.completedAt)}`
                                : '尚未完成'
                            }}
                          </div>
                        </div>
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            最近启动
                          </div>
                          <div class="mt-1">
                            {{ task.lastLaunchedAt ? formatDate(task.lastLaunchedAt) : '尚未启动' }}
                          </div>
                        </div>
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            保存路径
                          </div>
                          <div class="mt-1 break-all">{{ task.filePath || '未记录' }}</div>
                        </div>
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            原始链接
                          </div>
                          <a
                            :href="task.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="dt-link mt-1 inline-flex break-all"
                          >
                            {{ task.url }}
                          </a>
                        </div>
                      </div>
                      <div class="space-y-3 text-sm dt-text-muted">
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            错误详情
                          </div>
                          <div class="dt-error-box mt-1 rounded-lg border px-3 py-2 text-sm">
                            {{ task.error || '暂无错误信息' }}
                          </div>
                        </div>
                        <div>
                          <div class="dt-detail-label text-xs font-medium uppercase tracking-wide">
                            Metadata
                          </div>
                          <div v-if="metadataEntries(task).length > 0" class="mt-1 space-y-2">
                            <div
                              v-for="item in metadataEntries(task)"
                              :key="item.key"
                              class="dt-metadata-box rounded-lg border px-3 py-2"
                            >
                              <div
                                class="dt-detail-label text-xs font-medium uppercase tracking-wide"
                              >
                                {{ item.key }}
                              </div>
                              <div class="mt-1 break-all">{{ item.value }}</div>
                            </div>
                          </div>
                          <div
                            v-else
                            class="dt-metadata-empty mt-1 rounded-lg border border-dashed px-3 py-2"
                          >
                            暂无 metadata
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="dt-pagination flex items-center justify-between border-t px-4 py-3 text-sm">
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="dt-page-btn rounded border px-3 py-1 disabled:opacity-50"
              @click="applyFilters(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="dt-page-btn rounded border px-3 py-1 disabled:opacity-50"
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
  import { computed, onMounted, ref, watch } from 'vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import {
    adminApi,
    type AdminDownloadTaskActionPayload,
    type AdminDownloadTaskItem,
  } from '@/api/admin';
  import { showConfirm } from '@/composables/useModal';
  import type { User } from '@/types/user';
  import { log } from '@/utils/logger';

  const route = useRoute();
  const router = useRouter();
  const tasks = ref<AdminDownloadTaskItem[]>([]);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);
  const search = ref('');
  const selectedClientId = ref('');
  const selectedHash = ref('');
  const selectedStatus = ref<AdminDownloadTaskItem['status'] | ''>('');
  const selectedType = ref<AdminDownloadTaskItem['type'] | ''>('');
  const selectedUserId = ref('');
  const selectedMediaResourceId = ref('');
  const selectedTaskId = ref<number | null>(null);
  const sortMode = ref<'updated' | 'started' | 'exceptions'>('updated');
  const actionLoadingTaskId = ref<number | null>(null);
  const actionState = ref<{ status: 'success' | 'error'; message: string } | null>(null);
  const bulkActionLoading = ref(false);

  const taskStatuses: AdminDownloadTaskItem['status'][] = [
    'pending',
    'downloading',
    'paused',
    'completed',
    'error',
    'cancelled',
  ];
  const taskTypes: AdminDownloadTaskItem['type'][] = ['direct', 'torrent', 'magnet'];
  const quickStatusFilters: Array<{ label: string; value: AdminDownloadTaskItem['status'] }> = [
    { label: '待处理', value: 'pending' },
    { label: '进行中', value: 'downloading' },
    { label: '已完成', value: 'completed' },
    { label: '异常', value: 'error' },
  ];
  const quickTypeFilters: Array<{ label: string; value: AdminDownloadTaskItem['type'] }> = [
    { label: '直链 / 协议', value: 'direct' },
    { label: '种子文件', value: 'torrent' },
    { label: 'Magnet', value: 'magnet' },
  ];

  const activeCount = computed(
    () =>
      tasks.value.filter(task => task.status === 'pending' || task.status === 'downloading').length,
  );
  const completedCount = computed(
    () => tasks.value.filter(task => task.status === 'completed').length,
  );
  const failedCount = computed(
    () => tasks.value.filter(task => task.status === 'error' || task.status === 'cancelled').length,
  );
  const uniqueUserCount = computed(() => new Set(tasks.value.map(task => task.userId)).size);
  const uniqueMediaCount = computed(
    () =>
      new Set(
        tasks.value
          .map(task => task.mediaResourceId)
          .filter((value): value is number => Boolean(value)),
      ).size,
  );
  const magnetCount = computed(() => tasks.value.filter(task => task.type === 'magnet').length);
  const cancellableTaskCount = computed(
    () =>
      tasks.value.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length,
  );
  const startedRecentlyCount = computed(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return tasks.value.filter(task => {
      if (!task.lastLaunchedAt) {
        return false;
      }
      const launchedAt = new Date(task.lastLaunchedAt).getTime();
      return !Number.isNaN(launchedAt) && now - launchedAt <= oneDayMs;
    }).length;
  });
  const showExceptionBanner = computed(
    () =>
      failedCount.value > 0 && selectedStatus.value !== 'error' && sortMode.value !== 'exceptions',
  );
  const displayedTasks = computed(() => {
    const getTime = (value?: string | null) => {
      if (!value) return 0;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const getExceptionWeight = (status: AdminDownloadTaskItem['status']) => {
      switch (status) {
        case 'error':
          return 5;
        case 'cancelled':
          return 4;
        case 'downloading':
          return 3;
        case 'pending':
          return 2;
        case 'paused':
          return 1;
        default:
          return 0;
      }
    };

    return [...tasks.value].sort((left, right) => {
      if (sortMode.value === 'started') {
        return (
          getTime(right.lastLaunchedAt) - getTime(left.lastLaunchedAt) ||
          getTime(right.updatedAt) - getTime(left.updatedAt)
        );
      }

      if (sortMode.value === 'exceptions') {
        return (
          getExceptionWeight(right.status) - getExceptionWeight(left.status) ||
          getTime(right.updatedAt) - getTime(left.updatedAt)
        );
      }

      return getTime(right.updatedAt) - getTime(left.updatedAt);
    });
  });

  const activeFilterChips = computed(() => {
    const chips: Array<{ key: string; label: string; clear: () => Promise<void> }> = [];

    if (search.value.trim()) {
      chips.push({
        key: 'search',
        label: `搜索：${search.value.trim()}`,
        clear: async () => {
          search.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedStatus.value) {
      chips.push({
        key: 'status',
        label: `状态：${selectedStatus.value}`,
        clear: async () => {
          selectedStatus.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedType.value) {
      chips.push({
        key: 'type',
        label: `类型：${selectedType.value}`,
        clear: async () => {
          selectedType.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedUserId.value) {
      const matchedUser = users.value.find(user => String(user.id) === selectedUserId.value);
      chips.push({
        key: 'user',
        label: `用户：${matchedUser?.nickname || matchedUser?.username || `#${selectedUserId.value}`}`,
        clear: async () => {
          selectedUserId.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedMediaResourceId.value) {
      chips.push({
        key: 'media',
        label: `媒体：#${selectedMediaResourceId.value}`,
        clear: async () => {
          selectedMediaResourceId.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedClientId.value.trim()) {
      chips.push({
        key: 'clientId',
        label: `clientId：${selectedClientId.value.trim()}`,
        clear: async () => {
          selectedClientId.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedHash.value) {
      chips.push({
        key: 'hash',
        label: `Hash：${selectedHash.value}`,
        clear: async () => {
          selectedHash.value = '';
          await applyFilters(1);
        },
      });
    }

    if (selectedTaskId.value) {
      chips.push({
        key: 'taskId',
        label: `任务：#${selectedTaskId.value}`,
        clear: async () => {
          selectedTaskId.value = null;
          await applyFilters(1);
        },
      });
    }

    if (sortMode.value !== 'updated') {
      chips.push({
        key: 'sort',
        label: `排序：${sortMode.value === 'started' ? '最近启动' : '异常优先'}`,
        clear: async () => {
          sortMode.value = 'updated';
          await applyFilters(1);
        },
      });
    }

    return chips;
  });

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers({ page: 1, limit: 100 });
      users.value = response.data;
    } catch (err) {
      log.error('AdminDownloadTasks', '加载用户列表失败:', err);
    }
  };

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const normalizeHashInput = (value: string) => value.trim().toLowerCase();
  const parseTaskId = (value: string) => {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  };

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const querySearch = readSingleQuery(route.query.search);
    const queryClientId = readSingleQuery(route.query.clientId);
    const queryStatus = readSingleQuery(route.query.status);
    const queryType = readSingleQuery(route.query.type);
    const queryHash = readSingleQuery(route.query.hash);
    const queryUserId = readSingleQuery(route.query.userId);
    const queryMediaResourceId = readSingleQuery(route.query.mediaResourceId);
    const querySort = readSingleQuery(route.query.sort);
    const queryTaskId = Number(readSingleQuery(route.query.taskId));

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    search.value = typeof querySearch === 'string' ? querySearch : '';
    selectedClientId.value = typeof queryClientId === 'string' ? queryClientId : '';
    selectedStatus.value =
      typeof queryStatus === 'string' &&
      taskStatuses.includes(queryStatus as AdminDownloadTaskItem['status'])
        ? (queryStatus as AdminDownloadTaskItem['status'])
        : '';
    selectedType.value =
      typeof queryType === 'string' &&
      taskTypes.includes(queryType as AdminDownloadTaskItem['type'])
        ? (queryType as AdminDownloadTaskItem['type'])
        : '';
    selectedHash.value = typeof queryHash === 'string' ? normalizeHashInput(queryHash) : '';
    selectedUserId.value = typeof queryUserId === 'string' ? queryUserId : '';
    selectedMediaResourceId.value =
      typeof queryMediaResourceId === 'string' ? queryMediaResourceId : '';
    sortMode.value =
      querySort === 'started' || querySort === 'exceptions' || querySort === 'updated'
        ? querySort
        : 'updated';
    selectedTaskId.value = Number.isFinite(queryTaskId) && queryTaskId > 0 ? queryTaskId : null;
  };

  const buildTaskQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (search.value.trim()) {
      query.search = search.value.trim();
    }
    if (selectedClientId.value.trim()) {
      query.clientId = selectedClientId.value.trim();
    }
    if (selectedStatus.value) {
      query.status = selectedStatus.value;
    }
    if (selectedType.value) {
      query.type = selectedType.value;
    }
    if (selectedHash.value) {
      query.hash = selectedHash.value;
    }
    if (selectedUserId.value) {
      query.userId = selectedUserId.value;
    }
    if (selectedMediaResourceId.value) {
      query.mediaResourceId = selectedMediaResourceId.value;
    }
    if (selectedTaskId.value) {
      query.taskId = String(selectedTaskId.value);
    }
    if (sortMode.value !== 'updated') {
      query.sort = sortMode.value;
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'admin-download-tasks',
      query: buildTaskQuery(nextPage),
    });
  };

  const resetFilters = async () => {
    search.value = '';
    selectedClientId.value = '';
    selectedHash.value = '';
    selectedStatus.value = '';
    selectedType.value = '';
    selectedUserId.value = '';
    selectedMediaResourceId.value = '';
    sortMode.value = 'updated';
    selectedTaskId.value = null;
    await router.replace({ name: 'admin-download-tasks', query: {} });
  };

  const setStatusFilter = async (status: AdminDownloadTaskItem['status'] | '') => {
    selectedStatus.value = status;
    await applyFilters(1);
  };

  const setTypeFilter = async (type: AdminDownloadTaskItem['type'] | '') => {
    selectedType.value = type;
    await applyFilters(1);
  };

  const setSortMode = async (mode: 'updated' | 'started' | 'exceptions') => {
    sortMode.value = mode;
    await applyFilters(1);
  };

  const setUserFilter = async (userId: number) => {
    selectedUserId.value = String(userId);
    await applyFilters(1);
  };

  const setMediaFilter = async (mediaResourceId?: number | null) => {
    selectedMediaResourceId.value = mediaResourceId ? String(mediaResourceId) : '';
    await applyFilters(1);
  };

  const toggleTaskDetails = async (taskId: number) => {
    selectedTaskId.value = selectedTaskId.value === taskId ? null : taskId;
    await router.replace({
      name: 'admin-download-tasks',
      query: buildTaskQuery(page.value),
    });
  };

  const handleTaskAction = async (
    task: AdminDownloadTaskItem,
    action: AdminDownloadTaskActionPayload['action'],
  ) => {
    actionLoadingTaskId.value = task.id;
    actionState.value = null;

    try {
      await adminApi.handleDownloadTask(task.id, { action });
      actionState.value = {
        status: 'success',
        message:
          action === 'retry'
            ? `已将任务「${task.fileName}」重置为待处理。`
            : `已将任务「${task.fileName}」标记为取消。`,
      };
      await loadTasks(page.value);
      selectedTaskId.value = task.id;
    } catch (err: unknown) {
      actionState.value = {
        status: 'error',
        message: err instanceof Error ? err.message : '处理下载任务失败',
      };
    } finally {
      actionLoadingTaskId.value = null;
    }
  };

  const retryVisibleFailedTasks = async () => {
    const failedTasks = tasks.value.filter(
      task => task.status === 'error' || task.status === 'cancelled',
    );

    if (failedTasks.length === 0) {
      return;
    }

    bulkActionLoading.value = true;
    actionState.value = null;

    try {
      await adminApi.handleDownloadTasksBatch({
        action: 'retry',
        ids: failedTasks.map(task => task.id),
      });
      actionState.value = {
        status: 'success',
        message: `已将当前页 ${failedTasks.length} 条异常任务重置为待处理。`,
      };
      await loadTasks(page.value);
    } catch (err: unknown) {
      actionState.value = {
        status: 'error',
        message: err instanceof Error ? err.message : '批量重置异常任务失败',
      };
    } finally {
      bulkActionLoading.value = false;
    }
  };

  const cancelVisiblePendingTasks = () => {
    const targetTasks = tasks.value.filter(
      task => task.status !== 'completed' && task.status !== 'cancelled',
    );

    if (targetTasks.length === 0) {
      return;
    }

    showConfirm(
      `确定要将当前页 ${targetTasks.length} 条未完成任务标记为取消吗？`,
      async () => {
        bulkActionLoading.value = true;
        actionState.value = null;

        try {
          await adminApi.handleDownloadTasksBatch({
            action: 'cancel',
            ids: targetTasks.map(task => task.id),
          });
          actionState.value = {
            status: 'success',
            message: `已将当前页 ${targetTasks.length} 条未完成任务标记为取消。`,
          };
          await loadTasks(page.value);
        } catch (err: unknown) {
          actionState.value = {
            status: 'error',
            message: err instanceof Error ? err.message : '批量取消下载任务失败',
          };
        } finally {
          bulkActionLoading.value = false;
        }
      },
      '批量取消任务',
      '确认取消',
    );
  };

  const loadTasks = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getDownloadTasks({
        page: nextPage,
        limit: 10,
        search: search.value || undefined,
        clientId: selectedClientId.value || undefined,
        hash: selectedHash.value || undefined,
        taskId: selectedTaskId.value || undefined,
        status: selectedStatus.value || undefined,
        type: selectedType.value || undefined,
        userId: selectedUserId.value ? Number(selectedUserId.value) : undefined,
        mediaResourceId: selectedMediaResourceId.value
          ? Number(selectedMediaResourceId.value)
          : undefined,
      });

      tasks.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
      if (response.page !== nextPage) {
        await router.replace({
          name: 'admin-download-tasks',
          query: buildTaskQuery(response.page),
        });
        return;
      }
      if (selectedTaskId.value && !response.data.some(task => task.id === selectedTaskId.value)) {
        selectedTaskId.value = null;
        await router.replace({
          name: 'admin-download-tasks',
          query: buildTaskQuery(response.page),
        });
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载下载任务失败';
    } finally {
      loading.value = false;
    }
  };

  const displayProgress = (task: AdminDownloadTaskItem) => {
    if (task.status === 'completed') {
      return 100;
    }

    return Math.max(0, Math.min(100, Math.round(task.progress || 0)));
  };

  const statusClass = (status: AdminDownloadTaskItem['status']) => {
    const classMap: Record<AdminDownloadTaskItem['status'], string> = {
      pending: 'dt-status--pending',
      downloading: 'dt-status--downloading',
      paused: 'dt-status--paused',
      completed: 'dt-status--completed',
      error: 'dt-status--error',
      cancelled: 'dt-status--cancelled',
    };

    return classMap[status];
  };

  const rowClass = (task: AdminDownloadTaskItem) => {
    if (task.status === 'error' || task.status === 'cancelled') {
      return 'dt-row--error';
    }
    if (task.status === 'downloading') {
      return 'dt-row--downloading';
    }
    return '';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('zh-CN');
  };

  const formatBytes = (value?: number) => {
    const size = Number(value || 0);
    if (size <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const normalized = size / 1024 ** exponent;
    return `${normalized.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
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

  const metadataEntries = (task: AdminDownloadTaskItem) => {
    return Object.entries(task.metadata || {}).map(([key, value]) => ({
      key,
      value: formatMetadataValue(value),
    }));
  };

  const extractTaskInfoHash = (task: AdminDownloadTaskItem) => {
    if (task.type !== 'magnet') {
      return null;
    }

    const magnetMatch = task.url.match(/(?:\?|&)xt=urn:btih:([^&]+)/i);
    if (magnetMatch?.[1]) {
      return decodeURIComponent(magnetMatch[1]).trim().toLowerCase();
    }

    return null;
  };

  const taskRecommendation = (task: AdminDownloadTaskItem) => {
    const actions: Array<{ label: string; to: string | Record<string, unknown> }> = [];
    const magnetHash = extractTaskInfoHash(task);

    if (task.userId) {
      actions.push({
        label: 'Same user tasks',
        to: { name: 'admin-download-tasks', query: { userId: String(task.userId) } },
      });
    }

    if (task.mediaResourceId) {
      actions.push({
        label: 'Same media tasks',
        to: {
          name: 'admin-download-tasks',
          query: { mediaResourceId: String(task.mediaResourceId) },
        },
      });
      actions.push({
        label: 'Open media detail',
        to: { name: 'media-detail', params: { id: task.mediaResourceId } },
      });
    } else {
      actions.push({
        label: 'Open media admin',
        to: '/admin/media',
      });
    }

    if (magnetHash) {
      actions.push({
        label: 'Same hash tasks',
        to: { name: 'admin-download-tasks', query: { type: 'magnet', hash: magnetHash } },
      });
      actions.push({
        label: 'Open hash logs',
        to: { name: 'admin-logs', query: { resource: 'download_task', hash: magnetHash } },
      });
    }

    actions.push({
      label: 'Open download logs',
      to: {
        name: 'admin-logs',
        query: {
          resource: 'download_task',
          clientId: task.clientId,
          ...(magnetHash ? { hash: magnetHash } : {}),
          downloadTaskId: String(task.id),
        },
      },
    });

    if (task.status === 'error' || task.status === 'cancelled') {
      return {
        title: 'Investigate failure before relaunch',
        description:
          'Review the error, compare with same-user or same-media tasks, and confirm the source or handler before retrying.',
        actions,
      };
    }

    if (task.status === 'downloading') {
      return {
        title: 'Verify launch context',
        description:
          'Use the recent launch time and adjacent tasks to confirm the client actually picked up this job and it is still progressing.',
        actions,
      };
    }

    if (task.status === 'pending' || task.status === 'paused') {
      return {
        title: 'Confirm launch path and ownership',
        description:
          'Pending or paused tasks usually need a launch retry, handler check, or clarification about which user/media they belong to.',
        actions,
      };
    }

    return {
      title: 'Use this task as a healthy baseline',
      description:
        'Compare this completed task with failing tasks from the same user or media to spot differences in source labels, metadata, or launch timing.',
      actions,
    };
  };

  onMounted(() => {
    void loadUsers();
  });

  watch(
    () => route.query,
    () => {
      syncFiltersFromRoute();
      void loadTasks(page.value);
    },
    { immediate: true },
  );
</script>

<style scoped>
  /* ========== Text Colors ========== */
  .dt-text-primary {
    color: var(--text-primary);
  }

  .dt-text-secondary {
    color: var(--text-secondary);
  }

  .dt-text-muted {
    color: var(--text-muted);
  }

  .dt-text-tertiary {
    color: var(--text-tertiary);
  }

  .dt-text-brand {
    color: var(--color-brand-light, #818cf8);
  }

  .dt-text-success-light {
    color: var(--color-success-light, #34d399);
  }

  .dt-text-error-light {
    color: var(--color-error-light, #f87171);
  }

  /* ========== Form Inputs ========== */
  .dt-input {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .dt-input::placeholder {
    color: var(--text-tertiary);
  }

  /* ========== Buttons ========== */
  .dt-btn-primary {
    background-color: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .dt-btn-primary:hover {
    background-color: var(--color-brand-hover, #4338ca);
  }

  .dt-btn-secondary {
    border-color: var(--border-primary);
    color: var(--text-muted);
  }

  .dt-btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .dt-btn-rose {
    border-color: rgba(239, 68, 68, 0.3);
    background-color: var(--bg-secondary);
    color: var(--color-error-light, #f87171);
  }

  .dt-btn-rose:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  /* ========== Filter Pills ========== */
  .dt-pill-active-brand {
    border-color: rgba(129, 140, 248, 0.3);
    background-color: rgba(99, 102, 241, 0.15);
    color: var(--color-brand-lighter, #a5b4fc);
  }

  .dt-pill-active-success {
    border-color: rgba(52, 211, 153, 0.3);
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }

  .dt-pill-inactive {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-muted);
  }

  .dt-pill-inactive:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  /* ========== Filter Chips ========== */
  .dt-chip {
    border-color: rgba(71, 85, 105, 0.3);
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--text-muted);
  }

  .dt-chip-close {
    color: var(--text-tertiary);
  }

  .dt-chip-close:hover {
    color: var(--text-secondary);
  }

  /* ========== Alerts ========== */
  .dt-alert-success {
    border-color: rgba(16, 185, 129, 0.3);
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--color-success-light, #34d399);
  }

  .dt-alert-error {
    border-color: rgba(239, 68, 68, 0.3);
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-error-light, #f87171);
  }

  /* ========== Cards ========== */
  .dt-stat-card {
    background-color: var(--bg-tertiary);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .dt-section-card {
    background-color: var(--bg-tertiary);
    border-color: rgba(255, 255, 255, 0.06);
  }

  /* ========== Table ========== */
  .dt-table > :not(:first-child) {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .dt-table-head {
    background-color: rgba(255, 255, 255, 0.02);
  }

  .dt-th {
    color: var(--text-muted);
  }

  .dt-table-body {
    background-color: var(--bg-tertiary);
  }

  .dt-table-body > :not(:first-child) {
    border-color: rgba(255, 255, 255, 0.06);
  }

  /* ========== Tag Buttons ========== */
  .dt-tag-btn {
    border-color: rgba(71, 85, 105, 0.3);
    color: var(--text-muted);
  }

  .dt-tag-btn:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  /* ========== Links ========== */
  .dt-link {
    color: var(--color-brand-light, #818cf8);
  }

  .dt-link:hover {
    color: var(--color-brand-lighter, #a5b4fc);
  }

  /* ========== Detail Button ========== */
  .dt-detail-btn {
    border-color: rgba(71, 85, 105, 0.3);
    color: var(--text-muted);
  }

  .dt-detail-btn:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  /* ========== Detail Labels ========== */
  .dt-detail-label {
    color: var(--text-muted);
  }

  /* ========== Progress Bar ========== */
  .dt-progress-track {
    background-color: var(--border-primary, #334155);
  }

  .dt-progress-bar {
    background-color: var(--color-brand-primary);
  }

  /* ========== Expanded Row ========== */
  .dt-row-bg-subtle {
    background-color: rgba(255, 255, 255, 0.02);
  }

  /* ========== Recommendation Box ========== */
  .dt-recommend-box {
    border-color: rgba(99, 102, 241, 0.3);
    background-color: rgba(99, 102, 241, 0.1);
  }

  /* ========== Action Buttons (Recommendation) ========== */
  .dt-action-brand {
    border-color: rgba(99, 102, 241, 0.3);
    background-color: var(--bg-secondary);
    color: var(--color-brand-lighter, #a5b4fc);
  }

  .dt-action-brand:hover {
    background-color: rgba(99, 102, 241, 0.2);
  }

  .dt-action-success {
    border-color: rgba(16, 185, 129, 0.3);
    background-color: var(--bg-secondary);
    color: var(--color-success-light, #34d399);
  }

  .dt-action-success:hover {
    background-color: rgba(16, 185, 129, 0.2);
  }

  .dt-action-error {
    border-color: rgba(239, 68, 68, 0.3);
    background-color: var(--bg-secondary);
    color: var(--color-error-light, #f87171);
  }

  .dt-action-error:hover {
    background-color: rgba(239, 68, 68, 0.2);
  }

  /* ========== Metadata Boxes ========== */
  .dt-error-box {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .dt-metadata-box {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .dt-metadata-empty {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-tertiary);
  }

  /* ========== Pagination ========== */
  .dt-pagination {
    border-color: rgba(255, 255, 255, 0.06);
    color: var(--text-muted);
  }

  .dt-page-btn {
    border-color: var(--border-primary);
    color: var(--text-muted);
  }

  /* ========== Status Badges ========== */
  .dt-status--pending {
    background: rgba(245, 158, 11, 0.15);
    color: var(--color-warning-light, #fbbf24);
  }

  .dt-status--downloading {
    background: rgba(59, 130, 246, 0.15);
    color: var(--color-info-light, #60a5fa);
  }

  .dt-status--paused {
    background: rgba(148, 163, 184, 0.15);
    color: var(--text-muted, #94a3b8);
  }

  .dt-status--completed {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light, #34d399);
  }

  .dt-status--error {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light, #f87171);
  }

  .dt-status--cancelled {
    background: rgba(244, 63, 94, 0.15);
    color: var(--color-error-light, #fb7185);
  }

  /* ========== Row Highlighting ========== */
  .dt-row--error {
    background: rgba(239, 68, 68, 0.06);
  }

  .dt-row--downloading {
    background: rgba(59, 130, 246, 0.06);
  }
</style>
