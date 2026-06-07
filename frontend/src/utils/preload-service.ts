import type { RouteLocationResolved, Router } from 'vue-router';
import { log } from '@/utils/logger';

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
  private preloadTimer: ReturnType<typeof setTimeout> | null = null;

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

  unobservePreloadLink(element: HTMLElement) {
    this.observer?.unobserve(element);
    delete element.dataset.route;
  }

  /**
   * 预加载指定路由
   */
  async preloadRoute(routeName: string): Promise<void> {
    // 如果已经预加载或正在预加载，则跳过
    if (this.preloadedRoutes.has(routeName) || this.preloadQueue.has(routeName)) {
      return;
    }

    let route: RouteLocationResolved;
    try {
      route = this.router.resolve({ name: routeName });
    } catch {
      return;
    }

    if (!route.matched.length) {
      return;
    }

    // 检查路由是否支持预加载
    const meta = route.meta as RouteMeta;
    if (!meta?.preload) {
      return;
    }

    this.preloadQueue.add(routeName);

    try {
      await this.schedulePreload(route);
      this.preloadedRoutes.add(routeName);
    } catch (error) {
      log.warn('PreloadService', `预加载路由 ${routeName} 失败:`, error);
    } finally {
      this.preloadQueue.delete(routeName);
    }
  }

  private async schedulePreload(route: RouteLocationResolved): Promise<void> {
    if ('requestIdleCallback' in window) {
      await new Promise<void>((resolve, reject) => {
        window.requestIdleCallback(
          () => {
            this.doPreload(route).then(resolve, reject);
          },
          { timeout: 3000 },
        );
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        this.doPreload(route).then(resolve, reject);
      }, 100);
    });
  }

  /**
   * 执行预加载
   */
  private async doPreload(route: RouteLocationResolved): Promise<void> {
    const components = route.matched.flatMap(matched => {
      return matched.components ? Object.values(matched.components) : [];
    });

    await Promise.all(
      components.map(component => {
        if (typeof component === 'function') {
          const loadComponent = component as () => Promise<unknown> | unknown;
          return loadComponent();
        }
        return Promise.resolve(component);
      }),
    );
  }

  /**
   * 预加载所有标记为预加载的路由
   */
  preloadAllRoutes(): void {
    this.router.getRoutes().forEach(route => {
      const meta = route.meta as RouteMeta;
      const routeName = route.name ? String(route.name) : '';
      if (meta?.preload && routeName && !this.preloadedRoutes.has(routeName)) {
        if (this.shouldPreload(routeName)) {
          this.preloadRoute(routeName).catch(() => {});
        }
      }
    });
  }

  /**
   * 根据用户行为智能预加载
   */
  initSmartPreload(): void {
    // 仅预加载无需动态参数的高频公开路由
    const coreRoutes = ['recommendations', 'categories'];

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
    document.addEventListener('mousemove', () => {
      if (this.preloadTimer) {
        clearTimeout(this.preloadTimer);
      }
      this.preloadTimer = setTimeout(() => {
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
        // 触摸设备只预加载最轻的推荐页
        ['recommendations'].forEach(routeName => {
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
    const coreRoutes = ['recommendations', 'categories'];
    if (!coreRoutes.includes(routeName)) {
      return false;
    }

    try {
      const route = this.router.resolve({ name: routeName });
      if (!route.matched.length) {
        return false;
      }
      const meta = route.meta as RouteMeta;
      return !!meta?.preload;
    } catch {
      return false;
    }
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

    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
      this.preloadTimer = null;
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
      preloadService.unobservePreloadLink(el);
    }
  },
};
