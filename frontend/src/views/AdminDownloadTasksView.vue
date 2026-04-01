<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">下载任务管理</h1>
        <p class="mt-2 text-gray-600">查看用户下载任务、关联媒体、启动状态和异常信息。</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="search"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="文件名 / 来源 / 链接 / 用户"
          @keyup.enter="applyFilters(1)"
        />
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部类型</option>
          <option value="direct">direct</option>
          <option value="torrent">torrent</option>
          <option value="magnet">magnet</option>
        </select>
        <select
          v-model="selectedUserId"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="">全部用户</option>
          <option v-for="user in users" :key="user.id" :value="String(user.id)">
            {{ user.nickname || user.username }}
          </option>
        </select>
        <select
          v-model="sortMode"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          @change="applyFilters(1)"
        >
          <option value="updated">最近更新</option>
          <option value="started">最近启动</option>
          <option value="exceptions">异常优先</option>
        </select>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="applyFilters(1)"
        >
          刷新
        </button>
        <button
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="resetFilters"
        >
          清空筛选
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="
          selectedStatus === ''
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="setStatusFilter('')"
      >
        全部任务
      </button>
      <button
        v-for="item in quickStatusFilters"
        :key="item.value"
        class="rounded-full border px-3 py-1 text-xs font-medium transition"
        :class="
          selectedStatus === item.value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        @click="setStatusFilter(item.value)"
      >
        {{ item.label }}
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

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">当前结果</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ total }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">进行中 / 待处理</div>
        <div class="mt-2 text-2xl font-semibold text-blue-600">{{ activeCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">已完成</div>
        <div class="mt-2 text-2xl font-semibold text-emerald-600">{{ completedCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">异常 / 取消</div>
        <div class="mt-2 text-2xl font-semibold text-rose-600">{{ failedCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">覆盖用户 / 媒体</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ uniqueUserCount }} / {{ uniqueMediaCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">24h 内启动 / Magnet</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ startedRecentlyCount }} / {{ magnetCount }}</div>
      </div>
    </div>

    <div
      v-if="showExceptionBanner"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          当前结果中有 {{ failedCount }} 条异常 / 取消任务，建议切换到“异常优先”或直接筛选异常任务。
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
            @click="setStatusFilter('error')"
          >
            只看异常
          </button>
          <button
            class="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
            @click="setSortMode('exceptions')"
          >
            异常优先
          </button>
        </div>
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
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  用户 / 媒体
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  文件
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  状态
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  进度
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  类型
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  最近更新
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <template v-for="task in displayedTasks" :key="task.id">
                <tr :class="rowClass(task)">
                  <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="font-medium">{{ task.user?.username || `用户#${task.userId}` }}</div>
                    <div class="text-xs text-gray-500">{{ task.user?.email || '—' }}</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button
                        class="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        @click="setUserFilter(task.userId)"
                      >
                        同用户任务
                      </button>
                      <button
                        v-if="task.mediaResourceId"
                        class="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        @click="setMediaFilter(task.mediaResourceId)"
                      >
                        同媒体任务
                      </button>
                    </div>
                    <RouterLink
                      v-if="task.mediaResourceId"
                      :to="{ name: 'media-detail', params: { id: task.mediaResourceId } }"
                      class="mt-2 inline-flex text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {{ task.mediaResource?.title || `媒体#${task.mediaResourceId}` }}
                    </RouterLink>
                    <div v-else class="mt-2 text-xs text-gray-400">未关联媒体</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="font-medium">{{ task.fileName }}</div>
                    <div class="mt-1 text-xs text-gray-500">{{ task.sourceLabel || '未标记来源' }}</div>
                    <div class="mt-1 max-w-md break-all text-xs text-gray-400">{{ task.url }}</div>
                    <div v-if="task.error" class="mt-2 text-xs text-red-600">{{ task.error }}</div>
                    <button
                      class="task-detail-toggle mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      @click="toggleTaskDetails(task.id)"
                    >
                      {{ selectedTaskId === task.id ? '收起详情' : '查看详情' }}
                    </button>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span :class="statusClass(task.status)" class="rounded-full px-2 py-1 text-xs font-medium">
                      {{ task.status }}
                    </span>
                    <div class="mt-2 text-xs text-gray-500">启动 {{ task.launchCount || 0 }} 次</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <div class="h-2 w-28 overflow-hidden rounded-full bg-gray-200">
                      <div class="h-full bg-indigo-600" :style="{ width: `${displayProgress(task)}%` }"></div>
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                      {{ displayProgress(task) }}% · {{ formatBytes(task.downloaded) }} / {{ formatBytes(task.total) }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <div>{{ task.type }}</div>
                    <div class="mt-1 text-xs text-gray-400">{{ task.handler || 'browser' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <div>{{ formatDate(task.updatedAt) }}</div>
                    <div class="mt-1 text-xs text-gray-400">
                      {{ task.lastLaunchedAt ? `启动：${formatDate(task.lastLaunchedAt)}` : '尚未启动' }}
                    </div>
                  </td>
                </tr>
                <tr v-if="selectedTaskId === task.id" class="bg-slate-50">
                  <td colspan="6" class="px-4 py-4">
                    <div class="task-detail-panel grid gap-4 lg:grid-cols-2">
                      <div
                        class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 lg:col-span-2"
                        data-testid="task-recommendation"
                      >
                        <div class="text-xs font-medium uppercase tracking-wide text-indigo-500">
                          Recommended Action
                        </div>
                        <div class="mt-2 text-sm font-semibold text-slate-900" data-testid="task-recommendation-title">
                          {{ taskRecommendation(task).title }}
                        </div>
                        <div class="mt-2 text-sm text-slate-600">
                          {{ taskRecommendation(task).description }}
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                          <router-link
                            v-for="action in taskRecommendation(task).actions"
                            :key="`${task.id}-${action.label}`"
                            :to="action.to"
                            class="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            {{ action.label }}
                          </router-link>
                        </div>
                      </div>
                      <div class="space-y-3 text-sm text-slate-700">
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Task ID</div>
                          <div class="mt-1">{{ task.clientId }}</div>
                        </div>
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">创建 / 完成</div>
                          <div class="mt-1">{{ formatDate(task.createdAt) }}</div>
                          <div class="mt-1 text-xs text-slate-500">{{ task.completedAt ? `完成：${formatDate(task.completedAt)}` : '尚未完成' }}</div>
                        </div>
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">最近启动</div>
                          <div class="mt-1">{{ task.lastLaunchedAt ? formatDate(task.lastLaunchedAt) : '尚未启动' }}</div>
                        </div>
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">保存路径</div>
                          <div class="mt-1 break-all">{{ task.filePath || '未记录' }}</div>
                        </div>
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">原始链接</div>
                          <a
                            :href="task.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mt-1 inline-flex break-all text-indigo-600 hover:text-indigo-700"
                          >
                            {{ task.url }}
                          </a>
                        </div>
                      </div>
                      <div class="space-y-3 text-sm text-slate-700">
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">错误详情</div>
                          <div class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                            {{ task.error || '暂无错误信息' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Metadata</div>
                          <div v-if="metadataEntries(task).length > 0" class="mt-1 space-y-2">
                            <div
                              v-for="item in metadataEntries(task)"
                              :key="item.key"
                              class="rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {{ item.key }}
                              </div>
                              <div class="mt-1 break-all">{{ item.value }}</div>
                            </div>
                          </div>
                          <div v-else class="mt-1 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-slate-500">
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

        <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
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
  import { computed, onMounted, ref, watch } from 'vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { adminApi, type AdminDownloadTaskItem } from '@/api/admin';
  import type { User } from '@/types/user';

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
  const selectedStatus = ref<AdminDownloadTaskItem['status'] | ''>('');
  const selectedType = ref<AdminDownloadTaskItem['type'] | ''>('');
  const selectedUserId = ref('');
  const selectedMediaResourceId = ref('');
  const selectedTaskId = ref<number | null>(null);
  const sortMode = ref<'updated' | 'started' | 'exceptions'>('updated');

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

  const activeCount = computed(
    () => tasks.value.filter(task => task.status === 'pending' || task.status === 'downloading').length,
  );
  const completedCount = computed(() => tasks.value.filter(task => task.status === 'completed').length);
  const failedCount = computed(
    () => tasks.value.filter(task => task.status === 'error' || task.status === 'cancelled').length,
  );
  const uniqueUserCount = computed(() => new Set(tasks.value.map(task => task.userId)).size);
  const uniqueMediaCount = computed(
    () =>
      new Set(tasks.value.map(task => task.mediaResourceId).filter((value): value is number => Boolean(value))).size,
  );
  const magnetCount = computed(() => tasks.value.filter(task => task.type === 'magnet').length);
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
    () => failedCount.value > 0 && selectedStatus.value !== 'error' && sortMode.value !== 'exceptions',
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
      console.error('加载用户列表失败:', err);
    }
  };

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const querySearch = readSingleQuery(route.query.search);
    const queryStatus = readSingleQuery(route.query.status);
    const queryType = readSingleQuery(route.query.type);
    const queryUserId = readSingleQuery(route.query.userId);
    const queryMediaResourceId = readSingleQuery(route.query.mediaResourceId);
    const querySort = readSingleQuery(route.query.sort);

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    search.value = typeof querySearch === 'string' ? querySearch : '';
    selectedStatus.value =
      typeof queryStatus === 'string' && taskStatuses.includes(queryStatus as AdminDownloadTaskItem['status'])
        ? (queryStatus as AdminDownloadTaskItem['status'])
        : '';
    selectedType.value =
      typeof queryType === 'string' && taskTypes.includes(queryType as AdminDownloadTaskItem['type'])
        ? (queryType as AdminDownloadTaskItem['type'])
        : '';
    selectedUserId.value = typeof queryUserId === 'string' ? queryUserId : '';
    selectedMediaResourceId.value = typeof queryMediaResourceId === 'string' ? queryMediaResourceId : '';
    sortMode.value =
      querySort === 'started' || querySort === 'exceptions' || querySort === 'updated'
        ? querySort
        : 'updated';
  };

  const buildTaskQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (search.value.trim()) {
      query.search = search.value.trim();
    }
    if (selectedStatus.value) {
      query.status = selectedStatus.value;
    }
    if (selectedType.value) {
      query.type = selectedType.value;
    }
    if (selectedUserId.value) {
      query.userId = selectedUserId.value;
    }
    if (selectedMediaResourceId.value) {
      query.mediaResourceId = selectedMediaResourceId.value;
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

  const toggleTaskDetails = (taskId: number) => {
    selectedTaskId.value = selectedTaskId.value === taskId ? null : taskId;
  };

  const loadTasks = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getDownloadTasks({
        page: nextPage,
        limit: 10,
        search: search.value || undefined,
        status: selectedStatus.value || undefined,
        type: selectedType.value || undefined,
        userId: selectedUserId.value ? Number(selectedUserId.value) : undefined,
        mediaResourceId: selectedMediaResourceId.value ? Number(selectedMediaResourceId.value) : undefined,
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
      }
      if (selectedTaskId.value && !response.data.some(task => task.id === selectedTaskId.value)) {
        selectedTaskId.value = null;
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
      pending: 'bg-amber-100 text-amber-700',
      downloading: 'bg-blue-100 text-blue-700',
      paused: 'bg-slate-100 text-slate-700',
      completed: 'bg-emerald-100 text-emerald-700',
      error: 'bg-red-100 text-red-700',
      cancelled: 'bg-rose-100 text-rose-700',
    };

    return classMap[status];
  };

  const rowClass = (task: AdminDownloadTaskItem) => {
    if (task.status === 'error' || task.status === 'cancelled') {
      return 'bg-red-50/60';
    }
    if (task.status === 'downloading') {
      return 'bg-blue-50/50';
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

  const taskRecommendation = (task: AdminDownloadTaskItem) => {
    const actions: Array<{ label: string; to: string | Record<string, unknown> }> = [];

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
