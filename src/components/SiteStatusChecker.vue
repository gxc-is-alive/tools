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
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  position: relative;
}

.checker-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}
.status-badge.ok { background-color: #28a745; }
.status-badge.error { background-color: #dc3545; }
.status-badge.checking { background-color: #ffc107; }


.checker-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  transform-origin: bottom right;
}

.site-status-checker.is-open .checker-panel {
  transform: translateY(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  line-height: 1;
}

.panel-summary {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.summary-label.ok, .summary-value.ok { color: #28a745; }
.summary-label.error, .summary-value.error { color: #dc3545; }
.summary-label.checking, .summary-value.checking { color: #ffc107; }

.panel-body {
  padding: 10px 20px;
  flex-grow: 1;
}

.site-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.site-item {
  display: flex;
  align-items: center;
  padding: 12px 5px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}
.site-item:last-child {
  border-bottom: none;
}

.site-item.has-error {
  background-color: #fff2f2;
  border-radius: 5px;
}
.site-item.has-error .site-url {
  color: #dc3545;
  font-weight: 500;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}
.status-indicator.ok { background-color: #28a745; }
.status-indicator.error { background-color: #dc3545; }
.status-indicator.checking { background-color: #ffc107; }

.site-url {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
  color: #333;
  font-size: 0.9rem;
}

.site-url:hover {
  color: #667eea;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #ccc;
  cursor: pointer;
  margin-left: 10px;
  line-height: 1;
}
.remove-btn:hover {
  color: #dc3545;
}

.no-sites {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.add-site-form {
  display: flex;
  margin-top: 15px;
}
.add-site-form input {
  flex-grow: 1;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
  padding: 8px 12px;
  font-size: 0.9rem;
  outline: none;
}
.add-site-form input:focus {
  border-color: #667eea;
}
.add-site-form button {
  border: 1px solid #667eea;
  background-color: #667eea;
  color: white;
  padding: 0 15px;
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 0 5px 5px 0;
}

.panel-footer {
  padding: 15px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
}

.panel-footer p {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}

.refresh-btn {
  background: none;
  border: 1px solid #667eea;
  color: #667eea;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.8rem;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 