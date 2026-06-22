import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import WatchView from '@/views/WatchView.vue';

const { routeState, routerState, mediaStore, mediaApi, authStore, downloadsStore, watchHistoryApi } =
  vi.hoisted(() => ({
    routeState: {
      params: { id: '9' },
      query: { time: '128' } as Record<string, string>,
    },
    routerState: {
      push: vi.fn(),
    },
    mediaStore: {
      incrementViewCount: vi.fn(),
      fetchFavoriteStatus: vi.fn(),
      toggleFavorite: vi.fn(),
    },
    mediaApi: {
      getPlayDetail: vi.fn(),
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
  }));

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

vi.mock('@/api/media', () => ({
  mediaApi,
}));

vi.mock('@/api/playSource', () => ({
  playSourceApi: {
    refreshPlaySource: vi.fn().mockResolvedValue({ refreshed: false }),
    resolveFromCms: vi.fn().mockResolvedValue({ episodes: [] }),
    refreshMediaPlaySources: vi.fn().mockResolvedValue({ best: null, valid: [], refreshed: 0 }),
    createPlaySource: vi.fn(),
  },
}));

vi.mock('@/components/ArtPlayerWrapper.vue', () => ({
  default: {
    props: ['src', 'title', 'poster', 'autoplay', 'currentTime'],
    emits: ['ready', 'timeupdate', 'play', 'pause', 'seeked', 'ended', 'error'],
    template:
      '<div class="art-player-wrapper-stub" :data-src="src" :data-current-time="currentTime" />',
  },
}));

vi.mock('@/components/DanmakuPlayer.vue', () => ({
  default: {
    props: ['videoId', 'mediaResourceId'],
    template:
      '<div class="danmaku-player-stub" :data-video-id="videoId" :data-media-resource-id="mediaResourceId" />',
  },
}));

vi.mock('@/components/WatchRoom.vue', () => ({
  default: {
    props: ['mediaId', 'mediaTitle'],
    template: '<div class="watch-room-stub" />',
  },
}));

vi.mock('@/components/PlayerGestureControl.vue', () => ({
  default: {
    props: ['videoElement', 'enabled'],
    template: '<div class="player-gesture-control-stub" />',
  },
}));

describe('WatchView', () => {
  beforeEach(() => {
    routerState.push.mockReset();
    mediaApi.getPlayDetail.mockReset();
    mediaStore.incrementViewCount.mockReset();
    mediaStore.fetchFavoriteStatus.mockReset();
    mediaStore.toggleFavorite.mockReset();
    routeState.params = { id: '9' };
    routeState.query = { time: '128' };

    mediaApi.getPlayDetail.mockResolvedValue({
      id: 9,
      title: 'Demo Movie',
      description: 'Example description',
      rating: 8.6,
      poster: '',
      genres: [],
      sourceGroups: [
        {
          name: 'Main Source',
          episodes: [
            {
              id: 1,
              url: 'https://example.com/video.mp4',
              name: '播放',
              resolution: '1080p',
              format: 'mp4',
              status: 'active',
              isAds: false,
            },
          ],
        },
      ],
      sourceFreshness: 'fresh',
      downloadUrls: [],
      watchHistory: {
        currentTime: 128,
        duration: 3600,
      },
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

    const player = wrapper.get('.art-player-wrapper-stub');
    expect(player.attributes('data-current-time')).toBe('128');
  });

  it('renders safely when media rating is missing', async () => {
    mediaApi.getPlayDetail.mockResolvedValueOnce({
      id: 9,
      title: 'Demo Movie',
      description: 'Example description',
      poster: '',
      genres: [],
      sourceGroups: [
        {
          name: 'Main Source',
          episodes: [
            {
              id: 1,
              url: 'https://example.com/video.mp4',
              name: '播放',
              resolution: '1080p',
              format: 'mp4',
              status: 'active',
              isAds: false,
            },
          ],
        },
      ],
      sourceFreshness: 'fresh',
      downloadUrls: [],
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

  it('passes the media resource id into DanmakuPlayer', async () => {
    const wrapper = mount(WatchView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const danmakuPlayer = wrapper.get('.danmaku-player-stub');
    expect(danmakuPlayer.attributes('data-video-id')).toBe('9');
    expect(danmakuPlayer.attributes('data-media-resource-id')).toBe('9');
  });

  it('switches to the next available source after a player error', async () => {
    mediaApi.getPlayDetail.mockResolvedValueOnce({
      id: 9,
      title: 'Demo Movie',
      description: 'Example description',
      rating: 8.6,
      poster: '',
      genres: [],
      sourceGroups: [
        {
          name: 'Broken Source',
          episodes: [
            {
              id: 1,
              url: 'https://example.com/broken.m3u8',
              name: '播放',
              resolution: '1080p',
              format: 'm3u8',
              status: 'active',
              isAds: false,
            },
          ],
        },
        {
          name: 'Backup Source',
          episodes: [
            {
              id: 2,
              url: 'https://example.com/backup.m3u8',
              name: '播放',
              resolution: '1080p',
              format: 'm3u8',
              status: 'active',
              isAds: false,
            },
          ],
        },
      ],
      sourceFreshness: 'fresh',
      downloadUrls: [],
    });

    const wrapper = mount(WatchView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.get('.art-player-wrapper-stub').attributes('data-src')).toBe(
      'https://example.com/broken.m3u8',
    );

    await wrapper.getComponent({ name: 'ArtPlayerWrapper' }).vm.$emit('error', 'HLS 404');
    await flushPromises();

    expect(wrapper.get('.art-player-wrapper-stub').attributes('data-src')).toBe(
      'https://example.com/backup.m3u8',
    );
    expect(wrapper.text()).toContain('当前：Backup Source');
  });
});
