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
app.mount('#app')
