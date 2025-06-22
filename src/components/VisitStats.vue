<template>
  <div class="visit-stats">
    <!-- 触发按钮 -->
    <button @click="togglePanel" class="stats-trigger">
      📊 访问统计
    </button>

    <!-- 统计面板 -->
    <div v-if="isOpen" class="stats-panel">
      <div class="stats-header">
        <h3>📊 访问统计</h3>
        <button @click="togglePanel" class="close-btn">×</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在加载统计数据...</p>
      </div>

      <!-- 统计内容 -->
      <div v-else class="stats-content">
        <!-- 筛选器 -->
        <div class="filter-section">
          <label>统计周期：</label>
          <select v-model="selectedPeriod" @change="filterData">
            <option value="1">最近1天</option>
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
        </div>

        <!-- 核心指标 -->
        <div class="core-metrics">
          <div class="metric-card">
            <div class="metric-value">{{ totalVisits }}</div>
            <div class="metric-label">总访问量</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ uniqueIPs }}</div>
            <div class="metric-label">独立IP</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ uniqueRegions }}</div>
            <div class="metric-label">地区数</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ todayVisits }}</div>
            <div class="metric-label">今日访问</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ avgDuration }}分</div>
            <div class="metric-label">平均时长</div>
          </div>
        </div>

        <!-- 设备统计 -->
        <div class="device-stats">
          <h4>📱 设备分布</h4>
          <div class="device-bars">
            <div class="device-bar">
              <span>桌面端</span>
              <div class="bar">
                <div class="bar-fill" :style="{ width: getDevicePercentage('desktop') + '%' }"></div>
              </div>
              <span>{{ stats.deviceStats.desktop }}</span>
            </div>
            <div class="device-bar">
              <span>移动端</span>
              <div class="bar">
                <div class="bar-fill" :style="{ width: getDevicePercentage('mobile') + '%' }"></div>
              </div>
              <span>{{ stats.deviceStats.mobile }}</span>
            </div>
            <div class="device-bar">
              <span>平板</span>
              <div class="bar">
                <div class="bar-fill" :style="{ width: getDevicePercentage('tablet') + '%' }"></div>
              </div>
              <span>{{ stats.deviceStats.tablet }}</span>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-section">
          <div class="chart-container">
            <h4>🕐 访问时间分布</h4>
            <canvas ref="timeChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-container">
            <h4>🌍 地区分布</h4>
            <canvas ref="regionChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- 页面访问统计 -->
        <div class="page-stats">
          <h4>📄 页面访问统计</h4>
          <div class="page-list">
            <div v-for="(count, page) in stats.pageViews" :key="page" class="page-item">
              <span class="page-name">{{ page }}</span>
              <span class="page-count">{{ count }}次</span>
            </div>
          </div>
        </div>

        <!-- 访问记录表格 -->
        <div class="records-section">
          <h4>📋 最近访问记录</h4>
          <div class="records-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>地区</th>
                  <th>城市</th>
                  <th>IP地址</th>
                  <th>页面</th>
                  <th>时长</th>
                  <th>设备</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredRecords" :key="record.id">
                  <td>{{ formatTime(record.timestamp) }}</td>
                  <td>{{ record.region }}</td>
                  <td>{{ record.city }}</td>
                  <td>{{ maskIP(record.ip) }}</td>
                  <td>{{ record.page }}</td>
                  <td>{{ formatDuration(record.duration) }}</td>
                  <td>
                    <span :class="getDeviceClass(record.device)">
                      {{ getDeviceIcon(record.device) }} {{ record.device }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="exportData" class="action-btn export-btn">
            📥 导出数据
          </button>
          <button @click="clearData" class="action-btn clear-btn">
            🗑️ 清除数据
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import visitStatsService from '../services/visitStats.js';

const isOpen = ref(false);
const selectedPeriod = ref('7');
const timeChart = ref(null);
const regionChart = ref(null);
const loading = ref(false);

// 统计数据
const stats = ref({
  totalVisits: 0,
  uniqueIPs: 0,
  uniqueRegions: 0,
  todayVisits: 0,
  avgDuration: 0,
  timeDistribution: new Array(24).fill(0),
  regionDistribution: {},
  pageViews: {},
  deviceStats: { desktop: 0, mobile: 0, tablet: 0 },
  locationStats: {}
});

// 访问记录
const visitRecords = ref([]);

// 计算属性
const totalVisits = computed(() => stats.value.totalVisits);
const uniqueRegions = computed(() => stats.value.uniqueRegions);
const todayVisits = computed(() => stats.value.todayVisits);
const avgDuration = computed(() => stats.value.avgDuration);

const filteredRecords = computed(() => {
  return visitRecords.value.slice(0, 20); // 只显示最近20条记录
});

// 设备相关方法
const getDevicePercentage = (deviceType) => {
  const total = stats.value.deviceStats.desktop + stats.value.deviceStats.mobile + stats.value.deviceStats.tablet;
  if (total === 0) return 0;
  return Math.round((stats.value.deviceStats[deviceType] / total) * 100);
};

const getDeviceClass = (device) => {
  return `device-${device}`;
};

const getDeviceIcon = (device) => {
  const icons = {
    desktop: '🖥️',
    mobile: '📱',
    tablet: '📱'
  };
  return icons[device] || '💻';
};

// 方法
const togglePanel = () => {
  console.log('togglePanel clicked, current isOpen:', isOpen.value);
  isOpen.value = !isOpen.value;
  console.log('isOpen changed to:', isOpen.value);
  
  if (isOpen.value) {
    console.log('Loading stats...');
    loadStats();
    setTimeout(() => {
      console.log('Initializing charts...');
      initCharts();
    }, 100);
  }
};

const loadStats = async () => {
  loading.value = true;
  try {
    const days = parseInt(selectedPeriod.value);
    const newStats = await visitStatsService.getStats(days);
    stats.value = newStats;
    
    // 获取访问记录
    const records = await visitStatsService.getRecords(days, 50);
    visitRecords.value = records;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const filterData = async () => {
  await loadStats();
  if (isOpen.value) {
    setTimeout(() => {
      initCharts();
    }, 100);
  }
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const maskIP = (ip) => {
  if (!ip || ip === 'unknown') return '***.***.***.***';
  return ip.replace(/\d+\.\d+\.\d+\.(\d+)/, '***.***.***.$1');
};

const formatDuration = (seconds) => {
  if (!seconds) return '0分0秒';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

// 图表初始化
const initCharts = () => {
  initTimeChart();
  initRegionChart();
};

const initTimeChart = () => {
  const ctx = timeChart.value?.getContext('2d');
  if (!ctx) return;
  
  // 清除旧图表
  ctx.clearRect(0, 0, 400, 200);
  
  const hourStats = stats.value.timeDistribution;
  const maxValue = Math.max(...hourStats);
  const barWidth = 350 / 24;
  const barHeight = 150;
  
  ctx.fillStyle = '#667eea';
  hourStats.forEach((count, hour) => {
    const height = maxValue > 0 ? (count / maxValue) * barHeight : 0;
    const x = 25 + hour * barWidth;
    const y = 175 - height;
    
    ctx.fillRect(x, y, barWidth - 2, height);
    
    // 绘制数值
    if (count > 0) {
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(count, x + barWidth/2, y - 5);
      ctx.fillStyle = '#667eea';
    }
  });
  
  // 绘制坐标轴
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(25, 175);
  ctx.lineTo(375, 175);
  ctx.stroke();
  
  // 绘制小时标签
  ctx.fillStyle = '#666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  for (let i = 0; i < 24; i += 3) {
    const x = 25 + i * barWidth + barWidth/2;
    ctx.fillText(`${i}:00`, x, 190);
  }
};

const initRegionChart = () => {
  const ctx = regionChart.value?.getContext('2d');
  if (!ctx) return;
  
  // 清除旧图表
  ctx.clearRect(0, 0, 400, 200);
  
  const regionStats = stats.value.regionDistribution;
  const regions = Object.keys(regionStats);
  const values = Object.values(regionStats);
  const total = values.reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    // 没有数据时显示提示
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', 200, 100);
    return;
  }
  
  // 绘制饼图
  const centerX = 200;
  const centerY = 100;
  const radius = 60;
  
  let currentAngle = 0;
  const colors = ['#667eea', '#764ba2', '#f093fb', '#1e90ff', '#00e0ff', '#7f7fff', '#ff6b6b', '#4ecdc4'];
  
  regions.forEach((region, index) => {
    const percentage = values[index] / total;
    const angle = percentage * 2 * Math.PI;
    
    // 绘制扇形
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
    ctx.closePath();
    ctx.fill();
    
    // 绘制标签
    const labelAngle = currentAngle + angle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
    const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
    
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(region, labelX, labelY);
    ctx.fillText(`${Math.round(percentage * 100)}%`, labelX, labelY + 15);
    
    currentAngle += angle;
  });
};

// 导出数据
const exportData = async () => {
  const success = await visitStatsService.exportData();
  if (success) {
    alert('数据导出成功！');
  } else {
    alert('数据导出失败，请重试。');
  }
};

// 清除数据
const clearData = async () => {
  if (confirm('确定要清除所有统计数据吗？此操作不可恢复！')) {
    const success = await visitStatsService.clearData();
    if (success) {
      alert('数据清除成功！');
      await loadStats();
    } else {
      alert('数据清除失败，请重试。');
    }
  }
};

// 监听周期变化
watch(selectedPeriod, () => {
  if (isOpen.value) {
    loadStats();
    setTimeout(() => {
      initCharts();
    }, 100);
  }
});

onMounted(() => {
  // 组件挂载时初始化统计数据
  loadStats();
});

onUnmounted(() => {
  // 清理工作
});
</script>

<style scoped>
.visit-stats {
  position: relative;
}

.stats-trigger {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  min-width: 120px;
}

.stats-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.stats-panel {
  position: absolute;
  bottom: 0;
  right: calc(100% + 15px); /* Position to the left of the button */
  width: 90vw;
  max-width: 800px; /* Adjust max-width for panel */
  height: 90vh;
  max-height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1001;
  transform: translateX(20px) scale(0.95);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  transform-origin: bottom right;
}

.visit-stats.is-open .stats-panel,
.visit-stats:hover .stats-panel { /* Allow hover to open for desktop */
  transform: translateX(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-content {
  padding: 30px;
  max-height: calc(90vh - 80px);
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-section label {
  font-weight: 600;
  color: #333;
}

.filter-section select {
  padding: 8px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-section select:focus {
  outline: none;
  border-color: #667eea;
}

.core-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  border: 1px solid #e1e5e9;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.device-stats {
  margin-bottom: 30px;
}

.device-stats h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.device-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.device-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.device-bar span:first-child {
  width: 60px;
  font-size: 14px;
  color: #333;
}

.device-bar span:last-child {
  width: 40px;
  text-align: right;
  font-weight: 600;
  color: #667eea;
}

.bar {
  flex: 1;
  height: 20px;
  background: #f1f3f4;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.chart-container {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 15px;
  border: 1px solid #e1e5e9;
}

.chart-container h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  text-align: center;
}

.chart-container canvas {
  display: block;
  margin: 0 auto;
  border-radius: 10px;
  background: white;
}

.page-stats {
  margin-bottom: 30px;
}

.page-stats h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.page-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.page-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.page-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.page-count {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.records-section {
  margin-bottom: 30px;
}

.records-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.records-table {
  background: #f8f9fa;
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid #e1e5e9;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th {
  background: #667eea;
  color: white;
  padding: 12px 15px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}

.records-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e1e5e9;
  font-size: 13px;
  color: #333;
}

.records-table tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.device-desktop {
  color: #28a745;
  font-weight: 500;
}

.device-mobile {
  color: #007bff;
  font-weight: 500;
}

.device-tablet {
  color: #6f42c1;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.clear-btn {
  background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-panel {
    width: 95vw;
    max-height: 95vh;
  }
  
  .stats-content {
    padding: 20px;
  }
  
  .core-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .records-table {
    font-size: 12px;
  }
  
  .records-table th,
  .records-table td {
    padding: 8px 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .core-metrics {
    grid-template-columns: 1fr;
  }
  
  .device-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .device-bar span:first-child,
  .device-bar span:last-child {
    width: auto;
  }
}
</style> 