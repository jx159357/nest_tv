import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AdminDashboardView from '@/views/AdminDashboardView.vue';

const { adminApi, crawlerApi, schedulerApi } = vi.hoisted(() => ({
  adminApi: {
    getStats: vi.fn(),
    getHealth: vi.fn(),
    getDanmakuHealth: vi.fn(),
  },
  crawlerApi: {
    getStatistics: vi.fn(),
  },
  schedulerApi: {
    getDailySourceCollectionSummary: vi.fn(),
    getDailySourceCollectionDashboard: vi.fn(),
    runDailySourceCollection: vi.fn(),
  },
}));

vi.mock('@/api/admin', () => ({ adminApi }));
vi.mock('@/api/crawler', () => ({ crawlerApi }));
vi.mock('@/api/scheduler', () => ({ schedulerApi }));

describe('AdminDashboardView', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    consoleErrorSpy.mockClear();
    adminApi.getStats.mockReset();
    adminApi.getHealth.mockReset();
    adminApi.getDanmakuHealth.mockReset();
    crawlerApi.getStatistics.mockReset();
    schedulerApi.getDailySourceCollectionSummary.mockReset();
    schedulerApi.getDailySourceCollectionDashboard.mockReset();
    schedulerApi.runDailySourceCollection.mockReset();

    adminApi.getStats.mockResolvedValue({
      userCount: 1,
      mediaCount: 2,
      playSourceCount: 3,
      watchHistoryCount: 4,
      downloadTaskCount: 5,
      activeDownloadTaskCount: 2,
      completedDownloadTaskCount: 2,
      failedDownloadTaskCount: 1,
      recentActivity: [],
    });
    adminApi.getHealth.mockResolvedValue({
      status: 'ok',
      timestamp: '2025-01-02T00:00:00.000Z',
      uptime: 300,
      memory: {
        rss: 1024,
        heapUsed: 512,
        heapTotal: 1024,
      },
    });
    adminApi.getDanmakuHealth.mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      websocket: 'active',
      performance: {
        responseTime: 'normal',
        memoryUsage: 'normal',
        activeConnections: 6,
        activeRooms: 2,
        totalMessages: 15,
      },
      lastUpdate: '2025-01-02T00:00:00.000Z',
      uptime: 300,
      message: '弹幕系统运行正常，当前监控 2 个活跃房间。',
    });
    crawlerApi.getStatistics.mockResolvedValue({ data: null });
    schedulerApi.getDailySourceCollectionSummary.mockResolvedValue(null);
    schedulerApi.getDailySourceCollectionDashboard.mockResolvedValue(null);
    schedulerApi.runDailySourceCollection.mockResolvedValue(null);
  });

  it('renders danmaku health metrics inside the system status card', async () => {
    const wrapper = mount(AdminDashboardView, {
      global: {
        stubs: { RouterLink: true, 'router-link': true },
      },
    });
    await flushPromises();

    expect(adminApi.getDanmakuHealth).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('弹幕运行态');
    expect(wrapper.text()).toContain('活跃房间');
    expect(wrapper.text()).toContain('在线连接');
    expect(wrapper.text()).toContain('房间消息');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('6');
    expect(wrapper.text()).toContain('15');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
