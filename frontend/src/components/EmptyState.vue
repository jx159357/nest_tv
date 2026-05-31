<template>
  <div class="empty-state">
    <div class="empty-state-icon" :class="`icon-${icon}`">
      <svg
        v-if="icon === 'search'"
        class="w-16 h-16"
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <svg
        v-else-if="icon === 'film'"
        class="w-16 h-16"
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
        />
      </svg>

      <svg
        v-else-if="icon === 'heart'"
        class="w-16 h-16"
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>

      <svg
        v-else-if="icon === 'light'"
        class="w-16 h-16"
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>

      <svg
        v-else
        class="w-16 h-16"
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>

    <h3 class="empty-state-title">{{ title }}</h3>

    <p v-if="description" class="empty-state-description">
      {{ description }}
    </p>

    <button v-if="action" class="empty-state-action" @click="action.onClick">
      {{ action.text }}
    </button>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    title: string;
    description?: string;
    icon?: 'search' | 'film' | 'heart' | 'light' | 'document';
    action?: {
      text: string;
      onClick: () => void;
    };
  }

  withDefaults(defineProps<Props>(), {
    icon: 'document',
  });
</script>

<style scoped>
  .empty-state {
    display: flex;
    min-height: var(--state-panel-min-height);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-3);
    padding: var(--spacing-8) var(--spacing-4);
    border: 1px solid var(--border-primary);
    border-radius: var(--panel-radius);
    background: var(--state-empty-bg);
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state-icon {
    color: var(--text-muted);
    opacity: 0.78;
  }

  .empty-state-title {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .empty-state-description {
    max-width: 28rem;
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
  }

  .empty-state-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--control-height-md);
    padding: var(--button-padding-md);
    border-radius: var(--radius-control);
    background: var(--color-brand-primary);
    color: var(--text-inverse);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
  }

  .empty-state-action:hover {
    background: var(--color-brand-primary-light);
    box-shadow: 0 10px 28px var(--color-brand-glow);
  }

  /* Icon specific styles */
  .icon-search svg {
    color: var(--text-muted);
  }

  .icon-film svg {
    color: var(--text-muted);
  }

  .icon-heart svg {
    color: var(--color-error-light);
  }

  .icon-light svg {
    color: var(--color-warning-light);
  }

  .icon-document svg {
    color: var(--text-muted);
  }
</style>
