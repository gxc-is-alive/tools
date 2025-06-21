<template>
  <div class="home-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>

    <div class="content-wrapper">
      <header class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="title-icon">🛠️</span>
            在线工具箱
          </h1>
          <p class="hero-subtitle">一个集成了多种实用工具的在线平台，让工作更高效</p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">5</span>
              <span class="stat-label">实用工具</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">100%</span>
              <span class="stat-label">免费使用</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">在线服务</span>
            </div>
          </div>
        </div>
      </header>

      <main class="tools-section">
        <div class="section-header">
          <h2>选择工具</h2>
          <p>点击下方卡片开始使用您需要的工具</p>
        </div>

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
import { useRouter } from 'vue-router'

const router = useRouter()

const tools = [
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
]

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
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
}

.title-icon {
  font-size: 3rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

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
}

.stat-item {
  text-align: center;
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
  flex: 1;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px 30px 0 0;
  margin-top: 40px;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
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
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
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

.tool-card:hover .tool-icon {
  transform: scale(1.1) rotate(5deg);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 30px 20px;
  text-align: center;
  color: white;
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

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
    flex-direction: column;
    gap: 10px;
  }
  
  .title-icon {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    gap: 30px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .tool-card {
    height: auto;
    min-height: 180px;
  }
  
  .card-content {
    padding: 25px;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 15px 40px;
  }
  
  .tools-section {
    padding: 40px 15px;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .tool-card {
    margin: 0 10px;
  }
}
</style> 