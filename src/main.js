import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

// 将router实例挂载到window对象，供访问统计服务使用
window.router = router

app.mount('#app') 