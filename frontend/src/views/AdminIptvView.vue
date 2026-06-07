<template>
  <div class="admin-iptv">
    <div class="page-header">
      <h1>IPTV管理</h1>
      <p class="subtitle">管理直播频道、源收集、质量测试和台标</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">TV</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalChannels }}</div>
          <div class="stat-label">总频道数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">ON</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeChannels }}</div>
          <div class="stat-label">活跃频道</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">GR</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalGroups }}</div>
          <div class="stat-label">频道分组</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">HQ</div>
        <div class="stat-content">
          <div class="stat-value">{{ qualityStats.highQuality }}</div>
          <div class="stat-label">高质量频道</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div class="actions-bar">
      <div class="action-group">
        <button class="btn btn-primary" @click="showImportDialog = true">导入频道</button>
        <button class="btn btn-secondary" @click="exportM3U">导出M3U</button>
        <button class="btn btn-secondary" @click="exportTxt">导出TXT</button>
      </div>
      <div class="action-group">
        <button class="btn btn-success" :disabled="collecting" @click="collectSources">
          {{ collecting ? '收集中...' : '收集直播源' }}
        </button>
        <button class="btn btn-warning" :disabled="testing" @click="testAllQuality">
          {{ testing ? '测试中...' : '质量测试' }}
        </button>
        <button class="btn btn-info" @click="matchLogos">匹配台标</button>
      </div>
    </div>

    <div v-if="pageError" class="admin-error">
      {{ pageError }}
    </div>

    <!-- Tab切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 频道列表 -->
    <div v-if="activeTab === 'channels'" class="tab-content">
      <div class="filters">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索频道..."
          class="search-input"
          @input="debounceSearch"
        />
        <select v-model="selectedGroup" class="filter-select" @change="loadChannels">
          <option value="">所有分组</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
        <select v-model="sortBy" class="filter-select" @change="loadChannels">
          <option value="name">按名称</option>
          <option value="qualityScore">按质量</option>
          <option value="viewCount">按观看次数</option>
          <option value="updatedAt">按更新时间</option>
        </select>
        <select v-model="activeFilter" class="filter-select" @change="loadChannels">
          <option value="all">全部状态</option>
          <option value="active">仅可用</option>
          <option value="inactive">仅不可用</option>
        </select>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>频道名称</th>
              <th>分组</th>
              <th>质量评分</th>
              <th>响应时间</th>
              <th>状态</th>
              <th>来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="channels.length === 0">
              <td colspan="7" class="empty-cell">暂无频道数据</td>
            </tr>
            <tr v-for="channel in channels" :key="channel.id">
              <td>
                <div class="channel-name">
                  <img v-if="channel.logo" :src="getLogoUrl(channel.logo)" class="channel-logo" />
                  <span>{{ channel.name }}</span>
                </div>
              </td>
              <td>{{ channel.group }}</td>
              <td>
                <span :class="['quality-badge', getQualityClass(channel.qualityScore)]">
                  {{ channel.qualityScore || 0 }}
                </span>
              </td>
              <td>{{ channel.responseTime ? `${channel.responseTime}ms` : '-' }}</td>
              <td>
                <span :class="['status-badge', channel.isActive ? 'active' : 'inactive']">
                  {{ channel.isActive ? '可用' : '不可用' }}
                </span>
              </td>
              <td>{{ channel.sourceName || '-' }}</td>
              <td>
                <div class="action-btns">
                  <button class="table-action" title="测试" @click="testChannel(channel.id)">
                    测试
                  </button>
                  <button class="table-action" title="编辑" @click="editChannel(channel)">
                    编辑
                  </button>
                  <button
                    class="table-action table-action--danger"
                    title="删除"
                    @click="deleteChannel(channel.id)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <button
          :disabled="currentPage <= 1"
          @click="
            currentPage--;
            loadChannels();
          "
        >
          上一页
        </button>
        <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button
          :disabled="currentPage >= totalPages"
          @click="
            currentPage++;
            loadChannels();
          "
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 直播源管理 -->
    <div v-if="activeTab === 'sources'" class="tab-content">
      <div class="sources-list">
        <div v-for="source in sources" :key="source.name" class="source-card">
          <div class="source-header">
            <h3>{{ source.name }}</h3>
            <span :class="['status-badge', source.enabled ? 'active' : 'inactive']">
              {{ source.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <p class="source-url">{{ source.url }}</p>
          <p class="source-desc">{{ source.description || '暂无描述' }}</p>
          <div class="source-actions">
            <button class="btn btn-sm" @click="toggleSource(source.name, !source.enabled)">
              {{ source.enabled ? '禁用' : '启用' }}
            </button>
            <button class="btn btn-sm btn-primary" @click="collectFromSource(source.name)">
              收集
            </button>
            <button class="btn btn-sm btn-danger" @click="removeSource(source.name)">删除</button>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" @click="showAddSourceDialog = true">添加直播源</button>
    </div>

    <!-- 质量统计 -->
    <div v-if="activeTab === 'quality'" class="tab-content">
      <div class="quality-stats">
        <div class="quality-card">
          <h3>高质量频道 (≥80分)</h3>
          <div class="quality-value high">{{ qualityStats.highQuality }}</div>
        </div>
        <div class="quality-card">
          <h3>中等质量 (60-79分)</h3>
          <div class="quality-value medium">{{ qualityStats.mediumQuality }}</div>
        </div>
        <div class="quality-card">
          <h3>低质量 (&lt;60分)</h3>
          <div class="quality-value low">{{ qualityStats.lowQuality }}</div>
        </div>
        <div class="quality-card">
          <h3>平均响应时间</h3>
          <div class="quality-value">{{ qualityStats.averageResponseTime }}ms</div>
        </div>
      </div>
      <button class="btn btn-warning" @click="disableLowQuality">禁用低质量频道</button>
    </div>

    <!-- 台标管理 -->
    <div v-if="activeTab === 'logos'" class="tab-content">
      <div class="logos-grid">
        <div v-for="logo in logos" :key="logo.id" class="logo-card">
          <img :src="getLogoUrl(logo.url)" :alt="logo.name" class="logo-image" />
          <div class="logo-info">
            <h4>{{ logo.name }}</h4>
            <p>{{ logo.category || '未分类' }}</p>
            <p>使用次数: {{ logo.usageCount }}</p>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" @click="initLogos">初始化预置台标</button>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportDialog" class="modal-overlay" @click.self="showImportDialog = false">
      <div class="modal">
        <h2>导入频道</h2>
        <div class="import-tabs">
          <button
            v-for="tab in importTabs"
            :key="tab.id"
            :class="['tab-btn', { active: importType === tab.id }]"
            @click="importType = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div v-if="importType === 'm3u'" class="import-form">
          <input v-model="importUrl" type="text" placeholder="M3U播放列表URL" class="input" />
          <input v-model="importGroup" type="text" placeholder="默认分组（可选）" class="input" />
        </div>
        <div v-if="importType === 'txt'" class="import-form">
          <textarea
            v-model="importContent"
            placeholder="每行一个频道，格式：频道名,URL"
            class="textarea"
          ></textarea>
          <input v-model="importGroup" type="text" placeholder="默认分组（可选）" class="input" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showImportDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleImport">导入</button>
        </div>
      </div>
    </div>

    <!-- 添加源弹窗 -->
    <div v-if="showAddSourceDialog" class="modal-overlay" @click.self="showAddSourceDialog = false">
      <div class="modal">
        <h2>添加直播源</h2>
        <div class="import-form">
          <input v-model="newSource.name" type="text" placeholder="源名称" class="input" />
          <input v-model="newSource.url" type="text" placeholder="M3U地址" class="input" />
          <input
            v-model="newSource.group"
            type="text"
            placeholder="默认分组（可选）"
            class="input"
          />
          <input
            v-model="newSource.description"
            type="text"
            placeholder="描述（可选）"
            class="input"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddSourceDialog = false">取消</button>
          <button class="btn btn-primary" @click="addSource">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { iptvApi } from '@/api/iptv';
  import type {
    IPTVChannel,
    IPTVStats,
    QualityStats,
    IptvSourceConfig,
    ChannelLogo,
  } from '@/api/iptv';

  const activeTab = ref('channels');
  const stats = ref<IPTVStats>({
    totalChannels: 0,
    activeChannels: 0,
    totalGroups: 0,
    popularChannels: [],
    recentChannels: [],
  });
  const qualityStats = ref<QualityStats>({
    totalChannels: 0,
    activeChannels: 0,
    highQuality: 0,
    mediumQuality: 0,
    lowQuality: 0,
    averageResponseTime: 0,
    neverChecked: 0,
  });
  const channels = ref<IPTVChannel[]>([]);
  const sources = ref<IptvSourceConfig[]>([]);
  const logos = ref<ChannelLogo[]>([]);
  const groups = ref<string[]>([]);

  const currentPage = ref(1);
  const totalPages = ref(1);
  const searchQuery = ref('');
  const selectedGroup = ref('');
  const sortBy = ref('name');
  const activeFilter = ref<'all' | 'active' | 'inactive'>('all');
  const pageError = ref('');

  const showImportDialog = ref(false);
  const showAddSourceDialog = ref(false);
  const importType = ref('m3u');
  const importUrl = ref('');
  const importContent = ref('');
  const importGroup = ref('');

  const collecting = ref(false);
  const testing = ref(false);

  const newSource = ref<IptvSourceConfig>({
    name: '',
    url: '',
    group: '',
    enabled: true,
    updateInterval: 24,
    description: '',
  });

  const tabs = [
    { id: 'channels', label: '频道管理' },
    { id: 'sources', label: '直播源' },
    { id: 'quality', label: '质量统计' },
    { id: 'logos', label: '台标管理' },
  ];

  const importTabs = [
    { id: 'm3u', label: 'M3U导入' },
    { id: 'txt', label: 'TXT导入' },
  ];

  let searchTimeout: ReturnType<typeof setTimeout>;

  const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage.value = 1;
      loadChannels();
    }, 300);
  };

  const getLogoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return iptvApi.getImageProxyUrl(url);
    }
    return url;
  };

  const getQualityClass = (score?: number) => {
    if (!score) return 'low';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const loadStats = async () => {
    try {
      pageError.value = '';
      const res = await iptvApi.getStats();
      if (res) stats.value = res;
    } catch (error) {
      console.error('加载统计失败:', error);
      pageError.value = getErrorMessage(error, '加载统计失败');
    }
  };

  const loadQualityStats = async () => {
    try {
      pageError.value = '';
      const res = await iptvApi.getQualityStats();
      if (res) qualityStats.value = res;
    } catch (error) {
      console.error('加载质量统计失败:', error);
      pageError.value = getErrorMessage(error, '加载质量统计失败');
    }
  };

  const loadChannels = async () => {
    try {
      pageError.value = '';
      const isActive = activeFilter.value === 'all' ? undefined : activeFilter.value === 'active';
      const res = await iptvApi.getChannels({
        page: currentPage.value,
        limit: 20,
        group: selectedGroup.value || undefined,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value,
        sortOrder: 'DESC',
        activeOnly: false,
        isActive,
      });
      if (res) {
        channels.value = res.data;
        totalPages.value = Math.max(res.totalPages, 1);
      }
    } catch (error) {
      console.error('加载频道失败:', error);
      pageError.value = getErrorMessage(error, '加载频道失败');
      channels.value = [];
    }
  };

  const loadGroups = async () => {
    try {
      pageError.value = '';
      const res = await iptvApi.getGroups();
      if (res) groups.value = res;
    } catch (error) {
      console.error('加载分组失败:', error);
      pageError.value = getErrorMessage(error, '加载分组失败');
    }
  };

  const loadSources = async () => {
    try {
      pageError.value = '';
      const res = await iptvApi.getSources();
      if (res) sources.value = res;
    } catch (error) {
      console.error('加载源失败:', error);
      pageError.value = getErrorMessage(error, '加载源失败');
    }
  };

  const loadLogos = async () => {
    try {
      pageError.value = '';
      const res = await iptvApi.getLogos();
      if (res) logos.value = res;
    } catch (error) {
      console.error('加载台标失败:', error);
      pageError.value = getErrorMessage(error, '加载台标失败');
    }
  };

  const collectSources = async () => {
    collecting.value = true;
    try {
      const res = await iptvApi.collectFromAllSources();
      alert(`收集完成: ${res?.newChannels || 0} 个新频道`);
      await loadStats();
      await loadChannels();
    } catch (error) {
      console.error('收集失败:', error);
      pageError.value = getErrorMessage(error, '收集失败');
      alert('收集失败');
    } finally {
      collecting.value = false;
    }
  };

  const collectFromSource = async (name: string) => {
    try {
      const res = await iptvApi.collectFromSource(name);
      alert(`收集完成: ${res?.newChannels || 0} 个新频道`);
      await loadStats();
    } catch (error) {
      console.error('收集失败:', error);
      pageError.value = getErrorMessage(error, '收集失败');
    }
  };

  const testAllQuality = async () => {
    testing.value = true;
    try {
      const res = await iptvApi.testAllChannelsQuality();
      alert(`测试完成: ${res?.available || 0} 可用, ${res?.unavailable || 0} 不可用`);
      await loadQualityStats();
      await loadChannels();
    } catch (error) {
      console.error('测试失败:', error);
      pageError.value = getErrorMessage(error, '测试失败');
      alert('测试失败');
    } finally {
      testing.value = false;
    }
  };

  const testChannel = async (id: number) => {
    try {
      const res = await iptvApi.testChannelQuality(id);
      alert(res?.isAvailable ? '频道可用' : '频道不可用');
      await loadChannels();
    } catch (error) {
      console.error('测试失败:', error);
      pageError.value = getErrorMessage(error, '测试失败');
    }
  };

  const matchLogos = async () => {
    try {
      const res = await iptvApi.matchLogos();
      const matched = res?.filter(r => r.matched).length || 0;
      alert(`匹配完成: ${matched} 个频道匹配成功`);
      await loadChannels();
    } catch (error) {
      console.error('匹配失败:', error);
      pageError.value = getErrorMessage(error, '匹配失败');
    }
  };

  const initLogos = async () => {
    try {
      const res = await iptvApi.initLogos();
      alert(`初始化完成: ${res?.initializedCount || 0} 个台标`);
      await loadLogos();
    } catch (error) {
      console.error('初始化失败:', error);
      pageError.value = getErrorMessage(error, '初始化失败');
    }
  };

  const handleImport = async () => {
    try {
      if (importType.value === 'm3u') {
        await iptvApi.importFromM3U(importUrl.value, importGroup.value || undefined);
      } else {
        await iptvApi.importFromTxt(importContent.value, importGroup.value || undefined);
      }
      alert('导入成功');
      showImportDialog.value = false;
      await loadStats();
      await loadChannels();
    } catch (error) {
      console.error('导入失败:', error);
      pageError.value = getErrorMessage(error, '导入失败');
      alert('导入失败');
    }
  };

  const addSource = async () => {
    try {
      await iptvApi.addSource(newSource.value);
      alert('添加成功');
      showAddSourceDialog.value = false;
      await loadSources();
    } catch (error) {
      console.error('添加失败:', error);
      pageError.value = getErrorMessage(error, '添加失败');
    }
  };

  const toggleSource = async (name: string, enabled: boolean) => {
    try {
      await iptvApi.toggleSource(name, enabled);
      await loadSources();
    } catch (error) {
      console.error('操作失败:', error);
      pageError.value = getErrorMessage(error, '操作失败');
    }
  };

  const removeSource = async (name: string) => {
    if (!confirm(`确定删除源 ${name}？`)) return;
    try {
      await iptvApi.removeSource(name);
      await loadSources();
    } catch (error) {
      console.error('删除失败:', error);
      pageError.value = getErrorMessage(error, '删除失败');
    }
  };

  const editChannel = (channel: IPTVChannel) => {
    // TODO: 实现编辑功能
    console.log('编辑频道:', channel);
  };

  const deleteChannel = async (id: number) => {
    if (!confirm('确定删除该频道？')) return;
    try {
      await iptvApi.deleteChannel(id);
      await loadStats();
      await loadChannels();
    } catch (error) {
      console.error('删除失败:', error);
      pageError.value = getErrorMessage(error, '删除失败');
    }
  };

  const disableLowQuality = async () => {
    if (!confirm('确定禁用所有低质量频道？')) return;
    try {
      const res = await iptvApi.disableLowQualityChannels(30);
      alert(`已禁用 ${res?.disabledCount || 0} 个频道`);
      await loadQualityStats();
      await loadChannels();
    } catch (error) {
      console.error('操作失败:', error);
      pageError.value = getErrorMessage(error, '操作失败');
    }
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return fallback;
  };

  const exportM3U = () => {
    window.open(iptvApi.exportM3U(selectedGroup.value || undefined), '_blank');
  };

  const exportTxt = () => {
    window.open(iptvApi.exportTxt(selectedGroup.value || undefined), '_blank');
  };

  onMounted(() => {
    loadStats();
    loadQualityStats();
    loadChannels();
    loadGroups();
    loadSources();
    loadLogos();
  });
</script>

<style scoped>
  .admin-iptv {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .page-header h1 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  }

  .page-header .subtitle {
    margin: 8px 0 0;
    color: var(--admin-text-muted);
    font-size: 13px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .stat-card,
  .source-card,
  .quality-card,
  .logo-card,
  .modal {
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: var(--admin-bg-card);
    box-shadow: var(--admin-shadow);
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
  }

  .stat-icon {
    display: inline-flex;
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(229, 9, 20, 0.1);
    color: var(--color-brand-primary);
    font-size: 12px;
    font-weight: 800;
  }

  .stat-value {
    color: var(--admin-text-primary);
    font-size: 26px;
    font-weight: 750;
    line-height: 1;
  }

  .stat-label {
    margin-top: 5px;
    color: var(--admin-text-muted);
    font-size: 12px;
  }

  .actions-bar,
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: var(--admin-bg-card);
  }

  .admin-error {
    padding: 11px 13px;
    border: 1px solid var(--color-error-border);
    border-radius: 8px;
    background: var(--color-error-overlay);
    color: var(--color-error-light);
    font-size: 13px;
  }

  .actions-bar {
    justify-content: space-between;
  }

  .action-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .btn {
    display: inline-flex;
    min-height: 36px;
    align-items: center;
    justify-content: center;
    padding: 0 13px;
    border: 1px solid transparent;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 650;
    line-height: 1;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.52;
  }

  .btn-primary {
    background: var(--color-brand-primary);
    color: white;
  }

  .btn-secondary {
    border-color: var(--admin-border);
    background: var(--surface-muted);
    color: var(--admin-text-primary);
  }

  .btn-success {
    background: var(--color-success);
    color: white;
  }

  .btn-warning {
    background: var(--color-warning);
    color: #111827;
  }

  .btn-info {
    background: var(--color-info);
    color: white;
  }

  .btn-danger {
    background: var(--color-danger);
    color: white;
  }

  .btn-sm {
    min-height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .btn:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
  }

  .tabs,
  .import-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tabs {
    padding: 5px;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: var(--admin-bg-card);
  }

  .tab-btn {
    min-height: 34px;
    padding: 0 14px;
    border-radius: 7px;
    background: transparent;
    color: var(--admin-text-muted);
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }

  .tab-btn.active {
    background: rgba(229, 9, 20, 0.11);
    color: var(--color-brand-primary);
    box-shadow: inset 0 0 0 1px rgba(229, 9, 20, 0.18);
  }

  .tab-content {
    min-height: 400px;
  }

  .search-input,
  .filter-select,
  .input,
  .textarea {
    min-height: 38px;
    padding: 0 12px;
    border: 1px solid var(--admin-border);
    border-radius: 7px;
    background: var(--admin-bg-shell);
    color: var(--admin-text-primary);
    font-size: 13px;
  }

  .search-input:focus,
  .filter-select:focus,
  .input:focus,
  .textarea:focus {
    border-color: var(--border-focus);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  .search-input {
    flex: 1;
    min-width: 240px;
  }

  .filter-select {
    width: auto;
    min-width: 150px;
  }

  .textarea {
    width: 100%;
    min-height: 112px;
    padding-top: 10px;
    resize: vertical;
  }

  .table-container {
    overflow-x: auto;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: var(--admin-bg-card);
  }

  .data-table {
    width: 100%;
    min-width: 860px;
    border-collapse: collapse;
    color: var(--admin-text-primary);
    font-size: 13px;
  }

  .data-table th,
  .data-table td {
    height: 50px;
    padding: 0 14px;
    border-bottom: 1px solid var(--admin-border);
    text-align: left;
    vertical-align: middle;
  }

  .empty-cell {
    height: 120px;
    color: var(--admin-text-muted);
    text-align: center;
  }

  .data-table th {
    background: rgba(127, 135, 148, 0.08);
    color: var(--admin-text-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .data-table tbody tr:hover {
    background: rgba(127, 135, 148, 0.06);
  }

  .channel-name {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 650;
  }

  .channel-logo {
    width: 28px;
    height: 28px;
    border: 1px solid var(--admin-border);
    border-radius: 6px;
    background: white;
    object-fit: contain;
  }

  .quality-badge,
  .status-badge {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }

  .quality-badge.high,
  .status-badge.active {
    background: var(--color-success-overlay);
    color: var(--color-success);
  }

  .quality-badge.medium {
    background: var(--color-warning-overlay);
    color: var(--color-warning);
  }

  .quality-badge.low,
  .status-badge.inactive {
    background: var(--color-error-overlay);
    color: var(--color-error);
  }

  .action-btns,
  .source-actions,
  .modal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .table-action {
    min-height: 28px;
    padding: 0 9px;
    border: 1px solid var(--admin-border);
    border-radius: 6px;
    background: var(--admin-bg-shell);
    color: var(--admin-text-secondary);
    font-size: 12px;
    font-weight: 650;
  }

  .table-action:hover {
    color: var(--color-brand-primary);
    border-color: rgba(229, 9, 20, 0.26);
  }

  .table-action--danger:hover {
    color: var(--color-error);
    border-color: var(--color-error-border);
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    color: var(--admin-text-muted);
    font-size: 13px;
  }

  .pagination button {
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid var(--admin-border);
    border-radius: 7px;
    background: var(--admin-bg-card);
    color: var(--admin-text-primary);
  }

  .pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .sources-list,
  .quality-stats,
  .logos-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }

  .sources-list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .quality-stats {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }

  .logos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .source-card,
  .quality-card,
  .logo-card {
    padding: 16px;
  }

  .source-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .source-header h3 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 15px;
  }

  .source-url {
    margin: 0 0 8px;
    color: var(--admin-text-muted);
    font-size: 12px;
    line-height: 1.5;
    word-break: break-all;
  }

  .source-desc {
    margin: 0 0 14px;
    color: var(--admin-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  .quality-card {
    text-align: center;
  }

  .quality-card h3 {
    margin: 0 0 12px;
    color: var(--admin-text-muted);
    font-size: 13px;
    font-weight: 650;
  }

  .quality-value {
    color: var(--admin-text-primary);
    font-size: 32px;
    font-weight: 750;
    line-height: 1;
  }

  .quality-value.high {
    color: var(--color-success);
  }

  .quality-value.medium {
    color: var(--color-warning);
  }

  .quality-value.low {
    color: var(--color-error);
  }

  .logo-card {
    text-align: center;
  }

  .logo-image {
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin-bottom: 10px;
  }

  .logo-info h4 {
    margin: 0 0 5px;
    color: var(--admin-text-primary);
    font-size: 14px;
  }

  .logo-info p {
    margin: 0;
    color: var(--admin-text-muted);
    font-size: 12px;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal {
    width: min(520px, 100%);
    padding: 20px;
  }

  .modal h2 {
    margin: 0 0 16px;
    color: var(--admin-text-primary);
    font-size: 18px;
  }

  .import-tabs {
    margin-bottom: 14px;
  }

  .import-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .modal-actions {
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .page-header,
    .actions-bar {
      align-items: stretch;
      flex-direction: column;
    }

    .action-group,
    .filters {
      align-items: stretch;
      flex-direction: column;
    }

    .search-input,
    .filter-select {
      width: 100%;
      min-width: 0;
    }
  }
</style>
