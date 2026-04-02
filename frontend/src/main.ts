import { createApp } from 'vue';
import './style.css';
import 'virtual:uno.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
import { useAuthStore } from './stores/auth';
import { initPreloadService } from './utils/preload-service';
import { PerformanceService } from './services/performance.service';

const bootstrap = async () => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  const authStore = useAuthStore(pinia);
  if (authStore.token && !authStore.user) {
    await authStore.fetchUserProfile();
  }

  app.use(i18n);
  app.use(router);

  initPreloadService(router);

  const performanceService = PerformanceService.getInstance({
    monitor: {
      enabled: import.meta.env.PROD,
      interval: 30000,
      metrics: ['lcp', 'cls'],
    },
    reporting: {
      enabled: import.meta.env.PROD,
      batchSize: 10,
      flushInterval: 60000,
    },
    optimization: {
      lazyLoad: true,
      preLoad: true,
      cache: true,
      compress: true,
    },
  });

  if (import.meta.env.DEV) {
    setInterval(() => {
      const metrics = performanceService.getCurrentMetrics();
      if (metrics) {
        const score = performanceService.getPerformanceScore();
        console.log(`[Performance] Score: ${score}/100`, metrics);
      }
    }, 30000);
  }

  app.config.errorHandler = err => {
    console.error('[Vue Error]', err);
  };

  app.config.warnHandler = (msg, vm, trace) => {
    void vm;
    console.warn('[Vue Warning]', msg);
    console.warn('Trace:', trace);
  };

  app.mount('#app');
};

void bootstrap();
