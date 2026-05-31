import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 布局组件
const MainLayout = () => import('../layouts/MainLayout.vue');

// 路由懒加载配置 - 认证页面
const LoginView = () => import('../views/LoginView.vue');
const RegisterView = () => import('../views/RegisterView.vue');

// 路由懒加载配置 - 主要页面（无需登录）
const HomeView = () => import('../views/HomeView.vue');
const MediaDetailView = () => import('../views/MediaDetailView.vue');
const WatchView = () => import('../views/WatchView.vue');
const IPTVView = () => import('../views/IPTVView.vue');
const RecommendationsView = () => import('../views/RecommendationsView.vue');
const CategoriesView = () => import('../views/CategoriesView.vue');

// 路由懒加载配置 - 用户功能（需要登录）
const ProfileView = () => import('../views/ProfileView.vue');
const SettingsView = () => import('../views/SettingsView.vue');
const SearchHistoryView = () => import('../views/SearchHistoryView.vue');
const FavoritesView = () => import('../views/FavoritesView.vue');
const WatchHistoryView = () => import('../views/WatchHistoryView.vue');
const DownloadsView = () => import('../views/DownloadsView.vue');
const TorrentView = () => import('../views/TorrentView.vue');

// 路由懒加载配置 - 管理功能（需要管理员权限）
const CrawlerView = () => import('../views/CrawlerView.vue');
const PlaySourcesView = () => import('../views/PlaySourcesView.vue');
const AdminLayout = () => import('../layouts/AdminLayout.vue');
const AdminDashboardView = () => import('../views/AdminDashboardView.vue');
const AdminUsersView = () => import('../views/AdminUsersView.vue');
const AdminRolesView = () => import('../views/AdminRolesView.vue');
const AdminMediaView = () => import('../views/AdminMediaView.vue');
const AdminPlaySourcesView = () => import('../views/AdminPlaySourcesView.vue');
const AdminDownloadTasksView = () => import('../views/AdminDownloadTasksView.vue');
const AdminWatchHistoryView = () => import('../views/AdminWatchHistoryView.vue');
const AdminLogsView = () => import('../views/AdminLogsView.vue');
const AdminDanmakuView = () => import('../views/AdminDanmakuView.vue');
const AdminSourceScriptsView = () => import('../views/AdminSourceScriptsView.vue');
const AdminCrawlerTargetsView = () => import('../views/AdminCrawlerTargetsView.vue');
const AdminIptvView = () => import('../views/AdminIptvView.vue');

// 路由懒加载配置 - 其他
const NotFoundView = () => import('../views/NotFoundView.vue');

// 公开路由名称列表 - 这些路由无需登录即可访问
const PUBLIC_ROUTE_NAMES = ['home', 'media-detail', 'watch', 'iptv', 'recommendations', 'categories'];

