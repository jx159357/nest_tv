<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar" :class="{ 'admin-layout__sidebar--open': sidebarOpen }">
      <div class="admin-layout__sidebar-header">
        <h2 class="admin-layout__sidebar-title">管理后台</h2>
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
          <router-link to="/" class="admin-layout__back-home">返回首页</router-link>
          <button class="admin-layout__logout" @click="handleLogout">退出登录</button>
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
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const sidebarOpen = ref(true);

  const navItems = [
    { path: '/admin', title: '仪表盘', icon: 'DB' },
    { path: '/admin/users', title: '用户管理', icon: 'US' },
    { path: '/admin/media', title: '媒体管理', icon: 'MD' },
    { path: '/admin/play-sources', title: '播放源管理', icon: 'PS' },
    { path: '/admin/download-tasks', title: '下载任务', icon: 'DL' },
    { path: '/admin/watch-history', title: '观看历史', icon: 'WH' },
    { path: '/admin/logs', title: '系统日志', icon: 'LG' },
    { path: '/admin/crawler', title: '数据采集', icon: 'CR' },
  ];

  const currentPageTitle = computed(() => {
    const activeItem = navItems.find(item => isActive(item.path));
    return activeItem ? activeItem.title : '管理后台';
  });

  const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');

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
    background-color: #f5f5f5;
  }

  .admin-layout__sidebar {
    width: 250px;
    background: #2c3e50;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  }

  .admin-layout__sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .admin-layout__sidebar-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .admin-layout__nav {
    padding: 20px 0;
  }

  .admin-layout__nav-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
  }

  .admin-layout__nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .admin-layout__nav-item--active {
    background: #3498db;
    color: white;
  }

  .admin-layout__nav-icon {
    margin-right: 10px;
    min-width: 24px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .admin-layout__main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .admin-layout__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 60px;
    background: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .admin-layout__header-left {
    display: flex;
    align-items: center;
  }

  .admin-layout__menu-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    margin-right: 15px;
    padding: 5px;
  }

  .admin-layout__page-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
  }

  .admin-layout__header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .admin-layout__back-home {
    text-decoration: none;
    color: #3498db;
    font-weight: 500;
  }

  .admin-layout__logout {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s ease;
  }

  .admin-layout__logout:hover {
    background: #c0392b;
  }

  .admin-layout__content {
    flex: 1;
    padding: 20px;
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
