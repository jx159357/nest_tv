import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RecommendationsView from '@/views/RecommendationsView.vue';

const { recommendationsApi, searchApi, authStore, routeState } = vi.hoisted(() => ({
  recommendationsApi: {
    getPersonalizedDetailed: vi.fn(),
    getProfile: vi.fn(),
    getTrending: vi.fn(),
    getLatest: vi.fn(),
    getTopRated: vi.fn(),
  },
  searchApi: {
    getHistory: vi.fn(),
    clearHistory: vi.fn(),
    getRelatedKeywords: vi.fn(),
  },
  authStore: {
    token: 'demo-token',
    isAuthenticated: true,
  },
  routeState: {
    query: {} as Record<string, string>,
  },
}));

vi.mock('@/api/recommendations', () => ({
  recommendationsApi,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/components/MediaCard.vue', () => ({
  default: {
    props: ['media'],
    template: '<div class="media-card-stub">{{ media?.title }}</div>',
  },
}));

describe('RecommendationsView', () => {
  beforeEach(() => {
    authStore.token = 'demo-token';
    authStore.isAuthenticated = true;
    routeState.query = {};
    recommendationsApi.getPersonalizedDetailed.mockReset();
    recommendationsApi.getProfile.mockReset();
    recommendationsApi.getTrending.mockReset();
    recommendationsApi.getLatest.mockReset();
    recommendationsApi.getTopRated.mockReset();
    searchApi.getHistory.mockReset();
    searchApi.clearHistory.mockReset();
    searchApi.getRelatedKeywords.mockReset();

    recommendationsApi.getTrending.mockResolvedValue([]);
    recommendationsApi.getLatest.mockResolvedValue([]);
    recommendationsApi.getTopRated.mockResolvedValue([]);
    searchApi.getHistory.mockResolvedValue([]);
    searchApi.clearHistory.mockResolvedValue({ message: 'ok' });
    searchApi.getRelatedKeywords.mockResolvedValue([]);
  });

  it('clears stale personalized content before a failed refresh', async () => {
    recommendationsApi.getPersonalizedDetailed
      .mockResolvedValueOnce([
        {
          media: { id: 1, title: 'First User Item' },
          score: 9,
          reasons: ['match'],
        },
      ])
      .mockRejectedValueOnce(new Error('boom'));
    recommendationsApi.getProfile
      .mockResolvedValueOnce({
        strategy: 'history-based',
        totalWatched: 5,
        completedCount: 3,
        recentWatchCount: 2,
        averageCompletionRate: 80,
        favoriteTypes: [],
        favoriteGenres: [],
        favoriteDirectors: [],
        recentSearchKeywords: [],
      })
      .mockRejectedValueOnce(new Error('boom'));

    const wrapper = mount(RecommendationsView);
    await flushPromises();

    expect(wrapper.text()).toContain('First User Item');

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('First User Item');
    expect(wrapper.text()).toContain('boom');
  });

  it('shows the profile-focus hint when entered from recommendation settings', async () => {
    routeState.query = { focus: 'profile' };
    recommendationsApi.getPersonalizedDetailed.mockResolvedValue([]);
    recommendationsApi.getProfile.mockResolvedValue({
      strategy: 'history-based',
      totalWatched: 5,
      completedCount: 3,
      recentWatchCount: 2,
      averageCompletionRate: 80,
      favoriteTypes: [],
      favoriteGenres: [],
      favoriteDirectors: [],
      recentSearchKeywords: [],
    });

    const wrapper = mount(RecommendationsView);
    await flushPromises();

    expect(wrapper.text()).toContain('推荐设置');
    expect(wrapper.text()).toContain('偏好画像');
  });

  it('renders search history insights and clears them on demand', async () => {
    searchApi.getHistory.mockResolvedValue(['沙丘', '奥本海默']);
    searchApi.getRelatedKeywords.mockResolvedValue(['沙丘2', '科幻史诗']);
    recommendationsApi.getPersonalizedDetailed.mockResolvedValue([]);
    recommendationsApi.getProfile.mockResolvedValue({
      strategy: 'history-based',
      totalWatched: 5,
      completedCount: 3,
      recentWatchCount: 2,
      averageCompletionRate: 80,
      favoriteTypes: [],
      favoriteGenres: [],
      favoriteDirectors: [],
      recentSearchKeywords: [],
    });

    const wrapper = mount(RecommendationsView);
    await flushPromises();

    expect(wrapper.text()).toContain('搜索兴趣');
    expect(wrapper.text()).toContain('沙丘');
    expect(wrapper.text()).toContain('沙丘2');

    const clearButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清空搜索历史'));

    expect(clearButton).toBeTruthy();

    await clearButton!.trigger('click');
    await flushPromises();

    expect(searchApi.clearHistory).toHaveBeenCalled();
    expect(wrapper.text()).toContain('暂无服务端搜索历史');
  });
});
