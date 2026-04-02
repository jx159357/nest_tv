import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import WatchView from '@/views/WatchView.vue';

const { routeState, routerState, mediaStore, authStore, downloadsStore, watchHistoryApi } = vi.hoisted(
  () => ({
    routeState: {
      params: { id: '9' },
      query: { time: '128' } as Record<string, string>,
    },
    routerState: {
      push: vi.fn(),
    },
    mediaStore: {
      fetchMediaDetail: vi.fn(),
      incrementViewCount: vi.fn(),
      fetchFavoriteStatus: vi.fn(),
      toggleFavorite: vi.fn(),
    },
    authStore: {
      token: '',
    },
    downloadsStore: {
      enqueueTask: vi.fn(),
      startTask: vi.fn(),
    },
    watchHistoryApi: {
      recordProgress: vi.fn(),
    },
  }),
);

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => routeState,
  useRouter: () => routerState,
}));

vi.mock('@/stores/media', () => ({
  useMediaStore: () => mediaStore,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('@/stores/downloads', () => ({
  useDownloadsStore: () => downloadsStore,
}));

vi.mock('@/api/watchHistory', () => ({
  watchHistoryApi,
}));

vi.mock('@/components/DanmakuPlayer.vue', () => ({
  default: {
    template: '<div class="danmaku-player-stub" />',
  },
}));

describe('WatchView', () => {
  beforeEach(() => {
    routerState.push.mockReset();
    mediaStore.fetchMediaDetail.mockReset();
    mediaStore.incrementViewCount.mockReset();
    mediaStore.fetchFavoriteStatus.mockReset();
    mediaStore.toggleFavorite.mockReset();
    routeState.params = { id: '9' };
    routeState.query = { time: '128' };

    mediaStore.fetchMediaDetail.mockResolvedValue({
      id: 9,
      title: 'Demo Movie',
      description: 'Example description',
      duration: 3600,
      rating: 8.6,
      poster: '',
      genres: [],
      source: 'demo',
      playSources: [
        {
          id: 1,
          url: 'https://example.com/video.mp4',
          sourceName: 'Main Source',
          resolution: '1080p',
          format: 'mp4',
          type: 'online',
        },
      ],
    });
    mediaStore.incrementViewCount.mockResolvedValue(undefined);
    mediaStore.fetchFavoriteStatus.mockResolvedValue(false);
    mediaStore.toggleFavorite.mockResolvedValue(true);
  });

  it('applies the resume time from route query after metadata loads', async () => {
    const wrapper = mount(WatchView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const video = wrapper.get('video');
    Object.defineProperty(video.element, 'duration', {
      configurable: true,
      value: 3600,
    });
    video.element.currentTime = 0;

    await video.trigger('loadedmetadata');

    expect(video.element.currentTime).toBe(128);
  });

  it('renders safely when media rating is missing', async () => {
    mediaStore.fetchMediaDetail.mockResolvedValueOnce({
      id: 9,
      title: 'Demo Movie',
      description: 'Example description',
      duration: 3600,
      poster: '',
      genres: [],
      source: 'demo',
      playSources: [
        {
          id: 1,
          url: 'https://example.com/video.mp4',
          sourceName: 'Main Source',
          resolution: '1080p',
          format: 'mp4',
          type: 'online',
        },
      ],
    });

    const wrapper = mount(WatchView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Demo Movie');
  });

  it('toggles favorite state and shows feedback', async () => {
    authStore.token = 'demo-token';

    const wrapper = mount(WatchView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const favoriteButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('加入收藏'));

    expect(favoriteButton).toBeTruthy();

    await favoriteButton!.trigger('click');
    await flushPromises();

    expect(mediaStore.toggleFavorite).toHaveBeenCalledWith('9', false);
    expect(wrapper.text()).toContain('已将《Demo Movie》加入收藏');
  });
});

