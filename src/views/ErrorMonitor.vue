<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-bug"></i> 错误监控</h1>
      <p>实时监控和查看应用错误，支持错误上报和统计分析</p>
    </header>

    <div class="monitor-container">
      <!-- 控制面板 -->
      <div class="controls">
        <div class="control-group">
          <button
            @click="refreshErrors"
            class="btn btn-primary"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            {{ loading ? "刷新中..." : "刷新数据" }}
          </button>
          <button
            @click="clearAllErrors"
            class="btn btn-danger"
            :disabled="loading"
          >
            <i class="fas fa-trash"></i> 清空错误
          </button>
          <button @click="testError" class="btn btn-success">
            <i class="fas fa-vial"></i> 测试上报
          </button>
        </div>

        <div class="auto-refresh">
          <label>
            <input
              type="checkbox"
              v-model="autoRefresh"
              @change="toggleAutoRefresh"
            />
            自动刷新 (30秒)
          </label>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">{{ totalErrors }}</div>
          <div class="stat-label">总错误数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todayErrors }}</div>
          <div class="stat-label">今日错误</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ uniqueErrors }}</div>
          <div class="stat-label">独特错误</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ errors.length }}</div>
          <div class="stat-label">当前页面</div>
        </div>
      </div>

      <!-- 错误列表 -->
      <div class="error-list" v-if="errors.length > 0">
        <div
          v-for="error in errors"
          :key="error.id"
          class="error-item"
          @click="showErrorDetail(error)"
        >
          <div class="error-header">
            <div class="error-title">{{ error.message || "未知错误" }}</div>
            <div class="error-time">{{ formatTime(error.timestamp) }}</div>
          </div>

          <div class="error-details">
            <div class="error-url">
              <i class="fas fa-link"></i> {{ error.url || "未知URL" }}
            </div>
            <div class="error-stack" v-if="error.stack">
              <i class="fas fa-code"></i> {{ truncateStack(error.stack) }}
            </div>
          </div>

          <div class="error-meta">
            <span v-if="error.filename">
              <i class="fas fa-file"></i> {{ error.filename }}:{{
                error.line
              }}:{{ error.column }}
            </span>
            <span v-if="error.userId">
              <i class="fas fa-user"></i> {{ error.userId }}
            </span>
            <span v-if="error.ip">
              <i class="fas fa-map-marker-alt"></i> {{ error.ip }}
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <i class="fas fa-check-circle"></i>
        <h3>暂无错误记录</h3>
        <p>系统运行正常，没有发现错误。</p>
        <button @click="testError" class="btn btn-primary">
          <i class="fas fa-vial"></i> 测试错误上报
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>加载中...</p>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="currentPage <= 1" class="btn">
          <i class="fas fa-chevron-left"></i> 上一页
        </button>

        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>

        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="btn"
        >
          下一页 <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 错误详情弹窗 -->
    <div v-if="selectedError" class="modal-overlay" @click="closeErrorDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>错误详情</h3>
          <button @click="closeErrorDetail" class="btn btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>错误消息:</label>
                <span>{{ selectedError.message || "未知错误" }}</span>
              </div>
              <div class="detail-item">
                <label>发生时间:</label>
                <span>{{ formatTime(selectedError.timestamp, true) }}</span>
              </div>
              <div class="detail-item">
                <label>页面URL:</label>
                <span>{{ selectedError.url || "未知" }}</span>
              </div>
              <div class="detail-item" v-if="selectedError.filename">
                <label>错误位置:</label>
                <span
                  >{{ selectedError.filename }}:{{ selectedError.line }}:{{
                    selectedError.column
                  }}</span
                >
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedError.stack">
            <h4>错误堆栈</h4>
            <pre class="stack-trace">{{ selectedError.stack }}</pre>
          </div>

          <div class="detail-section">
            <h4>环境信息</h4>
            <div class="detail-grid">
              <div class="detail-item" v-if="selectedError.userAgent">
                <label>浏览器:</label>
                <span>{{ selectedError.userAgent }}</span>
              </div>
              <div class="detail-item" v-if="selectedError.userId">
                <label>用户ID:</label>
                <span>{{ selectedError.userId }}</span>
              </div>
              <div class="detail-item" v-if="selectedError.ip">
                <label>IP地址:</label>
                <span>{{ selectedError.ip }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedError.customData">
            <h4>自定义数据</h4>
            <pre class="custom-data">{{
              JSON.stringify(selectedError.customData, null, 2)
            }}</pre>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="copyErrorInfo" class="btn btn-primary">
            <i class="fas fa-copy"></i> 复制错误信息
          </button>
          <button @click="closeErrorDetail" class="btn btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div
      v-if="message"
      class="toast"
      :class="{ show: showToast, error: messageType === 'error' }"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const errors = ref([]);
const loading = ref(false);
const autoRefresh = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalErrors = ref(0);
const totalPages = ref(0);
const selectedError = ref(null);
const message = ref("");
const messageType = ref("success");
const showToast = ref(false);

let refreshInterval = null;

// 计算属性
const todayErrors = computed(() => {
  const today = new Date().toDateString();
  return errors.value.filter(
    (error) => new Date(error.timestamp).toDateString() === today
  ).length;
});

const uniqueErrors = computed(() => {
  const uniqueMessages = new Set(errors.value.map((error) => error.message));
  return uniqueMessages.size;
});

// 获取错误列表
const fetchErrors = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `/api/errors?page=${currentPage.value}&pageSize=${pageSize.value}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        errors.value = data.data || [];
        totalErrors.value = data.total || 0;
        totalPages.value = data.totalPages || 0;
      }
    } else {
      throw new Error("获取错误列表失败");
    }
  } catch (error) {
    console.error("获取错误列表失败:", error);
    showMessage("获取错误列表失败，请检查服务器连接", "error");
  } finally {
    loading.value = false;
  }
};

// 清空所有错误
const clearAllErrors = async () => {
  if (!confirm("确定要清空所有错误记录吗？")) return;

  loading.value = true;
  try {
    const response = await fetch("/api/errors", {
      method: "DELETE",
    });
    if (response.ok) {
      errors.value = [];
      totalErrors.value = 0;
      totalPages.value = 0;
      currentPage.value = 1;
      showMessage("所有错误记录已清空");
    } else {
      throw new Error("清空错误记录失败");
    }
  } catch (error) {
    console.error("清空错误记录失败:", error);
    showMessage("清空错误记录失败", "error");
  } finally {
    loading.value = false;
  }
};

// 测试错误上报
const testError = async () => {
  try {
    const errorData = {
      message: "这是一个测试错误",
      stack:
        "Error: 这是一个测试错误\n    at testError (ErrorMonitor.vue:123:45)",
      url: window.location.href,
      filename: "ErrorMonitor.vue",
      line: 123,
      column: 45,
      timestamp: new Date().toISOString(),
      userId: "test-user",
      customData: {
        action: "test-error",
        module: "error-monitor",
      },
    };

    const response = await fetch("/api/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    });

    if (response.ok) {
      showMessage("测试错误上报成功");
      // 延迟刷新以确保错误已保存
      setTimeout(() => {
        fetchErrors();
      }, 500);
    } else {
      throw new Error("测试错误上报失败");
    }
  } catch (error) {
    console.error("测试错误上报失败:", error);
    showMessage("测试错误上报失败，请检查服务器连接", "error");
  }
};

// 刷新错误列表
const refreshErrors = () => {
  fetchErrors();
};

// 切换自动刷新
const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval = setInterval(fetchErrors, 30000); // 30秒刷新一次
    showMessage("已启用自动刷新 (30秒)");
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    showMessage("已禁用自动刷新");
  }
};

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchErrors();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchErrors();
  }
};

// 显示错误详情
const showErrorDetail = (error) => {
  selectedError.value = error;
};

// 关闭错误详情
const closeErrorDetail = () => {
  selectedError.value = null;
};

// 复制错误信息
const copyErrorInfo = async () => {
  try {
    const errorInfo = JSON.stringify(selectedError.value, null, 2);
    await navigator.clipboard.writeText(errorInfo);
    showMessage("错误信息已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    showMessage("复制失败", "error");
  }
};

// 格式化时间
const formatTime = (timestamp, detailed = false) => {
  if (!timestamp) return "未知时间";

  const date = new Date(timestamp);
  if (detailed) {
    return date.toLocaleString("zh-CN");
  }

  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    // 1分钟内
    return "刚刚";
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString("zh-CN");
  }
};

// 截断堆栈信息
const truncateStack = (stack) => {
  if (!stack) return "";
  const lines = stack.split("\n");
  return lines.slice(0, 2).join("\n") + (lines.length > 2 ? "..." : "");
};

// 显示消息
const showMessage = (text, type = "success") => {
  message.value = text;
  messageType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// 生命周期
onMounted(() => {
  fetchErrors();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.back-link {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  text-decoration: none;
  color: #007bff;
  font-weight: 600;
}

.back-link:hover {
  color: #0056b3;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #333;
}

header p {
  font-size: 1.1rem;
  color: #666;
}

.monitor-container {
  max-width: 1400px;
  margin: 0 auto;
}

.controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.control-group {
  display: flex;
  gap: 10px;
}

.auto-refresh label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-close {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 1.1em;
}

.error-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.error-item {
  border-bottom: 1px solid #eee;
  padding: 20px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.error-item:hover {
  background-color: #f8f9fa;
}

.error-item:last-child {
  border-bottom: none;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 15px;
}

.error-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  flex: 1;
  word-break: break-word;
}

.error-time {
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
}

.error-details {
  color: #666;
  font-size: 0.95em;
  line-height: 1.5;
  margin-bottom: 10px;
}

.error-url,
.error-stack {
  margin-bottom: 5px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.error-stack {
  font-family: "Courier New", monospace;
  white-space: pre-line;
}

.error-meta {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 0.85em;
  color: #888;
}

.error-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 20px;
}

.loading-state i {
  font-size: 3rem;
  color: #007bff;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 30px 0;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1em;
}

.detail-grid {
  display: grid;
  gap: 15px;
}

.detail-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: start;
}

.detail-item label {
  font-weight: 600;
  color: #666;
}

.detail-item span {
  word-break: break-all;
}

.stack-trace,
.custom-data {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  background: #28a745;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1100;
  white-space: nowrap;
}

.toast.show {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.toast.error {
  background: #dc3545;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    flex-wrap: wrap;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .error-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .error-meta {
    flex-direction: column;
    gap: 5px;
  }

  .detail-item {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
