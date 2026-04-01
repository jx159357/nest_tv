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

describe('admin download-task deep links', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getUsers.mockReset();
    adminApi.getMedia.mockReset();
  });

  it('links AdminUsersView rows into filtered admin download tasks', async () => {
    adminApi.getUsers.mockResolvedValue({
      data: [
        {
          id: 7,
          username: 'demo-user',
          nickname: 'Demo User',
          email: 'demo@example.com',
          role: 'user',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminUsersView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    await flushPromises();

    const link = wrapper.get('.router-link-stub');
    expect(link.text()).toContain('查看下载任务');
    expect(link.attributes('data-to')).toContain('admin-download-tasks');
    expect(link.attributes('data-to')).toContain('userId');
    expect(link.attributes('data-to')).toContain('7');
  });

  it('links AdminMediaView rows into filtered admin download tasks', async () => {
    adminApi.getMedia.mockResolvedValue({
      data: [
        {
          id: 12,
          title: 'Demo Movie',
          description: 'Example description',
          type: 'movie',
          quality: 'hd',
          rating: 8.6,
          viewCount: 320,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const wrapper = mount(AdminMediaView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    await flushPromises();

    const link = wrapper.get('.router-link-stub');
    expect(link.text()).toContain('查看下载任务');
    expect(link.attributes('data-to')).toContain('admin-download-tasks');
    expect(link.attributes('data-to')).toContain('mediaResourceId');
    expect(link.attributes('data-to')).toContain('12');
  });
});
