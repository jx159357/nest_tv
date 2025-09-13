/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 16:06:18
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 16:44:00
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from '@unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
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
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Vite Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} to backend`);
          });
        },
      },
      rewrite: (path) => path.replace(/^\/api/, ''),
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
      external: ['vue', 'vue-router', 'pinia', 'axios', 'element-plus'],
      output: {
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
          axios: 'axios',
          'element-plus': 'ElementPlus'
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router', 
      'pinia',
      'axios',
      'element-plus',
      '@vueuse/core'
    ],
    force: true
  },
})