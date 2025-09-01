<template>
  <div class="virtual-scroll-container" @scroll="handleScroll">
    <div class="virtual-scroll-spacer" :style="{ height: `${totalHeight}px` }"></div>
    <div 
      v-for="item in visibleItems" 
      :key="item.id || item.key" 
      class="virtual-scroll-item"
      :style="{ 
        transform: `translateY(${item.offset}px`,
        position: 'absolute',
        width: '100%'
      }"
    >
      <slot :item="item.data" :index="item.index"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePerformanceMonitor } from '@/utils/performance'

interface VirtualScrollItem<T = any> {
  id: string | number
  index: number
  data: T
  offset: number
}

interface Props {
  items: any[]
  itemHeight: number
  buffer?: number
  overscan?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5,
  overscan: 3
})

const emit = defineEmits<{
  scroll: [event: Event]
  loadMore: []
}>()

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(0)
const isScrolling = ref(false)
const scrollTimeout = ref<NodeJS.Timeout>()

const { trackRenderStart, trackRenderEnd } = usePerformanceMonitor('VirtualScroll')

// 计算总高度
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

// 计算可见范围
const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
  const end = Math.min(
    props.items.length - 1,
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.buffer
  )
  
  return { start, end }
})

// 计算可见项目
const visibleItems = computed<VirtualScrollItem[]>(() => {
  const { start, end } = visibleRange.value
  
  return Array.from(
    { length: end - start + 1 },
    (_, index) => {
      const itemIndex = start + index
      return {
        id: props.items[itemIndex]?.id || itemIndex,
        index: itemIndex,
        data: props.items[itemIndex],
        offset: itemIndex * props.itemHeight
      }
    }
  )
})

// 处理滚动事件
const handleScroll = (event: Event) => {
  const container = containerRef.value
  if (!container) return

  scrollTop.value = container.scrollTop
  emit('scroll', event)
  
  // 防抖处理
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
  
  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  isScrolling.value = true
  
  // 检查是否需要加载更多
  checkLoadMore()
}

// 检查是否需要加载更多
const checkLoadMore = () => {
  const container = containerRef.value
  if (!container) return

  const scrollBottom = scrollTop.value + containerHeight.value
  const threshold = totalHeight.value - props.itemHeight * props.overscan

  if (scrollBottom >= threshold) {
    emit('loadMore')
  }
}

// 更新容器高度
const updateContainerHeight = () => {
  const container = containerRef.value
  if (container) {
    containerHeight.value = container.clientHeight
  }
}

// 滚动到指定项目
const scrollToItem = (index: number) => {
  const container = containerRef.value
  if (!container) return

  const offset = index * props.itemHeight
  container.scrollTo({
    top: offset,
    behavior: 'smooth'
  })
}

// 滚动到顶部
const scrollToTop = () => {
  const container = containerRef.value
  if (!container) return

  container.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 滚动到底部
const scrollToBottom = () => {
  const container = containerRef.value
  if (!container) return

  container.scrollTo({
    top: totalHeight.value,
    behavior: 'smooth'
  })
}

// 获取当前滚动信息
const getScrollInfo = () => {
  return {
    scrollTop: scrollTop.value,
    containerHeight: containerHeight.value,
    totalHeight: totalHeight.value,
    scrollPercentage: (scrollTop.value + containerHeight.value) / totalHeight.value * 100
  }
}

// 监听窗口大小变化
onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

// 监听props变化
watch(() => props.items, () => {
  // 当items变化时，可能需要重新计算
  checkLoadMore()
})

defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getScrollInfo
})
</script>

<style scoped>
.virtual-scroll-container {
  @apply relative overflow-y-auto w-full h-full;
}

.virtual-scroll-spacer {
  @apply relative;
}

.virtual-scroll-item {
  @apply absolute left-0;
  will-change: transform;
}

/* 滚动条样式优化 */
.virtual-scroll-container::-webkit-scrollbar {
  @apply w-2;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full hover:bg-gray-400;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:active {
  @apply bg-gray-500;
}
</style>