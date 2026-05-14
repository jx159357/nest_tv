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

          <div
            v-if="showSearchSuggestions && hasSearchSuggestions"
            class="app-layout__search-dropdown"
          >
            <section v-if="recentSuggestionItems.length > 0" class="app-layout__search-section">
              <div class="app-layout__search-section-header">
                <div class="app-layout__search-section-title">
                  {{ t('search.suggestions.recentSearches') }}
                </div>
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
                {{
                  normalizedSearchQuery
                    ? t('search.suggestions.recommended')
                    : t('search.suggestions.trendingSearches')
                }}
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
          <RouterLink to="/register" class="app-layout__register-btn">{{
            t('common.register')
          }}</RouterLink>
        </div>

        <div v-else class="app-layout__user">
          <button class="app-layout__user-menu" @click="toggleUserMenu">
            <img
              :src="authStore.user?.avatar || '/default-avatar.png'"
              :alt="authStore.user?.nickname || 'User'"
              class="app-layout__user-avatar"
            />
            <span class="app-layout__user-name">{{
              authStore.user?.nickname || authStore.user?.username
            }}</span>
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

    <div
      v-if="isMobile && sidebarOpen"
      class="app-layout__backdrop"
      @click="sidebarOpen = false"
    ></div>
    <aside class="app-layout__sidebar">
      <nav class="app-layout__nav">
        <div class="app-layout__nav-section">
          <div class="app-layout__nav-section-label">{{ t('navigation.home') }}</div>
          <RouterLink
            v-for="item in userNavItems"
            :key="item.path"
            :to="item.path"
            class="app-layout__nav-item"
            :class="{ 'app-layout__nav-item--active': isActiveRoute(item.path) }"
          >
            <span class="app-layout__nav-icon">{{ item.icon }}</span>
            <span class="app-layout__nav-text">{{ t(item.titleKey) }}</span>
          </RouterLink>
        </div>

        <div v-if="adminNavItems.length > 0" class="app-layout__nav-section">
          <div class="app-layout__nav-section-label">{{ t('navigation.dashboard') }}</div>
          <RouterLink
            v-for="item in adminNavItems"
            :key="item.path"
            :to="item.path"
            class="app-layout__nav-item"
            :class="{ 'app-layout__nav-item--active': isActiveRoute(item.path) }"
          >
            <span class="app-layout__nav-icon">{{ item.icon }}</span>
            <span class="app-layout__nav-text">{{ t(item.titleKey) }}</span>
          </RouterLink>
        </div>
      </nav>
    </aside>

    <main class="app-layout__main">
      <div class="app-layout__content">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <footer class="app-layout__footer">
      <div class="app-layout__footer-content">
        <p class="app-layout__footer-text">
          © 2024 Nest TV · {{ t('common.about') }} · {{ t('common.help') }}
        </p>
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
  import { log } from '@/utils/logger';
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

  const isMobile = ref(window.innerWidth <= 768);
  const sidebarOpen = ref(!isMobile.value);
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

  const userNavItems = computed(() => [
    { path: '/', titleKey: 'navigation.home', icon: '🏠' },
    { path: '/recommendations', titleKey: 'navigation.recommendations', icon: '✨' },
    { path: '/watch-history', titleKey: 'navigation.history', icon: '🕘' },
    { path: '/favorites', titleKey: 'navigation.favorites', icon: '❤️' },
    { path: '/downloads', titleKey: 'navigation.downloads', icon: '📥' },
    { path: '/torrent', titleKey: 'navigation.magnets', icon: '🧲' },
    { path: '/iptv', titleKey: 'navigation.iptv', icon: '📺' },
  ]);

  const adminNavItems = computed(() => {
    if (!isAdmin.value) return [];
    return [
      { path: '/admin', titleKey: 'navigation.dashboard', icon: '🛡️' },
    ];
  });

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

  const isActiveRoute = (path: string) => {
    if (path === '/') return route.path === '/';
    return route.path.startsWith(path);
  };

  const loadPopularKeywords = async () => {
    if (hasLoadedPopularKeywords.value || !authStore.isAuthenticated) {
      return;
    }

    hasLoadedPopularKeywords.value = true;

    try {
      popularKeywords.value = dedupeKeywords(await searchApi.getPopularKeywords(6), 6);
    } catch (error) {
      log.error('AppLayout', '加载热门搜索失败:', error);
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
      log.error('AppLayout', '加载搜索历史失败:', error);
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
      log.error('AppLayout', '记录搜索历史失败:', error);
    });
  };

  const clearSearchHistory = () => {
    recentSearches.value = clearRecentSearches();
    serverRecentSearches.value = [];
    hasLoadedSearchHistory.value = true;

    if (authStore.isAuthenticated) {
      void searchApi.clearHistory().catch(error => {
        log.error('AppLayout', '清空搜索历史失败:', error);
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

      log.error('AppLayout', '加载搜索建议失败:', error);
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
    isMobile.value = window.innerWidth <= 768;
    sidebarOpen.value = !isMobile.value;
  };

  const handleClickOutside = (event: MouseEvent) => {
    const menu = document.querySelector('.app-layout__user-menu');
    const dropdown = document.querySelector('.app-layout__user-dropdown');

    if (
      menu &&
      !menu.contains(event.target as Node) &&
      dropdown &&
      !dropdown.contains(event.target as Node)
    ) {
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
    background: #f8fafc;
  }

  /* ── Header ── */
  .app-layout__header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    height: 56px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(15, 17, 23, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
    max-width: 480px;
  }

  .app-layout__menu-toggle {
    display: none;
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px;
  }

  .app-layout__menu-icon,
  .app-layout__menu-icon::before,
  .app-layout__menu-icon::after {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: #e2e8f0;
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
    color: #f1f5f9;
    text-decoration: none;
  }

  .app-layout__logo-img {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }

  .app-layout__logo-text {
    font-weight: 700;
    font-size: 1.125rem;
    letter-spacing: -0.02em;
  }

  /* ── Search ── */
  .app-layout__search-input-wrapper {
    display: flex;
    align-items: center;
    overflow: visible;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    transition: border-color 0.2s, background 0.2s;
  }

  .app-layout__search-input-wrapper:focus-within {
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .app-layout__search-input {
    flex: 1;
    border: none;
    padding: 8px 12px;
    outline: none;
    background: transparent;
    color: #e2e8f0;
    font-size: 0.875rem;
  }

  .app-layout__search-input::placeholder {
    color: #64748b;
  }

  .app-layout__search-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 8px 12px;
    font-size: 0.875rem;
    line-height: 1;
  }

  .app-layout__search-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 8px);
    z-index: 20;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: #1e2028;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    padding: 12px;
  }

  .app-layout__search-section + .app-layout__search-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .app-layout__search-section-title {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
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
    color: #64748b;
    cursor: pointer;
  }

  .app-layout__search-section-action:hover {
    color: #94a3b8;
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
    color: #e2e8f0;
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .app-layout__search-suggestion:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .app-layout__search-suggestion-meta {
    flex-shrink: 0;
    margin-left: 12px;
    font-size: 12px;
    color: #64748b;
  }

  /* ── Language & Auth ── */
  .app-layout__language-switcher {
    display: flex;
    gap: 4px;
  }

  .app-layout__language-button {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    background: transparent;
    padding: 4px 8px;
    cursor: pointer;
    color: #94a3b8;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .app-layout__language-button:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #e2e8f0;
  }

  .app-layout__language-button--active {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
  }

  .app-layout__auth {
    display: flex;
    gap: 8px;
  }

  .app-layout__login-btn,
  .app-layout__register-btn {
    border-radius: 6px;
    padding: 6px 14px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .app-layout__login-btn {
    border: 1px solid rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
  }

  .app-layout__login-btn:hover {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }

  .app-layout__register-btn {
    background: #6366f1;
    color: white;
  }

  .app-layout__register-btn:hover {
    background: #4f46e5;
  }

  /* ── User Menu ── */
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
    padding: 4px;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .app-layout__user-menu:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .app-layout__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba(99, 102, 241, 0.3);
  }

  .app-layout__user-name {
    color: #e2e8f0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .app-layout__user-arrow {
    color: #64748b;
    font-size: 0.75rem;
  }

  .app-layout__user-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 180px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    background: #1e2028;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    padding: 4px;
  }

  .app-layout__user-dropdown-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
    border: none;
    background: transparent;
    padding: 10px 12px;
    color: #cbd5e1;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    font-size: 0.875rem;
    border-radius: 6px;
    transition: background 0.15s;
  }

  .app-layout__user-dropdown-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f1f5f9;
  }

  .app-layout__user-dropdown-item span:first-child {
    display: inline-flex;
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    line-height: 1;
  }

  .app-layout__user-dropdown-item--logout {
    color: #f87171;
  }

  .app-layout__user-dropdown-item--logout:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
  }

  .app-layout__user-dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 4px 0;
  }

  /* ── Sidebar ── */
  .app-layout__sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    width: 220px;
    background: #13141b;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    transition: transform 0.3s ease;
    overflow-y: auto;
    z-index: 900;
  }

  .app-layout__nav {
    padding: 16px 0;
  }

  .app-layout__nav-section {
    padding: 0 12px;
    margin-bottom: 8px;
  }

  .app-layout__nav-section-label {
    padding: 8px 12px 6px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #475569;
  }

  .app-layout__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    color: #94a3b8;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 2px;
  }

  .app-layout__nav-item:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
  }

  .app-layout__nav-icon {
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    line-height: 1;
  }

  .app-layout__nav-item--active {
    background: rgba(99, 102, 241, 0.12);
    color: #a5b4fc;
  }

  .app-layout__nav-item--active .app-layout__nav-icon {
    color: #818cf8;
  }

  /* ── Main Content ── */
  .app-layout__main {
    margin-top: 56px;
    margin-left: 220px;
    flex: 1;
    min-height: calc(100vh - 56px);
  }

  .app-layout__content {
    padding: 24px;
  }

  /* ── Footer ── */
  .app-layout__footer {
    margin-left: 220px;
    border-top: 1px solid #e2e8f0;
    background: #fff;
    padding: 12px 20px;
    text-align: center;
  }

  .app-layout__footer-text {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .app-layout__menu-toggle {
      display: inline-flex;
    }

    .app-layout__sidebar {
      transform: translateX(-100%);
      z-index: 999;
    }

    .app-layout--sidebar-open .app-layout__sidebar {
      transform: translateX(0);
    }

    .app-layout__main,
    .app-layout__footer {
      margin-left: 0;
    }

    .app-layout__user-name,
    .app-layout__language-switcher {
      display: none;
    }

    .app-layout__backdrop {
      position: fixed;
      inset: 0;
      z-index: 998;
      background: rgba(0, 0, 0, 0.5);
    }

    .app-layout__content {
      padding: 16px;
    }
  }

  /* ── Dark theme support ── */
  :global(.dark) .app-layout {
    background: #0f1117;
  }

  /* ── Page Transitions ── */
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .page-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }

  .page-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  .page-fade-move {
    transition: transform 0.3s ease;
  }
</style>
