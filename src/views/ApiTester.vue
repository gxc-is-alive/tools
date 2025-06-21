<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-paper-plane"></i> API 请求测试</h1>
      <p>一个轻量级的在线HTTP请求客户端</p>
    </header>

    <div class="main-container">
      <aside class="history-panel">
        <h3><i class="fas fa-history"></i> 请求历史</h3>
        <ul id="historyList">
          <li v-if="requestHistory.length === 0">没有历史记录</li>
          <li 
            v-for="(request, index) in requestHistory" 
            :key="request.id"
            :class="{ active: activeHistoryId === request.id }"
            @click="loadFromHistory(request)"
          >
            <span class="history-method" :class="request.method">{{ request.method }}</span>
            <span class="history-url">{{ request.url }}</span>
          </li>
        </ul>
        <button @click="clearHistory" class="clear-history-btn">清空历史</button>
      </aside>

      <main>
        <div class="request-panel">
          <div class="url-bar">
            <select v-model="requestMethod">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <input 
              v-model="requestUrl" 
              type="text" 
              placeholder="https://api.example.com/data"
              class="url-input"
            >
            <button @click="sendRequest" :disabled="sending" class="send-btn">
              <i v-if="sending" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-paper-plane"></i>
              {{ sending ? '发送中...' : '发送' }}
            </button>
          </div>

          <div class="tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['tab-link', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>

          <div class="tab-content">
            <!-- 查询参数 -->
            <div v-show="activeTab === 'params'" class="params-tab">
              <div class="key-value-pairs">
                <div 
                  v-for="(param, index) in queryParams" 
                  :key="index"
                  class="kv-pair"
                >
                  <input v-model="param.key" placeholder="参数名" class="key-input">
                  <input v-model="param.value" placeholder="参数值" class="value-input">
                  <button @click="removeParam(index)" class="remove-btn">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <button @click="addParam" class="add-btn">
                <i class="fas fa-plus"></i> 添加参数
              </button>
            </div>

            <!-- 请求头 -->
            <div v-show="activeTab === 'headers'" class="headers-tab">
              <div class="key-value-pairs">
                <div 
                  v-for="(header, index) in requestHeaders" 
                  :key="index"
                  class="kv-pair"
                >
                  <input v-model="header.key" placeholder="请求头名" class="key-input">
                  <input v-model="header.value" placeholder="请求头值" class="value-input">
                  <button @click="removeHeader(index)" class="remove-btn">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <button @click="addHeader" class="add-btn">
                <i class="fas fa-plus"></i> 添加请求头
              </button>
            </div>

            <!-- 请求体 -->
            <div v-show="activeTab === 'body'" class="body-tab">
              <div class="body-type-selector">
                <label>
                  <input type="radio" v-model="bodyType" value="none"> None
                </label>
                <label>
                  <input type="radio" v-model="bodyType" value="json"> JSON
                </label>
                <label>
                  <input type="radio" v-model="bodyType" value="form-data"> Form Data
                </label>
              </div>

              <div v-if="bodyType === 'json'" class="json-body">
                <textarea 
                  v-model="jsonBody"
                  placeholder="输入JSON格式的请求体..."
                  class="body-textarea"
                ></textarea>
              </div>

              <div v-if="bodyType === 'form-data'" class="form-data-body">
                <div class="key-value-pairs">
                  <div 
                    v-for="(field, index) in formData" 
                    :key="index"
                    class="kv-pair"
                  >
                    <input v-model="field.key" placeholder="字段名" class="key-input">
                    <input v-model="field.value" placeholder="字段值" class="value-input">
                    <button @click="removeFormData(index)" class="remove-btn">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <button @click="addFormData" class="add-btn">
                  <i class="fas fa-plus"></i> 添加字段
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="response" class="response-panel">
          <div class="response-header">
            <h3>响应</h3>
            <div class="response-meta">
              <span>状态: <strong :class="statusClass">{{ response.status }} {{ response.statusText }}</strong></span>
              <span>时间: <strong>{{ responseTime }}ms</strong></span>
              <span>大小: <strong>{{ responseSize }}KB</strong></span>
            </div>
          </div>
          
          <div class="response-tabs">
            <button 
              v-for="tab in responseTabs" 
              :key="tab.id"
              :class="['response-tab-link', { active: activeResponseTab === tab.id }]"
              @click="activeResponseTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>

          <div class="response-content">
            <div v-show="activeResponseTab === 'body'" class="response-body">
              <JsonViewer v-if="isResponseJson" :data="responseBodyAsJson" />
              <div v-else class="html-renderer" v-html="response && response.body"></div>
            </div>
            <div v-show="activeResponseTab === 'headers'" class="response-headers">
              <pre><code>{{ formattedResponseHeaders }}</code></pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JsonViewer from '../components/JsonViewer.vue'

