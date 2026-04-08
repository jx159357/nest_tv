import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminLogsView from '@/views/AdminLogsView.vue';

const { adminApi, routeState, routerReplace } = vi.hoisted(() => ({
  adminApi: {
    getLogs: vi.fn(),
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

describe('AdminLogsView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getLogs.mockReset();
  });

  it('loads using route query filters', async () => {
    routeState.query = {
      page: '2',
      action: 'create',
      resource: 'media',
      status: 'warning',
      clientId: 'task-21',
      hash: 'hash-demo',
      downloadTaskId: '21',
    };
    adminApi.getLogs.mockResolvedValue({
      data: [],
      total: 2,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    mount(AdminLogsView);
    await flushPromises();

    expect(adminApi.getLogs).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      action: 'create',
      resource: 'media',
      status: 'warning',
      clientId: 'task-21',
      hash: 'hash-demo',
      downloadTaskId: 21,
      logId: undefined,
    });
  });

  it('normalizes the route when the backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '4',
      status: 'error',
    };
    adminApi.getLogs.mockResolvedValue({
      data: [],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminLogsView);
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { status: 'error' },
    });
  });

  it('writes quick action and resource filters into route query', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const downloadLogsButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('下载任务日志'));
    expect(downloadLogsButton).toBeTruthy();
    await downloadLogsButton!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { resource: 'download_task' },
    });

    const retryButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('retry 动作'));
    expect(retryButton).toBeTruthy();
    await retryButton!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { action: 'retry', resource: 'download_task' },
    });
  });

  it('normalizes clientId, hash, taskId, and logId filters into route query', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const clientIdInput = wrapper.find('input[placeholder="任务 clientId，如 task-21"]');
    const hashInput = wrapper.find('input[placeholder="任务 Hash，如 hash-demo"]');
    const taskIdInput = wrapper.find('input[placeholder="任务 ID，如 21"]');
    const logIdInput = wrapper.find('input[placeholder="日志 ID，如 7"]');

    await clientIdInput.setValue('task-21');
    await hashInput.setValue(' HASH-DEMO ');
    await taskIdInput.setValue('21');
    await logIdInput.setValue('7');

    const searchButton = wrapper.findAll('button').find(button => button.text().includes('搜索'));
    expect(searchButton).toBeTruthy();
    await searchButton!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { clientId: 'task-21', hash: 'hash-demo', downloadTaskId: '21', logId: '7' },
    });
  });

  it('shows active filter chips from route state', async () => {
    routeState.query = {
      action: 'retry',
      resource: 'download_task',
      status: 'success',
      clientId: 'task-21',
      hash: 'hash-demo',
      downloadTaskId: '21',
      logId: '7',
    };
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 7,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    expect(wrapper.text()).toContain('操作：retry');
    expect(wrapper.text()).toContain('资源：download_task');
    expect(wrapper.text()).toContain('状态：success');
    expect(wrapper.text()).toContain('clientId：task-21');
    expect(wrapper.text()).toContain('Hash：hash-demo');
    expect(wrapper.text()).toContain('任务：#21');
    expect(wrapper.text()).toContain('日志：#7');
  });

  it('shows metadata and request info in the log detail panel', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 7,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          description: 'Handle download task: retry',
          roleId: 1,
          userId: 8,
          createdAt: '2025-01-01T00:00:00.000Z',
          metadata: {
            downloadTaskId: 21,
            clientId: 'task-21',
            infoHash: 'hash-demo',
            status: 'pending',
          },
          requestInfo: {
            method: 'PATCH',
            url: '/admin/download-tasks/21',
            ip: '127.0.0.1',
            userAgent: 'Vitest',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const detailButton = wrapper.findAll('button').find(button => button.text().includes('详情'));
    expect(detailButton).toBeTruthy();
    await detailButton!.trigger('click');

    expect(wrapper.text()).toContain('downloadTaskId');
    expect(wrapper.text()).toContain('task-21');
    expect(wrapper.text()).toContain('PATCH /admin/download-tasks/21');
    expect(wrapper.text()).toContain('127.0.0.1');
    expect(wrapper.text()).toContain('Vitest');
    const taskLink = wrapper.find('.router-link-stub');
    expect(taskLink.exists()).toBe(true);
    expect(taskLink.attributes('data-to')).toContain('admin-download-tasks');
    expect(taskLink.attributes('data-to')).toContain('magnet');
    expect(taskLink.attributes('data-to')).not.toContain('task-21');
    expect(taskLink.attributes('data-to')).toContain('21');
    expect(taskLink.attributes('data-to')).toContain('hash-demo');
  });

  it('still links back to admin download tasks when only downloadTaskId is available', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 8,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
          metadata: {
            downloadTaskId: 31,
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const detailButton = wrapper.findAll('button').find(button => button.text().includes('详情'));
    expect(detailButton).toBeTruthy();
    await detailButton!.trigger('click');

    const taskLink = wrapper.find('.router-link-stub');
    expect(taskLink.exists()).toBe(true);
    expect(taskLink.attributes('data-to')).toContain('admin-download-tasks');
    expect(taskLink.attributes('data-to')).toContain('taskId');
    expect(taskLink.attributes('data-to')).toContain('31');
  });

  it('uses exact clientId query when only clientId is available in log metadata', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 9,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
          metadata: {
            clientId: 'task-21',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const detailButton = wrapper.findAll('button').find(button => button.text().includes('详情'));
    expect(detailButton).toBeTruthy();
    await detailButton!.trigger('click');

    const taskLink = wrapper.find('.router-link-stub');
    expect(taskLink.exists()).toBe(true);
    expect(taskLink.attributes('data-to')).toContain('clientId');
    expect(taskLink.attributes('data-to')).toContain('task-21');
    expect(taskLink.attributes('data-to')).not.toContain('search');
  });

  it('opens the matching log detail from route logId query', async () => {
    routeState.query = { logId: '7' };
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 7,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    expect(wrapper.text()).toContain('日志：#7');
    expect(wrapper.findAll('button').some(button => button.text().includes('收起'))).toBe(true);
  });

  it('writes logId into route query when toggling log details', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 7,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    const detailButton = wrapper.findAll('button').find(button => button.text().includes('详情'));
    expect(detailButton).toBeTruthy();
    await detailButton!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { logId: '7' },
    });
  });

  it('drops an invalid routed logId and falls back to the remaining filters', async () => {
    routeState.query = {
      resource: 'download_task',
      logId: '7',
    };
    adminApi.getLogs.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminLogsView);
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { resource: 'download_task' },
    });
  });

  it('aggregates download-task action metrics in summary cards', async () => {
    adminApi.getLogs.mockResolvedValue({
      data: [
        {
          id: 1,
          action: 'retry',
          resource: 'download_task',
          status: 'success',
          roleId: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          action: 'cancel',
          resource: 'download_task',
          status: 'warning',
          roleId: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          action: 'update',
          resource: 'media',
          status: 'success',
          roleId: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 3,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminLogsView);
    await flushPromises();

    expect(wrapper.text()).toContain('下载任务日志');
    expect(wrapper.text()).toContain('retry 动作');
    expect(wrapper.text()).toContain('cancel 动作');
    expect(wrapper.text()).toContain('24h 下载动作');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('1');

    const retryCard = wrapper
      .findAll('button')
      .find(button => button.text().includes('retry 动作'));
    expect(retryCard).toBeTruthy();
    await retryCard!.trigger('click');

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-logs',
      query: { action: 'retry' },
    });
  });
});
