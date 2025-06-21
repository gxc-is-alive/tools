import { API_BASE_URL, UPLOAD_URL, CONVERT_URL, DOWNLOAD_URL, buildApiUrl } from '../config/index.js'

// 通用请求函数
const request = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  }

  let finalUrl = url;

  // 如果是GET请求且有params，则构建查询字符串
  if ((!options.method || options.method.toUpperCase() === 'GET') && options.params) {
    const query = new URLSearchParams(options.params).toString();
    finalUrl = `${url}?${query}`;
    delete defaultOptions.params; // 从fetch的options中移除，因为它不是标准属性
  }

  try {
    const response = await fetch(finalUrl, defaultOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// 文件上传请求函数
const uploadFile = async (url, formData) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // 不设置Content-Type，让浏览器自动设置multipart/form-data
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
}

// WebP转换相关API
export const webpApi = {
  // 上传图片
  upload: (formData) => uploadFile(UPLOAD_URL, formData),
  
  // 转换图片
  convert: (data) => request(CONVERT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }),
  
  // 下载文件
  download: (filename) => `${DOWNLOAD_URL}/${filename}`,
  
  // 获取转换状态
  getStatus: (taskId) => request(buildApiUrl(`/status/${taskId}`)),
  
  // 获取转换历史
  getHistory: () => request(buildApiUrl('/history')),
  
  // 删除文件
  deleteFile: (filename) => request(buildApiUrl(`/delete/${filename}`), {
    method: 'DELETE'
  })
}

// 时间戳转换相关API
export const timestampApi = {
  // 转换时间戳
  convert: (data) => request(buildApiUrl('/api/timestamp/convert'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }),
}

// API测试相关API
export const apiTestApi = {
  // 发送测试请求
  test: (data) => request(buildApiUrl('/api/test'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
}

// 通用API
export const commonApi = {
  // 健康检查
  health: () => request(buildApiUrl('/health')),
  
  // 获取服务器信息
  info: () => request(buildApiUrl('/info')),

  // 站点状态检查
  checkUrl(url) {
    return request(buildApiUrl('/api/check-url'), {
      method: 'GET',
      params: { url }
    });
  },

  // 获取汇率
  getExchangeRate() {
    return request(buildApiUrl('/api/exchange-rate'));
  }
} 