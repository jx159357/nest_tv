<template>
  <div class="admin-layout">
    <aside
      class="admin-layout__sidebar"
      :class="{ 'admin-layout__sidebar--open': sidebarOpen }"
      :style="sidebarStyle"
    >
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
          @click="closeSidebarOnMobile"
        >
          <span class="admin-layout__nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="admin-layout__nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="admin-layout__sidebar-footer">
        <router-link to="/" class="admin-layout__nav-item" @click="closeSidebarOnMobile">
          <span class="admin-layout__nav-icon" aria-hidden="true">←</span>
          <span class="admin-layout__nav-text">返回首页</span>
        </router-link>
        <button
          class="admin-layout__nav-item admin-layout__nav-item--logout"
          type="button"
          @click="handleLogout"
        >
          <span class="admin-layout__nav-icon" aria-hidden="true">×</span>
          <span class="admin-layout__nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <button
      v-if="sidebarOpen"
      class="admin-layout__scrim"
      type="button"
      aria-label="关闭侧边栏"
      @click="sidebarOpen = false"
    ></button>

    <main class="admin-layout__main">
      <header class="admin-layout__header">
        <div class="admin-layout__header-left">
          <button
            class="admin-layout__menu-toggle"
            type="button"
            aria-label="打开或关闭侧边栏"
            @click="toggleSidebar"
          >
            <span class="admin-layout__menu-icon">≡</span>
          </button>
          <h1 class="admin-layout__page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="admin-layout__header-right">
          <button
            class="admin-layout__theme-btn"
            type="button"
            :class="{ 'admin-layout__theme-btn--system': isSystemTheme }"
            :title="themeToggleLabel"
            :aria-label="themeToggleLabel"
            @click="toggleTheme"
          >
            <svg
              v-if="isSystemTheme"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M8 20h8" />
              <path d="M12 16v4" />
            </svg>
            <svg
              v-else-if="isDark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <router-link to="/" class="admin-layout__home-btn">
            <span>←</span>
            <span>返回首页</span>
          </router-link>
        </div>
      </header>
      <div class="admin-layout__content">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <component :is="Component" :key="viewRoute.fullPath" />
        </RouterView>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useTheme } from '@/composables/useTheme';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const { theme, isDark, isSystemTheme, toggleTheme } = useTheme();

  const sidebarOpen = ref(false);
  const isMobileSidebar = ref(false);
  let sidebarMediaQuery: MediaQueryList | null = null;
  const adminRootClass = 'admin-layout-active';

  const sidebarStyle = computed(() => {
    if (!isMobileSidebar.value) return {};

    return {
      left: sidebarOpen.value ? '0' : 'calc(-1 * min(86vw, 280px))',
      transform: 'none',
    };
  });

  const themeToggleLabel = computed(() => {
    if (theme.value === 'dark') return '当前深色模式，切换到浅色模式';
    if (theme.value === 'light') return '当前浅色模式，切换到跟随系统';
    return '当前跟随系统，切换到深色模式';
  });

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

  const closeSidebarOnMobile = () => {
    if (isMobileSidebar.value) {
      sidebarOpen.value = false;
    }
  };

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };

  const syncSidebarMode = () => {
    if (typeof window === 'undefined') return;

    isMobileSidebar.value = sidebarMediaQuery?.matches ?? window.innerWidth <= 768;

    if (!isMobileSidebar.value) {
      sidebarOpen.value = false;
    }
  };

  onMounted(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.classList.add(adminRootClass);
    sidebarMediaQuery = window.matchMedia('(max-width: 768px)');
    syncSidebarMode();
    sidebarMediaQuery.addEventListener('change', syncSidebarMode);
  });

  onBeforeUnmount(() => {
    sidebarMediaQuery?.removeEventListener('change', syncSidebarMode);
    sidebarMediaQuery = null;
    document.documentElement.classList.remove(adminRootClass);
  });
</script>

