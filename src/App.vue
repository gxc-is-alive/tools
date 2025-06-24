<template>
  <div :class="['app-root', currentTheme]" id="app">
    <div class="theme-switcher">
      <button @click="showThemePanel = !showThemePanel" class="theme-btn">
        🎨 皮肤切换
      </button>
      <div v-if="showThemePanel" class="theme-panel">
        <div v-for="theme in themes" :key="theme.value" class="theme-option">
          <button
            :class="[
              'theme-select-btn',
              { active: currentTheme === theme.value },
            ]"
            @click="switchTheme(theme.value)"
          >
            {{ theme.label }}
          </button>
        </div>
      </div>
    </div>
    <router-view />
    <div class="fab-container">
      <SiteStatusChecker />
      <CurrencyConverter />
      <ZenTimer />
      <VisitStats />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import SiteStatusChecker from "./components/SiteStatusChecker.vue";
import CurrencyConverter from "./components/CurrencyConverter.vue";
import ZenTimer from "./components/ZenTimer.vue";
import VisitStats from "./components/VisitStats.vue";

const themes = [
  { label: "默认", value: "default-theme" },
  { label: "科技风", value: "tech-theme" },
];
const currentTheme = ref("default-theme");
const showThemePanel = ref(false);

function switchTheme(theme) {
  currentTheme.value = theme;
  localStorage.setItem("theme", theme);
  showThemePanel.value = false;

  // 更新 body 和 app 元素的 class
  updateThemeClasses(theme);

  // 触发自定义事件，通知其他组件主题已变化
  window.dispatchEvent(new CustomEvent("themeChanged"));
}

function updateThemeClasses(theme) {
  const app = document.getElementById("app");
  const body = document.body;

  // 移除所有主题 class
  app?.classList.remove("default-theme", "tech-theme");
  body.classList.remove("default-theme", "tech-theme");

  // 添加当前主题 class（包括默认主题）
  app?.classList.add(theme);
  body.classList.add(theme);
}

onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved && themes.some((t) => t.value === saved)) {
    currentTheme.value = saved;
    updateThemeClasses(saved);
  }
});

// 监听主题变化
watch(currentTheme, (newTheme) => {
  updateThemeClasses(newTheme);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f4f7f9;
  color: #333;
  line-height: 1.6;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .card {
    padding: 15px;
    margin-bottom: 15px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 8px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }

  .btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .card {
    padding: 12px;
    margin-bottom: 12px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 6px;
    font-size: 0.85rem;
  }
}

.theme-switcher {
  position: fixed;
  top: 24px;
  right: 32px;
  z-index: 9999;
}
.theme-btn {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  transition: all 0.3s ease;
}
.theme-btn:hover {
  background: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px #0002;
}
.theme-panel {
  margin-top: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 16px #0002;
  padding: 10px 20px;
  animation: slideDown 0.3s ease;
}
.theme-option {
  margin-bottom: 8px;
}
.theme-select-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 6px 0;
  color: #333;
  transition: all 0.2s ease;
}
.theme-select-btn:hover {
  color: #007bff;
}
.theme-select-btn.active {
  color: #0e27e1;
  font-weight: bold;
}

/* 科技风主题样式 */
.tech-theme {
  --tech-bg-primary: #f8faff;
  --tech-bg-secondary: #ffffff;
  --tech-bg-tertiary: #f0f4ff;
  --tech-accent-primary: #667eea;
  --tech-accent-secondary: #764ba2;
  --tech-accent-tertiary: #f093fb;
  --tech-text-primary: #2d3748;
  --tech-text-secondary: #4a5568;
  --tech-border-glow: #667eea;
  --tech-shadow-glow: 0 4px 20px rgba(102, 126, 234, 0.15);
  --tech-gradient-primary: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 50%,
    #f093fb 100%
  );
  --tech-gradient-secondary: linear-gradient(45deg, #667eea, #764ba2);
  --tech-gradient-tertiary: linear-gradient(135deg, #f093fb, #f5576c);
}

.tech-theme body {
  background: var(--tech-bg-primary);
  color: var(--tech-text-primary);
  font-family: "Orbitron", "Segoe UI", monospace;
}

.tech-theme .container {
  background: var(--tech-bg-secondary);
  border: 1px solid var(--tech-border-glow);
  border-radius: 16px;
  box-shadow: var(--tech-shadow-glow);
}

.tech-theme .btn {
  background: var(--tech-gradient-secondary);
  border: 1px solid var(--tech-accent-primary);
  border-radius: 12px;
  color: #ffffff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: var(--tech-shadow-glow);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tech-theme .btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.tech-theme .btn:hover::before {
  left: 100%;
}

.tech-theme .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
}

.tech-theme .btn-secondary {
  background: var(--tech-gradient-tertiary);
  border-color: var(--tech-accent-tertiary);
}

.tech-theme .card {
  background: var(--tech-bg-secondary);
  border: 1px solid var(--tech-border-glow);
  border-radius: 16px;
  box-shadow: var(--tech-shadow-glow);
  color: var(--tech-text-primary);
}

.tech-theme .form-group input,
.tech-theme .form-group textarea,
.tech-theme .form-group select {
  background: var(--tech-bg-tertiary);
  border: 2px solid #e2e8f0;
  color: var(--tech-text-primary);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tech-theme .form-group input:focus,
.tech-theme .form-group textarea:focus,
.tech-theme .form-group select:focus {
  outline: none;
  border-color: var(--tech-accent-primary);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
  background: #ffffff;
}

.tech-theme .form-group label {
  color: var(--tech-accent-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

/* 科技风主题切换器样式 */
.tech-theme .theme-btn {
  background: var(--tech-bg-secondary);
  border: 2px solid var(--tech-border-glow);
  color: var(--tech-text-primary);
  box-shadow: var(--tech-shadow-glow);
}

.tech-theme .theme-btn:hover {
  background: var(--tech-bg-tertiary);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.25);
}

.tech-theme .theme-panel {
  background: var(--tech-bg-secondary);
  border: 2px solid var(--tech-border-glow);
  box-shadow: var(--tech-shadow-glow);
}

.tech-theme .theme-select-btn {
  color: var(--tech-text-secondary);
}

.tech-theme .theme-select-btn:hover {
  color: var(--tech-accent-primary);
}

.tech-theme .theme-select-btn.active {
  color: var(--tech-accent-secondary);
  text-shadow: 0 0 10px rgba(118, 75, 162, 0.3);
}

/* 科技风动画效果 */
.tech-theme * {
  transition: all 0.3s ease;
}

.tech-theme .floating-shape {
  background: var(--tech-gradient-secondary);
  opacity: 0.1;
  animation: techFloat 8s ease-in-out infinite;
}

@keyframes techFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.3;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .card {
    padding: 15px;
    margin-bottom: 15px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 8px;
    font-size: 0.9rem;
  }

  .theme-switcher {
    top: 16px;
    right: 16px;
  }

  .theme-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }

  .btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .card {
    padding: 12px;
    margin-bottom: 12px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 6px;
    font-size: 0.85rem;
  }
}

/* 浮动操作按钮容器 */
.fab-container {
  position: fixed;
  bottom: 90px;
  right: 30px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
  z-index: 1000;
}

/* 移动端响应式设计 - 悬浮按钮 */
@media (max-width: 768px) {
  .fab-container {
    bottom: 80px;
    right: 20px;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .fab-container {
    bottom: 20px;
    right: 15px;
    gap: 20px;
  }
}
</style>
