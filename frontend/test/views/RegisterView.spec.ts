import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RegisterView from '@/views/RegisterView.vue';

const { routerPush, authStore } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  authStore: {
    isLoading: false,
    register: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

describe('RegisterView', () => {
  beforeEach(() => {
    routerPush.mockReset();
    authStore.register.mockReset();
    authStore.isLoading = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an error when passwords do not match', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('demo-user');
    await inputs[1].setValue('demo@example.com');
    await inputs[2].setValue('password-123');
    await inputs[3].setValue('password-456');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('两次输入的密码不一致');
    expect(authStore.register).not.toHaveBeenCalled();
  });

  it('redirects to login after successful registration', async () => {
    authStore.register.mockResolvedValue({ success: true, data: {} });

    const wrapper = mount(RegisterView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('demo-user');
    await inputs[1].setValue('demo@example.com');
    await inputs[2].setValue('password-123');
    await inputs[3].setValue('password-123');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(authStore.register).toHaveBeenCalledWith({
      username: 'demo-user',
      email: 'demo@example.com',
      password: 'password-123',
    });
    expect(wrapper.text()).toContain('注册成功');

    vi.advanceTimersByTime(1200);
    await flushPromises();

    expect(routerPush).toHaveBeenCalledWith('/login');
  });
});
