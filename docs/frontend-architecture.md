# Nest TV 前端架构设计文档

## 项目概述

Nest TV 前端是一个基于 Vue 3 Composition API 的现代化单页应用，提供视频播放、弹幕互动、IPTV 直播、后台管理等完整功能。采用 UnoCSS 原子化 CSS 和设计系统变量实现统一样式。

## 技术栈

- **框架**: Vue 3.5 + Composition API
- **语言**: TypeScript
- **构建工具**: Vite 6.3
- **路由**: Vue Router 4.5
- **状态管理**: Pinia 3.0
- **HTTP 客户端**: Axios 1.9
- **CSS 框架**: UnoCSS (presetUno + presetAttributify + presetIcons)
- **视频播放**: ArtPlayer 5.4 + HLS.js 1.6
- **实时通信**: Socket.IO Client
- **图标**: @iconify/vue

---

## 一、目录结构

```
frontend/src/
├── api/                    # API 接口层
│   ├── admin.ts           # 管理后台 API
│   ├── auth.ts            # 认证 API
│   ├── categories.ts      # 分类 API
│   ├── danmaku.ts         # 弹幕 API
│   ├── downloads.ts       # 下载 API
│   ├── history.ts         # 历史记录 API
│   ├── iptv.ts            # IPTV API
│   ├── media.ts           # 媒体资源 API
│   ├── proxy.ts           # 代理 API
│   ├── search.ts          # 搜索 API
│   ├── torrent.ts         # 种子 API
│   ├── users.ts           # 用户 API
│   └── watch-room.ts      # 观影房 API
│
├── components/            # 可复用组件
│   ├── AIChatPanel.vue         # AI 对话面板
│   ├── ArtPlayerWrapper.vue    # ArtPlayer 封装 (HLS.js 集成)
│   ├── BannerCarousel.vue      # 首页轮播横幅
│   ├── DanmakuPlayer.vue       # 弹幕播放器 (WebSocket)
│   ├── EmptyState.vue          # 空状态占位
│   ├── EnhancedModal.vue       # 增强模态框
│   ├── EpgTimeline.vue         # EPG 节目单时间线 (列表/时间线视图)
│   ├── GlobalProgressBar.vue   # 全局进度条
│   ├── PlayerGestureControl.vue # 播放器手势控制
│   ├── InlineNotice.vue        # 行内提示
│   ├── LoadingSpinner.vue      # 加载动画
│   ├── MediaCard.vue           # 媒体卡片 (长按菜单、懒加载、代理回退)
│   ├── NotificationToast.vue   # 通知提示
│   ├── TextClamp.vue           # 文本折叠
│   ├── Toast.vue               # Toast 提示
│   ├── UpdateNotification.vue  # 更新通知
│   └── WatchRoom.vue           # 观影房组件
│
├── layouts/               # 布局组件
│   ├── AdminLayout.vue    # 管理后台布局
│   └── MainLayout.vue     # 主布局
│
├── router/                # 路由配置
│   └── index.ts           # 路由定义与守卫
│
├── stores/                # Pinia 状态管理
│   ├── auth.ts            # 认证状态
│   ├── media.ts           # 媒体数据
│   └── downloads.ts       # 下载状态
│
├── styles/                # 样式文件
│   ├── design-system.css  # 设计系统变量
│   └── global.css         # 全局样式
│
├── types/                 # TypeScript 类型
│   ├── api.ts             # API 响应类型
│   ├── media.ts           # 媒体相关类型
│   └── user.ts            # 用户相关类型
│
├── utils/                 # 工具函数
│   ├── api-client.ts      # Axios 封装
│   ├── cache.ts           # 缓存管理
│   ├── danmaku-websocket.ts # 弹幕 WebSocket
│   ├── date.ts            # 日期处理
│   ├── download.ts        # 下载工具
│   ├── format.ts          # 格式化工具
│   ├── logger.ts          # 日志工具
│   ├── performance.ts     # 性能监控
│   ├── preload.ts         # 路由预加载
│   ├── stream.ts          # 流式请求
│   └── validation.ts      # 表单验证
│
├── views/                 # 页面视图 (29个)
│   ├── 公开页面 (无需登录)
│   │   ├── HomeView.vue          # 首页 (BannerCarousel + 分类推荐)
│   │   ├── LoginView.vue         # 登录
│   │   ├── RegisterView.vue      # 注册
│   │   ├── MediaDetailView.vue   # 媒体详情 (播放源、推荐)
│   │   ├── WatchView.vue         # 播放页 (ArtPlayer + 弹幕)
│   │   ├── IPTVView.vue          # IPTV 直播 (频道列表 + 播放 + EPG 节目单 + 台标 + 质量评分)
│   │   ├── CategoriesView.vue    # 分类浏览
│   │   └── RecommendationsView.vue # 推荐页面
│   │
│   ├── 用户页面 (需登录)
│   │   ├── ProfileView.vue       # 个人中心
│   │   ├── WatchHistoryView.vue  # 观看历史
│   │   ├── FavoritesView.vue     # 我的收藏
│   │   ├── SearchHistoryView.vue # 搜索历史
│   │   ├── DownloadsView.vue     # 下载管理
│   │   ├── TorrentView.vue       # 磁力资源
│   │   └── SettingsView.vue      # 偏好设置
│   │
│   ├── 管理后台 (需管理员权限)
│   │   ├── AdminDashboardView.vue      # 仪表盘 (统计概览)
│   │   ├── AdminMediaView.vue          # 媒体管理
│   │   ├── AdminUsersView.vue          # 用户管理
│   │   ├── AdminRolesView.vue          # 角色权限管理
│   │   ├── AdminDanmakuView.vue        # 弹幕管理 (审核)
│   │   ├── AdminLogsView.vue           # 系统日志
│   │   ├── AdminPlaySourcesView.vue    # 播放源管理
│   │   ├── AdminWatchHistoryView.vue   # 观看历史管理
│   │   ├── AdminDownloadTasksView.vue  # 下载任务管理
│   │   ├── AdminSourceScriptsView.vue  # 源脚本管理
│   │   ├── AdminCrawlerTargetsView.vue # 数据源管理
│   │   ├── AdminIptvView.vue           # IPTV 管理 (频道/源/质量/台标)
│   │   ├── CrawlerView.vue             # 数据采集
│   │   └── PlaySourcesView.vue         # 播放源一览
│   │
│   └── 特殊页面
│       └── NotFoundView.vue            # 404 页面
│
├── App.vue                # 根组件
└── main.ts                # 入口文件
```

