<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-file-alt"></i> 文本比对</h1>
      <p>比较两段文本的差异，高亮显示变化</p>
    </header>

    <div class="diff-container">
      <div class="input-section">
        <div class="text-inputs">
          <div class="input-group">
            <label for="text1">原始文本</label>
            <textarea
              id="text1"
              v-model="text1"
              placeholder="请输入原始文本..."
              @input="compareTexts"
            ></textarea>
          </div>

          <div class="input-group">
            <label for="text2">对比文本</label>
            <textarea
              id="text2"
              v-model="text2"
              placeholder="请输入对比文本..."
              @input="compareTexts"
            ></textarea>
          </div>
        </div>

        <div class="controls">
          <div class="algorithm-selector">
            <label for="algorithm">比对算法:</label>
            <select
              id="algorithm"
              v-model="selectedAlgorithm"
              @change="compareTexts"
            >
              <option value="diff">diff库 (推荐)</option>
              <option value="optimized">优化算法</option>
              <option value="simple">简单算法</option>
            </select>
          </div>

          <div class="action-buttons">
            <button @click="clearTexts" class="btn btn-secondary">
              <i class="fas fa-trash"></i> 清空
            </button>
            <button @click="swapTexts" class="btn btn-secondary">
              <i class="fas fa-exchange-alt"></i> 交换
            </button>
          </div>
        </div>
      </div>

      <div v-if="diffResult" class="diff-result">
        <div class="result-header">
          <h3>比对结果</h3>
          <div class="stats">
            <span class="stat-item">
              <i class="fas fa-plus text-success"></i> 新增: {{ stats.added }}
            </span>
            <span class="stat-item">
              <i class="fas fa-minus text-danger"></i> 删除: {{ stats.removed }}
            </span>
            <span class="stat-item">
              <i class="fas fa-equals text-info"></i> 相同:
              {{ stats.unchanged }}
            </span>
          </div>
        </div>

        <div class="diff-content" v-html="diffResult"></div>
      </div>

      <div v-else-if="text1 || text2" class="no-diff">
        <p>输入两段文本以开始比对</p>
      </div>

      <div v-if="error" class="error-message">
        <p><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>
      </div>

      <div v-if="usingFallback" class="fallback-notice">
        <p><i class="fas fa-info-circle"></i> 使用备用比对算法</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { simpleCharDiffV2, optimizedCharDiff } from "../utils/diff.js";

const text1 = ref("");
const text2 = ref("");
const diffResult = ref("");
const stats = ref({ added: 0, removed: 0, unchanged: 0 });
const error = ref("");
const usingFallback = ref(false);
const selectedAlgorithm = ref("diff");
let Diff = null;

// 尝试加载diff库
onMounted(async () => {
  try {
    const diffModule = await import("diff");
    Diff = diffModule.default || diffModule;
    console.log("diff库加载成功");
  } catch (err) {
    console.warn("diff库加载失败，使用备用方案:", err);
    usingFallback.value = true;
    selectedAlgorithm.value = "optimized";
  }
});

const compareTexts = () => {
  if (!text1.value && !text2.value) {
    diffResult.value = "";
    error.value = "";
    return;
  }

  try {
    let diff;

    if (
      selectedAlgorithm.value === "diff" &&
      Diff &&
      typeof Diff.diffLines === "function"
    ) {
      // 使用diff库 - 行级比对
      diff = Diff.diffLines(text1.value, text2.value, { newlineIsToken: true });
    } else if (selectedAlgorithm.value === "optimized") {
      // 使用优化算法
      diff = optimizedCharDiff(text1.value, text2.value);
    } else {
      // 使用简单算法
      diff = simpleCharDiffV2(text1.value, text2.value);
    }

    let result = "";
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    // 检查是否完全相同
    if (diff.length === 1 && !diff[0].added && !diff[0].removed) {
      result =
        '<div style="color: #27ae60; font-weight: bold;">两段文本完全相同。</div>';
      stats.value = {
        added: 0,
        removed: 0,
        unchanged: text1.value.length,
      };
    } else {
      diff.forEach((part) => {
        if (part.added) {
          result += `<ins style="background-color: #d4edda; color: #155724; text-decoration: none; padding: 2px 4px; border-radius: 3px;">${escapeHtml(
            part.value
          )}</ins>`;
          addedCount += part.value.length;
        } else if (part.removed) {
          result += `<del style="background-color: #f8d7da; color: #721c24; padding: 2px 4px; border-radius: 3px;">${escapeHtml(
            part.value
          )}</del>`;
          removedCount += part.value.length;
        } else {
          result += `<span style="color: #333;">${escapeHtml(
            part.value
          )}</span>`;
          unchangedCount += part.value.length;
        }
      });

      stats.value = {
        added: addedCount,
        removed: removedCount,
        unchanged: unchangedCount,
      };
    }

    diffResult.value = result;
    error.value = "";
  } catch (err) {
    console.error("文本比对失败:", err);
    error.value = "比对过程中出现错误，请检查输入内容";
    diffResult.value = "";
  }
};

// HTML转义函数
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const clearTexts = () => {
  text1.value = "";
  text2.value = "";
  diffResult.value = "";
  stats.value = { added: 0, removed: 0, unchanged: 0 };
  error.value = "";
};

const swapTexts = () => {
  const temp = text1.value;
  text1.value = text2.value;
  text2.value = temp;
  compareTexts();
};
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

.diff-container {
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

.text-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.input-group textarea {
  width: 100%;
  min-height: 300px;
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
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.algorithm-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.algorithm-selector label {
  font-weight: 600;
  color: #333;
}

.algorithm-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.diff-result {
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

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.text-info {
  color: #17a2b8;
}

.diff-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
}

/* 比对结果的样式 */
.diff-content :deep(ins) {
  background-color: #d4edda;
  color: #155724;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  margin: 2px 0;
  border-left: 4px solid #28a745;
}

.diff-content :deep(del) {
  background-color: #f8d7da;
  color: #721c24;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  margin: 2px 0;
  border-left: 4px solid #dc3545;
}

.diff-content :deep(span) {
  color: #333;
  display: block;
  padding: 2px 8px;
  margin: 1px 0;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  text-align: center;
}

.error-message i {
  margin-right: 8px;
}

.fallback-notice {
  background: #d1ecf1;
  color: #0c5460;
  padding: 10px 15px;
  border-radius: 6px;
  margin-top: 15px;
  text-align: center;
  font-size: 0.9rem;
}

.fallback-notice i {
  margin-right: 8px;
}

.no-diff {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .text-inputs {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .algorithm-selector {
    justify-content: center;
  }

  .result-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .stats {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>
