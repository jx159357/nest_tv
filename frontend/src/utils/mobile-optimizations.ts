// 移动端优化功能
export const mobileOptimizations = {
  // 添加触摸事件处理
  addTouchHandlers(element: HTMLElement, handlers: {
    onTouchStart?: (e: TouchEvent) => void,
    onTouchMove?: (e: TouchEvent) => void,
    onTouchEnd?: (e: TouchEvent) => void
  }) {
    if (handlers.onTouchStart) {
      element.addEventListener('touchstart', handlers.onTouchStart, { passive: false });
    }
    if (handlers.onTouchMove) {
      element.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
    }
    if (handlers.onTouchEnd) {
      element.addEventListener('touchend', handlers.onTouchEnd, { passive: false });
    }
  },
  
  // 移除触摸事件处理
  removeTouchHandlers(element: HTMLElement, handlers: {
    onTouchStart?: (e: TouchEvent) => void,
    onTouchMove?: (e: TouchEvent) => void,
    onTouchEnd?: (e: TouchEvent) => void
  }) {
    if (handlers.onTouchStart) {
      element.removeEventListener('touchstart', handlers.onTouchStart);
    }
    if (handlers.onTouchMove) {
      element.removeEventListener('touchmove', handlers.onTouchMove);
    }
    if (handlers.onTouchEnd) {
      element.removeEventListener('touchend', handlers.onTouchEnd);
    }
  },
  
  // 检测是否为移动设备
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // 优化触摸目标大小
  optimizeTouchTargets() {
    const buttons = document.querySelectorAll('.video-player__control-button');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        button.setAttribute('style', 'min-width: 44px; min-height: 44px;');
      }
    });
  }
};