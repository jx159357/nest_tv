<template>
  <div class="app-layout" :class="{ 'app-layout--sidebar-open': sidebarOpen }">
    <header class="app-layout__header">
      <div class="app-layout__header-left">
        <button
          class="app-layout__menu-toggle"
          :aria-label="sidebarOpen ? '¹Ø±Õ²à±ßÀ¸' : '´ò¿ª²à±ßÀ¸'"
          @click="toggleSidebar"
        >
          <span class="app-layout__menu-icon"></span>
        </button>
        <RouterLink to="/" class="app-layout__logo-link">
          <img src="/favicon.ico" alt="Logo" class="app-layout__logo-img" />
          <span class="app-layout__logo-text">Nest TV</span>
        </RouterLink>
      </div>

      <div class="app-layout__header-center">
        <div class="app-layout__search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            class="app-layout__search-input"
            :placeholder="t('search.placeholder')"
            @keyup.enter="handleSearch"
          />
          <button class="app-layout__search-button" @click="handleSearch">
            <span>??</span>
          </button>
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
            @click="switchLanguage(locale.code as 'zh-CN' | 'en')"
          >
            {{ locale.flag }}
          </button>
        </div>

        <ThemeToggle />

        <div v-if="!authStore.isAuthenticated" class="app-layout__auth">
          <RouterLink to="/login" class="app-layout__login-btn">{{ t('common.login') }}</RouterLink>
          <RouterLink to="/register" class="app-layout__register-btn">{{ t('common.register') }}</RouterLink>
        </div>

        <div v-else class="app-layout__user">
          <button class="app-layout__user-menu" @click="toggleUserMenu">
            <img
              :src="authStore.user?.avatar || '/default-avatar.png'"
              :alt="authStore.user?.nickname || 'User'"
              class="app-layout__user-avatar"
            />
            <span class="app-layout__user-name">{{ authStore.user?.nickname || authStore.user?.username }}</span>
            <span class="app-layout__user-arrow">?</span>
          </button>

          <div v-if="showUserMenu" class="app-layout__user-dropdown">
            <RouterLink to="/profile" class="app-layout__user-dropdown-item">
              <span>??</span>
              {{ t('navigation.profile') }}
            </RouterLink>
            <RouterLink to="/favorites" class="app-layout__user-dropdown-item">
              <span>?</span>
              {{ t('navigation.favorites') }}
            </RouterLink>
            <RouterLink to="/watch-history" class="app-layout__user-dropdown-item">
              <span>??</span>
              {{ t('navigation.history') }}
            </RouterLink>
            <RouterLink v-if="isAdmin" to="/admin" class="app-layout__user-dropdown-item">
              <span>??</span>
              {{ t('navigation.dashboard') }}
            </RouterLink>
            <div class="app-layout__user-dropdown-divider"></div>
            <button
              class="app-layout__user-dropdown-item app-layout__user-dropdown-item--logout"
              @click="handleLogout"
            >
              <span>??</span>
              {{ t('common.logout') }}
            </button>
          </div>
        </div>
      </div>
    </header>

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

    <main class="app-layout__main">
      <div class="app-layout__content">
        <RouterView />
      </div>
    </main>

    <footer class="app-layout__footer">
      <div class="app-layout__footer-content">
        <p class="app-layout__footer-text">? 2024 Nest TV. {{ t('common.about') }} | {{ t('common.help') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useI18n } from 'vue-i18n';
  import { availableLocales, getCurrentLocale, setLocale } from '@/i18n';
  import ThemeToggle from '@/components/ui/ThemeToggle.vue';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const sidebarOpen = ref(false);
  const showUserMenu = ref(false);
  const searchQuery = ref('');
  const currentLocale = ref(getCurrentLocale());

  const isAdmin = computed(
    () => authStore.user?.role === 'admin' || authStore.user?.role === 'superAdmin',
  );

  const navigationItems = [
    { path: '/', titleKey: 'navigation.home', icon: '??' },
    { path: '/media', titleKey: 'navigation.media', icon: '??' },
    { path: '/recommendations', titleKey: 'navigation.recommendations', icon: '??' },
    { path: '/favorites', titleKey: 'navigation.favorites', icon: '?' },
    { path: '/watch-history', titleKey: 'navigation.history', icon: '??' },
  ];

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

  const isActiveRoute = (path: string) => route.path === path;

  const handleSearch = () => {
    if (!searchQuery.value.trim()) {
      return;
    }

    void router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() },
    });
  };

  const handleLogout = () => {
    showUserMenu.value = false;
    authStore.logout();
    void router.push('/login');
  };

  const handleResize = () => {
    sidebarOpen.value = window.innerWidth > 768;
  };

  const handleClickOutside = (event: MouseEvent) => {
    const menu = document.querySelector('.app-layout__user-menu');
    const dropdown = document.querySelector('.app-layout__user-dropdown');

    if (menu && !menu.contains(event.target as Node) && dropdown && !dropdown.contains(event.target as Node)) {
      showUserMenu.value = false;
    }
  };

  watch(
    () => route.query.q,
    value => {
      const nextQuery = Array.isArray(value) ? value[0] : value;
      searchQuery.value = typeof nextQuery === 'string' ? nextQuery : '';
    },
    { immediate: true },
  );

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
    min-height: 100vh;
    flex-direction: column;
    background: #f5f5f5;
  }

  .app-layout__header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    height: 60px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid #ddd;
    background: #fff;
    padding: 0 20px;
  }

  .app-layout__header-left,
  .app-layout__header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-layout__header-center {
    flex: 1;
    max-width: 520px;
  }

  .app-layout__menu-toggle {
    display: none;
    border: none;
    background: none;
    cursor: pointer;
  }

  .app-layout__menu-icon,
  .app-layout__menu-icon::before,
  .app-layout__menu-icon::after {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: #333;
    content: '';
  }

  .app-layout__menu-icon::before {
    margin-top: -6px;
  }

  .app-layout__menu-icon::after {
    margin-top: 10px;
  }

  .app-layout__logo-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #111827;
    text-decoration: none;
  }

  .app-layout__logo-img {
    width: 28px;
    height: 28px;
  }

  .app-layout__logo-text {
    font-weight: 700;
  }

  .app-layout__search-input-wrapper {
    display: flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
  }

  .app-layout__search-input {
    flex: 1;
    border: none;
    padding: 10px 12px;
    outline: none;
  }

  .app-layout__search-button {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 10px 12px;
  }

  .app-layout__language-switcher {
    display: flex;
    gap: 4px;
  }

  .app-layout__language-button {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    padding: 4px 8px;
    cursor: pointer;
  }

  .app-layout__language-button--active {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }

  .app-layout__auth {
    display: flex;
    gap: 8px;
  }

  .app-layout__login-btn,
  .app-layout__register-btn {
    border-radius: 6px;
    padding: 8px 12px;
    text-decoration: none;
  }

  .app-layout__login-btn {
    border: 1px solid #4f46e5;
    color: #4f46e5;
  }

  .app-layout__register-btn {
    background: #4f46e5;
    color: white;
  }

  .app-layout__user {
    position: relative;
  }

  .app-layout__user-menu {
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .app-layout__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    object-fit: cover;
  }

  .app-layout__user-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 180px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  }

  .app-layout__user-dropdown-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    padding: 10px 12px;
    color: #374151;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .app-layout__user-dropdown-item--logout {
    color: #dc2626;
  }

  .app-layout__user-dropdown-divider {
    height: 1px;
    background: #eee;
  }

  .app-layout__sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    width: 240px;
    border-right: 1px solid #ddd;
    background: #fff;
    transition: transform 0.3s ease;
  }

  .app-layout__nav {
    padding: 20px 0;
  }

  .app-layout__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    color: #374151;
    text-decoration: none;
  }

  .app-layout__nav-item--active {
    border-left: 3px solid #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }

  .app-layout__main {
    margin-top: 60px;
    margin-left: 240px;
    flex: 1;
  }

  .app-layout__content {
    padding: 20px;
  }

  .app-layout__footer {
    border-top: 1px solid #ddd;
    background: #fff;
    padding: 10px 20px;
    text-align: center;
  }

  .app-layout__footer-text {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .app-layout__menu-toggle {
      display: inline-flex;
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

    .app-layout__user-name,
    .app-layout__language-switcher {
      display: none;
    }
  }
</style>
