<template>
  <div class="loading-spinner" :class="spinnerClasses">
    <!-- 加载动画 -->
    <div class="loading-spinner__animation">
      <!-- 旋转圆圈 -->
      <div v-if="type === 'spinner'" class="loading-spinner__circle">
        <div class="loading-spinner__circle-inner"></div>
      </div>

      <!-- 脉冲点 -->
      <div v-else-if="type === 'dots'" class="loading-spinner__dots">
        <div class="loading-spinner__dot loading-spinner__dot--1"></div>
        <div class="loading-spinner__dot loading-spinner__dot--2"></div>
        <div class="loading-spinner__dot loading-spinner__dot--3"></div>
      </div>

      <!-- 进度条 -->
      <div v-else-if="type === 'bar'" class="loading-spinner__bar">
        <div class="loading-spinner__bar-progress"></div>
      </div>

      <!-- 骨架屏 -->
      <div v-else-if="type === 'skeleton'" class="loading-spinner__skeleton">
        <div class="loading-spinner__skeleton-line loading-spinner__skeleton-line--1"></div>
        <div class="loading-spinner__skeleton-line loading-spinner__skeleton-line--2"></div>
        <div class="loading-spinner__skeleton-line loading-spinner__skeleton-line--3"></div>
      </div>
    </div>

    <!-- 加载文本 -->
    <p v-if="text" class="loading-spinner__text">{{ text }}</p>

    <!-- 进度百分比 -->
    <p v-if="showProgress && progress !== undefined" class="loading-spinner__progress">
      {{ Math.round(progress) }}%
    </p>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    type?: 'spinner' | 'dots' | 'bar' | 'skeleton';
    size?: 'small' | 'medium' | 'large';
    text?: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
    centered?: boolean;
    overlay?: boolean;
    showProgress?: boolean;
    progress?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'spinner',
    size: 'medium',
    color: 'primary',
    centered: true,
    overlay: false,
    showProgress: false,
  });

  const spinnerClasses = computed(() => [
    `loading-spinner--${props.type}`,
    `loading-spinner--${props.size}`,
    `loading-spinner--${props.color}`,
    {
      'loading-spinner--centered': props.centered,
      'loading-spinner--overlay': props.overlay,
    },
  ]);
</script>

