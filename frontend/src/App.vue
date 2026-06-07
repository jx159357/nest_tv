<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import EnhancedModal from '@/components/EnhancedModal.vue';
  import UpdateNotification from '@/components/UpdateNotification.vue';
  import Toast from '@/components/Toast.vue';
  import NotificationToast from '@/components/NotificationToast.vue';
  import GlobalProgressBar from '@/components/GlobalProgressBar.vue';
  import { log } from '@/utils/logger';
  import { modalState } from '@/composables/useModal';

  const authStore = useAuthStore();
  const toastRef = ref<InstanceType<typeof Toast> | null>(null);
  const progressRef = ref<InstanceType<typeof GlobalProgressBar> | null>(null);

  const initializeApp = async () => {
    try {
      await authStore.initAuth();
    } catch (error) {
      log.error('App', '应用初始化失败:', error);
      toastRef.value?.error('应用初始化失败，请刷新页面重试');
    }
  };

  onMounted(() => {
    initializeApp();
  });
</script>

<template>
  <div id="app-root">
    <GlobalProgressBar ref="progressRef" />
    <RouterView v-slot="{ Component, route }">
      <Transition name="page-slide" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>

    <EnhancedModal
      v-if="modalState.isVisible"
      :type="modalState.type"
      :title="modalState.title"
      :message="modalState.message"
      :confirm-text="modalState.confirmText"
      :cancel-text="modalState.cancelText"
      :show-action="modalState.showAction"
      @confirm="modalState.onConfirm"
      @cancel="modalState.onCancel"
      @close="modalState.isVisible = false"
    />

    <UpdateNotification />
    <Toast ref="toastRef" position="top-right" />
    <NotificationToast />
  </div>
</template>

<style>
  #app-root {
    min-height: 100vh;
    background: var(--bg-page-gradient);
    color: var(--text-primary);
  }

  .page-slide-enter-active,
  .page-slide-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .page-slide-enter-from {
    opacity: 0;
    transform: translateY(12px);
  }

  .page-slide-leave-to {
    opacity: 0;
    transform: translateY(-12px);
  }
</style>
