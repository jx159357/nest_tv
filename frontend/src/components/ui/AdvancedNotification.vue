<template>
  <Teleport to="body">
    <Transition
      name="notification"
      tag="div"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div v-show="isVisible" class="notification-container" :class="[position, type, size]">
        <div class="notification-content" @click="handleClick">
          <!-- 图标区域 -->
          <div v-if="icon" class="notification-icon" :class="`icon-${type}`">
            <span v-if="typeof icon === 'string'">{{ icon }}</span>
            <component :is="icon" v-else v-else />
          </div>

          <!-- 主要内容 -->
          <div class="notification-body">
            <h4 v-if="title" class="notification-title">{{ title }}</h4>
            <p v-if="message" class="notification-message" v-html="message"></p>
            <div v-if="$slots.default" class="notification-custom">
              <slot />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="action || closable" class="notification-actions">
            <button
              v-if="action"
              class="notification-action"
              :class="`action-${type}`"
              @click.stop="handleAction"
            >
              {{ action.text }}
            </button>
            <button
              v-if="closable"
              class="notification-close"
              :aria-label="t('close')"
              @click.stop="close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="showProgress" class="notification-progress">
          <div
            class="notification-progress-bar"
            :style="{ width: `${progress}%`, backgroundColor: progressColor }"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';

  interface Props {
    id?: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
    title?: string;
    message?: string;
    icon?: string | Component;
    duration?: number;
    position?:
      | 'top-right'
      | 'top-left'
      | 'bottom-right'
      | 'bottom-left'
      | 'top-center'
      | 'bottom-center';
    size?: 'small' | 'medium' | 'large';
    closable?: boolean;
    action?: {
      text: string;
      onClick: () => void | Promise<void>;
    };
    showProgress?: boolean;
    progress?: number;
    progressColor?: string;
    persistent?: boolean;
    group?: string;
  }

  const { t } = useI18n();

  const props = withDefaults(defineProps<Props>(), {
    type: 'info',
    position: 'top-right',
    size: 'medium',
    duration: 5000,
    closable: true,
    showProgress: false,
    progress: 0,
    progressColor: '#3b82f6',
    persistent: false,
  });

  const emit = defineEmits<{
    click: [event: MouseEvent];
    action: [];
    close: [];
    beforeLeave: [];
    afterLeave: [];
  }>();

  const isVisible = ref(true);
  const timer = ref<number>();

  // 计算属性
  const notificationClasses = computed(() => [
    `notification-${props.type}`,
    `notification-${props.size}`,
    `notification-${props.position.includes('top') ? 'top' : 'bottom'}`,
    {
      'notification-persistent': props.persistent,
      'notification-has-action': !!props.action,
      'notification-has-progress': props.showProgress,
    },
  ]);

  // 图标映射
  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
  };

  const displayIcon = computed(() => {
    if (props.icon) return props.icon;
    return iconMap[props.type] || iconMap.info;
  });

  // 自动关闭
  const startAutoClose = () => {
    if (props.duration > 0 && !props.persistent) {
      timer.value = setTimeout(() => {
        close();
      }, props.duration);
    }
  };

  // 清除定时器
  const clearTimer = () => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = undefined;
    }
  };

  // 关闭通知
  const close = () => {
    clearTimer();
    isVisible.value = false;
    emit('close');
  };

  // 处理点击
  const handleClick = (event: MouseEvent) => {
    emit('click', event);
  };

  // 处理操作按钮
  const handleAction = async () => {
    if (props.action?.onClick) {
      try {
        await props.action.onClick();
        emit('action');
      } catch (error) {
        console.error('Notification action error:', error);
      }
    }
  };

  // 生命周期
  onMounted(() => {
    startAutoClose();
  });

  onUnmounted(() => {
    clearTimer();
  });

  // 监听props变化
  watch(
    () => props.duration,
    () => {
      clearTimer();
      startAutoClose();
    },
  );

  watch(
    () => props.persistent,
    () => {
      if (!props.persistent) {
        startAutoClose();
      } else {
        clearTimer();
      }
    },
  );

  // 过渡事件
  const onBeforeLeave = () => {
    emit('beforeLeave');
  };

  const onAfterLeave = () => {
    emit('afterLeave');
  };

  // 暴露方法
  defineExpose({
    close,
    startAutoClose,
    clearTimer,
  });
</script>

