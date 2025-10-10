<template>
  <div v-if="showError" class="error-boundary" :class="errorClasses">
    <div class="error-container">
      <div class="error-icon">
        <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div class="error-content">
        <h3 class="error-title">{{ title }}</h3>
        <p class="error-message">{{ message }}</p>

        <div v-if="showDetails && errorDetails" class="error-details">
          <details>
            <summary>错误详情</summary>
            <pre class="error-stack">{{ errorDetails }}</pre>
          </details>
        </div>

        <div class="error-actions">
          <button v-if="retryable" class="btn-retry" @click="handleRetry">重试</button>

          <button v-if="showHome" class="btn-home" @click="goHome">返回首页</button>

          <button v-if="dismissible" class="btn-dismiss" @click="dismiss">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
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
    showDetails: false,
    size: 'medium',
    centered: true,
  });

  const emit = defineEmits<{
    retry: [];
    dismiss: [];
  }>();

  const router = useRouter();

  const showError = computed(() => props.error !== null && props.error !== undefined);

  const errorClasses = computed(() => [
    `error-${props.type}`,
    `error-${props.size}`,
    {
      'error-centered': props.centered,
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
    @apply p-4 rounded-lg border;
  }

  .error-error {
    @apply bg-red-50 border-red-200;
  }

  .error-warning {
    @apply bg-yellow-50 border-yellow-200;
  }

  .error-info {
    @apply bg-blue-50 border-blue-200;
  }

  .error-centered {
    @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50;
  }

  .error-small {
    @apply max-w-sm;
  }

  .error-medium {
    @apply max-w-md;
  }

  .error-large {
    @apply max-w-lg;
  }

  .error-container {
    @apply bg-white rounded-lg shadow-lg p-6;
  }

  .error-centered .error-container {
    @apply transform scale-100 transition-transform;
  }

  .error-icon {
    @apply flex justify-center mb-4;
  }

  .error-error .error-icon svg {
    @apply text-red-600;
  }

  .error-warning .error-icon svg {
    @apply text-yellow-600;
  }

  .error-info .error-icon svg {
    @apply text-blue-600;
  }

  .error-content {
    @apply text-center;
  }

  .error-title {
    @apply text-lg font-semibold mb-2;
  }

  .error-error .error-title {
    @apply text-red-900;
  }

  .error-warning .error-title {
    @apply text-yellow-900;
  }

  .error-info .error-title {
    @apply text-blue-900;
  }

  .error-message {
    @apply text-sm mb-4;
  }

  .error-error .error-message {
    @apply text-red-700;
  }

  .error-warning .error-message {
    @apply text-yellow-700;
  }

  .error-info .error-message {
    @apply text-blue-700;
  }

  .error-details {
    @apply mb-4 text-left;
  }

  .error-details details {
    @apply bg-gray-50 rounded border border-gray-200 p-2;
  }

  .error-details summary {
    @apply cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900;
  }

  .error-stack {
    @apply mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto;
    max-height: 32;
    overflow-y: auto;
  }

  .error-actions {
    @apply flex justify-center gap-2 flex-wrap;
  }

  .btn-retry,
  .btn-home,
  .btn-dismiss {
    @apply px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200;
  }

  .btn-retry {
    @apply bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  }

  .btn-home {
    @apply bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  }

  .btn-dismiss {
    @apply bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  }

  /* Size variants */
  .error-small .error-container {
    @apply p-4;
  }

  .error-small .error-icon svg {
    @apply w-8 h-8;
  }

  .error-small .error-title {
    @apply text-base;
  }

  .error-small .error-message {
    @apply text-xs;
  }

  .error-large .error-container {
    @apply p-8;
  }

  .error-large .error-icon svg {
    @apply w-20 h-20;
  }

  .error-large .error-title {
    @apply text-xl;
  }

  .error-large .error-message {
    @apply text-base;
  }

  /* Animation */
  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .error-boundary {
    animation: slideIn 0.3s ease-out;
  }
</style>