// 响应式数据
const requestMethod = ref('GET')
const requestUrl = ref('')
const sending = ref(false)
const activeTab = ref('params')
const bodyType = ref('none')
const jsonBody = ref('')
const queryParams = ref([{ key: '', value: '' }])
const requestHeaders = ref([{ key: '', value: '' }])
const formData = ref([{ key: '', value: '' }])
const response = ref(null)
const responseTime = ref(0)
const responseSize = ref(0)
const activeResponseTab = ref('body')
const requestHistory = ref([])
const activeHistoryId = ref(null)

// 计算属性
const tabs = computed(() => [
  { id: 'params', name: '查询参数' },
  { id: 'headers', name: '请求头' },
  { id: 'body', name: '请求体' }
])

const responseTabs = computed(() => [
  { id: 'body', name: '响应体' },
  { id: 'headers', name: '响应头' }
])

const statusClass = computed(() => {
  if (!response.value) return ''
  const status = response.value.status
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 400 && status < 500) return 'status-client-error'
  if (status >= 500) return 'status-server-error'
  if (status >= 300 && status < 400) return 'status-redirect'
  return ''
})

const isResponseJson = computed(() => {
  if (!response.value || !response.value.body) {
    return false;
  }
  const body = response.value.body;
  if (typeof body === 'object') {
    return true; // Already an object
  }
  if (typeof body === 'string') {
    try {
      JSON.parse(body);
      return true; // Is a valid JSON string
    } catch (e) {
      return false; // Not a JSON string
    }
  }
  return false;
})

const responseBodyAsJson = computed(() => {
  if (!isResponseJson.value) {
    return null;
  }
  const body = response.value.body;
  return typeof body === 'object' ? body : JSON.parse(body);
})

const formattedResponseBody = computed(() => {
  if (!response.value || !response.value.body) return '';
  if (isResponseJson.value) {
    // This computed is now only for plain text display if needed elsewhere, 
    // but JsonViewer handles the JSON display.
    return JSON.stringify(responseBodyAsJson.value, null, 2);
  }
  return response.value.body;
})

const formattedResponseHeaders = computed(() => {
  if (!response.value) return ''
  return JSON.stringify(response.value.headers, null, 2)
})

// 方法
const addParam = () => {
  queryParams.value.push({ key: '', value: '' })
}

const removeParam = (index) => {
  queryParams.value.splice(index, 1)
}

const addHeader = () => {
  requestHeaders.value.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  requestHeaders.value.splice(index, 1)
}

const addFormData = () => {
  formData.value.push({ key: '', value: '' })
}

const removeFormData = (index) => {
  formData.value.splice(index, 1)
}

const sendRequest = async () => {
  if (!requestUrl.value.trim()) {
    alert('请输入URL')
    return
  }

  sending.value = true
  response.value = null
  activeHistoryId.value = null
  const startTime = Date.now()

  try {
    // 构建请求配置
    const config = {
      method: requestMethod.value,
      headers: {}
    }

    // 添加请求头
    requestHeaders.value.forEach(header => {
      if (header.key && header.value) {
        config.headers[header.key] = header.value
      }
    })

    // 构建URL和查询参数
    let url = requestUrl.value
    const params = queryParams.value.filter(p => p.key && p.value)
    if (params.length > 0) {
      const searchParams = new URLSearchParams()
      params.forEach(p => searchParams.append(p.key, p.value))
      url += (url.includes('?') ? '&' : '?') + searchParams.toString()
    }

    // 处理请求体
    if (bodyType.value === 'json' && jsonBody.value) {
      config.headers['Content-Type'] = 'application/json'
      config.body = jsonBody.value
    } else if (bodyType.value === 'form-data') {
      const formDataObj = new FormData()
      formData.value.forEach(field => {
        if (field.key && field.value) {
          formDataObj.append(field.key, field.value)
        }
      })
      config.body = formDataObj
    }

    // 构建代理请求
    const proxyRequest = {
      url,
      method: config.method,
      headers: config.headers,
      body: config.body
    }

    // 发送请求
    const apiResponse = await fetch('/api-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyRequest),
    })

    if (!apiResponse.ok) {
      let errorBody = await apiResponse.text();
      try {
        errorBody = JSON.parse(errorBody).error || errorBody;
      } catch(e) {
        // Not a JSON error, use the raw text.
      }
      throw new Error(`请求失败: ${apiResponse.status} ${apiResponse.statusText} - ${errorBody}`);
    }

    const data = await apiResponse.json()
    
    response.value = data
    responseTime.value = Date.now() - startTime
    responseSize.value = (JSON.stringify(data.body).length / 1024).toFixed(2)

    // 保存到历史记录
    saveToHistory()

  } catch (error) {
    console.error('API请求错误:', error)
    response.value = {
      status: 'Error',
      statusText: '',
      headers: {},
      body: error.message,
    }
  } finally {
    sending.value = false
  }
}

