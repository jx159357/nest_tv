/**
 * 性能监控和优化服务
 */

// 性能指标类型定义
export interface PerformanceMetrics {
  // 核心Web指标
  fcp: number; // First Contentful Paint (首次内容绘制)
  lcp: number; // Largest Contentful Paint (最大内容绘制)
  fid: number; // First Input Delay (首次输入延迟)
  cls: number; // Cumulative Layout Shift (累积布局偏移)
  ttfb: number; // Time to First Byte (首字节时间)
  
  // 加载性能
  pageLoad: number; // 页面加载时间
  domReady: number; // DOM准备就绪时间
  windowLoad: number; // 窗口加载完成时间
  resourceLoad: number; // 资源加载时间
  
  // 内存使用
  memory: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  
  // 网络信息
  network: {
    downlink: number;
    rtt: number;
    effectiveType: string;
    saveData: boolean;
    online: boolean;
  };
  
  // 设备信息
  device: {
    userAgent: string;
    platform: string;
    cores: number;
    memory: number;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
    };
  };
  
  // 时间戳
  timestamp: number;
  url: string;
}

// 性能配置
export interface PerformanceConfig {
  // 监控配置
  monitor: {
    enabled: boolean;
    interval: number; // 监控间隔（毫秒）
    metrics: string[]; // 要监控的指标
  };
  
  // 报告配置
  reporting: {
    enabled: boolean;
    endpoint?: string;
    batchSize: number;
    flushInterval: number;
  };
  
  // 优化配置
  optimization: {
    lazyLoad: boolean;
    preLoad: boolean;
    cache: boolean;
    compress: boolean;
  };
}

