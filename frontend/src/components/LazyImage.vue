<template>
  <div class="lazy-image-container" :style="containerStyle">
    <div v-if="loading" class="lazy-image-skeleton" :style="skeletonStyle">
      <div class="skeleton-content"></div>
    </div>
    
    <img
      v-else-if="isVisible && !error"
      :src="optimizedSrc"
      :alt="alt"
      :style="imageStyle"
      :class="imageClasses"
      @load="handleLoad"
      @error="handleError"
      @click="handleClick"
    />
    
    <div v-else-if="error" class="lazy-image-error" :style="errorStyle">
      <div class="error-content">
        <i v-if="showErrorIcon" class="error-icon">❌</i>
        <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
      </div>
      <button v-if="showRetryButton" @click="retryLoad" class="retry-button">
        重试
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  src: string
  alt?: string
  width?: string
  height?: string
  placeholder?: string
  errorPlaceholder?: string
  threshold?: number
  loading?: 'lazy' | 'eager'
  format?: 'webp' | 'auto'
  quality?: 'high' | 'medium' | 'low'
  showSkeleton?: boolean
  showErrorIcon?: boolean
  errorMessage?: string
  showRetryButton?: boolean
  retryCount?: number
  className?: string
  style?: Record<string, any>
  onClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  width: '100%',
  height: 'auto',
  placeholder: '/placeholder.jpg',
  errorPlaceholder: '/error-placeholder.jpg',
  threshold: 100,
  loading: 'lazy',
  format: 'auto',
  quality: 'medium',
  showSkeleton: true,
  showErrorIcon: true,
  errorMessage: '图片加载失败',
  showRetryButton: true,
  retryCount: 3,
  className: '',
  style: () => ({}),
  onClick: () => {}
})

// 响应式数据
const isVisible = ref(false)
const loading = ref(props.loading === 'eager')
const loaded = ref(false)
const error = ref(false)
const currentRetryCount = ref(0)
const imageElement = ref<HTMLImageElement>()

// 计算属性
const optimizedSrc = computed(() => {
  if (!props.src) return props.placeholder
  
  // 图片URL优化
  const url = new URL(props.src, window.location.origin)
  
  // 根据质量参数添加URL参数
  if (props.quality !== 'medium') {
    url.searchParams.set('quality', props.quality)
  }
  
  // WebP格式支持
  if (props.format === 'webp') {
    url.searchParams.set('format', 'webp')
  }
  
  return url.toString()
})

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: '#f5f5f5',
  ...props.style
}))

const skeletonStyle = computed(() => ({
  width: '100%',
  height: props.height === 'auto' ? '200px' : props.height,
  backgroundColor: '#e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'opacity 0.3s ease-in-out',
  opacity: loaded.value ? 1 : 0
}))

const errorStyle = computed(() => ({
  width: '100%',
  height: props.height === 'auto' ? '200px' : props.height,
  backgroundColor: '#ffebee',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  textAlign: 'center'
}))

const imageClasses = computed(() => [
  'lazy-image',
  props.className,
  {
    'lazy-image-loaded': loaded.value,
    'lazy-image-loading': !loaded.value && !error.value,
    'lazy-image-error': error.value
  }
])

// 事件处理
const handleLoad = () => {
  loaded.value = true
  loading.value = false
  error.value = false
  currentRetryCount.value = 0
}

const handleError = (event: Event) => {
  console.error('图片加载失败:', props.src, event)
  
  if (currentRetryCount.value < props.retryCount) {
    currentRetryCount.value++
    setTimeout(() => {
      if (imageElement.value) {
        imageElement.value.src = optimizedSrc.value
      }
    }, 1000 * currentRetryCount.value)
  } else {
    loaded.value = false
    loading.value = false
    error.value = true
  }
}

const retryLoad = () => {
  error.value = false
  currentRetryCount.value = 0
  if (imageElement.value) {
    imageElement.value.src = optimizedSrc.value
  }
}

const handleClick = () => {
  if (props.onClick) {
    props.onClick()
  }
}

// Intersection Observer
let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (!('IntersectionObserver' in window)) {
    // 浏览器不支持IntersectionObserver，直接显示
    isVisible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer?.unobserve(entry.target)
        }
      })
    },
    {
      root: null,
      rootMargin: `${props.threshold}px`,
      threshold: 0.1
    }
  )

  nextTick(() => {
    const element = document.querySelector('.lazy-image-container')
    if (element) {
      observer.observe(element)
    }
  })
}

// 生命周期钩子
onMounted(() => {
  if (props.loading === 'eager') {
    isVisible.value = true
  } else {
    setupIntersectionObserver()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// 监听props.src变化
watch(() => props.src, () => {
  if (isVisible.value) {
    loaded.value = false
    loading.value = true
    error.value = false
    currentRetryCount.value = 0
  }
}, { immediate: true })
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.lazy-image {
  transition: opacity 0.3s ease-in-out;
  cursor: pointer;
}

.lazy-image-loading {
  opacity: 0;
}

.lazy-image-loaded {
  opacity: 1;
}

.lazy-image-error {
  opacity: 0;
}

.lazy-image-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%, #e0e0e0);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
  width: 60%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s infinite;
}

.lazy-image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffebee;
  color: #dc3545;
  font-size: 14px;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.error-message {
  margin-bottom: 12px;
}

.retry-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #c82333;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lazy-image-container {
    border-radius: 4px;
  }
  
  .error-message {
    font-size: 12px;
    padding: 0 8px;
  }
  
  .retry-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .lazy-image-skeleton {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%, #3a3a3a);
  }
  
  .skeleton-content {
    background: #4a4a4a;
  }
  
  .lazy-image-error {
    background-color: #5a1a1a;
    color: #ff6b6b;
  }
  
  .retry-button {
    background-color: #dc3545;
  }
  
  .retry-button:hover {
    background-color: #c82333;
  }
}
</style>