import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import WebpConverter from './views/WebpConverter.vue'
import TextDiff from './views/TextDiff.vue'
import Timestamp from './views/Timestamp.vue'
import Base64 from './views/Base64.vue'
import ApiTester from './views/ApiTester.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/webp-converter', component: WebpConverter },
  { path: '/text-diff', component: TextDiff },
  { path: '/timestamp', component: Timestamp },
  { path: '/base64', component: Base64 },
  { path: '/api-tester', component: ApiTester }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router; 