---

## 二、路由设计

### 2.1 路由配置

**公开路由 (PUBLIC_ROUTE_NAMES)**:
home, media-detail, watch, iptv, recommendations, categories

```typescript
const routes: RouteRecordRaw[] = [
  // 主布局路由 - 观影功能
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'media/:id', name: 'media-detail', component: MediaDetailView },
      { path: 'watch/:id', name: 'watch', component: WatchView },
      { path: 'iptv', name: 'iptv', component: IPTVView },
      { path: 'recommendations', name: 'recommendations', component: RecommendationsView },
      { path: 'categories', name: 'categories', component: CategoriesView },
      { path: 'profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
      { path: 'settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
      { path: 'favorites', name: 'favorites', component: FavoritesView, meta: { requiresAuth: true } },
      { path: 'search-history', name: 'search-history', component: SearchHistoryView, meta: { requiresAuth: true } },
      { path: 'watch-history', name: 'watch-history', component: WatchHistoryView, meta: { requiresAuth: true } },
      { path: 'downloads', name: 'downloads', component: DownloadsView, meta: { requiresAuth: true } },
      { path: 'torrent', name: 'torrent', component: TorrentView, meta: { requiresAuth: true } },
    ],
  },

  // 认证路由 - 无布局
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  // 重定向路由
  { path: '/search', redirect: to => ({ path: '/', query: to.query }) },
  { path: '/continue-watching', redirect: () => ({ name: 'watch-history', query: { isCompleted: 'false', sortBy: 'updatedAt', sortOrder: 'DESC' } }) },
  { path: '/completed', redirect: () => ({ name: 'watch-history', query: { isCompleted: 'true', sortBy: 'updatedAt', sortOrder: 'DESC' } }) },

  // 管理后台 (AdminLayout)
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboardView },
      { path: 'users', name: 'admin-users', component: AdminUsersView },
      { path: 'roles', name: 'admin-roles', component: AdminRolesView },
      { path: 'media', name: 'admin-media', component: AdminMediaView },
      { path: 'play-sources', name: 'admin-play-sources', component: AdminPlaySourcesView },
      { path: 'download-tasks', name: 'admin-download-tasks', component: AdminDownloadTasksView },
      { path: 'watch-history', name: 'admin-watch-history', component: AdminWatchHistoryView },
      { path: 'logs', name: 'admin-logs', component: AdminLogsView },
      { path: 'danmaku', name: 'admin-danmaku', component: AdminDanmakuView },
      { path: 'source-scripts', name: 'admin-source-scripts', component: AdminSourceScriptsView },
      { path: 'crawler', name: 'admin-crawler', component: CrawlerView },
      { path: 'crawler-targets', name: 'admin-crawler-targets', component: AdminCrawlerTargetsView },
      { path: 'play-sources-overview', name: 'admin-play-sources-overview', component: PlaySourcesView },
      { path: 'iptv', name: 'admin-iptv', component: AdminIptvView },
    ],
  },

  // 404
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
];
```

