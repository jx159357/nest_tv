<template>
  <div class="empty-state">
    <div class="empty-state-icon" :class="`icon-${icon}`">
      <svg
        v-if="icon === 'search'"
        class="w-16 h-16"
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
    
    <button
      v-if="action"
      @click="action.onClick"
      class="empty-state-action"
    >
      {{ action.text }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { EmptyStateProps } from '@/types'

interface Props {
  title: string
  description?: string
  icon?: 'search' | 'film' | 'heart' | 'light' | 'document'
  action?: EmptyStateProps['action']
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'document'
})
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-state-icon {
  @apply mb-4 text-gray-400;
}

.empty-state-title {
  @apply text-lg font-medium text-gray-900 mb-1;
}

.empty-state-description {
  @apply text-gray-500 max-w-md;
}

.empty-state-action {
  @apply mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200;
}

.empty-state-action:hover {
  @apply bg-indigo-700;
}

/* Icon specific styles */
.icon-search svg {
  @apply text-gray-400;
}

.icon-film svg {
  @apply text-gray-400;
}

.icon-heart svg {
  @apply text-red-400;
}

.icon-light svg {
  @apply text-yellow-400;
}

.icon-document svg {
  @apply text-gray-400;
}
</style>