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
      },
      '/torrent': {
        target: 'http://localhost:3334',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3334',
        changeOrigin: true,
        ws: true,
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
        manualChunks: id => {
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('/node_modules/')) return;

          if (
            normalizedId.includes('/node_modules/vue/') ||
            normalizedId.includes('/node_modules/vue-router/') ||
            normalizedId.includes('/node_modules/pinia/')
          ) {
            return 'vendor';
          }

          if (
            normalizedId.includes('/node_modules/axios/') ||
            normalizedId.includes('/node_modules/@vueuse/')
          ) {
            return 'utils';
          }

          if (normalizedId.includes('/node_modules/socket.io-client/')) {
            return 'communication';
          }

          if (normalizedId.includes('/node_modules/vue-i18n/')) {
            return 'i18n';
          }

          if (
            normalizedId.includes('/node_modules/artplayer/') ||
            normalizedId.includes('/node_modules/option-validator/')
          ) {
            return 'player-art';
          }

          if (normalizedId.includes('/node_modules/hls.js/')) {
            return 'player-hls';
          }
        },
      },
    },
    // 生产环境优化
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', '@vueuse/core'],
    force: true,
  },
  // 静态资源处理
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
});