const routes: RouteRecordRaw[] = [
  // ==================== 主布局路由 - 观影功能 ====================
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: {
          title: '首页 - Nest TV',
          requiresAuth: false,
          preload: true,
          keepAlive: true,
        },
      },
      {
        path: 'media/:id',
        name: 'media-detail',
        component: MediaDetailView,
        meta: {
          title: '影视详情 - Nest TV',
          requiresAuth: false,
          preload: true,
        },
      },
      {
        path: 'watch/:id',
        name: 'watch',
        component: WatchView,
        meta: {
          title: '观看影视 - Nest TV',
          requiresAuth: false,
          preload: true,
          keepAlive: true,
        },
      },
      {
        path: 'iptv',
        name: 'iptv',
        component: IPTVView,
        meta: {
          title: 'IPTV - Nest TV',
          requiresAuth: false,
          preload: false,
        },
      },
      {
        path: 'dashboard',
        name: 'userDashboard',
        component: () => import('@/views/UserDashboardView.vue'),
        meta: {
          title: '用户中心 - Nest TV',
          requiresAuth: true,
        },
      },
      {
        path: 'recommendations',
        name: 'recommendations',
        component: RecommendationsView,
        meta: {
          title: '推荐内容 - Nest TV',
          requiresAuth: false,
          preload: true,
        },
      },
      {
        path: 'categories',
        name: 'categories',
        component: CategoriesView,
        meta: {
          title: '分类浏览 - Nest TV',
          requiresAuth: false,
          preload: true,
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: {
          title: '个人中心 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: {
          title: '偏好设置 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: FavoritesView,
        meta: {
          title: '我的收藏 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'search-history',
        name: 'search-history',
        component: SearchHistoryView,
        meta: {
          title: '搜索历史 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'watch-history',
        name: 'watch-history',
        component: WatchHistoryView,
        meta: {
          title: '观看历史 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'downloads',
        name: 'downloads',
        component: DownloadsView,
        meta: {
          title: '下载任务 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
      {
        path: 'torrent',
        name: 'torrent',
        component: TorrentView,
        meta: {
          title: '磁力资源 - Nest TV',
          requiresAuth: true,
          preload: false,
        },
      },
    ],
  },

  // ==================== 认证路由 - 无布局 ====================
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '登录 - Nest TV',
      requiresAuth: false,
      hideAuth: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      title: '注册 - Nest TV',
      requiresAuth: false,
      hideAuth: true,
    },
  },

  // ==================== 重定向路由 ====================
  {
    path: '/search',
    redirect: to => ({ path: '/', query: to.query }),
  },
  {
    path: '/continue-watching',
    redirect: () => ({
      name: 'watch-history',
      query: {
        isCompleted: 'false',
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      },
    }),
  },
  {
    path: '/completed',
    redirect: () => ({
      name: 'watch-history',
      query: {
        isCompleted: 'true',
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      },
    }),
  },

  // ==================== 管理路由 - 需要管理员权限 ====================
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    meta: {
      title: '管理后台 - Nest TV',
      requiresAuth: true,
      requiresAdmin: true,
      preload: false,
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: {
          title: '仪表盘 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: {
          title: '用户管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: AdminRolesView,
        meta: {
          title: '角色权限管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'media',
        name: 'admin-media',
        component: AdminMediaView,
        meta: {
          title: '媒体管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'play-sources',
        name: 'admin-play-sources',
        component: AdminPlaySourcesView,
        meta: {
          title: '播放源管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'download-tasks',
        name: 'admin-download-tasks',
        component: AdminDownloadTasksView,
        meta: {
          title: '下载任务管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'watch-history',
        name: 'admin-watch-history',
        component: AdminWatchHistoryView,
        meta: {
          title: '观看历史管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'logs',
        name: 'admin-logs',
        component: AdminLogsView,
        meta: {
          title: '系统日志 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'danmaku',
        name: 'admin-danmaku',
        component: AdminDanmakuView,
        meta: {
          title: '弹幕管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'source-scripts',
        name: 'admin-source-scripts',
        component: AdminSourceScriptsView,
        meta: {
          title: '源脚本管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'crawler',
        name: 'admin-crawler',
        component: CrawlerView,
        meta: {
          title: '数据采集 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'crawler-targets',
        name: 'admin-crawler-targets',
        component: AdminCrawlerTargetsView,
        meta: {
          title: '数据源管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'play-sources-overview',
        name: 'admin-play-sources-overview',
        component: PlaySourcesView,
        meta: {
          title: '播放源一览 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'iptv',
        name: 'admin-iptv',
        component: AdminIptvView,
        meta: {
          title: 'IPTV管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
    ],
  },

  // ==================== 404路由 ====================
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: '页面未找到 - Nest TV',
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, top: 0 };
    }
    return { left: 0, top: 0 };
  },
});

// 路由守卫
router.beforeEach(to => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta?.requiresAdmin);

  // 设置页面标题
  if (typeof to.meta?.title === 'string') {
    document.title = to.meta.title;
  }

  // 公开路由无需登录
  if (PUBLIC_ROUTE_NAMES.includes(to.name as string)) {
    return true;
  }

  // 需要认证的路由
  if (requiresAuth && !authStore.token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }

  // 需要管理员权限的路由
  if (requiresAdmin) {
    const role = authStore.user?.role;
    if (role !== 'admin' && role !== 'superAdmin') {
      return '/dashboard';
    }
  }

  return true;
});

export default router;
