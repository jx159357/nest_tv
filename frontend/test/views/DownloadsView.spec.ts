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
    downloadsStore.hydrateRemote.mockResolvedValue({
      tasks: downloadsStore.orderedTasks,
      remoteRequested: true,
      remoteSucceeded: true,
    });
    downloadsStore.clearCompleted.mockResolvedValue({
      remoteRequested: false,
      remoteSucceeded: true,
    });
    downloadsStore.clearFailed.mockResolvedValue({
      remoteRequested: false,
      remoteSucceeded: true,
    });
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

  it('does not show a misleading start message when the store returns no task', async () => {
    downloadsStore.startTask.mockReturnValueOnce(null);

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
    await flushPromises();

    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-1');
    expect(wrapper.text()).not.toContain('已尝试启动下载：Demo File');
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
    await flushPromises();

    expect(downloadsStore.clearCompleted).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已清理所有已完成任务');
  });

  it('handles pause, complete, cancel, and remove row actions with visible feedback', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-running',
        url: 'https://example.com/running.mp4',
        type: 'direct',
        status: 'downloading',
        progress: 45,
        speed: 256,
        downloaded: 45,
        total: 100,
        fileName: 'Running File',
        sourceLabel: '播放页',
        mediaResourceId: 11,
        launchCount: 1,
        createdAt: new Date('2025-01-03T00:00:00.000Z'),
        updatedAt: new Date('2025-01-03T01:00:00.000Z'),
      },
    ];
    downloadsStore.activeCount = 1;
    downloadsStore.completedCount = 0;
    downloadsStore.failedCount = 0;

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const pauseButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('暂停标记'));
    expect(pauseButton).toBeTruthy();
    await pauseButton!.trigger('click');
    expect(downloadsStore.pauseTask).toHaveBeenCalledWith('task-running');
    expect(wrapper.text()).toContain('任务已标记为暂停。');

    const completeButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('标记完成'));
    expect(completeButton).toBeTruthy();
    await completeButton!.trigger('click');
    expect(downloadsStore.markCompleted).toHaveBeenCalledWith('task-running');
    expect(wrapper.text()).toContain('任务已标记为完成。');

    const cancelButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('取消任务'));
    expect(cancelButton).toBeTruthy();
    await cancelButton!.trigger('click');
    expect(downloadsStore.cancelTask).toHaveBeenCalledWith('task-running');
    expect(wrapper.text()).toContain('任务已取消。');

    const removeButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('移除记录'));
    expect(removeButton).toBeTruthy();
    await removeButton!.trigger('click');
    expect(downloadsStore.removeTask).toHaveBeenCalledWith('task-running');
    expect(wrapper.text()).toContain('任务记录已移除。');
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
    await flushPromises();

    expect(downloadsStore.clearFailed).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已清理所有异常任务记录');
  });

  it('shows the generic refresh failure message when no remote error text is available', async () => {
    downloadsStore.hydrateRemote
      .mockResolvedValueOnce({
        tasks: downloadsStore.orderedTasks,
        remoteRequested: true,
        remoteSucceeded: true,
      })
      .mockResolvedValueOnce({
        tasks: downloadsStore.orderedTasks,
        remoteRequested: true,
        remoteSucceeded: false,
      });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const refreshButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('同步云端记录'));
    expect(refreshButton).toBeTruthy();

    await refreshButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已尝试刷新云端下载任务记录，但云端同步失败。');
  });

  it('shows a failure message when remote refresh fails', async () => {
    downloadsStore.hydrateRemote
      .mockResolvedValueOnce({
        tasks: downloadsStore.orderedTasks,
        remoteRequested: true,
        remoteSucceeded: true,
      })
      .mockResolvedValueOnce({
        tasks: downloadsStore.orderedTasks,
        remoteRequested: true,
        remoteSucceeded: false,
        errorMessage: '远端服务不可用',
      });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const refreshButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('同步云端记录'));
    expect(refreshButton).toBeTruthy();

    await refreshButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已尝试刷新云端下载任务记录，但云端同步失败：远端服务不可用');
  });
  it('shows a failure message when the initial remote sync fails on mount', async () => {
    downloadsStore.hydrateRemote.mockResolvedValueOnce({
      tasks: downloadsStore.orderedTasks,
      remoteRequested: true,
      remoteSucceeded: false,
      errorMessage: '首次同步失败',
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('已尝试同步云端下载记录，但云端同步失败：首次同步失败');
  });
  it('shows the generic remote failure message when no error text is available on mount', async () => {
    downloadsStore.hydrateRemote.mockResolvedValueOnce({
      tasks: downloadsStore.orderedTasks,
      remoteRequested: true,
      remoteSucceeded: false,
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('已尝试同步云端下载记录，但云端同步失败。');
  });

  it('shows the generic completed-clear failure message when no remote error text is available', async () => {
    downloadsStore.completedCount = 1;
    downloadsStore.clearCompleted.mockResolvedValue({
      remoteRequested: true,
      remoteSucceeded: false,
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const clearButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理已完成'));
    expect(clearButton).toBeTruthy();

    await clearButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已清理本地已完成任务，但云端同步失败。');
  });

  it('shows partial-success feedback when remote clear fails', async () => {
    downloadsStore.completedCount = 1;
    downloadsStore.clearCompleted.mockResolvedValue({
      remoteRequested: true,
      remoteSucceeded: false,
      errorMessage: '清理接口失败',
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const clearButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理已完成'));
    expect(clearButton).toBeTruthy();

    await clearButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已清理本地已完成任务，但云端同步失败：清理接口失败');
  });
  it('shows the generic failed-clear failure message when no remote error text is available', async () => {
    downloadsStore.failedCount = 1;
    downloadsStore.clearFailed.mockResolvedValue({
      remoteRequested: true,
      remoteSucceeded: false,
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const clearFailedButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理异常记录'));
    expect(clearFailedButton).toBeTruthy();

    await clearFailedButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已清理本地异常任务记录，但云端同步失败。');
  });

  it('shows partial-success feedback when remote failed-task clear fails', async () => {
    downloadsStore.failedCount = 1;
    downloadsStore.clearFailed.mockResolvedValue({
      remoteRequested: true,
      remoteSucceeded: false,
      errorMessage: '异常清理失败',
    });

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const clearFailedButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清理异常记录'));
    expect(clearFailedButton).toBeTruthy();

    await clearFailedButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('已清理本地异常任务记录，但云端同步失败：异常清理失败');
  });

  it('prefers navigator.clipboard when copying task links and the clipboard api exists', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(DownloadsView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制链接'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(writeText).toHaveBeenCalledWith('https://example.com/file.mp4');
      expect(execCommandMock).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('下载链接已复制到剪贴板。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
  it('falls back to execCommand copy when navigator.clipboard is unavailable', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(DownloadsView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制链接'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(wrapper.text()).toContain('下载链接已复制到剪贴板。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });

  it('cleans up the fallback textarea when execCommand copy throws', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn(() => {
      throw new Error('copy failed');
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(DownloadsView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制链接'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(wrapper.text()).toContain('复制失败，请手动复制页面中的原始链接。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
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
    window.history.replaceState(
      {},
      '',
      '/downloads?keyword=Demo&hash=hash-demo&type=magnet#failed',
    );
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
      {
        id: 'task-failed-other',
        url: 'magnet:?xt=urn:btih:other-hash',
        type: 'magnet',
        status: 'error',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Demo Magnet 其他任务',
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
    expect(wrapper.text()).not.toContain('Demo Magnet 其他任务');
    expect(wrapper.text()).toContain('已锁定磁力 Hash：hash-demo');
  });

  it('clears the locked hash filter and removes it from the location url', async () => {
    window.history.replaceState(
      {},
      '',
      '/downloads?keyword=Demo&hash=hash-demo&type=magnet#failed',
    );
    downloadsStore.orderedTasks = [
      {
        id: 'task-magnet',
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

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const clearHashButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('取消 Hash 锁定'));
    expect(clearHashButton).toBeTruthy();
    await clearHashButton!.trigger('click');
    await flushPromises();

    expect(window.location.search).toContain('keyword=Demo');
    expect(window.location.search).toContain('type=magnet');
    expect(window.location.search).not.toContain('hash=hash-demo');
  });

  it('normalizes hash filter input before writing it into the location url', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-magnet',
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

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const hashInput = wrapper.find('input[placeholder="磁力 Hash，如 hash-demo"]');
    expect(hashInput.exists()).toBe(true);
    await hashInput.setValue(' HASH-DEMO ');
    await flushPromises();

    expect(window.location.search).toContain('hash=hash-demo');
    expect(wrapper.text()).toContain('已锁定磁力 Hash：hash-demo');
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

  it('renders a magnet-detail deep link for magnet tasks', async () => {
    downloadsStore.orderedTasks = [
      {
        id: 'task-magnet',
        url: 'magnet:?xt=urn:btih:hash-demo&dn=Demo%20Magnet',
        type: 'magnet',
        status: 'pending',
        progress: 0,
        speed: 0,
        downloaded: 0,
        total: 0,
        fileName: 'Demo Magnet',
        sourceLabel: '磁力页',
        mediaResourceId: null,
        launchCount: 0,
        metadata: { description: 'InfoHash: hash-demo' },
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T01:00:00.000Z'),
      },
    ];

    const routerLinkStub = {
      props: ['to'],
      template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
    };

    const wrapper = mount(DownloadsView, {
      global: {
        stubs: {
          RouterLink: routerLinkStub,
          'router-link': routerLinkStub,
        },
      },
    });
    await flushPromises();

    const torrentLink = wrapper
      .findAll('.router-link-stub')
      .find(link => link.text().includes('查看磁力详情'));

    expect(torrentLink).toBeTruthy();
    expect(torrentLink?.attributes('data-to')).toContain('"name":"torrent"');
    expect(torrentLink?.attributes('data-to')).toContain('"hash":"hash-demo"');
    expect(torrentLink?.attributes('data-to')).toContain('"keyword":"Demo Magnet"');
  });
});
