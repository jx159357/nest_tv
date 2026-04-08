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
    expect(inferDownloadType('thunder://example')).toBe('direct');
    expect(inferDownloadType('ed2k://example')).toBe('direct');
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

  it('deduplicates magnet tasks by infoHash even when magnet uris differ', () => {
    const store = useDownloadsStore();

    const firstTask = store.enqueueTask({
      url: 'magnet:?xt=urn:btih:HASH123&tr=udp://tracker-a',
      fileName: '磁力任务 A',
      type: 'magnet',
      sourceLabel: '磁力列表',
    });
    const secondTask = store.enqueueTask({
      url: 'magnet:?dn=Magnet%20B&xt=urn:btih:hash123&tr=udp://tracker-b',
      fileName: '磁力任务 B',
      type: 'magnet',
      sourceLabel: '磁力详情',
    });

    expect(store.tasks).toHaveLength(1);
    expect(secondTask.id).toBe(firstTask.id);
    expect(store.tasks[0].fileName).toBe('磁力任务 B');
    expect(store.tasks[0].sourceLabel).toBe('磁力详情');
    expect(store.tasks[0].url).toContain('tracker-b');
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

  it('hydrates every remote download-task page instead of stopping at the first 200 items', async () => {
    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'token') {
        return 'demo-token';
      }

      return null;
    });

    downloadTasksApi.listMine
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            clientId: 'download-page-1',
            url: 'https://example.com/page-1.mp4',
            type: 'direct',
            status: 'pending',
            progress: 0,
            speed: 0,
            downloaded: 0,
            total: 100,
            fileName: '第 1 页任务',
            createdAt: '2025-04-01T09:00:00.000Z',
            updatedAt: '2025-04-01T09:00:00.000Z',
            completedAt: null,
            lastLaunchedAt: null,
          },
        ],
        total: 201,
        page: 1,
        limit: 200,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 2,
            clientId: 'download-page-2',
            url: 'https://example.com/page-2.mp4',
            type: 'direct',
            status: 'completed',
            progress: 100,
            speed: 0,
            downloaded: 100,
            total: 100,
            fileName: '第 2 页任务',
            createdAt: '2025-04-01T10:00:00.000Z',
            updatedAt: '2025-04-01T10:00:00.000Z',
            completedAt: '2025-04-01T10:00:00.000Z',
            lastLaunchedAt: null,
          },
        ],
        total: 201,
        page: 2,
        limit: 200,
        totalPages: 2,
      });

    const store = useDownloadsStore();
    await store.hydrateRemote(true);

    expect(downloadTasksApi.listMine).toHaveBeenNthCalledWith(1, { page: 1, limit: 200 });
    expect(downloadTasksApi.listMine).toHaveBeenNthCalledWith(2, { page: 2, limit: 200 });
    expect(store.tasks).toHaveLength(2);
    expect(store.tasks.some(task => task.id === 'download-page-1')).toBe(true);
    expect(store.tasks.some(task => task.id === 'download-page-2')).toBe(true);
  });

  it('deduplicates remote magnet tasks with the same infoHash during hydration', async () => {
    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'token') {
        return 'demo-token';
      }

      return null;
    });

    downloadTasksApi.listMine.mockResolvedValue({
      data: [
        {
          id: 2,
          clientId: 'download-new',
          url: 'magnet:?dn=New&xt=urn:btih:hash-demo&tr=udp://tracker-b',
          type: 'magnet',
          status: 'downloading',
          progress: 30,
          speed: 128,
          downloaded: 30,
          total: 100,
          fileName: '新磁力任务',
          createdAt: '2025-04-01T10:00:00.000Z',
          updatedAt: '2025-04-01T10:00:00.000Z',
          completedAt: null,
          lastLaunchedAt: '2025-04-01T10:00:00.000Z',
        },
        {
          id: 1,
          clientId: 'download-old',
          url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
          type: 'magnet',
          status: 'pending',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 0,
          fileName: '旧磁力任务',
          createdAt: '2025-04-01T09:00:00.000Z',
          updatedAt: '2025-04-01T09:00:00.000Z',
          completedAt: null,
          lastLaunchedAt: null,
        },
      ],
      total: 2,
      page: 1,
      limit: 200,
      totalPages: 1,
    });

    const store = useDownloadsStore();
    await store.hydrateRemote(true);

    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0].id).toBe('download-new');
    expect(store.tasks[0].fileName).toBe('新磁力任务');
    expect(store.tasks[0].url).toContain('tracker-b');
    expect(downloadTasksApi.upsert).not.toHaveBeenCalled();
  });
});
