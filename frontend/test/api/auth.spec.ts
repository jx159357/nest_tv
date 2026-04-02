import { describe, expect, it, vi, beforeEach } from 'vitest';

const { apiGet, apiPost, apiPut } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock('@/api/index', () => ({
  default: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
  },
}));

import { authApi } from '@/api/auth';

describe('authApi', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
  });

  it('uses current user endpoints for profile and token validation', async () => {
    apiGet.mockResolvedValue({ id: 1, username: 'demo' });

    await authApi.getProfile();
    const validation = await authApi.validateToken();

    expect(apiGet).toHaveBeenNthCalledWith(1, '/users/profile', undefined, false);
    expect(apiGet).toHaveBeenNthCalledWith(2, '/users/profile', undefined, false);
    expect(validation).toEqual({
      valid: true,
      user: { id: 1, username: 'demo' },
    });
  });

  it('treats missing profile as invalid token and keeps logout local-only', async () => {
    apiGet.mockRejectedValue(new Error('401'));

    await expect(authApi.validateToken()).resolves.toEqual({
      valid: false,
      user: null,
    });
    await expect(authApi.logout()).resolves.toBeUndefined();

    expect(apiPost).not.toHaveBeenCalled();
  });
});
