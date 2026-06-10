<template>
  <div class="iptv-view">
    <header class="iptv-header">
      <h1 class="iptv-title">IPTV 频道</h1>
      <p class="iptv-subtitle">浏览和播放 IPTV 频道，支持 M3U 导入</p>
    </header>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">频道总数</div>
        <div class="stat-value">{{ stats?.activeChannels || 0 }}</div>
        <div v-if="stats?.totalChannels !== stats?.activeChannels" class="stat-sub">
          共 {{ stats?.totalChannels || 0 }} 个（含停用）
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">频道分组</div>
        <div class="stat-value">{{ stats?.totalGroups || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">当前筛选</div>
        <div class="stat-value text-sm">{{ selectedGroup || '全部' }}</div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <form class="filter-form" @submit.prevent="loadChannels(1)">
        <input v-model="search" type="text" class="filter-input" placeholder="搜索频道..." />
        <select v-model="selectedGroup" class="filter-select">
          <option value="">全部分组</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
        <input v-model="country" type="text" class="filter-input" placeholder="国家" />
        <input v-model="resolution" type="text" class="filter-input" placeholder="清晰度" />
        <button type="submit" class="btn-filter" :disabled="loading">
          {{ loading ? '加载中...' : '筛选' }}
        </button>
      </form>
      <label class="checkbox-label">
        <input v-model="activeOnly" type="checkbox" @change="loadChannels(1)" />
        仅活跃频道
      </label>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedIds.size > 0" class="batch-bar">
      <span class="batch-count">已选择 {{ selectedIds.size }} 个频道</span>
      <button class="btn-batch-delete" type="button" @click="batchDelete">批量删除</button>
      <button class="btn-batch-cancel" type="button" @click="clearSelection">取消选择</button>
    </div>

    <!-- 错误提示 -->
    <div v-if="pageError" class="error-banner">{{ pageError }}</div>

    <!-- 频道列表和详情 -->
    <div class="content-grid">
      <!-- 频道列表 -->
      <div class="channel-list-wrapper">
        <div class="list-header">
          <h2 class="section-title">频道列表</h2>
          <label v-if="channels.length > 0" class="checkbox-label select-all">
            <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
            全选
          </label>
        </div>
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="channels.length === 0" class="empty-state">暂无匹配频道</div>
        <div v-else class="channel-list">
          <div
            v-for="channel in channels"
            :key="channel.id"
            class="channel-item"
            :class="{ 'channel-item--active': channel.id === selectedChannelId }"
          >
            <label class="channel-checkbox" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.has(channel.id)"
                @change="toggleSelect(channel.id)"
              />
            </label>
            <button class="channel-content" type="button" @click="selectChannel(channel.id)">
              <div class="channel-info">
                <div class="channel-name-row">
                  <img
                    v-if="channel.logo"
                    :src="getLogoUrl(channel.logo)"
                    :alt="channel.name"
                    class="channel-logo"
                    loading="lazy"
                    @error="hideOnError"
                  />
                  <span class="channel-name">{{ channel.name }}</span>
                </div>
                <span class="channel-meta">
                  {{ channel.group || '未分组' }} · {{ channel.country || '未知' }}
                </span>
              </div>
              <div class="channel-tags">
                <span
                  v-if="channel.qualityScore"
                  class="tag-quality"
                  :class="getQualityClass(channel.qualityScore)"
                >
                  {{ channel.qualityScore }}分
                </span>
                <span
                  class="tag-status"
                  :class="channel.isActive ? 'tag--active' : 'tag--inactive'"
                >
                  {{ channel.isActive ? '活跃' : '停用' }}
                </span>
                <span class="tag-format">{{
                  channel.resolution || channel.streamFormat || '未知'
                }}</span>
              </div>
            </button>
          </div>
        </div>
        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            type="button"
            :disabled="pagination.page <= 1"
            @click="loadChannels(pagination.page - 1)"
          >
            上一页
          </button>
          <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            type="button"
            :disabled="pagination.page >= pagination.totalPages"
            @click="loadChannels(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- M3U 导入 -->
      <div class="import-panel">
        <h2 class="section-title">导入频道</h2>
        <form class="import-form" @submit.prevent="importM3UPlaylist">
          <input v-model="m3uUrl" type="url" class="filter-input" placeholder="M3U 播放列表 URL" />
          <input
            v-model="importGroup"
            type="text"
            class="filter-input"
            placeholder="分组名（可选，如：央视、卫视）"
          />
          <button type="submit" class="btn-import" :disabled="importing">
            {{ importing ? '导入中...' : '导入 M3U' }}
          </button>
        </form>
        <div class="import-divider">
          <span>或</span>
        </div>
        <div class="import-json-section">
          <textarea
            v-model="jsonInput"
            class="json-textarea"
            placeholder='粘贴 JSON 数组，格式: [{"name":"频道名","url":"http://...","group":"分组","logo":"http://..."}]'
            rows="4"
          ></textarea>
          <button
            class="btn-import"
            :disabled="importing || !jsonInput.trim()"
            @click="importJsonChannels"
          >
            {{ importing ? '导入中...' : '导入 JSON' }}
          </button>
        </div>
        <div v-if="importMessage" class="import-msg">{{ importMessage }}</div>

        <!-- 热门频道 -->
        <div class="mini-list">
          <h3 class="mini-title">热门频道</h3>
          <button
            v-for="ch in stats?.popularChannels || []"
            :key="`pop-${ch.id}`"
            class="mini-item"
            type="button"
            @click="selectChannel(ch.id)"
          >
            <span>{{ ch.name }}</span>
            <span class="mini-meta">{{ ch.viewCount }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 播放器 -->
    <div v-if="showPlayer && selectedChannel" class="player-section">
      <div class="player-header">
        <span>正在播放：{{ selectedChannel.name }}</span>
        <button class="btn-close" type="button" @click="showPlayer = false">关闭</button>
      </div>
      <div class="player-wrapper">
        <ArtPlayerWrapper
          :src="selectedChannel.url"
          :title="selectedChannel.name"
          :autoplay="true"
        />
      </div>
    </div>

    <!-- 频道详情 -->
    <div v-if="selectedChannel" class="detail-section">
      <h2 class="section-title">频道详情</h2>
      <div v-if="selectedLoading" class="loading-state">加载中...</div>
      <div v-else-if="selectedError" class="error-banner">{{ selectedError }}</div>
      <div v-else class="detail-content">
        <div class="detail-main">
          <h3 class="detail-name">{{ selectedChannel.name }}</h3>
          <div class="detail-tags">
            <span class="tag">{{ selectedChannel.group }}</span>
            <span class="tag">{{ selectedChannel.country || '未知' }}</span>
            <span class="tag">{{ selectedChannel.resolution || '未知' }}</span>
          </div>
          <div class="detail-url"><strong>地址：</strong>{{ selectedChannel.url }}</div>
          <div class="detail-desc">
            <strong>描述：</strong>{{ selectedChannel.description || '暂无' }}
          </div>
          <EpgTimeline :channel-id="selectedChannel.id" class="mt-4" />
        </div>
        <div class="detail-actions">
          <button class="btn-play" type="button" @click="showPlayer = true">播放频道</button>
          <button
            class="btn-validate"
            type="button"
            :disabled="validatingChannel"
            @click="validateSelectedChannel"
          >
            {{ validatingChannel ? '校验中...' : '校验' }}
          </button>
          <button class="btn-open" type="button" @click="openChannelUrl(selectedChannel.url)">
            新窗口打开
          </button>
          <button class="btn-delete" type="button" @click="deleteSingleChannel(selectedChannel.id)">
            删除此频道
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { iptvApi, type IPTVChannel, type IPTVStats } from '@/api/iptv';
  import ArtPlayerWrapper from '@/components/ArtPlayerWrapper.vue';
  import EpgTimeline from '@/components/EpgTimeline.vue';
  import { log } from '@/utils/logger';

  const hideOnError = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (el) el.style.display = 'none';
  };

  const channels = ref<IPTVChannel[]>([]);
  const groups = ref<string[]>([]);
  const stats = ref<IPTVStats | null>(null);
  const selectedChannel = ref<IPTVChannel | null>(null);
  const selectedChannelId = ref<number | null>(null);
  const selectedIds = ref(new Set<number>());

  const search = ref('');
  const selectedGroup = ref('');
  const country = ref('');
  const resolution = ref('');
  const activeOnly = ref(true);
  const m3uUrl = ref('');
  const importGroup = ref('');
  const jsonInput = ref('');
  const showPlayer = ref(false);

  const loading = ref(false);
  const selectedLoading = ref(false);
  const validatingChannel = ref(false);
  const importing = ref(false);

  const pageError = ref<string | null>(null);
  const selectedError = ref<string | null>(null);
  const importMessage = ref<string | null>(null);

  const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });

  const isAllSelected = computed(() => {
    return channels.value.length > 0 && channels.value.every(ch => selectedIds.value.has(ch.id));
  });

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds.value);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds.value = newSet;
  };

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      selectedIds.value = new Set();
    } else {
      selectedIds.value = new Set(channels.value.map(ch => ch.id));
    }
  };

  const clearSelection = () => {
    selectedIds.value = new Set();
  };

  const loadGroups = async () => {
    try {
      const result = await iptvApi.getGroups();
      groups.value = Array.isArray(result) ? result : [];
    } catch {
      groups.value = [];
    }
  };

  const loadStats = async () => {
    try {
      const result = await iptvApi.getStats();
      stats.value = result || null;
    } catch {
      stats.value = null;
    }
  };

  const loadChannels = async (page = pagination.value.page) => {
    loading.value = true;
    pageError.value = null;
    try {
      const response = await iptvApi.getChannels({
        page,
        limit: 12,
        group: selectedGroup.value || undefined,
        country: country.value || undefined,
        resolution: resolution.value || undefined,
        activeOnly: activeOnly.value,
        search: search.value || undefined,
      });
      channels.value = response.data;
      pagination.value = {
        page: response.page,
        totalPages: Math.max(response.totalPages, 1),
        total: response.total,
        limit: response.limit,
      };
    } catch (e) {
      channels.value = [];
      pageError.value = e instanceof Error ? e.message : '加载失败';
    } finally {
      loading.value = false;
    }
  };

  const selectChannel = async (id: number) => {
    selectedLoading.value = true;
    selectedError.value = null;
    selectedChannelId.value = id;
    try {
      selectedChannel.value = await iptvApi.getChannel(id);
    } catch (e) {
      selectedChannel.value = null;
      selectedError.value = e instanceof Error ? e.message : '加载失败';
    } finally {
      selectedLoading.value = false;
    }
  };

  const validateSelectedChannel = async () => {
    if (!selectedChannelId.value) return;
    validatingChannel.value = true;
    try {
      const result = await iptvApi.validateChannel(selectedChannelId.value);
      importMessage.value = result.isValid ? '频道可用' : '频道不可用';
      await Promise.all([
        loadChannels(pagination.value.page),
        loadStats(),
        selectChannel(selectedChannelId.value),
      ]);
    } catch (e) {
      importMessage.value = e instanceof Error ? e.message : '校验失败';
    } finally {
      validatingChannel.value = false;
    }
  };

  const importM3UPlaylist = async () => {
    if (!m3uUrl.value.trim()) {
      importMessage.value = '请输入 M3U 地址';
      return;
    }
    importing.value = true;
    try {
      const result = await iptvApi.importFromM3U(
        m3uUrl.value.trim(),
        importGroup.value.trim() || undefined,
      );
      importMessage.value = `已导入 ${result.length} 个频道`;
      importGroup.value = '';
      await Promise.all([loadChannels(1), loadGroups(), loadStats()]);
    } catch (e) {
      importMessage.value = e instanceof Error ? e.message : '导入失败';
    } finally {
      importing.value = false;
    }
  };

  const importJsonChannels = async () => {
    const raw = jsonInput.value.trim();
    if (!raw) return;
    let items: { name: string; url: string; group?: string; logo?: string }[];
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items)) {
        importMessage.value = 'JSON 必须是数组格式';
        return;
      }
    } catch {
      importMessage.value = 'JSON 格式不正确，请检查语法';
      return;
    }
    importing.value = true;
    try {
      const result = await iptvApi.importFromJson(items, importGroup.value.trim() || undefined);
      importMessage.value = `已导入 ${result.length} 个频道`;
      jsonInput.value = '';
      importGroup.value = '';
      await Promise.all([loadChannels(1), loadGroups(), loadStats()]);
    } catch (e) {
      importMessage.value = e instanceof Error ? e.message : '导入失败';
    } finally {
      importing.value = false;
    }
  };

  const deleteSingleChannel = async (id: number) => {
    const channel = channels.value.find(ch => ch.id === id);
    const name = channel?.name || '此频道';
    if (!confirm(`确定删除频道 "${name}" 吗？`)) return;
    try {
      await iptvApi.deleteChannel(id);
      if (selectedChannelId.value === id) {
        selectedChannel.value = null;
        selectedChannelId.value = null;
      }
      await Promise.all([loadChannels(1), loadGroups(), loadStats()]);
    } catch (e) {
      pageError.value = e instanceof Error ? e.message : '删除失败';
    }
  };

  const batchDelete = async () => {
    const count = selectedIds.value.size;
    if (!confirm(`确定删除选中的 ${count} 个频道吗？`)) return;
    const ids = [...selectedIds.value];
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await iptvApi.deleteChannel(id);
        success++;
        if (selectedChannelId.value === id) {
          selectedChannel.value = null;
          selectedChannelId.value = null;
        }
      } catch (e) {
        failed++;
        log.error('IPTV', `删除频道 ${id} 失败`, e);
      }
    }
    selectedIds.value = new Set();
    importMessage.value =
      failed > 0 ? `成功删除 ${success} 个，失败 ${failed} 个` : `成功删除 ${success} 个频道`;
    await Promise.all([loadChannels(1), loadGroups(), loadStats()]);
  };

  const openChannelUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const getLogoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return iptvApi.getImageProxyUrl(url);
    }
    return url;
  };

  const getQualityClass = (score?: number) => {
    if (!score) return 'quality-low';
    if (score >= 80) return 'quality-high';
    if (score >= 60) return 'quality-medium';
    return 'quality-low';
  };

  onMounted(() => void Promise.all([loadGroups(), loadStats(), loadChannels(1)]));
