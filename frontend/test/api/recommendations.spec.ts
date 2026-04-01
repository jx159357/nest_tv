import { describe, expect, it, vi } from 'vitest';

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
  },
}));

import { recommendationsApi } from '@/api/recommendations';

describe('recommendationsApi', () => {
  it('disables client cache for user-specific recommendation endpoints', async () => {
    apiGet.mockResolvedValue(undefined);

    await recommendationsApi.getPersonalized(6);
    await recommendationsApi.getPersonalizedDetailed(5);
    await recommendationsApi.getProfile();

    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/recommendations/personalized',
      { params: { limit: 6 } },
      false,
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/recommendations/personalized-detailed',
      { params: { limit: 5 } },
      false,
    );
    expect(apiGet).toHaveBeenNthCalledWith(3, '/recommendations/profile', undefined, false);
  });

  it('keeps public recommendation shelves cacheable', async () => {
    apiGet.mockResolvedValue(undefined);

    await recommendationsApi.getTrending(4);
    await recommendationsApi.getLatest(4);
    await recommendationsApi.getTopRated(4);

    expect(apiGet).toHaveBeenNthCalledWith(1, '/recommendations/trending', { params: { limit: 4 } });
    expect(apiGet).toHaveBeenNthCalledWith(2, '/recommendations/latest', { params: { limit: 4 } });
    expect(apiGet).toHaveBeenNthCalledWith(3, '/recommendations/top-rated', { params: { limit: 4 } });
  });
});
