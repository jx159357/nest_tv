<template>
  <Transition name="progress-fade">
    <div v-if="visible" class="global-progress">
      <div class="global-progress__bar" :style="{ width: `${progress}%` }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const visible = ref(false);
  const progress = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const startProgress = () => {
    visible.value = true;
    progress.value = 0;
    timer = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 15;
      }
    }, 100);
  };

  const finishProgress = () => {
    progress.value = 100;
    setTimeout(() => {
      visible.value = false;
      progress.value = 0;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 300);
  };

  watch(
    () => router.currentRoute.value.path,
    () => {
      if (visible.value) {
        finishProgress();
      }
    },
  );

  defineExpose({ startProgress, finishProgress });
</script>

<style scoped>
  .global-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    pointer-events: none;
  }

  .global-progress__bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-accent));
    border-radius: 0 2px 2px 0;
    transition: width 0.2s ease;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  }

  .progress-fade-enter-active,
  .progress-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .progress-fade-enter-from,
  .progress-fade-leave-to {
    opacity: 0;
  }
</style>
