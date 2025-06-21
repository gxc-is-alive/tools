<template>
  <div class="container">
    <header>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i> 返回工具箱
      </router-link>
      <h1><i class="fas fa-code"></i> Base64 编解码</h1>
      <p>文本和Base64编码之间的相互转换</p>
    </header>

    <div class="converter-container">
      <div class="input-section">
        <div class="form-group">
          <label for="input-text">输入文本</label>
          <textarea 
            id="input-text"
            v-model="inputText"
            @input="convertText"
            placeholder="输入要编码或解码的文本..."
            class="text-input"
          ></textarea>
        </div>

        <div class="controls">
          <button @click="encodeText" class="btn">
            <i class="fas fa-arrow-right"></i> 编码为 Base64
          </button>
          <button @click="decodeText" class="btn">
            <i class="fas fa-arrow-left"></i> 解码 Base64
          </button>
          <button @click="clearText" class="btn btn-secondary">
            <i class="fas fa-trash"></i> 清空
          </button>
        </div>

        <div class="file-upload">
          <label for="file-input" class="file-label">
            <i class="fas fa-upload"></i> 选择文件转换为 Base64
          </label>
          <input 
            id="file-input"
            type="file" 
            @change="handleFileUpload"
            style="display: none"
          >
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ errorMessage }}
      </div>

      <div v-if="outputText" class="output-section">
        <div class="output-header">
          <h3>转换结果</h3>
          <button @click="copyOutput" class="copy-btn">
            <i class="fas fa-copy"></i> 复制
          </button>
        </div>
        <div class="output-content">
          <textarea 
            v-model="outputText"
            readonly
            class="output-textarea"
            placeholder="转换结果将显示在这里..."
          ></textarea>
        </div>
      </div>

      <div v-if="imagePreview" class="image-preview-section">
        <h3>图片预览</h3>
        <div class="image-container">
          <img :src="imagePreview" alt="Base64图片预览" class="preview-image">
          <div class="image-actions">
            <button @click="downloadImage" class="btn">
              <i class="fas fa-download"></i> 下载图片
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const inputText = ref('')
const outputText = ref('')
const imagePreview = ref('')
const errorMessage = ref('')

const convertText = () => {
  // 实时转换逻辑可以在这里添加
}

const encodeText = () => {
  if (!inputText.value.trim()) return
  
  try {
    const textToEncode = inputText.value.trim()
    
    // 检查是否已经是Base64格式
    if (textToEncode.startsWith('data:image/')) {
      outputText.value = textToEncode
      imagePreview.value = textToEncode
      return
    }
    
    // 检查是否为纯Base64数据
    if (/^[A-Za-z0-9+/=]+$/.test(textToEncode) && textToEncode.length > 50) {
      // 可能是Base64数据，尝试构造data URL
      try {
        const dataUrl = `data:image/png;base64,${textToEncode}`
        const img = new Image()
        img.onload = () => {
          outputText.value = dataUrl
          imagePreview.value = dataUrl
        }
        img.onerror = () => {
          // 不是有效的图片数据，按普通文本编码
          const encoded = btoa(unescape(encodeURIComponent(textToEncode)))
          outputText.value = encoded
          imagePreview.value = ''
        }
        img.src = dataUrl
        return
      } catch (e) {
        // 如果构造data URL失败，按普通文本处理
      }
    }
    
    // 普通文本编码
    const encoded = btoa(unescape(encodeURIComponent(textToEncode)))
    outputText.value = encoded
    imagePreview.value = ''
  } catch (error) {
    console.error('编码失败:', error)
    errorMessage.value = '编码失败，请检查输入内容'
  }
}

const decodeText = () => {
  if (!inputText.value.trim()) return
  
  try {
    let textToDecode = inputText.value.trim()
    
    // 检查是否为图片Base64数据（包含data URL前缀）
    if (textToDecode.startsWith('data:image/')) {
      // 对于图片数据，直接显示预览，不需要解码
      imagePreview.value = textToDecode
      outputText.value = '图片Base64数据已识别，请查看下方预览'
      return
    }
    
    // 检查是否为纯Base64图片数据（不包含data URL前缀）
    if (textToDecode.length > 100 && /^[A-Za-z0-9+/=]+$/.test(textToDecode)) {
      // 尝试构造data URL来预览
      try {
        const dataUrl = `data:image/png;base64,${textToDecode}`
        // 测试是否能正确加载图片
        const img = new Image()
        img.onload = () => {
          imagePreview.value = dataUrl
          outputText.value = '图片Base64数据已识别，请查看下方预览'
        }
        img.onerror = () => {
          // 不是有效的图片数据，按普通文本解码
          const decoded = decodeURIComponent(escape(atob(textToDecode)))
          outputText.value = decoded
          imagePreview.value = ''
        }
        img.src = dataUrl
        return
      } catch (e) {
        // 如果构造data URL失败，按普通文本处理
      }
    }
    
    // 普通文本解码
    const decoded = decodeURIComponent(escape(atob(textToDecode)))
    outputText.value = decoded
    imagePreview.value = ''
  } catch (error) {
    console.error('解码失败:', error)
    errorMessage.value = '解码失败，请检查Base64格式是否正确'
  }
}

const clearText = () => {
  inputText.value = ''
  outputText.value = ''
  imagePreview.value = ''
  errorMessage.value = ''
}

const copyOutput = async () => {
  if (!outputText.value) return
  
  try {
    await navigator.clipboard.writeText(outputText.value)
    // 简单的复制成功提示
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
    textArea.value = outputText.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    inputText.value = base64
    outputText.value = base64
    
    // 如果是图片文件，显示预览
    if (file.type.startsWith('image/')) {
      imagePreview.value = base64
    } else {
      imagePreview.value = ''
    }
  }
  
  reader.readAsDataURL(file)
}

const downloadImage = () => {
  if (!imagePreview.value) return
  
  const link = document.createElement('a')
  link.href = imagePreview.value
  link.download = 'base64-image.png'
  link.click()
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

.text-input {
  min-height: 150px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.controls {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  justify-content: center;
  flex-wrap: wrap;
}

.file-upload {
  text-align: center;
  margin-top: 20px;
}

.file-label {
  display: inline-block;
  padding: 10px 20px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
}

.file-label:hover {
  border-color: #007bff;
  color: #007bff;
  background: #f8f9ff;
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

.output-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.output-header h3 {
  margin: 0;
  color: #333;
}

.copy-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background: #218838;
}

.output-textarea {
  width: 100%;
  min-height: 120px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  resize: vertical;
}

.image-preview-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-preview-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.image-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 15px;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }
  
  .output-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style> 