<style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--admin-bg-page);
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
    background: var(--admin-scrollbar-thumb);
    border-radius: 3px;
  }

  .admin-layout ::-webkit-scrollbar-thumb:hover {
    background: var(--admin-scrollbar-thumb-hover);
  }

  .admin-layout__sidebar {
    width: 248px;
    background: var(--admin-bg-sidebar);
    color: var(--admin-sidebar-text);
    transition:
      left 0.22s ease,
      transform 0.22s ease,
      box-shadow 0.22s ease,
      background-color 0.22s ease,
      border-color 0.22s ease;
    border-right: 1px solid var(--admin-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    min-height: 100vh;
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

  .admin-layout__nav-item:focus-visible,
  .admin-layout__menu-toggle:focus-visible,
  .admin-layout__theme-btn:focus-visible,
  .admin-layout__home-btn:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
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

  .admin-layout__scrim {
    display: none;
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
    min-width: 0;
  }

  .admin-layout__header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
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

  .admin-layout__theme-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--admin-border);
    border-radius: 7px;
    background: var(--surface-muted);
    color: var(--admin-text-muted);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .admin-layout__theme-btn svg {
    width: 18px;
    height: 18px;
  }

  .admin-layout__theme-btn:hover {
    border-color: var(--border-secondary);
    background: var(--surface-hover);
    color: var(--admin-text-primary);
  }

  .admin-layout__theme-btn--system {
    color: var(--color-brand-primary-light);
    border-color: var(--color-brand-border);
    box-shadow: 0 0 0 3px var(--color-brand-overlay);
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-layout__content {
    flex: 1;
    padding: clamp(16px, 2vw, 24px);
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
    overscroll-behavior: contain;
  }

  @media (min-width: 769px) {
    .admin-layout__sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
    }
  }

  @media (max-width: 768px) {
    :global(html.admin-layout-active) {
      min-width: 0 !important;
      scrollbar-gutter: auto !important;
    }

    .admin-layout__scrim {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: min(86vw, 280px);
      z-index: 900;
      display: block;
      background: rgba(0, 0, 0, 0.48);
      backdrop-filter: blur(2px);
    }

    .admin-layout__sidebar {
      position: fixed;
      left: calc(-1 * min(86vw, 280px));
      top: 0;
      bottom: 0;
      width: min(86vw, 280px);
      z-index: 1000;
      transform: none;
      transition: none;
      box-shadow: var(--admin-shadow);
      will-change: left;
    }

    .admin-layout__sidebar.admin-layout__sidebar--open {
      left: 0;
      transform: none;
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

    .admin-layout__menu-toggle,
    .admin-layout__theme-btn,
    .admin-layout__home-btn {
      width: var(--touch-target);
      height: var(--touch-target);
      min-height: var(--touch-target);
      padding: 0;
    }

    .admin-layout__home-btn span:last-child {
      display: none;
    }

    .admin-layout__nav-item {
      min-height: var(--touch-target);
      padding: 0 12px;
    }

    .admin-layout__nav-icon {
      width: 24px;
      height: 24px;
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

  :deep(.space-y-6),
  :deep(.dashboard),
  :deep(.admin-page) {
    min-width: 0;
    max-width: 100%;
  }

  :deep(.admin-card),
  :deep(.content-card),
  :deep(.content-panel),
  :deep(.stat-card),
  :deep(.table-container),
  :deep(.data-table-wrap),
  :deep(.logs-card),
  :deep(.logs-table-wrap),
  :deep(.dt-stat-card),
  :deep(.dt-section-card),
  :deep(.src-card),
  :deep(.src-empty-card),
  :deep(.dm-stat-card),
  :deep(.dm-section),
  :deep(.dashboard__stat-card),
  :deep(.dashboard__monitor-panel),
  :deep(.dashboard__sources-panel),
  :deep(.dashboard__activity-section),
  :deep(.dashboard__health-section) {
    border-color: var(--admin-border);
    box-shadow: var(--admin-shadow);
  }

  :deep(.admin-card),
  :deep(.content-card),
  :deep(.content-panel),
  :deep(.stat-card),
  :deep(.table-container),
  :deep(.data-table-wrap),
  :deep(.logs-card),
  :deep(.logs-table-wrap),
  :deep(.dt-stat-card),
  :deep(.dt-section-card),
  :deep(.src-card),
  :deep(.src-empty-card),
  :deep(.dm-stat-card),
  :deep(.dm-section) {
    background: var(--admin-bg-card) !important;
    border-radius: var(--panel-radius) !important;
  }

  :deep(.rounded-xl),
  :deep(.rounded-2xl) {
    border-radius: var(--panel-radius) !important;
  }

  :deep(.shadow-lg),
  :deep(.shadow-xl),
  :deep(.shadow-2xl) {
    box-shadow: var(--admin-shadow) !important;
  }

  :deep(.overflow-x-auto),
  :deep(.table-container),
  :deep(.data-table-wrap),
  :deep(.logs-table-wrap) {
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    scrollbar-gutter: stable;
  }

  :deep(.admin-table),
  :deep(.data-table),
  :deep(.table-base),
  :deep(.logs-table),
  :deep(.dt-table),
  :deep(.table-divide),
  :deep(.table-divider) {
    min-width: 760px;
  }

  :deep(.admin-input),
  :deep(.search-input),
  :deep(.filter-input),
  :deep(.filter-select),
  :deep(.dt-input),
  :deep(.logs-input),
  :deep(.dm-input),
  :deep(.dm-select),
  :deep(.dm-textarea),
  :deep(.src-input),
  :deep(.input),
  :deep(.textarea),
  :deep(.form-input) {
    max-width: 100%;
    min-height: 38px;
    border-color: var(--admin-border) !important;
    border-radius: var(--radius-control) !important;
    background: var(--admin-bg-shell) !important;
    color: var(--admin-text-primary) !important;
  }

  :deep(.admin-input:focus),
  :deep(.search-input:focus),
  :deep(.filter-input:focus),
  :deep(.filter-select:focus),
  :deep(.dt-input:focus),
  :deep(.logs-input:focus),
  :deep(.dm-input:focus),
  :deep(.dm-select:focus),
  :deep(.dm-textarea:focus),
  :deep(.src-input:focus),
  :deep(.input:focus),
  :deep(.textarea:focus),
  :deep(.form-input:focus) {
    border-color: var(--border-focus) !important;
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  :deep(.btn),
  :deep(.btn-primary),
  :deep(.btn-secondary),
  :deep(.btn-success),
  :deep(.btn-ghost),
  :deep(.admin-btn-primary),
  :deep(.logs-btn-primary),
  :deep(.dt-btn-primary),
  :deep(.dt-btn-secondary),
  :deep(.src-btn-primary),
  :deep(.src-btn-ghost),
  :deep(.src-btn-danger) {
    min-height: 38px;
    border-radius: var(--radius-control) !important;
  }

  :deep(.admin-pagination) {
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    :deep(.admin-layout__content > .space-y-6 > .flex:first-child) {
      align-items: stretch !important;
      flex-direction: column !important;
    }

    :deep(.admin-layout__content > .space-y-6 > .flex:first-child > .flex:last-child) {
      width: 100%;
      align-items: stretch;
      flex-direction: column;
    }

    :deep(.admin-layout__content > .space-y-6 > .flex:first-child > .flex:last-child > *) {
      width: 100%;
      min-height: var(--touch-target);
    }

    :deep(.admin-input),
    :deep(.search-input),
    :deep(.filter-input),
    :deep(.filter-select),
    :deep(.dt-input),
    :deep(.logs-input),
    :deep(.dm-input),
    :deep(.dm-select),
    :deep(.dm-textarea),
    :deep(.src-input),
    :deep(.input),
    :deep(.textarea),
    :deep(.form-input) {
      width: 100% !important;
      min-height: var(--touch-target);
    }

    :deep(.admin-pagination),
    :deep(.pagination-bar),
    :deep(.dt-pagination),
    :deep(.logs-pagination),
    :deep(.table-footer),
    :deep(.pagination) {
      align-items: stretch;
      flex-direction: column;
    }

    :deep(.admin-page-btn),
    :deep(.page-btn),
    :deep(.dt-page-btn),
    :deep(.logs-pagination-btn),
    :deep(.pagination-btn),
    :deep(.pagination button) {
      min-height: var(--touch-target);
      width: 100%;
    }

    :deep(.admin-btn-primary),
    :deep(.dt-btn-primary),
    :deep(.dt-btn-secondary),
    :deep(.logs-btn-primary) {
      width: 100%;
      min-height: var(--touch-target);
    }
  }
</style>
