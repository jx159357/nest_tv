<template>
  <div class="app-layout" :class="{ 'app-layout--sidebar-open': sidebarOpen }">
    <!-- 顶部导航栏 -->
    <header class="app-layout__header">
      <div class="app-layout__header-left">
        <button
          class="app-layout__menu-toggle"
          :aria-label="sidebarOpen ? '关闭侧边栏' : '打开侧边栏'"
          @click="toggleSidebar"
        >
          <span class="app-layout__menu-icon"></span>
        </button>
        <div class="app-layout__logo">
          <RouterLink to="/" class="app-layout__logo-link">
            <img src="/favicon.ico" alt="Logo" class="app-layout__logo-img" />
            <span class="app-layout__logo-text">Nest TV</span>
          </RouterLink>
        </div>
      </div>

      <div class="app-layout__header-center">
        <div class="app-layout__search">
          <div class="app-layout__search-input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              class="app-layout__search-input"
              :placeholder="t('search.placeholder')"
              @keyup.enter="handleSearch"
              @focus="showSearchSuggestions = true"
              @blur="handleSearchBlur"
            />
            <button class="app-layout__search-button" @click="handleSearch">
              <span class="app-layout__search-icon">🔍</span>
            </button>
          </div>

          <!-- 搜索建议 -->
          <div
            v-if="showSearchSuggestions && searchSuggestions.length > 0"
            class="app-layout__search-suggestions"
          >
            <div
              v-for="suggestion in searchSuggestions"
              :key="suggestion.id"
              class="app-layout__search-suggestion"
              @click="handleSuggestionClick(suggestion)"
            >
              <span class="app-layout__search-suggestion-icon">📺</span>
              <span class="app-layout__search-suggestion-text">{{ suggestion.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="app-layout__header-right">
        <div class="app-layout__language-switcher">
          <button
            v-for="locale in availableLocales"
            :key="locale.code"
            class="app-layout__language-button"
            :class="{ 'app-layout__language-button--active': currentLocale === locale.code }"
            :title="locale.name"
            @click="switchLanguage(locale.code)"
          >
            <span class="app-layout__language-flag">{{ locale.flag }}</span>
          </button>
        </div>

        <!-- 主题切换按钮 -->
        <ThemeToggle />

        <div v-if="!authStore.isAuthenticated" class="app-layout__auth">
          <RouterLink to="/login" class="app-layout__login-btn">
            {{ t('common.login') }}
          </RouterLink>
          <RouterLink to="/register" class="app-layout__register-btn">
            {{ t('common.register') }}
          </RouterLink>
        </div>

        <div v-else class="app-layout__user">
          <div class="app-layout__user-menu" @click="toggleUserMenu">
            <img
              :src="authStore.user?.avatar || '/default-avatar.png'"
              :alt="authStore.user?.nickname || 'User'"
              class="app-layout__user-avatar"
            />
            <span class="app-layout__user-name">{{
              authStore.user?.nickname || authStore.user?.username
            }}</span>
            <span class="app-layout__user-arrow">▼</span>
          </div>

          <div v-if="showUserMenu" class="app-layout__user-dropdown">
            <RouterLink to="/profile" class="app-layout__user-dropdown-item">
              <span class="app-layout__user-dropdown-icon">👤</span>
              {{ t('navigation.profile') }}
            </RouterLink>
            <RouterLink to="/favorites" class="app-layout__user-dropdown-item">
              <span class="app-layout__user-dropdown-icon">⭐</span>
              {{ t('navigation.favorites') }}
            </RouterLink>
            <RouterLink to="/watch-history" class="app-layout__user-dropdown-item">
              <span class="app-layout__user-dropdown-icon">📺</span>
              {{ t('navigation.history') }}
            </RouterLink>
            <div class="app-layout__user-dropdown-divider"></div>
            <RouterLink v-if="isAdmin" to="/admin" class="app-layout__user-dropdown-item">
              <span class="app-layout__user-dropdown-icon">⚙️</span>
              {{ t('navigation.dashboard') }}
            </RouterLink>
            <button
              class="app-layout__user-dropdown-item app-layout__user-dropdown-item--logout"
              @click="handleLogout"
            >
              <span class="app-layout__user-dropdown-icon">🚪</span>
              {{ t('common.logout') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside class="app-layout__sidebar">
      <nav class="app-layout__nav">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="app-layout__nav-item"
          :class="{ 'app-layout__nav-item--active': isActiveRoute(item.path) }"
        >
          <span class="app-layout__nav-icon">{{ item.icon }}</span>
          <span class="app-layout__nav-text">{{ t(item.titleKey) }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="app-layout__main">
      <div class="app-layout__content">
        <RouterView />
      </div>
    </main>

    <!-- 底部 -->
    <footer class="app-layout__footer">
      <div class="app-layout__footer-content">
        <p class="app-layout__footer-text">
          © 2024 Nest TV. {{ t('common.about') }} | {{ t('common.help') }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useI18n } from 'vue-i18n';
  import { availableLocales, setLocale, getCurrentLocale } from '@/i18n';
  import type { SearchSuggestion } from '@/types/components';
  import ThemeToggle from '@/components/ui/ThemeToggle.vue';

  // 国际化
  const { t } = useI18n();

  // 路由和认证
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  // 响应式状态
  const sidebarOpen = ref(false);
  const showUserMenu = ref(false);
  const searchQuery = ref('');
  const showSearchSuggestions = ref(false);
  const searchSuggestions = ref<SearchSuggestion[]>([]);
  const currentLocale = ref(getCurrentLocale());

  // 计算属性
  const isAdmin = computed(
    () => authStore.user?.role === 'admin' || authStore.user?.role === 'superAdmin',
  );

  const navigationItems = [
    { path: '/', titleKey: 'navigation.home', icon: '🏠' },
    { path: '/media', titleKey: 'navigation.media', icon: '📺' },
    { path: '/recommendations', titleKey: 'navigation.recommendations', icon: '🎯' },
    { path: '/crawler', titleKey: 'crawler.title', icon: '🕷️' },
    { path: '/watch-history', titleKey: 'navigation.history', icon: '📊' },
  ];

  // 方法
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
  };

  const switchLanguage = (locale: 'zh-CN' | 'en') => {
    setLocale(locale);
    currentLocale.value = locale;
  };

  const isActiveRoute = (path: string) => {
    return route.path === path;
  };

  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      router.push({
        path: '/search',
        query: { q: searchQuery.value.trim() },
      });
      showSearchSuggestions.value = false;
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      showSearchSuggestions.value = false;
    }, 200);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    searchQuery.value = suggestion.title;
    handleSearch();
  };

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
    showUserMenu.value = false;
  };

  const handleResize = () => {
    if (window.innerWidth > 768) {
      sidebarOpen.value = true;
    } else {
      sidebarOpen.value = false;
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const userMenu = document.querySelector('.app-layout__user-menu');
    const userDropdown = document.querySelector('.app-layout__user-dropdown');

    if (
      userMenu &&
      !userMenu.contains(event.target as Node) &&
      userDropdown &&
      !userDropdown.contains(event.target as Node)
    ) {
      showUserMenu.value = false;
    }
  };

  // 生命周期
  onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
  }

  .app-layout__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0 20px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }

  .app-layout__header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .app-layout__menu-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
  }

  .app-layout__logo {
    display: flex;
    align-items: center;
  }

  .app-layout__logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #333;
    font-weight: bold;
    font-size: 18px;
  }

  .app-layout__logo-img {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }

  .app-layout__header-center {
    flex: 1;
    max-width: 500px;
    margin: 0 20px;
  }

  .app-layout__search {
    position: relative;
  }

  .app-layout__search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .app-layout__search-input {
    width: 100%;
    padding: 8px 40px 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.3s;
  }

  .app-layout__search-input:focus {
    border-color: #4caf50;
  }

  .app-layout__search-button {
    position: absolute;
    right: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
  }

  .app-layout__search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 8px 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
  }

  .app-layout__search-suggestion {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }

  .app-layout__search-suggestion:hover {
    background: #f0f0f0;
  }

  .app-layout__search-suggestion-icon {
    margin-right: 10px;
  }

  .app-layout__header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .app-layout__language-switcher {
    display: flex;
    gap: 5px;
  }

  .app-layout__language-button {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
  }

  .app-layout__language-button--active {
    background: #4caf50;
    color: white;
    border-color: #4caf50;
  }

  .app-layout__auth {
    display: flex;
    gap: 10px;
  }

  .app-layout__login-btn,
  .app-layout__register-btn {
    padding: 6px 12px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.3s;
  }

  .app-layout__login-btn {
    color: #4caf50;
    border: 1px solid #4caf50;
  }

  .app-layout__register-btn {
    background: #4caf50;
    color: white;
    border: 1px solid #4caf50;
  }

  .app-layout__login-btn:hover,
  .app-layout__register-btn:hover {
    opacity: 0.8;
  }

  .app-layout__user {
    position: relative;
  }

  .app-layout__user-menu {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.3s;
  }

  .app-layout__user-menu:hover {
    background: #f0f0f0;
  }

  .app-layout__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .app-layout__user-name {
    font-size: 14px;
    color: #333;
  }

  .app-layout__user-arrow {
    font-size: 12px;
    color: #666;
  }

  .app-layout__user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .app-layout__user-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    text-decoration: none;
    color: #333;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.3s;
  }

  .app-layout__user-dropdown-item:hover {
    background: #f0f0f0;
  }

  .app-layout__user-dropdown-item--logout {
    color: #d32f2f;
  }

  .app-layout__user-dropdown-divider {
    height: 1px;
    background: #eee;
    margin: 4px 0;
  }

  .app-layout__sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    width: 240px;
    background: white;
    border-right: 1px solid #ddd;
    transition: transform 0.3s;
    z-index: 999;
  }

  .app-layout__nav {
    padding: 20px 0;
  }

  .app-layout__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    text-decoration: none;
    color: #333;
    transition: all 0.3s;
  }

  .app-layout__nav-item:hover {
    background: #f0f0f0;
  }

  .app-layout__nav-item--active {
    background: #e8f5e8;
    color: #4caf50;
    border-left: 3px solid #4caf50;
  }

  .app-layout__main {
    flex: 1;
    margin-left: 240px;
    margin-top: 60px;
    margin-bottom: 40px;
    background: #f5f5f5;
  }

  .app-layout__content {
    padding: 20px;
    min-height: calc(100vh - 60px - 40px - 240px);
  }

  .app-layout__footer {
    background: #333;
    color: white;
    padding: 10px 20px;
    text-align: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 998;
  }

  .app-layout__footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .app-layout__footer-text {
    margin: 0;
    font-size: 14px;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .app-layout__menu-toggle {
      display: block;
    }

    .app-layout__sidebar {
      transform: translateX(-100%);
    }

    .app-layout--sidebar-open .app-layout__sidebar {
      transform: translateX(0);
    }

    .app-layout__main {
      margin-left: 0;
    }

    .app-layout__header-center {
      margin: 0 10px;
    }

    .app-layout__user-name {
      display: none;
    }

    .app-layout__auth {
      gap: 5px;
    }

    .app-layout__login-btn,
    .app-layout__register-btn {
      padding: 4px 8px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .app-layout__header {
      padding: 0 10px;
    }

    .app-layout__logo-text {
      display: none;
    }

    .app-layout__header-center {
      margin: 0 5px;
    }

    .app-layout__language-flag {
      font-size: 10px;
    }
  }

  /* 过渡动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
