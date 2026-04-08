import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminDanmakuView from '@/views/AdminDanmakuView.vue';

const { danmakuApi } = vi.hoisted(() => ({
  danmakuApi: {
    getHealth: vi.fn(),
    getFilterRules: vi.fn(),
    getReportedDanmaku: vi.fn(),
    moderateDanmaku: vi.fn(),
    updateFilterRules: vi.fn(),
    resetFilterRules: vi.fn(),
  },
}));

vi.mock('@/api/danmaku', () => ({ danmakuApi }));

describe('AdminDanmakuView', () => {
  beforeEach(() => {
    danmakuApi.getHealth.mockReset();
    danmakuApi.getFilterRules.mockReset();
    danmakuApi.getReportedDanmaku.mockReset();
    danmakuApi.moderateDanmaku.mockReset();
    danmakuApi.updateFilterRules.mockReset();
    danmakuApi.resetFilterRules.mockReset();

    danmakuApi.getHealth.mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      websocket: 'active',
      performance: {
        responseTime: 'normal',
        memoryUsage: 'normal',
        activeConnections: 5,
        activeRooms: 2,
        totalMessages: 12,
      },
      lastUpdate: '2025-01-02T00:00:00.000Z',
      uptime: 3600,
      message: '弹幕系统运行正常，当前监控 2 个活跃房间。',
    });
    danmakuApi.getFilterRules.mockResolvedValue({
      sensitiveWords: ['剧透', '广告'],
      spamPatterns: ['http'],
      level: 'high',
      autoBlock: true,
      message: 'ok',
    });
    danmakuApi.getReportedDanmaku.mockResolvedValue({
      data: [
        {
          id: 5,
          text: '剧透了',
          videoId: 'video-1',
          userId: 9,
          reportCount: 2,
          status: 'reported',
          latestReason: '剧透',
          lastReportedAt: '2025-01-03T00:00:00.000Z',
        },
      ],
      limit: 8,
      message: 'ok',
    });
    danmakuApi.moderateDanmaku.mockResolvedValue({
      success: true,
      message: '弹幕已隐藏。',
      danmaku: { id: 5, isActive: false },
    });
    danmakuApi.updateFilterRules.mockResolvedValue({
      success: true,
      message: 'ok',
      updatedRules: {
        sensitiveWords: ['剧透'],
        spamPatterns: ['http'],
        level: 'medium',
        autoBlock: false,
      },
    });
    danmakuApi.resetFilterRules.mockResolvedValue({
      success: true,
      message: 'ok',
      updatedRules: {
        sensitiveWords: ['傻逼', '草泥马'],
        spamPatterns: ['http'],
        level: 'medium',
        autoBlock: false,
      },
    });
  });

  it('loads danmaku health and filter rules', async () => {
    const wrapper = mount(AdminDanmakuView);
    await flushPromises();

    expect(danmakuApi.getHealth).toHaveBeenCalledTimes(1);
    expect(danmakuApi.getFilterRules).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('活跃房间');
    expect(wrapper.text()).toContain('在线连接');
    expect(wrapper.text()).toContain('房间消息');
    expect(wrapper.text()).toContain('规则级别');
    expect(wrapper.text()).toContain('敏感词条数');
    expect(wrapper.text()).toContain('垃圾模式数');
    expect(wrapper.text()).toContain('high');
    expect(wrapper.text()).toContain('举报弹幕');
    expect(wrapper.text()).toContain('剧透了');
  });

  it('normalizes and saves filter rule edits', async () => {
    const wrapper = mount(AdminDanmakuView);
    await flushPromises();

    const textareas = wrapper.findAll('textarea');
    await textareas[0]!.setValue(' 剧透 \n 剧透 \n');
    await textareas[1]!.setValue(' http \n');
    await wrapper.get('select').setValue('medium');
    await wrapper.get('input[type="checkbox"]').setValue(false);
    await wrapper.get('button.bg-indigo-600').trigger('click');
    await flushPromises();

    expect(danmakuApi.updateFilterRules).toHaveBeenCalledWith({
      sensitiveWords: ['剧透'],
      spamPatterns: ['http'],
      level: 'medium',
      autoBlock: false,
    });
  });

  it('resets filter rules back to defaults', async () => {
    danmakuApi.getFilterRules
      .mockResolvedValueOnce({
        sensitiveWords: ['剧透', '广告'],
        spamPatterns: ['http'],
        level: 'high',
        autoBlock: true,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        sensitiveWords: ['傻逼', '草泥马'],
        spamPatterns: ['http'],
        level: 'medium',
        autoBlock: false,
        message: 'ok',
      });

    const wrapper = mount(AdminDanmakuView);
    await flushPromises();

    const resetButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('恢复默认规则'));
    expect(resetButton).toBeTruthy();
    await resetButton!.trigger('click');
    await flushPromises();

    expect(danmakuApi.resetFilterRules).toHaveBeenCalledTimes(1);
    expect((wrapper.findAll('textarea')[0]!.element as HTMLTextAreaElement).value).toContain(
      '傻逼',
    );
  });

  it('moderates a reported danmaku from the overview list', async () => {
    const wrapper = mount(AdminDanmakuView);
    await flushPromises();

    const hideButton = wrapper.findAll('button').find(button => button.text().includes('隐藏弹幕'));
    expect(hideButton).toBeTruthy();
    await hideButton!.trigger('click');
    await flushPromises();

    expect(danmakuApi.moderateDanmaku).toHaveBeenCalledWith(5, { action: 'hide' });
    expect(wrapper.text()).toContain('弹幕已隐藏。');
  });

  it('filters reported danmaku by status and keyword', async () => {
    danmakuApi.getReportedDanmaku.mockResolvedValue({
      data: [
        {
          id: 5,
          text: '剧透了',
          videoId: 'video-1',
          userId: 9,
          reportCount: 2,
          status: 'reported',
          latestReason: '剧透',
          lastReportedAt: '2025-01-03T00:00:00.000Z',
        },
        {
          id: 6,
          text: '广告来了',
          videoId: 'video-2',
          userId: 10,
          reportCount: 1,
          status: 'hidden',
          latestReason: '广告',
          lastReportedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      limit: 8,
      message: 'ok',
    });

    const wrapper = mount(AdminDanmakuView);
    await flushPromises();

    const hiddenFilter = wrapper.findAll('button').find(button => button.text().includes('已隐藏'));
    expect(hiddenFilter).toBeTruthy();
    await hiddenFilter!.trigger('click');

    expect(wrapper.text()).toContain('广告来了');
    expect(wrapper.text()).not.toContain('剧透了');

    const searchInput = wrapper.find('input[placeholder="搜索弹幕内容 / 原因 / 视频ID"]');
    await searchInput.setValue('video-2');

    expect(wrapper.text()).toContain('广告来了');
    expect(wrapper.text()).not.toContain('剧透了');
  });
});
