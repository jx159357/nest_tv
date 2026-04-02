import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import FavoritesView from '@/views/FavoritesView.vue';

const { routeState, routerState, mediaStore, mediaApi } = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, string>,
  },
  routerState: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  mediaStore: {
    fetchFavorites: vi.fn(),
  },
  mediaApi: {
    getMediaById: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => routerState,
}));

vi.mock('@/stores/media', () => ({
  useMediaStore: () => mediaStore,
}));

vi.mock('@/api/media', () => ({
  mediaApi,
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

describe('FavoritesView', () => {
  beforeEach(() => {
    routeState.query = {};
    routerState.push.mockReset();
    routerState.replace.mockReset();
    mediaStore.fetchFavorites.mockReset();
    mediaApi.getMediaById.mockReset();
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [],
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    });
    mediaApi.getMediaById.mockResolvedValue({ id: 99, title: 'Pinned Favorite', rating: 8.9 });
  });

  it('loads favorites using the route page query', async () => {
    routeState.query = { page: '2' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 7, title: 'Favorite Movie', rating: 8.4 }],
      page: 2,
      limit: 12,
      total: 13,
      totalPages: 2,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    expect(mediaStore.fetchFavorites).toHaveBeenCalledWith({ page: 2, limit: 12 });
    expect(wrapper.text()).toContain('Favorite Movie');
  });

  it('normalizes the route when the backend clamps an out-of-range page', async () => {
    routeState.query = { page: '4' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    mount(FavoritesView);
    await flushPromises();

    expect(routerState.replace).toHaveBeenCalledWith({
      name: 'favorites',
      query: {},
    });
  });

  it('navigates to media detail when a favorite card is clicked', async () => {
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: 'Favorite Movie', rating: 8.6 }],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    await wrapper.get('.media-card').trigger('click');

    expect(routerState.push).toHaveBeenCalledWith('/media/9');
  });

  it('highlights the matching favorite when highlight query points to the current page', async () => {
    routeState.query = { highlight: '9' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: 'Favorite Movie', rating: 8.6 }],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    expect(wrapper.get('[data-testid="favorite-highlighted"]').text()).toContain('Favorite Movie');
    expect(wrapper.get('[data-testid="highlighted-favorite-banner"]').text()).toContain('高亮显示');
    expect(mediaApi.getMediaById).not.toHaveBeenCalled();
  });

  it('pins the highlighted favorite when it is outside the current page', async () => {
    routeState.query = { highlight: '99' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: 'Favorite Movie', rating: 8.6 }],
      page: 1,
      limit: 12,
      total: 20,
      totalPages: 2,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    expect(mediaApi.getMediaById).toHaveBeenCalledWith('99');
    expect(wrapper.get('[data-testid="highlighted-favorite-pinned"]').text()).toContain('Pinned Favorite');
  });

  it('clears the highlight after the one-time banner is dismissed', async () => {
    routeState.query = { highlight: '9' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: 'Favorite Movie', rating: 8.6 }],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    await wrapper.get('[data-testid="dismiss-highlight"]').trigger('click');

    expect(routerState.replace).toHaveBeenCalledWith({
      name: 'favorites',
      query: {},
    });
  });

  it('drops the highlight query when paginating away from the landing state', async () => {
    routeState.query = { highlight: '9' };
    mediaStore.fetchFavorites.mockResolvedValue({
      data: [{ id: 9, title: 'Favorite Movie', rating: 8.6 }],
      page: 1,
      limit: 12,
      total: 24,
      totalPages: 2,
    });

    const wrapper = mount(FavoritesView);
    await flushPromises();

    const nextPageButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('下一页'));

    expect(nextPageButton).toBeTruthy();

    await nextPageButton!.trigger('click');

    expect(routerState.replace).toHaveBeenLastCalledWith({
      name: 'favorites',
      query: { page: '2' },
    });
  });
});
