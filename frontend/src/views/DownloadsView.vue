<template>
  <div class="page-container">
    <div class="space-y-6">
      <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold" style="color: var(--text-primary)">下载任务</h1>
          <p class="mt-2 text-sm" style="color: var(--text-muted)">
            统一查看来自详情页、播放页和磁力页的下载任务。浏览器或本地客户端下载会接管真实下载进度。
          </p>
          <p
            v-if="downloadsStore.lastRemoteSyncAt"
            class="mt-2 text-xs"
            style="color: var(--text-muted)"
          >
            最近同步：{{ formatDateTime(downloadsStore.lastRemoteSyncAt) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <RouterLink to="/torrent" class="dl-btn-secondary"> 去磁力资源 </RouterLink>
          <button
            class="dl-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="downloadsStore.isSyncingRemote"
            @click="refreshRemoteTasks"
          >
            {{ downloadsStore.isSyncingRemote ? '同步中...' : '同步云端记录' }}
          </button>
          <button
            class="dl-btn-warning disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="downloadsStore.failedCount === 0"
            @click="retryFailedTasks"
          >
            重试异常任务
          </button>
          <button
            class="dl-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="downloadsStore.failedCount === 0"
            @click="clearFailedTasks"
          >
            清理异常记录
          </button>
          <button
            class="dl-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="downloadsStore.completedCount === 0"
            @click="clearCompletedTasks"
          >
            清理已完成
          </button>
        </div>
      </header>

      <div class="grid gap-4 md:grid-cols-3">
        <section class="dl-card">
          <div class="text-sm" style="color: var(--text-muted)">全部任务</div>
          <div class="mt-3 text-3xl font-semibold" style="color: var(--text-primary)">
            {{ tasks.length }}
          </div>
          <div class="mt-2 text-xs" style="color: var(--text-muted)">按最近操作时间排序</div>
        </section>
        <section class="dl-card">
          <div class="text-sm" style="color: var(--text-muted)">进行中 / 待处理</div>
          <div class="mt-3 text-3xl font-semibold" style="color: var(--color-info)">
            {{ downloadsStore.activeCount }}
          </div>
          <div class="mt-2 text-xs" style="color: var(--text-muted)">
            支持登录后多端同步任务记录
          </div>
        </section>
        <section class="dl-card">
          <div class="text-sm" style="color: var(--text-muted)">已完成 / 已中断</div>
          <div class="mt-3 text-3xl font-semibold" style="color: var(--color-success)">
            {{ downloadsStore.completedCount }} / {{ downloadsStore.failedCount }}
          </div>
          <div class="mt-2 text-xs" style="color: var(--text-muted)">
            完成可清理，异常任务可重试
          </div>
        </section>
      </div>

      <section class="dl-card">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-semibold" style="color: var(--text-primary)">任务筛选</h2>
            <p class="mt-1 text-sm" style="color: var(--text-muted)">
              按状态或关键词快速收窄当前任务列表。
            </p>
          </div>
          <div class="flex flex-col gap-3 lg:w-[32rem] lg:flex-row">
            <label class="block flex-1">
              <span class="sr-only">搜索任务</span>
              <input
                v-model="searchKeyword"
                type="text"
                class="dl-input"
                placeholder="搜索文件名、来源或链接"
              />
            </label>
            <label class="block flex-1">
              <span class="sr-only">磁力 Hash</span>
              <input
                :value="selectedHash"
                type="text"
                class="dl-input"
                placeholder="磁力 Hash，如 hash-demo"
                @input="
                  selectedHash = normalizeHashInput(($event.target as HTMLInputElement).value)
                "
              />
            </label>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="option in filterOptions"
            :key="option.value"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="selectedFilter === option.value ? 'dl-filter-active' : 'dl-filter-default'"
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
            :class="selectedType === option.value ? 'dl-type-active' : 'dl-type-default'"
            @click="selectedType = option.value"
          >
            {{ option.label }}
            <span class="ml-1 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
        <div
          v-if="selectedHash"
          class="mt-3 flex flex-wrap items-center gap-2 text-xs"
          style="color: var(--color-brand-primary-light)"
        >
          <span
            class="rounded-full px-3 py-1.5 font-medium"
            style="background: rgba(99, 102, 241, 0.12)"
          >
            已锁定磁力 Hash：{{ selectedHash }}
          </span>
          <button class="dl-btn-hash-unlock" @click="selectedHash = ''">取消 Hash 锁定</button>
        </div>
      </section>

      <div
        v-if="actionMessage"
        class="rounded-2xl border px-4 py-3 text-sm"
        style="
          border-color: var(--color-info-border, var(--border-primary));
          background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
          color: var(--color-info);
        "
      >
        {{ actionMessage }}
      </div>

      <section
        v-if="tasks.length === 0"
        class="rounded-2xl border border-dashed px-6 py-16 text-center shadow-sm"
        style="border-color: var(--border-primary); background: var(--bg-card)"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl"
          style="background: var(--bg-tertiary)"
        >
          ⬇️
        </div>
        <h2 class="mt-4 text-xl font-semibold" style="color: var(--text-primary)">
          还没有下载任务
        </h2>
        <p class="mt-2 text-sm" style="color: var(--text-muted)">
          可以在影视详情、播放页或磁力资源页把链接加入任务列表，再回来统一处理。
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <RouterLink to="/" class="dl-btn-primary"> 浏览内容 </RouterLink>
          <RouterLink to="/torrent" class="dl-btn-secondary"> 浏览磁力资源 </RouterLink>
        </div>
      </section>

      <section
        v-else-if="filteredTasks.length === 0"
        class="rounded-2xl border border-dashed px-6 py-16 text-center shadow-sm"
        style="border-color: var(--border-primary); background: var(--bg-card)"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl"
          style="background: var(--bg-tertiary)"
        >
          🔎
        </div>
        <h2 class="mt-4 text-xl font-semibold" style="color: var(--text-primary)">
          当前筛选下没有任务
        </h2>
        <p class="mt-2 text-sm" style="color: var(--text-muted)">
          可以切换状态筛选，或清空关键词后再看完整列表。
        </p>
        <button class="dl-btn-secondary mt-6" @click="resetFilters">清空筛选</button>
      </section>

      <div v-else class="space-y-4">
        <article v-for="task in filteredTasks" :key="task.id" class="dl-card">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-lg font-semibold" style="color: var(--text-primary)">
                  {{ task.fileName }}
                </h2>
                <span
                  :class="statusClass(task.status)"
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {{ statusText(task.status) }}
                </span>
                <span
                  class="rounded-full px-2.5 py-1 text-xs"
                  style="background: var(--bg-tertiary); color: var(--text-secondary)"
                >
                  {{ typeText(task.type) }}
                </span>
              </div>

              <div
                class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
                style="color: var(--text-muted)"
              >
                <span>来源：{{ task.sourceLabel || '未标记来源' }}</span>
                <span v-if="task.mediaResourceId">关联媒体：#{{ task.mediaResourceId }}</span>
                <span>创建：{{ formatDateTime(task.createdAt) }}</span>
                <span>更新：{{ formatDateTime(task.updatedAt) }}</span>
                <span v-if="task.lastLaunchedAt"
                  >最近启动：{{ formatDateTime(task.lastLaunchedAt) }}</span
                >
                <span>启动次数：{{ task.launchCount || 0 }}</span>
              </div>

              <div class="mt-4 rounded-xl p-3" style="background: var(--bg-secondary)">
                <div
                  class="flex items-center justify-between text-xs"
                  style="color: var(--text-muted)"
                >
                  <span>任务进度</span>
                  <span>{{ displayProgress(task) }}%</span>
                </div>
                <div
                  class="mt-2 h-2 overflow-hidden rounded-full"
                  style="background: var(--bg-tertiary)"
                >
                  <div
                    class="h-full rounded-full dl-progress-fill transition-all"
                    :style="{ width: `${displayProgress(task)}%` }"
                  ></div>
                </div>
                <div class="mt-2 text-xs" style="color: var(--text-muted)">
                  {{ progressHint(task) }}
                </div>
              </div>

              <div
                class="mt-3 break-all rounded-xl border px-3 py-2 text-xs"
                style="
                  border-color: var(--border-primary);
                  background: var(--bg-card);
                  color: var(--text-muted);
                "
              >
                {{ task.url }}
              </div>

              <div
                v-if="task.error"
                class="mt-3 rounded-xl border px-3 py-2 text-xs"
                style="
                  border-color: var(--color-danger-border);
                  background: var(--color-danger-bg);
                  color: var(--color-danger);
                "
              >
                {{ task.error }}
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col">
              <RouterLink
                v-if="task.mediaResourceId"
                :to="{ name: 'media-detail', params: { id: task.mediaResourceId } }"
                class="dl-btn-secondary"
              >
                查看关联媒体
              </RouterLink>
              <RouterLink
                v-if="buildTorrentDetailLink(task)"
                :to="buildTorrentDetailLink(task)!"
                class="dl-btn-secondary"
              >
                查看磁力详情
              </RouterLink>
              <button
                v-if="
                  task.status === 'pending' ||
                  task.status === 'paused' ||
                  task.status === 'error' ||
                  task.status === 'cancelled'
                "
                class="dl-btn-primary"
                @click="startTask(task.id)"
              >
                {{ task.status === 'pending' ? '开始下载' : '继续 / 重试' }}
              </button>
              <button v-else class="dl-btn-primary" @click="startTask(task.id)">重新打开</button>
              <button
                v-if="task.status === 'downloading'"
                class="dl-btn-secondary"
                @click="pauseTask(task.id)"
              >
                暂停标记
              </button>
              <button
                v-if="task.status !== 'completed'"
                class="dl-btn-success"
                @click="markCompleted(task.id)"
              >
                标记完成
              </button>
              <button class="dl-btn-secondary" @click="copyTaskUrl(task.url)">复制链接</button>
              <button
                v-if="task.status !== 'completed'"
                class="dl-btn-danger"
                @click="cancelTask(task.id)"
              >
                取消任务
              </button>
              <button class="dl-btn-secondary" @click="removeTask(task.id)">移除记录</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { RouterLink } from 'vue-router';
  import { useDownloadsStore } from '@/stores/downloads';
  import type { DownloadTask } from '@/types/advanced';
  import { copyTextToClipboard } from '@/utils/clipboard';

  const downloadsStore = useDownloadsStore();
  const actionMessage = ref<string | null>(null);
  const searchKeyword = ref('');
  const selectedHash = ref('');
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

      if (selectedHash.value) {
        return extractTaskInfoHash(task) === selectedHash.value;
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
      pending: 'dl-status-pending',
      downloading: 'dl-status-downloading',
      paused: 'dl-status-paused',
      completed: 'dl-status-completed',
      error: 'dl-status-error',
      cancelled: 'dl-status-cancelled',
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

  const normalizeHashInput = (value: string) => value.trim().toLowerCase();

  const extractTaskInfoHash = (task: DownloadTask) => {
    if (task.type !== 'magnet') {
      return null;
    }

    const magnetMatch = task.url.match(/(?:\?|&)xt=urn:btih:([^&]+)/i);
    if (magnetMatch?.[1]) {
      return decodeURIComponent(magnetMatch[1]).trim().toLowerCase();
    }

    const metadataDescription =
      typeof task.metadata?.description === 'string' ? task.metadata.description : '';
    const descriptionMatch = metadataDescription.match(/InfoHash:\s*([a-z0-9]+)/i);
    if (descriptionMatch?.[1]) {
      return descriptionMatch[1].trim().toLowerCase();
    }

    return null;
  };

  const buildTorrentDetailLink = (task: DownloadTask) => {
    const infoHash = extractTaskInfoHash(task);
    if (!infoHash) {
      return null;
    }

    const normalizedKeyword = task.fileName.trim();
    return {
      name: 'torrent',
      query: {
        hash: infoHash,
        ...(normalizedKeyword ? { keyword: normalizedKeyword } : {}),
      },
    };
  };

  const updateActionMessage = (message: string) => {
    actionMessage.value = message;
  };

  const buildRemoteFailureMessage = (successMessage: string, errorMessage?: string) => {
    if (errorMessage) {
      return `${successMessage}，但云端同步失败：${errorMessage}`;
    }

    return `${successMessage}，但云端同步失败。`;
  };

  const refreshRemoteTasks = async () => {
    const result = await downloadsStore.hydrateRemote(true);

    if (!result.remoteSucceeded) {
      updateActionMessage(
        buildRemoteFailureMessage('已尝试刷新云端下载任务记录', result.errorMessage),
      );
      return;
    }

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

  const clearCompletedTasks = async () => {
    const result = await downloadsStore.clearCompleted();

    if (result.remoteRequested && !result.remoteSucceeded) {
      updateActionMessage(buildRemoteFailureMessage('已清理本地已完成任务', result.errorMessage));
      return;
    }

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

  const clearFailedTasks = async () => {
    const result = await downloadsStore.clearFailed();

    if (result.remoteRequested && !result.remoteSucceeded) {
      updateActionMessage(buildRemoteFailureMessage('已清理本地异常任务记录', result.errorMessage));
      return;
    }

    updateActionMessage('已清理所有异常任务记录。');
  };

  const applyFiltersFromLocation = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const hashFilter = window.location.hash.replace('#', '');
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    const hash = params.get('hash');
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

    selectedHash.value = normalizeHashInput(hash || '');
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

    if (selectedHash.value) {
      params.set('hash', selectedHash.value);
    } else {
      params.delete('hash');
    }

    const queryString = params.toString();
    const nextHash = selectedFilter.value === 'all' ? '' : `#${selectedFilter.value}`;
    const nextUrl = `${url.pathname}${queryString ? `?${queryString}` : ''}${nextHash}`;

    window.history.replaceState(window.history.state, '', nextUrl);
  };

  const resetFilters = () => {
    selectedFilter.value = 'all';
    selectedType.value = 'all';
    selectedHash.value = '';
    searchKeyword.value = '';
  };

  watch([selectedFilter, selectedType, searchKeyword, selectedHash], () => {
    syncFiltersToLocation();
  });

  const copyTaskUrl = async (url: string) => {
    try {
      await copyTextToClipboard(url);
      updateActionMessage('下载链接已复制到剪贴板。');
    } catch {
      updateActionMessage('复制失败，请手动复制页面中的原始链接。');
    }
  };

  onMounted(async () => {
    applyFiltersFromLocation();
    hasHydratedFilters.value = true;
    syncFiltersToLocation();

    const result = await downloadsStore.hydrateRemote();
    if (result.remoteRequested && !result.remoteSucceeded) {
      updateActionMessage(buildRemoteFailureMessage('已尝试同步云端下载记录', result.errorMessage));
    }
  });
</script>

<style scoped>
  .dl-card {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .dl-input {
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid var(--border-primary);
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    color: var(--text-primary);
    background: var(--bg-secondary);
    outline: none;
    transition: border-color 0.2s;
  }

  .dl-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .dl-btn-primary {
    border-radius: 0.5rem;
    background: var(--color-brand-primary);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .dl-btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .dl-btn-secondary {
    border-radius: 0.5rem;
    border: 1px solid var(--border-primary);
    background: var(--bg-card);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s;
  }

  .dl-btn-secondary:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .dl-btn-success {
    border-radius: 0.5rem;
    border: 1px solid var(--color-success-border, var(--border-primary));
    background: var(--color-success-bg);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-success);
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .dl-btn-success:hover:not(:disabled) {
    opacity: 0.85;
  }

  .dl-btn-danger {
    border-radius: 0.5rem;
    border: 1px solid var(--color-danger-border);
    background: var(--color-danger-bg);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-danger);
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .dl-btn-danger:hover:not(:disabled) {
    opacity: 0.85;
  }

  .dl-btn-warning {
    border-radius: 0.5rem;
    border: 1px solid var(--color-warning-border, var(--border-primary));
    background: var(--color-warning-bg);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-warning);
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .dl-btn-warning:hover:not(:disabled) {
    opacity: 0.85;
  }

  .dl-btn-hash-unlock {
    border-radius: 9999px;
    border: 1px solid var(--border-primary);
    background: var(--bg-card);
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-brand-primary-light);
    cursor: pointer;
    transition: background 0.15s;
  }

  .dl-btn-hash-unlock:hover {
    background: var(--bg-secondary);
  }

  .dl-filter-active {
    background: var(--bg-inverse, #1f2937);
    color: var(--text-inverse, #f9fafb);
  }

  .dl-filter-default {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .dl-filter-default:hover {
    background: var(--bg-secondary);
  }

  .dl-type-active {
    background: var(--color-brand-primary);
    color: white;
  }

  .dl-type-default {
    background: rgba(99, 102, 241, 0.1);
    color: var(--color-brand-primary-light);
  }

  .dl-type-default:hover {
    background: rgba(99, 102, 241, 0.18);
  }

  .dl-progress-fill {
    background: var(--color-brand-primary);
  }

  .dl-status-pending {
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }

  .dl-status-downloading {
    background: var(--color-info-bg, rgba(59, 130, 246, 0.12));
    color: var(--color-info);
  }

  .dl-status-paused {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .dl-status-completed {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .dl-status-error {
    background: var(--color-danger-bg);
    color: var(--color-danger);
  }

  .dl-status-cancelled {
    background: var(--color-danger-bg);
    color: var(--color-danger);
  }
</style>
