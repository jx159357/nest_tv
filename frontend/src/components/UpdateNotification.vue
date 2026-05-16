<template>
  <Transition name="update-slide">
    <div v-if="visible" class="update-banner">
      <div class="update-content">
        <div class="update-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </div>
        <div class="update-text">
          <span class="update-title">发现新版本</span>
          <span class="update-desc">页面即将自动刷新以获取最新内容</span>
        </div>
        <div class="update-actions">
          <button class="update-btn update-btn--now" @click="reloadNow">立即更新</button>
          <button class="update-btn update-btn--later" @click="dismiss">稍后</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { checkForUpdates, initVersion, shouldCheckVersion } from '@/utils/version';

  const visible = ref(false);
  const newVersion = ref('');
  let timer: ReturnType<typeof setInterval> | null = null;
  let autoReloadTimer: ReturnType<typeof setTimeout> | null = null;

  const reloadNow = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    setTimeout(() => window.location.reload(), 100);
  };

  const dismiss = () => {
    visible.value = false;
    if (autoReloadTimer) {
      clearTimeout(autoReloadTimer);
      autoReloadTimer = null;
    }
  };

  const check = async () => {
    if (!shouldCheckVersion()) return;
    const result = await checkForUpdates();
    if (result?.hasUpdate) {
      newVersion.value = result.version;
      visible.value = true;
      autoReloadTimer = setTimeout(reloadNow, 30000);
    }
  };

  onMounted(() => {
    initVersion();
    timer = setInterval(check, 30 * 60 * 1000);
    setTimeout(check, 5000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (visible.value) window.location.reload();
      });
    }
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    if (autoReloadTimer) clearTimeout(autoReloadTimer);
  });
</script>

<style scoped>
  .update-slide-enter-active,
  .update-slide-leave-active {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .update-slide-enter-from,
  .update-slide-leave-to {
    transform: translateY(-100%);
    opacity: 0;
  }

  .update-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    border-bottom: 1px solid rgba(99, 102, 241, 0.3);
    padding: 12px 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .update-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .update-icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a5b4fc;
    animation: spin 2s linear infinite;
  }
  .update-icon svg {
    width: 20px;
    height: 20px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .update-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .update-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .update-desc {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .update-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .update-btn {
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .update-btn--now {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }
  .update-btn--now:hover {
    background: #4f46e5;
  }
  .update-btn--later {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-tertiary);
    border: 1px solid var(--border-secondary);
  }
  .update-btn--later:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 640px) {
    .update-content {
      flex-wrap: wrap;
    }
    .update-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
