<template>
  <div class="notification-wrapper">
    <transition-group name="notification" tag="div" class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="`notification-${notification.type}`"
        role="alert"
      >
        <div class="notification-content">
          <!-- 图标 -->
          <div class="notification-icon">
            <svg
              v-if="notification.type === 'success'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'error'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'warning'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <!-- 内容 -->
          <div class="notification-body">
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-message">{{ notification.message }}</p>
          </div>

          <!-- 关闭按钮 -->
          <button class="notification-close" @click="removeNotification(notification.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
  import { notifications, removeNotification } from '@/composables/useModal';
</script>

<style scoped>
  .notification-wrapper {
    position: fixed;
    top: var(--spacing-4);
    right: var(--spacing-4);
    z-index: var(--z-toast);
    pointer-events: none;
  }

  .notification-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    max-width: 24rem;
    width: 100%;
  }

  .notification-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    padding: var(--spacing-4);
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-primary);
    pointer-events: auto;
    overflow: hidden;
    transform-origin: top right;
    transition: all 0.3s ease;
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    width: 100%;
  }

  .notification-icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }

  .notification-icon svg {
    width: 100%;
    height: 100%;
  }

  .notification-success {
    border-left: 4px solid var(--color-success);
  }

  .notification-success .notification-icon {
    color: var(--color-success);
  }

  .notification-error {
    border-left: 4px solid var(--color-error);
  }

  .notification-error .notification-icon {
    color: var(--color-error);
  }

  .notification-warning {
    border-left: 4px solid var(--color-warning);
  }

  .notification-warning .notification-icon {
    color: var(--color-warning);
  }

  .notification-info {
    border-left: 4px solid var(--color-info);
  }

  .notification-info .notification-icon {
    color: var(--color-info);
  }

  .notification-body {
    flex: 1;
    min-width: 0;
  }

  .notification-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-1);
  }

  .notification-message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .notification-close {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    padding: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .notification-close:hover {
    color: var(--text-secondary);
  }

  .notification-close svg {
    width: 100%;
    height: 100%;
  }

  .notification-enter-from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }

  .notification-enter-to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  .notification-leave-from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  .notification-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }

  .notification-move {
    transition: transform 0.3s ease;
  }
</style>
