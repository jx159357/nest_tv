import { ref, onMounted, onUnmounted } from 'vue'

// 性能监控工具
export class PerformanceMonitor {
  private static metrics = {
    pageLoad: 0,
    apiCalls: 0,
    apiTotalTime: 0,
    renderTime: 0,
    memoryUsage: [] as number[],
    errors: 0,
    warnings: 0
  }

  private static observers = new Set<PerformanceObserver>()

  // 监控页面加载性能
  static trackPageLoad() {
    if (typeof window === 'undefined' || !window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.loadEventStart
      
      // 记录到控制台
      console.log(`🚀 页面加载时间: ${this.metrics.pageLoad}ms`)
      
      // 如果加载时间过长，发出警告
      if (this.metrics.pageLoad > 3000) {
        console.warn('⚠️ 页面加载时间过长，建议优化')
        this.metrics.warnings++
      }
    }
  }

  // 监控API调用性能
  static trackApiCall(duration: number, endpoint: string) {
    this.metrics.apiCalls++
    this.metrics.apiTotalTime += duration
    
    const avgTime = this.metrics.apiTotalTime / this.metrics.apiCalls
    
    console.log(`📡 API调用: ${endpoint} - ${duration}ms (平均: ${avgTime.toFixed(2)}ms)`)
    
    // 如果API调用时间过长，发出警告
    if (duration > 5000) {
      console.warn(`⚠️ API调用时间过长: ${endpoint} - ${duration}ms`)
      this.metrics.warnings++
    }
  }

  // 监控组件渲染性能
  static trackComponentRender(componentName: string, duration: number) {
    this.metrics.renderTime = duration
    
    console.log(`🎨 组件渲染: ${componentName} - ${duration}ms`)
    
    // 如果渲染时间过长，发出警告
    if (duration > 100) {
      console.warn(`⚠️ 组件渲染时间过长: ${componentName} - ${duration}ms`)
      this.metrics.warnings++
    }
  }

  // 监控内存使用
  static trackMemoryUsage() {
    if (typeof window === 'undefined' || !window.performance) return

    const memory = (performance as any).memory
    if (memory) {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024
      const totalMB = memory.totalJSHeapSize / 1024 / 1024
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
      
      this.metrics.memoryUsage.push(usedMB)
      
      // 只保留最近100条记录
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100)
      }
      
      console.log(`🧠 内存使用: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (限制: ${limitMB.toFixed(2)}MB)`)
      
      // 如果内存使用过高，发出警告
      if (usedMB > totalMB * 0.9) {
        console.warn('⚠️ 内存使用过高，建议检查内存泄漏')
        this.metrics.warnings++
      }
    }
  }

  // 监控错误
  static trackError(error: Error, context?: string) {
    this.metrics.errors++
    console.error(`❌ 错误 [${context || '未知'}]:`, error)
  }

  // 获取性能报告
  static getReport() {
    const avgApiTime = this.metrics.apiCalls > 0 
      ? this.metrics.apiTotalTime / this.metrics.apiCalls 
      : 0
    
    const avgMemory = this.metrics.memoryUsage.length > 0
      ? this.metrics.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.metrics.memoryUsage.length
      : 0
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        pageLoadTime: `${this.metrics.pageLoad}ms`,
        apiCalls: this.metrics.apiCalls,
        avgApiTime: `${avgApiTime.toFixed(2)}ms`,
        renderTime: `${this.metrics.renderTime}ms`,
        avgMemory: `${avgMemory.toFixed(2)}MB`,
        errors: this.metrics.errors,
        warnings: this.metrics.warnings
      },
      recommendations: this.generateRecommendations()
    }
  }

  // 生成性能优化建议
  private static generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.metrics.pageLoad > 3000) {
      recommendations.push('页面加载时间过长，建议：\n  - 优化图片加载，使用懒加载\n  - 减少首屏内容\n  - 启用Gzip压缩\n  - 使用CDN加速')
    }
    
    if (this.metrics.apiCalls > 0) {
      const avgApiTime = this.metrics.apiTotalTime / this.metrics.apiCalls
      if (avgApiTime > 2000) {
        recommendations.push('API调用平均时间过长，建议：\n  - 启用API缓存\n  - 优化数据库查询\n  - 使用分页加载\n  - 实现请求去重')
      }
    }
    
    if (this.metrics.renderTime > 100) {
      recommendations.push('组件渲染时间过长，建议：\n  - 使用虚拟滚动\n  - 优化组件结构\n  - 减少响应式数据\n  - 使用shouldUpdate优化')
    }
    
    const avgMemory = this.metrics.memoryUsage.length > 0
      ? this.metrics.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.metrics.memoryUsage.length
      : 0
    
    if (avgMemory > 50) {
      recommendations.push('内存使用过高，建议：\n  - 检查内存泄漏\n  - 及时清理无用数据\n  - 优化大数据结构\n  - 使用WeakMap/WeakSet')
    }
    
    if (this.metrics.errors > 5) {
      recommendations.push('错误数量较多，建议：\n  - 增强错误处理\n  - 添加错误边界\n  - 完善日志记录\n  - 实现错误恢复机制')
    }
    
    return recommendations
  }

  // 重置指标
  static reset() {
    this.metrics = {
      pageLoad: 0,
      apiCalls: 0,
      apiTotalTime: 0,
      renderTime: 0,
      memoryUsage: [],
      errors: 0,
      warnings: 0
    }
  }
}

