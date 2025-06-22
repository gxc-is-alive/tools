<template>
  <div :class="['home-container', isTechTheme ? 'tech-theme' : '']">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>

    <div class="content-wrapper">
      <SearchBar />

      <main class="tools-section">
        <div class="tools-grid">
          <div 
            v-for="tool in tools" 
            :key="tool.id"
            class="tool-card"
            @click="navigateTo(tool.path)"
          >
            <div class="card-background"></div>
            <div class="card-content">
              <div class="tool-icon">
                <i :class="tool.icon"></i>
              </div>
              <div class="tool-info">
                <h3 class="tool-name">{{ tool.name }}</h3>
                <p class="tool-description">{{ tool.description }}</p>
              </div>
              <div class="tool-action">
                <span class="action-text">开始使用</span>
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>
            <div class="card-hover-effect"></div>
          </div>
        </div>
      </main>

      <footer class="footer-section">
        <div class="footer-content">
          <p>© 2024 在线工具箱 - 让工作更简单</p>
          <div class="footer-links">
            <a href="#" class="footer-link">关于我们</a>
            <a href="#" class="footer-link">使用帮助</a>
            <a href="#" class="footer-link">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import SearchBar from '../components/SearchBar.vue';

const router = useRouter();

const tools = computed(() => [
  {
    id: 1,
    name: 'WebP 转换器',
    description: '批量将图片转换为WebP格式，支持拖拽上传和批量处理',
    icon: 'fas fa-images',
    path: '/webp-converter'
  },
  {
    id: 2,
    name: '文本比对',
    description: '智能比较两段文本的差异，高亮显示变化内容',
    icon: 'fas fa-file-alt',
    path: '/text-diff'
  },
  {
    id: 3,
    name: '时间戳转换',
    description: '在时间戳和日期格式之间进行快速转换',
    icon: 'fas fa-clock',
    path: '/timestamp'
  },
  {
    id: 4,
    name: 'Base64 编解码',
    description: '文本和Base64编码之间的相互转换，支持图片预览',
    icon: 'fas fa-code',
    path: '/base64'
  },
  {
    id: 5,
    name: 'API 请求测试',
    description: '轻量级的HTTP请求客户端，支持多种请求方式',
    icon: 'fas fa-paper-plane',
    path: '/api-tester'
  }
]);

const navigateTo = (path) => {
  router.push(path);
};

// 主题状态
const currentTheme = ref('default-theme');

// 主题判断
const isTechTheme = computed(() => {
  return currentTheme.value === 'tech-theme';
});

// 监听主题变化
function updateTheme() {
  const theme = localStorage.getItem('theme') || 'default-theme';
  currentTheme.value = theme;
}

// 监听 localStorage 变化
function handleStorageChange(e) {
  if (e.key === 'theme') {
    updateTheme();
  }
}

onMounted(() => {
  updateTheme();
  window.addEventListener('storage', handleStorageChange);
  
  // 监听自定义事件（用于同页面内的主题切换）
  window.addEventListener('themeChanged', updateTheme);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('themeChanged', updateTheme);
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
}

.home-container.tech-theme {
  background: #0a1833;
  background-image:
    radial-gradient(circle at 20% 80%, #1e90ff 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, #00e0ff 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, #7f7fff 0%, transparent 50%);
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.home-container.tech-theme .floating-shape {
  background: linear-gradient(135deg, #1e90ff, #00e0ff);
  opacity: 0.18;
  animation: techFloat 8s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes techFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.18;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.35;
  }
}

.content-wrapper {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero-section {
  padding: 80px 20px 60px;
  text-align: center;
  color: white;
}

/* 科技风主题下的英雄区域 */
.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* 科技风主题下的标题 */
.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.tools-section {
  padding: 2rem 1rem;
  flex: 1;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 15px;
  font-weight: 600;
}

.section-header p {
  font-size: 1.1rem;
  color: #666;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.tool-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  height: 260px;
  min-height: 200px;
}

.tool-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tool-card:hover .card-background {
  opacity: 0.05;
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tool-icon {
  width: 68px;
  height: 68px;
  background: none;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

.tool-icon i {
  font-size: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tool-info {
  flex: 1;
}

.tool-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.tool-card:hover .tool-name {
  color: #667eea;
}

.tool-description {
  color: #666;
  line-height: 1.5;
  margin: 0;
  font-size: 0.95rem;
}

.tool-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.action-text {
  color: #667eea;
  font-weight: 500;
  font-size: 0.9rem;
}

.tool-action i {
  color: #667eea;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.tool-card:hover .tool-action i {
  transform: translateX(5px);
}

.card-hover-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.tool-card:hover .card-hover-effect {
  left: 100%;
}

.footer-section {
  padding: 30px 20px;
  text-align: center;
  position: relative;
  z-index: 2;
  margin-top: auto;
  color: white; /* 科技风下颜色可能需要调整 */
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-links {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.footer-link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-link:hover {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .tools-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .hero-title {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 15px 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
    flex-direction: column;
    gap: 10px;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-stats {
    gap: 30px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .stat-item {
    min-width: 100px;
  }
  
  .tools-section {
    padding: 1.5rem 0.5rem;
  }
  
  .section-header {
    padding: 0 0.5rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .section-header p {
    font-size: 1rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
  }
  
  .tool-card {
    height: auto;
    min-height: 180px;
  }
  
  .card-content {
    padding: 25px 20px;
  }
  
  .tool-icon {
    width: 60px;
    height: 60px;
  }
  
  .tool-icon i {
    font-size: 40px;
  }
  
  .tool-name {
    font-size: 1.3rem;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 50px 10px 30px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 30px;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .stat-item {
    min-width: auto;
  }
  
  .tools-section {
    padding: 1rem 0;
  }
  
  .section-header {
    padding: 0 10px;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .tools-grid {
    padding: 0 10px;
  }
  
  .tool-card {
    margin: 0;
  }
  
  .card-content {
    padding: 20px 15px;
  }
  
  .tool-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 15px;
  }
  
  .tool-icon i {
    font-size: 35px;
  }
  
  .tool-name {
    font-size: 1.2rem;
  }
  
  .tool-description {
    font-size: 0.9rem;
  }
  
  .footer-section {
    padding: 20px 10px;
  }
  
  .footer-links {
    gap: 15px;
  }
}

/* 确保SiteStatusChecker不会遮挡内容 */
@media (max-width: 768px) {
  .footer-section {
    margin-bottom: 80px; /* 为固定定位的SiteStatusChecker留出空间 */
  }
}
</style> 