<template>
  <div ref="triggerRef" class="resource-preloader">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { codeSplitService } from '@/services/code-split.service'

interface Props {
  resources: string[]
  strategy?: 'visible' | 'hover' | 'click' | 'immediate'
  priority?: 'high' | 'medium' | 'low'
  threshold?: number
  timeout?: number
}

const props = withDefaults(defineProps<Props>(), {
  strategy: 'visible',
  priority: 'medium',
  threshold: 0.5,
  timeout: 5000
})

const emit = defineEmits<{
  preloadStart: []
  preloadComplete: [loaded: string[], failed: string[]]
  timeout: [resources: string[]]
}>()

const triggerRef = ref<HTMLElement>()
let observer: IntersectionObserver | null = null
let timeoutId: NodeJS.Timeout | null = null
let loaded = new Set<string>()
let failed = new Set<string>()

// 预加载资源
const preloadResources = async () => {
  if (props.resources.length === 0) return
  
  emit('preloadStart')
  loaded.clear()
  failed.clear()
  
  const promises = props.resources.map(resource => {
    return codeSplitService.loadModule(resource)
      .then(() => {
        loaded.add(resource)
      })
      .catch(() => {
        failed.add(resource)
      })
  })
  
  try {
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Preload timeout'))
        }, props.timeout)
      })
    ])
    
    emit('preloadComplete', Array.from(loaded), Array.from(failed))
  } catch (error) {
    if (error.message === 'Preload timeout') {
      const failedResources = props.resources.filter(r => !loaded.has(r))
      emit('timeout', failedResources)
    }
    emit('preloadComplete', Array.from(loaded), Array.from(failed))
  }
}

// 设置交叉观察器
const setupIntersectionObserver = () => {
  if (!triggerRef.value || props.strategy !== 'visible') return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadResources()
          observer?.unobserve(entry.target)
        }
      })
    },
    {
      threshold: props.threshold,
      rootMargin: '50px'
    }
  )
  
  observer.observe(triggerRef.value)
}

// 设置事件监听器
const setupEventListeners = () => {
  if (!triggerRef.value) return
  
  switch (props.strategy) {
    case 'hover':
      triggerRef.value.addEventListener('mouseenter', preloadResources, { once: true })
      break
    case 'click':
      triggerRef.value.addEventListener('click', preloadResources, { once: true })
      break
  }
}

// 生命周期
onMounted(() => {
  if (props.strategy === 'immediate') {
    nextTick(() => {
      preloadResources()
    })
  } else if (props.strategy === 'visible') {
    setupIntersectionObserver()
  } else {
    setupEventListeners()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  
  // 清理事件监听器
  if (triggerRef.value && props.strategy === 'hover') {
    triggerRef.value.removeEventListener('mouseenter', preloadResources)
  } else if (triggerRef.value && props.strategy === 'click') {
    triggerRef.value.removeEventListener('click', preloadResources)
  }
})
</script>

<style scoped>
.resource-preloader {
  display: contents;
}
</style>