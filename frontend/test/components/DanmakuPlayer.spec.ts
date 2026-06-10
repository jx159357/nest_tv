import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import DanmakuPlayer from '@/components/DanmakuPlayer.vue';

const { authStore, danmakuApi, wsComposable } = vi.hoisted(() => ({
  authStore: {
    user: { id: 7 },
    isAdmin: true,
  },
  danmakuApi: {
    getRoomInfo: vi.fn(),
    getFilterRules: vi.fn(),
    getSuggestions: vi.fn(),
    sendDanmaku: vi.fn(),
  },
  wsComposable: {
    isConnected: { value: false },
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendDanmaku: vi.fn(),
    getRoomInfo: vi.fn(),
    onDanmaku: vi.fn(),
    onSystem: vi.fn(),
    onRoomInfo: vi.fn(),
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    onHeartbeat: vi.fn(),
    onReconnectFailed: vi.fn(),
  },
}));

vi.mock('@/api/danmaku', () => ({
  danmakuApi,
}));

vi.mock('@/services/danmaku-websocket.service', () => ({
  useDanmakuWebSocket: () => wsComposable,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

describe('DanmakuPlayer', () => {
  beforeEach(() => {
    danmakuApi.getRoomInfo.mockReset();
    danmakuApi.getFilterRules.mockReset();
    danmakuApi.getSuggestions.mockReset();
    danmakuApi.sendDanmaku.mockReset();
    wsComposable.connect.mockReset();
    wsComposable.disconnect.mockReset();
    wsComposable.sendDanmaku.mockReset();
    wsComposable.getRoomInfo.mockReset();
    wsComposable.onDanmaku.mockReset();
    wsComposable.onSystem.mockReset();
    wsComposable.onRoomInfo.mockReset();
    wsComposable.onConnected.mockReset();
    wsComposable.onDisconnected.mockReset();
    wsComposable.onError.mockReset();
    wsComposable.onHeartbeat.mockReset();
    wsComposable.onReconnectFailed.mockReset();
    wsComposable.isConnected.value = false;
    authStore.user = { id: 7 };
    authStore.isAdmin = true;
    sessionStorage.clear();

    danmakuApi.getRoomInfo.mockResolvedValue({
      videoId: 'video-1',
      onlineUsers: 3,
      messageCount: 12,
      isActive: true,
      lastActivity: '2025-01-02T03:04:05.000Z',
      message: 'ok',
    });
    danmakuApi.getFilterRules.mockResolvedValue({
      sensitiveWords: ['剧透', '广告'],
      spamPatterns: ['http'],
      level: 'high',
      autoBlock: true,
      message: 'ok',
    });
    danmakuApi.getSuggestions.mockResolvedValue({
      videoId: 'video-1',
      type: 'relevant',
      limit: 5,
      suggestions: [
        {
          text: '太燃了',
          color: '#ffffff',
          type: 'scroll',
          priority: 1,
          score: 4,
        },
      ],
    });
    danmakuApi.sendDanmaku.mockResolvedValue({
      id: 15,
      text: 'HTTP 弹幕',
      color: '#ffffff',
      type: 'scroll',
      priority: 1,
      videoId: 'video-1',
      userId: 7,
      metadata: { timestamp: 1735787045000 },
    });
  });

  it('loads room summary from the backend fallback api', async () => {
    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    await wrapper.get('.danmaku-settings-btn').trigger('click');

    expect(danmakuApi.getRoomInfo).toHaveBeenCalledWith('video-1');
    expect(wrapper.text()).toContain('在线用户: 3');
    expect(wrapper.text()).toContain('弹幕总数: 12');
    expect(wrapper.text()).toContain('最近活跃:');
    expect(wrapper.text()).toContain('连接状态: HTTP 回退中');
    expect(wrapper.text()).toContain('刷新房间信息');
    expect(wrapper.text()).toContain('服务端过滤级别: high');
    expect(wrapper.text()).toContain('自动拦截: 开启');
    expect(wrapper.text()).toContain('敏感词条数: 2');
    expect(wrapper.text()).toContain('太燃了');
  });

  it('does not request admin-only filter rules for regular users', async () => {
    authStore.isAdmin = false;

    mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    expect(danmakuApi.getRoomInfo).toHaveBeenCalledWith('video-1');
    expect(danmakuApi.getSuggestions).toHaveBeenCalled();
    expect(danmakuApi.getFilterRules).not.toHaveBeenCalled();
  });

  it('sends danmaku through the HTTP fallback when websocket is offline', async () => {
    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    const input = wrapper.get('input.danmaku-input');
    await input.setValue('HTTP 弹幕');
    await wrapper.get('.danmaku-send-btn').trigger('click');
    await flushPromises();

    expect(danmakuApi.sendDanmaku).toHaveBeenCalledWith({
      text: 'HTTP 弹幕',
      color: '#FFFFFF',
      type: 'scroll',
      priority: 1,
      videoId: 'video-1',
      mediaResourceId: 7,
    });
    expect((input.element as HTMLInputElement).value).toBe('');
    expect(wrapper.text()).toContain('HTTP 弹幕');
    expect(wrapper.text()).toContain('弹幕已通过 HTTP 回退发送');
  });

  it('echoes websocket sends immediately and deduplicates the server broadcast', async () => {
    let onDanmakuListener: ((message: any) => void) | undefined;
    wsComposable.isConnected.value = true;
    wsComposable.onDanmaku.mockImplementation(listener => {
      onDanmakuListener = listener;
    });
    wsComposable.sendDanmaku.mockReturnValue({
      id: 'local-1',
      userId: '7',
      videoId: 'video-1',
      text: 'WS 弹幕',
      color: '#FFFFFF',
      type: 'scroll',
      priority: 1,
      timestamp: 1735787045000,
      isHighlighted: false,
    });

    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    await wrapper.get('input.danmaku-input').setValue('WS 弹幕');
    await wrapper.get('.danmaku-send-btn').trigger('click');
    await nextTick();

    expect(wrapper.findAll('.danmaku-item').filter(item => item.text() === 'WS 弹幕')).toHaveLength(
      1,
    );

    onDanmakuListener?.({
      id: 'local-1',
      userId: '7',
      videoId: 'video-1',
      text: 'WS 弹幕',
      color: '#FFFFFF',
      type: 'scroll',
      priority: 1,
      timestamp: 1735787045000,
    });
    await nextTick();

    expect(wrapper.findAll('.danmaku-item').filter(item => item.text() === 'WS 弹幕')).toHaveLength(
      1,
    );
  });

  it('renders top and bottom danmaku as anchored overlays', async () => {
    let onDanmakuListener: ((message: any) => void) | undefined;
    wsComposable.onDanmaku.mockImplementation(listener => {
      onDanmakuListener = listener;
    });

    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    onDanmakuListener?.({
      id: 'top-1',
      userId: '7',
      videoId: 'video-1',
      text: '顶部弹幕',
      color: '#FFFFFF',
      type: 'top',
      priority: 1,
      timestamp: 1735787045000,
    });
    onDanmakuListener?.({
      id: 'bottom-1',
      userId: '7',
      videoId: 'video-1',
      text: '底部弹幕',
      color: '#FFFFFF',
      type: 'bottom',
      priority: 1,
      timestamp: 1735787045001,
    });
    await nextTick();

    const topStyle = wrapper.get('.danmaku-top').attributes('style') || '';
    const bottomStyle = wrapper.get('.danmaku-bottom').attributes('style') || '';
    expect(topStyle).toContain('left: 50%');
    expect(topStyle).toContain('translateX(-50%)');
    expect(topStyle).toContain('danmaku-fade-in-out');
    expect(topStyle).not.toContain('danmaku-scroll-lr');
    expect(bottomStyle).toContain('left: 50%');
    expect(bottomStyle).toContain('translateX(-50%)');
    expect(bottomStyle).toContain('danmaku-fade-in-out');
    expect(bottomStyle).not.toContain('danmaku-scroll-lr');
  });

  it('applies a suggestion chip into the input box', async () => {
    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    const suggestionButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('太燃了'));
    expect(suggestionButton).toBeTruthy();
    await suggestionButton!.trigger('click');

    const input = wrapper.get('input.danmaku-input');
    expect((input.element as HTMLInputElement).value).toBe('太燃了');
  });

  it('refreshes danmaku suggestions on demand', async () => {
    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    const refreshButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('刷新建议'));
    expect(refreshButton).toBeTruthy();
    await refreshButton!.trigger('click');
    await flushPromises();

    expect(danmakuApi.getSuggestions).toHaveBeenCalledTimes(2);
  });

  it('keeps session settings isolated by video id', async () => {
    const wrapper = mount(DanmakuPlayer, {
      props: {
        videoId: 'video-1',
        mediaResourceId: 7,
      },
    });
    await flushPromises();

    await wrapper.get('.danmaku-toggle-btn').trigger('click');
    await flushPromises();

    expect(JSON.parse(sessionStorage.getItem('danmaku_filters_video-1') || '{}')).toMatchObject({
      settings: {
        enabled: false,
      },
    });

    await wrapper.setProps({ videoId: 'video-2' });
    await flushPromises();

    expect(wrapper.get('.danmaku-container').classes()).not.toContain('danmaku-hidden');

    await wrapper.setProps({ videoId: 'video-1' });
    await flushPromises();

    expect(wrapper.get('.danmaku-container').classes()).toContain('danmaku-hidden');
  });
});
