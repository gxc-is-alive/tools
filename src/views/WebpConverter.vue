<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-images"></i> WebP 转换器</h1>
      <p>批量将图片转换为WebP格式，支持拖拽上传</p>
    </header>

    <div class="converter-container">
      <div class="upload-area" 
           :class="{ 'dragover': isDragOver }"
           @drop="handleDrop"
           @dragover.prevent="isDragOver = true"
           @dragleave.prevent="isDragOver = false"
           @click="triggerFileInput">
        <div class="upload-content">
          <i class="fas fa-cloud-upload-alt"></i>
          <h3>拖拽图片到此处或点击选择文件</h3>
          <p>支持 JPG、PNG、GIF 等格式</p>
          <input 
            ref="fileInput"
            type="file" 
            multiple 
            accept="image/*" 
            @change="handleFileSelect"
            style="display: none"
          >
        </div>
      </div>

      <div class="settings-panel">
        <div class="form-group">
          <label for="quality">质量设置 (1-100):</label>
          <input 
            id="quality"
            type="range" 
            v-model="quality" 
            min="1" 
            max="100"
            @input="updateQualityDisplay"
          >
          <span class="quality-display">{{ quality }}%</span>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ errorMessage }}
      </div>

      <div v-if="files.length > 0" class="files-list">
        <h3>待转换文件 ({{ files.length }})</h3>
        <div class="file-item" v-for="(file, index) in files" :key="index">
          <div class="file-info">
            <i class="fas fa-image"></i>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
          <button @click="removeFile(index)" class="remove-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        
        <div class="actions">
          <button @click="convertFiles" :disabled="converting" class="btn convert-btn">
            <i v-if="converting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-cog"></i>
            {{ converting ? '转换中...' : '开始转换' }}
          </button>
          <button @click="clearFiles" class="btn btn-secondary">
            <i class="fas fa-trash"></i> 清空列表
          </button>
        </div>
      </div>

      <div v-if="convertedFiles.length > 0" class="results">
        <h3>转换结果 ({{ convertedFiles.length }})</h3>
        <div class="converted-files">
          <div class="converted-item" v-for="(file, index) in convertedFiles" :key="index">
            <div class="file-preview">
              <img :src="file.preview" :alt="file.name">
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-stats">
                <span>原始: {{ formatFileSize(file.originalSize) }}</span>
                <span>WebP: {{ formatFileSize(file.webpSize) }}</span>
                <span class="compression">压缩: {{ file.compression }}%</span>
              </div>
            </div>
            <div class="file-actions">
              <button @click="downloadFile(file)" class="btn">
                <i class="fas fa-download"></i> 下载
              </button>
            </div>
          </div>
        </div>
        
        <div class="bulk-actions">
          <button @click="downloadAll" class="btn">
            <i class="fas fa-download"></i> 下载全部
          </button>
          <button @click="clearResults" class="btn btn-secondary">
            <i class="fas fa-trash"></i> 清空结果
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { webpApi } from '../services/api.js'

const fileInput = ref(null)
const quality = ref(80)
const isDragOver = ref(false)
const converting = ref(false)
const files = ref([])
const convertedFiles = ref([])
const errorMessage = ref('')

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
}

const handleDrop = (event) => {
  isDragOver.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

const addFiles = (newFiles) => {
  const imageFiles = newFiles.filter(file => file.type.startsWith('image/'))
  files.value.push(...imageFiles)
  errorMessage.value = '' // 清除之前的错误信息
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const clearFiles = () => {
  files.value = []
  errorMessage.value = ''
}

const updateQualityDisplay = () => {
  // 质量值已经通过v-model自动更新
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const convertFiles = async () => {
  if (files.value.length === 0) return
  
  converting.value = true
  convertedFiles.value = []
  errorMessage.value = ''
  
  try {
    for (const file of files.value) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('quality', quality.value)
        
        const response = await webpApi.upload(formData)
        
        if (response.success) {
          // 处理转换结果
          const result = response.results[0] // 单个文件转换
          const webpFile = new File([new Blob()], result.webpName, {
            type: 'image/webp'
          })
          
          convertedFiles.value.push({
            name: result.webpName,
            originalSize: result.originalSize,
            webpSize: result.webpSize,
            compression: result.compressionRatio,
            file: webpFile,
            preview: URL.createObjectURL(new Blob())
          })
        } else {
          throw new Error(response.error || '转换失败')
        }
      } catch (error) {
        console.error(`转换文件 ${file.name} 失败:`, error)
        errorMessage.value = `转换文件 ${file.name} 失败: ${error.message}`
      }
    }
  } catch (error) {
    console.error('转换失败:', error)
    errorMessage.value = '转换过程中出现错误，请重试'
  } finally {
    converting.value = false
  }
}

const downloadFile = (file) => {
  const url = URL.createObjectURL(file.file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

const downloadAll = async () => {
  try {
    // 使用批量下载API
    const response = await webpApi.download('all')
    const link = document.createElement('a')
    link.href = response
    link.download = 'webp-files.zip'
    link.click()
  } catch (error) {
    console.error('批量下载失败:', error)
    errorMessage.value = '批量下载失败，请重试'
  }
}

const clearResults = () => {
  convertedFiles.value = []
  errorMessage.value = ''
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

.upload-area {
  border: 3px dashed #ddd;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  margin-bottom: 30px;
}

.upload-area:hover,
.upload-area.dragover {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.upload-content i {
  font-size: 48px;
  color: #007bff;
  margin-bottom: 20px;
}

.upload-content h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
}

.upload-content p {
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: center;
  border: 1px solid #f5c6cb;
}

.error-message i {
  margin-right: 8px;
}

.settings-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quality-display {
  margin-left: 10px;
  font-weight: bold;
  color: #007bff;
}

.files-list,
.results {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.file-info i {
  color: #007bff;
  font-size: 18px;
}

.file-name {
  font-weight: 500;
  flex: 1;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 5px;
}

.remove-btn:hover {
  color: #c82333;
}

.actions,
.bulk-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.convert-btn {
  background-color: #28a745;
}

.convert-btn:hover {
  background-color: #218838;
}

.converted-files {
  display: grid;
  gap: 15px;
}

.converted-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.file-preview {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-details {
  flex: 1;
}

.file-stats {
  display: flex;
  gap: 15px;
  margin-top: 5px;
  font-size: 0.9rem;
  color: #666;
}

.compression {
  color: #28a745;
  font-weight: bold;
}

.file-actions {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .converted-item {
    flex-direction: column;
    text-align: center;
  }
  
  .file-stats {
    justify-content: center;
  }
  
  .actions,
  .bulk-actions {
    flex-direction: column;
  }
}
</style> 