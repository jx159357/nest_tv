import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PlaySourcesView from '@/views/PlaySourcesView.vue';

const { playSourceApi, showConfirm } = vi.hoisted(() => ({
  playSourceApi: {
    getPlaySources: vi.fn(),
    deletePlaySource: vi.fn(),
    testPlaySource: vi.fn(),
    updatePlaySource: vi.fn(),
    createPlaySource: vi.fn(),
  },
  showConfirm: vi.fn(),
}));

vi.mock('@/api', () => ({
  playSourceApi,
}));

vi.mock('@/composables/useModal', () => ({
  showConfirm,
}));

vi.mock('@/components/NavigationLayout.vue', () => ({
  default: {
    template: '<div class="layout-stub"><slot /></div>',
  },
}));

describe('PlaySourcesView', () => {
  beforeEach(() => {
    playSourceApi.getPlaySources.mockReset();
    playSourceApi.deletePlaySource.mockReset();
    playSourceApi.testPlaySource.mockReset();
    playSourceApi.updatePlaySource.mockReset();
    playSourceApi.createPlaySource.mockReset();
    showConfirm.mockReset();

    playSourceApi.getPlaySources.mockResolvedValue({
      data: [
        {
          id: 1,
          mediaResourceId: 11,
          mediaResource: { id: 11, title: 'Demo Media' },
          type: 'online',
          status: 'active',
          resolution: '1080p',
          priority: 1,
          playCount: 3,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    playSourceApi.deletePlaySource.mockResolvedValue(undefined);
  });

  it('loads play sources and confirms before deleting one', async () => {
    const wrapper = mount(PlaySourcesView);
    await flushPromises();

    expect(playSourceApi.getPlaySources).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(wrapper.text()).toContain('Demo Media');

    const deleteButton = wrapper.findAll('button').find(button => button.text().includes('删除'));
    expect(deleteButton).toBeTruthy();

    await deleteButton!.trigger('click');

    expect(showConfirm).toHaveBeenCalledWith('确定要删除这个播放源吗？', expect.any(Function));

    const onConfirm = showConfirm.mock.calls[0][1] as () => Promise<void>;
    await onConfirm();
    await flushPromises();

    expect(playSourceApi.deletePlaySource).toHaveBeenCalledWith('1');
    expect(playSourceApi.getPlaySources).toHaveBeenCalledTimes(2);
  });
});
