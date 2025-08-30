import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/media/:id',
      name: 'media-detail',
      component: () => import('../views/MediaDetailView.vue')
    },
    {
      path: '/watch/:id',
      name: 'watch',
      component: () => import('../views/WatchView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/crawler',
      name: 'crawler',
      component: () => import('../views/CrawlerView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/play-sources',
      name: 'play-sources',
      component: () => import('../views/PlaySourcesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/watch-history',
      name: 'watch-history',
      component: () => import('../views/WatchHistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recommendations',
      name: 'recommendations',
      component: () => import('../views/RecommendationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/AdminDashboardView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/AdminUsersView.vue')
        },
        {
          path: 'media',
          name: 'admin-media',
          component: () => import('../views/AdminMediaView.vue')
        },
        {
          path: 'play-sources',
          name: 'admin-play-sources',
          component: () => import('../views/AdminPlaySourcesView.vue')
        },
        {
          path: 'watch-history',
          name: 'admin-watch-history',
          component: () => import('../views/AdminWatchHistoryView.vue')
        },
        {
          path: 'roles',
          name: 'admin-roles',
          component: () => import('../views/AdminRolesView.vue')
        },
        {
          path: 'logs',
          name: 'admin-logs',
          component: () => import('../views/AdminLogsView.vue')
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 处理需要认证的路由
  if (to.meta.requiresAuth) {
    if (!token) {
      // 保存目标路由，登录后重定向
      sessionStorage.setItem('redirectPath', to.fullPath)
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 如果已登录用户访问登录/注册页面，重定向到首页
  if ((to.path === '/login' || to.path === '/register') && token) {
    next('/')
    return
  }
  
  next()
})

export default router