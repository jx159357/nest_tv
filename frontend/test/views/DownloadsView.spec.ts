import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DownloadsView from '@/views/DownloadsView.vue';

const { downloadsStore } = vi.hoisted(() => ({
  downloadsStore: {
    orderedTasks: [] as Array<Record<string, unknown>>,
    activeCount: 0,
    completedCount: 0,
    failedCount: 0,
    lastRemoteSyncAt: null as string | null,
    isSyncingRemote: false,
    hydrateRemote: vi.fn(),
    startTask: vi.fn(),
    pauseTask: vi.fn(),
    cancelTask: vi.fn(),
    markCompleted: vi.fn(),
    removeTask: vi.fn(),
    clearCompleted: vi.fn(),
    clearFailed: vi.fn(),
  },
}));

vi.mock('@/stores/downloads', () => ({
  useDownloadsStore: () => downloadsStore,
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

describe('DownloadsView', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/downloads');

    downloadsStore.hydrateRemote.mockReset();
    downloadsStore.startTask.mockReset();
    downloadsStore.pauseTask.mockReset();
    downloadsStore.cancelTask.mockReset();
    downloadsStore.markCompleted.mockReset();
    downloadsStore.removeTask.mockReset();
    downloadsStore.clearCompleted.mockReset();
    downloadsStore.clearFailed.mockReset();

    downloadsStore.orderedTasks = [
      {
        id: 'task-1',
        url: 'https://example.com/file.mp4',
        type: 'direct',
        status: 'pending',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 100,
        fileName: 'Demo File',
        sourceLabel: '详情页',
        mediaResourceId: 9,
        launchCount: 0,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
      },
    ];
    downloadsStore.activeCount = 1;
    downloadsStore.completedCount = 0;
    downloadsStore.failedCount = 0;
    downloadsStore.lastRemoteSyncAt = '2025-01-02T00:00:00.000Z';
    downloadsStore.isSyncingRemote = false;
    downloadsStore.startTask.mockReturnValue(downloadsStore.orderedTasks[0]);
  });

  it('hydrates remote tasks on mount and refreshes on demand', async () => {
    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(downloadsStore.hydrateRemote).toHaveBeenCalledWith();

    const refreshButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('同步云端记录'));
    expect(refreshButton).toBeTruthy();

    await refreshButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.hydrateRemote).toHaveBeenCalledWith(true);
    expect(wrapper.text()).toContain('已刷新云端下载任务记录');
  });

  it('starts and clears tasks with visible feedback', async () => {
    downloadsStore.completedCount = 1;

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const startButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('开始下载'));
    expect(startButton).toBeTruthy();
    await startButton!.trigger('click');

    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-1');
    expect(wrapper.text()).toContain('已尝试启动下载：Demo File');

    const clearButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理已完成'));
    expect(clearButton).toBeTruthy();
    await clearButton!.trigger('click');

    expect(downloadsStore.clearCompleted).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已清理所有已完成任务');
  });

  it('retries and clears failed tasks with visible feedback', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-error',
        url: 'magnet:?xt=urn:btih:error-task',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Failed Task',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 1,
        error: '启动失败',
        createdAt: new Date('2025-01-03T00:00:00.000Z'),
        updatedAt: new Date('2025-01-03T01:00:00.000Z'),
      },
    ];
    downloadsStore.activeCount = 0;
    downloadsStore.completedCount = 0;
    downloadsStore.failedCount = 1;
    downloadsStore.startTask.mockReturnValue(downloadsStore.orderedTasks[0]);

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const retryButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('重试异常任务'));
    expect(retryButton).toBeTruthy();
    await retryButton!.trigger('click');

    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-error');
    expect(wrapper.text()).toContain('已批量重试 1 个异常任务');

    const clearFailedButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理异常记录'));
    expect(clearFailedButton).toBeTruthy();
    await clearFailedButton!.trigger('click');

    expect(downloadsStore.clearFailed).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已清理所有异常任务记录');
  });

  it('filters tasks by status and keyword', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-active',
        url: 'https://example.com/active.mp4',
        type: 'direct',
        status: 'pending',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 100,
        fileName: 'Active File',
        sourceLabel: '详情页',
        mediaResourceId: 3,
        launchCount: 0,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T01:00:00.000Z'),
      },
      {
        id: 'task-failed',
        url: 'magnet:?xt=urn:btih:failed-task',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Failed Magnet',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 1,
        error: '启动失败',
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T01:00:00.000Z'),
      },
    ];
    downloadsStore.activeCount = 1;
    downloadsStore.completedCount = 0;
    downloadsStore.failedCount = 1;

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const failedFilter = wrapper
      .findAll('button')
      .find(button => button.text().includes('异常 / 已取消'));
    expect(failedFilter).toBeTruthy();
    await failedFilter!.trigger('click');

    expect(wrapper.text()).toContain('Failed Magnet');
    expect(wrapper.text()).not.toContain('Active File');

    const searchInput = wrapper.find('input[placeholder="搜索文件名、来源或链接"]');
    expect(searchInput.exists()).toBe(true);
    await searchInput.setValue('详情页');

    expect(wrapper.text()).toContain('当前筛选下没有任务');

    const resetButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清空筛选'));
    expect(resetButton).toBeTruthy();
    await resetButton!.trigger('click');

    expect(wrapper.text()).toContain('Active File');
    expect(wrapper.text()).toContain('Failed Magnet');
  });

  it('hydrates filter state from location hash and keyword query', async () => {
    window.history.replaceState({}, '', '/downloads?keyword=hash-demo&type=magnet#failed');
    downloadsStore.orderedTasks = [
      {
        id: 'task-active',
        url: 'https://example.com/active.mp4',
        type: 'direct',
        status: 'pending',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 100,
        fileName: 'Active File',
        sourceLabel: '详情页',
        mediaResourceId: 3,
        launchCount: 0,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T01:00:00.000Z'),
      },
      {
        id: 'task-failed',
        url: 'magnet:?xt=urn:btih:hash-demo',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Demo Magnet',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 1,
        error: '启动失败',
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T01:00:00.000Z'),
      },
    ];
    downloadsStore.activeCount = 1;
    downloadsStore.completedCount = 0;
    downloadsStore.failedCount = 1;

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Demo Magnet');
    expect(wrapper.text()).not.toContain('Active File');
  });

  it('filters tasks by download type', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-direct',
        url: 'https://example.com/direct.mp4',
        type: 'direct',
        status: 'pending',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 100,
        fileName: 'Direct File',
        sourceLabel: '详情页',
        mediaResourceId: 3,
        launchCount: 0,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T01:00:00.000Z'),
      },
      {
        id: 'task-magnet',
        url: 'magnet:?xt=urn:btih:magnet-task',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Magnet File',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 1,
        error: '启动失败',
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T01:00:00.000Z'),
      },
    ];

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const magnetTypeFilter = wrapper
      .findAll('button')
      .find(button => button.text().includes('Magnet'));
    expect(magnetTypeFilter).toBeTruthy();
    await magnetTypeFilter!.trigger('click');

    expect(wrapper.text()).toContain('Magnet File');
    expect(wrapper.text()).not.toContain('Direct File');
  });

  it('writes current filters back into the location url', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-magnet',
        url: 'magnet:?xt=urn:btih:sync-task',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Sync Magnet',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 1,
        error: '启动失败',
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T01:00:00.000Z'),
      },
    ];
    downloadsStore.failedCount = 1;

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const failedFilter = wrapper
      .findAll('button')
      .find(button => button.text().includes('异常 / 已取消'));
    expect(failedFilter).toBeTruthy();
    await failedFilter!.trigger('click');

    const magnetTypeFilter = wrapper
      .findAll('button')
      .find(button => button.text().includes('Magnet'));
    expect(magnetTypeFilter).toBeTruthy();
    await magnetTypeFilter!.trigger('click');

    const searchInput = wrapper.find('input[placeholder="搜索文件名、来源或链接"]');
    await searchInput.setValue('not-found');
    await flushPromises();

    expect(window.location.hash).toBe('#failed');
    expect(window.location.search).toContain('type=magnet');
    expect(window.location.search).toContain('keyword=not-found');

    const resetButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清空筛选'));
    expect(resetButton).toBeTruthy();
    await resetButton!.trigger('click');
    await flushPromises();

    expect(window.location.hash).toBe('');
    expect(window.location.search).toBe('');
  });
});