// 高阶性能监控Hook
export function usePerformance(componentName: string) {
  const renderStartTime = ref(0)
  const renderEndTime = ref(0)
  const mountStartTime = ref(0)
  const mountEndTime = ref(0)

  onMounted(() => {
    mountStartTime.value = performance.now()
    
    // 监控组件挂载性能
    requestAnimationFrame(() => {
      mountEndTime.value = performance.now()
      const mountDuration = mountEndTime.value - mountStartTime.value
      PerformanceMonitor.trackComponentRender(`${componentName}-mount`, mountDuration)
    })
  })

  onUnmounted(() => {
    // 组件卸载时的清理工作
  })

  const trackRenderStart = () => {
    renderStartTime.value = performance.now()
  }

  const trackRenderEnd = () => {
    renderEndTime.value = performance.now()
    const renderDuration = renderEndTime.value - renderStartTime.value
    PerformanceMonitor.trackComponentRender(`${componentName}-render`, renderDuration)
  }

  return {
    trackRenderStart,
    trackRenderEnd,
    getRenderTime: () => renderEndTime.value - renderStartTime.value,
    getMountTime: () => mountEndTime.value - mountStartTime.value
  }
}

// API调用性能监控Hook
export function useApiPerformance() {
  const trackApiCall = async <T>(
    promise: Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await promise
      const endTime = performance.now()
      const duration = endTime - startTime
      PerformanceMonitor.trackApiCall(duration, endpoint)
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      PerformanceMonitor.trackApiCall(duration, endpoint)
      PerformanceMonitor.trackError(error as Error, `API:${endpoint}`)
      throw error
    }
  }

  return { trackApiCall }
}

// 内存监控Hook
export function useMemoryMonitor(interval = 5000) {
  let timer: number | null = null

  onMounted(() => {
    timer = setInterval(() => {
      PerformanceMonitor.trackMemoryUsage()
    }, interval)
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  const getMemoryReport = () => {
    return PerformanceMonitor.getReport()
  }

  return { getMemoryReport }
}

// 页面性能监控Hook
export function usePagePerformance() {
  onMounted(() => {
    // 等待页面完全加载
    if (document.readyState === 'complete') {
      PerformanceMonitor.trackPageLoad()
    } else {
      window.addEventListener('load', () => {
        PerformanceMonitor.trackPageLoad()
      })
    }
  })

  const getPerformanceReport = () => {
    return PerformanceMonitor.getReport()
  }

  return { getPerformanceReport }
}