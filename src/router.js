import { createRouter, createWebHashHistory } from "vue-router";
import Home from "./views/Home.vue";
import WebpConverter from "./views/WebpConverter.vue";
import TextDiff from "./views/TextDiff.vue";
import Timestamp from "./views/Timestamp.vue";
import Base64 from "./views/Base64.vue";
import ApiTester from "./views/ApiTester.vue";
import JsonPrettify from "./views/JsonPrettify.vue";
import ErrorMonitor from "./views/ErrorMonitor.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/webp-converter", component: WebpConverter },
  { path: "/text-diff", component: TextDiff },
  { path: "/json-prettify", component: JsonPrettify },
  { path: "/timestamp", component: Timestamp },
  { path: "/base64", component: Base64 },
  { path: "/api-tester", component: ApiTester },
  { path: "/error-monitor", component: ErrorMonitor },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
