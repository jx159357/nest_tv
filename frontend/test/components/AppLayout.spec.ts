import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AppLayout from '@/components/AppLayout.vue';

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
    query: {} as Record<string, string>,
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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/i18n', () => ({
  availableLocales: [
    { code: 'zh-CN', name: '简体中文', flag: 'CN' },
    { code: 'en', name: 'English', flag: 'EN' },
  ],
  setLocale: vi.fn(),
  getCurrentLocale: () => 'zh-CN',
}));

vi.mock('@/components/ui/ThemeToggle.vue', () => ({
  default: {
    template: '<div class="theme-toggle-stub" />',
  },
}));

describe('AppLayout', () => {
  beforeEach(() => {
    routeState.path = '/';
    routeState.query = {};
    routerPush.mockReset();
    authStore.logout.mockReset();
  });

  it('syncs the header search input from the route query', async () => {
    routeState.query = { q: '星际穿越' };

    const wrapper = mount(AppLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });
    await flushPromises();

    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('星际穿越');
  });
});