const saveToHistory = () => {
  const historyItem = {
    id: Date.now(),
    method: requestMethod.value,
    url: requestUrl.value,
    params: queryParams.value.filter(p => p.key && p.value),
    headers: requestHeaders.value.filter(h => h.key && h.value),
    bodyType: bodyType.value,
    jsonBody: jsonBody.value,
    formData: formData.value.filter(f => f.key && f.value)
  }

  // 避免重复
  const existingIndex = requestHistory.value.findIndex(h => 
    h.method === historyItem.method && 
    h.url === historyItem.url
  )

  if (existingIndex !== -1) {
    requestHistory.value.splice(existingIndex, 1)
  }

  requestHistory.value.unshift(historyItem)
  
  // 限制历史记录数量
  if (requestHistory.value.length > 20) {
    requestHistory.value.pop()
  }

  // 保存到localStorage
  localStorage.setItem('apiTesterHistory', JSON.stringify(requestHistory.value))
}

const loadFromHistory = (historyItem) => {
  activeHistoryId.value = historyItem.id
  
  requestMethod.value = historyItem.method
  requestUrl.value = historyItem.url
  
  // 恢复查询参数
  queryParams.value = historyItem.params.length > 0 
    ? [...historyItem.params, { key: '', value: '' }]
    : [{ key: '', value: '' }]
  
  // 恢复请求头
  requestHeaders.value = historyItem.headers.length > 0
    ? [...historyItem.headers, { key: '', value: '' }]
    : [{ key: '', value: '' }]
  
  // 恢复请求体
  bodyType.value = historyItem.bodyType
  jsonBody.value = historyItem.jsonBody || ''
  formData.value = historyItem.formData.length > 0
    ? [...historyItem.formData, { key: '', value: '' }]
    : [{ key: '', value: '' }]
}

const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    requestHistory.value = []
    localStorage.removeItem('apiTesterHistory')
    activeHistoryId.value = null
  }
}

// 生命周期
onMounted(() => {
  // 加载历史记录
  const savedHistory = localStorage.getItem('apiTesterHistory')
  if (savedHistory) {
    requestHistory.value = JSON.parse(savedHistory)
  }
})
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

.main-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
}

.history-panel {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  align-self: start;
}

.history-panel h3 {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

#historyList {
  list-style: none;
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: 15px;
}

#historyList li {
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 5px;
  font-size: 0.9rem;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}

#historyList li:hover {
  background-color: #f8f9fa;
}

#historyList li.active {
  background-color: #e9ecef;
  border-left-color: #007bff;
  font-weight: bold;
}

.history-method {
  font-weight: bold;
  margin-right: 8px;
  min-width: 45px;
  display: inline-block;
}

.history-method.GET { color: #28a745; }
.history-method.POST { color: #ffc107; }
.history-method.PUT { color: #17a2b8; }
.history-method.DELETE { color: #dc3545; }

.history-url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.clear-history-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #dc3545;
  background: none;
  color: #dc3545;
  border-radius: 5px;
  cursor: pointer;
}

.request-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.url-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 0;
}

.url-bar select {
  padding: 0 15px;
  border: 1px solid #ccc;
  border-right: none;
  border-radius: 5px 0 0 5px;
  background-color: #f8f9fa;
  font-weight: bold;
}

.url-input {
  flex-grow: 1;
  padding: 10px 15px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.send-btn {
  padding: 10px 25px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.send-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 20px;
}

.tab-link {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: #6c757d;
}

.tab-link.active {
  color: #007bff;
  font-weight: bold;
}

.tab-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #007bff;
}

.key-value-pairs {
  display: grid;
  gap: 10px;
  margin-bottom: 15px;
}

.kv-pair {
  display: flex;
  gap: 10px;
}

.key-input,
.value-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.remove-btn {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 4px;
  cursor: pointer;
  width: 36px;
}

.add-btn {
  margin-top: 15px;
  padding: 8px 15px;
  border: 1px dashed #007bff;
  background: none;
  color: #007bff;
  cursor: pointer;
  border-radius: 4px;
}

.body-type-selector {
  margin-bottom: 15px;
  display: flex;
  gap: 20px;
}

.body-type-selector label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.body-textarea {
  width: 100%;
  height: 150px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.response-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.response-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
}

.status-success { color: #28a745; }
.status-client-error { color: #ffc107; }
.status-server-error { color: #dc3545; }
.status-redirect { color: #17a2b8; }

.response-tabs {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 20px;
}

.response-tab-link {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: #6c757d;
}

.response-tab-link.active {
  color: #007bff;
  font-weight: bold;
}

.response-tab-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #007bff;
}

.response-content {
  /* 保持原有样式，不使用flex布局 */
}

.response-body pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: #333;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.response-headers pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: #333;
  overflow-x: auto;
  /* 响应头通常不需要强制换行，保持原样 */
}

.html-renderer {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  height: 100%;
  min-height: 200px;
  max-height: 60vh;
  overflow: auto;
  background: white;
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
  }
  
  .history-panel {
    order: 2;
  }
  
  .url-bar {
    flex-direction: column;
  }
  
  .url-bar select,
  .url-input,
  .send-btn {
    border-radius: 4px;
    margin-bottom: 5px;
  }
  
  .response-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .response-meta {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style> 