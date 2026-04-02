import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import LoginView from '@/views/LoginView.vue';

const { routeState, routerPush, authStore } = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, string>,
  },
  routerPush: vi.fn(),
  authStore: {
    isLoading: false,
    login: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

describe('LoginView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerPush.mockReset();
    authStore.login.mockReset();
    authStore.isLoading = false;
  });

  it('redirects to the requested route after successful login', async () => {
    routeState.query = { redirect: '/settings' };
    authStore.login.mockResolvedValue({ success: true });

    const wrapper = mount(LoginView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('demo-user');
    await inputs[1].setValue('password-123');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(authStore.login).toHaveBeenCalledWith({
      identifier: 'demo-user',
      password: 'password-123',
    });
    expect(routerPush).toHaveBeenCalledWith('/settings');
  });

  it('shows the returned error message when login fails', async () => {
    authStore.login.mockResolvedValue({ success: false, error: '用户名或密码错误' });

    const wrapper = mount(LoginView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('demo-user');
    await inputs[1].setValue('wrong-password');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('用户名或密码错误');
    expect(routerPush).not.toHaveBeenCalled();
  });
});
