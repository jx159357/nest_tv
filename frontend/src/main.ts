import { createApp } from 'vue';
import './styles/design-system.css';
import './style.css';
import 'virtual:uno.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n, initializeI18nLocale } from './i18n';
import { useAuthStore } from './stores/auth';
import { initPreloadService } from './utils/preload-service';
import { PerformanceService } from './services/performance.service';
import { log } from './utils/logger';
import { getAppVersion } from './utils/version';
import { initializeTheme } from './composables/useTheme';

initializeTheme();

// 注册Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      log.info('SW', 'Service Worker registered:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              log.info('SW', 'New version activated');
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'CACHE_CLEARED') {
          log.info('SW', 'Cache cleared at:', new Date(event.data.timestamp));
        }
      });

      if (registration.active) {
        registration.active.postMessage({
          type: 'SET_VERSION',
          version: getAppVersion(),
        });
        registration.active.postMessage({
          type: 'PRECACHE',
          urls: ['/', '/media', '/watch', '/recommendations'],
        });
      }
    } catch (error) {
      log.error('SW', 'Service Worker registration failed:', error);
    }
  }
};

const bootstrap = async () => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  const authStore = useAuthStore(pinia);
  await authStore.initAuth();

  await initializeI18nLocale();

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
      cache: false,
      compress: true,
    },
  });

  if (import.meta.env.DEV) {
    setInterval(() => {
      const metrics = performanceService.getCurrentMetrics();
      if (metrics) {
        const score = performanceService.getPerformanceScore();
        log.performance('Performance', `Score: ${score}/100`, 0);
      }
    }, 30000);
  }

  app.config.errorHandler = err => {
    log.error('Vue', 'Unhandled error:', err);
  };

  app.config.warnHandler = (msg, vm, trace) => {
    void vm;
    log.warn('Vue', msg);
    log.debug('Vue', 'Trace:', trace);
  };

  app.mount('#app');

  // 注册Service Worker
  await registerServiceWorker();
};

void bootstrap();
