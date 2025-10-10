import { createApp } from 'vue';
import './style.css';
import 'virtual:uno.css'; // 导入UnoCSS虚拟模块
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initPreloadService } from './utils/preload-service';
import { PerformanceService } from './services/performance.service';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 初始化预加载服务
initPreloadService(router);

// 初始化性能监控服务
const performanceService = PerformanceService.getInstance({
  monitor: {
    enabled: import.meta.env.PROD, // 仅生产环境启用监控
    interval: 30000, // 减少监控频率：5秒 → 30秒
    metrics: ['lcp', 'cls'], // 仅监控核心指标
  },
  reporting: {
    enabled: import.meta.env.PROD, // 仅生产环境上报
    batchSize: 10,
    flushInterval: 60000, // 增加上报间隔
  },
  optimization: {
    lazyLoad: true,
    preLoad: true,
    cache: true,
    compress: true,
  },
});

// 在开发环境下打印性能分数（降低频率）
if (import.meta.env.DEV) {
  setInterval(() => {
    const metrics = performanceService.getCurrentMetrics();
    if (metrics) {
      const score = performanceService.getPerformanceScore();
      console.log(`🚀 Performance Score: ${score}/100`, metrics);
    }
  }, 30000); // 减少打印频率：10秒 → 30秒
}

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('❌ Vue Error:', err);
  // 可以在这里添加错误上报逻辑
};

app.config.warnHandler = (msg, vm, trace) => {
  console.warn('⚠️ Vue Warning:', msg);
  console.warn('Trace:', trace);
};

app.mount('#app');
