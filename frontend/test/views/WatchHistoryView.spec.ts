import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import WatchHistoryView from '@/views/WatchHistoryView.vue';

const { watchHistoryApi, authStore, routeState, routerReplace, routerPush, showConfirm } = vi.hoisted(() => ({
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
  showConfirm: vi.fn(),
}));

vi.mock('@/api/watchHistory', () => ({
  watchHistoryApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('@/composables/useModal', () => ({
  showConfirm,
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace,
    push: routerPush,
  }),
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
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
    showConfirm.mockReset();
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

  it('uses shared confirmation before deleting watch history', async () => {
    watchHistoryApi.getMyWatchHistory.mockResolvedValue({
      data: [
        {
          id: 9,
          mediaResourceId: 11,
          currentTime: 120,
          duration: 360,
          isCompleted: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
          mediaResource: {
            id: 11,
            title: 'Demo Media',
            poster: '',
          },
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    watchHistoryApi.deleteWatchHistory.mockResolvedValue(undefined);

    const wrapper = mount(WatchHistoryView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    const deleteButton = wrapper.findAll('button').find(button => button.text().includes('删除'));
    expect(deleteButton).toBeTruthy();

    await deleteButton!.trigger('click');

    expect(showConfirm).toHaveBeenCalledWith('确定要删除这条观看历史记录吗？', expect.any(Function));

    const onConfirm = showConfirm.mock.calls[0][1] as () => Promise<void>;
    await onConfirm();
    await flushPromises();

    expect(watchHistoryApi.deleteWatchHistory).toHaveBeenCalledWith('9');
  });
});
