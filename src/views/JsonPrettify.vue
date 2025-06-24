<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-code"></i> JSON美化</h1>
      <p>格式化JSON数据，支持树状展示和复制功能</p>
    </header>

    <div class="json-container">
      <div class="input-section">
        <div class="input-group">
          <label for="jsonInput">JSON输入</label>
          <textarea
            id="jsonInput"
            v-model="jsonInput"
            placeholder="请输入JSON数据..."
            @input="parseJson"
          ></textarea>
        </div>

        <div class="controls">
          <div class="action-buttons">
            <button @click="clearInput" class="btn btn-secondary">
              <i class="fas fa-trash"></i> 清空输入
            </button>
            <button @click="formatJson" class="btn btn-primary">
              <i class="fas fa-magic"></i> 格式化
            </button>
            <button
              @click="copyAllJson"
              class="btn btn-success"
              :disabled="!isValidJson"
            >
              <i class="fas fa-copy"></i> 复制全部
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">
        <p><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>
      </div>

      <div v-if="isValidJson && parsedJson" class="json-result">
        <div class="result-header">
          <h3>JSON树状视图</h3>
          <div class="tree-controls">
            <button @click="expandAll" class="btn btn-sm">
              <i class="fas fa-expand-arrows-alt"></i> 全部展开
            </button>
            <button @click="collapseAll" class="btn btn-sm">
              <i class="fas fa-compress-arrows-alt"></i> 全部折叠
            </button>
          </div>
        </div>

        <div class="json-tree-container">
          <EnhancedJsonViewer :data="parsedJson" ref="jsonViewer" />
        </div>
      </div>

      <div v-else-if="jsonInput && !error" class="placeholder">
        <p>请输入有效的JSON数据</p>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <div v-if="copyMessage" class="copy-toast" :class="{ show: showCopyToast }">
      {{ copyMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import EnhancedJsonViewer from "../components/EnhancedJsonViewer.vue";

const jsonInput = ref("");
const parsedJson = ref(null);
const error = ref("");
const copyMessage = ref("");
const showCopyToast = ref(false);
const jsonViewer = ref(null);

const isValidJson = computed(() => {
  return parsedJson.value !== null && !error.value;
});

const parseJson = () => {
  if (!jsonInput.value.trim()) {
    parsedJson.value = null;
    error.value = "";
    return;
  }

  try {
    parsedJson.value = JSON.parse(jsonInput.value);
    error.value = "";
  } catch (err) {
    error.value = "JSON格式错误: " + err.message;
    parsedJson.value = null;
  }
};

const formatJson = () => {
  if (isValidJson.value) {
    jsonInput.value = JSON.stringify(parsedJson.value, null, 2);
  }
};

const clearInput = () => {
  jsonInput.value = "";
  parsedJson.value = null;
  error.value = "";
};

const copyAllJson = async () => {
  if (!isValidJson.value) return;

  try {
    const jsonString = JSON.stringify(parsedJson.value, null, 2);
    await navigator.clipboard.writeText(jsonString);
    showCopyMessage("JSON已复制到剪贴板");
  } catch (err) {
    console.error("复制失败:", err);
    showCopyMessage("复制失败");
  }
};

const expandAll = () => {
  if (jsonViewer.value) {
    jsonViewer.value.expandAll();
  }
};

const collapseAll = () => {
  if (jsonViewer.value) {
    jsonViewer.value.collapseAll();
  }
};

const showCopyMessage = (message) => {
  copyMessage.value = message;
  showCopyToast.value = true;
  setTimeout(() => {
    showCopyToast.value = false;
  }, 2000);
};

// 监听复制事件
const handleJsonCopied = (event) => {
  showCopyMessage(event.detail.message);
};

// 页面加载时解析输入并添加事件监听
parseJson();

// 添加和移除事件监听器
window.addEventListener("json-copied", handleJsonCopied);

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener("json-copied", handleJsonCopied);
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

.json-container {
  max-width: 1400px;
  margin: 0 auto;
}

.input-section {
  background: white;
  padding: 25px 35px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  min-width: 1000px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  display: block;
}

.input-group textarea {
  width: 100%;
  min-height: 200px;
  resize: vertical;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}

.controls {
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 10px;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.json-result {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.result-header h3 {
  margin: 0;
  color: #333;
}

.tree-controls {
  display: flex;
  gap: 8px;
}

.json-tree-container {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
}

.error-message i {
  margin-right: 8px;
}

.placeholder {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.copy-toast {
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
  z-index: 1000;
  white-space: nowrap;
}

.copy-toast.show {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

@media (max-width: 768px) {
  .input-section {
    min-width: auto;
    padding: 20px;
  }

  .result-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
