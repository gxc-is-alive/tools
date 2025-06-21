# 配置文件说明

## 概述

本项目使用配置文件来管理后端API地址，支持开发和生产环境的不同配置。

## 配置文件位置

- 前端配置：`src/config/index.js`
- API服务：`src/services/api.js`

## 配置说明

### 前端配置 (`src/config/index.js`)

```javascript
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
```

### 环境变量

项目会根据 `import.meta.env.MODE` 自动选择配置：
- 开发环境：`development`
- 生产环境：`production`

### 修改生产环境配置

如果需要修改生产环境的API地址，请编辑 `src/config/index.js` 文件中的 `production` 配置：

```javascript
production: {
  apiBaseUrl: 'https://your-domain.com', // 修改为实际域名
  uploadUrl: 'https://your-domain.com/upload',
  convertUrl: 'https://your-domain.com/convert',
  downloadUrl: 'https://your-domain.com/download'
}
```

## API服务 (`src/services/api.js`)

API服务文件提供了统一的API调用接口：

### WebP转换相关API
- `webpApi.upload(formData)` - 上传图片
- `webpApi.convert(data)` - 转换图片
- `webpApi.download(filename)` - 下载文件
- `webpApi.getStatus(taskId)` - 获取转换状态
- `webpApi.getHistory()` - 获取转换历史
- `webpApi.deleteFile(filename)` - 删除文件

### 时间戳转换相关API
- `timestampApi.convert(data)` - 转换时间戳

### API测试相关API
- `apiTestApi.test(data)` - 发送测试请求

### 通用API
- `commonApi.health()` - 健康检查
- `commonApi.info()` - 获取服务器信息

## 后端CORS配置

后端已配置CORS支持，允许以下域名访问：

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000', // Vue3开发服务器
    'http://localhost:3001', // 生产环境
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 使用示例

### 在Vue组件中使用

```javascript
import { webpApi } from '../services/api.js'

// 上传图片
const formData = new FormData()
formData.append('image', file)
formData.append('quality', 80)

try {
  const response = await webpApi.upload(formData)
  console.log('上传成功:', response)
} catch (error) {
  console.error('上传失败:', error)
}
```

### 直接使用配置

```javascript
import { API_BASE_URL, buildApiUrl } from '../config/index.js'

// 构建API URL
const url = buildApiUrl('/api/test')
console.log(url) // http://localhost:3001/api/test
```

## 注意事项

1. **不要使用反向代理**：项目设计为直接调用后端API，不使用反向代理
2. **CORS已配置**：后端已配置跨域支持，前端可以直接调用
3. **环境区分**：开发和生产环境使用不同的API地址配置
4. **错误处理**：API服务包含统一的错误处理机制

## 部署说明

1. 修改 `src/config/index.js` 中的生产环境配置
2. 重新构建前端：`pnpm build`
3. 确保后端服务器运行在配置的地址上
4. 部署前端构建文件到Web服务器 