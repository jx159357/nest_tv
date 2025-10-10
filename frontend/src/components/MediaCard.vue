<template>
  <div class="card" :class="cardClasses" @click="handleClick">
    <div v-if="$slots.image || media.poster" class="card-image">
      <slot name="image">
        <img
          v-if="media.poster"
          :src="media.poster"
          :alt="media.title"
          class="w-full h-48 object-cover"
          @error="handleImageError"
        />
        <div v-else class="w-full h-48 flex items-center justify-center bg-gray-200">
          <span class="text-gray-500">暂无封面</span>
        </div>
      </slot>
    </div>

    <div class="card-content">
      <h3 class="card-title">
        <slot name="title">{{ media.title }}</slot>
      </h3>

      <div v-if="showRating || showViewCount" class="card-meta">
        <span v-if="showRating" class="rating">
          <slot name="rating"> 评分: {{ media.rating?.toFixed(1) || 'N/A' }} </slot>
        </span>
        <span v-if="showViewCount" class="view-count">
          <slot name="view-count"> 观看: {{ media.viewCount || 0 }} </slot>
        </span>
      </div>

      <div v-if="$slots.badge" class="card-badge">
        <slot name="badge"></slot>
      </div>

      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { MediaResource } from '@/types';

  interface Props {
    media: MediaResource;
    showRating?: boolean;
    showViewCount?: boolean;
    clickable?: boolean;
    size?: 'small' | 'medium' | 'large';
    hoverable?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showRating: true,
    showViewCount: true,
    clickable: true,
    size: 'medium',
    hoverable: true,
  });

  const emit = defineEmits<{
    click: [media: MediaResource];
    imageError: [event: Event];
  }>();

  const cardClasses = computed(() => [
    `card-${props.size}`,
    {
      'card-clickable': props.clickable,
      'card-hoverable': props.hoverable,
    },
  ]);

  const handleClick = () => {
    if (props.clickable) {
      emit('click', props.media);
    }
  };

  const handleImageError = (event: Event) => {
    emit('imageError', event);
  };
</script>

<style scoped>
  .card {
    @apply bg-white rounded-lg shadow-sm overflow-hidden;
  }

  .card-small {
    @apply transform scale-90;
  }

  .card-large {
    @apply transform scale-110;
  }

  .card-clickable {
    @apply cursor-pointer;
  }

  .card-hoverable:hover {
    @apply shadow-md transition-shadow duration-200;
  }

  .card-image {
    @apply relative;
  }

  .card-content {
    @apply p-4;
  }

  .card-title {
    @apply font-semibold text-gray-900 mb-2 line-clamp-2;
  }

  .card-meta {
    @apply flex items-center justify-between text-sm text-gray-500;
  }

  .card-badge {
    @apply mt-2;
  }

  .card-actions {
    @apply mt-3 flex items-center space-x-2;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .rating {
    @apply flex items-center;
  }

  .view-count {
    @apply flex items-center;
  }
</style>
