import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import LoginView from '@/views/LoginView.vue';
import SettingsView from '@/views/SettingsView.vue';
import AppLayout from '@/components/AppLayout.vue';

const {
  routeState,
  routerState,
  authStore,
  authApi,
  searchApi,
  setLocale,
} = vi.hoisted(() => {
  const session = {
    password: 'old-pass-123',
    profile: {
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      nickname: 'Demo',
      role: 'user',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      recommendationSettings: {
        preferredTypes: ['movie'],
        preferredGenres: ['科幻'],
        excludedGenres: [],
        preferredKeywords: ['沙丘'],
        freshnessBias: 'balanced',
      },
    },
  };

  const authStore = {
    token: '',
    user: null as any,
    isLoading: false,
    get isAuthenticated() {
      return !!this.token;
    },
    login: vi.fn(async (credentials: { identifier: string; password: string }) => {
      authStore.isLoading = true;
      try {
        if (credentials.identifier !== 'demo-user' && credentials.identifier !== 'demo@example.com') {
          return { success: false, error: '用户名或密码错误' };
        }
        if (credentials.password !== session.password) {
          return { success: false, error: '用户名或密码错误' };
        }

        authStore.token = 'demo-token';
        authStore.user = { ...session.profile };
        return { success: true };
      } finally {
        authStore.isLoading = false;
      }
    }),
    logout: vi.fn(() => {
      authStore.token = '';
      authStore.user = null;
    }),
    fetchUserProfile: vi.fn(async () => {
      authStore.user = { ...session.profile };
    }),
  };

  return {
    routeState: {
      path: '/login',
      params: {} as Record<string, string>,
      query: {} as Record<string, string>,
    },
    routerState: {
      push: vi.fn(),
      replace: vi.fn(),
    },
    authStore,
    authApi: {
      getProfile: vi.fn(async () => ({ ...session.profile })),
      updateProfile: vi.fn(async (payload: any) => {
        session.profile = {
          ...session.profile,
          ...payload,
        };
        return { ...session.profile };
      }),
      changePassword: vi.fn(async ({ newPassword }: { newPassword: string }) => {
        session.password = newPassword;
        return { success: true };
      }),
    },
    searchApi: {
      getHistory: vi.fn(async () => ['沙丘']),
    },
    setLocale: vi.fn(),
  };
});

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  RouterView: {
    template: '<div class="router-view-stub" />',
  },
  useRoute: () => routeState,
  useRouter: () => routerState,
  onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('@/api/auth', () => ({
  authApi,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

vi.mock('@/components/LoadingSpinner.vue', () => ({
  default: {
    props: ['text'],
    template: '<div class="loading-spinner">{{ text }}</div>',
  },
}));

vi.mock('@/components/InlineNotice.vue', () => ({
  default: {
    props: ['message', 'title'],
    template: '<div class="inline-notice-stub">{{ title }}{{ message }}</div>',
  },
}));

vi.mock('@/components/ui/ThemeToggle.vue', () => ({
  default: {
    template: '<div class="theme-toggle-stub" />',
  },
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
  setLocale,
  getCurrentLocale: () => 'zh-CN',
}));

vi.mock('@/composables/useModal', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
}));

const mountWithRouter = (component: any): VueWrapper =>
  mount(component, {
    global: {
      stubs: {
        RouterLink: true,
        RouterView: true,
        'router-link': true,
      },
    },
  });

describe('Auth profile journey regression', () => {
  beforeEach(() => {
    routeState.path = '/login';
    routeState.query = {};
    routeState.params = {};
    routerState.push.mockReset();
    routerState.replace.mockReset();
    authStore.token = '';
    authStore.user = null;
    authStore.isLoading = false;
    authStore.login.mockClear();
    authStore.logout.mockClear();
    authStore.fetchUserProfile.mockClear();
    authApi.getProfile.mockClear();
    authApi.updateProfile.mockClear();
    authApi.changePassword.mockClear();
    searchApi.getHistory.mockClear();
  });

  it('covers login, settings update, password change, logout, and login with the new password', async () => {
    routeState.query = { redirect: '/settings' };
    const loginWrapper = mountWithRouter(LoginView);

    const loginInputs = loginWrapper.findAll('input');
    await loginInputs[0].setValue('demo-user');
    await loginInputs[1].setValue('old-pass-123');
    await loginWrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(authStore.login).toHaveBeenCalledWith({ identifier: 'demo-user', password: 'old-pass-123' });
    expect(routerState.push).toHaveBeenCalledWith('/settings');

    const settingsWrapper = mountWithRouter(SettingsView);
    await flushPromises();

    const textInputs = settingsWrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('新昵称');

    const saveButton = settingsWrapper.findAll('button').find(button => button.text().includes('保存设置'));
    expect(saveButton).toBeTruthy();
    await saveButton!.trigger('click');
    await flushPromises();

    expect(authApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: '新昵称' }),
    );
    expect(authStore.user.nickname).toBe('新昵称');

    const passwordInputs = settingsWrapper.findAll('input[type="password"]');
    await passwordInputs[0].setValue('old-pass-123');
    await passwordInputs[1].setValue('new-pass-456');
    await passwordInputs[2].setValue('new-pass-456');

    const changePasswordButton = settingsWrapper
      .findAll('button')
      .find(button => button.text().includes('修改密码'));
    expect(changePasswordButton).toBeTruthy();
    await changePasswordButton!.trigger('click');
    await flushPromises();

    expect(authApi.changePassword).toHaveBeenCalledWith({
      oldPassword: 'old-pass-123',
      newPassword: 'new-pass-456',
    });

    routeState.path = '/';
    routeState.query = {};
    const appLayoutWrapper = mountWithRouter(AppLayout);
    await flushPromises();

    await appLayoutWrapper.get('.app-layout__user-menu').trigger('click');
    const logoutButton = appLayoutWrapper
      .findAll('button')
      .find(button => button.text().includes('common.logout'));
    expect(logoutButton).toBeTruthy();
    await logoutButton!.trigger('click');

    expect(authStore.logout).toHaveBeenCalled();
    expect(routerState.push).toHaveBeenCalledWith('/login');

    routeState.path = '/login';
    const reloginWrapper = mountWithRouter(LoginView);
    const reloginInputs = reloginWrapper.findAll('input');
    await reloginInputs[0].setValue('demo-user');
    await reloginInputs[1].setValue('new-pass-456');
    await reloginWrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(authStore.login).toHaveBeenCalledWith({ identifier: 'demo-user', password: 'new-pass-456' });
    expect(routerState.push).toHaveBeenCalledWith('/');
    expect(authStore.user.nickname).toBe('新昵称');
  });
});
