import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DownloadsView from '@/views/DownloadsView.vue';

const { downloadsStore } = vi.hoisted(() => ({
  downloadsStore: {
    orderedTasks: [] as any[],
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
    downloadsStore.hydrateRemote.mockReset();
    downloadsStore.startTask.mockReset();
    downloadsStore.pauseTask.mockReset();
    downloadsStore.cancelTask.mockReset();
    downloadsStore.markCompleted.mockReset();
    downloadsStore.removeTask.mockReset();
    downloadsStore.clearCompleted.mockReset();

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

    const refreshButton = wrapper.findAll('button').find(button => button.text().includes('同步云端记录'));
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

    const startButton = wrapper.findAll('button').find(button => button.text().includes('开始下载'));
    expect(startButton).toBeTruthy();
    await startButton!.trigger('click');

    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-1');
    expect(wrapper.text()).toContain('已尝试启动下载：Demo File');

    const clearButton = wrapper.findAll('button').find(button => button.text().includes('清理已完成'));
    expect(clearButton).toBeTruthy();
    await clearButton!.trigger('click');

    expect(downloadsStore.clearCompleted).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已清理所有已完成任务');
  });
});
