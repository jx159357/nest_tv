import { describe, expect, it, vi } from 'vitest';

const { apiGet, apiPost, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
    post: apiPost,
    delete: apiDelete,
  },
}));

import { searchApi } from '@/api/search';

describe('searchApi', () => {
  it('disables client cache for personalized search endpoints', async () => {
    apiGet.mockResolvedValue(undefined);
    apiPost.mockResolvedValue(undefined);

    await searchApi.getSuggestions('星际', 6);
    await searchApi.getPopularKeywords(5);
    await searchApi.getHistory(4);
    await searchApi.getRelatedKeywords('星际', 3);
    await searchApi.recordHistory({ keyword: '奥本海默' });
    await searchApi.clearHistory();

    expect(apiGet).toHaveBeenNthCalledWith(1, '/search/suggestions', { params: { keyword: '星际', limit: 6 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(2, '/search/popular-keywords', { params: { limit: 5 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(3, '/search/history', { params: { limit: 4 } }, false);
    expect(apiGet).toHaveBeenNthCalledWith(
      4,
      '/search/related-keywords/%E6%98%9F%E9%99%85',
      { params: { limit: 3 } },
      false,
    );
    expect(apiPost).toHaveBeenCalledWith('/search/history', { keyword: '奥本海默' });
    expect(apiDelete).toHaveBeenCalledWith('/search/history');
  });
});
