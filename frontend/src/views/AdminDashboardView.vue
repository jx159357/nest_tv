<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="mt-2 text-gray-600">系统概览和关键数据统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 用户总数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292 0 4.465 4.465 0 00.702-.052l4.335-3.511c.287-.268.508-.767.508-1.251V6.5a.5.5 0 00-2.249-.83L9.876 2.69a.5.5 0 00-1.752 0L2.25 5.67A.5.5 0 000 6.5v7.656a5.5 0 001.752 0l4.335 3.511a.5.5 0 001.752 0L21.75 14.33a.5.5 0 002.249-.83V6.5z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">用户总数</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ stats.userCount }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 媒体资源数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M7 12h10M7 16h10"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">媒体资源</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ stats.mediaCount }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放源数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.553-4.276A1 1 0 0015 8.618v-6.764a1 1 0 00-1.447-.894L5 10z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">播放源</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.playSourceCount }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 观看历史数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">观看历史</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.watchHistoryCount }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近管理活动 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">最近管理活动</h3>
        </div>
        <div class="border-t border-gray-200">
          <div v-if="loading" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="mt-2 text-gray-500">加载中...</p>
          </div>
          <div v-else-if="stats.recentActivity.length > 0" class="px-4 py-5 sm:p-6">
            <ul class="divide-y divide-gray-200">
              <li v-for="log in stats.recentActivity" :key="log.id" class="py-4">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        log.status === 'success'
                          ? 'bg-green-100'
                          : log.status === 'error'
                            ? 'bg-red-100'
                            : 'bg-yellow-100',
                      ]"
                    >
                      <svg
                        class="w-5 h-5"
                        :class="[
                          log.status === 'success'
                            ? 'text-green-600'
                            : log.status === 'error'
                              ? 'text-red-600'
                              : 'text-yellow-600',
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          :d="
                            log.status === 'success'
                              ? 'M5 13l4 4L19 7'
                              : log.status === 'error'
                                ? 'M6 18L18 6M6 6l12 12'
                                : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 3.035-1.666 3.035-3.657 0 1.337-.645 3.228-2.42 3.228-3.657z'
                          "
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{ getActionText(log.action) }} - {{ getResourceText(log.resource) }}
                    </p>
                    <p class="text-sm text-gray-500">{{ formatDate(log.createdAt) }}</p>
                    <p v-if="log.description" class="text-sm text-gray-600 mt-1">
                      {{ log.description }}
                    </p>
                    <p
                      v-if="log.status === 'error' && log.errorMessage"
                      class="text-sm text-red-600 mt-1"
                    >
                      {{ log.errorMessage }}
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div v-else class="px-4 py-5 sm:p-6 text-center">
            <p class="text-gray-500">暂无管理活动记录</p>
          </div>
        </div>
      </div>

      <!-- 系统健康状态 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">系统状态</h3>
        </div>
        <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div v-if="healthLoading" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="mt-2 text-gray-500">检测中...</p>
          </div>
          <div v-else-if="health" class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">服务状态</span>
              <span
                :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  health.status === 'ok'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800',
                ]"
              >
                {{ health.status === 'ok' ? '正常' : '异常' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">运行时间</span>
              <span class="text-sm text-gray-600">{{ formatUptime(health.uptime) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">内存使用</span>
              <span class="text-sm text-gray-600">{{ formatMemory(health.memory) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">检查时间</span>
              <span class="text-sm text-gray-600">{{ formatDateTime(health.timestamp) }}</span>
            </div>
          </div>
          <div v-else class="text-center">
            <p class="text-red-600">无法获取系统状态</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '@/stores/auth';

  const authStore = useAuthStore();

  // 状态管理
  const stats = ref({
    userCount: 0,
    mediaCount: 0,
    playSourceCount: 0,
    watchHistoryCount: 0,
    recentActivity: [],
  });

  const loading = ref(false);
  const health = ref(null);
  const healthLoading = ref(false);

  // 加载统计数据
  const loadStats = async () => {
    if (!authStore.user?.id) return;

    loading.value = true;
    try {
      const response = await authStore.api.get('/admin/stats');
      stats.value = response.data;
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 加载系统健康状态
  const loadHealth = async () => {
    healthLoading.value = true;
    try {
      const response = await authStore.api.get('/admin/health');
      health.value = response.data;
    } catch (error) {
      console.error('加载系统状态失败:', error);
      health.value = null;
    } finally {
      healthLoading.value = false;
    }
  };

  // 获取操作文本
  const getActionText = action => {
    const actionMap = {
      create: '创建',
      update: '更新',
      delete: '删除',
      read: '查看',
      login: '登录',
      logout: '退出',
      export: '导出',
      import: '导入',
    };
    return actionMap[action] || action;
  };

  // 获取资源文本
  const getResourceText = resource => {
    const resourceMap = {
      user: '用户',
      media_resource: '媒体资源',
      play_source: '播放源',
      watch_history: '观看历史',
      recommendation: '推荐',
      admin_role: '管理员角色',
      admin_permission: '管理员权限',
      admin_log: '管理日志',
    };
    return resourceMap[resource] || resource;
  };

  // 格式化日期
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  // 格式化运行时间
  const formatUptime = seconds => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 格式化内存使用
  const formatMemory = memory => {
    const mb = Math.round(memory.rss / 1024 / 1024);
    const heapUsed = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memory.heapTotal / 1024 / 1024);

    return `${heapUsed}MB / ${heapTotal}MB (RSS: ${mb}MB)`;
  };

  // 格式化日期时间
  const formatDateTime = timestamp => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 组件挂载时加载数据
  onMounted(() => {
    loadStats();
    loadHealth();

    // 定时刷新数据
    const statsInterval = setInterval(loadStats, 30000); // 30秒刷新统计数据
    const healthInterval = setInterval(loadHealth, 60000); // 60秒刷新健康状态

    // 组件卸载时清除定时器
    return () => {
      clearInterval(statsInterval);
      clearInterval(healthInterval);
    };
  });
</script>
