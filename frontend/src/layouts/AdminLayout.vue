<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar" :class="{ 'admin-layout__sidebar--open': sidebarOpen }">
      <div class="admin-layout__sidebar-header">
        <router-link to="/" class="admin-layout__sidebar-brand">
          <span class="admin-layout__sidebar-brand-icon">📺</span>
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
          <span class="admin-layout__nav-icon">{{ item.icon }}</span>
          <span class="admin-layout__nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="admin-layout__sidebar-footer">
        <router-link to="/" class="admin-layout__nav-item">
          <span class="admin-layout__nav-icon">🏠</span>
          <span class="admin-layout__nav-text">返回首页</span>
        </router-link>
        <button class="admin-layout__nav-item admin-layout__nav-item--logout" @click="handleLogout">
          <span class="admin-layout__nav-icon">↪</span>
          <span class="admin-layout__nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <main class="admin-layout__main">
      <header class="admin-layout__header">
        <div class="admin-layout__header-left">
          <button class="admin-layout__menu-toggle" @click="toggleSidebar">
            <span class="admin-layout__menu-icon">☰</span>
          </button>
          <h1 class="admin-layout__page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="admin-layout__header-right">
          <router-link to="/" class="admin-layout__home-btn">
            <span>🏠</span>
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
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const sidebarOpen = ref(true);

  onMounted(() => {
    document.documentElement.classList.add('dark');
  });

  onUnmounted(() => {
    document.documentElement.classList.remove('dark');
  });

  const navItems = [
    { path: '/admin', title: '仪表盘', icon: '📊' },
    { path: '/admin/users', title: '用户管理', icon: '👥' },
    { path: '/admin/media', title: '媒体管理', icon: '🎬' },
    { path: '/admin/play-sources', title: '播放源管理', icon: '🔗' },
    { path: '/admin/crawler', title: '数据采集', icon: '🕷' },
    { path: '/admin/crawler-targets', title: '数据源管理', icon: '🌐' },
    { path: '/admin/play-sources-overview', title: '播放源一览', icon: '🎞' },
    { path: '/admin/download-tasks', title: '下载任务', icon: '📥' },
    { path: '/admin/watch-history', title: '观看历史', icon: '🕘' },
    { path: '/admin/logs', title: '系统日志', icon: '📋' },
    { path: '/admin/danmaku', title: '弹幕管理', icon: '💬' },
    { path: '/admin/source-scripts', title: '源脚本', icon: '📜' },
    { path: '/admin/roles', title: '角色权限', icon: '🔑' },
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
    background: var(--bg-page, #0f1117);
    color: var(--text-primary, #e2e8f0);
  }

  .admin-layout__sidebar {
    width: 240px;
    background: var(--bg-secondary, #13141b);
    color: var(--text-primary, #e2e8f0);
    transition: all 0.3s ease;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
  }

  .admin-layout__sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-primary, rgba(255, 255, 255, 0.06));
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .admin-layout__sidebar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: var(--text-primary, #f1f5f9);
  }

  .admin-layout__sidebar-brand-icon {
    font-size: 1.25rem;
  }

  .admin-layout__sidebar-brand-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .admin-layout__sidebar-badge {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .admin-layout__nav {
    padding: 12px 8px;
    flex: 1;
  }

  .admin-layout__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    text-decoration: none;
    color: var(--text-muted, #94a3b8);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 2px;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    text-align: left;
  }

  .admin-layout__nav-item:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary, #e2e8f0);
  }

  .admin-layout__nav-item--active {
    background: rgba(99, 102, 241, 0.12);
    color: #a5b4fc;
  }

  .admin-layout__nav-item--logout {
    color: #f87171;
  }

  .admin-layout__nav-item--logout:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
  }

  .admin-layout__nav-icon {
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    line-height: 1;
  }

  .admin-layout__sidebar-footer {
    padding: 8px;
    border-top: 1px solid var(--border-primary, rgba(255, 255, 255, 0.06));
  }

  .admin-layout__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .admin-layout__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 56px;
    background: var(--bg-secondary, #13141b);
    border-bottom: 1px solid var(--border-primary, rgba(255, 255, 255, 0.06));
    z-index: 100;
  }

  .admin-layout__header-left {
    display: flex;
    align-items: center;
    gap: 16px;
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
    padding: 6px 14px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    color: #a5b4fc;
    font-size: 13px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .admin-layout__home-btn:hover {
    background: rgba(99, 102, 241, 0.25);
    color: #c7d2fe;
  }

  .admin-layout__menu-toggle {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 4px;
    color: var(--text-muted, #94a3b8);
    border-radius: 6px;
    transition: all 0.15s;
  }

  .admin-layout__menu-toggle:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary, #e2e8f0);
  }

  .admin-layout__page-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #f1f5f9);
  }

  .admin-layout__content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    .admin-layout__sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transform: translateX(-100%);
    }

    .admin-layout__sidebar--open {
      transform: translateX(0);
    }

    .admin-layout__main {
      margin-left: 0;
    }
  }
</style>
