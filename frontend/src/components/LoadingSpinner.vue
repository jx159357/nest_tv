<template>
  <div class="loading-spinner" :class="spinnerClasses">
    <div class="spinner">
      <div class="spinner-circle"></div>
    </div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
  color?: string
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  color: 'indigo',
  centered: true
})

const spinnerClasses = computed(() => [
  `spinner-${props.size}`,
  `spinner-${props.color}`,
  {
    'spinner-centered': props.centered
  }
])
</script>

<style scoped>
.loading-spinner {
  @apply flex flex-col items-center justify-center;
}

.spinner-centered {
  @apply fixed inset-0 bg-white bg-opacity-75 z-50;
}

.spinner {
  @apply relative;
}

.spinner-circle {
  @apply border-4 border-gray-200 border-t-current rounded-full animate-spin;
}

/* Size variants */
.spinner-small .spinner-circle {
  @apply w-6 h-6 border-2;
}

.spinner-medium .spinner-circle {
  @apply w-8 h-8 border-4;
}

.spinner-large .spinner-circle {
  @apply w-12 h-12 border-4;
}

/* Color variants */
.spinner-indigo .spinner-circle {
  @apply border-t-indigo-600;
}

.spinner-blue .spinner-circle {
  @apply border-t-blue-600;
}

.spinner-green .spinner-circle {
  @apply border-t-green-600;
}

.spinner-red .spinner-circle {
  @apply border-t-red-600;
}

.spinner-gray .spinner-circle {
  @apply border-t-gray-600;
}

.spinner-text {
  @apply mt-2 text-sm text-gray-600 text-center;
}

.spinner-small .spinner-text {
  @apply text-xs;
}

.spinner-large .spinner-text {
  @apply text-base;
}
</style>