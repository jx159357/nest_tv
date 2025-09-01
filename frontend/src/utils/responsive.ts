// 响应式工具函数
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

// 检查是否为移动端
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= breakpoints.md
}

// 检查是否为平板
export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth > breakpoints.md && window.innerWidth <= breakpoints.lg
}

// 检查是否为桌面端
export const isDesktop = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth > breakpoints.lg
}

// 获取当前设备类型
export const getDeviceType = () => {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

// 监听窗口大小变化
export const onResize = (callback: () => void) => {
  if (typeof window === 'undefined') return
  
  let timeoutId: NodeJS.Timeout
  const handleResize = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, 100)
  }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}