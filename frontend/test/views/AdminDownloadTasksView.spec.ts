import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminDownloadTasksView from '@/views/AdminDownloadTasksView.vue';

const { adminApi, routeState, routerReplace, showConfirm } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getDownloadTasks: vi.fn(),
    handleDownloadTask: vi.fn(),
    handleDownloadTasksBatch: vi.fn(),
  },
  routeState: {
    query: {} as Record<string, string>,
  },
  routerReplace: vi.fn(),
  showConfirm: vi.fn(),
}));

vi.mock('@/api/admin', () => ({
  adminApi,
}));

vi.mock('@/composables/useModal', () => ({
  showConfirm,
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace,
  }),
}));

describe('AdminDownloadTasksView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getUsers.mockReset();
    adminApi.getDownloadTasks.mockReset();
    adminApi.handleDownloadTask.mockReset();
    adminApi.handleDownloadTasksBatch.mockReset();
    showConfirm.mockReset();
    adminApi.getUsers.mockResolvedValue({
      data: [{ id: 8, username: 'demo-user', nickname: 'Demo User', email: 'demo@example.com' }],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    adminApi.handleDownloadTask.mockResolvedValue({
      id: 2,
      clientId: 'error-task',
      userId: 8,
      url: 'https://example.com/error.mp4',
      type: 'magnet',
      status: 'pending',
      progress: 0,
      speed: 0,
      downloaded: 0,
      total: 100,
      fileName: 'Error Task',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    });
    adminApi.handleDownloadTasksBatch.mockResolvedValue([]);
    showConfirm.mockImplementation((_: string, onConfirm: () => void) => {
      onConfirm();
    });
  });

  it('loads using route query filters and prefers exception tasks when configured', async () => {
    routeState.query = {
      status: 'error',
      userId: '8',
      mediaResourceId: '12',
      sort: 'exceptions',
      page: '2',
    };
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 1,
          clientId: 'completed-task',
          userId: 8,
          url: 'https://example.com/completed.mp4',
          type: 'direct',
          status: 'completed',
          progress: 100,
          speed: 0,
          downloaded: 100,
          total: 100,
          fileName: 'Completed Task',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          clientId: 'error-task',
          userId: 8,
          url: 'https://example.com/error.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task',
          error: 'network',
          lastLaunchedAt: new Date().toISOString(),
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 2,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    expect(adminApi.getDownloadTasks).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: undefined,
      status: 'error',
      type: undefined,
      userId: 8,
      mediaResourceId: 12,
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.text()).toContain('Error Task');
    expect(rows[1]?.text()).toContain('Completed Task');
    expect(wrapper.text()).toContain('24h 内启动 / Magnet');
    expect(wrapper.text()).toContain('1 / 1');
  });

  it('shows task details panel with metadata and error information', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 3,
          clientId: 'detail-task',
          userId: 8,
          url: 'https://example.com/detail.mp4',
          type: 'direct',
          status: 'error',
          progress: 42,
          speed: 2048,
          downloaded: 42,
          total: 100,
          fileName: 'Detail Task',
          error: 'timeout',
          filePath: 'D:/downloads/detail.mp4',
          metadata: {
            resolution: '1080p',
            provider: 'demo-source',
          },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    await wrapper.get('.task-detail-toggle').trigger('click');

    expect(wrapper.find('.task-detail-panel').exists()).toBe(true);
    expect(wrapper.get('[data-testid="task-recommendation"]').text()).toContain(
      'Investigate failure before relaunch',
    );
    expect(wrapper.text()).toContain('Detail Task');
    expect(wrapper.text()).toContain('detail-task');
    expect(wrapper.text()).toContain('timeout');
    expect(wrapper.text()).toContain('1080p');
    expect(wrapper.text()).toContain('demo-source');
    expect(wrapper.text()).toContain('D:/downloads/detail.mp4');
    expect(wrapper.text()).toContain('Same user tasks');
    expect(wrapper.text()).toContain('Open download logs');
    expect(wrapper.text()).toContain('Open media admin');
    expect(
      wrapper.findAll('.router-link-stub').some(link => {
        const target = link.attributes('data-to') || '';
        return (
          target.includes('admin-logs') &&
          target.includes('clientId') &&
          target.includes('detail-task')
        );
      }),
    ).toBe(true);
  });

  it('handles retry actions from the detail panel', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 11,
          clientId: 'error-task',
          userId: 8,
          url: 'https://example.com/error.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task',
          error: 'network',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    await wrapper.get('.task-detail-toggle').trigger('click');
    const retryButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('重置为待处理'));
    expect(retryButton).toBeTruthy();
    await retryButton!.trigger('click');
    await flushPromises();

    expect(adminApi.handleDownloadTask).toHaveBeenCalledWith(11, { action: 'retry' });
    expect(wrapper.text()).toContain('已将任务「Error Task」重置为待处理');
  });

  it('retries visible failed tasks from the exception banner', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 21,
          clientId: 'error-task-1',
          userId: 8,
          url: 'https://example.com/error-1.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task 1',
          error: 'network',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
        {
          id: 22,
          clientId: 'cancelled-task',
          userId: 8,
          url: 'https://example.com/error-2.mp4',
          type: 'direct',
          status: 'cancelled',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 100,
          fileName: 'Cancelled Task',
          error: 'manual stop',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    const bulkRetryButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('重置当前页异常'));
    expect(bulkRetryButton).toBeTruthy();
    await bulkRetryButton!.trigger('click');
    await flushPromises();

    expect(adminApi.handleDownloadTasksBatch).toHaveBeenCalledWith({
      action: 'retry',
      ids: [21, 22],
    });
    expect(wrapper.text()).toContain('已将当前页 2 条异常任务重置为待处理');
  });

  it('cancels visible unfinished tasks from the exception banner', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 41,
          clientId: 'pending-task',
          userId: 8,
          url: 'https://example.com/pending.mp4',
          type: 'direct',
          status: 'pending',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 100,
          fileName: 'Pending Task',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
        {
          id: 42,
          clientId: 'error-task',
          userId: 8,
          url: 'https://example.com/error.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task',
          error: 'network',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    const cancelButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('取消当前页未完成'));
    expect(cancelButton).toBeTruthy();
    await cancelButton!.trigger('click');
    await flushPromises();

    expect(showConfirm).toHaveBeenCalled();
    expect(adminApi.handleDownloadTasksBatch).toHaveBeenCalledWith({
      action: 'cancel',
      ids: [41, 42],
    });
    expect(wrapper.text()).toContain('已将当前页 2 条未完成任务标记为取消');
  });

  it('writes sort mode into route query when filters are applied', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    await wrapper.get('select:last-of-type').setValue('started');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-download-tasks',
      query: { sort: 'started' },
    });
  });

  it('writes quick type filters into route query', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    const magnetFilter = wrapper.findAll('button').find(button => button.text().includes('Magnet'));
    expect(magnetFilter).toBeTruthy();
    await magnetFilter!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-download-tasks',
      query: { type: 'magnet' },
    });
  });

  it('shows search, status, and type filter chips from route state', async () => {
    routeState.query = {
      search: 'hash-demo',
      status: 'error',
      type: 'magnet',
    };
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    expect(wrapper.text()).toContain('搜索：hash-demo');
    expect(wrapper.text()).toContain('状态：error');
    expect(wrapper.text()).toContain('类型：magnet');
  });

  it('normalizes the route when the backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '5',
      status: 'error',
    };
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 7,
          clientId: 'clamped-task',
          userId: 8,
          url: 'https://example.com/clamped.mp4',
          type: 'direct',
          status: 'error',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 100,
          fileName: 'Clamped Task',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminDownloadTasksView);
    await flushPromises();

    expect(adminApi.getDownloadTasks).toHaveBeenCalledWith({
      page: 5,
      limit: 10,
      search: undefined,
      status: 'error',
      type: undefined,
      userId: undefined,
      mediaResourceId: undefined,
    });
    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-download-tasks',
      query: { status: 'error' },
    });
  });

  it('opens the matching task detail from route taskId query', async () => {
    routeState.query = {
      search: 'task-21',
      taskId: '21',
    };
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 21,
          clientId: 'task-21',
          userId: 8,
          url: 'https://example.com/error-1.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task 1',
          error: 'network',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    expect(wrapper.find('.task-detail-panel').exists()).toBe(true);
    expect(adminApi.getDownloadTasks).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'task-21',
      status: undefined,
      type: undefined,
      userId: undefined,
      mediaResourceId: undefined,
    });
  });

  it('writes taskId into route query when toggling details', async () => {
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 31,
          clientId: 'task-31',
          userId: 8,
          url: 'https://example.com/task-31.mp4',
          type: 'direct',
          status: 'pending',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: 100,
          fileName: 'Task 31',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminDownloadTasksView);
    await flushPromises();

    await wrapper.get('.task-detail-toggle').trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-download-tasks',
      query: { taskId: '31' },
    });
  });
});
