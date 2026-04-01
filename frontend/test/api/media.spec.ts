import { describe, expect, it, vi } from 'vitest';

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { mediaApi } from '@/api/media';

describe('mediaApi', () => {
  it('disables client cache for user-specific media reads', async () => {
    apiGet.mockResolvedValue(undefined);

    await mediaApi.getFavorites({ limit: 20 });
    await mediaApi.getWatchHistory({ page: 2 });

    expect(apiGet).toHaveBeenNthCalledWith(1, '/media/favorites', { params: { limit: 20 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(2, '/watch-history', { params: { page: 2 } }, false);
  });

  it('keeps public media shelves cacheable', async () => {
    apiGet.mockResolvedValue(undefined);

    await mediaApi.getPopularMedia(6);
    await mediaApi.getLatestMedia(6);

    expect(apiGet).toHaveBeenNthCalledWith(1, '/media/popular', { params: { limit: 6 } });
    expect(apiGet).toHaveBeenNthCalledWith(2, '/media/latest', { params: { limit: 6 } });
  });
});
