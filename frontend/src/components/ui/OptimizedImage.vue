<template>
  <div class="optimized-image-container" :class="{ 'loading': isLoading, 'loaded': isLoaded, 'error': hasError }">
    <img
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
      @click="$emit('click', $event)"
    />
    
    <!-- 加载状态 -->
    <div v-if="isLoading && showPlaceholder" class="image-placeholder">
      <slot name="placeholder">
        <div class="default-placeholder">
          <svg class="placeholder-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-4.586A2 2 0 0012 2.586V3.586A2 2 0 0010.414 2H4zm3 7a1 1 0 100-2 0v6a1 1 0 102 0V8a1 1 0 100-2zm7-1a1 1 0 011 1v6a1 1 0 11-2V9a1 1 0 01-1-1zm-7 7a1 1 0 007 1v1a1 1 0 11-2 0v-1a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
      </slot>
    </div>

    <!-- 错误状态 -->
    <div v-if="hasError && showFallback" class="image-fallback">
      <slot name="fallback">
        <div class="default-fallback">
          <svg class="fallback-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
      </slot>
    </div>

    <!-- 懒存图片 -->
    <img
      v-if="lazyLoad && shouldPreload"
      ref="preloadImageRef"
      :src="src"
      :alt="alt"
      class="hidden"
      @load="onPreload"
      @error="onError"
      style="position: absolute; opacity: 0; pointer-events: none;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  aspectRatio?: string
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none'
  quality?: 'low' | 'medium' | 'high'
  lazyLoad?: boolean
  preloadDistance?: number
  showPlaceholder?: boolean
  showFallback?: boolean
  placeholderColor?: string
  bgColor?: string
  rounded?: boolean
  shadow?: boolean
  cache?: boolean
  debounceLoad?: boolean
  debounceTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  width: 'auto',
  height: 'auto',
  aspectRatio: '1/1',
  fit: 'cover',
  quality: 'medium',
  lazyLoad: true,
  preloadDistance: 200,
  showPlaceholder: true,
  showFallback: true,
  placeholderColor: '#f3f4f6',
  bgColor: 'transparent',
  rounded: false,
  shadow: false,
  cache: true,
  debounceLoad: true,
  debounceTime: 100
})

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  click: [event: Event]
}>()

const imageRef = ref<HTMLImageElement>()
const preloadImageRef = ref<HTMLImageElement>()
const isLoading = ref(true)
const isLoaded = ref(false)
const hasError = ref(false)
const shouldPreload = ref(false)
const debounceTimer = ref<number>()

// 计算属性
const imageClasses = computed(() => [
  'optimized-image',
  {
    'rounded': props.rounded,
    'shadow': props.shadow
  }
])

const imageStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  aspectRatio: props.aspectRatio,
  objectFit: props.fit,
  backgroundColor: props.bgColor
}))

const currentSrc = computed(() => {
  if (!props.src) return ''
  
  // 根据质量参数生成图片URL
  let src = props.src
  
  if (props.quality !== 'high') {
    const qualityMap = {
      low: 'q_30,w_300',
      medium: 'q_70,w_800',
      high: 'q_90'
    }
    
    const qualityParams = qualityMap[props.quality]
    if (qualityParams) {
      const separator = src.includes('?') ? '&' : '?'
      src = `${src}${separator}${qualityParams}`
    }
  }
  
  return src
})

// 生成占位符样式
const placeholderStyle = computed(() => ({
  backgroundColor: props.placeholderColor,
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  aspectRatio: props.aspectRatio
}))

// 观察器设置
let observer: IntersectionObserver | null = null

// 图片加载处理
const loadImage = () => {
  if (props.debounceLoad) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(() => {
      if (imageRef.value) {
        isLoading.value = true
        imageRef.value.src = currentSrc.value
      }
    }, props.debounceTime)
  } else {
    if (imageRef.value) {
      isLoading.value = true
      imageRef.value.src = currentSrc.value
    }
  }
}

const onLoad = (event: Event) => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  emit('load', event)
}

const onError = (event: Event) => {
  isLoading.value = false
  hasError.value = true
  emit('error', event)
}

const onPreload = () => {
  shouldPreload.value = true
  setTimeout(() => {
    if (preloadImageRef.value && preloadImageRef.value.complete) {
      onLoad(new Event('load'))
    }
  }, 50)
}

// 设置懒加载观察器
const setupObserver = () => {
  if (!props.lazyLoad || !imageRef.value) return

  const options: IntersectionObserverInit = {
    rootMargin: `${props.preloadDistance}px`
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage()
        observer?.unobserve(entry.target)
      }
    })
  }, options)

  observer.observe(imageRef.value)
}

// 手动触发加载
const triggerLoad = () => {
  shouldPreload.value = true
  nextTick(() => {
    loadImage()
  })
}

// 生命周期
onMounted(() => {
  if (!props.lazyLoad) {
    triggerLoad()
  } else {
    setupObserver()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  clearTimeout(debounceTimer.value)
})

// 监听src变化
watch(() => props.src, () => {
  if (props.src) {
    isLoading.value = true
    hasError.value = false
    if (!props.lazyLoad || shouldPreload.value) {
      loadImage()
    }
  }
})

// 暴露方法给父组件
defineExpose({
  triggerLoad,
  reload: triggerLoad,
  element: imageRef
})
</script>

<style scoped>
.optimized-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: v-bind('bgColor');
  transition: opacity 0.3s ease;
}

.optimized-image {
  display: block;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.loading .optimized-image {
  opacity: 0;
  filter: blur(5px);
}

.loaded .optimized-image {
  opacity: 1;
  filter: blur(0);
}

.error .optimized-image {
  opacity: 0;
}

.image-placeholder,
.image-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: v-bind('placeholderColor');
  transition: opacity 0.3s ease;
}

.default-placeholder,
.default-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
}

.placeholder-icon,
.fallback-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.hidden {
  display: none;
}

/* 圆角和阴影效果 */
.rounded {
  border-radius: 0.5rem;
}

.shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 响应式优化 */
@media (prefers-reduced-motion: reduce) {
  .optimized-image {
    transition: none;
  }
}

@media (prefers-color-scheme: dark) {
  .default-placeholder,
  .default-fallback {
    color: #6b7280;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .optimized-image-container {
    max-width: 100%;
  }
  
  .placeholder-icon,
  .fallback-icon {
    width: 32px;
    height: 32px;
  }
}
</style>