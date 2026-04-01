import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ProfileView from '@/views/ProfileView.vue';

const { watchHistoryApi, authStore, routerPush } = vi.hoisted(() => ({
  watchHistoryApi: {
    getUserStats: vi.fn(),
    getContinueWatching: vi.fn(),
    getCompleted: vi.fn(),
  },
  authStore: {
    user: {
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    fetchUserProfile: vi.fn(),
    logout: vi.fn(),
  },
  routerPush: vi.fn(),
}));

vi.mock('@/api/watchHistory', () => ({
  watchHistoryApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRouter: () => ({
    push: routerPush,
  }),
}));

describe('ProfileView', () => {
  beforeEach(() => {
    routerPush.mockReset();
    authStore.fetchUserProfile.mockReset();
    authStore.logout.mockReset();
    watchHistoryApi.getUserStats.mockReset();
    watchHistoryApi.getContinueWatching.mockReset();
    watchHistoryApi.getCompleted.mockReset();

    watchHistoryApi.getUserStats.mockResolvedValue({
      totalWatched: 3,
      completed: 1,
      watching: 2,
      totalWatchTime: 3600,
    });
    watchHistoryApi.getContinueWatching.mockResolvedValue([
      {
        id: 11,
        currentTime: 128,
        mediaResource: {
          id: 9,
          title: 'Demo Movie',
          poster: '',
        },
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);
    watchHistoryApi.getCompleted.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 4,
      totalPages: 0,
    });
  });

  it('continues watching from the saved progress timestamp', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    await wrapper.get('.space-y-4 > div').trigger('click');

    expect(routerPush).toHaveBeenCalledWith('/watch/9?time=128');
  });

  it('renders completed cards safely when rating is missing', async () => {
    watchHistoryApi.getContinueWatching.mockResolvedValue([]);
    watchHistoryApi.getCompleted.mockResolvedValue({
      data: [
        {
          id: 12,
          mediaResource: {
            id: 5,
            title: 'No Rating Movie',
            poster: '',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 4,
      totalPages: 1,
    });

    const wrapper = mount(ProfileView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('No Rating Movie');
  });
});

