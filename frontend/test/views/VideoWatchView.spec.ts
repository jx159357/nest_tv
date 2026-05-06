import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import VideoWatchView from '@/views/VideoWatchView.vue';

const {
  routeState,
  routerState,
  authStore,
  downloadsStore,
  mediaApi,
  playSourceApi,
  notifySuccess,
  notifyError,
  showConfirm,
} = vi.hoisted(() => ({
  routeState: {
    params: { id: '9' },
  },
  routerState: {
    push: vi.fn(),
    back: vi.fn(),
  },
  authStore: {
    isAuthenticated: true,
  },
  downloadsStore: {
    enqueueTask: vi.fn(),
    startTask: vi.fn(),
  },
  mediaApi: {
    getMediaById: vi.fn(),
    toggleFavorite: vi.fn(),
  },
  playSourceApi: {
    getPlaySourcesByMediaId: vi.fn(),
  },
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  showConfirm: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => routerState,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('@/stores/downloads', () => ({
  useDownloadsStore: () => downloadsStore,
}));

vi.mock('@/api', () => ({
  mediaApi,
  playSourceApi,
}));

vi.mock('@/composables/useModal', () => ({
  notifySuccess,
  notifyError,
  showConfirm,
}));

vi.mock('@/components/ui/VideoPlayer.vue', () => ({
  default: {
    name: 'VideoPlayerStub',
    props: [
      'src',
      'poster',
      'autoplay',
      'showControls',
      'showDanmaku',
      'isPreviewMode',
      'previewDuration',
    ],
    template: '<div class="video-player-stub" />',
  },
}));

vi.mock('@/components/ui/LocalVideoUpload.vue', () => ({
  default: {
    name: 'LocalVideoUploadStub',
    template: '<div class="local-video-upload-stub" />',
  },
}));

describe('VideoWatchView', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalExecCommand = document.execCommand;
  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');

  const restoreClipboard = () => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
      return;
    }

    delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
  };

  const restoreExecCommand = () => {
    if (originalExecCommand) {
      Object.defineProperty(document, 'execCommand', {
        value: originalExecCommand,
        configurable: true,
      });
      return;
    }

    delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
  };

  const restoreShare = () => {
    if (originalShare) {
      Object.defineProperty(navigator, 'share', originalShare);
      return;
    }

    delete (navigator as Navigator & { share?: Navigator['share'] }).share;
  };

  beforeEach(() => {
    window.history.replaceState({}, '', '/video/9');

    routeState.params = { id: '9' };
    routerState.push.mockReset();
    routerState.back.mockReset();
    downloadsStore.enqueueTask.mockReset();
    downloadsStore.startTask.mockReset();
    mediaApi.getMediaById.mockReset();
    mediaApi.toggleFavorite.mockReset();
    playSourceApi.getPlaySourcesByMediaId.mockReset();
    notifySuccess.mockReset();
    notifyError.mockReset();
    showConfirm.mockReset();

    mediaApi.getMediaById.mockResolvedValue({
      id: 9,
      title: 'Demo Video',
      description: 'Example description',
      poster: '',
      source: 'demo',
      duration: 3600,
      downloadUrls: ['https://example.com/download.mp4'],
    });
    playSourceApi.getPlaySourcesByMediaId.mockResolvedValue([
      {
        id: 1,
        name: '主线路',
        url: 'https://example.com/watch.mp4',
        sourceName: '主线路',
        type: 'online',
        downloadUrls: ['https://example.com/download.mp4'],
      },
    ]);
  });

  afterEach(() => {
    restoreClipboard();
    restoreExecCommand();
    restoreShare();
    document.body.innerHTML = '';
  });

  it('prefers navigator.share when the native share api exists', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const shareButton = wrapper.findAll('button').find(button => button.text().includes('分享'));
    expect(shareButton).toBeTruthy();

    await shareButton!.trigger('click');
    await flushPromises();

    expect(shareMock).toHaveBeenCalledWith({
      title: 'Demo Video',
      text: 'Example description',
      url: 'http://localhost:3000/video/9',
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('logs native share failures without falling back to clipboard copy', async () => {
    const shareError = new Error('share failed');
    const shareMock = vi.fn().mockRejectedValue(shareError);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    try {
      const wrapper = mount(VideoWatchView);
      await flushPromises();

      const shareButton = wrapper.findAll('button').find(button => button.text().includes('分享'));
      expect(shareButton).toBeTruthy();

      await shareButton!.trigger('click');
      await flushPromises();

      expect(shareMock).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(shareError);
      expect(writeText).not.toHaveBeenCalled();
      expect(execCommandMock).not.toHaveBeenCalled();
      expect(notifySuccess).not.toHaveBeenCalled();
      expect(notifyError).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('prefers navigator.clipboard when share api is unavailable but clipboard api exists', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const shareButton = wrapper.findAll('button').find(button => button.text().includes('分享'));
    expect(shareButton).toBeTruthy();

    await shareButton!.trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/video/9');
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalledWith('链接已复制', '当前视频链接已复制到剪贴板。');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('copies the current url through the shared fallback when navigator.share is unavailable', async () => {
    const execCommandMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const shareButton = wrapper.findAll('button').find(button => button.text().includes('分享'));
    expect(shareButton).toBeTruthy();

    await shareButton!.trigger('click');
    await flushPromises();

    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(notifySuccess).toHaveBeenCalledWith('链接已复制', '当前视频链接已复制到剪贴板。');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('shows copy failure feedback when the shared fallback throws', async () => {
    const execCommandMock = vi.fn(() => {
      throw new Error('copy failed');
    });

    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const shareButton = wrapper.findAll('button').find(button => button.text().includes('分享'));
    expect(shareButton).toBeTruthy();

    await shareButton!.trigger('click');
    await flushPromises();

    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(notifyError).toHaveBeenCalledWith('复制失败', '复制视频链接失败，请稍后重试。');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('redirects to /404 when the route id is missing', async () => {
    routeState.params = {} as { id?: string };

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    expect(routerState.push).toHaveBeenCalledWith('/404');
    expect(mediaApi.getMediaById).not.toHaveBeenCalled();
    expect(playSourceApi.getPlaySourcesByMediaId).not.toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it('queues a download task and shows success feedback when a download url exists', async () => {
    downloadsStore.enqueueTask.mockReturnValue({ id: 'task-1', fileName: 'Demo Video' });

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const downloadButton = wrapper.findAll('button').find(button => button.text().includes('下载'));
    expect(downloadButton).toBeTruthy();

    await downloadButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).toHaveBeenCalledWith({
      url: 'https://example.com/download.mp4',
      fileName: 'Demo Video',
      sourceLabel: '主线路',
      mediaResourceId: 9,
      metadata: {
        title: 'Demo Video',
        description: 'Example description',
        duration: 3600,
      },
    });
    expect(downloadsStore.startTask).toHaveBeenCalledWith('task-1');
    expect(notifySuccess).toHaveBeenCalledWith(
      '已加入下载任务',
      '已将《Demo Video》加入下载任务。',
    );
  });

  it('shows an error when no download url is available', async () => {
    mediaApi.getMediaById.mockResolvedValueOnce({
      id: 9,
      title: 'Demo Video',
      description: 'Example description',
      poster: '',
      source: 'demo',
      duration: 3600,
      downloadUrls: [],
    });
    playSourceApi.getPlaySourcesByMediaId.mockResolvedValueOnce([
      {
        id: 1,
        name: '主线路',
        url: 'https://example.com/watch.mp4',
        sourceName: '主线路',
        type: 'online',
        downloadUrls: [],
      },
    ]);

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const downloadButton = wrapper.findAll('button').find(button => button.text().includes('下载'));
    expect(downloadButton).toBeTruthy();

    await downloadButton!.trigger('click');
    await flushPromises();

    expect(downloadsStore.enqueueTask).not.toHaveBeenCalled();
    expect(downloadsStore.startTask).not.toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalledWith('暂不支持下载', '当前视频没有可用的下载链接。');
  });

  it('toggles favorite when the viewer is signed in', async () => {
    authStore.isAuthenticated = true;
    mediaApi.toggleFavorite.mockResolvedValue(undefined);

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const favoriteButton = wrapper.findAll('button').find(button => button.text().includes('收藏'));
    expect(favoriteButton).toBeTruthy();

    await favoriteButton!.trigger('click');
    await flushPromises();

    expect(mediaApi.toggleFavorite).toHaveBeenCalledWith('9');
    expect(wrapper.text()).toContain('已收藏');
  });

  it('keeps the favorite state unchanged when favorite toggling fails', async () => {
    authStore.isAuthenticated = true;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mediaApi.toggleFavorite.mockRejectedValue(new Error('favorite failed'));

    try {
      const wrapper = mount(VideoWatchView);
      await flushPromises();

      const favoriteButton = wrapper
        .findAll('button')
        .find(button => button.text().includes('收藏'));
      expect(favoriteButton).toBeTruthy();

      await favoriteButton!.trigger('click');
      await flushPromises();

      expect(mediaApi.toggleFavorite).toHaveBeenCalledWith('9');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(wrapper.text()).toContain('收藏');
      expect(wrapper.text()).not.toContain('已收藏');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('asks unauthenticated viewers to log in before favoriting', async () => {
    authStore.isAuthenticated = false;

    const wrapper = mount(VideoWatchView);
    await flushPromises();

    const favoriteButton = wrapper.findAll('button').find(button => button.text().includes('收藏'));
    expect(favoriteButton).toBeTruthy();

    await favoriteButton!.trigger('click');
    await flushPromises();

    expect(showConfirm).toHaveBeenCalledWith(
      '收藏功能需要登录，是否前往登录页面？',
      expect.any(Function),
    );

    const onConfirm = showConfirm.mock.calls[0][1] as () => void;
    onConfirm();

    expect(routerState.push).toHaveBeenCalledWith('/login');
  });
});
