import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import SearchHistoryView from '@/views/SearchHistoryView.vue';

const { routerPush, searchApi } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  searchApi: {
    getHistory: vi.fn(),
    clearHistory: vi.fn(),
    getRelatedKeywords: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
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

vi.mock('@/components/EmptyState.vue', () => ({
  default: {
    props: ['title'],
    template: '<div class="empty-state">{{ title }}</div>',
  },
}));

describe('SearchHistoryView', () => {
  beforeEach(() => {
    routerPush.mockReset();
    searchApi.getHistory.mockReset();
    searchApi.clearHistory.mockReset();
    searchApi.getRelatedKeywords.mockReset();

    searchApi.getHistory.mockResolvedValue(['沙丘', '奥本海默']);
    searchApi.clearHistory.mockResolvedValue({ message: 'ok' });
    searchApi.getRelatedKeywords.mockResolvedValue(['沙丘2']);
  });

  it('loads history and related keywords on mount', async () => {
    const wrapper = mount(SearchHistoryView);
    await flushPromises();

    expect(wrapper.text()).toContain('沙丘');
    expect(wrapper.text()).toContain('沙丘2');
  });

  it('continues search from a history keyword', async () => {
    const wrapper = mount(SearchHistoryView);
    await flushPromises();

    const historyButton = wrapper.findAll('button').find(button => button.text().includes('奥本海默'));
    expect(historyButton).toBeTruthy();

    await historyButton!.trigger('click');
    await flushPromises();

    expect(searchApi.getRelatedKeywords).toHaveBeenCalledWith('奥本海默', 8);
  });

  it('clears search history on demand', async () => {
    const wrapper = mount(SearchHistoryView);
    await flushPromises();

    const clearButton = wrapper.findAll('button').find(button => button.text().includes('清空搜索历史'));
    expect(clearButton).toBeTruthy();

    await clearButton!.trigger('click');
    await flushPromises();

    expect(searchApi.clearHistory).toHaveBeenCalled();
    expect(wrapper.text()).toContain('搜索历史已清空');
  });
});
