// =============================================================================
// Vue 类型声明文件
// 解决 vue-tsc 编译错误
// =============================================================================

// 扩展 Vue 组件类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 *.vue 文件的导入类型
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展图片资源类型
declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

// 扩展视频资源类型
declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.webm' {
  const src: string
  export default src
}

declare module '*.ogg' {
  const src: string
  export default src
}

// 扩展其他资源类型
declare module '*.json' {
  const value: any
  export default value
}

declare module '*.md' {
  const content: string
  export default content
}

// 全局变量类型声明
declare interface Window {
  __VUE_DEVTOOLS_TOAST__: any
}

// NodeJS 类型补充（如果需要）
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    PORT?: string
    DB_HOST?: string
    DB_PORT?: string
    DB_USERNAME?: string
    DB_PASSWORD?: string
    DB_DATABASE?: string
    REDIS_HOST?: string
    REDIS_PORT?: string
    REDIS_PASSWORD?: string
    JWT_SECRET?: string
    JWT_EXPIRES_IN?: string
    VITE_API_BASE_URL?: string
    VITE_WS_URL?: string
    VITE_APP_TITLE?: string
    VITE_APP_ENV?: string
    VITE_THEME?: string
    VITE_LANGUAGE?: string
  }
}