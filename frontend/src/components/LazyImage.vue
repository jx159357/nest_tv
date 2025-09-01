<template>
  <div class="lazy-image-container" :class="containerClasses">
    <img
      v-if="isLoaded || !lazyLoad"
      :src="currentSrc"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyles"
      @load="handleLoad"
      @error="handleError"
    />
    <div 
      v-else-if="showPlaceholder" 
      class="lazy-image-placeholder"
      :class="placeholderClasses"
    >
      <slot name="placeholder">
        <div class="default-placeholder">
          <svg class="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12" />
          </svg>
          <span class="placeholder-text">加载中...</span>
        </div>
      </slot>
    </div>
    <div v-if="showError" class="lazy-image-error" :class="errorClasses">
      <slot name="error">
        <div class="error-content">
          <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5" />
          </svg>
          <span class="error-text">加载失败</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePerformanceMonitor } from '@/utils/performance'

interface Props {
  src: string
  alt?: string
  lazyLoad?: boolean
  placeholder?: string
  errorPlaceholder?: string
  width?: number | string
  height?: number | string
  aspectRatio?: string
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  quality?: 'low' | 'medium' | 'high'
  fadeIn?: boolean
  retryCount?: number
  retryDelay?: number
  className?: string
  placeholderClassName?: string
  errorClassName?: string
}

const props = withDefaults(defineProps<Props>(), {
  lazyLoad: true,
  fadeIn: true,
  retryCount: 3,
  retryDelay: 1000,
  fit: 'cover',
  quality: 'medium'
})

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  retry: [attempt: number]
}>()

const isLoaded = ref(false)
const hasError = ref(false)
const isLoading = ref(false)
const retryAttempt = ref(0)
const observer = ref<IntersectionObserver | null>(null)
const imageRef = ref<HTMLImageElement>()

const { trackApiCall } = useApiPerformance()

// 计算类名
const containerClasses = computed(() => [
  'lazy-image-container',
  props.className,
  {
    'lazy-image-loaded': isLoaded.value,
    'lazy-image-error': hasError.value,
    'lazy-image-loading': isLoading.value,
    'lazy-image-fade-in': props.fadeIn && isLoaded.value
  }
])

const imageClasses = computed(() => [
  'lazy-image',
  {
    'lazy-image-fade-in': props.fadeIn && isLoaded.value
  }
])

const placeholderClasses = computed(() => [
  'lazy-image-placeholder',
  props.placeholderClassName
])

const errorClasses = computed(() => [
  'lazy-image-error',
  props.errorClassName
])

// 计算样式
const imageStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.aspectRatio) {
    styles.aspectRatio = props.aspectRatio
  }
  
  if (props.fit) {
    styles.objectFit = props.fit
  }
  
  return styles
})

// 计算当前源（支持不同质量）
const currentSrc = computed(() => {
  if (!props.src) return ''
  
  // 这里可以根据quality参数生成不同质量的图片URL
  // 例如：添加质量参数、调整尺寸等
  let src = props.src
  
  if (props.quality === 'low') {
    // 可以添加低质量参数，如：&q=50
    src += (src.includes('?') ? '&q=50' : '?q=50')
  } else if (props.quality === 'high') {
    // 可以添加高质量参数，如：&q=90
    src += (src.includes('?') ? '&q=90' : '?q=90')
  }
  
  return src
})

// 计算显示状态
const showPlaceholder = computed(() => {
  return props.lazyLoad ? !isLoaded.value && !hasError.value : false
})

const showError = computed(() => {
  return hasError.value && !props.errorPlaceholder
})

// 创建Intersection Observer
const createObserver = () => {
  if (!props.lazyLoad || typeof window === 'undefined') return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage()
          observer.value?.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '50px', // 提前50px开始加载
      threshold: 0.1 // 10%可见时开始加载
    }
  )
}

// 加载图片
const loadImage = async () => {
  if (isLoaded.value || isLoading.value) return

  isLoading.value = true
  hasError.value = false

  try {
    await trackApiCall(
      new Promise<void>((resolve, reject) => {
        const img = new Image()
        
        const handleLoad = (event: Event) => {
          img.onload = null
          img.onerror = null
          isLoaded.value = true
          isLoading.value = false
          retryAttempt.value = 0
          emit('load', event)
          resolve()
        }

        const handleError = (event: Event) => {
          img.onload = null
          img.onerror = null
          handleImageError(event)
          reject(event)
        }

        img.onload = handleLoad
        img.onerror = handleError
        img.src = currentSrc.value
      }),
      'image-load',
      false // 不使用缓存
    )
  } catch (error) {
    handleImageError(error as Event)
  }
}

// 处理加载错误
const handleImageError = (event: Event) => {
  isLoading.value = false
  
  // 重试机制
  if (retryAttempt.value < props.retryCount) {
    retryAttempt.value++
    emit('retry', retryAttempt.value)
    
    setTimeout(() => {
      loadImage()
    }, props.retryDelay)
  } else {
    hasError.value = true
    emit('error', event)
  }
}

// 处理加载完成
const handleLoad = (event: Event) => {
  isLoaded.value = true
  isLoading.value = false
  hasError.value = false
  retryAttempt.value = 0
  emit('load', event)
}

// 手动触发加载
const triggerLoad = () => {
  if (props.lazyLoad && !isLoaded.value && !hasError.value) {
    loadImage()
  }
}

// 重置状态
const reset = () => {
  isLoaded.value = false
  hasError.value = false
  isLoading.value = false
  retryAttempt.value = 0
}

// 获取图片信息
const getImageInfo = () => {
  return {
    loaded: isLoaded.value,
    error: hasError.value,
    loading: isLoading.value,
    retryAttempt: retryAttempt.value,
    naturalWidth: imageRef.value?.naturalWidth || 0,
    naturalHeight: imageRef.value?.naturalHeight || 0
  }
}

onMounted(() => {
  if (props.lazyLoad) {
    createObserver()
    
    if (imageRef.value && observer.value) {
      observer.value.observe(imageRef.value)
    }
  } else {
    loadImage()
  }
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
})

// 监听src变化
watch(() => props.src, () => {
  reset()
  if (props.lazyLoad) {
    if (imageRef.value && observer.value) {
      observer.value.observe(imageRef.value)
    }
  } else {
    loadImage()
  }
})

defineExpose({
  triggerLoad,
  reset,
  getImageInfo
})
</script>

<style scoped>
.lazy-image-container {
  @apply relative overflow-hidden bg-gray-100;
}

.lazy-image {
  @apply block w-full h-full transition-opacity duration-300;
}

.lazy-image-placeholder {
  @apply absolute inset-0 flex items-center justify-center bg-gray-100;
}

.lazy-image-error {
  @apply absolute inset-0 flex items-center justify-center bg-gray-200;
}

.lazy-image-loading {
  @apply animate-pulse;
}

.lazy-image-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.lazy-image-loaded {
  @apply bg-transparent;
}

.lazy-image-error {
  @apply bg-gray-200;
}

/* 默认占位符样式 */
.default-placeholder {
  @apply flex flex-col items-center justify-center text-gray-400;
}

.placeholder-icon {
  @apply w-12 h-12 mb-2;
}

.placeholder-text {
  @apply text-sm;
}

/* 错误内容样式 */
.error-content {
  @apply flex flex-col items-center justify-center text-red-400;
}

.error-icon {
  @apply w-12 h-12 mb-2;
}

.error-text {
  @apply text-sm;
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>