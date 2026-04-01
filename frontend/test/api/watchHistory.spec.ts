import { describe, expect, it, vi } from 'vitest';

const { apiGet, apiPost, apiPatch, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    delete: apiDelete,
  },
}));

import { watchHistoryApi } from '@/api/watchHistory';

describe('watchHistoryApi', () => {
  it('disables client cache for user-specific watch-history reads', async () => {
    apiGet.mockResolvedValue(undefined);

    await watchHistoryApi.getMyWatchHistory({ page: 2 });
    await watchHistoryApi.getUserWatchHistory(1, { limit: 5 });
    await watchHistoryApi.getUserStats(1);
    await watchHistoryApi.getContinueWatching(1, { limit: 3 });
    await watchHistoryApi.getCompleted(1, { page: 2 });

    expect(apiGet).toHaveBeenNthCalledWith(1, '/watch-history/user/me', { params: { page: 2 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(2, '/watch-history/user/me', { params: { limit: 5 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(3, '/watch-history/user/me/stats', undefined, false);
    expect(apiGet).toHaveBeenNthCalledWith(
      4,
      '/watch-history/user/me/continue',
      { params: { limit: 3 } },
      false,
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      5,
      '/watch-history/user/me/completed',
      { params: { page: 2 } },
      false,
    );
  });
});
