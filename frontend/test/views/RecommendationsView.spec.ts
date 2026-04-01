import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RecommendationsView from '@/views/RecommendationsView.vue';

const { recommendationsApi, authStore } = vi.hoisted(() => ({
  recommendationsApi: {
    getPersonalizedDetailed: vi.fn(),
    getProfile: vi.fn(),
    getTrending: vi.fn(),
    getLatest: vi.fn(),
    getTopRated: vi.fn(),
  },
  authStore: {
    token: 'demo-token',
    isAuthenticated: true,
  },
}));

vi.mock('@/api/recommendations', () => ({
  recommendationsApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('vue-router', () => ({
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
    recommendationsApi.getPersonalizedDetailed.mockReset();
    recommendationsApi.getProfile.mockReset();
    recommendationsApi.getTrending.mockReset();
    recommendationsApi.getLatest.mockReset();
    recommendationsApi.getTopRated.mockReset();

    recommendationsApi.getTrending.mockResolvedValue([]);
    recommendationsApi.getLatest.mockResolvedValue([]);
    recommendationsApi.getTopRated.mockResolvedValue([]);
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
});
