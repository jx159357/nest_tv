import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import SettingsView from '@/views/SettingsView.vue';

const { authApi, searchApi, authStore } = vi.hoisted(() => ({
  authApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
  searchApi: {
    getHistory: vi.fn(),
  },
  authStore: {
    user: null as any,
  },
}));

vi.mock('@/api/auth', () => ({
  authApi,
}));

vi.mock('@/api/search', () => ({
  searchApi,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

vi.mock('@/components/LoadingSpinner.vue', () => ({
  default: {
    props: ['text'],
    template: '<div class="loading-spinner">{{ text }}</div>',
  },
}));

describe('SettingsView', () => {
  beforeEach(() => {
    authStore.user = null;
    authApi.getProfile.mockReset();
    authApi.updateProfile.mockReset();
    authApi.changePassword.mockReset();
    searchApi.getHistory.mockReset();

    authApi.getProfile.mockResolvedValue({
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      nickname: 'Demo',
      role: 'user',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      recommendationSettings: {
        preferredTypes: ['movie'],
        preferredGenres: ['科幻'],
        excludedGenres: [],
        preferredKeywords: ['沙丘'],
        freshnessBias: 'balanced',
      },
    });
    authApi.updateProfile.mockImplementation(async payload => ({
      ...authApi.getProfile.mock.results[0].value,
      ...payload,
      id: 1,
      username: 'demo-user',
      email: 'demo@example.com',
      role: 'user',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }));
    authApi.changePassword.mockResolvedValue({ success: true });
    searchApi.getHistory.mockResolvedValue(['沙丘', '奥本海默']);
  });

  it('loads current profile settings and recent search keywords', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('偏好设置');
    expect(wrapper.text()).toContain('一键使用最近搜索');
    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('Demo');
  });

  it('saves profile and recommendation settings', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('新昵称');
    await inputs[3].setValue('沙丘, 科幻');

    const saveButton = wrapper.findAll('button').find(button => button.text().includes('保存设置'));
    expect(saveButton).toBeTruthy();

    await saveButton!.trigger('click');
    await flushPromises();

    expect(authApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: '新昵称',
        recommendationSettings: expect.objectContaining({
          preferredKeywords: ['沙丘', '科幻'],
        }),
      }),
    );
    expect(wrapper.text()).toContain('偏好设置已保存');
  });

  it('changes password when the form is valid', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const inputs = wrapper.findAll('input[type="password"]');
    await inputs[0].setValue('old-pass-123');
    await inputs[1].setValue('new-pass-123');
    await inputs[2].setValue('new-pass-123');

    const passwordButton = wrapper.findAll('button').find(button => button.text().includes('修改密码'));
    expect(passwordButton).toBeTruthy();

    await passwordButton!.trigger('click');
    await flushPromises();

    expect(authApi.changePassword).toHaveBeenCalledWith({
      oldPassword: 'old-pass-123',
      newPassword: 'new-pass-123',
    });
    expect(wrapper.text()).toContain('密码修改成功');
  });

  it('shows an unsaved changes reminder after editing the form', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('另一个昵称');

    expect(wrapper.text()).toContain('尚未保存的更改');
  });
});
