/**
 * Service Worker for Nest TV
 * 实现智能缓存策略，提升性能和离线体验
 */

let CACHE_VERSION = 'v1';
let CACHE_NAME = `nest-tv-${CACHE_VERSION}`;
let STATIC_CACHE = `nest-tv-static-${CACHE_VERSION}`;
let DYNAMIC_CACHE = `nest-tv-dynamic-${CACHE_VERSION}`;
let API_CACHE = `nest-tv-api-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// API缓存策略配置
const API_CACHE_CONFIG = {
  // 长缓存（1天）
  long: [
    '/api/media/categories',
    '/api/media/genres',
  ],
  // 中等缓存（1小时）
  medium: [
    '/api/media/list',
    '/api/media/search',
  ],
  // 短缓存（5分钟）
  short: [
    '/api/user/profile',
    '/api/watch-history',
  ],
  // 不缓存
  noCache: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ],
};

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 实现缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过chrome-extension请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API请求处理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静态资源处理
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // 其他请求 - 网络优先
  event.respondWith(networkFirst(request));
});

// 判断是否为静态资源
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp',
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// 处理API请求 - 智能缓存策略
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 检查是否在不缓存列表中
  if (API_CACHE_CONFIG.noCache.some(path => pathname.startsWith(path))) {
    return fetch(request);
  }

  // 根据路径选择缓存策略
  let cacheTime = 0;
  if (API_CACHE_CONFIG.long.some(path => pathname.startsWith(path))) {
    cacheTime = 24 * 60 * 60 * 1000; // 1天
  } else if (API_CACHE_CONFIG.medium.some(path => pathname.startsWith(path))) {
    cacheTime = 60 * 60 * 1000; // 1小时
  } else if (API_CACHE_CONFIG.short.some(path => pathname.startsWith(path))) {
    cacheTime = 5 * 60 * 1000; // 5分钟
  }

  // 如果不需要缓存，直接网络请求
  if (cacheTime === 0) {
    return networkFirst(request);
  }

  // 尝试从缓存获取
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // 检查缓存是否过期
    const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time')).getTime();
    const now = Date.now();
    
    if (now - cachedTime < cacheTime) {
      // 缓存有效，同时更新缓存（后台更新策略）
      event.waitUntil(updateCache(request));
      return cachedResponse;
    }
  }

  // 缓存不存在或已过期，网络请求
  return fetchAndCache(request, API_CACHE);
}

// 处理静态资源 - 缓存优先
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 静态资源加载失败，返回离线页面
    return caches.match('/offline.html');
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 返回离线页面
    return caches.match('/offline.html');
  }
}

// 获取并缓存
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // 添加缓存时间标记
      const responseWithTime = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cached-time': new Date().toISOString(),
        },
      });
      cache.put(request, responseWithTime);
    }
    return response;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 后台更新缓存
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      const responseWithTime = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cached-time': new Date().toISOString(),
        },
      });
      await cache.put(request, responseWithTime);
    }
  } catch (error) {
    // 后台更新失败，静默处理
    console.debug('[SW] Background update failed:', error);
  }
}

// 监听消息 - 清理缓存 / 跳过等待
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'SET_VERSION') {
    CACHE_VERSION = event.data.version || CACHE_VERSION;
    CACHE_NAME = `nest-tv-${CACHE_VERSION}`;
    STATIC_CACHE = `nest-tv-static-${CACHE_VERSION}`;
    DYNAMIC_CACHE = `nest-tv-dynamic-${CACHE_VERSION}`;
    API_CACHE = `nest-tv-api-${CACHE_VERSION}`;
    return;
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // 通知所有客户端缓存已清理
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_CLEARED',
              timestamp: Date.now(),
            });
          });
        });
      })
    );
  }

  // 预缓存指定资源
  if (event.data && event.data.type === 'PRECACHE') {
    const { urls } = event.data;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

// 后台同步 - 用于离线操作
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watch-history') {
    event.waitUntil(syncWatchHistory());
  }
});

// 同步观看历史
async function syncWatchHistory() {
  // 这里可以实现离线观看历史的同步逻辑
  console.log('[SW] Syncing watch history...');
}

// 推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification('Nest TV', options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});