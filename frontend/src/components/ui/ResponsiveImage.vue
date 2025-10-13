<template>
  <div class="responsive-image-wrapper" :class="wrapperClasses">
    <img
      v-if="!lazy"
      :src="imageSrc"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyles"
      @load="onLoad"
      @error="onError"
      @click="$emit('click', $event)"
    />
    <img
      v-else
      v-lazy="imageSrc"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyles"
      @load="onLoad"
      @error="onError"
      @click="$emit('click', $event)"
    />
    <div v-if="loading" class="image-loading">
      <div class="loading-spinner"></div>
    </div>
    <div v-if="error" class="image-error">
      <slot name="error">
        <div class="error-placeholder">
          <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8 8-3.59 8-8-8zm1-13h2v2H11v-2z"
            />
          </svg>
          <span class="error-text">图片加载失败</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';

  interface Props {
    src: string;
    alt?: string;
    lazy?: boolean;
    aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | 'square' | 'auto';
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
    rounded?: boolean;
    className?: string;
    onClick?: (event: Event) => void;
  }

  const props = withDefaults(defineProps<Props>(), {
    alt: '',
    lazy: true,
    aspectRatio: 'auto',
    fit: 'cover',
    size: 'responsive',
    rounded: false,
    className: '',
  });

  const emit = defineEmits<{
    click: [event: Event];
    load: [event: Event];
    error: [event: Event];
  }>();

  const loading = ref(props.lazy);
  const error = ref(false);
  const imageLoaded = ref(false);

  const imageSrc = computed(() => props.src);

  const aspectRatioClasses = computed(() => {
    switch (props.aspectRatio) {
      case '1:1':
        return 'aspect-ratio-1-1';
      case '16:9':
        return 'aspect-ratio-16-9';
      case '4:3':
        return 'aspect-ratio-4-3';
      case '3:2':
        return 'aspect-ratio-3-2';
      case 'square':
        return 'aspect-ratio-square';
      default:
        return 'aspect-ratio-auto';
    }
  });

  const sizeClasses = computed(() => {
    if (props.size === 'responsive') {
      return 'size-responsive';
    }
    return `size-${props.size}`;
  });

  const imageClasses = computed(() => {
    const classes = ['responsive-image'];

    if (props.rounded) {
      classes.push('image-rounded');
    }

    classes.push(aspectRatioClasses.value);
    classes.push(sizeClasses.value);

    if (imageLoaded.value) {
      classes.push('image-loaded');
    }

    if (error.value) {
      classes.push('image-error');
    }

    if (props.className) {
      classes.push(props.className);
    }

    return classes;
  });

  const wrapperClasses = computed(() => {
    const classes = ['responsive-image-wrapper'];

    if (props.className) {
      classes.push(`wrapper-${props.className}`);
    }

    return classes;
  });

  const imageStyles = computed(() => ({
    objectFit: props.fit,
  }));

  const onLoad = (event: Event) => {
    loading.value = false;
    error.value = false;
    imageLoaded.value = true;
    emit('load', event);
  };

  const onError = (event: Event) => {
    loading.value = false;
    error.value = true;
    imageLoaded.value = false;
    emit('error', event);
  };

  // 支持v-lazy指令
  const vLazy = {
    mounted(el: HTMLImageElement, binding: any) {
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                el.src = binding.value;
                observer.unobserve(el);
              }
            });
          },
          {
            rootMargin: '50px',
            threshold: 0.1,
          },
        );

        observer.observe(el);
      } else {
        // 回退方案：直接加载
        el.src = binding.value;
      }
    },
  };
</script>

<style scoped>
  /* 图片容器样式 */
  .responsive-image-wrapper {
    position: relative;
    overflow: hidden;
    display: block;
    width: 100%;
  }

  /* 图片样式 */
  .responsive-image {
    width: 100%;
    height: 100%;
    display: block;
    transition: opacity 0.3s ease;
  }

  /* 加载状态 */
  .image-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* 错误状态 */
  .image-error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f2;
    border: 1px solid #fee;
  }

  .error-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #6b7280;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    color: #dc2626;
  }

  .error-text {
    font-size: 14px;
    font-weight: 500;
  }

  /* 宽高比样式 */
  .aspect-ratio-1-1 {
    aspect-ratio: 1/1;
  }

  .aspect-ratio-16-9 {
    aspect-ratio: 16/9;
  }

  .aspect-ratio-4-3 {
    aspect-ratio: 4/3;
  }

  .aspect-ratio-3-2 {
    aspect-ratio: 3/2;
  }

  .aspect-ratio-square {
    aspect-ratio: 1/1;
  }

  .aspect-ratio-auto {
    aspect-ratio: auto;
  }

  /* 尺寸样式 */
  .size-sm {
    max-width: 160px;
    max-height: 160px;
  }

  .size-md {
    max-width: 320px;
    max-height: 320px;
  }

  .size-lg {
    max-width: 480px;
    max-height: 480px;
  }

  .size-xl {
    max-width: 640px;
    max-height: 640px;
  }

  .size-responsive {
    width: 100%;
    height: auto;
  }

  /* 圆角样式 */
  .image-rounded {
    border-radius: 8px;
  }

  /* 加载动画 */
  .image-loaded {
    opacity: 1;
  }

  .responsive-image:not(.image-loaded) {
    opacity: 0;
  }

  /* 错误图片样式 */
  .image-error .responsive-image {
    opacity: 0;
  }

  /* 旋转动画 */
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* 响应式优化 */
  @media (max-width: 640px) {
    .size-responsive {
      max-height: 240px;
    }
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    .size-responsive {
      max-height: 320px;
    }
  }

  @media (min-width: 1025px) {
    .size-responsive {
      max-height: 480px;
    }
  }

  /* 触摸设备优化 */
  @media (hover: none) {
    .responsive-image-wrapper:active {
      transform: scale(0.98);
    }
  }

  /* 高对比度模式 */
  @media (prefers-contrast: high) {
    .responsive-image-wrapper {
      border: 2px solid currentColor;
    }

    .error-placeholder {
      border: 2px solid #dc2626;
    }
  }

  /* 减少动画模式 */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
      border-top-color: #4caf50;
    }
  }
</style>
