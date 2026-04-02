import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AdminUsersView from '@/views/AdminUsersView.vue';
import AdminDownloadTasksView from '@/views/AdminDownloadTasksView.vue';
import AdminMediaView from '@/views/AdminMediaView.vue';

const { adminApi, routeState, routerReplace } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getDownloadTasks: vi.fn(),
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
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace,
  }),
}));

const mountAdminView = (component: any): VueWrapper =>
  mount(component, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });

describe('Admin operations journey regression', () => {
  beforeEach(() => {
    routeState.query = {};
    routerReplace.mockReset();
    adminApi.getUsers.mockReset();
    adminApi.getDownloadTasks.mockReset();
    adminApi.getMedia.mockReset();

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
    adminApi.getDownloadTasks.mockResolvedValue({
      data: [
        {
          id: 2,
          clientId: 'error-task',
          userId: 7,
          mediaResourceId: 12,
          url: 'https://example.com/error.mp4',
          type: 'magnet',
          status: 'error',
          progress: 20,
          speed: 0,
          downloaded: 20,
          total: 100,
          fileName: 'Error Task',
          error: 'network',
          lastLaunchedAt: new Date().toISOString(),
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('keeps investigation context flowing from user to task to media', async () => {
    const usersWrapper = mountAdminView(AdminUsersView);
    await flushPromises();

    const userLink = usersWrapper.get('.router-link-stub');
    expect(userLink.text()).toContain('查看下载任务');
    expect(userLink.attributes('data-to')).toContain('admin-download-tasks');
    expect(userLink.attributes('data-to')).toContain('userId');
    expect(userLink.attributes('data-to')).toContain('7');

    routeState.query = { userId: '7' };
    const tasksWrapper = mountAdminView(AdminDownloadTasksView);
    await flushPromises();

    expect(adminApi.getDownloadTasks).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      status: undefined,
      type: undefined,
      userId: 7,
      mediaResourceId: undefined,
    });

    await tasksWrapper.get('.task-detail-toggle').trigger('click');
    const taskLinks = tasksWrapper.findAll('.router-link-stub').map(link => link.attributes('data-to'));
    expect(taskLinks.some(link => link?.includes('Same media tasks') || false)).toBe(false);
    expect(taskLinks.some(link => link?.includes('mediaResourceId') && link.includes('12'))).toBe(true);

    routeState.query = { mediaResourceId: '12' };
    const mediaWrapper = mountAdminView(AdminMediaView);
    await flushPromises();

    const mediaLink = mediaWrapper.get('.router-link-stub');
    expect(mediaLink.text()).toContain('查看下载任务');
    expect(mediaLink.attributes('data-to')).toContain('admin-download-tasks');
    expect(mediaLink.attributes('data-to')).toContain('mediaResourceId');
    expect(mediaLink.attributes('data-to')).toContain('12');
  });
});
