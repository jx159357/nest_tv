<template>
  <Teleport to="body">
    <!-- 全局加载蒙层 -->
    <Transition name="loading-overlay" appear>
      <div
        v-if="isLoading"
        class="loading-overlay"
        :class="{
          'loading-overlay--global': isGlobalLoading,
          'loading-overlay--partial': isPartialLoading,
          'loading-overlay--route': isRouteLoading,
        }"
      >
        <!-- 全局加载容器 -->
        <div class="loading-container">
          <!-- 主加载动画 -->
          <div class="loading-spinner">
            <div class="loading-spinner__circle loading-spinner__circle--1"></div>
            <div class="loading-spinner__circle loading-spinner__circle--2"></div>
            <div class="loading-spinner__circle loading-spinner__circle--3"></div>
          </div>

          <!-- 加载文本 -->
          <div v-if="loadingText" class="loading-text">
            {{ loadingText }}
          </div>

          <!-- 加载进度条 -->
          <div v-if="showProgress" class="loading-progress">
            <div class="loading-progress__bar">
              <div class="loading-progress__fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <div class="loading-progress__text">{{ Math.round(loadingProgress) }}%</div>
          </div>

          <!-- 加载动作列表 -->
          <div v-if="loadingActions.length > 0" class="loading-actions">
            <div v-for="(action, index) in loadingActions" :key="index" class="loading-action">
              <div class="loading-action__icon">⚡️</div>
              <span class="loading-action__text">{{ action }}</span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="error" class="loading-error">
            <div class="loading-error__icon">❌</div>
            <div class="loading-error__message">{{ error }}</div>
            <button class="loading-error__retry" @click="retry">重试</button>
          </div>
        </div>

        <!-- 背景遮罩 -->
        <div class="loading-backdrop"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useLoadingStore } from '@/stores/loading';

  const loadingStore = useLoadingStore();
  const {
    isLoading,
    loadingText,
    loadingType,
    loadingProgress,
    loadingActions,
    error,
    isGlobalLoading,
    isPartialLoading,
    isRouteLoading,
  } = storeToRefs(loadingStore);

  const showProgress = computed(() => loadingProgress.value > 0 && loadingProgress.value < 100);

  const retry = () => {
    loadingStore.clearError();
    // 这里可以触发重新加载的逻辑
    window.location.reload();
  };
</script>

<style scoped>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    pointer-events: none;
  }

  .loading-overlay--global {
    background: rgba(0, 0, 0, 0.8);
  }

  .loading-overlay--partial {
    background: rgba(0, 0, 0, 0.5);
  }

  .loading-overlay--route {
    background: rgba(0, 0, 0, 0.3);
  }

  .loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    min-width: 300px;
    pointer-events: all;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    margin: 0 auto 1rem;
    position: relative;
  }

  .loading-spinner__circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #f5576c);
    opacity: 0.8;
    animation: spinner-rotate 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  }

  .loading-spinner__circle--1 {
    animation-delay: 0s;
  }

  .loading-spinner__circle--2 {
    animation-delay: 0.5s;
  }

  .loading-spinner__circle--3 {
    animation-delay: 1s;
  }

  @keyframes spinner-rotate {
    0% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.1);
    }
    100% {
      transform: rotate(360deg) scale(1);
    }
  }

  .loading-text {
    font-size: 1rem;
    color: #1f2937;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .loading-progress {
    width: 200px;
    margin: 1rem auto 0;
  }

  .loading-progress__bar {
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }

  .loading-progress__fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .loading-progress__text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
    font-weight: 600;
  }

  .loading-actions {
    margin-top: 1rem;
    text-align: left;
  }

  .loading-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .loading-action__icon {
    font-size: 1rem;
  }

  .loading-action__text {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
  }

  .loading-error {
    margin-top: 1rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    text-align: left;
  }

  .loading-error__icon {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .loading-error__message {
    color: #dc2626;
    font-weight: 600;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .loading-error__retry {
    background: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .loading-error__retry:hover {
    background: #b91c1c;
  }

  .loading-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  /* 过渡动画 */
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
    transform: scale(1.1);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .loading-container {
      min-width: 280px;
      padding: 1.5rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
    }

    .loading-text {
      font-size: 0.875rem;
    }

    .loading-progress {
      width: 160px;
    }
  }

  @media (max-width: 480px) {
    .loading-container {
      min-width: 260px;
      padding: 1rem;
      margin: 1rem;
    }

    .loading-spinner {
      width: 35px;
      height: 35px;
    }

    .loading-text {
      font-size: 0.8rem;
    }

    .loading-progress {
      width: 140px;
    }

    .loading-actions {
      font-size: 0.75rem;
    }
  }
</style>
