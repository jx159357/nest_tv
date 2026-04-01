import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { downloadTasksApi } = vi.hoisted(() => ({
  downloadTasksApi: {
    listMine: vi.fn(),
    getMineStats: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearCompleted: vi.fn(),
  },
}));

vi.mock('@/api/downloadTasks', () => ({
  downloadTasksApi,
}));

import { inferDownloadType, useDownloadsStore } from '@/stores/downloads';

describe('downloads store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    downloadTasksApi.listMine.mockReset();
    downloadTasksApi.upsert.mockReset();
    downloadTasksApi.remove.mockReset();
    downloadTasksApi.clearCompleted.mockReset();
    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'token') {
        return null;
      }
      return null;
    });
  });

  it('infers download types from urls', () => {
    expect(inferDownloadType('magnet:?xt=urn:btih:abc')).toBe('magnet');
    expect(inferDownloadType('https://example.com/file.torrent')).toBe('torrent');
    expect(inferDownloadType('https://example.com/video.mp4')).toBe('direct');
  });

  it('enqueues tasks and deduplicates the same url', () => {
    const store = useDownloadsStore();

    const firstTask = store.enqueueTask({
      url: 'https://example.com/video.mp4',
      fileName: '测试视频',
      sourceLabel: '详情页',
      mediaResourceId: 1,
    });
    const secondTask = store.enqueueTask({
      url: 'https://example.com/video.mp4',
      fileName: '测试视频（再次点击）',
      sourceLabel: '播放页',
      mediaResourceId: 2,
    });

    expect(store.tasks).toHaveLength(1);
    expect(secondTask.id).toBe(firstTask.id);
    expect(store.tasks[0].sourceLabel).toBe('播放页');
    expect(store.tasks[0].mediaResourceId).toBe(2);
  });

  it('starts and completes a task', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const store = useDownloadsStore();

    const task = store.enqueueTask({
      url: 'magnet:?xt=urn:btih:abc',
      fileName: '测试磁力',
      type: 'magnet',
    });

    const startedTask = store.startTask(task.id);
    expect(startedTask?.status).toBe('downloading');
    expect(startedTask?.launchCount).toBe(1);

    store.markCompleted(task.id);
    expect(store.tasks[0].status).toBe('completed');
    expect(store.tasks[0].progress).toBe(100);

    clickSpy.mockRestore();
  });

  it('clears completedAt when a completed task moves back to a non-completed status', () => {
    const store = useDownloadsStore();

    const task = store.enqueueTask({
      url: 'https://example.com/video.mp4',
      fileName: '状态回退测试',
    });

    store.markCompleted(task.id);
    expect(store.tasks[0].completedAt).toBeInstanceOf(Date);

    store.cancelTask(task.id);
    expect(store.tasks[0].status).toBe('cancelled');
    expect(store.tasks[0].completedAt).toBeUndefined();
  });

  it('pushes newer local tasks during remote hydration when remote records are stale', async () => {
    const now = new Date('2025-04-01T10:00:00.000Z');
    const oneHourEarlier = new Date('2025-04-01T09:00:00.000Z');

    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'token') {
        return 'demo-token';
      }

      if (key === 'nest-tv-download-tasks') {
        return JSON.stringify([
          {
            id: 'download-1',
            url: 'https://example.com/video.mp4',
            type: 'direct',
            status: 'completed',
            progress: 100,
            speed: 0,
            downloaded: 100,
            total: 100,
            fileName: '本地较新任务',
            createdAt: oneHourEarlier.toISOString(),
            updatedAt: now.toISOString(),
            completedAt: now.toISOString(),
          },
        ]);
      }

      return null;
    });

    downloadTasksApi.listMine.mockResolvedValue({
      data: [
        {
          id: 1,
          clientId: 'download-1',
          url: 'https://example.com/video.mp4',
          type: 'direct',
          status: 'pending',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 100,
          fileName: '远端较旧任务',
          createdAt: oneHourEarlier.toISOString(),
          updatedAt: oneHourEarlier.toISOString(),
          completedAt: null,
          lastLaunchedAt: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 200,
      totalPages: 1,
    });
    downloadTasksApi.upsert.mockResolvedValue({});

    const store = useDownloadsStore();
    await store.hydrateRemote(true);

    expect(store.tasks[0].status).toBe('completed');
    expect(downloadTasksApi.upsert).toHaveBeenCalledTimes(1);
    expect(downloadTasksApi.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'download-1',
        status: 'completed',
        completedAt: now.toISOString(),
      }),
    );
  });
});