### 2.2 路由守卫

```typescript
router.beforeEach(to => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta?.requiresAdmin);

  // 设置页面标题
  if (typeof to.meta?.title === 'string') {
    document.title = to.meta.title;
  }

  // 公开路由无需登录
  if (PUBLIC_ROUTE_NAMES.includes(to.name as string)) return true;

  // 需要认证的路由
  if (requiresAuth && !authStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // 需要管理员权限的路由
  if (requiresAdmin) {
    const role = authStore.user?.role;
    if (role !== 'admin' && role !== 'superAdmin') return '/';
  }

  return true;
});
```

### 2.3 路由预加载

```typescript
// 基于 IntersectionObserver 的智能预加载
const preloadRoute = (routeName: string) => {
  const route = router.resolve({ name: routeName });
  if (route.matched.length) {
    route.matched.forEach(record => {
      Object.values(record.components).forEach(component => {
        if (typeof component === 'function') {
          component(); // 触发动态导入
        }
      });
    });
  }
};
```

---

## 三、状态管理 (3个 Store)

### 3.1 Auth Store (stores/auth.ts)

```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    token.value = response.accessToken;
    user.value = response.user;
    localStorage.setItem('token', response.accessToken);
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  return { user, token, isAuthenticated, login, logout };
});
```

### 3.2 Media Store (stores/media.ts)

```typescript
export const useMediaStore = defineStore('media', () => {
  const mediaList = ref<MediaResource[]>([]);
  const currentMedia = ref<MediaResource | null>(null);
  const loading = ref(false);
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchMediaList = async (params: MediaQueryParams = {}) => { ... };
  const fetchMediaDetail = async (id: string | number) => { ... };
  const fetchPopularMedia = async (limit = 10) => { ... };
  const fetchLatestMedia = async (limit = 10) => { ... };
  const fetchTopRatedMedia = async (limit = 10, minRating = 8) => { ... };
  const fetchRecommendations = async (mediaId: string | number, limit = 6) => { ... };
  const toggleFavorite = async (id: string, currentState?: boolean) => { ... };
  const fetchFavorites = async (params?: MediaQueryParams) => { ... };

  return { mediaList, currentMedia, loading, pagination, ... };
});
```

### 3.3 Downloads Store (stores/downloads.ts)

```typescript
export const useDownloadsStore = defineStore('downloads', () => {
  const tasks = ref<DownloadTask[]>([]);
  const activeCount = computed(() =>
    tasks.value.filter(t => t.status === 'downloading').length
  );

  return { tasks, activeCount, fetchTasks };
});
```

---

## 四、API 层设计

### 4.1 Axios 封装

```typescript
// utils/api-client.ts
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push('/auth/login');
    }
    return Promise.reject(error);
  }
);
```

### 4.2 API 模块示例

```typescript
// api/media.ts
export const mediaApi = {
  getList: (params?: MediaQueryParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<MediaResource>>>('/media', { params }),

  getDetail: (id: number) =>
    apiClient.get<ApiResponse<MediaResource>>(`/media/${id}`),

  search: (keyword: string, params?: PaginationParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<MediaResource>>>('/search', {
      params: { keyword, ...params },
    }),

  getPopular: (limit?: number) =>
    apiClient.get<ApiResponse<MediaResource[]>>('/media/popular', { params: { limit } }),

  getLatest: (limit?: number) =>
    apiClient.get<ApiResponse<MediaResource[]>>('/media/latest', { params: { limit } }),
};
```

### 4.3 缓存策略

```typescript
// utils/cache.ts
class HybridCacheManager {
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    // 1. 内存缓存
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expiry > Date.now()) {
      return memCached.data;
    }

    // 2. localStorage 缓存
    const localCached = localStorage.getItem(`cache_${key}`);
    if (localCached) {
      const { data, expiry } = JSON.parse(localCached);
      if (expiry > Date.now()) {
        this.memoryCache.set(key, { data, expiry });
        return data;
      }
    }

    return null;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    const expiry = Date.now() + ttl;
    this.memoryCache.set(key, { data, expiry });
    localStorage.setItem(`cache_${key}`, JSON.stringify({ data, expiry }));
  }
}
```

---

## 五、组件设计

