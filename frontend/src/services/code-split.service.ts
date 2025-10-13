/**
 * 代码分割和懒加载服务
 */

// 路由定义类型
export interface RouteDefinition {
  path: string;
  name?: string;
  component?: () => Promise<any>;
  children?: RouteDefinition[];
  meta?: Record<string, any>;
}

// 模块加载策略
export interface LoadingStrategy {
  strategy: 'eager' | 'lazy' | 'preload' | 'prefetch';
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
  retryCount?: number;
  fallback?: () => Promise<any>;
}

// 模块信息
export interface ModuleInfo {
  name: string;
  path: string;
  size?: number;
  dependencies?: string[];
  strategy: LoadingStrategy;
  loaded: boolean;
  loading: boolean;
  error?: string;
  loadTime?: number;
}

// 预加载配置
export interface PreloadConfig {
  enabled: boolean;
  strategy: 'onLoad' | 'onIdle' | 'onInteraction' | 'network';
  concurrency: number;
  timeout: number;
  retryCount: number;
}

export class CodeSplitService {
  private static instance: CodeSplitService;
  private modules: Map<string, ModuleInfo> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private preloadQueue: string[] = [];
  private config: PreloadConfig;
  private observers: IntersectionObserver[] = [];

  constructor(config: Partial<PreloadConfig> = {}) {
    this.config = {
      enabled: true,
      strategy: 'onIdle',
      concurrency: 3,
      timeout: 10000,
      retryCount: 3,
      ...config,
    };

    this.init();
  }

  static getInstance(config?: Partial<PreloadConfig>): CodeSplitService {
    if (!CodeSplitService.instance) {
      CodeSplitService.instance = new CodeSplitService(config);
    }
    return CodeSplitService.instance;
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.setupIntersectionObserver();
    this.setupNetworkListener();
    this.startPreloading();
  }

  // 注册模块
  registerModule(name: string, loader: () => Promise<any>, strategy: LoadingStrategy) {
    const moduleInfo: ModuleInfo = {
      name,
      path: name,
      strategy,
      loaded: false,
      loading: false,
    };

    this.modules.set(name, moduleInfo);

    // 根据策略立即加载
    if (strategy.strategy === 'eager') {
      this.loadModule(name);
    } else if (strategy.strategy === 'preload') {
      this.addToPreloadQueue(name);
    }
  }

