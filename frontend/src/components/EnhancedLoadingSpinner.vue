<template>
  <Teleport to="body">
    <Transition name="loading-overlay" appear>
      <div
        v-if="isLoading"
        class="loading-overlay"
        :class="overlayClasses"
        @click="handleOverlayClick"
      >
        <div class="loading-container" :class="containerClasses" @click.stop>
          <!-- 主要加载内容 -->
          <div class="loading-content">
            <!-- 自定义图标或动画 -->
            <div v-if="customIcon" class="loading-custom-icon">
              <component :is="customIcon" />
            </div>

            <!-- 内置加载动画 -->
            <div v-else class="loading-spinner" :class="spinnerClasses">
              <div class="spinner-circle"></div>
              <!-- 可选的粒子效果 -->
              <div v-if="showParticles" class="spinner-particles">
                <div v-for="i in 6" :key="i" class="particle" :style="particleStyle(i)"></div>
              </div>
            </div>

            <!-- 加载文本 -->
            <div v-if="text || $slots.text" class="loading-text-section">
              <slot name="text">
                <p v-if="text" class="loading-text" :class="textClasses">
                  {{ text }}
                </p>
              </slot>

              <!-- 进度信息 -->
              <div v-if="progress !== undefined" class="loading-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${progress}%` }"
                    :class="progressClasses"
                  ></div>
                </div>
                <span v-if="showProgressText" class="progress-text"> {{ progress }}% </span>
              </div>

              <!-- 子文本信息 -->
              <p v-if="subText" class="loading-subtext" :class="subtextClasses">
                {{ subText }}
              </p>
            </div>

            <!-- 操作按钮 -->
            <div v-if="cancelable || $slots.actions" class="loading-actions">
              <slot name="actions">
                <button
                  v-if="cancelable"
                  class="cancel-button"
                  :class="cancelButtonClasses"
                  :disabled="canceling"
                  @click="handleCancel"
                >
                  <span v-if="canceling">{{ cancellingText || '取消中...' }}</span>
                  <span v-else>{{ cancelText || '取消' }}</span>
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted } from 'vue';

  interface Props {
    isLoading: boolean;
    text?: string;
    subText?: string;
    size?: 'small' | 'medium' | 'large' | 'xl';
    variant?: 'default' | 'overlay' | 'inline' | 'skeleton';
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    customIcon?: any;
    showParticles?: boolean;
    progress?: number;
    showProgressText?: boolean;
    cancelable?: boolean;
    cancelText?: string;
    cancellingText?: string;
    cancellable?: boolean;
    closable?: boolean;
    blurBackground?: boolean;
    centerContent?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    text: '',
    subText: '',
    size: 'medium',
    variant: 'overlay',
    color: 'primary',
    customIcon: undefined,
    showParticles: false,
    showProgressText: true,
    cancelable: false,
    closable: true,
    blurBackground: true,
    centerContent: true,
  });

  const emit = defineEmits<{
    cancel: [];
    close: [];
  }>();

  // 计算属性
  const canceling = ref(false);

  const cancelButtonClasses = computed(() => `cancel-${props.color}`);
  const overlayClasses = computed(() => [
    `loading-${props.variant}`,
    `loading-${props.size}`,
    `loading-${props.color}`,
    {
      'loading-blur': props.blurBackground,
      'loading-centered': props.centerContent,
    },
  ]);

  const containerClasses = computed(() => [
    `container-${props.variant}`,
    `container-${props.size}`,
  ]);

  const spinnerClasses = computed(() => [
    `spinner-${props.size}`,
    `spinner-${props.color}`,
    {
      'spinner-with-particles': props.showParticles,
    },
  ]);

  const textClasses = computed(() => `text-${props.size}`);
  const subtextClasses = computed(() => `subtext-${props.size}`);
  const progressClasses = computed(() => `progress-${props.color}`);
  const cancelButtonClasses = computed(() => `cancel-${props.color}`);

  // 粒子动画样式
  const particleStyle = (index: number) => {
    const delay = index * 0.1;
    return {
      animationDelay: `${delay}s`,
      '--particle-index': index,
    };
  };

  // 事件处理
  const handleOverlayClick = () => {
    if (props.closable) {
      emit('close');
    }
  };

  const handleCancel = () => {
    if (props.cancellable) {
      emit('cancel');
    }
  };

  // 防止页面滚动
  const preventScroll = () => {
    if (props.variant === 'overlay' && props.isLoading) {
      document.body.style.overflow = 'hidden';
    }
  };

  const restoreScroll = () => {
    document.body.style.overflow = '';
  };

  onMounted(() => {
    preventScroll();
  });

  onUnmounted(() => {
    restoreScroll();
  });
</script>

