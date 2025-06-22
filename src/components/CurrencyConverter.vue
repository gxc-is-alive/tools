<template>
  <div class="currency-converter" :class="{ 'is-open': isOpen }">
    <div class="converter-toggle" @click="togglePanel" title="澳元 -> 人民币汇率">
      <i class="fas fa-coins"></i>
    </div>

    <div class="converter-panel">
      <div class="panel-header">
        <h4><i class="fas fa-dollar-sign"></i> 汇率查询</h4>
        <button class="close-btn" @click="togglePanel">&times;</button>
      </div>
      <div class="panel-body">
        <div v-if="error" class="error-message">
          <p>汇率加载失败:</p>
          <p>{{ error }}</p>
        </div>
        <div v-else class="rate-display">
          <div class="rate-from">
            <span class="currency-flag">🇦🇺</span>
            <span class="currency-code">AUD</span>
          </div>
          <div class="rate-arrow">
            <i class="fas fa-long-arrow-alt-right"></i>
          </div>
          <div class="rate-to">
            <span class="currency-flag">🇨🇳</span>
            <span class="currency-code">CNY</span>
          </div>
          <div class="rate-value">
            {{ isLoading ? '...' : rate }}
          </div>
          <div class="rate-time">
            更新于: {{ lastUpdated }}
          </div>
        </div>
      </div>
      <div class="panel-footer">
        <button class="refresh-btn" @click="fetchRate" :disabled="isLoading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
          {{ isLoading ? '刷新中' : '刷新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { commonApi } from '../services/api';

const isOpen = ref(false);
const isLoading = ref(false);
const rate = ref('N/A');
const lastUpdated = ref('N/A');
const error = ref(null);

const togglePanel = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && rate.value === 'N/A') {
    fetchRate();
  }
};

const fetchRate = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  error.value = null;

  try {
    const response = await commonApi.getExchangeRate();
    if (response.success) {
      rate.value = response.rate.toFixed(4);
      lastUpdated.value = new Date(response.date).toLocaleString('zh-CN');
    } else {
      throw new Error(response.message || '获取汇率失败');
    }
  } catch (err) {
    error.value = err.message;
    rate.value = 'Error';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // 可以在挂载时自动获取一次，或者等待用户点击
  // fetchRate();
});
</script>

<style scoped>
.currency-converter {
  position: fixed;
  bottom: 100px; /* 调整位置，避免与SiteStatusChecker重叠 */
  right: 30px;
  z-index: 999;
}

.converter-toggle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1abc9c, #16a085);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.converter-toggle:hover {
  transform: scale(1.1);
}

.converter-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 300px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  transform-origin: bottom right;
}

.currency-converter.is-open .converter-panel {
  transform: translateY(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f8f9fa;
  border-radius: 15px 15px 0 0;
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.panel-header .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.panel-header .close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.panel-body {
  padding: 20px;
}

.rate-display {
  text-align: center;
}

.rate-from, .rate-to {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.currency-flag {
  font-size: 2rem;
  margin-right: 10px;
}

.currency-code {
  font-size: 1.2rem;
  font-weight: 500;
}

.rate-arrow {
  font-size: 1.5rem;
  color: #ccc;
  margin: 5px 0;
}

.rate-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1abc9c;
  margin: 10px 0;
}

.rate-time {
  font-size: 0.8rem;
  color: #999;
}

.error-message {
  text-align: center;
  color: #dc3545;
}

.error-message p {
  margin: 5px 0;
}

.panel-footer {
  padding: 10px 15px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.refresh-btn {
  background: #1abc9c;
  border: none;
  color: white;
  border-radius: 5px;
  padding: 8px 15px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
}

.refresh-btn:hover {
  background: #16a085;
}

.refresh-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .currency-converter {
    bottom: 90px;
    right: 20px;
  }
  
  .converter-toggle {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .converter-panel {
    bottom: 60px;
    right: -10px;
    width: 280px;
  }
  
  .panel-header {
    padding: 8px 12px;
  }
  
  .panel-header h4 {
    font-size: 0.9rem;
  }
  
  .panel-body {
    padding: 15px;
  }
  
  .currency-flag {
    font-size: 1.5rem;
  }
  
  .currency-code {
    font-size: 1rem;
  }
  
  .rate-value {
    font-size: 2rem;
  }
  
  .refresh-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .currency-converter {
    bottom: 80px;
    right: 15px;
  }
  
  .converter-toggle {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
  
  .converter-panel {
    bottom: 55px;
    right: -15px;
    width: 260px;
  }
  
  .panel-header {
    padding: 6px 10px;
  }
  
  .panel-header h4 {
    font-size: 0.85rem;
  }
  
  .panel-body {
    padding: 12px;
  }
  
  .currency-flag {
    font-size: 1.3rem;
  }
  
  .currency-code {
    font-size: 0.9rem;
  }
  
  .rate-value {
    font-size: 1.8rem;
  }
  
  .rate-time {
    font-size: 0.75rem;
  }
  
  .refresh-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
}

@media (max-width: 360px) {
  .converter-panel {
    width: 240px;
    right: -20px;
  }
  
  .rate-value {
    font-size: 1.6rem;
  }
}
</style> 