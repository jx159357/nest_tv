import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载配置
const HomeView = () => import(/* webpackChunkName: "home" */ '../views/HomeView.vue')
const LoginView = () => import(/* webpackChunkName: "auth" */ '../views/LoginView.vue')
const RegisterView = () => import(/* webpackChunkName: "auth" */ '../views/RegisterView.vue')
const MediaDetailView = () => import(/* webpackChunkName: "media" */ '../views/MediaDetailView.vue')
const WatchView = () => import(/* webpackChunkName: "media" */ '../views/WatchView.vue')
const ProfileView = () => import(/* webpackChunkName: "user" */ '../views/ProfileView.vue')
const CrawlerView = () => import(/* webpackChunkName: "admin" */ '../views/CrawlerView.vue')
const PlaySourcesView = () => import(/* webpackChunkName: "admin" */ '../views/PlaySourcesView.vue')
const WatchHistoryView = () => import(/* webpackChunkName: "user" */ '../views/WatchHistoryView.vue')
const RecommendationsView = () => import(/* webpackChunkName: "user" */ '../views/RecommendationsView.vue')
const AdminLayout = () => import(/* webpackChunkName: "admin" */ '../layouts/AdminLayout.vue')
const AdminDashboardView = () => import(/* webpackChunkName: "admin" */ '../views/AdminDashboardView.vue')
const AdminUsersView = () => import(/* webpackChunkName: "admin" */ '../views/AdminUsersView.vue')
const AdminMediaView = () => import(/* webpackChunkName: "admin" */ '../views/AdminMediaView.vue')
const SettingsView = () => import(/* webpackChunkName: "user" */ '../views/SettingsView.vue')
const NotFoundView = () => import(/* webpackChunkName: "error" */ '../views/NotFoundView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页 - Nest TV',
      preload: true, // 首页预加载
      keepAlive: true // 保持组件状态
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '登录 - Nest TV',
      requiresAuth: false,
      hideAuth: true // 登录页面隐藏已登录状态
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      title: '注册 - Nest TV',
      requiresAuth: false,
      hideAuth: true
    }
  },
  {
    path: '/media/:id',
    name: 'media-detail',
    component: MediaDetailView,
    meta: {
      title: '影视详情 - Nest TV',
      requiresAuth: false, // 影视详情页无需登录
      preload: true // 预加载重要页面
    }
  },
  {
    path: '/watch/:id',
    name: 'watch',
    component: WatchView,
    meta: {
      title: '观看影视 - Nest TV',
      requiresAuth: true, // 观看页面需要登录
      preload: true, // 观看页面预加载
      keepAlive: true // 保持播放状态
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: '个人中心 - Nest TV',
      requiresAuth: true,
      preload: false // 个人中心不预加载
    }
  },
  {
    path: '/watch-history',
    name: 'watch-history',
    component: WatchHistoryView,
    meta: {
      title: '观看历史 - Nest TV',
      requiresAuth: true,
      preload: false // 历史记录按需加载
    }
  },
  {
    path: '/recommendations',
    name: 'recommendations',
    component: RecommendationsView,
    meta: {
      title: '推荐内容 - Nest TV',
      requiresAuth: false,
      preload: true // 推荐内容预加载
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: '系统设置 - Nest TV',
      requiresAuth: true,
      preload: false // 设置页面按需加载
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    meta: {
      title: '管理后台 - Nest TV',
      requiresAuth: true,
      requiresAdmin: true,
      preload: false // 管理功能不预加载
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: {
          title: '仪表板 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: {
          title: '用户管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'media',
        name: 'admin-media',
        component: AdminMediaView,
        meta: {
          title: '媒体管理 - Nest TV',
          requiresAuth: true,
          requiresAdmin: true
        }
      }
    ]
  },
  {
    path: '/crawler',
    name: 'crawler',
    component: CrawlerView,
    meta: {
      title: '数据采集 - Nest TV',
      requiresAuth: true,
      preload: false // 管理功能不预加载
    }
  },
  {
    path: '/play-sources',
    name: 'play-sources',
    component: PlaySourcesView,
    meta: {
      title: '播放源管理 - Nest TV',
      requiresAuth: true,
      preload: false // 管理功能不预加载
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: '页面未找到 - Nest TV',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { selector: to.hash }
    }
    return { left: 0, top: 0 }
  }
})

export default router