<style scoped>
  /* Overlay 基础样式 */
  .loading-overlay {
    @apply fixed inset-0 z-50;
  }

  .loading-default {
    @apply relative inline-flex items-center justify-center;
  }

  .loading-overlay {
    @apply flex items-center justify-center bg-black bg-opacity-50;
  }

  .loading-inline {
    @apply relative inline-flex items-center;
  }

  .loading-skeleton {
    @apply relative overflow-hidden bg-gray-200;
  }

  .loading-blur {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .loading-centered {
    @apply items-center justify-center;
  }

  /* Size variants */
  .loading-small {
    @apply p-2;
  }

  .loading-medium {
    @apply p-4;
  }

  .loading-large {
    @apply p-6;
  }

  .loading-xl {
    @apply p-8;
  }

  /* Color variants */
  .loading-primary {
    @apply bg-primary bg-opacity-10;
  }

  .loading-secondary {
    @apply bg-gray-500 bg-opacity-10;
  }

  .loading-success {
    @apply bg-green-500 bg-opacity-10;
  }

  .loading-warning {
    @apply bg-yellow-500 bg-opacity-10;
  }

  .loading-error {
    @apply bg-red-500 bg-opacity-10;
  }

  /* Container 样式 */
  .container-default {
    @apply flex items-center justify-center;
  }

  .container-overlay {
    @apply bg-white rounded-lg shadow-xl;
  }

  .container-inline {
    @apply flex items-center space-x-2;
  }

  .container-skeleton {
    @apply w-full h-full;
  }

  /* Loading Content */
  .loading-content {
    @apply flex flex-col items-center space-y-3;
  }

  /* Spinner 样式 */
  .loading-spinner {
    @apply relative;
  }

  .spinner-circle {
    @apply border-4 border-gray-200 border-t-current rounded-full animate-spin;
  }

  /* Spinner Size variants */
  .spinner-small .spinner-circle {
    @apply w-6 h-6 border-2;
  }

  .spinner-medium .spinner-circle {
    @apply w-8 h-8 border-4;
  }

  .spinner-large .spinner-circle {
    @apply w-12 h-12 border-4;
  }

  .spinner-xl .spinner-circle {
    @apply w-16 h-16 border-6;
  }

  /* Spinner Color variants */
  .spinner-primary .spinner-circle {
    @apply border-t-indigo-600;
  }

  .spinner-secondary .spinner-circle {
    @apply border-t-gray-600;
  }

  .spinner-success .spinner-circle {
    @apply border-t-green-600;
  }

  .spinner-warning .spinner-circle {
    @apply border-t-yellow-600;
  }

  .spinner-error .spinner-circle {
    @apply border-t-red-600;
  }

  /* Particles 效果 */
  .spinner-particles {
    @apply absolute inset-0;
  }

  .particle {
    @apply absolute w-1 h-1 bg-current rounded-full opacity-30;
    animation: particle-orbit 2s linear infinite;
  }

  @keyframes particle-orbit {
    0% {
      transform: rotate(0deg) translateX(12px) rotate(0deg);
      opacity: 0;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      transform: rotate(360deg) translateX(12px) rotate(-360deg);
      opacity: 0;
    }
  }

  /* Custom Icon */
  .loading-custom-icon {
    @apply text-4xl animate-pulse;
  }

  /* Text 样式 */
  .loading-text-section {
    @apply flex flex-col items-center space-y-2 text-center;
  }

  .loading-text {
    @apply font-medium;
  }

  .text-small {
    @apply text-sm;
  }

  .text-medium {
    @apply text-base;
  }

  .text-large {
    @apply text-lg;
  }

  .text-xl {
    @apply text-xl;
  }

  .loading-subtext {
    @apply text-sm text-gray-600;
  }

  .subtext-small {
    @apply text-xs;
  }

  .subtext-medium {
    @apply text-sm;
  }

  .subtext-large {
    @apply text-base;
  }

  .subtext-xl {
    @apply text-lg;
  }

  /* Progress Bar */
  .loading-progress {
    @apply w-full max-w-xs flex items-center space-x-2;
  }

  .progress-bar {
    @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
  }

  .progress-fill {
    @apply h-full rounded-full transition-all duration-300 ease-out;
  }

  .progress-primary {
    @apply bg-indigo-600;
  }

  .progress-secondary {
    @apply bg-gray-600;
  }

  .progress-success {
    @apply bg-green-600;
  }

  .progress-warning {
    @apply bg-yellow-600;
  }

  .progress-error {
    @apply bg-red-600;
  }

  .progress-text {
    @apply text-xs font-medium text-gray-600 min-w-[3rem] text-right;
  }

  /* Actions */
  .loading-actions {
    @apply mt-4;
  }

  .cancel-button {
    @apply px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .cancel-primary {
    @apply bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500;
  }

  .cancel-secondary {
    @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
  }

  .cancel-success {
    @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
  }

  .cancel-warning {
    @apply bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500;
  }

  .cancel-error {
    @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  /* Skeleton Loading */
  .loading-skeleton::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent;
    animation: skeleton-loading 2s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* Transitions */
  .loading-overlay-enter-active,
  .loading-overlay-leave-active {
    transition: all 0.3s ease;
  }

  .loading-overlay-enter-from {
    opacity: 0;
    transform: scale(0.9);
  }

  .loading-overlay-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }

  /* Animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  /* 响应式设计 */
  @media (max-width: 640px) {
    .loading-overlay {
      @apply p-4;
    }

    .container-overlay {
      @apply max-w-xs;
    }

    .loading-text {
      @apply text-sm;
    }

    .loading-subtext {
      @apply text-xs;
    }
  }

  @media (min-width: 641px) and (max-width: 768px) {
    .container-overlay {
      @apply max-w-sm;
    }
  }

  @media (min-width: 769px) {
    .container-overlay {
      @apply max-w-md;
    }
  }
</style>