</script>

<style scoped>
  .iptv-view {
    min-height: 100vh;
    background: transparent;
    color: var(--text-primary);
    padding: 28px var(--page-gutter) 40px;
    max-width: var(--content-max-width);
    margin: 0 auto;
  }
  .iptv-header {
    margin-bottom: 18px;
  }
  .iptv-title {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .iptv-subtitle {
    font-size: 14px;
    color: var(--text-muted);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .stat-card {
    background: var(--surface-card);
    border-radius: 8px;
    padding: 14px 16px;
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
  }
  .stat-label {
    font-size: 13px;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stat-value.text-sm {
    font-size: 14px;
  }
  .stat-sub {
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 4px;
  }

  .filter-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
    padding: 12px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--surface-card);
    box-shadow: var(--shadow-sm);
  }
  .filter-form {
    display: grid;
    flex: 1;
    grid-template-columns:
      minmax(220px, 1.3fr) minmax(160px, 0.9fr) minmax(100px, 0.55fr) minmax(100px, 0.55fr)
      auto;
    gap: 10px;
    min-width: 0;
    margin-bottom: 0;
  }
  .filter-input,
  .filter-select {
    min-width: 0;
    min-height: 38px;
    padding: 0 12px;
    background: var(--surface-control);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }
  .filter-input:focus,
  .filter-select:focus {
    border-color: var(--border-focus);
  }
  .filter-select {
    cursor: pointer;
  }
  .btn-filter,
  .btn-import {
    min-height: var(--control-height-md);
    padding: 0 18px;
    background: var(--color-brand-primary);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-filter:hover,
  .btn-import:hover {
    background: var(--color-brand-primary-dark);
  }
  .btn-filter:disabled,
  .btn-import:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-muted);
    cursor: pointer;
  }
  .checkbox-label input {
    accent-color: var(--color-brand-primary);
  }

  .batch-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-info-overlay);
    border: 1px solid var(--color-info-border);
    border-radius: 10px;
    margin-bottom: 16px;
  }
  .batch-count {
    font-size: 14px;
    color: var(--text-link-hover);
  }
  .btn-batch-delete {
    padding: 8px 16px;
    background: var(--color-error-overlay);
    border: 1px solid var(--color-error-border);
    border-radius: 8px;
    color: var(--color-error-light);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-batch-delete:hover {
    background: var(--color-error-border);
  }
  .btn-batch-cancel {
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-batch-cancel:hover {
    background: var(--bg-tertiary);
  }

  .error-banner {
    padding: 12px 16px;
    background: var(--color-error-overlay);
    border: 1px solid var(--color-error-border);
    border-radius: 10px;
    color: var(--color-error-light);
    font-size: 14px;
    margin-bottom: 24px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 18px;
    margin-bottom: 24px;
  }
  .channel-list-wrapper,
  .import-panel,
  .detail-section {
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--surface-card);
    box-shadow: var(--shadow-sm);
  }
  .channel-list-wrapper {
    min-width: 0;
    padding: 16px;
  }
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
  }
  .select-all {
    font-size: 13px;
  }

  .loading-state {
    text-align: center;
    padding: 40px 0;
    color: var(--text-tertiary);
  }
  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: var(--text-tertiary);
  }

  .channel-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 640px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .channel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 10px;
    background: var(--surface-control);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    transition: all 0.2s;
  }
  .channel-item:hover {
    background: var(--surface-hover);
  }
  .channel-item--active {
    border-color: var(--border-focus);
    background: rgba(229, 9, 20, 0.08);
  }
  .channel-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .channel-checkbox input {
    accent-color: var(--color-brand-primary);
    width: 16px;
    height: 16px;
  }
  .channel-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    color: var(--text-primary);
    padding: 0;
    min-width: 0;
    gap: 12px;
  }

  .filter-input:focus,
  .filter-select:focus,
  .channel-content:focus-visible,
  .mini-item:focus-visible,
  .pagination button:focus-visible,
  .btn-filter:focus-visible,
  .btn-import:focus-visible,
  .btn-batch-delete:focus-visible,
  .btn-batch-cancel:focus-visible,
  .btn-play:focus-visible,
  .btn-validate:focus-visible,
  .btn-open:focus-visible,
  .btn-delete:focus-visible,
  .btn-close:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  .channel-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .channel-name {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .channel-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .channel-logo {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    object-fit: contain;
    flex-shrink: 0;
    background: var(--surface-muted);
  }
  .channel-meta {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .channel-tags {
    display: flex;
    gap: 6px;
    flex: 0 0 auto;
    align-items: center;
  }
  .tag-status {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
  }
  .tag--active {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }
  .tag--inactive {
    background: rgba(100, 116, 139, 0.15);
    color: var(--text-muted);
  }
  .tag-format {
    max-width: 70px;
    font-size: 11px;
    padding: 2px 8px;
    background: var(--bg-tertiary);
    border-radius: 6px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag-quality {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
  }
  .quality-high {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }
  .quality-medium {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  .quality-low {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 14px;
    color: var(--text-muted);
  }
  .pagination button {
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }
  .pagination button:hover {
    background: var(--bg-tertiary);
  }
  .pagination button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .import-panel {
    align-self: start;
    padding: 16px;
    position: sticky;
    top: 76px;
  }
  .import-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .import-msg {
    margin-top: 12px;
    padding: 10px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-link-hover);
  }
  .import-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 14px 0;
    color: var(--text-tertiary);
    font-size: 12px;
  }
  .import-divider::before,
  .import-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-primary);
  }
  .import-json-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .json-textarea {
    width: 100%;
    padding: 10px;
    background: var(--bg-card);
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 12px;
    font-family: monospace;
    resize: vertical;
    outline: none;
  }
  .json-textarea:focus {
    border-color: var(--border-focus);
  }
  .mini-list::-webkit-scrollbar {
    width: 4px;
  }
  .mini-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  .mini-list {
    margin-top: 20px;
    max-height: 320px;
    overflow-y: auto;
  }
  .mini-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .mini-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    background: var(--surface-control);
    border-radius: 8px;
    margin-bottom: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    color: var(--text-primary);
    border: none;
    text-align: left;
  }
  .mini-item:hover {
    background: var(--surface-hover);
  }
  .mini-meta {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  .player-section {
    margin-bottom: 24px;
    background: var(--bg-player);
    border-radius: 8px;
    overflow: hidden;
  }
  .player-wrapper {
    position: relative;
    aspect-ratio: 16 / 9;
  }
  .player-wrapper :deep(.art-player-container) {
    height: 100%;
    min-height: 0;
  }
  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    font-size: 14px;
  }
  .player-header span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 13px;
  }
  .btn-close:hover {
    color: var(--text-primary);
  }

  .detail-section {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 20px;
  }
  .detail-content {
    display: flex;
    gap: 24px;
    min-width: 0;
  }
  .detail-main {
    flex: 1;
    min-width: 0;
  }
  .detail-name {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .tag {
    padding: 4px 12px;
    background: rgba(229, 9, 20, 0.1);
    color: var(--text-link-hover);
    border-radius: var(--badge-radius);
    font-size: 12px;
  }
  .detail-url,
  .detail-desc {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 8px;
    word-break: break-all;
  }
  .detail-url strong,
  .detail-desc strong {
    color: var(--text-primary);
  }
  .detail-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 140px;
  }
  .btn-play,
  .btn-validate,
  .btn-open {
    min-height: var(--touch-target);
    padding: 0 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn-play {
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    color: white;
  }
  .btn-play:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  }
  .btn-validate {
    background: var(--color-success);
    color: white;
  }
  .btn-validate:hover {
    background: var(--color-success-dark);
  }
  .btn-validate:disabled {
    opacity: 0.5;
  }
  .btn-open {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-secondary);
  }
  .btn-open:hover {
    background: var(--bg-tertiary);
  }
  .btn-delete {
    min-height: var(--touch-target);
    padding: 0 20px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: var(--color-error-light);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  @media (max-width: 1024px) {
    .filter-section {
      align-items: stretch;
      flex-direction: column;
    }

    .filter-form {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    .btn-filter {
      grid-column: span 2;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }
    .import-panel {
      position: static;
    }
    .detail-content {
      flex-direction: column;
    }
    .detail-actions {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 640px) {
    .iptv-view {
      padding: 18px var(--page-gutter) 84px;
    }

    .iptv-title {
      font-size: 22px;
    }

    .stats-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .stat-card {
      padding: 10px 8px;
    }

    .stat-label,
    .stat-sub {
      font-size: 11px;
    }

    .stat-value {
      font-size: 18px;
    }

    .stat-value.text-sm {
      font-size: 13px;
    }

    .filter-section {
      gap: 10px;
      padding: 10px;
    }

    .filter-form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .filter-form .filter-input:first-child,
    .filter-select,
    .btn-filter {
      grid-column: 1 / -1;
    }

    .filter-input,
    .filter-select,
    .btn-filter,
    .btn-import {
      min-height: var(--touch-target);
    }

    .filter-section > .checkbox-label {
      min-height: var(--touch-target);
    }

    .content-grid {
      gap: 12px;
    }

    .channel-list-wrapper,
    .import-panel,
    .detail-section {
      padding: 12px;
    }

    .channel-list {
      max-height: none;
      padding-right: 0;
    }

    .channel-item {
      align-items: flex-start;
      gap: 10px;
      padding: 10px 8px;
    }

    .channel-content {
      align-items: stretch;
      flex-direction: column;
      gap: 8px;
    }

    .channel-tags {
      flex-wrap: wrap;
    }

    .batch-bar {
      flex-wrap: wrap;
      gap: 8px;
    }

    .btn-batch-delete,
    .btn-batch-cancel {
      min-height: 38px;
    }

    .detail-actions {
      flex-direction: column;
    }

    .btn-play,
    .btn-validate,
    .btn-open,
    .btn-delete {
      width: 100%;
    }
  }
</style>
