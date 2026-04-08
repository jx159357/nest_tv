<template>
  <NavigationLayout>
    <div class="space-y-6">
      <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">下载任务</h1>
          <p class="mt-2 text-sm text-gray-600">
            统一查看来自详情页、播放页和磁力页的下载任务。浏览器或本地客户端下载会接管真实下载进度。
          </p>
          <p v-if="downloadsStore.lastRemoteSyncAt" class="mt-2 text-xs text-gray-500">
            最近同步：{{ formatDateTime(downloadsStore.lastRemoteSyncAt) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <RouterLink
            to="/torrent"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            去磁力资源
          </RouterLink>
          <button
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            :disabled="downloadsStore.isSyncingRemote"
            @click="refreshRemoteTasks"
          >
            {{ downloadsStore.isSyncingRemote ? '同步中...' : '同步云端记录' }}
          </button>
          <button
            class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-amber-200 disabled:bg-amber-50/60 disabled:text-amber-400"
            :disabled="downloadsStore.failedCount === 0"
            @click="retryFailedTasks"
          >
            重试异常任务
          </button>
          <button
            class="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-50/60 disabled:text-rose-400"
            :disabled="downloadsStore.failedCount === 0"
            @click="clearFailedTasks"
          >
            清理异常记录
          </button>
          <button
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            :disabled="downloadsStore.completedCount === 0"
            @click="clearCompletedTasks"
          >
            清理已完成
          </button>
        </div>
      </header>

      <div class="grid gap-4 md:grid-cols-3">
        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div class="text-sm text-gray-500">全部任务</div>
          <div class="mt-3 text-3xl font-semibold text-gray-900">{{ tasks.length }}</div>
          <div class="mt-2 text-xs text-gray-500">按最近操作时间排序</div>
        </section>
        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div class="text-sm text-gray-500">进行中 / 待处理</div>
          <div class="mt-3 text-3xl font-semibold text-blue-600">
            {{ downloadsStore.activeCount }}
          </div>
          <div class="mt-2 text-xs text-gray-500">支持登录后多端同步任务记录</div>
        </section>
        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div class="text-sm text-gray-500">已完成 / 已中断</div>
          <div class="mt-3 text-3xl font-semibold text-emerald-600">
            {{ downloadsStore.completedCount }} / {{ downloadsStore.failedCount }}
          </div>
          <div class="mt-2 text-xs text-gray-500">完成可清理，异常任务可重试</div>
        </section>
      </div>

      <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-900">任务筛选</h2>
            <p class="mt-1 text-sm text-gray-500">按状态或关键词快速收窄当前任务列表。</p>
          </div>
          <label class="block lg:w-80">
            <span class="sr-only">搜索任务</span>
            <input
              v-model="searchKeyword"
              type="text"
              class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="搜索文件名、来源或链接"
            />
          </label>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="option in filterOptions"
            :key="option.value"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="
              selectedFilter === option.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="selectedFilter = option.value"
          >
            {{ option.label }}
            <span class="ml-1 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="
              selectedType === option.value
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            "
            @click="selectedType = option.value"
          >
            {{ option.label }}
            <span class="ml-1 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
      </section>

      <div
        v-if="actionMessage"
        class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
      >
        {{ actionMessage }}
      </div>

      <section
        v-if="tasks.length === 0"
        class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl"
        >
          ⬇️
        </div>
        <h2 class="mt-4 text-xl font-semibold text-gray-900">还没有下载任务</h2>
        <p class="mt-2 text-sm text-gray-600">
          可以在影视详情、播放页或磁力资源页把链接加入任务列表，再回来统一处理。
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <RouterLink
            to="/"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            浏览内容
          </RouterLink>
          <RouterLink
            to="/torrent"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            浏览磁力资源
          </RouterLink>
        </div>
      </section>

      <section
        v-else-if="filteredTasks.length === 0"
        class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl"
        >
          🔎
        </div>
        <h2 class="mt-4 text-xl font-semibold text-gray-900">当前筛选下没有任务</h2>
        <p class="mt-2 text-sm text-gray-600">可以切换状态筛选，或清空关键词后再看完整列表。</p>
        <button
          class="mt-6 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="resetFilters"
        >
          清空筛选
        </button>
      </section>

      <div v-else class="space-y-4">
        <article
          v-for="task in filteredTasks"
          :key="task.id"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-lg font-semibold text-gray-900">{{ task.fileName }}</h2>
                <span
                  :class="statusClass(task.status)"
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {{ statusText(task.status) }}
                </span>
                <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  {{ typeText(task.type) }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>来源：{{ task.sourceLabel || '未标记来源' }}</span>
                <span v-if="task.mediaResourceId">关联媒体：#{{ task.mediaResourceId }}</span>
                <span>创建：{{ formatDateTime(task.createdAt) }}</span>
                <span>更新：{{ formatDateTime(task.updatedAt) }}</span>
                <span v-if="task.lastLaunchedAt"
                  >最近启动：{{ formatDateTime(task.lastLaunchedAt) }}</span
                >
                <span>启动次数：{{ task.launchCount || 0 }}</span>
              </div>

              <div class="mt-4 rounded-xl bg-gray-50 p-3">
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>任务进度</span>
                  <span>{{ displayProgress(task) }}%</span>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    class="h-full rounded-full bg-indigo-600 transition-all"
                    :style="{ width: `${displayProgress(task)}%` }"
                  ></div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  {{ progressHint(task) }}
                </div>
              </div>

              <div
                class="mt-3 break-all rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500"
              >
                {{ task.url }}
              </div>

              <div
                v-if="task.error"
                class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
              >
                {{ task.error }}
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col">
              <RouterLink
                v-if="task.mediaResourceId"
                :to="{ name: 'media-detail', params: { id: task.mediaResourceId } }"
                class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                查看关联媒体
              </RouterLink>
              <button
                v-if="
                  task.status === 'pending' ||
                  task.status === 'paused' ||
                  task.status === 'error' ||
                  task.status === 'cancelled'
                "
                class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                @click="startTask(task.id)"
              >
                {{ task.status === 'pending' ? '开始下载' : '继续 / 重试' }}
              </button>
              <button
                v-else
                class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                @click="startTask(task.id)"
              >
                重新打开
              </button>
              <button
                v-if="task.status === 'downloading'"
                class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="pauseTask(task.id)"
              >
                暂停标记
              </button>
              <button
                v-if="task.status !== 'completed'"
                class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                @click="markCompleted(task.id)"
              >
                标记完成
              </button>
              <button
                class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="copyTaskUrl(task.url)"
              >
                复制链接
              </button>
              <button
                v-if="task.status !== 'completed'"
                class="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                @click="cancelTask(task.id)"
              >
                取消任务
              </button>
              <button
                class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="removeTask(task.id)"
              >
                移除记录
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { RouterLink } from 'vue-router';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import { useDownloadsStore } from '@/stores/downloads';
  import type { DownloadTask } from '@/types/advanced';

  const downloadsStore = useDownloadsStore();
  const actionMessage = ref<string | null>(null);
  const searchKeyword = ref('');
  const selectedFilter = ref<'all' | 'active' | 'failed' | 'completed'>('all');
  const selectedType = ref<'all' | 'direct' | 'torrent' | 'magnet'>('all');
  const hasHydratedFilters = ref(false);

  const tasks = computed(() => downloadsStore.orderedTasks);

  const filterOptions = computed(() => [
    {
      value: 'all' as const,
      label: '全部',
      count: tasks.value.length,
    },
    {
      value: 'active' as const,
      label: '进行中 / 待处理',
      count: tasks.value.filter(task => task.status === 'pending' || task.status === 'downloading')
        .length,
    },
    {
      value: 'failed' as const,
      label: '异常 / 已取消',
      count: tasks.value.filter(task => task.status === 'error' || task.status === 'cancelled')
        .length,
    },
    {
      value: 'completed' as const,
      label: '已完成',
      count: tasks.value.filter(task => task.status === 'completed').length,
    },
  ]);

  const typeOptions = computed(() => [
    {
      value: 'all' as const,
      label: '全部类型',
      count: tasks.value.length,
    },
    {
      value: 'direct' as const,
      label: '直链 / 协议',
      count: tasks.value.filter(task => task.type === 'direct').length,
    },
    {
      value: 'torrent' as const,
      label: '种子文件',
      count: tasks.value.filter(task => task.type === 'torrent').length,
    },
    {
      value: 'magnet' as const,
      label: 'Magnet',
      count: tasks.value.filter(task => task.type === 'magnet').length,
    },
  ]);

  const filteredTasks = computed(() => {
    const normalizedKeyword = searchKeyword.value.trim().toLocaleLowerCase();

    return tasks.value.filter(task => {
      const matchesFilter =
        selectedFilter.value === 'all'
          ? true
          : selectedFilter.value === 'active'
            ? task.status === 'pending' || task.status === 'downloading'
            : selectedFilter.value === 'failed'
              ? task.status === 'error' || task.status === 'cancelled'
              : task.status === 'completed';

      if (!matchesFilter) {
        return false;
      }

      if (selectedType.value !== 'all' && task.type !== selectedType.value) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const haystack = [task.fileName, task.sourceLabel, task.url]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  });

  const statusText = (status: DownloadTask['status']) => {
    const labelMap: Record<DownloadTask['status'], string> = {
      pending: '待处理',
      downloading: '已交给客户端',
      paused: '已暂停',
      completed: '已完成',
      error: '异常',
      cancelled: '已取消',
    };
    return labelMap[status];
  };

  const statusClass = (status: DownloadTask['status']) => {
    const classMap: Record<DownloadTask['status'], string> = {
      pending: 'bg-amber-100 text-amber-700',
      downloading: 'bg-blue-100 text-blue-700',
      paused: 'bg-slate-100 text-slate-700',
      completed: 'bg-emerald-100 text-emerald-700',
      error: 'bg-red-100 text-red-700',
      cancelled: 'bg-rose-100 text-rose-700',
    };
    return classMap[status];
  };

  const typeText = (type: DownloadTask['type']) => {
    const labelMap: Record<DownloadTask['type'], string> = {
      direct: '直链 / 协议链接',
      torrent: '种子文件',
      magnet: 'Magnet',
    };
    return labelMap[type];
  };

  const displayProgress = (task: DownloadTask) => {
    if (task.status === 'completed') {
      return 100;
    }

    return Math.max(0, Math.min(100, Math.round(task.progress || 0)));
  };

  const progressHint = (task: DownloadTask) => {
    switch (task.status) {
      case 'downloading':
        return '当前任务已交给浏览器或本地客户端下载，真实进度请在本地下载器中查看。';
      case 'completed':
        return '任务已手动标记为完成，云端记录也会同步清理。';
      case 'paused':
        return '任务在应用内被标记为暂停，可稍后继续或重试。';
      case 'error':
        return '启动下载时发生错误，请检查链接或直接重试。';
      case 'cancelled':
        return '任务已取消，不会再自动拉起下载。';
      default:
        return '任务已入列，点击开始后会尝试唤起浏览器或本地下载器。';
    }
  };

  const formatDateTime = (value?: Date | string | null) => {
    if (!value) {
      return '—';
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('zh-CN');
  };

  const updateActionMessage = (message: string) => {
    actionMessage.value = message;
  };

  const refreshRemoteTasks = async () => {
    await downloadsStore.hydrateRemote(true);
    updateActionMessage('已刷新云端下载任务记录。');
  };

  const startTask = (taskId: string) => {
    const task = downloadsStore.startTask(taskId);
    if (task) {
      updateActionMessage(`已尝试启动下载：${task.fileName}`);
    }
  };

  const pauseTask = (taskId: string) => {
    downloadsStore.pauseTask(taskId);
    updateActionMessage('任务已标记为暂停。');
  };

  const cancelTask = (taskId: string) => {
    downloadsStore.cancelTask(taskId);
    updateActionMessage('任务已取消。');
  };

  const markCompleted = (taskId: string) => {
    downloadsStore.markCompleted(taskId);
    updateActionMessage('任务已标记为完成。');
  };

  const removeTask = (taskId: string) => {
    downloadsStore.removeTask(taskId);
    updateActionMessage('任务记录已移除。');
  };

  const clearCompletedTasks = () => {
    downloadsStore.clearCompleted();
    updateActionMessage('已清理所有已完成任务。');
  };

  const retryFailedTasks = () => {
    const failedTasks = tasks.value.filter(
      task => task.status === 'error' || task.status === 'cancelled',
    );

    failedTasks.forEach(task => {
      downloadsStore.startTask(task.id);
    });

    if (failedTasks.length > 0) {
      updateActionMessage(`已批量重试 ${failedTasks.length} 个异常任务。`);
    }
  };

  const clearFailedTasks = () => {
    downloadsStore.clearFailed();
    updateActionMessage('已清理所有异常任务记录。');
  };

  const applyFiltersFromLocation = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const hashFilter = window.location.hash.replace('#', '');
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    const type = params.get('type');

    if (
      hashFilter === 'all' ||
      hashFilter === 'active' ||
      hashFilter === 'failed' ||
      hashFilter === 'completed'
    ) {
      selectedFilter.value = hashFilter;
    }

    if (type === 'all' || type === 'direct' || type === 'torrent' || type === 'magnet') {
      selectedType.value = type;
    }

    searchKeyword.value = keyword?.trim() || '';
  };

  const syncFiltersToLocation = () => {
    if (typeof window === 'undefined' || !hasHydratedFilters.value) {
      return;
    }

    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    if (selectedType.value === 'all') {
      params.delete('type');
    } else {
      params.set('type', selectedType.value);
    }

    if (searchKeyword.value.trim()) {
      params.set('keyword', searchKeyword.value.trim());
    } else {
      params.delete('keyword');
    }

    const queryString = params.toString();
    const nextHash = selectedFilter.value === 'all' ? '' : `#${selectedFilter.value}`;
    const nextUrl = `${url.pathname}${queryString ? `?${queryString}` : ''}${nextHash}`;

    window.history.replaceState(window.history.state, '', nextUrl);
  };

  const resetFilters = () => {
    selectedFilter.value = 'all';
    selectedType.value = 'all';
    searchKeyword.value = '';
  };

  watch([selectedFilter, selectedType, searchKeyword], () => {
    syncFiltersToLocation();
  });

  const copyTaskUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      updateActionMessage('下载链接已复制到剪贴板。');
    } catch {
      updateActionMessage('复制失败，请手动复制页面中的原始链接。');
    }
  };

  onMounted(() => {
    applyFiltersFromLocation();
    hasHydratedFilters.value = true;
    syncFiltersToLocation();
    void downloadsStore.hydrateRemote();
  });
</script>
