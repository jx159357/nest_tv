<template>
  <div class="card" :class="cardClasses" @click="handleClick">
    <div v-if="$slots.image || media.poster" class="card-image">
      <slot name="image">
        <img
          v-if="media.poster"
          :src="imageSrc"
          :alt="media.title"
          class="w-full h-48 object-cover transition-opacity duration-300"
          :class="{ 'opacity-0': !imageLoaded, 'opacity-100': imageLoaded }"
          :loading="lazyLoading ? 'lazy' : 'eager'"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div v-if="!imageLoaded" class="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div class="animate-pulse">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div v-else-if="imageError" class="w-full h-48 flex items-center justify-center bg-gray-200">
          <span class="text-gray-500">加载失败</span>
        </div>
        <div v-if="!media.poster" class="w-full h-48 flex items-center justify-center bg-gray-200">
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
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import type { MediaResource } from '@/types';

  interface Props {
    media: MediaResource;
    showRating?: boolean;
    showViewCount?: boolean;
    clickable?: boolean;
    size?: 'small' | 'medium' | 'large';
    hoverable?: boolean;
    lazyLoading?: boolean;
    placeholderImage?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    showRating: true,
    showViewCount: true,
    clickable: true,
    size: 'medium',
    hoverable: true,
    lazyLoading: true,
    placeholderImage: '/placeholder.jpg',
  });

  const emit = defineEmits<{
    click: [media: MediaResource];
    imageError: [event: Event];
    imageLoad: [event: Event];
  }>();

  const imageLoaded = ref(false);
  const imageError = ref(false);
  const observer = ref<IntersectionObserver | null>(null);
  const imageElement = ref<HTMLImageElement | null>(null);
  const shouldLoadImage = ref(!props.lazyLoading);

  const imageSrc = computed(() => {
    if (!props.media.poster) return '';
    // 添加图片压缩参数
    const url = new URL(props.media.poster, window.location.origin);
    url.searchParams.set('quality', '80');
    url.searchParams.set('width', '300');
    return url.toString();
  });

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

  const handleImageLoad = (event: Event) => {
    imageLoaded.value = true;
    imageError.value = false;
    emit('imageLoad', event);
  };

  const handleImageError = (event: Event) => {
    imageLoaded.value = false;
    imageError.value = true;
    emit('imageError', event);
  };

  // 懒加载逻辑
  const setupIntersectionObserver = () => {
    if (!props.lazyLoading || !('IntersectionObserver' in window)) {
      shouldLoadImage.value = true;
      return;
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            shouldLoadImage.value = true;
            observer.value?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imageElement.value) {
      observer.value.observe(imageElement.value);
    }
  };

  onMounted(() => {
    setupIntersectionObserver();
  });

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect();
    }
  });
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
