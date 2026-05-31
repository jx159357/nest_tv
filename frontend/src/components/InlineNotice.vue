<template>
  <div class="inline-notice" :class="noticeClass" role="status">
    <div class="inline-notice__inner">
      <div class="inline-notice__content">
        <div v-if="title" class="inline-notice__title">{{ title }}</div>
        <div>{{ message }}</div>
      </div>
      <button
        v-if="dismissible"
        type="button"
        class="inline-notice__close"
        aria-label="关闭提示"
        @click="$emit('dismiss')"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    dismissible?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'info',
    title: '',
    dismissible: false,
  });

  defineEmits<{
    dismiss: [];
  }>();

  const noticeClass = computed(() => {
    switch (props.type) {
      case 'success':
        return 'inline-notice--success';
      case 'error':
        return 'inline-notice--error';
      case 'warning':
        return 'inline-notice--warning';
      default:
        return 'inline-notice--info';
    }
  });
</script>

<style scoped>
  .inline-notice {
    border: 1px solid var(--state-info-border);
    border-radius: var(--panel-radius);
    background: var(--state-info-bg);
    color: var(--color-info-light);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-sm);
  }

  .inline-notice__inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
  }

  .inline-notice__content {
    min-width: 0;
    flex: 1;
  }

  .inline-notice__title {
    margin-bottom: var(--spacing-1);
    color: currentColor;
    font-weight: var(--font-weight-semibold);
  }

  .inline-notice__close {
    color: currentColor;
    font-size: var(--font-size-lg);
    line-height: 1;
    opacity: 0.7;
    transition: opacity var(--transition-fast);
  }

  .inline-notice__close:hover {
    opacity: 1;
  }

  .inline-notice--success {
    border-color: var(--state-success-border);
    background: var(--state-success-bg);
    color: var(--color-success-light);
  }

  .inline-notice--error {
    border-color: var(--state-error-border);
    background: var(--state-error-bg);
    color: var(--color-error-light);
  }

  .inline-notice--warning {
    border-color: var(--state-warning-border);
    background: var(--state-warning-bg);
    color: var(--color-warning-light);
  }
</style>
