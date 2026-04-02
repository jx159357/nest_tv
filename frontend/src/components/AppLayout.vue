<template>
  <div class="app-layout" :class="{ 'app-layout--sidebar-open': sidebarOpen }">
    <header class="app-layout__header">
      <div class="app-layout__header-left">
        <button
          class="app-layout__menu-toggle"
          :aria-label="sidebarOpen ? '关闭侧边栏' : '打开侧边栏'"
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
        <div ref="searchPanelRef" class="app-layout__search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            class="app-layout__search-input"
            :placeholder="t('search.placeholder')"
            @focus="openSearchSuggestions"
            @keyup.enter="handleSearch"
            @keyup.esc="showSearchSuggestions = false"
          />
          <button class="app-layout__search-button" @click="handleSearch">
            <span>🔍</span>
          </button>

          <div v-if="showSearchSuggestions && hasSearchSuggestions" class="app-layout__search-dropdown">
            <section v-if="recentSuggestionItems.length > 0" class="app-layout__search-section">
              <div class="app-layout__search-section-header">
                <div class="app-layout__search-section-title">{{ t('search.suggestions.recentSearches') }}</div>
                <button
                  type="button"
                  class="app-layout__search-section-action"
                  @mousedown.prevent="clearSearchHistory"
                >
                  清空
                </button>
              </div>
              <button
                v-for="item in recentSuggestionItems"
                :key="`recent-${item}`"
                type="button"
                class="app-layout__search-suggestion"
                @mousedown.prevent="selectSuggestion(item)"
              >
                <span>{{ item }}</span>
                <span class="app-layout__search-suggestion-meta">最近搜索</span>
              </button>
            </section>

            <section v-if="keywordSuggestionItems.length > 0" class="app-layout__search-section">
              <div class="app-layout__search-section-title">
                {{ normalizedSearchQuery ? t('search.suggestions.recommended') : t('search.suggestions.trendingSearches') }}
              </div>
              <button
                v-for="item in keywordSuggestionItems"
                :key="`${item.source}-${item.text}`"
                type="button"
                class="app-layout__search-suggestion"
                @mousedown.prevent="selectSuggestion(item.text)"
              >
                <span>{{ item.text }}</span>
                <span class="app-layout__search-suggestion-meta">{{ item.meta }}</span>
              </button>
            </section>
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
            <span class="app-layout__user-arrow">▾</span>
          </button>

          <div v-if="showUserMenu" class="app-layout__user-dropdown">
            <RouterLink to="/profile" class="app-layout__user-dropdown-item">
              <span>👤</span>
              {{ t('navigation.profile') }}
            </RouterLink>
            <RouterLink to="/settings" class="app-layout__user-dropdown-item">
              <span>⚙️</span>
              {{ t('navigation.settings') }}
            </RouterLink>
            <RouterLink to="/favorites" class="app-layout__user-dropdown-item">
              <span>❤️</span>
              {{ t('navigation.favorites') }}
            </RouterLink>
            <RouterLink to="/watch-history" class="app-layout__user-dropdown-item">
              <span>🕘</span>
              {{ t('navigation.history') }}
            </RouterLink>
            <RouterLink v-if="isAdmin" to="/admin" class="app-layout__user-dropdown-item">
              <span>🛡️</span>
              {{ t('navigation.dashboard') }}
            </RouterLink>
            <div class="app-layout__user-dropdown-divider"></div>
            <button
              class="app-layout__user-dropdown-item app-layout__user-dropdown-item--logout"
              @click="handleLogout"
            >
              <span>↪</span>
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
        <p class="app-layout__footer-text">© 2024 Nest TV · {{ t('common.about') }} · {{ t('common.help') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
  import { searchApi, type SearchSuggestionItem } from '@/api/search';
  import { notifyError, notifySuccess } from '@/composables/useModal';
  import { useAuthStore } from '@/stores/auth';
  import { useI18n } from 'vue-i18n';
  import { availableLocales, getCurrentLocale, setLocale } from '@/i18n';
  import ThemeToggle from '@/components/ui/ThemeToggle.vue';
  import {
    clearRecentSearches,
    dedupeKeywords,
    filterRecentSearches,
    normalizeSearchKeyword,
    readRecentSearches,
    saveRecentSearch,
  } from '@/utils/search-suggestions';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const sidebarOpen = ref(false);
  const showUserMenu = ref(false);
  const searchQuery = ref('');
  const searchPanelRef = ref<HTMLElement | null>(null);
  const showSearchSuggestions = ref(false);
  const recentSearches = ref<string[]>(readRecentSearches());
  const serverRecentSearches = ref<string[]>([]);
  const remoteSuggestions = ref<SearchSuggestionItem[]>([]);
  const popularKeywords = ref<string[]>([]);
  const hasLoadedPopularKeywords = ref(false);
  const hasLoadedSearchHistory = ref(false);
  const currentLocale = ref(getCurrentLocale());
  let searchRequestId = 0;

  const isAdmin = computed(
    () => authStore.user?.role === 'admin' || authStore.user?.role === 'superAdmin',
  );

  const navigationItems = [
    { path: '/', titleKey: 'navigation.home', icon: '🏠' },
    { path: '/media', titleKey: 'navigation.media', icon: '🎬' },
    { path: '/recommendations', titleKey: 'navigation.recommendations', icon: '✨' },
    { path: '/favorites', titleKey: 'navigation.favorites', icon: '❤️' },
    { path: '/watch-history', titleKey: 'navigation.history', icon: '🕘' },
  ];

  const normalizedSearchQuery = computed(() => normalizeSearchKeyword(searchQuery.value));

  const recentSuggestionItems = computed(() => {
    return filterRecentSearches(
      dedupeKeywords([...serverRecentSearches.value, ...recentSearches.value], 8),
      normalizedSearchQuery.value,
      4,
    );
  });

  const formatSuggestionMeta = (type: SearchSuggestionItem['type']) => {
    const labelMap: Record<SearchSuggestionItem['type'], string> = {
      keyword: '关键词',
      title: '片名',
      actor: '主演',
      director: '导演',
      genre: '类型',
    };

    return labelMap[type] || '推荐';
  };

  const keywordSuggestionItems = computed(() => {
    if (!normalizedSearchQuery.value) {
      return dedupeKeywords(popularKeywords.value, 6).map(keyword => ({
        text: keyword,
        source: 'popular',
        meta: '热门搜索',
      }));
    }

    const recentKeys = new Set(recentSuggestionItems.value.map(item => item.toLocaleLowerCase()));
    return remoteSuggestions.value
      .filter(item => !recentKeys.has(item.text.toLocaleLowerCase()))
      .slice(0, 6)
      .map(item => ({
        text: item.text,
        source: item.type,
        meta: formatSuggestionMeta(item.type),
      }));
  });

  const hasSearchSuggestions = computed(
    () => recentSuggestionItems.value.length > 0 || keywordSuggestionItems.value.length > 0,
  );

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

  const loadPopularKeywords = async () => {
    if (hasLoadedPopularKeywords.value || !authStore.isAuthenticated) {
      return;
    }

    hasLoadedPopularKeywords.value = true;

    try {
      popularKeywords.value = dedupeKeywords(await searchApi.getPopularKeywords(6), 6);
    } catch (error) {
      console.error('加载热门搜索失败:', error);
      popularKeywords.value = [];
    }
  };

  const loadSearchHistory = async () => {
    if (!authStore.isAuthenticated || hasLoadedSearchHistory.value) {
      return;
    }

    hasLoadedSearchHistory.value = true;

    try {
      serverRecentSearches.value = dedupeKeywords(await searchApi.getHistory(8), 8);
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      serverRecentSearches.value = [];
    }
  };

  const persistSearchHistory = (keyword: string) => {
    if (!authStore.isAuthenticated) {
      return;
    }

    serverRecentSearches.value = dedupeKeywords([keyword, ...serverRecentSearches.value], 8);
    hasLoadedSearchHistory.value = true;

    void searchApi.recordHistory({ keyword }).catch(error => {
      console.error('记录搜索历史失败:', error);
    });
  };

  const clearSearchHistory = () => {
    recentSearches.value = clearRecentSearches();
    serverRecentSearches.value = [];
    hasLoadedSearchHistory.value = true;

    if (authStore.isAuthenticated) {
      void searchApi.clearHistory().catch(error => {
        console.error('清空搜索历史失败:', error);
        notifyError('清空失败', '搜索历史清空失败，请稍后重试。');
      });
    }

    notifySuccess('搜索历史已清空', '最近搜索和服务端搜索历史都已重置。');
  };

  const loadRemoteSuggestions = async (keyword: string) => {
    const nextKeyword = normalizeSearchKeyword(keyword);
    if (!nextKeyword || nextKeyword.length < 2 || !authStore.isAuthenticated) {
      remoteSuggestions.value = [];
      if (!nextKeyword) {
        await loadPopularKeywords();
      }
      return;
    }

    const currentRequestId = ++searchRequestId;

    try {
      const suggestions = await searchApi.getSuggestions(nextKeyword, 6);
      if (currentRequestId !== searchRequestId) {
        return;
      }

      remoteSuggestions.value = suggestions;
    } catch (error) {
      if (currentRequestId !== searchRequestId) {
        return;
      }

      console.error('加载搜索建议失败:', error);
      remoteSuggestions.value = [];
    }
  };

  const openSearchSuggestions = () => {
    showSearchSuggestions.value = true;
    void loadSearchHistory();
    void loadRemoteSuggestions(searchQuery.value);
  };

  const handleSearch = () => {
    const keyword = normalizedSearchQuery.value;
    if (!keyword) {
      return;
    }

    recentSearches.value = saveRecentSearch(keyword);
    persistSearchHistory(keyword);
    showSearchSuggestions.value = false;

    void router.push({
      path: '/search',
      query: { q: keyword },
    });
  };

  const selectSuggestion = (keyword: string) => {
    searchQuery.value = keyword;
    handleSearch();
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

    if (searchPanelRef.value && !searchPanelRef.value.contains(event.target as Node)) {
      showSearchSuggestions.value = false;
    }
  };

  watch(
    () => searchQuery.value,
    value => {
      if (!showSearchSuggestions.value) {
        return;
      }

      void loadRemoteSuggestions(value);
    },
  );

  watch(
    () => route.query.q,
    value => {
      const nextQuery = Array.isArray(value) ? value[0] : value;
      searchQuery.value = typeof nextQuery === 'string' ? nextQuery : '';
      showSearchSuggestions.value = false;
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
    overflow: visible;
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

  .app-layout__search-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 8px);
    z-index: 20;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
    padding: 12px;
  }

  .app-layout__search-section + .app-layout__search-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }

  .app-layout__search-section-title {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .app-layout__search-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .app-layout__search-section-action {
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
  }

  .app-layout__search-section-action:hover {
    color: #475569;
  }

  .app-layout__search-suggestion {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: none;
    border-radius: 8px;
    background: transparent;
    padding: 8px 10px;
    color: #1f2937;
    text-align: left;
    cursor: pointer;
  }

  .app-layout__search-suggestion:hover {
    background: #f8fafc;
  }

  .app-layout__search-suggestion-meta {
    flex-shrink: 0;
    margin-left: 12px;
    font-size: 12px;
    color: #94a3b8;
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

