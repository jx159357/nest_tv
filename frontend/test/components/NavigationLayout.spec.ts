import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import NavigationLayout from '@/components/NavigationLayout.vue';

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
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush,
  }),
}));

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

describe('NavigationLayout', () => {
  beforeEach(() => {
    authStore.logout.mockReset();
    routerPush.mockReset();
    routeState.path = '/';
  });

  it('logs out from the mobile menu', async () => {
    const wrapper = mount(NavigationLayout, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
      slots: {
        default: '<div>content</div>',
      },
    });

    const menuButton = wrapper.findAll('button').find(button => !button.classes().includes('mobile-logout-button'));
    expect(menuButton).toBeTruthy();
    await menuButton!.trigger('click');
    await flushPromises();

    const logoutButton = wrapper.find('.mobile-logout-button');
    expect(logoutButton.exists()).toBe(true);
    await logoutButton.trigger('click');

    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith('/login');
  });
});
