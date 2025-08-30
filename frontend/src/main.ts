import { createApp } from 'vue'
import './style.css'
import 'virtual:uno.css' // 导入UnoCSS虚拟模块
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('❌ Vue Error:', err)
  // 可以在这里添加错误上报逻辑
}

app.config.warnHandler = (msg, vm, trace) => {
  console.warn('⚠️ Vue Warning:', msg)
  console.warn('Trace:', trace)
}

app.mount('#app')
