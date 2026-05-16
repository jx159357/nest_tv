<template>
  <div v-if="error" class="error-boundary" :class="errorClasses">
    <div class="error-boundary__container">
      <!-- 错误图标 -->
      <div class="error-boundary__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <!-- 错误内容 -->
      <div class="error-boundary__content">
        <h3 class="error-boundary__title">{{ title }}</h3>
        <p class="error-boundary__message">{{ message }}</p>

        <!-- 错误详情 -->
        <div v-if="showDetails && errorDetails" class="error-boundary__details">
          <button class="error-boundary__details-toggle" @click="isDetailsOpen = !isDetailsOpen">
            {{ isDetailsOpen ? '隐藏详情' : '查看详情' }}
            <svg
              class="error-boundary__details-arrow"
              :class="{ 'error-boundary__details-arrow--open': isDetailsOpen }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div v-if="isDetailsOpen" class="error-boundary__details-content">
            <pre class="error-boundary__stack">{{ errorDetails }}</pre>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="error-boundary__actions">
          <button
            v-if="retryable"
            class="error-boundary__button error-boundary__button--primary"
            @click="handleRetry"
          >
            <svg
              class="error-boundary__button-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重试
          </button>
          <button
            v-if="showHome"
            class="error-boundary__button error-boundary__button--secondary"
            @click="goHome"
          >
            <svg
              class="error-boundary__button-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            返回首页
          </button>
          <button
            v-if="dismissible"
            class="error-boundary__button error-boundary__button--ghost"
            @click="dismiss"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  interface Props {
    error?: Error | string | null;
    title?: string;
    message?: string;
    type?: 'error' | 'warning' | 'info';
    retryable?: boolean;
    showHome?: boolean;
    dismissible?: boolean;
    showDetails?: boolean;
    size?: 'small' | 'medium' | 'large';
    centered?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '发生错误',
    message: '抱歉，操作过程中发生了错误',
    type: 'error',
    retryable: false,
    showHome: true,
    dismissible: true,
    showDetails: true,
    size: 'medium',
    centered: true,
  });

  const emit = defineEmits<{
    retry: [];
    dismiss: [];
  }>();

  const router = useRouter();
  const isDetailsOpen = ref(false);

  const errorClasses = computed(() => [
    `error-boundary--${props.type}`,
    `error-boundary--${props.size}`,
    {
      'error-boundary--centered': props.centered,
    },
  ]);

  const errorDetails = computed(() => {
    if (!props.error) return null;

    if (typeof props.error === 'string') {
      return props.error;
    }

    return props.error.stack || props.error.message;
  });

  const handleRetry = () => {
    emit('retry');
  };

  const goHome = () => {
    router.push('/');
  };

  const dismiss = () => {
    emit('dismiss');
  };
</script>

<style scoped>
  .error-boundary {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-primary);
    overflow: hidden;
    animation: error-slide-in 0.3s ease-out;
  }

  .error-boundary--centered {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-overlay);
    z-index: var(--z-modal);
    padding: var(--spacing-4);
  }

  .error-boundary--centered .error-boundary__container {
    max-width: 28rem;
    width: 100%;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
  }

  .error-boundary__container {
    padding: var(--spacing-6);
  }

  .error-boundary__icon {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-4);
  }

  .error-boundary__icon svg {
    width: 3rem;
    height: 3rem;
  }

  .error-boundary--error .error-boundary__icon svg {
    color: var(--color-error);
  }

  .error-boundary--warning .error-boundary__icon svg {
    color: var(--color-warning);
  }

  .error-boundary--info .error-boundary__icon svg {
    color: var(--color-info);
  }

  .error-boundary__content {
    text-align: center;
  }

  .error-boundary__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
  }

  .error-boundary__message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-4);
    line-height: var(--line-height-relaxed);
  }

  .error-boundary__details {
    margin-bottom: var(--spacing-4);
    text-align: left;
  }

  .error-boundary__details-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    width: 100%;
    padding: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .error-boundary__details-toggle:hover {
    color: var(--text-secondary);
    background: var(--bg-tertiary);
  }

  .error-boundary__details-arrow {
    width: 1rem;
    height: 1rem;
    transition: transform var(--transition-fast);
  }

  .error-boundary__details-arrow--open {
    transform: rotate(180deg);
  }

  .error-boundary__details-content {
    margin-top: var(--spacing-2);
    padding: var(--spacing-3);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    overflow: auto;
  }

  .error-boundary__stack {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 10rem;
    overflow-y: auto;
  }

  .error-boundary__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-2);
  }

  .error-boundary__button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-lg);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .error-boundary__button-icon {
    width: 1rem;
    height: 1rem;
  }

  .error-boundary__button--primary {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .error-boundary__button--primary:hover {
    background: var(--color-brand-primary-dark);
  }

  .error-boundary__button--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }

  .error-boundary__button--secondary:hover {
    background: var(--bg-tertiary);
  }

  .error-boundary__button--ghost {
    background: transparent;
    color: var(--text-muted);
  }

  .error-boundary__button--ghost:hover {
    color: var(--text-secondary);
    background: var(--bg-secondary);
  }

  /* 尺寸变体 */
  .error-boundary--small .error-boundary__container {
    padding: var(--spacing-4);
  }

  .error-boundary--small .error-boundary__icon svg {
    width: 2rem;
    height: 2rem;
  }

  .error-boundary--small .error-boundary__title {
    font-size: var(--font-size-base);
  }

  .error-boundary--large .error-boundary__container {
    padding: var(--spacing-8);
  }

  .error-boundary--large .error-boundary__icon svg {
    width: 4rem;
    height: 4rem;
  }

  .error-boundary--large .error-boundary__title {
    font-size: var(--font-size-xl);
  }

  @keyframes error-slide-in {
    from {
      opacity: 0;
      transform: translateY(-1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 暗色模式 */
  [data-theme='dark'] .error-boundary,
  .dark .error-boundary {
    background: var(--bg-card);
    border-color: var(--border-primary);
  }

  [data-theme='dark'] .error-boundary__title,
  .dark .error-boundary__title {
    color: var(--text-primary);
  }

  [data-theme='dark'] .error-boundary__message,
  .dark .error-boundary__message {
    color: var(--text-secondary);
  }
</style>
