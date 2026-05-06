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
    window.history.replaceState({}, '', '/torrent');

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
      category: undefined,
    });

    const resultButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('Demo Torrent'));
    expect(resultButton).toBeTruthy();
    await resultButton!.trigger('click');
    await flushPromises();

    expect(torrentApi.getInfo).toHaveBeenCalledWith('hash-demo');
    expect(torrentApi.getHealth).toHaveBeenCalledWith('hash-demo');
    expect(wrapper.text()).toContain('健康状态');

    const queueButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('加入下载任务'));
    expect(queueButton).toBeTruthy();
    await queueButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).toHaveBeenCalled();
    expect(wrapper.text()).toContain('已加入下载任务：Demo Torrent');
  });

  it('queues the selected magnet and attempts to launch the local client', async () => {
    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    await wrapper.get('input[type="text"]').setValue('Demo');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    const resultButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('Demo Torrent'));
    expect(resultButton).toBeTruthy();
    await resultButton!.trigger('click');
    await flushPromises();

    const launchButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('启动本地客户端'));
    expect(launchButton).toBeTruthy();

    await launchButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).toHaveBeenCalledWith({
      url: 'magnet:?xt=urn:btih:hash-demo',
      fileName: 'Demo Torrent',
      type: 'magnet',
      sourceLabel: '磁力资源页',
      mediaResourceId: 9,
      metadata: {
        title: 'Demo Torrent',
        description: 'InfoHash: hash-demo',
      },
    });
    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-1');
    expect(wrapper.text()).toContain('已加入下载任务并尝试启动本地客户端：Demo Torrent');
  });

  it('passes category to backend search and refreshes shelves when category changes', async () => {
    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const searchInput = wrapper.get('input[type="text"]');
    await searchInput.setValue('Demo');

    const categorySelect = wrapper.get('select');
    await categorySelect.setValue('movie');
    await flushPromises();

    expect(torrentApi.getPopular).toHaveBeenLastCalledWith({ limit: 8, category: 'movie' });
    expect(torrentApi.getLatest).toHaveBeenLastCalledWith({ limit: 8, category: 'movie' });
    expect(torrentApi.search).toHaveBeenLastCalledWith({
      keyword: 'Demo',
      page: 1,
      pageSize: 10,
      category: 'movie',
    });
  });

  it('hydrates keyword, category, and selected hash from the location url', async () => {
    window.history.replaceState({}, '', '/torrent?keyword=Demo&category=movie&hash=HASH-DEMO');

    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('Demo');
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('movie');
    expect(torrentApi.getPopular).toHaveBeenCalledWith({ limit: 8, category: 'movie' });
    expect(torrentApi.getLatest).toHaveBeenCalledWith({ limit: 8, category: 'movie' });
    expect(torrentApi.search).toHaveBeenCalledWith({
      keyword: 'Demo',
      page: 1,
      pageSize: 10,
      category: 'movie',
    });
    expect(torrentApi.getInfo).toHaveBeenCalledWith('hash-demo');
    expect(torrentApi.getHealth).toHaveBeenCalledWith('hash-demo');
    expect(window.location.search).toContain('hash=hash-demo');
  });

  it('writes keyword, category, and selected hash back into the location url', async () => {
    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    await wrapper.get('input[type="text"]').setValue('Demo');
    await wrapper.get('select').setValue('movie');
    await flushPromises();

    const resultButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('Demo Torrent'));
    expect(resultButton).toBeTruthy();
    await resultButton!.trigger('click');
    await flushPromises();

    expect(window.location.search).toContain('keyword=Demo');
    expect(window.location.search).toContain('category=movie');
    expect(window.location.search).toContain('hash=hash-demo');
  });

  it('passes the selected hash into download-task deep links', async () => {
    const routerLinkStub = {
      props: ['to'],
      template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
    };

    const wrapper = mount(TorrentView, {
      global: {
        stubs: {
          RouterLink: routerLinkStub,
          'router-link': routerLinkStub,
        },
      },
    });
    await flushPromises();

    await wrapper.get('input[type="text"]').setValue('Demo');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    const resultButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('Demo Torrent'));
    expect(resultButton).toBeTruthy();
    await resultButton!.trigger('click');
    await flushPromises();

    const downloadsLink = wrapper
      .findAll('.router-link-stub')
      .find(link => link.text().includes('查看下载任务'));

    expect(downloadsLink).toBeTruthy();
    expect(downloadsLink?.attributes('data-to')).toContain('"path":"/downloads"');
    expect(downloadsLink?.attributes('data-to')).toContain('"hash":"hash-demo"');
    expect(downloadsLink?.attributes('data-to')).toContain('"keyword":"Demo Torrent"');
  });

  it('shows a validation message when trying to parse an empty magnet uri', async () => {
    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const parseForm = wrapper.findAll('form')[1];
    expect(parseForm.exists()).toBe(true);

    await parseForm.trigger('submit.prevent');
    await flushPromises();

    expect(torrentApi.parseMagnet).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('请先输入 magnet 链接');
  });

  it('shows an inline error when magnet parsing fails', async () => {
    torrentApi.parseMagnet.mockRejectedValue(new Error('解析 magnet 链接失败'));

    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const magnetInput = wrapper.get('textarea[placeholder="magnet:?xt=urn:btih:..."]');
    await magnetInput.setValue('magnet:?xt=urn:btih:broken');

    const parseForm = wrapper.findAll('form')[1];
    await parseForm.trigger('submit.prevent');
    await flushPromises();

    expect(torrentApi.parseMagnet).toHaveBeenCalledWith('magnet:?xt=urn:btih:broken');
    expect(wrapper.text()).toContain('解析 magnet 链接失败');
  });
  it('queues a parsed magnet task after successful parsing', async () => {
    torrentApi.parseMagnet.mockResolvedValue({
      infoHash: 'parsed-hash',
      name: 'Parsed Magnet',
      announce: ['udp://tracker'],
      urlList: [],
      keywords: ['科幻'],
    });
    torrentApi.getInfo.mockResolvedValue({
      infoHash: 'parsed-hash',
      magnetUri: 'magnet:?xt=urn:btih:parsed-hash',
      name: 'Parsed Magnet',
      size: 1024,
      files: [],
      announce: ['udp://tracker'],
      urlList: [],
      keywords: ['科幻'],
      exactSources: [],
      relatedSourcesCount: 0,
      linkedMedia: [],
    });
    torrentApi.getHealth.mockResolvedValue({
      infoHash: 'parsed-hash',
      isHealthy: true,
      seeders: 8,
      leechers: 1,
      knownSources: 1,
      lastChecked: '2025-01-02T00:00:00.000Z',
    });
    downloadsStore.enqueueTask.mockReturnValue({ id: 'task-parsed', fileName: 'Parsed Magnet' });

    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    const magnetInput = wrapper.get('textarea[placeholder="magnet:?xt=urn:btih:..."]');
    await magnetInput.setValue('magnet:?xt=urn:btih:parsed-hash');

    const parseForm = wrapper.findAll('form')[1];
    await parseForm.trigger('submit.prevent');
    await flushPromises();

    const queueButtons = wrapper
      .findAll('button')
      .filter(button => button.text().includes('加入下载任务'));
    expect(queueButtons.length).toBeGreaterThan(0);

    await queueButtons[0].trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).toHaveBeenCalledWith({
      url: 'magnet:?xt=urn:btih:parsed-hash',
      fileName: 'Parsed Magnet',
      type: 'magnet',
      sourceLabel: '磁力解析',
      metadata: {
        title: 'Parsed Magnet',
        description: 'InfoHash: parsed-hash',
      },
    });
    expect(wrapper.text()).toContain('已加入下载任务：Parsed Magnet');
  });
  it('shows inline shelf errors when popular/latest requests fail', async () => {
    torrentApi.getPopular.mockRejectedValue(new Error('热门榜加载失败'));
    torrentApi.getLatest.mockRejectedValue(new Error('最新榜加载失败'));

    const wrapper = mount(TorrentView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('热门榜加载失败');
    expect(wrapper.text()).toContain('最新榜加载失败');
  });

  it('copies the selected infoHash through navigator.clipboard when the clipboard api exists', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(TorrentView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      await wrapper.get('input[type="text"]').setValue('Demo');
      await wrapper.get('form').trigger('submit.prevent');
      await flushPromises();

      const resultButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('Demo Torrent'));
      expect(resultButton).toBeTruthy();
      await resultButton!.trigger('click');
      await flushPromises();

      const copyHashButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制 Hash'));
      expect(copyHashButton).toBeTruthy();

      await copyHashButton!.trigger('click');
      await flushPromises();

      expect(writeText).toHaveBeenCalledWith('hash-demo');
      expect(execCommandMock).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('InfoHash 已复制到剪贴板。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
  it('shows failure feedback when copying the selected infoHash fails', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn(() => {
      throw new Error('copy failed');
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(TorrentView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      await wrapper.get('input[type="text"]').setValue('Demo');
      await wrapper.get('form').trigger('submit.prevent');
      await flushPromises();

      const resultButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('Demo Torrent'));
      expect(resultButton).toBeTruthy();
      await resultButton!.trigger('click');
      await flushPromises();

      const copyHashButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制 Hash'));
      expect(copyHashButton).toBeTruthy();

      await copyHashButton!.trigger('click');
      await flushPromises();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(wrapper.text()).toContain('复制失败，请手动处理');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
  it('prefers navigator.clipboard for magnet copy actions when the clipboard api exists', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(TorrentView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      await wrapper.get('input[type="text"]').setValue('Demo');
      await wrapper.get('form').trigger('submit.prevent');
      await flushPromises();

      const resultButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('Demo Torrent'));
      expect(resultButton).toBeTruthy();
      await resultButton!.trigger('click');
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制 Magnet'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(writeText).toHaveBeenCalledWith('magnet:?xt=urn:btih:hash-demo');
      expect(execCommandMock).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('Magnet 链接已复制到剪贴板。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
  it('falls back to execCommand copy for magnet actions when clipboard api is unavailable', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(TorrentView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      await wrapper.get('input[type="text"]').setValue('Demo');
      await wrapper.get('form').trigger('submit.prevent');
      await flushPromises();

      const resultButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('Demo Torrent'));
      expect(resultButton).toBeTruthy();
      await resultButton!.trigger('click');
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制 Magnet'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(wrapper.text()).toContain('Magnet 链接已复制到剪贴板。');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
  it('shows fallback copy failure feedback for magnet actions and still cleans temporary nodes', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn(() => {
      throw new Error('copy failed');
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(TorrentView, {
        global: {
          stubs: { RouterLink: true, 'router-link': true },
        },
      });
      await flushPromises();

      await wrapper.get('input[type="text"]').setValue('Demo');
      await wrapper.get('form').trigger('submit.prevent');
      await flushPromises();

      const resultButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('Demo Torrent'));
      expect(resultButton).toBeTruthy();
      await resultButton!.trigger('click');
      await flushPromises();

      const copyButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('复制 Magnet'));
      expect(copyButton).toBeTruthy();

      await copyButton!.trigger('click');
      await flushPromises();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(wrapper.text()).toContain('复制失败，请手动处理');
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
      }

      if (originalExecCommand) {
        Object.defineProperty(document, 'execCommand', {
          value: originalExecCommand,
          configurable: true,
        });
      } else {
        delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
      }
    }
  });
});
