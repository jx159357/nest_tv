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
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
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

      <div v-else class="space-y-4">
        <article
          v-for="task in tasks"
          :key="task.id"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-lg font-semibold text-gray-900">{{ task.fileName }}</h2>
                <span :class="statusClass(task.status)" class="rounded-full px-2.5 py-1 text-xs font-medium">
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
                <span v-if="task.lastLaunchedAt">最近启动：{{ formatDateTime(task.lastLaunchedAt) }}</span>
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

              <div class="mt-3 break-all rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
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
                v-if="task.status === 'pending' || task.status === 'paused' || task.status === 'error' || task.status === 'cancelled'"
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
  import { computed, onMounted, ref } from 'vue';
  import { RouterLink } from 'vue-router';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import { useDownloadsStore } from '@/stores/downloads';
  import type { DownloadTask } from '@/types/advanced';

  const downloadsStore = useDownloadsStore();
  const actionMessage = ref<string | null>(null);

  const tasks = computed(() => downloadsStore.orderedTasks);

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

  const copyTaskUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      updateActionMessage('下载链接已复制到剪贴板。');
    } catch {
      updateActionMessage('复制失败，请手动复制页面中的原始链接。');
    }
  };

  onMounted(() => {
    void downloadsStore.hydrateRemote();
  });
</script>