<style scoped>
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-3);
  }

  .loading-spinner--centered {
    padding: var(--spacing-8) 0;
  }

  .loading-spinner--overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: var(--z-modal);
    padding: 0;
  }

  /* 旋转圆圈 */
  .loading-spinner__circle {
    position: relative;
    animation: loading-spinner-rotate 1.5s linear infinite;
  }

  .loading-spinner__circle-inner {
    border-radius: 50%;
    border-style: solid;
    border-color: var(--bg-tertiary);
    border-top-color: var(--color-brand-primary);
    animation: loading-spinner-dash 1.5s ease-in-out infinite;
  }

  .loading-spinner--spinner.loading-spinner--small .loading-spinner__circle-inner {
    width: 1.5rem;
    height: 1.5rem;
    border-width: 2px;
  }

  .loading-spinner--spinner.loading-spinner--medium .loading-spinner__circle-inner {
    width: 2rem;
    height: 2rem;
    border-width: 3px;
  }

  .loading-spinner--spinner.loading-spinner--large .loading-spinner__circle-inner {
    width: 3rem;
    height: 3rem;
    border-width: 4px;
  }

  /* 脉冲点 */
  .loading-spinner__dots {
    display: flex;
    gap: var(--spacing-2);
  }

  .loading-spinner__dot {
    border-radius: 50%;
    background: var(--color-brand-primary);
    animation: loading-spinner-pulse 1.4s ease-in-out infinite both;
  }

  .loading-spinner__dot--1 {
    animation-delay: -0.32s;
  }

  .loading-spinner__dot--2 {
    animation-delay: -0.16s;
  }

  .loading-spinner--dots.loading-spinner--small .loading-spinner__dot {
    width: 0.5rem;
    height: 0.5rem;
  }

  .loading-spinner--dots.loading-spinner--medium .loading-spinner__dot {
    width: 0.75rem;
    height: 0.75rem;
  }

  .loading-spinner--dots.loading-spinner--large .loading-spinner__dot {
    width: 1rem;
    height: 1rem;
  }

  /* 进度条 */
  .loading-spinner__bar {
    width: 100%;
    max-width: 12rem;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .loading-spinner__bar-progress {
    height: 100%;
    background: var(--color-brand-primary);
    border-radius: var(--radius-full);
    animation: loading-spinner-progress 2s ease-in-out infinite;
  }

  .loading-spinner--bar.loading-spinner--small .loading-spinner__bar {
    max-width: 8rem;
    height: 2px;
  }

  .loading-spinner--bar.loading-spinner--large .loading-spinner__bar {
    max-width: 16rem;
    height: 6px;
  }

  /* 骨架屏 */
  .loading-spinner__skeleton {
    width: 100%;
    max-width: 12rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .loading-spinner__skeleton-line {
    height: 0.75rem;
    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
    background-size: 200% 100%;
    border-radius: var(--radius-sm);
    animation: loading-spinner-skeleton 1.5s ease-in-out infinite;
  }

  .loading-spinner__skeleton-line--1 {
    width: 100%;
  }

  .loading-spinner__skeleton-line--2 {
    width: 80%;
  }

  .loading-spinner__skeleton-line--3 {
    width: 60%;
  }

  .loading-spinner__skeleton-line--2 {
    animation-delay: 0.2s;
  }

  .loading-spinner__skeleton-line--3 {
    animation-delay: 0.4s;
  }

  .loading-spinner--skeleton.loading-spinner--small .loading-spinner__skeleton {
    max-width: 8rem;
  }

  .loading-spinner--skeleton.loading-spinner--small .loading-spinner__skeleton-line {
    height: 0.5rem;
  }

  .loading-spinner--skeleton.loading-spinner--large .loading-spinner__skeleton {
    max-width: 16rem;
  }

  .loading-spinner--skeleton.loading-spinner--large .loading-spinner__skeleton-line {
    height: 1rem;
  }

  /* 文本 */
  .loading-spinner__text {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    text-align: center;
  }

  .loading-spinner--small .loading-spinner__text {
    font-size: var(--font-size-xs);
  }

  .loading-spinner--large .loading-spinner__text {
    font-size: var(--font-size-base);
  }

  /* 进度百分比 */
  .loading-spinner__progress {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    font-weight: var(--font-weight-medium);
  }

  /* 颜色变体 */
  .loading-spinner--primary .loading-spinner__circle-inner {
    border-top-color: var(--color-brand-primary);
  }

  .loading-spinner--primary .loading-spinner__dot {
    background: var(--color-brand-primary);
  }

  .loading-spinner--primary .loading-spinner__bar-progress {
    background: var(--color-brand-primary);
  }

  .loading-spinner--secondary .loading-spinner__circle-inner {
    border-top-color: var(--color-brand-secondary);
  }

  .loading-spinner--secondary .loading-spinner__dot {
    background: var(--color-brand-secondary);
  }

  .loading-spinner--secondary .loading-spinner__bar-progress {
    background: var(--color-brand-secondary);
  }

  .loading-spinner--success .loading-spinner__circle-inner {
    border-top-color: var(--color-success);
  }

  .loading-spinner--success .loading-spinner__dot {
    background: var(--color-success);
  }

  .loading-spinner--success .loading-spinner__bar-progress {
    background: var(--color-success);
  }

  .loading-spinner--error .loading-spinner__circle-inner {
    border-top-color: var(--color-error);
  }

  .loading-spinner--error .loading-spinner__dot {
    background: var(--color-error);
  }

  .loading-spinner--error .loading-spinner__bar-progress {
    background: var(--color-error);
  }

  .loading-spinner--warning .loading-spinner__circle-inner {
    border-top-color: var(--color-warning);
  }

  .loading-spinner--warning .loading-spinner__dot {
    background: var(--color-warning);
  }

  .loading-spinner--warning .loading-spinner__bar-progress {
    background: var(--color-warning);
  }

  /* 动画 */
  @keyframes loading-spinner-rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes loading-spinner-dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  @keyframes loading-spinner-pulse {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes loading-spinner-progress {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes loading-spinner-skeleton {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* 暗色模式 */
  [data-theme="dark"] .loading-spinner__circle-inner,
  .dark .loading-spinner__circle-inner {
    border-color: var(--bg-tertiary);
  }

  [data-theme="dark"] .loading-spinner__text,
  .dark .loading-spinner__text {
    color: var(--text-secondary);
  }

  [data-theme="dark"] .loading-spinner__progress,
  .dark .loading-spinner__progress {
    color: var(--text-muted);
  }
</style>
