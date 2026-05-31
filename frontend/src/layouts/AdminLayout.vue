<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar" :class="{ 'admin-layout__sidebar--open': sidebarOpen }">
      <div class="admin-layout__sidebar-header">
        <router-link to="/" class="admin-layout__sidebar-brand">
          <span class="admin-layout__sidebar-brand-icon">N</span>
          <span class="admin-layout__sidebar-brand-text">Nest TV</span>
        </router-link>
        <span class="admin-layout__sidebar-badge">Admin</span>
      </div>
      <nav class="admin-layout__nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="admin-layout__nav-item"
          :class="{ 'admin-layout__nav-item--active': isActive(item.path) }"
        >
          <span class="admin-layout__nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="admin-layout__nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="admin-layout__sidebar-footer">
        <router-link to="/" class="admin-layout__nav-item">
          <span class="admin-layout__nav-icon" aria-hidden="true">←</span>
          <span class="admin-layout__nav-text">返回首页</span>
        </router-link>
        <button class="admin-layout__nav-item admin-layout__nav-item--logout" @click="handleLogout">
          <span class="admin-layout__nav-icon" aria-hidden="true">×</span>
          <span class="admin-layout__nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <main class="admin-layout__main">
      <header class="admin-layout__header">
        <div class="admin-layout__header-left">
          <button class="admin-layout__menu-toggle" @click="toggleSidebar">
            <span class="admin-layout__menu-icon">≡</span>
          </button>
          <h1 class="admin-layout__page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="admin-layout__header-right">
          <router-link to="/" class="admin-layout__home-btn">
            <span>←</span>
            <span>返回首页</span>
          </router-link>
        </div>
      </header>
      <div class="admin-layout__content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const sidebarOpen = ref(true);

  const navItems = [
    { path: '/admin', title: '仪表盘', icon: 'D' },
    { path: '/admin/users', title: '用户管理', icon: 'U' },
    { path: '/admin/media', title: '媒体管理', icon: 'M' },
    { path: '/admin/play-sources', title: '播放源管理', icon: 'P' },
    { path: '/admin/iptv', title: 'IPTV 管理', icon: 'T' },
    { path: '/admin/crawler', title: '数据采集', icon: 'C' },
    { path: '/admin/crawler-targets', title: '数据源管理', icon: 'S' },
    { path: '/admin/play-sources-overview', title: '播放源一览', icon: 'O' },
    { path: '/admin/download-tasks', title: '下载任务', icon: 'Q' },
    { path: '/admin/watch-history', title: '观看历史', icon: 'H' },
    { path: '/admin/logs', title: '系统日志', icon: 'L' },
    { path: '/admin/danmaku', title: '弹幕管理', icon: 'B' },
    { path: '/admin/source-scripts', title: '源脚本', icon: 'R' },
    { path: '/admin/roles', title: '角色权限', icon: 'A' },
  ];

  const currentPageTitle = computed(() => {
    const activeItem = navItems.find(item => isActive(item.path));
    return activeItem ? activeItem.title : '管理后台';
  });

  const isActive = (path: string) => {
    if (path === '/admin') return route.path === '/admin';
    return route.path === path || route.path.startsWith(path + '/');
  };

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };
</script>

<style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.03), transparent 180px),
      var(--admin-bg-page);
    color: var(--admin-text-primary);
  }

  /* 自定义滚动条 */
  .admin-layout ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .admin-layout ::-webkit-scrollbar-track {
    background: transparent;
  }

  .admin-layout ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }

  .admin-layout ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .admin-layout__sidebar {
    width: 248px;
    background:
      linear-gradient(180deg, rgba(229, 9, 20, 0.08), transparent 220px),
      var(--admin-bg-sidebar);
    color: var(--admin-sidebar-text);
    transition: all 0.3s ease;
    border-right: 1px solid var(--admin-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .admin-layout__sidebar-header {
    padding: 18px;
    border-bottom: 1px solid var(--admin-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .admin-layout__sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: white;
  }

  .admin-layout__sidebar-brand-icon {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    background: var(--color-brand-primary);
    color: white;
    font-size: 0.9rem;
    font-weight: 800;
  }

  .admin-layout__sidebar-brand-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0;
  }

  .admin-layout__sidebar-badge {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0;
    background: rgba(229, 9, 20, 0.14);
    color: var(--color-brand-primary-light);
    padding: 2px 8px;
    border-radius: 5px;
  }

  .admin-layout__nav {
    padding: 12px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .admin-layout__nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 38px;
    padding: 0 10px;
    text-decoration: none;
    color: var(--admin-sidebar-muted);
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 3px;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .admin-layout__nav-item:hover {
    background: var(--admin-bg-sidebar-hover);
    color: var(--admin-sidebar-text);
  }

  .admin-layout__nav-item--active {
    background: rgba(229, 9, 20, 0.16);
    color: var(--color-brand-primary-light);
    box-shadow:
      inset 3px 0 0 var(--color-brand-primary),
      inset 0 0 0 1px rgba(229, 9, 20, 0.18);
  }

  .admin-layout__nav-item--logout {
    color: var(--color-error-light);
  }

  .admin-layout__nav-item--logout:hover {
    background: var(--color-error-overlay);
    color: var(--color-error-light);
  }

  .admin-layout__nav-icon {
    display: inline-flex;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.055);
    font-size: 0.72rem;
    font-weight: 700;
    color: currentColor;
    opacity: 0.82;
    line-height: 1;
  }

  .admin-layout__sidebar-footer {
    padding: 8px;
    border-top: 1px solid var(--admin-border);
  }

  .admin-layout__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background: var(--admin-bg-page);
  }

  .admin-layout__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 60px;
    background: var(--admin-bg-shell);
    border-bottom: 1px solid var(--admin-border);
    z-index: 100;
    flex-shrink: 0;
  }

  .admin-layout__header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .admin-layout__header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .admin-layout__home-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 12px;
    background: rgba(229, 9, 20, 0.09);
    border: 1px solid var(--color-brand-border);
    border-radius: 7px;
    color: var(--color-brand-primary-light);
    font-size: 12px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .admin-layout__home-btn:hover {
    background: var(--surface-hover);
    color: var(--color-brand-accent-light);
  }

  .admin-layout__menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: var(--surface-muted);
    border: 1px solid var(--admin-border);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px;
    color: var(--admin-text-muted);
    border-radius: 6px;
    transition: all 0.15s;
  }

  .admin-layout__menu-toggle:hover {
    background: var(--surface-hover);
    color: var(--admin-text-primary);
  }

  .admin-layout__page-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--admin-text-primary);
  }

  .admin-layout__content {
    flex: 1;
    padding: 22px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    .admin-layout__sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transform: translateX(-100%);
      box-shadow: var(--admin-shadow);
    }

    .admin-layout__sidebar--open {
      transform: translateX(0);
    }

    .admin-layout__main {
      margin-left: 0;
    }

    .admin-layout__header {
      padding: 0 var(--spacing-4);
    }

    .admin-layout__content {
      padding: var(--spacing-4);
    }

    .admin-layout__home-btn span:last-child {
      display: none;
    }
  }

  :deep(.el-card),
  :deep(.el-table),
  :deep(.el-form),
  :deep(.el-dialog),
  :deep(.el-drawer) {
    border-color: var(--admin-border);
  }

  :deep(.el-card) {
    border-radius: var(--panel-radius);
    box-shadow: var(--admin-shadow);
  }

  :deep(.el-button) {
    border-radius: var(--radius-control);
  }

  :deep(.el-table) {
    border-radius: var(--panel-radius);
    overflow: hidden;
  }
</style>
