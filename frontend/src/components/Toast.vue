<template>
  <Teleport to="body">
    <div class="toast-container" :class="containerClasses">
      <TransitionGroup name="toast" tag="div" class="toast-container__list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="getToastClasses(toast)"
          role="alert"
          aria-live="polite"
          @mouseenter="pauseTimer(toast.id)"
          @mouseleave="resumeTimer(toast.id)"
        >
          <!-- 图标 -->
          <div class="toast__icon">
            <svg
              v-if="toast.type === 'success'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else-if="toast.type === 'error'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else-if="toast.type === 'warning'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <!-- 内容 -->
          <div class="toast__content">
            <p v-if="toast.title" class="toast__title">{{ toast.title }}</p>
            <p class="toast__message">{{ toast.message }}</p>
          </div>

          <!-- 关闭按钮 -->
          <button
            v-if="toast.closable !== false"
            class="toast__close"
            :aria-label="'关闭通知'"
            @click="removeToast(toast.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- 进度条 -->
          <div
            v-if="toast.showProgress !== false && toast.duration && toast.duration > 0"
            class="toast__progress"
            :class="`toast__progress--${toast.type}`"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, ref, onUnmounted } from 'vue';

  interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    closable?: boolean;
    showProgress?: boolean;
    position?:
      | 'top-right'
      | 'top-left'
      | 'bottom-right'
      | 'bottom-left'
      | 'top-center'
      | 'bottom-center';
  }

  const props = withDefaults(defineProps<Props>(), {
    position: 'top-right',
    maxToasts: 5,
  });

  interface Props {
    position?: Toast['position'];
    maxToasts?: number;
  }

  const toasts = ref<Toast[]>([]);
  const timers = ref<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pausedAt = ref<Map<string, number>>(new Map());

  const containerClasses = computed(() => [`toast-container--${props.position}`]);

  const getToastClasses = (toast: Toast) => [
    `toast--${toast.type}`,
    {
      'toast--closable': toast.closable !== false,
    },
  ];

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      closable: true,
      showProgress: true,
      ...toast,
    };

    // 限制最大数量
    if (toasts.value.length >= props.maxToasts) {
      const oldestToast = toasts.value[0];
      removeToast(oldestToast.id);
    }

    toasts.value.push(newToast);

    // 自动关闭
    if (newToast.duration && newToast.duration > 0) {
      startTimer(id, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
      clearTimer(id);
    }
  };

  const startTimer = (id: string, duration: number) => {
    clearTimer(id);
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    timers.value.set(id, timer);
    pausedAt.value.delete(id);
  };

  const clearTimer = (id: string) => {
    const timer = timers.value.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.value.delete(id);
    }
  };

  const pauseTimer = (id: string) => {
    const timer = timers.value.get(id);
    if (timer) {
      clearTimer(id);
      pausedAt.value.set(id, Date.now());
    }
  };

  const resumeTimer = (id: string) => {
    const toast = toasts.value.find(t => t.id === id);
    const pauseTime = pausedAt.value.get(id);
    if (toast && pauseTime && toast.duration) {
      const elapsed = pauseTime - (toast.duration - (timers.value.has(id) ? 0 : toast.duration));
      const remaining = Math.max(0, toast.duration - elapsed);
      if (remaining > 0) {
        startTimer(id, remaining);
      } else {
        removeToast(id);
      }
    }
  };

  // 清理所有定时器
  onUnmounted(() => {
    timers.value.forEach(timer => clearTimeout(timer));
    timers.value.clear();
  });

  // 暴露方法
  defineExpose({
    addToast,
    removeToast,
    success: (message: string, title?: string) => addToast({ type: 'success', message, title }),
    error: (message: string, title?: string) => addToast({ type: 'error', message, title }),
    warning: (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    info: (message: string, title?: string) => addToast({ type: 'info', message, title }),
  });
</script>

<style scoped>
  .toast-container {
    position: fixed;
    z-index: var(--z-toast);
    pointer-events: none;
    padding: var(--spacing-4);
  }

  .toast-container--top-right {
    top: 0;
    right: 0;
  }

  .toast-container--top-left {
    top: 0;
    left: 0;
  }

  .toast-container--bottom-right {
    bottom: 0;
    right: 0;
  }

  .toast-container--bottom-left {
    bottom: 0;
    left: 0;
  }

  .toast-container--top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .toast-container--bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .toast-container__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    max-width: 24rem;
    width: 100%;
  }

  .toast-container--top-left .toast-container__list,
  .toast-container--bottom-left .toast-container__list {
    align-items: flex-start;
  }

  .toast-container--top-right .toast-container__list,
  .toast-container--bottom-right .toast-container__list {
    align-items: flex-end;
  }

  .toast-container--top-center .toast-container__list,
  .toast-container--bottom-center .toast-container__list {
    align-items: center;
  }

  .toast {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-primary);
    pointer-events: auto;
    overflow: hidden;
    max-width: 100%;
    transform-origin: top right;
  }

  .toast--success {
    border-left: 4px solid var(--color-success);
  }

  .toast--error {
    border-left: 4px solid var(--color-error);
  }

  .toast--warning {
    border-left: 4px solid var(--color-warning);
  }

  .toast--info {
    border-left: 4px solid var(--color-info);
  }

  .toast__icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }

  .toast__icon svg {
    width: 100%;
    height: 100%;
  }

  .toast--success .toast__icon {
    color: var(--color-success);
  }

  .toast--error .toast__icon {
    color: var(--color-error);
  }

  .toast--warning .toast__icon {
    color: var(--color-warning);
  }

  .toast--info .toast__icon {
    color: var(--color-info);
  }

  .toast__content {
    flex: 1;
    min-width: 0;
  }

  .toast__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-1);
  }

  .toast__message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .toast__close {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    padding: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .toast__close:hover {
    color: var(--text-secondary);
  }

  .toast__close svg {
    width: 100%;
    height: 100%;
  }

  .toast__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--color-brand-primary);
    animation: toast-progress linear forwards;
  }

  .toast__progress--success {
    background: var(--color-success);
  }

  .toast__progress--error {
    background: var(--color-error);
  }

  .toast__progress--warning {
    background: var(--color-warning);
  }

  .toast__progress--info {
    background: var(--color-info);
  }

  /* 动画 */
  .toast-enter-active {
    transition: all 0.3s ease-out;
  }

  .toast-leave-active {
    transition: all 0.2s ease-in;
  }

  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }

  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }

  .toast-move {
    transition: transform 0.3s ease;
  }

  @keyframes toast-progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  /* 暗色模式 */
  [data-theme='dark'] .toast,
  .dark .toast {
    background: var(--bg-card);
    border-color: var(--border-primary);
  }

  [data-theme='dark'] .toast__title,
  .dark .toast__title {
    color: var(--text-primary);
  }

  [data-theme='dark'] .toast__message,
  .dark .toast__message {
    color: var(--text-secondary);
  }
</style>
