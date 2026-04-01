import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminWatchHistoryView from '@/views/AdminWatchHistoryView.vue';

const { adminApi, routeState, routerReplace } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getWatchHistory: vi.fn(),
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

describe('AdminWatchHistoryView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getUsers.mockReset();
    adminApi.getWatchHistory.mockReset();
    adminApi.getUsers.mockResolvedValue({
      data: [{ id: 8, username: 'demo-user', nickname: 'Demo User', email: 'demo@example.com' }],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
  });

  it('loads using route query filters', async () => {
    routeState.query = {
      page: '2',
      userId: '8',
    };
    adminApi.getWatchHistory.mockResolvedValue({
      data: [],
      total: 2,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    mount(AdminWatchHistoryView);
    await flushPromises();

    expect(adminApi.getWatchHistory).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      userId: 8,
    });
  });

  it('normalizes the route when the backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '4',
      userId: '8',
    };
    adminApi.getWatchHistory.mockResolvedValue({
      data: [],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminWatchHistoryView);
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-watch-history',
      query: { userId: '8' },
    });
  });
});
