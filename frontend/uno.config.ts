import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  shortcuts: {
    // 基础组件
    btn: 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    card: 'bg-white rounded-lg shadow-sm border border-gray-200',
    input:
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',

    // 响应式容器
    'container-responsive': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'container-mobile': 'w-full px-4',
    'container-tablet': 'max-w-4xl mx-auto px-6',
    'container-desktop': 'max-w-7xl mx-auto px-8',

    // 响应式网格
    'grid-responsive': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    'grid-mobile': 'grid grid-cols-1 gap-4',
    'grid-tablet': 'grid grid-cols-2 gap-5',
    'grid-desktop': 'grid grid-cols-3 lg:grid-cols-4 gap-6',

    // 响应式导航
    'nav-responsive':
      'flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0',
    'nav-mobile': 'flex flex-col items-center space-y-3',
    'nav-desktop': 'flex flex-row items-center justify-between space-x-6',

    // 响应式卡片
    'card-responsive': 'card p-4 sm:p-6',
    'card-mobile': 'card p-4',
    'card-desktop': 'card p-6',
  },
});