<style scoped>
  .notification-container {
    position: fixed;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    will-change: transform, opacity;
  }

  /* 位置样式 */
  .notification-top-right {
    top: 20px;
    right: 20px;
  }

  .notification-top-left {
    top: 20px;
    left: 20px;
  }

  .notification-top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .notification-bottom-right {
    bottom: 20px;
    right: 20px;
  }

  .notification-bottom-left {
    bottom: 20px;
    left: 20px;
  }

  .notification-bottom-center {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  /* 尺寸样式 */
  .notification-small {
    min-width: 250px;
    padding: 12px;
  }

  .notification-medium {
    min-width: 300px;
    padding: 16px;
  }

  .notification-large {
    min-width: 400px;
    padding: 20px;
  }

  /* 内容区域 */
  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    width: 100%;
  }

  .notification-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 18px;
  }

  .notification-body {
    flex: 1;
    min-width: 0;
  }

  .notification-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: #1f2937;
  }

  .notification-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: #4b5563;
    word-wrap: break-word;
  }

  .notification-custom {
    margin-top: 8px;
  }

  /* 操作区域 */
  .notification-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 12px;
    flex-shrink: 0;
  }

  .notification-action {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .notification-close {
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    outline: none;
  }

  .notification-close:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
  }

  /* 进度条 */
  .notification-progress {
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
    margin-top: 12px;
    overflow: hidden;
    border-radius: 0 0 0 8px 8px;
  }

  .notification-progress-bar {
    height: 100%;
    transition: width 0.3s ease;
  }

  /* 类型样式 */
  .notification-success {
    border-left: 4px solid #10b981;
  }

  .notification-success .notification-title {
    color: #065f46;
  }

  .notification-success .notification-icon {
    color: #10b981;
  }

  .notification-success .notification-action {
    background: #10b981;
    color: white;
  }

  .notification-success .notification-action:hover {
    background: #059669;
  }

  .notification-error {
    border-left: 4px solid #ef4444;
  }

  .notification-error .notification-title {
    color: #991b1b;
  }

  .notification-error .notification-icon {
    color: #ef4444;
  }

  .notification-error .notification-action {
    background: #ef4444;
    color: white;
  }

  .notification-error .notification-action:hover {
    background: #dc2626;
  }

  .notification-warning {
    border-left: 4px solid #f59e0b;
  }

  .notification-warning .notification-title {
    color: #92400e;
  }

  .notification-warning .notification-icon {
    color: #f59e0b;
  }

  .notification-warning .notification-action {
    background: #f59e0b;
    color: white;
  }

  .notification-warning .notification-action:hover {
    background: #d97706;
  }

  .notification-info {
    border-left: 4px solid #3b82f6;
  }

  .notification-info .notification-title {
    color: #1e40af;
  }

  .notification-info .notification-icon {
    color: #3b82f6;
  }

  .notification-info .notification-action {
    background: #3b82f6;
    color: white;
  }

  .notification-info .notification-action:hover {
    background: #2563eb;
  }

  .notification-loading {
    border-left: 4px solid #6b7280;
  }

  .notification-loading .notification-title {
    color: #374151;
  }

  .notification-loading .notification-icon {
    color: #6b7280;
    animation: spin 1s linear infinite;
  }

  /* 过渡动画 */
  .notification-enter-active {
    transition: all 0.3s ease;
  }

  .notification-leave-active {
    transition: all 0.3s ease;
  }

  .notification-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  .notification-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  /* 底部通知的特殊动画 */
  .notification-bottom .notification-enter-from {
    transform: translateY(20px) scale(0.95);
  }

  .notification-bottom .notification-leave-to {
    transform: translateY(20px) scale(0.95);
  }

  /* 中心位置的特殊动画 */
  .notification-top-center .notification-enter-from,
  .notification-top-center .notification-leave-to {
    transform: translateX(-50%) translateY(-20px) scale(0.95);
  }

  .notification-bottom-center .notification-enter-from,
  .notification-bottom-center .notification-leave-to {
    transform: translateX(-50%) translateY(20px) scale(0.95);
  }

  /* 持久化样式 */
  .notification-persistent {
    border-left-width: 6px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  /* 有操作按钮的样式 */
  .notification-has-action .notification-content {
    padding-right: 8px;
  }

  /* 有进度条的样式 */
  .notification-has-progress {
    padding-bottom: 12px;
  }

  .notification-has-progress .notification-content {
    padding-bottom: 8px;
  }

  /* 响应式设计 */
  @media (max-width: 640px) {
    .notification-container {
      min-width: 280px;
      max-width: calc(100vw - 40px);
      margin: 8px;
    }

    .notification-top-right,
    .notification-top-left {
      top: 12px;
      right: 12px;
      left: auto;
    }

    .notification-bottom-right,
    .notification-bottom-left {
      bottom: 12px;
      right: 12px;
      left: auto;
    }

    .notification-top-center,
    .notification-bottom-center {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }

    .notification-medium,
    .notification-large {
      min-width: 280px;
      padding: 14px;
    }

    .notification-body {
      max-width: 200px;
    }

    .notification-actions {
      flex-direction: column;
      margin-left: 8px;
      gap: 4px;
    }
  }

  @media (max-width: 480px) {
    .notification-container {
      min-width: auto;
      max-width: calc(100vw - 32px);
      margin: 0 16px;
    }

    .notification-content {
      flex-direction: column;
      gap: 8px;
    }

    .notification-actions {
      margin-left: 0;
      margin-top: 8px;
      flex-direction: row;
      justify-content: flex-end;
    }
  }

  /* 深色模式 */
  @media (prefers-color-scheme: dark) {
    .notification-container {
      background: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .notification-title {
      color: #f9fafb;
    }

    .notification-message {
      color: #d1d5db;
    }

    .notification-close {
      color: #9ca3af;
    }

    .notification-close:hover {
      color: #f3f4f6;
      background: rgba(255, 255, 255, 0.1);
    }

    .notification-progress {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  /* 动画定义 */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* 无障碍支持 */
  .notification-container[role='alert'] {
    border: 2px solid transparent;
  }

  .notification-container[role='alert']:focus-within {
    border-color: currentColor;
  }

  .notification-container:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* 减少动画偏好 */
  @media (prefers-reduced-motion: reduce) {
    .notification-enter-active,
    .notification-leave-active {
      transition: none;
    }

    .notification-enter-from,
    .notification-leave-to {
      opacity: 0;
      transform: none;
    }

    .notification-loading .notification-icon {
      animation: none;
    }
  }
</style>
