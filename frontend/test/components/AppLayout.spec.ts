import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AppLayout from '@/components/AppLayout.vue';

const { authStore, routeState, routerPush, searchApi } = vi.hoisted(() => ({
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
  searchApi: {
    getSuggestions: vi.fn(),
    getPopularKeywords: vi.fn(),
    getHistory: vi.fn(),
    clearHistory: vi.fn(),
    getRelatedKeywords: vi.fn(),
    recordHistory: vi.fn(),
  },
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

vi.mock('@/api/search', () => ({
  searchApi,
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
    searchApi.getSuggestions.mockReset();
    searchApi.getPopularKeywords.mockReset();
    searchApi.getHistory.mockReset();
    searchApi.clearHistory.mockReset();
    searchApi.getRelatedKeywords.mockReset();
    searchApi.recordHistory.mockReset();
    searchApi.getPopularKeywords.mockResolvedValue([]);
    searchApi.getSuggestions.mockResolvedValue([]);
    searchApi.getHistory.mockResolvedValue([]);
    searchApi.clearHistory.mockResolvedValue({ message: 'ok' });
    searchApi.getRelatedKeywords.mockResolvedValue([]);
    searchApi.recordHistory.mockResolvedValue({ success: true });
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

  it('shows recent search suggestions and navigates when one is selected', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['星际穿越']));

    const wrapper = mount(AppLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });
    await flushPromises();

    await wrapper.get('input[type="text"]').trigger('focus');
    await flushPromises();

    expect(wrapper.text()).toContain('星际穿越');

    const suggestionButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('星际穿越'));

    expect(suggestionButton).toBeTruthy();

    await suggestionButton!.trigger('mousedown');

    expect(routerPush).toHaveBeenCalledWith({
      path: '/search',
      query: { q: '星际穿越' },
    });
  });

  it('records search history when submitting a search', async () => {
    const wrapper = mount(AppLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });

    await wrapper.get('input[type="text"]').setValue('奥本海默');
    await wrapper.get('.app-layout__search-button').trigger('click');

    expect(searchApi.recordHistory).toHaveBeenCalledWith({ keyword: '奥本海默' });
  });

  it('clears recent search history from the dropdown', async () => {
    searchApi.getHistory.mockResolvedValue(['沙丘']);

    const wrapper = mount(AppLayout, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
      },
    });
    await flushPromises();

    await wrapper.get('input[type="text"]').trigger('focus');
    await flushPromises();

    const clearButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('清空'));

    expect(clearButton).toBeTruthy();

    await clearButton!.trigger('mousedown');

    expect(searchApi.clearHistory).toHaveBeenCalled();
  });
});
