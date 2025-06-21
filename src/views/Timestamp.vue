<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-clock"></i> 时间戳转换</h1>
      <p>在时间戳和日期格式之间进行转换</p>
    </header>

    <div class="converter-container">
      <div class="input-section">
        <div class="form-group">
          <label for="timestamp-input">输入时间戳或日期</label>
          <div class="input-wrapper">
            <input 
              id="timestamp-input"
              v-model="inputValue"
              @input="convertTimestamp"
              @keyup.enter="convertTimestamp"
              placeholder="输入时间戳（如：1640995200000）或日期（如：2022-01-01 12:00:00）"
              class="timestamp-input"
            >
            <button @click="convertTimestamp" class="convert-btn">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div class="quick-actions">
          <button @click="setCurrentTime" class="btn btn-secondary">
            <i class="fas fa-clock"></i> 当前时间
          </button>
          <button @click="clearInput" class="btn btn-secondary">
            <i class="fas fa-trash"></i> 清空
          </button>
        </div>
      </div>

      <div v-if="results.length > 0" class="results-section">
        <h3>转换结果</h3>
        <div class="results-grid">
          <div 
            v-for="(result, index) in results" 
            :key="index"
            class="result-card"
          >
            <div class="result-header">
              <span class="result-type">{{ result.type }}</span>
              <button @click="copyToClipboard(result.value)" class="copy-btn">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="result-value">{{ result.value }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="inputValue" class="no-result">
        <p>输入有效的时间戳或日期格式以查看转换结果</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const inputValue = ref('')
const results = ref([])

const convertTimestamp = () => {
  if (!inputValue.value.trim()) {
    results.value = []
    return
  }

  const input = inputValue.value.trim()
  const newResults = []

  try {
    // 尝试解析为时间戳
    if (/^\d+$/.test(input)) {
      const timestamp = parseInt(input)
      const date = new Date(timestamp)
      
      if (!isNaN(date.getTime())) {
        newResults.push({
          type: '时间戳（毫秒）',
          value: timestamp.toString()
        })
        
        newResults.push({
          type: '时间戳（秒）',
          value: Math.floor(timestamp / 1000).toString()
        })
        
        newResults.push({
          type: '日期时间',
          value: date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        })
        
        newResults.push({
          type: 'ISO 格式',
          value: date.toISOString()
        })
        
        newResults.push({
          type: 'UTC 时间',
          value: date.toUTCString()
        })
      }
    } else {
      // 尝试解析为日期字符串
      const date = new Date(input)
      
      if (!isNaN(date.getTime())) {
        newResults.push({
          type: '时间戳（毫秒）',
          value: date.getTime().toString()
        })
        
        newResults.push({
          type: '时间戳（秒）',
          value: Math.floor(date.getTime() / 1000).toString()
        })
        
        newResults.push({
          type: '日期时间',
          value: date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        })
        
        newResults.push({
          type: 'ISO 格式',
          value: date.toISOString()
        })
        
        newResults.push({
          type: 'UTC 时间',
          value: date.toUTCString()
        })
      }
    }
  } catch (error) {
    console.error('转换失败:', error)
  }

  results.value = newResults
}

const setCurrentTime = () => {
  const now = new Date()
  inputValue.value = now.getTime().toString()
  convertTimestamp()
}

const clearInput = () => {
  inputValue.value = ''
  results.value = []
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // 可以添加一个简单的提示
    const btn = event.target.closest('.copy-btn')
    const icon = btn.querySelector('i')
    const originalClass = icon.className
    
    icon.className = 'fas fa-check'
    setTimeout(() => {
      icon.className = originalClass
    }, 1000)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
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

.converter-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.input-wrapper {
  display: flex;
  gap: 10px;
}

.timestamp-input {
  flex: 1;
  font-family: 'Courier New', monospace;
}

.convert-btn {
  padding: 10px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.convert-btn:hover {
  background: #0056b3;
}

.quick-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.results-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.results-grid {
  display: grid;
  gap: 15px;
}

.result-card {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  transition: all 0.2s ease;
}

.result-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-type {
  font-weight: 600;
  color: #007bff;
  font-size: 0.9rem;
}

.copy-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #f8f9fa;
  color: #007bff;
}

.result-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #333;
  word-break: break-all;
  line-height: 1.4;
}

.no-result {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .input-wrapper {
    flex-direction: column;
  }
  
  .convert-btn {
    align-self: flex-end;
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style> 