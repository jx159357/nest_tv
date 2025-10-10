<template>
  <div v-if="isVisible" class="preview-mode-indicator">
    试看模式: {{ remainingTime }}分钟后需要登录
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useAuthStore } from '@/stores/auth';

  interface Props {
    previewDuration?: number; // 试看时长（分钟）
    currentTime?: number; // 当前播放时间（秒）
  }

  const props = withDefaults(defineProps<Props>(), {
    previewDuration: 3,
    currentTime: 0,
  });

  const authStore = useAuthStore();
  const isVisible = ref(false);
  const remainingSeconds = ref(0);

  // 计算剩余时间（分钟:秒）
  const remainingTime = computed(() => {
    const totalSeconds = Math.max(0, props.previewDuration * 60 - props.currentTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  // 检查是否需要显示试看指示器
  const checkPreviewMode = () => {
    // 只有未登录用户才显示试看指示器
    if (!authStore.isAuthenticated && props.currentTime > 0) {
      // 检查是否接近试看结束时间（最后30秒开始显示）
      const timeLeft = props.previewDuration * 60 - props.currentTime;
      isVisible.value = timeLeft <= 30 && timeLeft > 0;
    } else {
      isVisible.value = false;
    }
  };

  // 监听时间变化
  const updateTime = () => {
    checkPreviewMode();
  };

  onMounted(() => {
    updateTime();
  });

  onUnmounted(() => {
    isVisible.value = false;
  });

  // 监听属性变化
  watch(() => [props.currentTime, authStore.isAuthenticated], updateTime);
</script>

<style scoped>
  .preview-mode-indicator {
    position: fixed;
    top: 60px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(255, 193, 7, 0.9);
    color: #212529;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 999;
    animation: slideInRight 0.3s ease;
  }

  .preview-mode-indicator::before {
    content: '⏱️';
    margin-right: 8px;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .slide-in-right {
    animation: slideInRight 0.3s ease forwards;
  }
</style>
