import type { Router } from 'vue-router';

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  preload?: boolean;
  keepAlive?: boolean;
  hideAuth?: boolean;
}

export class PreloadService {
  private router: Router;
  private preloadQueue: Set<string> = new Set();
  private preloadedRoutes: Set<string> = new Set();
  private observer: IntersectionObserver | null = null;

  constructor(router: Router) {
    this.router = router;
    this.initPreloadObserver();
  }

  /**
   * 初始化预加载观察器
   */
  private initPreloadObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const preloadLink = entry.target as HTMLElement;
            const routeName = preloadLink.dataset.route;
            if (routeName) {
              this.preloadRoute(routeName);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    );
  }

  /**
   * 添加预加载链接到观察器
   */
  observePreloadLink(element: HTMLElement, routeName: string) {
    if (this.observer) {
      element.dataset.route = routeName;
      this.observer.observe(element);
    }
  }

  /**
   * 预加载指定路由
   */
  async preloadRoute(routeName: string): Promise<void> {
    // 如果已经预加载或正在预加载，则跳过
    if (this.preloadedRoutes.has(routeName) || this.preloadQueue.has(routeName)) {
      return;
    }

    const route = this.router.resolve({ name: routeName });
    if (!route.matched.length) {
      return;
    }

    // 检查路由是否支持预加载
    const meta = route.matched[0].meta as RouteMeta;
    if (!meta?.preload) {
      return;
    }

    this.preloadQueue.add(routeName);

    try {
      // 模拟用户空闲时预加载
      if ('requestIdleCallback' in window) {
        await new Promise<void>(resolve => {
          window.requestIdleCallback(async () => {
            await this.doPreload(route);
            resolve();
          });
        });
      } else {
        // 回退方案：延迟预加载
        setTimeout(() => this.doPreload(route), 100);
      }
    } catch (error) {
      console.warn(`预加载路由 ${routeName} 失败:`, error);
      this.preloadQueue.delete(routeName);
    }
  }

  /**
   * 执行预加载
   */
  private async doPreload(route: { matched: any[] }): Promise<void> {
    try {
      // 触发动态导入
      const components = route.matched.map(matched => {
        return matched.components?.default || matched.components;
      });

      // 等待所有组件加载完成
      await Promise.all(
        components.filter(Boolean).map(component => {
          if (typeof component === 'function') {
            return component();
          }
          return Promise.resolve(component);
        }),
      );
    } catch (error) {
      console.warn('路由预加载失败:', error);
    }
  }

  /**
   * 预加载所有标记为预加载的路由
   */
  preloadAllRoutes(): void {
    this.router.getRoutes().forEach(route => {
      const meta = route.meta as RouteMeta;
      if (meta?.preload && !this.preloadedRoutes.has(route.name)) {
        this.preloadRoute(route.name).catch(() => {
          // 静默失败，不影响用户体验
        });
      }
    });
  }

  /**
   * 根据用户行为智能预加载
   */
  initSmartPreload(): void {
    // 仅预加载核心路由（首页、详情页、观看页）
    const coreRoutes = ['home', 'media-detail', 'watch', 'recommendations'];

    // 页面加载完成后预加载核心路由
    window.addEventListener('load', () => {
      setTimeout(() => {
        coreRoutes.forEach(routeName => {
          if (this.shouldPreload(routeName)) {
            this.preloadRoute(routeName).catch(() => {
              // 静默失败
            });
          }
        });
      }, 2000); // 延迟时间增加：1秒 → 2秒
    });

    // 鼠标空闲时预加载（降低频率）
    let preloadTimer: NodeJS.Timeout | null = null;
    document.addEventListener('mousemove', () => {
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
      preloadTimer = setTimeout(() => {
        coreRoutes.forEach(routeName => {
          if (this.shouldPreload(routeName)) {
            this.preloadRoute(routeName).catch(() => {
              // 静默失败
            });
          }
        });
      }, 5000); // 增加延迟：2秒 → 5秒
    });

    // 高速网络下的智能预加载
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === '4g' && !connection.saveData) {
        // 仅在4G且未开启数据节省模式时预加载
        setTimeout(() => {
          coreRoutes.forEach(routeName => {
            if (this.shouldPreload(routeName)) {
              this.preloadRoute(routeName).catch(() => {
                // 静默失败
              });
            }
          });
        }, 3000);
      }
    }

    // 触摸设备上的保守预加载
    document.addEventListener(
      'touchstart',
      () => {
        // 仅预加载首页和推荐页
        ['home', 'recommendations'].forEach(routeName => {
          if (this.shouldPreload(routeName)) {
            this.preloadRoute(routeName).catch(() => {
              // 静默失败
            });
          }
        });
      },
      { once: true },
    );
  }

  /**
   * 判断是否应该预加载指定路由
   */
  private shouldPreload(routeName: string): boolean {
    const route = this.router.resolve({ name: routeName });
    if (!route.matched.length) {
      return false;
    }

    const meta = route.matched[0].meta as RouteMeta;
    if (!meta?.preload) {
      return false;
    }

    // 核心路由列表
    const coreRoutes = ['home', 'media-detail', 'watch', 'recommendations'];
    return coreRoutes.includes(routeName);
  }

  /**
   * 获取预加载状态
   */
  getPreloadStatus(): { preloaded: string[]; queued: string[] } {
    return {
      preloaded: Array.from(this.preloadedRoutes),
      queued: Array.from(this.preloadQueue),
    };
  }

  /**
   * 清理预加载观察器
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 创建全局预加载服务实例
let preloadService: PreloadService | null = null;

/**
 * 初始化预加载服务
 */
export function initPreloadService(router: Router): PreloadService {
  if (!preloadService) {
    preloadService = new PreloadService(router);
    preloadService.initSmartPreload();
  }
  return preloadService;
}

/**
 * 获取预加载服务实例
 */
export function getPreloadService(): PreloadService | null {
  return preloadService;
}

/**
 * Vue指令：v-preload
 */
export const vPreload = {
  mounted(el: HTMLElement, binding: { value: string }) {
    const preloadService = getPreloadService();
    if (preloadService && binding.value) {
      preloadService.observePreloadLink(el, binding.value);
    }
  },
  unmounted(el: HTMLElement) {
    const preloadService = getPreloadService();
    if (preloadService) {
      preloadService.observer?.unobserve(el);
    }
  },
};
