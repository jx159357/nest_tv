<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="true" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal-container" :class="`modal-${type}`">
          <div class="modal-body">
            <!-- 加载动画 -->
            <div v-if="type === 'loading'" class="modal-icon modal-icon--loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke-width="3"
                  stroke-dasharray="31.4 31.4"
                  stroke-linecap="round"
                />
              </svg>
            </div>

            <!-- 成功图标 -->
            <div v-else-if="type === 'success'" class="modal-icon modal-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- 错误图标 -->
            <div v-else-if="type === 'error'" class="modal-icon modal-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- 信息图标 -->
            <div v-else-if="type === 'info'" class="modal-icon modal-icon--info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- 确认图标 -->
            <div v-else-if="type === 'confirm'" class="modal-icon modal-icon--confirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- 标题 -->
            <h3 v-if="title" class="modal-title">{{ title }}</h3>

            <!-- 消息 -->
            <p v-if="message" class="modal-message">{{ message }}</p>

            <!-- 操作按钮 -->
            <div v-if="showAction" class="modal-actions">
              <button v-if="cancelText" class="modal-btn modal-btn--cancel" @click="handleCancel">
                {{ cancelText }}
              </button>
              <button
                v-if="confirmText"
                class="modal-btn modal-btn--confirm"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  interface Props {
    type: 'loading' | 'success' | 'error' | 'info' | 'confirm';
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    showAction?: boolean;
    closeOnOverlay?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showAction: false,
    confirmText: '确认',
    cancelText: '取消',
    closeOnOverlay: false,
  });

  const emit = defineEmits<{
    confirm: [];
    cancel: [];
    close: [];
  }>();

  const autoCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null);

  const handleConfirm = () => {
    emit('confirm');
    emit('close');
  };

  const handleCancel = () => {
    emit('cancel');
    emit('close');
  };

  const handleOverlayClick = () => {
    if (props.closeOnOverlay && !props.showAction) {
      emit('close');
    }
  };

  onMounted(() => {
    if (['success', 'error', 'info'].includes(props.type)) {
      autoCloseTimer.value = setTimeout(() => {
        emit('close');
      }, 3000);
    }
    if (props.type === 'loading') {
      autoCloseTimer.value = setTimeout(() => {
        emit('close');
      }, 15000);
    }
  });

  onUnmounted(() => {
    if (autoCloseTimer.value) {
      clearTimeout(autoCloseTimer.value);
    }
  });
</script>

<style scoped>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-overlay);
    padding: var(--spacing-4);
  }

  .modal-container {
    position: relative;
    width: 100%;
    max-width: 24rem;
    background: var(--bg-card);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-primary);
    overflow: hidden;
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-8) var(--spacing-6);
    text-align: center;
  }

  .modal-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-icon svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .modal-icon--loading {
    color: var(--color-brand-primary);
    animation: modal-spin 1s linear infinite;
  }

  .modal-icon--success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }

  .modal-icon--error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }

  .modal-icon--info {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-info);
  }

  .modal-icon--confirm {
    background: rgba(245, 158, 11, 0.1);
    color: var(--color-warning);
  }

  .modal-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-tight);
  }

  .modal-message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-6);
    max-width: 20rem;
  }

  .modal-actions {
    display: flex;
    gap: var(--spacing-3);
    width: 100%;
    justify-content: center;
  }

  .modal-btn {
    padding: var(--spacing-2) var(--spacing-5);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid transparent;
    min-width: 5rem;
  }

  .modal-btn--confirm {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .modal-btn--confirm:hover {
    background: var(--color-brand-primary-dark);
  }

  .modal-btn--cancel {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border-color: var(--border-primary);
  }

  .modal-btn--cancel:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  /* 动画 */
  .modal-fade-enter-active {
    transition: opacity 0.2s ease;
  }

  .modal-fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }

  .modal-fade-enter-from .modal-container {
    transform: scale(0.95);
  }

  @keyframes modal-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
