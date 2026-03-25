import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import HomeView from '@/views/HomeView.vue';

const { routerPush, mediaStore } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  mediaStore: {
    fetchPopularMedia: vi.fn(),
    fetchLatestMedia: vi.fn(),
    fetchTopRatedMedia: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/stores/media', () => ({
  useMediaStore: () => mediaStore,
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
    mediaStore.fetchPopularMedia.mockReset();
    mediaStore.fetchLatestMedia.mockReset();
    mediaStore.fetchTopRatedMedia.mockReset();

    mediaStore.fetchPopularMedia.mockResolvedValue([]);
    mediaStore.fetchLatestMedia.mockResolvedValue([]);
    mediaStore.fetchTopRatedMedia.mockResolvedValue([]);
  });

  const mountView = () =>
    mount(HomeView, {
      global: {},
    });

  it('loads home media lists on mount', async () => {
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
  });

  it('navigates to media detail when a media card is clicked', async () => {
    mediaStore.fetchPopularMedia.mockResolvedValue([{ id: 42, title: '测试电影', rating: 8.5 }]);

    const wrapper = mountView();
    await flushPromises();

    await wrapper.get('.media-card').trigger('click');

    expect(routerPush).toHaveBeenCalledWith('/media/42');
  });
});
