import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import TorrentView from '@/views/TorrentView.vue';

const { torrentApi, downloadsStore } = vi.hoisted(() => ({
  torrentApi: {
    search: vi.fn(),
    getPopular: vi.fn(),
    getLatest: vi.fn(),
    getInfo: vi.fn(),
    getHealth: vi.fn(),
    parseMagnet: vi.fn(),
  },
  downloadsStore: {
    enqueueTask: vi.fn(),
    startTask: vi.fn(),
  },
}));

vi.mock('@/api/torrent', () => ({
  torrentApi,
}));

vi.mock('@/stores/downloads', () => ({
  useDownloadsStore: () => downloadsStore,
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
}));

describe('TorrentView', () => {
  beforeEach(() => {
    torrentApi.search.mockReset();
    torrentApi.getPopular.mockReset();
    torrentApi.getLatest.mockReset();
    torrentApi.getInfo.mockReset();
    torrentApi.getHealth.mockReset();
    torrentApi.parseMagnet.mockReset();
    downloadsStore.enqueueTask.mockReset();
    downloadsStore.startTask.mockReset();

    torrentApi.getPopular.mockResolvedValue([
      {
        infoHash: 'hash-popular',
        name: 'Popular Torrent',
        size: 1024,
        seeders: 20,
        leechers: 5,
        added: '2025-01-01T00:00:00.000Z',
        category: 'movie',
        mediaResourceId: 9,
      },
    ]);
    torrentApi.getLatest.mockResolvedValue([]);
    torrentApi.search.mockResolvedValue({
      data: [
        {
          infoHash: 'hash-demo',
          name: 'Demo Torrent',
          size: 2048,
          seeders: 10,
          leechers: 2,
          added: '2025-01-01T00:00:00.000Z',
          category: 'movie',
          mediaResourceId: 9,
          mediaTitle: 'Demo Movie',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    torrentApi.getInfo.mockResolvedValue({
      infoHash: 'hash-demo',
      magnetUri: 'magnet:?xt=urn:btih:hash-demo',
      name: 'Demo Torrent',
      size: 2048,
      files: [{ name: 'demo.mkv', size: 2048 }],
      announce: ['udp://tracker'],
      urlList: [],
      keywords: ['沙丘'],
      exactSources: [],
      relatedSourcesCount: 1,
      linkedMedia: [{ id: 9, title: 'Demo Movie', type: 'movie' }],
    });
    torrentApi.getHealth.mockResolvedValue({
      infoHash: 'hash-demo',
      isHealthy: true,
      seeders: 10,
      leechers: 2,
      knownSources: 1,
      lastChecked: '2025-01-02T00:00:00.000Z',
    });
    downloadsStore.enqueueTask.mockReturnValue({ id: 'task-1', fileName: 'Demo Torrent' });
  });

  it('loads rankings, searches torrents, and queues a selected task', async () => {
    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(torrentApi.getPopular).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Popular Torrent');

    const searchInput = wrapper.get('input[type="text"]');
    await searchInput.setValue('Demo');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(torrentApi.search).toHaveBeenCalledWith({
      keyword: 'Demo',
      page: 1,
      pageSize: 10,
    });

    const resultButton = wrapper.findAll('button').find(button => button.text().includes('Demo Torrent'));
    expect(resultButton).toBeTruthy();
    await resultButton!.trigger('click');
    await flushPromises();

    expect(torrentApi.getInfo).toHaveBeenCalledWith('hash-demo');
    expect(torrentApi.getHealth).toHaveBeenCalledWith('hash-demo');
    expect(wrapper.text()).toContain('健康状态');

    const queueButton = wrapper.findAll('button').find(button => button.text().includes('加入下载任务'));
    expect(queueButton).toBeTruthy();
    await queueButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已加入下载任务：Demo Torrent');
  });
});
