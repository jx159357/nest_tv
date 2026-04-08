import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DanmakuPlayer from '@/components/DanmakuPlayer.vue';

const { danmakuApi, wsComposable } = vi.hoisted(() => ({
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
  },
}));

vi.mock('@/api/danmaku', () => ({
  danmakuApi,
}));

vi.mock('@/services/danmaku-websocket.service', () => ({
  useDanmakuWebSocket: () => wsComposable,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 7 },
  }),
}));

describe('DanmakuPlayer', () => {
  beforeEach(() => {
    danmakuApi.getRoomInfo.mockReset();
    danmakuApi.getFilterRules.mockReset();
    danmakuApi.getSuggestions.mockReset();
    danmakuApi.sendDanmaku.mockReset();
    wsComposable.connect.mockReset();
    wsComposable.disconnect.mockReset();
    wsComposable.getRoomInfo.mockReset();

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
});
