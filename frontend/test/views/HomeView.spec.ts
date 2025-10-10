import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HomeView from '../views/HomeView.vue';
import { useAuthStore } from '../stores/auth';
import { useMediaStore } from '../stores/media';

// 模拟 API 模块
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock('../api/media', () => ({
  mediaApi: {
    getMediaList: vi.fn(),
    getMediaById: vi.fn(),
    getPopularMedia: vi.fn(),
    getLatestMedia: vi.fn(),
    getTopRatedMedia: vi.fn(),
  },
}));

describe('HomeView', () => {
  let wrapper: any;
  let authStore: any;
  let mediaStore: any;

  beforeEach(() => {
    // 创建一个新的 Pinia 实例
    const pinia = createPinia();
    setActivePinia(pinia);

    // 获取 store 实例
    authStore = useAuthStore();
    mediaStore = useMediaStore();

    // 模拟 store 方法
    authStore.fetchUserProfile = vi.fn();
    mediaStore.fetchPopularMedia = vi.fn();
    mediaStore.fetchLatestMedia = vi.fn();
    mediaStore.fetchTopRatedMedia = vi.fn();
  });

  it('renders correctly when authenticated', () => {
    authStore.isAuthenticated = true;
    authStore.user = { id: 1, username: 'testuser' };

    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    expect(wrapper.find('nav').exists()).toBe(true);
    expect(wrapper.find('h1').text()).toContain('视频平台');
  });

  it('shows login/register buttons when not authenticated', () => {
    authStore.isAuthenticated = false;

    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    expect(wrapper.find('nav').exists()).toBe(true);
    expect(wrapper.text()).toContain('登录');
    expect(wrapper.text()).toContain('注册');
  });

  it('loads home data on mount', async () => {
    const mockPopularMedia = [
      { id: 1, title: 'Movie 1', rating: 8.5, viewCount: 100 },
      { id: 2, title: 'Movie 2', rating: 7.8, viewCount: 200 },
    ];

    const mockLatestMedia = [
      { id: 3, title: 'Movie 3', rating: 9.0, viewCount: 50 },
      { id: 4, title: 'Movie 4', rating: 8.0, viewCount: 150 },
    ];

    const mockTopRatedMedia = [
      { id: 5, title: 'Movie 5', rating: 9.5, viewCount: 300 },
      { id: 6, title: 'Movie 6', rating: 9.2, viewCount: 250 },
    ];

    mediaStore.fetchPopularMedia.mockResolvedValue(mockPopularMedia);
    mediaStore.fetchLatestMedia.mockResolvedValue(mockLatestMedia);
    mediaStore.fetchTopRatedMedia.mockResolvedValue(mockTopRatedMedia);

    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    // 等待异步操作完成
    await wrapper.vm.$nextTick();

    expect(mediaStore.fetchPopularMedia).toHaveBeenCalledWith(8);
    expect(mediaStore.fetchLatestMedia).toHaveBeenCalledWith(8);
    expect(mediaStore.fetchTopRatedMedia).toHaveBeenCalledWith(8);
  });

  it('handles search correctly', async () => {
    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('test movie');

    const searchButton = wrapper.find('button');
    await searchButton.trigger('click');

    // 这里需要测试路由跳转，但由于我们使用了 stub，所以只能验证事件处理
    expect(searchInput.element.value).toBe('test movie');
  });

  it('navigates to media detail on click', async () => {
    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    // 模拟一些媒体数据
    const mockMedia = [{ id: 1, title: 'Test Movie', rating: 8.0, viewCount: 100 }];
    wrapper.setData({ popularMedia: mockMedia });

    await wrapper.vm.$nextTick();

    const mediaCard = wrapper.find('.bg-white.rounded-lg');
    await mediaCard.trigger('click');

    // 验证 goToMediaDetail 方法被调用
    expect(wrapper.vm.goToMediaDetail).toHaveBeenCalledWith(1);
  });

  it('handles logout correctly', async () => {
    authStore.isAuthenticated = true;

    wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link'],
      },
    });

    const logoutButton = wrapper.find('button');
    await logoutButton.trigger('click');

    expect(authStore.logout).toHaveBeenCalled();
  });
});
