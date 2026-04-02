import { describe, expect, it, vi, beforeEach } from 'vitest';

const { apiGet, apiPost, apiPut, apiPatch, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
  },
}));

import { playSourceApi } from '@/api/playSource';

describe('playSourceApi', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiPatch.mockReset();
    apiDelete.mockReset();
  });

  it('uses current play-source endpoints', async () => {
    apiGet.mockResolvedValue(undefined);
    apiPatch.mockResolvedValue(undefined);

    await playSourceApi.getPlaySources({ pageSize: 10 });
    await playSourceApi.getMediaPlaySources('12');
    await playSourceApi.getPlaySourcesByMediaId('12');
    await playSourceApi.getBestPlaySource('12');
    await playSourceApi.testPlaySource('99');

    expect(apiGet).toHaveBeenNthCalledWith(1, '/play-sources', { params: { pageSize: 10 } });
    expect(apiGet).toHaveBeenNthCalledWith(2, '/play-sources/media/12');
    expect(apiGet).toHaveBeenNthCalledWith(3, '/play-sources/media/12');
    expect(apiGet).toHaveBeenNthCalledWith(4, '/play-sources/media/12/best');
    expect(apiPatch).toHaveBeenCalledWith('/play-sources/99/validate');
  });
});