### 5.1 ArtPlayer 封装

```vue
<!-- components/ArtPlayerWrapper.vue -->
<template>
  <div ref="playerContainer" class="art-player-container"></div>
</template>

<script setup lang="ts">
import Artplayer from 'artplayer';
import Hls from 'hls.js';

const props = defineProps<{
  url: string;
  type?: 'hls' | 'mp4' | 'flv';
}>();

const playerContainer = ref<HTMLElement>();
let art: Artplayer;

onMounted(() => {
  art = new Artplayer({
    container: playerContainer.value!,
    url: props.url,
    type: props.type === 'hls' ? 'customHls' : undefined,
    customType: {
      customHls: (video, url) => {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      },
    },
  });
});

onUnmounted(() => {
  art?.destroy();
});
</script>
```

### 5.2 弹幕播放器

```vue
<!-- components/DanmakuPlayer.vue -->
<template>
  <div class="danmaku-layer">
    <div
      v-for="danmaku in visibleDanmaku"
      :key="danmaku.id"
      class="danmaku-item"
      :style="getDanmakuStyle(danmaku)"
    >
      {{ danmaku.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { DanmakuWebSocket } from '@/utils/danmaku-websocket';

const ws = new DanmakuWebSocket();
const visibleDanmaku = ref<Danmaku[]>([]);

ws.on('receive', (danmaku: Danmaku) => {
  visibleDanmaku.value.push(danmaku);
  setTimeout(() => {
    visibleDanmaku.value = visibleDanmaku.value.filter(d => d.id !== danmaku.id);
  }, 8000);
});
</script>
```

### 5.3 MediaCard 组件

```vue
<!-- components/MediaCard.vue -->
<template>
  <router-link :to="`/media/${media.id}`" class="media-card">
    <div class="media-card__poster">
      <img :src="media.poster" :alt="media.title" loading="lazy" />
      <span class="media-card__quality">{{ media.quality }}</span>
      <span class="media-card__rating">{{ media.rating }}</span>
    </div>
    <div class="media-card__info">
      <h3 class="media-card__title">{{ media.title }}</h3>
      <p class="media-card__meta">
        {{ media.type }} · {{ media.releaseDate }}
      </p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  media: MediaResource;
}>();
</script>

<style scoped>
.media-card {
  display: block;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  transition: transform var(--transition-normal);
}

.media-card:hover {
  transform: translateY(-4px);
}

.media-card__poster {
  position: relative;
  aspect-ratio: 2/3;
}

.media-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
```

---

## 六、设计系统

### 6.1 CSS 变量体系

```css
/* styles/design-system.css */
:root {
  /* 品牌色 */
  --color-brand-primary: #6366f1;
  --color-brand-primary-light: #818cf8;
  --color-brand-primary-dark: #4f46e5;

  /* 背景色 */
  --bg-page: #f9fafb;
  --bg-card: #ffffff;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;

  /* 文本色 */
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* 边框色 */
  --border-primary: #e2e8f0;
  --border-focus: #6366f1;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);

  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  /* 间距 */
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* 动画 */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}

/* 暗色主题 */
[data-theme="dark"], .dark {
  --bg-page: #0a0f1a;
  --bg-card: #141a2a;
  --text-primary: #e2e8f0;
  --text-secondary: #cbd5e1;
  --border-primary: rgba(255,255,255,0.06);
}
```

### 6.2 UnoCSS 配置

```typescript
// uno.config.ts
export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-md font-medium transition-colors',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600',
    'card': 'bg-white rounded-lg shadow-sm border border-gray-200',
    'container-responsive': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'grid-responsive': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  },
});
```

---

## 七、特殊功能实现

### 7.1 IPTV 直播页面

**IPTVView.vue 功能:**
- 频道列表：分页、分组筛选、搜索、国家/清晰度过滤
- 频道卡片：台标显示、质量评分标签、活跃状态标识
- EPG 节目单：EpgTimeline 组件（列表/时间线视图）、当前节目高亮
- 播放器：ArtPlayer 集成、HLS 流代理
- M3U/JSON 导入、批量删除

**AdminIptvView.vue 功能:**
- 统计仪表盘：总频道数、活跃频道、分组数、高质量频道数
- 频道管理：表格视图、搜索/排序/分页、测试/编辑/删除
- 直播源管理：源列表、启用/禁用、添加/删除、收集频道
- 质量统计：高/中/低质量频道分布、平均响应时间
- 台标管理：台标列表、初始化预置台标
- 导入导出：M3U/TXT 导入、M3U/TXT 导出

