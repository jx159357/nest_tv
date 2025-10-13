// 移动端优化功能
export const mobileOptimizations = {
  // 设备检测
  deviceInfo: {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isTablet: /iPad|Android/.test(navigator.userAgent) && window.innerWidth > 768,
    isLandscape: window.innerWidth > window.innerHeight,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    supportsVibration: 'vibrate' in navigator,
    supportsDeviceOrientation: 'DeviceOrientationEvent' in window,
    supportsDeviceMotion: 'DeviceMotionEvent' in window,
  },

  // 屏幕信息
  screenInfo: {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    safeArea: this.getSafeAreaInsets(),
  },

  // 获取安全区域
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    };
  },

  // 手势识别器
  gestureRecognizer: {
    startPoint: { x: 0, y: 0 },
    lastPoint: { x: 0, y: 0 },
    startTime: 0,
    tapCount: 0,
    lastTapTime: 0,
    isLongPress: false,
    isSwipe: false,
    isPinch: false,
    pinchDistance: 0,
    longPressTimer: null as number | null,

    // 重置状态
    reset() {
      this.startPoint = { x: 0, y: 0 };
      this.lastPoint = { x: 0, y: 0 };
      this.startTime = 0;
      this.isLongPress = false;
      this.isSwipe = false;
      this.isPinch = false;
      this.pinchDistance = 0;

      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },

    // 识别轻触
    recognizeTap(touch: Touch) {
      const now = Date.now();
      const timeSinceLastTap = now - this.lastTapTime;

      if (timeSinceLastTap < 300 && timeSinceLastTap > 50) {
        this.tapCount++;
        if (this.tapCount === 2) {
          return { type: 'doubleTap', touch };
        }
      } else {
        this.tapCount = 1;
      }

      this.lastTapTime = now;
      return { type: 'tap', touch };
    },

    // 识别长按
    recognizeLongPress(touch: Touch): Promise<{ type: 'longPress'; touch: Touch }> {
      return new Promise(resolve => {
        this.longPressTimer = window.setTimeout(() => {
          this.isLongPress = true;
          resolve({ type: 'longPress', touch });
        }, 500);
      });
    },

    // 识别滑动
    recognizeSwipe(startTouch: Touch, endTouch: Touch) {
      const deltaX = endTouch.clientX - startTouch.clientX;
      const deltaY = endTouch.clientY - startTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const deltaTime = Date.now() - this.startTime;

      // 最小距离和最大时间限制
      if (distance > 30 && deltaTime < 500) {
        let direction: 'up' | 'down' | 'left' | 'right';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        return {
          type: 'swipe',
          direction,
          distance,
          velocity: distance / deltaTime,
          startTouch,
          endTouch,
        };
      }

      return null;
    },

    // 识别缩放
    recognizePinch(touches: Touch[]) {
      if (touches.length < 2) return null;

      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.pinchDistance > 0) {
        const scale = distance / this.pinchDistance;
        return {
          type: 'pinch',
          scale,
          center: {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2,
          },
        };
      }

      this.pinchDistance = distance;
      return null;
    },
  },

  // 触摸事件处理
  addTouchHandlers(
    element: HTMLElement,
    handlers: {
      onTouchStart?: (e: TouchEvent) => void;
      onTouchMove?: (e: TouchEvent) => void;
      onTouchEnd?: (e: TouchEvent) => void;
      onGesture?: (gesture: any) => void;
    },
  ) {
    let gestureTimer: number | null = null;

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      this.gestureRecognizer.reset();
      this.gestureRecognizer.startPoint = { x: touch.clientX, y: touch.clientY };
      this.gestureRecognizer.lastPoint = { x: touch.clientX, y: touch.clientY };
      this.gestureRecognizer.startTime = Date.now();

      // 启动长按检测
      if (e.touches.length === 1 && handlers.onGesture) {
        this.gestureRecognizer
          .recognizeLongPress(touch)
          .then(gesture => handlers.onGesture!(gesture))
          .catch(() => {}); // 忽略取消的长按
      }

      if (handlers.onTouchStart) {
        handlers.onTouchStart(e);
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.gestureRecognizer.lastPoint = { x: touch.clientX, y: touch.clientY };

        // 取消长按
        if (this.gestureRecognizer.longPressTimer) {
          clearTimeout(this.gestureRecognizer.longPressTimer);
          this.gestureRecognizer.longPressTimer = null;
        }

        // 检测缩放
        if (e.touches.length === 2 && handlers.onGesture) {
          const pinchGesture = this.gestureRecognizer.recognizePinch(Array.from(e.touches));
          if (pinchGesture) {
            handlers.onGesture(pinchGesture);
          }
        }
      }

      if (handlers.onTouchMove) {
        handlers.onTouchMove(e);
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (this.gestureRecognizer.longPressTimer) {
        clearTimeout(this.gestureRecognizer.longPressTimer);
        this.gestureRecognizer.longPressTimer = null;
      }

      if (e.changedTouches.length > 0 && handlers.onGesture) {
        const touch = e.changedTouches[0];
        const duration = Date.now() - this.gestureRecognizer.startTime;

        // 检测轻触
        if (
          duration < 200 &&
          !this.gestureRecognizer.isSwipe &&
          !this.gestureRecognizer.isLongPress
        ) {
          const tapGesture = this.gestureRecognizer.recognizeTap(touch);
          if (tapGesture) {
            handlers.onGesture(tapGesture);
          }
        }

        // 检测滑动
        if (!this.gestureRecognizer.isLongPress) {
          const swipeGesture = this.gestureRecognizer.recognizeSwipe(
            this.gestureRecognizer.startPoint as Touch,
            touch,
          );
          if (swipeGesture) {
            handlers.onGesture(swipeGesture);
          }
        }
      }

      if (handlers.onTouchEnd) {
        handlers.onTouchEnd(e);
      }

      // 延迟重置手势状态
      if (gestureTimer) {
        clearTimeout(gestureTimer);
      }
      gestureTimer = window.setTimeout(() => {
        this.gestureRecognizer.reset();
      }, 300);
    };

    element.addEventListener('touchstart', handleStart, { passive: false });
    element.addEventListener('touchmove', handleMove, { passive: false });
    element.addEventListener('touchend', handleEnd, { passive: false });

    // 返回清理函数
    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
      if (gestureTimer) {
        clearTimeout(gestureTimer);
      }
    };
  },

  // 移除触摸事件处理
  removeTouchHandlers(
    element: HTMLElement,
    handlers: {
      onTouchStart?: (e: TouchEvent) => void;
      onTouchMove?: (e: TouchEvent) => void;
      onTouchEnd?: (e: TouchEvent) => void;
    },
  ) {
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
    return this.deviceInfo.isMobile;
  },

  // 优化触摸目标大小
  optimizeTouchTargets() {
    const targets = document.querySelectorAll(
      '.video-player__control-button, .clickable, [role="button"]',
    );
    targets.forEach(target => {
      const element = target as HTMLElement;
      const rect = element.getBoundingClientRect();

      // 确保最小触摸目标44x44px
      if (rect.width < 44 || rect.height < 44) {
        const newWidth = Math.max(44, rect.width);
        const newHeight = Math.max(44, rect.height);

        element.style.minWidth = `${newWidth}px`;
        element.style.minHeight = `${newHeight}px`;
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
      }
    });
  },

  // 适配安全区域
  adaptSafeArea() {
    const safeArea = this.screenInfo.safeArea;

    // 添加CSS变量
    document.documentElement.style.setProperty('--safe-area-inset-top', `${safeArea.top}px`);
    document.documentElement.style.setProperty('--safe-area-inset-right', `${safeArea.right}px`);
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeArea.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-inset-left', `${safeArea.left}px`);

    // 自动调整元素边距
    const elements = document.querySelectorAll('.safe-area-top, .safe-area-bottom');
    elements.forEach(element => {
      const el = element as HTMLElement;
      if (el.classList.contains('safe-area-top')) {
        el.style.paddingTop = `${safeArea.top}px`;
      }
      if (el.classList.contains('safe-area-bottom')) {
        el.style.paddingBottom = `${safeArea.bottom}px`;
      }
    });
  },

  // 防抖动
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: number | null = null;

    return ((...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = window.setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait) as unknown as number;
    }) as T;
  },

  // 节流
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean = false;

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    }) as T;
  },

  // 检测设备性能
  detectPerformance() {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      connection: connection
        ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          }
        : null,
      pixelRatio: window.devicePixelRatio || 1,
    };
  },

  // 自适应优化
  applyAdaptiveOptimizations() {
    const performance = this.detectPerformance();
    const isLowEnd = performance.deviceMemory < 4 || performance.hardwareConcurrency < 4;

    if (isLowEnd) {
      // 低端设备优化
      document.body.classList.add('low-performance');

      // 减少动画
      const style = document.createElement('style');
      style.textContent = `
        .low-performance *,
        .low-performance *::before,
        .low-performance *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (performance.connection) {
      const isSlowConnection =
        performance.connection.effectiveType === 'slow-2g' ||
        performance.connection.effectiveType === '2g' ||
        performance.connection.downlink < 0.5;

      if (isSlowConnection) {
        document.body.classList.add('slow-connection');
      }
    }
  },
};