  // 加载模块
  async loadModule(name: string): Promise<any> {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module ${name} not found`);
    }

    // 如果已经加载，直接返回
    if (module.loaded) {
      return this.getLoadedModule(name);
    }

    // 如果正在加载，返回现有Promise
    if (this.loadingQueue.has(name)) {
      return this.loadingQueue.get(name);
    }

    // 开始加载
    module.loading = true;
    const startTime = Date.now();

    const loadPromise = this.loadWithRetry(name)
      .then(result => {
        module.loaded = true;
        module.loading = false;
        module.loadTime = Date.now() - startTime;
        module.error = undefined;

        // 记录性能指标
        this.recordLoadMetrics(module);

        // 清理队列
        this.loadingQueue.delete(name);

        return result;
      })
      .catch(error => {
        module.loading = false;
        module.error = error.message;

        // 清理队列
        this.loadingQueue.delete(name);

        // 尝试使用fallback
        if (module.strategy.fallback) {
          return module.strategy.fallback();
        }

        throw error;
      });

    this.loadingQueue.set(name, loadPromise);
    return loadPromise;
  }

  // 带重试的加载
  private async loadWithRetry(name: string, retryCount = 0): Promise<any> {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module ${name} not found`);
    }

    try {
      // 模拟动态导入
      const startTime = Date.now();
      const result = await Promise.race([
        this.simulateDynamicImport(name),
        this.createTimeout(module.strategy.timeout || this.config.timeout),
      ]);

      const loadTime = Date.now() - startTime;
      console.log(`Module ${name} loaded in ${loadTime}ms`);

      return result;
    } catch (error) {
      if (retryCount < (module.strategy.retryCount || this.config.retryCount)) {
        console.warn(`Retrying module ${name}, attempt ${retryCount + 1}`);
        return this.loadWithRetry(name, retryCount + 1);
      }
      throw error;
    }
  }

  // 模拟动态导入
  private async simulateDynamicImport(name: string): Promise<any> {
    // 这里应该是实际的动态导入逻辑
    // 由于我们是在创建服务，这里返回一个模拟的Promise

    // 实际使用时，这里应该是：
    // return import(`@/views/${name}.vue`)

    // 为了演示，我们返回一个模拟的模块
    return new Promise(resolve => {
      setTimeout(
        () => {
          resolve({
            default: () => `Module ${name} component`,
            name,
          });
        },
        Math.random() * 500 + 100,
      ); // 模拟网络延迟
    });
  }

  // 创建超时
  private createTimeout(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Module load timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  // 获取已加载的模块
  private getLoadedModule(name: string): Promise<any> {
    // 这里应该从已加载的模块缓存中获取
    // 由于是演示，我们重新模拟加载
    return this.simulateDynamicImport(name);
  }

  // 添加到预加载队列
  private addToPreloadQueue(name: string) {
    if (!this.preloadQueue.includes(name)) {
      this.preloadQueue.push(name);
    }
  }

  // 开始预加载
  private startPreloading() {
    if (!this.config.enabled) return;

    switch (this.config.strategy) {
      case 'onLoad':
        this.preloadOnLoad();
        break;
      case 'onIdle':
        this.preloadOnIdle();
        break;
      case 'onInteraction':
        this.preloadOnInteraction();
        break;
      case 'network':
        this.preloadOnNetwork();
        break;
    }
  }

  // 页面加载时预加载
  private preloadOnLoad() {
    setTimeout(() => {
      this.processPreloadQueue();
    }, 1000);
  }

  // 空闲时预加载
  private preloadOnIdle() {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        () => {
          this.processPreloadQueue();
        },
        { timeout: 2000 },
      );
    } else {
      setTimeout(() => {
        this.processPreloadQueue();
      }, 2000);
    }
  }

  // 交互时预加载
  private preloadOnInteraction() {
    const events = ['mousemove', 'touchstart', 'keydown', 'click'];
    let triggered = false;

    const handler = () => {
      if (triggered) return;
      triggered = true;
      this.processPreloadQueue();
      events.forEach(event => {
        window.removeEventListener(event, handler);
      });
    };

    events.forEach(event => {
      window.addEventListener(event, handler, { once: true });
    });
  }

  // 网络空闲时预加载
  private preloadOnNetwork() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === '4g' && !connection.saveData) {
        this.processPreloadQueue();
      } else {
        connection.addEventListener('change', () => {
          if (connection.effectiveType === '4g' && !connection.saveData) {
            this.processPreloadQueue();
          }
        });
      }
    } else {
      // 如果不支持Network Information API，使用默认策略
      this.preloadOnIdle();
    }
  }

  // 处理预加载队列
  private async processPreloadQueue() {
    const queue = [...this.preloadQueue];
    this.preloadQueue = [];

    // 按优先级排序
    queue.sort((a, b) => {
      const moduleA = this.modules.get(a);
      const moduleB = this.modules.get(b);
      if (!moduleA || !moduleB) return 0;

      const priorityA =
        moduleA.strategy.priority === 'high' ? 3 : moduleA.strategy.priority === 'medium' ? 2 : 1;
      const priorityB =
        moduleB.strategy.priority === 'high' ? 3 : moduleB.strategy.priority === 'medium' ? 2 : 1;

      return priorityB - priorityA;
    });

    // 并发加载
    const concurrency = this.config.concurrency;
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(name =>
          this.loadModule(name).catch(error => {
            console.warn(`Failed to preload module ${name}:`, error);
          }),
        ),
      );

      // 批次间隔
      if (i + concurrency < queue.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // 设置交叉观察器
  private setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const moduleName = element.dataset.module;
            if (moduleName) {
              this.addToPreloadQueue(moduleName);
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      },
    );

    this.observers.push(observer);
  }

  // 设置网络监听器
  private setupNetworkListener() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        // 网络条件变化时，调整预加载策略
        if (connection.saveData) {
          // 数据节省模式，停止预加载
          this.preloadQueue = [];
        } else if (connection.effectiveType === '4g') {
          // 高速网络，增加并发
          this.config.concurrency = Math.min(6, this.config.concurrency + 1);
        } else {
          // 低速网络，减少并发
          this.config.concurrency = Math.max(1, this.config.concurrency - 1);
        }
      });
    }
  }

  // 记录加载指标
  private recordLoadMetrics(module: ModuleInfo) {
    if (!module.loadTime) return;

    const metrics = {
      name: module.name,
      loadTime: module.loadTime,
      strategy: module.strategy.strategy,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    // 发送到分析服务
    if (typeof console === 'object' && console.log) {
      console.log('Module load metrics:', metrics);
    }

    // 这里可以发送到实际的分析服务
    // this.sendToAnalytics(metrics);
  }

  // 获取模块状态
  getModuleStatus(name: string): ModuleInfo | undefined {
    return this.modules.get(name);
  }

  // 获取所有模块状态
  getAllModuleStatus(): ModuleInfo[] {
    return Array.from(this.modules.values());
  }

  // 手动触发预加载
  async preloadModules(names: string[]): Promise<void> {
    const uniqueNames = [...new Set(names)];
    this.preloadQueue.push(...uniqueNames);
    await this.processPreloadQueue();
  }

  // 取消预加载
  cancelPreload(name: string) {
    const index = this.preloadQueue.indexOf(name);
    if (index > -1) {
      this.preloadQueue.splice(index, 1);
    }
  }

  // 检查模块是否已加载
  isModuleLoaded(name: string): boolean {
    const module = this.modules.get(name);
    return module?.loaded || false;
  }

  // 获取加载统计
  getLoadStats() {
    const modules = Array.from(this.modules.values());
    const loadedCount = modules.filter(m => m.loaded).length;
    const loadingCount = modules.filter(m => m.loading).length;
    const errorCount = modules.filter(m => m.error).length;
    const totalLoadTime = modules
      .filter(m => m.loadTime)
      .reduce((sum, m) => sum + (m.loadTime || 0), 0);
    const avgLoadTime = loadedCount > 0 ? totalLoadTime / loadedCount : 0;

    return {
      total: modules.length,
      loaded: loadedCount,
      loading: loadingCount,
      errors: errorCount,
      avgLoadTime: Math.round(avgLoadTime),
    };
  }

  // 创建路由定义的助手方法
  createRoute(
    path: string,
    name: string,
    component: () => Promise<any>,
    strategy: LoadingStrategy = { strategy: 'lazy', priority: 'medium' },
  ): RouteDefinition {
    // 注册模块
    this.registerModule(name, component, strategy);

    return {
      path,
      name,
      component,
      meta: {
        preload: strategy.strategy === 'preload',
        eager: strategy.strategy === 'eager',
      },
    };
  }

  // 创建嵌套路由的助手方法
  createNestedRoute(
    path: string,
    name: string,
    component: () => Promise<any>,
    children: RouteDefinition[],
    strategy: LoadingStrategy = { strategy: 'lazy', priority: 'medium' },
  ): RouteDefinition {
    this.registerModule(name, component, strategy);

    return {
      path,
      name,
      component,
      children,
      meta: {
        preload: strategy.strategy === 'preload',
        eager: strategy.strategy === 'eager',
      },
    };
  }

  // 销毁
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.modules.clear();
    this.loadingQueue.clear();
    this.preloadQueue = [];
    CodeSplitService.instance = null as any;
  }
}

// 创建单例实例
export const codeSplitService = CodeSplitService.getInstance();

// 导出助手函数
export function createLazyRoute(
  path: string,
  name: string,
  component: () => Promise<any>,
  strategy: LoadingStrategy = { strategy: 'lazy', priority: 'medium' },
): RouteDefinition {
  return codeSplitService.createRoute(path, name, component, strategy);
}

export function createLazyNestedRoute(
  path: string,
  name: string,
  component: () => Promise<any>,
  children: RouteDefinition[],
  strategy: LoadingStrategy = { strategy: 'lazy', priority: 'medium' },
): RouteDefinition {
  return codeSplitService.createNestedRoute(path, name, component, children, strategy);
}

export function preloadModules(names: string[]): Promise<void> {
  return codeSplitService.preloadModules(names);
}

export function getModuleStatus(name: string): ModuleInfo | undefined {
  return codeSplitService.getModuleStatus(name);
}