// 性能阈值
export const PERFORMANCE_THRESHOLDS = {
  FCP: 2000, // 2秒
  LCP: 2500, // 2.5秒
  FID: 100, // 100毫秒
  CLS: 0.1, // 0.1
  TTFB: 600, // 600毫秒
  PAGE_LOAD: 3000, // 3秒
  DOM_READY: 1000, // 1秒
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics | null = null;
  private config: PerformanceConfig;
  private observers: PerformanceObserver[] = [];
  private metricBuffer: PerformanceMetrics[] = [];
  
  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      monitor: {
        enabled: true,
        interval: 5000,
        metrics: ['fcp', 'lcp', 'fid', 'cls', 'ttfb'],
      },
      reporting: {
        enabled: false,
        batchSize: 10,
        flushInterval: 60000,
      },
      optimization: {
        lazyLoad: true,
        preLoad: true,
        cache: true,
        compress: true,
      },
      ...config,
    };
    
    this.init();
  }
  
  static getInstance(config?: Partial<PerformanceConfig>): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService(config);
    }
    return PerformanceService.instance;
  }
  
  private init() {
    if (typeof window === 'undefined' || !('performance' in window)) {
      console.warn('Performance API not supported');
      return;
    }
    
    this.setupObservers();
    this.startMonitoring();
    this.setupEventListeners();
    this.initOptimizations();
  }
  
  // 设置性能观察器
  private setupObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }
    
    // 观察LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.updateMetrics({ lcp: lastEntry.startTime });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('Failed to observe LCP:', e);
    }
    
    // 观察CLS
    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        let clsValue = 0;
        entries.forEach(entry => {
          if (entry && (entry as any).hadRecentInput) {
            return;
          }
          clsValue += (entry as any).value || 0;
        });
        this.updateMetrics({ cls: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('Failed to observe CLS:', e);
    }
    
    // 观察FID
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime;
            this.updateMetrics({ fid });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('Failed to observe FID:', e);
    }
    
    // 观察资源加载
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const resourceLoad = entries.reduce((sum, entry) => sum + entry.duration, 0);
        this.updateMetrics({ resourceLoad: resourceLoad });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Failed to observe resources:', e);
    }
  }
  
  // 设置事件监听器
  private setupEventListeners() {
    // 页面加载时间
    window.addEventListener('load', () => {
      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (nav) {
          this.updateMetrics({
            ttfb: nav.responseStart - nav.requestStart,
            pageLoad: nav.loadEventEnd - nav.loadEventStart,
          });
        }
      }, 0);
    });
    
    // DOM准备就绪
    document.addEventListener('DOMContentLoaded', () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        this.updateMetrics({ domReady: nav.domContentLoadedEventStart - nav.startTime });
      }
    });
    
    // 网络状态变化
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.updateNetworkInfo();
      });
    }
    
    // 内存使用
    this.startMemoryMonitoring();
  }
  
  // 开始监控
  private startMonitoring() {
    if (!this.config.monitor.enabled) return;
    
    setInterval(() => {
      this.collectMetrics();
    }, this.config.monitor.interval);
  }
  
  // 收集指标
  private collectMetrics() {
    // 收集FCP
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      this.updateMetrics({ fcp: fcpEntry.startTime });
    }
    
    // 更新网络和设备信息
    this.updateNetworkInfo();
    this.updateDeviceMetrics();
    this.updateMemoryMetrics();
  }
  
  // 更新指标
  private updateMetrics(updates: Partial<PerformanceMetrics>) {
    if (!this.metrics) {
      this.metrics = this.createEmptyMetrics();
    }
    
    const updatedMetrics = { ...this.metrics, ...updates, timestamp: Date.now() };
    this.metrics = updatedMetrics;
    
    // 缓存指标
    this.metricBuffer.push({ ...updatedMetrics });
    
    // 检查阈值
    this.checkThresholds(updatedMetrics);
    
    // 报告指标
    if (this.config.reporting.enabled) {
      this.maybeFlushBuffer();
    }
  }
  
  // 创建空指标
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      pageLoad: 0,
      domReady: 0,
      windowLoad: 0,
      resourceLoad: 0,
      memory: {
        used: 0,
        total: 0,
        limit: 0,
        percentage: 0,
      },
      network: {
        downlink: 0,
        rtt: 0,
        effectiveType: '',
        saveData: false,
        online: navigator.onLine,
      },
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cores: 0,
        memory: 0,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
        },
      },
      timestamp: Date.now(),
      url: window.location.href,
    };
  }
  
  // 更新网络信息
  private updateNetworkInfo() {
    if (!this.metrics || !('connection' in navigator)) return;
    
    const connection = (navigator as any).connection;
    this.metrics.network = {
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      effectiveType: connection.effectiveType || '',
      saveData: connection.saveData || false,
      online: navigator.onLine,
    };
  }
  
  // 更新设备指标
  private updateDeviceMetrics() {
    if (!this.metrics) return;
    
    this.metrics.device.screen = {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    };
  }
  
  // 更新内存指标
  private updateMemoryMetrics() {
    if (!this.metrics || !('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    this.metrics.memory = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  
  // 开始内存监控
  private startMemoryMonitoring() {
    if (!('memory' in performance)) return;
    
    setInterval(() => {
      this.updateMemoryMetrics();
      
      // 内存警告
      if (this.metrics && this.metrics.memory.percentage > 90) {
        console.warn('Memory usage high:', this.metrics.memory.percentage.toFixed(2) + '%');
        this.optimizeMemory();
      }
    }, 10000); // 每10秒检查一次
  }
  
  // 内存优化
  private optimizeMemory() {
    // 清理事件监听器
    if ('clearEventListeners' in window) {
      (window as any).clearEventListeners();
    }
    
    // 触发垃圾回收（如果支持）
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // 清理不必要的数据
    if (this.metricBuffer.length > 50) {
      this.metricBuffer = this.metricBuffer.slice(-20);
    }
  }
  
  // 检查性能阈值
  private checkThresholds(metrics: PerformanceMetrics) {
    const warnings = [];
    
    if (metrics.fcp > PERFORMANCE_THRESHOLDS.FCP) {
      warnings.push(`FCP too high: ${metrics.fcp.toFixed(2)}ms`);
    }
    if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP) {
      warnings.push(`LCP too high: ${metrics.lcp.toFixed(2)}ms`);
    }
    if (metrics.fid > PERFORMANCE_THRESHOLDS.FID) {
      warnings.push(`FID too high: ${metrics.fid.toFixed(2)}ms`);
    }
    if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS) {
      warnings.push(`CLS too high: ${metrics.cls.toFixed(3)}`);
    }
    if (metrics.ttfb > PERFORMANCE_THRESHOLDS.TTFB) {
      warnings.push(`TTFB too high: ${metrics.ttfb.toFixed(2)}ms`);
    }
    
    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings);
      this.reportWarnings(warnings);
    }
  }
  
  // 报告警告
  private reportWarnings(warnings: string[]) {
    if (typeof console.warn === 'function') {
      console.warn('Performance issues detected:', warnings.join(', '));
    }
    
    // 这里可以发送到错误监控服务
    // this.sendToErrorService(warnings);
  }
  
  // 初始化优化
  private initOptimizations() {
    if (this.config.optimization.lazyLoad) {
      this.setupLazyLoading();
    }
    
    if (this.config.optimization.preLoad) {
      this.setupPreloading();
    }
    
    if (this.config.optimization.cache) {
      this.setupCaching();
    }
  }
  
  // 设置懒加载
  private setupLazyLoading() {
    // 为图片和iframe添加懒加载
    const elements = document.querySelectorAll('img[data-src], iframe[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const src = element.getAttribute('data-src');
          if (src) {
            element.setAttribute('src', src);
            element.removeAttribute('data-src');
            imageObserver.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px',
    });
    
    elements.forEach(element => {
      imageObserver.observe(element);
    });
  }
  
  // 设置预加载
  private setupPreloading() {
    // 预加载关键资源
    const links = document.querySelectorAll('link[rel="preload"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !this.isResourceCached(href)) {
        const fetchLink = document.createElement('link');
        fetchLink.rel = 'prefetch';
        fetchLink.href = href;
        document.head.appendChild(fetchLink);
      }
    });
  }
  
  // 设置缓存
  private setupCaching() {
    // 注册Service Worker
    if ('serviceWorker' in navigator && this.config.optimization.cache) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error);
        });
    }
  }
  
  // 检查资源是否已缓存
  private isResourceCached(url: string): boolean {
    if ('caches' in window) {
      return caches.open('performance-cache').then(cache => {
        return cache.match(url);
      }).then(response => {
        return !!response;
      }).catch(() => false);
    }
    return false;
  }
  
  // 刷新缓冲区
  private maybeFlushBuffer() {
    if (this.metricBuffer.length >= this.config.reporting.batchSize) {
      this.flushBuffer();
    }
  }
  
  // 刷新缓冲区
  private flushBuffer() {
    if (this.metricBuffer.length === 0) return;
    
    const metrics = [...this.metricBuffer];
    this.metricBuffer = [];
    
    if (this.config.reporting.enabled && this.config.reporting.endpoint) {
      this.sendMetrics(metrics);
    }
  }
  
  // 发送指标
  private async sendMetrics(metrics: PerformanceMetrics[]) {
    try {
      await fetch(this.config.reporting.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }
  
  // 获取当前指标
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics ? { ...this.metrics } : null;
  }
  
  // 获取性能评分
  getPerformanceScore(): number {
    if (!this.metrics) return 0;
    
    const metrics = this.metrics;
    let score = 100;
    
    // 根据各项指标计算分数
    if (metrics.fcp > PERFORMANCE_THRESHOLDS.FCP) {
      score -= (metrics.fcp - PERFORMANCE_THRESHOLDS.FCP) / PERFORMANCE_THRESHOLDS.FCP * 10;
    }
    if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP) {
      score -= (metrics.lcp - PERFORMANCE_THRESHOLDS.LCP) / PERFORMANCE_THRESHOLDS.LCP * 15;
    }
    if (metrics.fid > PERFORMANCE_THRESHOLDS.FID) {
      score -= (metrics.fid - PERFORMANCE_THRESHOLDS.FID) / PERFORMANCE_THRESHOLDS.FID * 20;
    }
    if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS) {
      score -= (metrics.cls - PERFORMANCE_THRESHOLDS.CLS) / PERFORMANCE_THRESHOLDS.CLS * 25;
    }
    if (metrics.ttfb > PERFORMANCE_THRESHOLDS.TTFB) {
      score -= (metrics.ttfb - PERFORMANCE_THRESHOLDS.TTFB) / PERFORMANCE_THRESHOLDS.TTFB * 10;
    }
    
    return Math.max(0, Math.round(score));
  }
  
  // 销毁
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = null;
    this.metricBuffer = [];
    PerformanceService.instance = null as any;
  }
}