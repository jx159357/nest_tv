<template>
  <div id="app">
    <!-- 全局错误边界 -->
    <ErrorBoundary
      v-if="globalError"
      :error="globalError"
      :retryable="true"
      :show-home="true"
      @retry="clearGlobalError"
      @dismiss="clearGlobalError"
    />
    
    <!-- 应用内容 -->
    <router-view v-else v-slot="{ Component }">
      <ErrorBoundary
        :error="componentError"
        :retryable="true"
        :show-home="true"
        @retry="clearComponentError"
        @dismiss="clearComponentError"
      >
        <component :is="Component" @error="handleComponentError" />
      </ErrorBoundary>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onUnmounted } from 'vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const globalError = ref<Error | null>(null)
const componentError = ref<Error | null>(null)

// 全局错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('全局错误捕获:', err)
  console.error('组件实例:', instance)
  console.error('错误信息:', info)
  
  // 处理不同类型的错误
  if (err instanceof TypeError) {
    console.error('类型错误:', err.message)
  } else if (err instanceof ReferenceError) {
    console.error('引用错误:', err.message)
  } else if (err instanceof SyntaxError) {
    console.error('语法错误:', err.message)
  }
  
  // 设置全局错误
  globalError.value = err
  
  // 阻止错误继续传播
  return false
})

// 处理组件错误
const handleComponentError = (err: Error) => {
  console.error('组件错误:', err)
  componentError.value = err
}

// 清除全局错误
const clearGlobalError = () => {
  globalError.value = null
}

// 清除组件错误
const clearComponentError = () => {
  componentError.value = null
}

// 全局未处理的Promise错误
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('未处理的Promise拒绝:', event.reason)
  
  // 将Promise错误转换为Error对象
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason))
  
  globalError.value = error
}

// 全局JavaScript错误
const handleGlobalError = (event: ErrorEvent) => {
  console.error('全局JavaScript错误:', event.error)
  
  if (event.error) {
    globalError.value = event.error
  } else {
    globalError.value = new Error(event.message)
  }
}

// 添加全局错误监听器
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  window.addEventListener('error', handleGlobalError)
}

// 组件卸载时移除监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    window.removeEventListener('error', handleGlobalError)
  }
})
</script>

<style>
/* 全局错误样式 */
#app {
  min-height: 100vh;
}

/* 确保错误边界覆盖整个屏幕 */
.error-centered {
  z-index: 9999;
}

/* 平滑过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 错误状态下的背景 */
.error-boundary.error-centered {
  backdrop-filter: blur(4px);
}
</style>