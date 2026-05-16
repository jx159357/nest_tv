<template>
  <div class="not-found">
    <div class="not-found__container">
      <!-- 动画图标 -->
      <div class="not-found__icon">
        <div class="not-found__icon-eyes">
          <div class="not-found__eye not-found__eye--left"></div>
          <div class="not-found__eye not-found__eye--right"></div>
        </div>
        <div class="not-found__icon-mouth"></div>
      </div>

      <!-- 错误标题 -->
      <h1 class="not-found__title">404</h1>
      <h2 class="not-found__subtitle">页面未找到</h2>

      <!-- 错误描述 -->
      <p class="not-found__description">
        抱歉，您访问的页面不存在。可能是链接有误，或者页面已被移除。
      </p>

      <!-- 操作按钮 -->
      <div class="not-found__actions">
        <router-link to="/" class="not-found__button not-found__button--primary">
          <svg class="not-found__button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          返回首页
        </router-link>

        <button class="not-found__button not-found__button--secondary" @click="goBack">
          <svg class="not-found__button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回上页
        </button>
      </div>

      <!-- 搜索建议 -->
      <div class="not-found__suggestions">
        <h3 class="not-found__suggestions-title">您可能在找...</h3>
        <div class="not-found__suggestions-list">
          <router-link to="/" class="not-found__suggestion">
            <span class="not-found__suggestion-icon">🏠</span>
            <span class="not-found__suggestion-text">热门视频</span>
          </router-link>
          <router-link to="/recommendations" class="not-found__suggestion">
            <span class="not-found__suggestion-icon">✨</span>
            <span class="not-found__suggestion-text">推荐内容</span>
          </router-link>
          <router-link to="/watch-history" class="not-found__suggestion">
            <span class="not-found__suggestion-icon">🕘</span>
            <span class="not-found__suggestion-text">观看历史</span>
          </router-link>
          <router-link to="/favorites" class="not-found__suggestion">
            <span class="not-found__suggestion-icon">❤️</span>
            <span class="not-found__suggestion-text">我的收藏</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted } from 'vue';

  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  onMounted(() => {
    document.title = '404 - 页面未找到 - Nest TV';
  });
</script>

<style scoped>
  .not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 200px);
    padding: var(--spacing-4);
  }

  .not-found__container {
    text-align: center;
    max-width: 28rem;
    animation: not-found-fade-in 0.5s ease-out;
  }

  /* 动画图标 */
  .not-found__icon {
    position: relative;
    width: 6rem;
    height: 6rem;
    margin: 0 auto var(--spacing-6);
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: not-found-bounce 2s ease-in-out infinite;
  }

  .not-found__icon-eyes {
    display: flex;
    gap: var(--spacing-4);
    margin-top: -0.5rem;
  }

  .not-found__eye {
    width: 0.75rem;
    height: 0.75rem;
    background: var(--text-muted);
    border-radius: var(--radius-full);
    animation: not-found-blink 3s ease-in-out infinite;
  }

  .not-found__eye--right {
    animation-delay: 0.5s;
  }

  .not-found__icon-mouth {
    position: absolute;
    bottom: 1.25rem;
    width: 1.5rem;
    height: 0.5rem;
    border-bottom: 2px solid var(--text-muted);
    border-radius: 0 0 var(--radius-full) var(--radius-full);
  }

  /* 标题 */
  .not-found__title {
    font-size: 4rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-brand-primary);
    margin-bottom: var(--spacing-2);
    line-height: 1;
  }

  .not-found__subtitle {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-3);
  }

  .not-found__description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-8);
  }

  /* 操作按钮 */
  .not-found__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-8);
  }

  .not-found__button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-5);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-lg);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .not-found__button-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .not-found__button--primary {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .not-found__button--primary:hover {
    background: var(--color-brand-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .not-found__button--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }

  .not-found__button--secondary:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* 搜索建议 */
  .not-found__suggestions {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-primary);
    padding: var(--spacing-5);
  }

  .not-found__suggestions-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-4);
  }

  .not-found__suggestions-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-2);
  }

  .not-found__suggestion {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .not-found__suggestion:hover {
    background: var(--bg-secondary);
  }

  .not-found__suggestion-icon {
    font-size: 1rem;
  }

  .not-found__suggestion-text {
    font-size: var(--font-size-sm);
    color: var(--text-link);
  }

  /* 动画 */
  @keyframes not-found-fade-in {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes not-found-bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-0.5rem);
    }
  }

  @keyframes not-found-blink {
    0%,
    45%,
    55%,
    100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.1);
    }
  }

  /* 响应式 */
  @media (max-width: 480px) {
    .not-found__title {
      font-size: 3rem;
    }

    .not-found__suggestions-list {
      grid-template-columns: 1fr;
    }
  }

  /* 暗色模式 */
  [data-theme='dark'] .not-found__icon,
  .dark .not-found__icon {
    background: var(--bg-tertiary);
  }

  [data-theme='dark'] .not-found__title,
  .dark .not-found__title {
    color: var(--color-brand-primary-light);
  }

  [data-theme='dark'] .not-found__subtitle,
  .dark .not-found__subtitle {
    color: var(--text-primary);
  }

  [data-theme='dark'] .not-found__description,
  .dark .not-found__description {
    color: var(--text-secondary);
  }

  [data-theme='dark'] .not-found__suggestions,
  .dark .not-found__suggestions {
    background: var(--bg-card);
    border-color: var(--border-primary);
  }
</style>
