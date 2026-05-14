/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 16:06:18
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 16:44:00
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from '@unocss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3334',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: path => path.replace(/^\/api/, ''),
        configure: proxy => {
          proxy.on('error', err => {
            console.error('❌ Vite Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} to backend`);
            // 确保请求头包含正确的字符集
            proxyReq.setHeader('Accept-Charset', 'utf-8');
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭source map
    target: 'es2018',
    minify: 'esbuild',
    cssCodeSplit: true,
    cssTarget: 'chrome80', // 现代浏览器CSS优化
    rollupOptions: {
      output: {
        // 更智能的代码分割策略
        chunkFileNames: chunkInfo => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          // 核心框架库
          vendor: ['vue', 'vue-router', 'pinia'],
          // UI组件库
          ui: ['element-plus'],
          // 工具库
          utils: ['axios', '@vueuse/core'],
          // 通信库
          communication: ['socket.io-client'],
          // 国际化
          i18n: ['vue-i18n'],
        },
      },
    },
    // 生产环境优化
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'element-plus', '@vueuse/core'],
    force: true,
  },
  // 静态资源处理
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
});