**EpgTimeline.vue 组件:**
- 两种视图模式：列表视图、时间线视图
- 节目状态：past（已播）、playing（正在播）、future（未播）
- 自动滚动到当前节目
- 60 秒自动刷新定位

### 7.2 SSE 流式搜索

```typescript
// utils/stream.ts
export function streamSearch(keyword: string, onMessage: (data: any) => void) {
  const eventSource = new EventSource(`/api/search/stream?keyword=${encodeURIComponent(keyword)}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => eventSource.close();
}
```

### 7.2 WebSocket 弹幕

```typescript
// utils/danmaku-websocket.ts
import { io, Socket } from 'socket.io-client';

export class DanmakuWebSocket {
  private socket: Socket;
  private handlers = new Map<string, Function[]>();

  constructor() {
    this.socket = io('/danmaku', {
      auth: { token: localStorage.getItem('token') },
    });

    this.socket.on('danmaku:receive', (data) => {
      this.emit('receive', data);
    });
  }

  send(danmaku: { content: string; time: number; color: string }) {
    this.socket.emit('danmaku:send', danmaku);
  }

  join(mediaId: number) {
    this.socket.emit('danmaku:join', { mediaId });
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  private emit(event: string, data: any) {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}
```

### 7.3 路由预加载

```typescript
// utils/preload.ts
export function setupRoutePreloading() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        const routeName = link.dataset.route;
        if (routeName) {
          preloadRoute(routeName);
        }
      }
    });
  });

  document.querySelectorAll('[data-route]').forEach(el => {
    observer.observe(el);
  });
}
```

### 7.4 性能监控

```typescript
// utils/performance.ts
export function trackPerformance() {
  // 首屏加载时间
  window.addEventListener('load', () => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('Page Load Time:', timing.loadEventEnd - timing.startTime);
  });

  // 资源加载时间
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.duration > 1000) {
        console.warn('Slow Resource:', entry.name, entry.duration);
      }
    });
  });
  observer.observe({ entryTypes: ['resource'] });
}
```

---

## 八、样式规范

### 8.1 组件样式结构

```vue
<style scoped>
/* 组件根元素 */
.component-name {
  /* 布局 */
  display: flex;
  gap: var(--spacing-4);

  /* 尺寸 */
  width: 100%;
  max-width: var(--container-xl);

  /* 视觉 */
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* 子元素使用 BEM 命名 */
.component-name__header {
  /* ... */
}

.component-name__content {
  /* ... */
}

/* 修饰符 */
.component-name--compact {
  /* ... */
}

/* 响应式 */
@media (max-width: 768px) {
  .component-name {
    flex-direction: column;
  }
}
</style>
```

### 8.2 暗色主题适配

```vue
<style scoped>
.card {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.card__title {
  color: var(--text-primary);
}

.card__desc {
  color: var(--text-secondary);
}

.card__meta {
  color: var(--text-muted);
}
</style>
```

---

## 九、构建与部署

### 9.1 Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  server: {
    port: 5173,
    proxy: {
      '/iptv': { target: 'http://localhost:3334', changeOrigin: true },
      '/crawler': { target: 'http://localhost:3334', changeOrigin: true },
      '/search': { target: 'http://localhost:3334', changeOrigin: true },
      '/recommendations': { target: 'http://localhost:3334', changeOrigin: true },
      '/media': { target: 'http://localhost:3334', changeOrigin: true },
      '/auth': { target: 'http://localhost:3334', changeOrigin: true },
      '/admin': { target: 'http://localhost:3334', changeOrigin: true },
      '/danmaku': { target: 'http://localhost:3334', changeOrigin: true },
      '/health': { target: 'http://localhost:3334', changeOrigin: true },
    },
  },
});
```

### 9.2 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3334
VITE_WS_URL=ws://localhost:3334

# .env.production
VITE_API_BASE_URL=/api
VITE_WS_URL=wss://your-domain.com
```

---

## 十、开发规范

### 10.1 文件命名

- 组件: PascalCase (`MediaCard.vue`)
- 视图: PascalCase + View 后缀 (`HomeView.vue`)
- 工具: camelCase (`api-client.ts`)
- 类型: camelCase (`media.ts`)

### 10.2 代码风格

- 使用 Composition API + `<script setup>`
- 响应式数据使用 `ref` / `computed`
- 副作用使用 `watch` / `watchEffect`
- 生命周期使用 `onMounted` / `onUnmounted`

### 10.3 组件设计原则

- 单一职责
- Props 类型定义完整
- 事件使用 `defineEmits`
- 插槽使用 `defineSlots`

---

*文档版本: v2.0*
*最后更新: 2026-05-23*
