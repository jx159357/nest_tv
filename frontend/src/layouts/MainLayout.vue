<template>
  <div class="main-layout" :class="{ 'main-layout--immersive': hideShellChrome }">
    <!-- 顶部导航栏 -->
    <header v-if="!hideShellChrome" class="main-header">
      <div class="main-header__container">
        <!-- Logo -->
        <router-link to="/" class="main-header__logo">
          <svg class="main-header__logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span class="main-header__logo-text">Nest TV</span>
        </router-link>

        <!-- 导航菜单 -->
        <nav class="main-header__nav">
          <router-link to="/" class="main-header__nav-item" :class="{ active: route.path === '/' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>首页</span>
          </router-link>

          <router-link
            to="/recommendations"
            class="main-header__nav-item"
            :class="{ active: route.path === '/recommendations' }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </svg>
            <span>推荐</span>
          </router-link>

          <router-link
            to="/iptv"
            class="main-header__nav-item"
            :class="{ active: route.path === '/iptv' }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>IPTV</span>
          </router-link>

          <router-link
            to="/categories"
            class="main-header__nav-item"
            :class="{ active: route.path === '/categories' }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>分类</span>
          </router-link>

          <router-link
            to="/torrent"
            class="main-header__nav-item"
            :class="{ active: route.path === '/torrent' }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>下载</span>
          </router-link>
        </nav>

        <!-- 右侧操作区 -->
        <div class="main-header__actions">
          <!-- 主题切换 -->
          <button
            class="main-header__icon-btn main-header__theme-btn"
            :class="{ 'main-header__icon-btn--system': isSystemTheme }"
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

          <!-- 管理后台入口 (管理员) -->
          <router-link v-if="isAdmin" to="/admin" class="main-header__icon-btn" title="管理后台">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </router-link>
          <!-- 用户中心入口 (普通用户) -->
          <router-link
            v-else-if="authStore.isAuthenticated"
            to="/dashboard"
            class="main-header__icon-btn"
            title="用户中心"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </router-link>

          <!-- 搜索框 -->
          <div class="main-header__search" role="search">
            <svg
              class="main-header__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="main-header__search-input"
              aria-label="搜索影视内容"
              autocomplete="off"
              enterkeyhint="search"
              placeholder="搜索影视、电视剧..."
              @keydown.esc="searchQuery = ''"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 用户菜单 -->
          <div v-if="authStore.isAuthenticated" class="main-header__user">
            <button class="main-header__user-btn" @click="toggleUserMenu">
              <div class="main-header__user-avatar">
                {{ userInitial }}
              </div>
              <span class="main-header__user-name">{{
                authStore.user?.nickname || authStore.user?.username
              }}</span>
            </button>

            <!-- 用户下拉菜单 -->
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="main-header__dropdown">
                <router-link
                  to="/profile"
                  class="main-header__dropdown-item"
                  @click="showUserMenu = false"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  个人中心
                </router-link>
                <router-link
                  to="/favorites"
                  class="main-header__dropdown-item"
                  @click="showUserMenu = false"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  我的收藏
                </router-link>
                <router-link
                  to="/watch-history"
                  class="main-header__dropdown-item"
                  @click="showUserMenu = false"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  观看历史
                </router-link>
                <router-link
                  to="/settings"
                  class="main-header__dropdown-item"
                  @click="showUserMenu = false"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                    />
                  </svg>
                  设置
                </router-link>
                <div class="main-header__dropdown-divider"></div>
                <button
                  class="main-header__dropdown-item main-header__dropdown-item--danger"
                  @click="handleLogout"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  退出登录
                </button>
              </div>
            </Transition>
          </div>

          <!-- 未登录状态 -->
          <div v-else class="main-header__auth">
            <router-link to="/login" class="main-header__login-btn">登录</router-link>
            <router-link to="/register" class="main-header__register-btn">注册</router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="['HomeView', 'IPTVView']">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="pageTransitionKey" />
          </Transition>
        </KeepAlive>
      </RouterView>
    </main>

    <!-- 底部页脚 -->
    <footer v-if="!hideShellChrome" class="main-footer">
      <div class="main-footer__container">
        <div class="main-footer__brand">
          <span class="main-footer__logo">Nest TV</span>
          <p class="main-footer__desc">高清影视在线观看平台</p>
        </div>
        <div class="main-footer__links">
          <router-link to="/" class="main-footer__link">首页</router-link>
          <router-link to="/recommendations" class="main-footer__link">推荐</router-link>
          <router-link to="/iptv" class="main-footer__link">IPTV</router-link>
        </div>
        <div class="main-footer__copyright">
          &copy; {{ currentYear }} Nest TV. All rights reserved.
        </div>
      </div>
    </footer>

    <!-- 移动端底部导航 -->
    <nav v-if="!hideShellChrome" class="mobile-nav">
      <router-link to="/" class="mobile-nav__item" :class="{ active: route.path === '/' }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>首页</span>
      </router-link>
      <router-link
        to="/categories"
        class="mobile-nav__item"
        :class="{ active: route.path === '/categories' }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span>分类</span>
      </router-link>
      <router-link
        to="/recommendations"
        class="mobile-nav__item"
        :class="{ active: route.path === '/recommendations' }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
        <span>推荐</span>
      </router-link>
      <router-link to="/iptv" class="mobile-nav__item" :class="{ active: route.path === '/iptv' }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span>IPTV</span>
      </router-link>
      <router-link
        :to="authStore.isAuthenticated ? '/profile' : '/login'"
        class="mobile-nav__item"
        :class="{ active: route.path === '/profile' }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useTheme } from '@/composables/useTheme';

  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();

  const searchQuery = ref('');
  const showUserMenu = ref(false);
  const { theme, isDark, isSystemTheme, toggleTheme } = useTheme();

  const currentYear = new Date().getFullYear();

  const themeToggleLabel = computed(() => {
    if (theme.value === 'dark') return '当前深色模式，切换到浅色模式';
    if (theme.value === 'light') return '当前浅色模式，切换到跟随系统';
    return '当前跟随系统，切换到深色模式';
  });

  const pageTransitionKey = computed(() => {
    if (route.name === 'media-detail' || route.name === 'watch') {
      return `${String(route.name)}:${String(route.params.id ?? '')}`;
    }

    return String(route.name ?? route.path);
  });

  const hideShellChrome = computed(() => route.meta?.immersive === true);

  const isAdmin = computed(() => {
    const role = authStore.user?.role;
    return role === 'admin' || role === 'superAdmin';
  });

  const userInitial = computed(() => {
    const name = authStore.user?.nickname || authStore.user?.username || '';
    return name.charAt(0).toUpperCase();
  });

  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      router.push({ path: '/', query: { q: searchQuery.value.trim() } });
    }
  };

  const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
  };

  const handleLogout = () => {
    authStore.logout();
    showUserMenu.value = false;
    router.push('/');
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.main-header__user')) {
      showUserMenu.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped>
  .main-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--app-shell-bg);
    color: var(--text-primary);
  }

  .main-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--app-header-bg);
    backdrop-filter: blur(18px) saturate(135%);
    border-bottom: 1px solid var(--border-primary);
    box-shadow: var(--app-header-shadow);
  }

  .main-header__container {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 var(--page-gutter);
    height: var(--app-header-height);
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .main-header__logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: inherit;
    font-weight: 700;
    font-size: 17px;
  }

  .main-header__logo-icon {
    width: 26px;
    height: 26px;
    color: var(--color-brand-primary);
  }

  .main-header__logo-text {
    background: linear-gradient(
      135deg,
      var(--color-brand-primary),
      var(--color-brand-accent-light)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }

  .main-header__nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .main-header__nav-item {
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .main-header__nav-item svg {
    width: 18px;
    height: 18px;
  }

  .main-header__nav-item:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .main-header__nav-item:focus-visible,
  .main-header__icon-btn:focus-visible,
  .main-header__user-btn:focus-visible,
  .main-header__login-btn:focus-visible,
  .main-header__register-btn:focus-visible,
  .mobile-nav__item:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }

  .main-header__nav-item.active {
    background: rgba(229, 9, 20, 0.16);
    color: var(--color-brand-primary-light);
    box-shadow: inset 0 0 0 1px rgba(229, 9, 20, 0.28);
  }

  .main-header__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .main-header__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface-muted);
    color: var(--text-muted);
    box-shadow: inset 0 0 0 1px var(--border-primary);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    flex-shrink: 0;
  }

  .main-header__icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .main-header__icon-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .main-header__icon-btn--system {
    color: var(--color-brand-primary-light);
    box-shadow:
      inset 0 0 0 1px var(--color-brand-border),
      0 0 0 3px var(--color-brand-overlay);
  }

  .main-header__search {
    position: relative;
    width: clamp(220px, 24vw, 340px);
    min-width: 0;
    flex-shrink: 1;
  }

  .main-header__search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--text-muted);
  }

  .main-header__search-input {
    width: 100%;
    height: 38px;
    padding: 0 16px 0 40px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--surface-control);
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: all 0.2s;
  }

  .main-header__search-input:focus {
    border-color: var(--border-focus);
    background: var(--surface-card-hover);
    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.16);
  }

  .main-header__search-input::placeholder {
    color: var(--text-muted);
  }

  .main-header__user {
    position: relative;
  }

  .main-header__user-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 3px 12px 3px 3px;
    border: none;
    border-radius: 8px;
    background: var(--surface-muted);
    box-shadow: inset 0 0 0 1px var(--border-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .main-header__user-btn:hover {
    background: var(--surface-hover);
  }

  .main-header__user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    color: var(--text-inverse);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
  }

  .main-header__user-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .main-header__dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 200px;
    background: var(--bg-card);
    border-radius: 8px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-primary);
    overflow: hidden;
    z-index: 50;
  }

  .main-header__dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: var(--touch-target);
    padding: 0 16px;
    text-decoration: none;
    color: var(--text-primary);
    font-size: 14px;
    transition: background 0.2s;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
  }

  .main-header__dropdown-item svg {
    width: 16px;
    height: 16px;
    color: var(--text-muted);
  }

  .main-header__dropdown-item:hover {
    background: var(--surface-hover);
  }

  .main-header__dropdown-item--danger {
    color: var(--color-error);
  }

  .main-header__dropdown-item--danger svg {
    color: var(--color-error);
  }

  .main-header__dropdown-item--danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .main-header__dropdown-divider {
    height: 1px;
    background: var(--border-primary);
    margin: 4px 0;
  }

  .main-header__auth {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .main-header__login-btn {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-link);
    background: transparent;
    border: 1px solid rgba(229, 9, 20, 0.3);
    transition: all 0.2s;
  }

  .main-header__login-btn:hover {
    background: rgba(229, 9, 20, 0.1);
    border-color: var(--border-focus);
  }

  .main-header__register-btn {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-inverse);
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    transition: all 0.2s;
  }

  .main-header__register-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(229, 9, 20, 0.4);
  }

  .main-content {
    flex: 1;
    min-width: 0;
  }

  .main-layout--immersive {
    background: var(--bg-page);
  }

  .main-footer {
    background: var(--app-footer-bg);
    color: var(--text-muted);
    padding: 40px 0;
    margin-top: auto;
    border-top: 1px solid var(--app-footer-border);
    box-shadow: var(--app-footer-shadow);
  }

  .main-footer__container {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .main-footer__brand {
    text-align: center;
  }

  .main-footer__logo {
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(
      135deg,
      var(--color-brand-primary),
      var(--color-brand-accent-light)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .main-footer__desc {
    margin-top: 8px;
    font-size: 14px;
  }

  .main-footer__links {
    display: flex;
    gap: 24px;
  }

  .main-footer__link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .main-footer__link:hover {
    color: var(--text-link-hover);
  }

  .main-footer__copyright {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .page-fade-enter-active,
  .page-fade-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .page-fade-enter-from {
    opacity: 0;
    transform: translateY(6px);
  }

  .page-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: all 0.2s ease;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }

  @media (max-width: 1024px) {
    .main-header__container {
      gap: 12px;
    }

    .main-header__nav-item {
      padding: 0 9px;
      font-size: 13px;
    }

    .main-header__search {
      width: 210px;
    }
  }

  /* 移动端底部导航 */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-header);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border-primary);
    z-index: 100;
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom, 0));
    box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.16);
  }

  .mobile-nav__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    justify-content: center;
    min-width: var(--touch-target);
    min-height: var(--touch-target);
    padding: 5px 0;
    text-decoration: none;
    color: var(--text-muted);
    font-size: 10px;
    transition: color 0.2s;
  }

  .mobile-nav__item svg {
    width: 22px;
    height: 22px;
  }

  .mobile-nav__item.active {
    color: var(--color-brand-primary);
  }

  .mobile-nav__item.active::before {
    content: '';
    position: absolute;
    top: 0;
    width: 18px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
  }

  @media (max-width: 768px) {
    .main-header__container {
      padding: 0 var(--page-gutter);
      gap: 12px;
      height: var(--app-header-height);
    }

    .main-header__nav {
      display: none;
    }

    .main-header__search {
      flex: 1 1 auto;
      width: auto;
    }

    .main-header__icon-btn:not(.main-header__theme-btn),
    .main-header__auth {
      display: none;
    }

    .main-header__user-name {
      display: none;
    }

    .main-footer {
      display: none;
    }

    .main-content {
      padding-bottom: calc(64px + env(safe-area-inset-bottom, 0));
    }

    .main-layout--immersive .main-content {
      padding-bottom: 0;
    }

    .mobile-nav {
      display: flex;
      justify-content: space-around;
    }
  }

  @media (max-width: 480px) {
    .main-header__logo-text {
      display: none;
    }

    .main-header__search {
      width: auto;
    }
  }
</style>
