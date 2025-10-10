<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
            <span class="ml-4 text-gray-500">|</span>
            <span class="ml-4 text-lg font-medium text-gray-700">后台管理</span>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-600 hover:text-gray-900"> 返回前台 </router-link>
            <router-link to="/profile" class="text-gray-600 hover:text-gray-900">
              个人中心
            </router-link>
            <button class="text-red-600 hover:text-red-900" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 侧边栏和主内容 -->
    <div class="flex">
      <!-- 移动端警告 -->
      <div
        v-if="showMobileWarning"
        class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-lg p-6 max-w-sm w-full text-center">
          <svg
            class="w-12 h-12 text-orange-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.035-1.666 2.035-3.657 0 1.337-.645 3.228-2.42 3.228-3.657z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">设备不支持</h3>
          <p class="text-gray-600 mb-4">
            后台管理功能需要在大屏幕设备上使用，请使用平板或电脑访问。
          </p>
          <div class="space-y-3 text-left">
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 7.293a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414l3 3a1 1 0 001.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              建议屏幕尺寸：≥ 768px
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 7.293a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414l3 3a1 1 0 001.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              推荐设备：iPad、笔记本电脑、台式机
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 7.293a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414l3 3a1 1 0 001.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              功能受限：在移动设备上无法使用后台管理功能
            </div>
          </div>
          <button
            class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @click="router.push('/')"
          >
            返回首页
          </button>
        </div>
      </div>

      <!-- 侧边栏 -->
      <aside class="w-64 bg-white shadow-sm h-screen sticky top-0">
        <nav class="p-4">
          <ul class="space-y-2">
            <li>
              <router-link
                to="/admin/dashboard"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'dashboard' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7-7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v-3m0 0h-3m-6 0h3"
                  />
                </svg>
                仪表盘
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/users"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'users' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292 0 4.465 4.465 0 00.702-.052l4.335-3.511c.287-.268.508-.767.508-1.251V6.5a.5.5 0 00-2.249-.83L9.876 2.69a.5.5 0 00-1.752 0L2.25 5.67A.5.5 0 000 6.5v7.656a5.5 0 001.752 0l4.335 3.511a.5.5 0 001.752 0L21.75 14.33a5.5 0 002.249-.83V6.5z"
                  />
                </svg>
                用户管理
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/media"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'media' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M7 12h10M7 16h10"
                  />
                </svg>
                内容管理
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/play-sources"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'play-sources' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.553-4.276A1 1 0 0015 8.618v-6.764a1 1 0 00-1.447-.894L5 10z"
                  />
                </svg>
                播放源管理
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/watch-history"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'watch-history' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                观看历史
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/roles"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'roles' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                角色权限
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin/logs"
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                :class="{ 'bg-indigo-50 text-indigo-700': currentRoute === 'logs' }"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707H19a2 2 0 012 2z"
                  />
                </svg>
                系统日志
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 主内容区域 -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();

  // 计算当前路由名称
  const currentRoute = computed(() => {
    const path = route.path;
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/media')) return 'media';
    if (path.includes('/admin/play-sources')) return 'play-sources';
    if (path.includes('/admin/watch-history')) return 'watch-history';
    if (path.includes('/admin/roles')) return 'roles';
    if (path.includes('/admin/logs')) return 'logs';
    return '';
  });

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await authStore.logout();
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  // 检查用户权限和设备适配
  onMounted(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
      return;
    }

    // 检查是否为移动设备
    const isMobile = checkMobileDevice();
    if (isMobile) {
      showMobileWarning.value = true;
      return;
    }

    // 这里可以添加管理员权限检查
    // if (!authStore.user?.isAdmin) {
    //   router.push('/')
    //   return
    // }
  });

  // 检查是否为移动设备
  const checkMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  };
</script>
