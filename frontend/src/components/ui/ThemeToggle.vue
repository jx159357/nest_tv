<template>
  <button
    class="theme-toggle-button"
    :title="isDarkMode ? '切换到浅色模式' : '切换到暗黑模式'"
    @click="toggleTheme"
  >
    <span class="theme-toggle-button__icon">{{ themeIcon }}</span>
  </button>
</template>

<script setup lang="ts">
  import { useThemeStore } from '@/stores/theme';

  const themeStore = useThemeStore();

  // 暴露方法
  const toggleTheme = () => {
    themeStore.toggleDarkMode();
  };

  // 计算属性
  const isDarkMode = computed(() => themeStore.isDarkMode);
  const themeIcon = computed(() => themeStore.themeIcon);
</script>

<style scoped>
  .theme-toggle-button {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: 50%;
    background: var(--background-secondary);
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
    overflow: hidden;
  }

  .theme-toggle-button:hover {
    background: var(--background-primary);
    border-color: var(--primary-color);
    transform: scale(1.05);
  }

  .theme-toggle-button__icon {
    font-size: 1.25rem;
    transition: transform var(--transition-fast);
    user-select: none;
  }

  /* 旋转动画效果 */
  .theme-toggle-button:hover .theme-toggle-button__icon {
    transform: rotate(180deg);
  }

  /* 响应式设计 */
  @media (max-width: 640px) {
    .theme-toggle-button {
      width: 2rem;
      height: 2rem;
    }

    .theme-toggle-button__icon {
      font-size: 1rem;
    }
  }

  /* 动画效果 */
  .theme-toggle-button:active {
    transform: scale(0.95);
  }
</style>
