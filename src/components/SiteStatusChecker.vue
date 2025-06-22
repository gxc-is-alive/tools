<template>
  <div class="site-status-checker" :class="{ 'is-open': isOpen }">
    <div class="checker-toggle" @click="togglePanel" :title="toggleTooltipText">
      <i class="fas fa-network-wired"></i>
      <span v-if="overallStatus === 'ok'" class="status-badge ok"></span>
      <span v-else-if="overallStatus === 'error'" class="status-badge error"></span>
      <span v-else class="status-badge checking"></span>
    </div>

    <div class="checker-panel">
      <div class="panel-header">
        <h3>站点状态监控</h3>
        <button class="close-btn" @click="togglePanel">&times;</button>
      </div>

      <div class="panel-summary">
        <div class="summary-item">
          <span class="summary-label">总数</span>
          <span class="summary-value">{{ totalSites }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label ok">正常</span>
          <span class="summary-value ok">{{ okSites }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label error">异常</span>
          <span class="summary-value error">{{ errorSites }}</span>
        </div>
        <div v-if="checkingSites > 0" class="summary-item">
          <span class="summary-label checking">检查中</span>
          <span class="summary-value checking">{{ checkingSites }}</span>
        </div>
      </div>

      <div class="panel-body">
        <ul class="site-list">
          <li v-for="(site, index) in sites" :key="index" class="site-item" :class="{ 'has-error': site.status === 'error' }">
            <span class="site-status">
              <span v-if="site.status === 'ok'" class="status-indicator ok" title="访问正常"></span>
              <span v-else-if="site.status === 'error'" class="status-indicator error" :title="`访问异常: ${site.message}`"></span>
              <span v-else class="status-indicator checking" title="检查中..."></span>
            </span>
            <a :href="site.url" target="_blank" class="site-url">{{ site.url }}</a>
            <button class="remove-btn" @click="removeSite(index)">&times;</button>
          </li>
          <li v-if="sites.length === 0" class="no-sites">
            暂无监控站点
          </li>
        </ul>
        <div class="add-site-form">
          <input 
            type="text" 
            v-model="newSiteUrl" 
            placeholder="添加新网址, 如: https://example.com"
            @keyup.enter="addSite"
          />
          <button @click="addSite">+</button>
        </div>
      </div>
      <div class="panel-footer">
        <p>每 5 分钟自动刷新</p>
        <button class="refresh-btn" @click="checkAllSites" :disabled="isChecking">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': isChecking }"></i>
          {{ isChecking ? '检查中...' : '立即刷新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { commonApi } from '../services/api';

const sites = ref([]);
const newSiteUrl = ref('');
const isOpen = ref(false);
const isChecking = ref(false);
let intervalId = null;

const totalSites = computed(() => sites.value.length);
const okSites = computed(() => sites.value.filter(s => s.status === 'ok').length);
const errorSites = computed(() => sites.value.filter(s => s.status === 'error').length);
const checkingSites = computed(() => sites.value.filter(s => s.status === 'checking').length);
const errorSitesList = computed(() => sites.value.filter(s => s.status === 'error'));

const toggleTooltipText = computed(() => {
  if (errorSitesList.value.length > 0) {
    const failedUrls = errorSitesList.value.map(s => s.url).join(', ');
    return `异常站点: ${failedUrls}`;
  }
  if (checkingSites.value > 0) {
    return '正在检查站点状态...';
  }
  return '所有站点访问正常';
});

const overallStatus = computed(() => {
  if (sites.value.length === 0) return 'ok';
  if (errorSites.value > 0) return 'error';
  if (checkingSites.value > 0) return 'checking';
  return 'ok';
});

const loadSites = () => {
  const savedSites = localStorage.getItem('monitoredSites');
  if (savedSites) {
    sites.value = JSON.parse(savedSites);
  } else {
    // 首次加载时添加一个默认网址
    sites.value = [{ url: 'https://a.gxc1994.top', status: 'checking' }];
    saveSites();
  }
};

const saveSites = () => {
  localStorage.setItem('monitoredSites', JSON.stringify(sites.value));
};

const addSite = () => {
  let url = newSiteUrl.value.trim();
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (sites.value.some(site => site.url === url)) {
    alert('该网址已在监控列表中');
    return;
  }
  
  const newSite = { url, status: 'checking' };
  sites.value.push(newSite);
  saveSites();
  newSiteUrl.value = '';
  checkSiteStatus(newSite);
};

const removeSite = (index) => {
  sites.value.splice(index, 1);
  saveSites();
};

const checkSiteStatus = async (site) => {
  site.status = 'checking';
  try {
    const response = await commonApi.checkUrl(site.url);
    if (response.success) {
      site.status = 'ok';
    } else {
      site.status = 'error';
      site.message = response.message || '未知错误';
    }
  } catch (error) {
    site.status = 'error';
    site.message = error.message || '请求失败';
  }
};

const checkAllSites = async () => {
  if (isChecking.value) return;
  isChecking.value = true;
  await Promise.all(sites.value.map(site => checkSiteStatus(site)));
  isChecking.value = false;
  saveSites();
};

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

onMounted(() => {
  loadSites();
  checkAllSites();
  intervalId = setInterval(checkAllSites, 5 * 60 * 1000); // 5 minutes
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.site-status-checker {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.checker-toggle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  position: relative;
}

.checker-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.checker-toggle i {
  font-size: 20px;
}

.status-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-badge.ok {
  background: #28a745;
}

.status-badge.error {
  background: #dc3545;
}

.status-badge.checking {
  background: #ffc107;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.checker-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid #e2e8f0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.site-status-checker.is-open .checker-panel {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.panel-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e2e8f0;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 500;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.summary-label.ok, .summary-value.ok {
  color: #28a745;
}

.summary-label.error, .summary-value.error {
  color: #dc3545;
}

.summary-label.checking, .summary-value.checking {
  color: #ffc107;
}

.panel-body {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.site-list {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.site-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
}

.site-item:last-child {
  border-bottom: none;
}

.site-item:hover {
  background: #f8f9fa;
  margin: 0 -10px;
  padding: 10px;
  border-radius: 6px;
}

.site-item.has-error {
  background: #fff5f5;
}

.site-item.has-error:hover {
  background: #fed7d7;
}

.site-status {
  flex-shrink: 0;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #e2e8f0;
}

.status-indicator.ok {
  background: #28a745;
}

.status-indicator.error {
  background: #dc3545;
}

.status-indicator.checking {
  background: #ffc107;
  animation: pulse 1.5s infinite;
}

.site-url {
  flex: 1;
  color: #333;
  text-decoration: none;
  font-size: 13px;
  word-break: break-all;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.site-url:hover {
  color: #667eea;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}

.no-sites {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px 0;
}

.add-site-form {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.add-site-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease;
}

.add-site-form input:focus {
  border-color: #667eea;
}

.add-site-form button {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.add-site-form button:hover {
  background: #5a67d8;
}

.panel-footer {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.panel-footer p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.refresh-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
}

.refresh-btn:hover {
  background: #5a67d8;
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.refresh-btn i {
  font-size: 11px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .site-status-checker {
    bottom: 20px;
    right: 20px;
  }
  
  .checker-toggle {
    width: 50px;
    height: 50px;
  }
  
  .checker-toggle i {
    font-size: 18px;
  }
  
  .status-badge {
    width: 18px;
    height: 18px;
  }
  
  .checker-panel {
    bottom: 70px;
    right: -10px;
    width: 320px;
    max-height: 400px;
  }
  
  .panel-header {
    padding: 15px;
  }
  
  .panel-header h3 {
    font-size: 15px;
  }
  
  .panel-summary {
    padding: 12px 15px;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .summary-value {
    font-size: 16px;
  }
  
  .panel-body {
    padding: 15px;
    max-height: 250px;
  }
  
  .site-url {
    font-size: 12px;
  }
  
  .add-site-form input {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .add-site-form button {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .panel-footer {
    padding: 12px 15px;
  }
  
  .refresh-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .site-status-checker {
    bottom: 15px;
    right: 15px;
  }
  
  .checker-toggle {
    width: 45px;
    height: 45px;
  }
  
  .checker-toggle i {
    font-size: 16px;
  }
  
  .status-badge {
    width: 16px;
    height: 16px;
  }
  
  .checker-panel {
    bottom: 60px;
    right: -15px;
    width: 280px;
    max-height: 350px;
  }
  
  .panel-header {
    padding: 12px;
  }
  
  .panel-header h3 {
    font-size: 14px;
  }
  
  .panel-summary {
    padding: 10px 12px;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .summary-label {
    font-size: 10px;
  }
  
  .summary-value {
    font-size: 14px;
  }
  
  .panel-body {
    padding: 12px;
    max-height: 200px;
  }
  
  .site-item {
    padding: 8px 0;
  }
  
  .site-url {
    font-size: 11px;
  }
  
  .add-site-form {
    gap: 6px;
  }
  
  .add-site-form input {
    font-size: 11px;
    padding: 5px 8px;
  }
  
  .add-site-form button {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }
  
  .panel-footer {
    padding: 10px 12px;
  }
  
  .panel-footer p {
    font-size: 11px;
  }
  
  .refresh-btn {
    padding: 4px 8px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .checker-panel {
    width: 260px;
    right: -20px;
  }
  
  .panel-summary {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .summary-label {
    margin-bottom: 0;
  }
}
</style> 