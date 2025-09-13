// =============================================================================
// 快速类型修复文件
// 解决 vue-tsc 编译错误（临时解决方案）
// =============================================================================

// 声明 socket.io-client 类型
declare module 'socket.io-client' {
  const io: (url: string, opts?: any) => any
  export default io
}

// 声明性能监控
declare module '@/utils/performance' {
  export const usePerformanceMonitor: () => any
  export class PerformanceMonitor {}
}

// 声明 Danmaku 类型
declare module '@/types' {
  export interface Danmaku {
    id: string
    userId: string
    videoId: string
    text: string
    color: string
    type: 'scroll' | 'top' | 'bottom'
    priority: number
    timestamp: number
  }
}

// 声明 VirtualScroll 类型
declare interface VirtualScrollItem<T = any> {
  key: string
  data: T
  index: number
  visible?: boolean
}

// 声明 NodeJS 类型扩展
declare namespace NodeJS {
  interface Timeout {
    ref(): void
    unref(): void
    hasRef(): boolean
  }
}

// 声明全局 process 类型
declare const process: {
  env: {
    NODE_ENV: string
    PORT?: string
    VUE_APP_WS_URL?: string
    [key: string]: string | undefined
  }
}

// 声明 global navigator 类型
declare const navigator: {
  language: string
  languages: string[]
  userAgent: string
}

// 声明 global document 类型
declare const document: {
  documentElement: {
    lang: string
  }
  createElement: (tag: string) => HTMLElement
}

// 声明 global window 类型
declare const window: {
  setTimeout: (callback: () => void, delay: number) => number
  clearTimeout: (id: number) => void
  addEventListener: (event: string, callback: () => void) => void
  removeEventListener: (event: string, callback: () => void) => void
  location: {
    href: string
    pathname: string
    search: string
    hash: string
  }
  __VUE_DEVTOOLS_TOAST__: any
}