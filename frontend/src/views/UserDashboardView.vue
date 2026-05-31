<template>
  <div class="user-dashboard">
    <aside class="user-dashboard__sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">用户中心</h2>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/" class="back-link">返回首页</router-link>
      </div>
    </aside>

    <main class="user-dashboard__content">
      <div v-if="activeTab === 'overview'" class="content-section">
        <h3 class="section-title">概览</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.watchCount }}</div>
            <div class="stat-label">观看记录</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.favoriteCount }}</div>
            <div class="stat-label">收藏数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.sourceCount }}</div>
            <div class="stat-label">自定义源</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'sources'" class="content-section">
        <h3 class="section-title">我的视频源</h3>
        <p class="section-desc">管理您添加的自定义视频源，这些源仅对您可见。</p>
        <div class="source-list">
          <div class="empty-state">
            <p>暂无自定义源</p>
            <span>后续版本将支持添加自定义视频源</span>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="content-section">
        <h3 class="section-title">观看历史</h3>
        <router-link to="/watch-history" class="detail-link">查看完整历史</router-link>
      </div>

      <div v-else-if="activeTab === 'favorites'" class="content-section">
        <h3 class="section-title">我的收藏</h3>
        <router-link to="/favorites" class="detail-link">查看全部收藏</router-link>
      </div>

      <div v-else-if="activeTab === 'settings'" class="content-section">
        <h3 class="section-title">个人设置</h3>
        <router-link to="/settings" class="detail-link">前往设置页面</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';

  const activeTab = ref('overview');

  const tabs = [
    { key: 'overview', label: '概览', icon: '📊' },
    { key: 'sources', label: '我的源', icon: '📡' },
    { key: 'history', label: '观看历史', icon: '⏱️' },
    { key: 'favorites', label: '我的收藏', icon: '❤️' },
    { key: 'settings', label: '设置', icon: '⚙️' },
  ];

  const stats = reactive({
    watchCount: 0,
    favoriteCount: 0,
    sourceCount: 0,
  });
</script>

<style scoped>
  .user-dashboard {
    display: flex;
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
  }

  .user-dashboard__sidebar {
    width: 220px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-primary);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-primary);
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    background: var(--border-primary);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: rgba(229, 9, 20, 0.1);
    color: var(--color-brand-primary);
  }

  .nav-icon {
    font-size: 16px;
  }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border-primary);
  }

  .back-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13px;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--text-primary);
  }

  .user-dashboard__content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .content-section {
    max-width: 800px;
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .section-desc {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 20px;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-brand-primary);
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
  }

  .empty-state p {
    font-size: 15px;
    margin-bottom: 8px;
  }

  .empty-state span {
    font-size: 13px;
  }

  .detail-link {
    display: inline-block;
    margin-top: 12px;
    color: var(--color-brand-primary);
    text-decoration: none;
    font-size: 14px;
  }

  .detail-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .user-dashboard {
      flex-direction: column;
    }

    .user-dashboard__sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--border-primary);
    }

    .sidebar-nav {
      flex-direction: row;
      overflow-x: auto;
      padding: 8px;
    }

    .nav-item {
      white-space: nowrap;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
