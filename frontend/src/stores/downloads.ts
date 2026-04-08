import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  downloadTasksApi,
  type DownloadTaskPayload,
  type DownloadTaskRecord,
} from '@/api/downloadTasks';
import type { DownloadMetadata, DownloadTask } from '@/types/advanced';

const STORAGE_KEY = 'nest-tv-download-tasks';

type DownloadTaskType = DownloadTask['type'];
type DownloadTaskStatus = DownloadTask['status'];

interface DownloadTaskInput {
  url: string;
  fileName: string;
  type?: DownloadTaskType;
  filePath?: string;
  sourceLabel?: string;
  mediaResourceId?: number | null;
  handler?: DownloadTask['handler'];
  metadata?: DownloadMetadata;
  total?: number;
}

type DownloadTaskLike = Omit<
  Partial<DownloadTask>,
  'createdAt' | 'updatedAt' | 'completedAt' | 'lastLaunchedAt'
> & {
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  completedAt?: string | Date | null;
  lastLaunchedAt?: string | Date | null;
};

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const hasAuthToken = () => canUseStorage() && Boolean(localStorage.getItem('token'));
const createTaskId = () => `download-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const inferDownloadType = (url: string): DownloadTaskType => {
  const normalizedUrl = url.trim().toLowerCase();
  if (normalizedUrl.startsWith('magnet:')) {
    return 'magnet';
  }

  if (normalizedUrl.endsWith('.torrent') || normalizedUrl.includes('torrent')) {
    return 'torrent';
  }

  return 'direct';
};

const toDate = (value?: string | Date | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeTask = (task: DownloadTaskLike): DownloadTask | null => {
  if (!task.id || !task.url || !task.fileName) {
    return null;
  }

  return {
    id: task.id,
    url: task.url,
    type: task.type ?? inferDownloadType(task.url),
    status: task.status ?? 'pending',
    progress: typeof task.progress === 'number' ? task.progress : 0,
    speed: typeof task.speed === 'number' ? task.speed : 0,
    downloaded: typeof task.downloaded === 'number' ? task.downloaded : 0,
    total: typeof task.total === 'number' ? task.total : 0,
    fileName: task.fileName,
    filePath: task.filePath ?? '',
    sourceLabel: task.sourceLabel,
    mediaResourceId: task.mediaResourceId ?? null,
    handler: task.handler ?? 'browser',
    launchCount: typeof task.launchCount === 'number' ? task.launchCount : 0,
    createdAt: toDate(task.createdAt) ?? new Date(),
    updatedAt: toDate(task.updatedAt) ?? new Date(),
    completedAt: toDate(task.completedAt),
    lastLaunchedAt: toDate(task.lastLaunchedAt),
    error: task.error,
    metadata: task.metadata,
  };
};

const mapRemoteTask = (task: DownloadTaskRecord): DownloadTask | null =>
  normalizeTask({
    id: task.clientId,
    url: task.url,
    type: task.type,
    status: task.status,
    progress: task.progress,
    speed: Number(task.speed || 0),
    downloaded: Number(task.downloaded || 0),
    total: Number(task.total || 0),
    fileName: task.fileName,
    filePath: task.filePath,
    sourceLabel: task.sourceLabel,
    mediaResourceId: task.mediaResourceId,
    handler: task.handler,
    launchCount: task.launchCount,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    lastLaunchedAt: task.lastLaunchedAt,
    error: task.error,
    metadata: task.metadata,
  });

const toRemotePayload = (task: DownloadTask): DownloadTaskPayload => ({
  clientId: task.id,
  url: task.url,
  type: task.type,
  status: task.status,
  progress: task.progress,
  speed: task.speed,
  downloaded: task.downloaded,
  total: task.total,
  fileName: task.fileName,
  filePath: task.filePath || undefined,
  sourceLabel: task.sourceLabel,
  mediaResourceId: task.mediaResourceId ?? undefined,
  handler: task.handler,
  launchCount: task.launchCount,
  error: task.error,
  metadata: task.metadata,
  completedAt: task.completedAt?.toISOString(),
  lastLaunchedAt: task.lastLaunchedAt?.toISOString(),
});

const loadStoredTasks = (): DownloadTask[] => {
  if (!canUseStorage()) {
    return [];
  }

  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(item => normalizeTask(item))
      .filter((item): item is DownloadTask => Boolean(item))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  } catch (error) {
    console.error('读取下载任务失败:', error);
    return [];
  }
};

const persistTasks = (tasks: DownloadTask[]) => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const mergeTasks = (localTasks: DownloadTask[], remoteTasks: DownloadTask[]) => {
  const taskMap = new Map<string, DownloadTask>();
  localTasks.forEach(task => taskMap.set(task.id, task));
  remoteTasks.forEach(task => {
    const existingTask = taskMap.get(task.id);
    if (!existingTask || existingTask.updatedAt.getTime() <= task.updatedAt.getTime()) {
      taskMap.set(task.id, task);
    }
  });

  return [...taskMap.values()].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  );
};

const triggerDownload = (task: DownloadTask) => {
  if (typeof document === 'undefined') {
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = task.url;
  anchor.rel = 'noopener noreferrer';

  if (task.type === 'direct') {
    anchor.target = '_blank';
    anchor.download = task.fileName;
  }

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const useDownloadsStore = defineStore('downloads', () => {
  const tasks = ref<DownloadTask[]>(loadStoredTasks());
  const lastRemoteSyncAt = ref<Date | null>(null);
  const isSyncingRemote = ref(false);
  const remoteHydrated = ref(false);

  const syncTasks = (nextTasks: DownloadTask[]) => {
    tasks.value = [...nextTasks].sort(
      (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
    );
    persistTasks(tasks.value);
  };

  const upsertRemoteTask = async (task: DownloadTask) => {
    if (!hasAuthToken()) {
      return;
    }

    try {
      await downloadTasksApi.upsert(toRemotePayload(task));
      lastRemoteSyncAt.value = new Date();
    } catch (error) {
      console.error('同步下载任务失败:', error);
    }
  };

  const removeRemoteTask = async (taskId: string) => {
    if (!hasAuthToken()) {
      return;
    }

    try {
      await downloadTasksApi.remove(taskId);
      lastRemoteSyncAt.value = new Date();
    } catch (error) {
      console.error('删除远程下载任务失败:', error);
    }
  };

  const patchTask = (
    taskId: string,
    partial: Partial<DownloadTask>,
    status?: DownloadTaskStatus,
    syncRemoteImmediately = true,
  ) => {
    const nextTasks = tasks.value.map(task => {
      if (task.id !== taskId) {
        return task;
      }

      const nextStatus = status ?? partial.status ?? task.status;
      return {
        ...task,
        ...partial,
        status: nextStatus,
        progress: nextStatus === 'completed' ? 100 : (partial.progress ?? task.progress),
        updatedAt: partial.updatedAt ?? new Date(),
        completedAt:
          nextStatus === 'completed'
            ? (partial.completedAt ?? task.completedAt ?? new Date())
            : partial.completedAt,
      };
    });

    syncTasks(nextTasks);
    const updatedTask = tasks.value.find(task => task.id === taskId) ?? null;
    if (updatedTask && syncRemoteImmediately) {
      void upsertRemoteTask(updatedTask);
    }
    return updatedTask;
  };

  const hydrateRemote = async (force = false) => {
    if (!hasAuthToken()) {
      remoteHydrated.value = false;
      return tasks.value;
    }

    if (!force && (remoteHydrated.value || isSyncingRemote.value)) {
      return tasks.value;
    }

    isSyncingRemote.value = true;
    try {
      const response = await downloadTasksApi.listMine({ limit: 200 });
      const remoteTasks = response.data
        .map(item => mapRemoteTask(item))
        .filter((item): item is DownloadTask => Boolean(item));
      const remoteTaskMap = new Map(remoteTasks.map(task => [task.id, task]));
      const mergedTasks = mergeTasks(tasks.value, remoteTasks);
      syncTasks(mergedTasks);
      remoteHydrated.value = true;
      lastRemoteSyncAt.value = new Date();

      const unsyncedLocalTasks = mergedTasks.filter(task => {
        const remoteTask = remoteTaskMap.get(task.id);
        return !remoteTask || task.updatedAt.getTime() > remoteTask.updatedAt.getTime();
      });
      await Promise.all(unsyncedLocalTasks.map(task => upsertRemoteTask(task)));
      return tasks.value;
    } catch (error) {
      console.error('拉取远程下载任务失败:', error);
      return tasks.value;
    } finally {
      isSyncingRemote.value = false;
    }
  };

  const enqueueTask = (input: DownloadTaskInput) => {
    const existingTask = tasks.value.find(task => task.url === input.url.trim());
    if (existingTask) {
      return (
        patchTask(existingTask.id, {
          fileName: input.fileName || existingTask.fileName,
          filePath: input.filePath ?? existingTask.filePath,
          sourceLabel: input.sourceLabel ?? existingTask.sourceLabel,
          mediaResourceId: input.mediaResourceId ?? existingTask.mediaResourceId,
          metadata: input.metadata ?? existingTask.metadata,
          total: input.total ?? existingTask.total,
          type: input.type ?? existingTask.type,
          handler: input.handler ?? existingTask.handler,
          error: undefined,
        }) ?? existingTask
      );
    }

    const task: DownloadTask = {
      id: createTaskId(),
      url: input.url.trim(),
      type: input.type ?? inferDownloadType(input.url),
      status: 'pending',
      progress: 0,
      speed: 0,
      downloaded: 0,
      total: input.total ?? 0,
      fileName: input.fileName,
      filePath: input.filePath ?? '',
      sourceLabel: input.sourceLabel,
      mediaResourceId: input.mediaResourceId ?? null,
      handler: input.handler ?? 'browser',
      launchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: input.metadata,
    };

    syncTasks([task, ...tasks.value]);
    void upsertRemoteTask(task);
    return task;
  };

  const startTask = (taskId: string) => {
    const task = tasks.value.find(item => item.id === taskId);
    if (!task) {
      return null;
    }

    try {
      triggerDownload(task);
      return patchTask(taskId, {
        status: 'downloading',
        error: undefined,
        lastLaunchedAt: new Date(),
        launchCount: (task.launchCount ?? 0) + 1,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '启动下载失败';
      return patchTask(taskId, { error: message }, 'error');
    }
  };

  const pauseTask = (taskId: string) => patchTask(taskId, {}, 'paused');
  const cancelTask = (taskId: string) => patchTask(taskId, { progress: 0, speed: 0 }, 'cancelled');
  const markCompleted = (taskId: string) =>
    patchTask(taskId, { progress: 100, speed: 0 }, 'completed');
  const markError = (taskId: string, message: string) =>
    patchTask(taskId, { error: message }, 'error');

  const removeTask = (taskId: string) => {
    syncTasks(tasks.value.filter(task => task.id !== taskId));
    void removeRemoteTask(taskId);
  };

  const clearCompleted = () => {
    syncTasks(tasks.value.filter(task => task.status !== 'completed'));
    if (hasAuthToken()) {
      void downloadTasksApi
        .clearCompleted()
        .then(() => {
          lastRemoteSyncAt.value = new Date();
        })
        .catch(error => {
          console.error('清理远程已完成下载任务失败:', error);
        });
    }
  };

  const clearFailed = () => {
    syncTasks(tasks.value.filter(task => task.status !== 'error' && task.status !== 'cancelled'));
    if (hasAuthToken()) {
      void downloadTasksApi
        .clearFailed()
        .then(() => {
          lastRemoteSyncAt.value = new Date();
        })
        .catch(error => {
          console.error('清理远程异常下载任务失败:', error);
        });
    }
  };

  const orderedTasks = computed(() =>
    [...tasks.value].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()),
  );
  const activeCount = computed(
    () =>
      tasks.value.filter(task => task.status === 'downloading' || task.status === 'pending').length,
  );
  const completedCount = computed(
    () => tasks.value.filter(task => task.status === 'completed').length,
  );
  const failedCount = computed(
    () => tasks.value.filter(task => task.status === 'error' || task.status === 'cancelled').length,
  );

  return {
    tasks,
    orderedTasks,
    activeCount,
    completedCount,
    failedCount,
    lastRemoteSyncAt,
    isSyncingRemote,
    hydrateRemote,
    enqueueTask,
    startTask,
    pauseTask,
    cancelTask,
    markCompleted,
    markError,
    removeTask,
    clearCompleted,
    clearFailed,
  };
});

export { inferDownloadType };
