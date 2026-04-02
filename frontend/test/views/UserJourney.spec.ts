import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import HomeView from '@/views/HomeView.vue';
import MediaDetailView from '@/views/MediaDetailView.vue';
import FavoritesView from '@/views/FavoritesView.vue';
import SettingsView from '@/views/SettingsView.vue';
import RecommendationsView from '@/views/RecommendationsView.vue';

const {
  routeState,
  routerState,
  mediaStore,
  authStore,
  downloadsStore,
  searchApi,
  authApi,
  recommendationsApi,
  mediaApi,
  notifySuccess,
  notifyError,
  notifyInfo,
} = vi.hoisted(() => ({
  routeState: {
    path: '/',
    params: {} as Record<string, string>,
    query: {} as Record<string, string>,
  },
  routerState: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  mediaStore: {
    fetchPopularMedia: vi.fn(),
    fetchLatestMedia: vi.fn(),
    fetchTopRatedMedia: vi.fn(),
    searchMedia: vi.fn(),
    fetchMediaDetail: vi.fn(),
    fetchRecommendations: vi.fn(),
    fetchFavoriteStatus: vi.fn(),
    toggleFavorite: vi.fn(),
    fetchFavorites: vi.fn(),
  },
  authStore: {
    token: 'demo-token',
    isAuthenticated: true,
    user: {
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      role: 'user',
      nickname: 'Demo',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      isActive: true,
    },
    fetchUserProfile: vi.fn(),
    logout: vi.fn(),
  },
  downloadsStore: {
    enqueueTask: vi.fn(),
    startTask: vi.fn(),
  },
  searchApi: {
    getSuggestions: vi.fn(),
    getPopularKeywords: vi.fn(),
    getHistory: vi.fn(),
    clearHistory: vi.fn(),
    getRelatedKeywords: vi.fn(),
    recordHistory: vi.fn(),
  },
  authApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
  recommendationsApi: {
    getPersonalizedDetailed: vi.fn(),
    getProfile: vi.fn(),
    getTrending: vi.fn(),
    getLatest: vi.fn(),
    getTopRated: vi.fn(),
  },
  mediaApi: {
    getMediaById: vi.fn(),
  },
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => routeState,
  useRouter: () => routerState,
  onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/stores/media', () => ({
  useMediaStore: () => mediaStore,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('@/stores/downloads', () => ({
  useDownloadsStore: () => downloadsStore,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/api/auth', () => ({
  authApi,
}));

vi.mock('@/api/recommendations', () => ({
  recommendationsApi,
}));

vi.mock('@/api/media', () => ({
  mediaApi,
}));

vi.mock('@/composables/useModal', () => ({
  notifySuccess,
  notifyError,
  notifyInfo,
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

vi.mock('@/components/MediaCard.vue', () => ({
  default: {
    props: ['media'],
    template: '<button class="media-card" @click="$emit(\'click\')">{{ media?.title }}</button>',
  },
}));

vi.mock('@/components/LoadingSpinner.vue', () => ({
  default: {
    props: ['text'],
    template: '<div class="loading-spinner">{{ text }}</div>',
  },
}));

vi.mock('@/components/EmptyState.vue', () => ({
  default: {
    props: ['title'],
    template: '<div class="empty-state">{{ title }}</div>',
  },
}));

const mountWithStubs = (component: any): VueWrapper =>
  mount(component, {
    global: {
      stubs: {
        RouterLink: true,
        'router-link': true,
      },
    },
  });

describe('User journey regression', () => {
  beforeEach(() => {
    routeState.path = '/';
    routeState.params = {};
    routeState.query = {};
    routerState.push.mockReset();
    routerState.replace.mockReset();

    mediaStore.fetchPopularMedia.mockReset();
    mediaStore.fetchLatestMedia.mockReset();
    mediaStore.fetchTopRatedMedia.mockReset();
    mediaStore.searchMedia.mockReset();
    mediaStore.fetchMediaDetail.mockReset();
    mediaStore.fetchRecommendations.mockReset();
    mediaStore.fetchFavoriteStatus.mockReset();
    mediaStore.toggleFavorite.mockReset();
    mediaStore.fetchFavorites.mockReset();

    authApi.getProfile.mockReset();
    authApi.updateProfile.mockReset();
    authApi.changePassword.mockReset();

    searchApi.getSuggestions.mockReset();
    searchApi.getPopularKeywords.mockReset();
    searchApi.getHistory.mockReset();
    searchApi.clearHistory.mockReset();
    searchApi.getRelatedKeywords.mockReset();
    searchApi.recordHistory.mockReset();

    recommendationsApi.getPersonalizedDetailed.mockReset();
    recommendationsApi.getProfile.mockReset();
    recommendationsApi.getTrending.mockReset();
    recommendationsApi.getLatest.mockReset();
    recommendationsApi.getTopRated.mockReset();

    mediaApi.getMediaById.mockReset();
    notifySuccess.mockReset();
    notifyError.mockReset();
    notifyInfo.mockReset();

    mediaStore.fetchPopularMedia.mockResolvedValue([]);
    mediaStore.fetchLatestMedia.mockResolvedValue([]);
    mediaStore.fetchTopRatedMedia.mockResolvedValue([]);
    mediaStore.searchMedia.mockResolvedValue({ data: [{ id: 9, title: '沙丘', rating: 8.6 }] });
    mediaStore.fetchMediaDetail.mockResolvedValue({
      id: 9,
      title: '沙丘',
      description: '科幻史诗',
      type: 'movie',
      rating: 8.6,
      viewCount: 100,
      genres: ['科幻'],
      source: 'demo',
      playSources: [],
      downloadUrls: [],
    });
    mediaStore.fetchRecommendations.mockResolvedValue([]);
    mediaStore.fetchFavoriteStatus.mockResolvedValue(false);
    mediaStore.toggleFavorite.mockResolvedValue(true);
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: '沙丘', rating: 8.6, type: 'movie' }],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    authApi.getProfile.mockResolvedValue({
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      nickname: 'Demo',
      role: 'user',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      recommendationSettings: {
        preferredTypes: ['movie'],
        preferredGenres: ['科幻'],
        excludedGenres: [],
        preferredKeywords: ['沙丘'],
        freshnessBias: 'balanced',
      },
    });
    authApi.updateProfile.mockImplementation(async payload => ({
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      nickname: payload.nickname || 'Demo',
      role: 'user',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      recommendationSettings: payload.recommendationSettings,
    }));
    authApi.changePassword.mockResolvedValue({ success: true });

    searchApi.getSuggestions.mockResolvedValue([]);
    searchApi.getPopularKeywords.mockResolvedValue([]);
    searchApi.getHistory.mockResolvedValue(['沙丘']);
    searchApi.clearHistory.mockResolvedValue({ message: 'ok' });
    searchApi.getRelatedKeywords.mockResolvedValue(['沙丘2']);
    searchApi.recordHistory.mockResolvedValue({ success: true });

    recommendationsApi.getPersonalizedDetailed.mockResolvedValue([
      {
        media: { id: 15, title: '沙丘2', rating: 8.9, type: 'movie', viewCount: 50 },
        score: 9.5,
        reasons: ['接续你最近搜索：沙丘'],
      },
    ]);
    recommendationsApi.getProfile.mockResolvedValue({
      strategy: 'search-based',
      totalWatched: 0,
      completedCount: 0,
      recentWatchCount: 0,
      averageCompletionRate: 0,
      favoriteTypes: [{ key: 'movie', score: 6 }],
      favoriteGenres: [{ key: '科幻', score: 4 }],
      favoriteDirectors: [],
      recentSearchKeywords: [{ key: '沙丘', score: 5 }],
    });
    recommendationsApi.getTrending.mockResolvedValue([]);
    recommendationsApi.getLatest.mockResolvedValue([]);
    recommendationsApi.getTopRated.mockResolvedValue([]);

    mediaApi.getMediaById.mockResolvedValue({ id: 9, title: '沙丘', rating: 8.6 });
  });

  it('keeps user context flowing through search, favorite, settings, and recommendations', async () => {
    const homeWrapper = mountWithStubs(HomeView);
    await flushPromises();

    await homeWrapper.get('input[type="text"]').setValue('沙丘');
    await homeWrapper.get('button').trigger('click');

    expect(routerState.push).toHaveBeenCalledWith({
      path: '/search',
      query: { q: '沙丘' },
    });
    expect(searchApi.recordHistory).toHaveBeenCalledWith({ keyword: '沙丘' });

    routeState.params = { id: '9' };
    routeState.query = {};
    const detailWrapper = mountWithStubs(MediaDetailView);
    await flushPromises();

    const favoriteButton = detailWrapper
      .findAll('button')
      .find(button => button.text().includes('加入收藏'));
    expect(favoriteButton).toBeTruthy();

    await favoriteButton!.trigger('click');
    await flushPromises();

    expect(mediaStore.toggleFavorite).toHaveBeenCalledWith('9', false);
    expect(detailWrapper.text()).toContain('已将《沙丘》加入收藏');

    const goFavoritesButton = detailWrapper
      .findAll('button')
      .find(button => button.text().includes('查看收藏'));
    expect(goFavoritesButton).toBeTruthy();

    await goFavoritesButton!.trigger('click');

    expect(routerState.push).toHaveBeenCalledWith({
      name: 'favorites',
      query: { highlight: '9' },
    });

    routeState.query = { highlight: '9' };
    const favoritesWrapper = mountWithStubs(FavoritesView);
    await flushPromises();

    expect(favoritesWrapper.text()).toContain('刚加入收藏');
    expect(favoritesWrapper.text()).toContain('沙丘');

    const settingsWrapper = mountWithStubs(SettingsView);
    await flushPromises();

    const textInputs = settingsWrapper.findAll('input[type="text"]');
    await textInputs[3].setValue('沙丘, 科幻');

    const saveButton = settingsWrapper
      .findAll('button')
      .find(button => button.text().includes('保存设置'));
    expect(saveButton).toBeTruthy();

    await saveButton!.trigger('click');
    await flushPromises();

    expect(authApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendationSettings: expect.objectContaining({
          preferredKeywords: ['沙丘', '科幻'],
        }),
      }),
    );

    routeState.query = { focus: 'profile' };
    const recommendationsWrapper = mountWithStubs(RecommendationsView);
    await flushPromises();

    expect(recommendationsWrapper.text()).toContain('最近搜索');
    expect(recommendationsWrapper.text()).toContain('沙丘');
    expect(recommendationsWrapper.text()).toContain('沙丘2');
  });
});
