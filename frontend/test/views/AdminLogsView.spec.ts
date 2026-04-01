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
});
