import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import WatchHistoryView from '@/views/WatchHistoryView.vue';

const { watchHistoryApi, authStore, routeState, routerReplace, routerPush } = vi.hoisted(() => ({
  watchHistoryApi: {
    getMyWatchHistory: vi.fn(),
    deleteWatchHistory: vi.fn(),
  },
  authStore: {
    user: { id: 1 },
    fetchUserProfile: vi.fn(),
  },
  routeState: {
    query: {} as Record<string, string>,
  },
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('@/api/watchHistory', () => ({
  watchHistoryApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace,
    push: routerPush,
  }),
}));

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
};

describe('WatchHistoryView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    routerPush.mockReset();
    watchHistoryApi.getMyWatchHistory.mockReset();
    watchHistoryApi.deleteWatchHistory.mockReset();
    authStore.fetchUserProfile.mockReset();
    authStore.user = { id: 1 };
  });

  it('loads using route query filters', async () => {
    routeState.query = {
      page: '2',
      isCompleted: 'false',
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    };
    watchHistoryApi.getMyWatchHistory.mockResolvedValue({
      data: [],
      page: 2,
      limit: 10,
      total: 2,
      totalPages: 3,
    });

    mount(WatchHistoryView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(watchHistoryApi.getMyWatchHistory).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      isCompleted: false,
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    });
  });

  it('normalizes the route when the backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '4',
      isCompleted: 'true',
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
    watchHistoryApi.getMyWatchHistory.mockResolvedValue({
      data: [],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    mount(WatchHistoryView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'watch-history',
      query: {
        isCompleted: 'true',
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      },
    });
  });
});
