import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MainLayout from '@/layouts/MainLayout.vue';

const { authStore, routeState, routerPush } = vi.hoisted(() => ({
  authStore: {
    isAuthenticated: true,
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

describe('MainLayout navigation', () => {
  beforeEach(() => {
    authStore.logout.mockReset();
    routerPush.mockReset();
    routeState.path = '/';
  });

  it('logs out from the user menu', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });

    await wrapper.get('.main-header__user-btn').trigger('click');
    await flushPromises();

    const logoutButton = wrapper.findAll('button').find(button => button.text().includes('退出登录'));
    expect(logoutButton).toBeTruthy();
    await logoutButton!.trigger('click');

    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith('/');
  });
});
