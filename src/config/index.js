// 前端配置文件
export const config = {
  // 开发环境配置
  development: {
    apiBaseUrl: 'http://localhost:3001',
    uploadUrl: 'http://localhost:3001/upload',
    convertUrl: 'http://localhost:3001/convert',
    downloadUrl: 'http://localhost:3001/download'
  },
  
  // 生产环境配置
  production: {
    apiBaseUrl: 'http://localhost:3001', // 生产环境可以修改为实际域名
    uploadUrl: 'http://localhost:3001/upload',
    convertUrl: 'http://localhost:3001/convert',
    downloadUrl: 'http://localhost:3001/download'
  }
}

// 根据当前环境获取配置
const env = import.meta.env.MODE || 'development'
export const currentConfig = config[env] || config.development

// 导出常用的API地址
export const API_BASE_URL = currentConfig.apiBaseUrl
export const UPLOAD_URL = currentConfig.uploadUrl
export const CONVERT_URL = currentConfig.convertUrl
export const DOWNLOAD_URL = currentConfig.downloadUrl

// 工具函数：构建完整的API URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

// 工具函数：构建文件下载URL
export const buildDownloadUrl = (filename) => {
  return `${DOWNLOAD_URL}/${filename}`
} 