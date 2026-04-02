import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import HomeView from '@/views/HomeView.vue';

const { routerPush, routeState, mediaStore, searchApi } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeState: {
    query: {} as Record<string, string>,
  },
  mediaStore: {
    fetchPopularMedia: vi.fn(),
    fetchLatestMedia: vi.fn(),
    fetchTopRatedMedia: vi.fn(),
    searchMedia: vi.fn(),
  },
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
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/stores/media', () => ({
  useMediaStore: () => mediaStore,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

vi.mock('@/components/MediaCard.vue', () => ({
  default: {
    props: ['media'],
    template: '<button class="media-card" @click="$emit(\'click\')">{{ media.title }}</button>',
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

describe('HomeView', () => {
  beforeEach(() => {
    routerPush.mockReset();
    routeState.query = {};
    mediaStore.fetchPopularMedia.mockReset();
    mediaStore.fetchLatestMedia.mockReset();
    mediaStore.fetchTopRatedMedia.mockReset();
    mediaStore.searchMedia.mockReset();
    searchApi.getSuggestions.mockReset();
    searchApi.getPopularKeywords.mockReset();
    searchApi.getHistory.mockReset();
    searchApi.clearHistory.mockReset();
    searchApi.getRelatedKeywords.mockReset();
    searchApi.recordHistory.mockReset();

    mediaStore.fetchPopularMedia.mockResolvedValue([]);
    mediaStore.fetchLatestMedia.mockResolvedValue([]);
    mediaStore.fetchTopRatedMedia.mockResolvedValue([]);
    mediaStore.searchMedia.mockResolvedValue({ data: [] });
    searchApi.getSuggestions.mockResolvedValue([]);
    searchApi.getPopularKeywords.mockResolvedValue([]);
    searchApi.getHistory.mockResolvedValue([]);
    searchApi.clearHistory.mockResolvedValue({ message: 'ok' });
    searchApi.getRelatedKeywords.mockResolvedValue([]);
    searchApi.recordHistory.mockResolvedValue({ success: true });
  });

  const mountView = () => mount(HomeView);

  it('loads home media lists on mount when there is no search query', async () => {
    mediaStore.fetchPopularMedia.mockResolvedValue([{ id: 1, title: '热门视频', rating: 8.8 }]);
    mediaStore.fetchLatestMedia.mockResolvedValue([{ id: 2, title: '最新视频', rating: 8.2 }]);
    mediaStore.fetchTopRatedMedia.mockResolvedValue([{ id: 3, title: '高评分视频', rating: 9.6 }]);

    const wrapper = mountView();
    await flushPromises();

    expect(mediaStore.fetchPopularMedia).toHaveBeenCalledWith(8);
    expect(mediaStore.fetchLatestMedia).toHaveBeenCalledWith(8);
    expect(mediaStore.fetchTopRatedMedia).toHaveBeenCalledWith(8);
    expect(wrapper.text()).toContain('热门视频');
    expect(wrapper.text()).toContain('最新视频');
    expect(wrapper.text()).toContain('高评分视频');
  });

  it('navigates to search when keyword is submitted', async () => {
    const wrapper = mountView();

    await wrapper.get('input[type="text"]').setValue('星际穿越');
    await wrapper.get('button').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      path: '/search',
      query: { q: '星际穿越' },
    });
    expect(searchApi.recordHistory).toHaveBeenCalledWith({ keyword: '星际穿越' });
  });

  it('navigates to media detail when a media card is clicked', async () => {
    mediaStore.fetchPopularMedia.mockResolvedValue([{ id: 42, title: '测试电影', rating: 8.5 }]);

    const wrapper = mountView();
    await flushPromises();

    await wrapper.get('.media-card').trigger('click');

    expect(routerPush).toHaveBeenCalledWith('/media/42');
  });

  it('loads search results when route query q is present', async () => {
    routeState.query = { q: '星际穿越' };
    mediaStore.searchMedia.mockResolvedValue({
      data: [{ id: 9, title: '星际穿越', rating: 9.1 }],
    });

    const wrapper = mountView();
    await flushPromises();

    expect(mediaStore.searchMedia).toHaveBeenCalledWith('星际穿越', { page: 1, limit: 12 });
    expect(wrapper.text()).toContain('搜索结果');
    expect(wrapper.text()).toContain('星际穿越');
  });

  it('shows remote search suggestions while typing', async () => {
    searchApi.getSuggestions.mockResolvedValue([
      { text: '星际迷航', type: 'title', count: 12 },
    ]);

    const wrapper = mountView();
    await flushPromises();

    const input = wrapper.get('input[type="text"]');
    await input.trigger('focus');
    await input.setValue('星际');
    await flushPromises();

    expect(searchApi.getSuggestions).toHaveBeenCalledWith('星际', 6);
    expect(wrapper.text()).toContain('星际迷航');
  });

  it('clears recent search history from the home search dropdown', async () => {
    searchApi.getHistory.mockResolvedValue(['沙丘']);

    const wrapper = mountView();
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
