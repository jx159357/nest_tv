<template>
  <div class="main-layout">
    <!-- 顶部导航栏 -->
    <header class="main-header">
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
          <router-link to="/" class="main-header__nav-item" :class="{ active: $route.path === '/' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>首页</span>
          </router-link>

          <router-link to="/recommendations" class="main-header__nav-item" :class="{ active: $route.path === '/recommendations' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>推荐</span>
          </router-link>

          <router-link to="/iptv" class="main-header__nav-item" :class="{ active: $route.path === '/iptv' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>IPTV</span>
          </router-link>

          <router-link to="/torrent" class="main-header__nav-item" :class="{ active: $route.path === '/torrent' }">
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
          <!-- 搜索框 -->
          <div class="main-header__search">
            <svg class="main-header__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="main-header__search-input"
              placeholder="搜索影视、电视剧..."
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 用户菜单 -->
          <div v-if="authStore.isAuthenticated" class="main-header__user">
            <button class="main-header__user-btn" @click="toggleUserMenu">
              <div class="main-header__user-avatar">
                {{ userInitial }}
              </div>
              <span class="main-header__user-name">{{ authStore.user?.nickname || authStore.user?.username }}</span>
            </button>

            <!-- 用户下拉菜单 -->
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="main-header__dropdown">
                <router-link to="/profile" class="main-header__dropdown-item" @click="showUserMenu = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  个人中心
                </router-link>
                <router-link to="/favorites" class="main-header__dropdown-item" @click="showUserMenu = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  我的收藏
                </router-link>
                <router-link to="/watch-history" class="main-header__dropdown-item" @click="showUserMenu = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  观看历史
                </router-link>
                <router-link to="/settings" class="main-header__dropdown-item" @click="showUserMenu = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  设置
                </router-link>
                <div class="main-header__dropdown-divider"></div>
                <button class="main-header__dropdown-item main-header__dropdown-item--danger" @click="handleLogout">
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
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- 底部页脚 -->
    <footer class="main-footer">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref('');
const showUserMenu = ref(false);

const currentYear = new Date().getFullYear();

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
  background: #0a0f1a;
  color: #e2e8f0;
}

/* Header */
.main-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 15, 26, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.main-header__container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.main-header__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  font-weight: 700;
  font-size: 20px;
}

.main-header__logo-icon {
  width: 28px;
  height: 28px;
  color: #6366f1;
}

.main-header__logo-text {
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-header__nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.main-header__nav-item svg {
  width: 18px;
  height: 18px;
}

.main-header__nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

.main-header__nav-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

.main-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-header__search {
  position: relative;
  width: 280px;
}

.main-header__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #64748b;
}

.main-header__search-input {
  width: 100%;
  height: 40px;
  padding: 0 16px 0 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  transition: all 0.2s;
}

.main-header__search-input:focus {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.main-header__search-input::placeholder {
  color: #64748b;
}

.main-header__user {
  position: relative;
}

.main-header__user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 4px 4px;
  border: none;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.main-header__user-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-header__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.main-header__user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
}

.main-header__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 200px;
  background: #141a2a;
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  z-index: 50;
}

.main-header__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  text-decoration: none;
  color: #e2e8f0;
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
  color: #64748b;
}

.main-header__dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.main-header__dropdown-item--danger {
  color: #ef4444;
}

.main-header__dropdown-item--danger svg {
  color: #ef4444;
}

.main-header__dropdown-item--danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.main-header__dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0;
}

.main-header__auth {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-header__login-btn {
  padding: 8px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: #a5b4fc;
  background: transparent;
  border: 1px solid rgba(99, 102, 241, 0.3);
  transition: all 0.2s;
}

.main-header__login-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.main-header__register-btn {
  padding: 8px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  transition: all 0.2s;
}

.main-header__register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

/* Main Content */
.main-content {
  flex: 1;
}

/* Footer */
.main-footer {
  background: #0a0f1a;
  color: #64748b;
  padding: 40px 0;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.main-footer__container {
  max-width: 1400px;
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
  background: linear-gradient(135deg, #6366f1, #a78bfa);
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
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.main-footer__link:hover {
  color: #a5b4fc;
}

.main-footer__copyright {
  font-size: 12px;
  color: #475569;
}

/* Transitions */
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

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .main-header__container {
    padding: 0 16px;
    gap: 16px;
  }

  .main-header__nav {
    display: none;
  }

  .main-header__search {
    width: 200px;
  }

  .main-header__user-name {
    display: none;
  }
}
</style>
