import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ProfileView from '@/views/ProfileView.vue';

const { watchHistoryApi, recommendationsApi, searchApi, mediaApi, authStore, routerPush } = vi.hoisted(
  () => ({
    watchHistoryApi: {
      getUserStats: vi.fn(),
      getContinueWatching: vi.fn(),
      getCompleted: vi.fn(),
    },
    recommendationsApi: {
      getProfile: vi.fn(),
    },
    searchApi: {
      getHistory: vi.fn(),
    },
    mediaApi: {
      getFavorites: vi.fn(),
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
  }),
);

vi.mock('@/api/watchHistory', () => ({
  watchHistoryApi,
}));

vi.mock('@/api/recommendations', () => ({
  recommendationsApi,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/api/media', () => ({
  mediaApi,
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

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

vi.mock('@/components/LoadingSpinner.vue', () => ({
  default: {
    props: ['text'],
    template: '<div class="loading-spinner">{{ text }}</div>',
  },
}));

describe('ProfileView', () => {
  beforeEach(() => {
    routerPush.mockReset();
    authStore.fetchUserProfile.mockReset();
    authStore.logout.mockReset();
    watchHistoryApi.getUserStats.mockReset();
    watchHistoryApi.getContinueWatching.mockReset();
    watchHistoryApi.getCompleted.mockReset();
    recommendationsApi.getProfile.mockReset();
    searchApi.getHistory.mockReset();
    mediaApi.getFavorites.mockReset();

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
        duration: 3600,
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
    recommendationsApi.getProfile.mockResolvedValue({
      strategy: 'search-based',
      totalWatched: 0,
      completedCount: 0,
      recentWatchCount: 0,
      averageCompletionRate: 0,
      favoriteTypes: [],
      favoriteGenres: [],
      favoriteDirectors: [],
      recentSearchKeywords: [{ key: '沙丘', score: 5 }],
    });
    searchApi.getHistory.mockResolvedValue(['沙丘']);
    mediaApi.getFavorites.mockResolvedValue({
      data: [{ id: 5, title: 'Favorite Movie', type: 'movie', rating: 8.8 }],
      total: 1,
      page: 1,
      limit: 4,
      totalPages: 1,
    });
  });

  it('continues watching from the saved progress timestamp', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    await wrapper.get('[data-testid="continue-item"]').trigger('click');

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
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('No Rating Movie');
  });

  it('surfaces the interest center with search and favorites entries', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.html()).toContain('/search-history');
    expect(wrapper.text()).toContain('兴趣中心');
    expect(wrapper.text()).toContain('沙丘');
    expect(wrapper.text()).toContain('Favorite Movie');
  });
});


