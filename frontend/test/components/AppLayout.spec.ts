import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MainLayout from '@/layouts/MainLayout.vue';

const { authStore, routeState, routerPush } = vi.hoisted(() => ({
  authStore: {
    isAuthenticated: true,
    user: {
      username: 'demo-user',
      nickname: 'Demo User',
      avatar: '',
      role: 'user',
    },
    logout: vi.fn(),
  },
  routeState: {
    path: '/',
  },
  routerPush: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  RouterView: {
    template: '<div class="router-view-stub" />',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

describe('MainLayout', () => {
  beforeEach(() => {
    routeState.path = '/';
    routerPush.mockReset();
    authStore.logout.mockReset();
  });

  it('submits header search to the home query route', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });

    await wrapper.get('input[type="text"]').setValue('奥本海默');
    await wrapper.get('input[type="text"]').trigger('keyup.enter');
    await flushPromises();

    expect(routerPush).toHaveBeenCalledWith({
      path: '/',
      query: { q: '奥本海默' },
    });
  });

  it('logs out from the user dropdown', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });
    await flushPromises();

    await wrapper.get('.main-header__user-btn').trigger('click');
    await flushPromises();

    const logoutButton = wrapper.findAll('button').find(button => button.text().includes('退出登录'));

    expect(logoutButton).toBeTruthy();
    await logoutButton!.trigger('click');

    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith('/');
  });
});
