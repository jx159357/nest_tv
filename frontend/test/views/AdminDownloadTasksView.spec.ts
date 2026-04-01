import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminDownloadTasksView from '@/views/AdminDownloadTasksView.vue';

const { adminApi, routeState, routerReplace } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getDownloadTasks: vi.fn(),
  },
  routeState: {
    query: {} as Record<string, string>,
  },
  routerReplace: vi.fn(),
}));

vi.mock('@/api/admin', () => ({
  adminApi,
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
    adminApi.getUsers.mockResolvedValue({
      data: [{ id: 8, username: 'demo-user', nickname: 'Demo User', email: 'demo@example.com' }],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
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
    expect(wrapper.text()).toContain('Open media admin');
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
});
