<template>
  <div class="user-dashboard">
    <!-- 用户信息概览 -->
    <div class="dashboard-header">
      <div class="user-info">
        <img
          :src="authStore.user?.avatar || '/default-avatar.png'"
          :alt="authStore.user?.username || '用户头像'"
          class="user-avatar"
        />
        <div class="user-details">
          <h2 class="user-name">{{ authStore.user?.nickname || authStore.user?.username }}</h2>
          <p class="user-role">{{ getUserRoleText(authStore.user?.role) }}</p>
          <p class="user-stats">
            <span class="stat-item">
              <strong>{{ dashboardStats.totalWatched }}</strong> 次观看
            </span>
            <span class="stat-item">
              <strong>{{ dashboardStats.totalFavorites }}</strong> 个收藏
            </span>
            <span class="stat-item">
              <strong>{{ dashboardStats.averageRating }}</strong> 平均评分
            </span>
          </p>
        </div>
      </div>

      <!-- 设置按钮 -->
      <div class="dashboard-actions">
        <button class="action-btn" @click="editProfile">⚙️ 编辑资料</button>
        <button class="action-btn" @click="openSettings">🔧 账户设置</button>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-section">
      <div class="section-title">📊 观看统计</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatTime(dashboardStats.totalWatchTime) }}</div>
            <div class="stat-label">总观看时长</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboardStats.watchThisWeek }}次</div>
            <div class="stat-label">本周观看</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboardStats.completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ getPreferredGenreText() }}</div>
            <div class="stat-label">偏好类型</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 个性化推荐 -->
    <div class="recommendations-section">
      <div class="section-header">
        <h3 class="section-title">🎯 为您推荐</h3>
        <button
          class="refresh-btn"
          :disabled="recommendationsLoading"
          @click="refreshRecommendations"
        >
          {{ recommendationsLoading ? '🔄' : '🔄 刷新' }}
        </button>
      </div>

      <div v-if="recommendationsLoading" class="loading-container">
        <div class="loading-spinner">🔄</div>
        <p>正在为您生成个性化推荐...</p>
      </div>

      <div v-else-if="recommendationsError" class="error-container">
        <p>❌ {{ recommendationsError }}</p>
        <button class="retry-btn" @click="refreshRecommendations">重试</button>
      </div>

      <div v-else class="recommendations-grid">
        <MediaCard
          v-for="media in personalizedMedia"
          :key="media.id"
          :media="media"
          :show-rating="true"
          :show-view-count="true"
          size="medium"
          clickable
          @click="goToMedia(media.id)"
        />

        <div v-if="personalizedMedia.length === 0" class="empty-state">
          <p>🎭 暂无推荐内容，请多观看一些视频来帮助我们为您推荐</p>
          <button class="discover-btn" @click="goToBrowse">浏览内容</button>
        </div>
      </div>
    </div>

    <!-- 观看历史分析 -->
    <div class="history-analysis-section">
      <div class="section-header">
        <h3 class="section-title">📈 观看习惯分析</h3>
        <button class="details-btn" @click="showDetailedAnalysis = !showDetailedAnalysis">
          {{ showDetailedAnalysis ? '🔼' : '🔽' }} {{ showDetailedAnalysis ? '收起' : '详情' }}
        </button>
      </div>

      <div class="analysis-summary">
        <div class="summary-item">
          <span class="summary-label">最活跃时段：</span>
          <span class="summary-value">{{ getMostActiveTime() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">偏好质量：</span>
          <span class="summary-value">{{ getPreferredQuality() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">连续观看：</span>
          <span class="summary-value">{{ getStreakDays() }}天</span>
        </div>
      </div>

      <div v-if="showDetailedAnalysis" class="detailed-analysis">
        <div class="analysis-chart">
          <h4>📊 每日观看时长</h4>
          <div class="chart-placeholder">
            <!-- 这里可以集成图表库如Chart.js -->
            <div v-for="(day, index) in watchTimeByDay" :key="index" class="chart-bar">
              <div class="chart-bar-fill" :style="{ height: day.hours * 20 + 'px' }"></div>
              <div class="chart-bar-label">{{ day.day }}</div>
            </div>
          </div>
        </div>

        <div class="analysis-insights">
          <h4>💡 观看洞察</h4>
          <div class="insight-item">
            <span class="insight-bullet">🎯</span>
            <span>您通常在{{ getMostActiveTime() }}观看最多内容</span>
          </div>
          <div class="insight-item">
            <span class="insight-bullet">🎬</span>
            <span>{{ getMostWatchedGenre() }}是您最喜爱的类型</span>
          </div>
          <div class="insight-item">
            <span class="insight-bullet">⏰</span>
            <span>您的平均观看时长为{{ getAverageSessionTime() }}分钟</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="quick-actions-section">
      <h3 class="section-title">⚡ 快捷功能</h3>
      <div class="actions-grid">
        <button class="quick-action-btn" @click="goToWatchHistory">📊 观看历史</button>
        <button class="quick-action-btn" @click="goToFavorites">⭐ 我的收藏</button>
        <button class="quick-action-btn" @click="goToRecommendations">🎯 推荐设置</button>
        <button class="quick-action-btn" @click="exportData">📥 导出数据</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { notifyInfo } from '@/composables/useModal';
  import { useAuthStore } from '@/stores/auth';
  import { useRecommendationService } from '@/services/recommendation.service';
  import MediaCard from '@/components/ui/MediaCard.vue';

  const router = useRouter();
  const authStore = useAuthStore();
  const recommendationService = useRecommendationService();
  const recommendationsLoading = computed(() => recommendationService.isLoading.value);
  const recommendationsError = computed(() => recommendationService.error.value);
  const personalizedMedia = computed(() => recommendationService.personalizedMedia.value);

  // 响应式状态
  const showDetailedAnalysis = ref(false);

  // 模拟仪表板统计数据
  const dashboardStats = ref({
    totalWatched: 156,
    totalFavorites: 42,
    averageRating: 8.2,
    totalWatchTime: 12450, // 分钟
    watchThisWeek: 23,
    completionRate: 85,
    preferredGenres: ['电影', '纪录片', '动画'],
  });

  // 模拟观看时间数据
  const watchTimeByDay = ref([
    { day: '周一', hours: 2.5 },
    { day: '周二', hours: 1.8 },
    { day: '周三', hours: 3.2 },
    { day: '周四', hours: 2.1 },
    { day: '周五', hours: 4.5 },
    { day: '周六', hours: 6.2 },
    { day: '周日', hours: 5.8 },
  ]);

  // 用户画像分析
  const userPreferences = ref({
    mostActiveTime: '晚上20:00-22:00',
    preferredQuality: '高清',
    streakDays: 12,
    mostWatchedGenre: '电影',
    averageSessionTime: 45,
  });

  // 方法
  const editProfile = () => {
    router.push('/profile');
  };

  const openSettings = () => {
    router.push('/settings');
  };

  const goToMedia = (mediaId: number) => {
    router.push(`/watch/${mediaId}`);
  };

  const goToBrowse = () => {
    router.push('/');
  };

  const goToWatchHistory = () => {
    router.push('/watch-history');
  };

  const goToFavorites = () => {
    router.push('/favorites');
  };

  const goToRecommendations = () => {
    router.push({ name: 'recommendations', query: { focus: 'profile' } });
  };

  const exportData = () => {
    notifyInfo('功能开发中', '数据导出功能正在规划中，后续版本会补充。');
  };

  const refreshRecommendations = async () => {
    await recommendationService.generatePersonalizedRecommendations();
  };

  // 工具函数
  const getUserRoleText = (role?: string) => {
    const roleMap: Record<string, string> = {
      user: '普通用户',
      vip: 'VIP用户',
      admin: '管理员',
      superAdmin: '超级管理员',
    };
    return roleMap[role || 'user'] || '普通用户';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getPreferredGenreText = () => {
    return dashboardStats.value.preferredGenres[0] || '电影';
  };

  const getMostActiveTime = () => {
    return userPreferences.value.mostActiveTime;
  };

  const getPreferredQuality = () => {
    return userPreferences.value.preferredQuality;
  };

  const getStreakDays = () => {
    return userPreferences.value.streakDays;
  };

  const getMostWatchedGenre = () => {
    return userPreferences.value.mostWatchedGenre;
  };

  const getAverageSessionTime = () => {
    return userPreferences.value.averageSessionTime;
  };

  // 生命周期
  onMounted(async () => {
    // 加载个性化推荐
    if (authStore.isAuthenticated) {
      await refreshRecommendations();
    }
  });
</script>

<style scoped>
  .user-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--background-primary);
    color: var(--text-primary);
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--background-secondary);
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .user-avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary-color);
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .user-role {
    margin: 0 0 0.5rem 0;
    color: var(--primary-color);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .user-stats {
    display: flex;
    gap: 1.5rem;
    margin: 0;
    font-size: 0.875rem;
  }

  .stat-item {
    color: var(--text-secondary);
  }

  .stat-item strong {
    color: var(--primary-color);
    font-weight: 600;
  }

  .dashboard-actions {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .action-btn:hover {
    background: var(--primary-hover-color);
    transform: translateY(-1px);
  }

  .section-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stats-section,
  .recommendations-section,
  .history-analysis-section,
  .quick-actions-section {
    margin-bottom: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: var(--background-secondary);
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stat-icon {
    font-size: 2rem;
    width: 3rem;
    text-align: center;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .refresh-btn,
  .details-btn {
    padding: 0.5rem 1rem;
    background: var(--background-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .refresh-btn:hover,
  .details-btn:hover {
    background: var(--background-primary);
    border-color: var(--primary-color);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-container,
  .error-container {
    text-align: center;
    padding: 3rem;
    background: var(--background-secondary);
    border-radius: 0.75rem;
    color: var(--text-secondary);
  }

  .loading-spinner {
    font-size: 2rem;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .discover-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .analysis-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .summary-item {
    background: var(--background-secondary);
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .summary-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .detailed-analysis {
    background: var(--background-secondary);
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: grid;
    gap: 2rem;
  }

  .analysis-chart,
  .analysis-insights {
    background: var(--background-primary);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
  }

  .chart-placeholder {
    display: flex;
    align-items: end;
    justify-content: space-around;
    height: 200px;
    padding: 1rem 0;
  }

  .chart-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .chart-bar-fill {
    width: 2rem;
    background: var(--primary-color);
    border-radius: 0.25rem 0.25rem 0 0;
    min-height: 0.5rem;
    transition: height var(--transition-slow);
  }

  .chart-bar-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .insight-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .insight-bullet {
    flex-shrink: 0;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .quick-action-btn {
    padding: 1rem;
    background: var(--background-secondary);
    border: 2px solid var(--border-color);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .quick-action-btn:hover {
    border-color: var(--primary-color);
    background: var(--background-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .user-dashboard {
      padding: 1rem;
    }

    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
    }

    .user-stats {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .dashboard-actions {
      width: 100%;
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .recommendations-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .actions-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .user-info {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>


