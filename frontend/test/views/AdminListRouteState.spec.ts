import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminMediaView from '@/views/AdminMediaView.vue';
import AdminUsersView from '@/views/AdminUsersView.vue';

const { adminApi, routeState, routerReplace } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getMedia: vi.fn(),
  },
  routeState: {
    query: {} as Record<string, string>,
  },
  routerReplace: vi.fn(),
}));

vi.mock('@/api/admin', () => ({
  adminApi,
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace,
  }),
}));

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
};

describe('admin list route state', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getUsers.mockReset();
    adminApi.getMedia.mockReset();
  });

  it('loads AdminUsersView using route query filters', async () => {
    routeState.query = {
      page: '2',
      search: 'demo',
    };
    adminApi.getUsers.mockResolvedValue({
      data: [],
      total: 2,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    mount(AdminUsersView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(adminApi.getUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'demo',
    });
  });

  it('normalizes AdminUsersView route when backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '4',
      search: 'demo',
    };
    adminApi.getUsers.mockResolvedValue({
      data: [],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminUsersView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-users',
      query: { search: 'demo' },
    });
  });

  it('loads AdminMediaView using route query filters', async () => {
    routeState.query = {
      page: '2',
      type: 'movie',
      search: 'hero',
    };
    adminApi.getMedia.mockResolvedValue({
      data: [],
      total: 2,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    mount(AdminMediaView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(adminApi.getMedia).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      type: 'movie',
      search: 'hero',
    });
  });

  it('normalizes AdminMediaView route when backend clamps an out-of-range page', async () => {
    routeState.query = {
      page: '4',
      type: 'movie',
    };
    adminApi.getMedia.mockResolvedValue({
      data: [],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mount(AdminMediaView, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    await flushPromises();

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'admin-media',
      query: { type: 'movie' },
    });
  });
});
