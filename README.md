# 在线工具箱 - Vue3版本

一个集成了多种实用工具的在线平台，使用Vue3 + Vite构建。

## 功能特性

- 🖼️ **WebP转换器**: 批量将图片转换为WebP格式，支持拖拽上传
- 📝 **文本比对**: 比较两段文本的差异，高亮显示变化
- ⏰ **时间戳转换**: 在时间戳和日期格式之间进行转换
- 🔤 **Base64编解码**: 文本和Base64编码之间的相互转换
- 🌐 **API请求测试**: 轻量级的HTTP请求客户端，支持多种请求方式

## 技术栈

- **前端**: Vue 3 + Vue Router + Vite
- **后端**: Node.js + Express
- **图片处理**: Sharp
- **构建工具**: Vite
- **包管理**: pnpm

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动开发服务器（前端 + 后端）：

```bash
# 启动后端服务器 (端口 3001)
pnpm dev

# 在另一个终端启动前端开发服务器 (端口 3000)
pnpm client:dev
```

### 生产构建

```bash
# 构建前端应用
pnpm build

# 启动生产服务器
pnpm serve
```

访问 http://localhost:3001 即可使用应用。

## 项目结构

```
├── src/                    # Vue3前端源码
│   ├── components/         # Vue组件
│   ├── views/             # 页面组件
│   │   ├── Home.vue       # 主页
│   │   ├── WebpConverter.vue  # WebP转换器
│   │   ├── TextDiff.vue   # 文本比对
│   │   ├── Timestamp.vue  # 时间戳转换
│   │   ├── Base64.vue     # Base64编解码
│   │   └── ApiTester.vue  # API请求测试
│   ├── assets/            # 静态资源
│   ├── utils/             # 工具函数
│   ├── App.vue            # 根组件
│   ├── main.js            # 应用入口
│   └── index.html         # HTML模板
├── dist/                  # 构建输出目录
├── public/                # 静态文件（旧版本）
├── server.js              # Express后端服务器
├── vite.config.js         # Vite配置
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 开发指南

### 添加新工具

1. 在 `src/views/` 目录下创建新的Vue组件
2. 在 `src/main.js` 中添加路由配置
3. 在 `src/views/Home.vue` 中添加工具卡片
4. 如果需要后端API，在 `server.js` 中添加路由

### 组件开发

使用Vue3的Composition API：

```vue
<template>
  <div class="container">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const data = ref('')

// 计算属性
const computedValue = computed(() => {
  return data.value.toUpperCase()
})

// 方法
const handleClick = () => {
  console.log('clicked')
}

// 生命周期
onMounted(() => {
  console.log('mounted')
})
</script>

<style scoped>
/* 组件样式 */
</style>
```

### API开发

在 `server.js` 中添加新的API路由：

```javascript
app.post('/api/new-feature', async (req, res) => {
  try {
    // 处理逻辑
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## 部署

### 本地部署

1. 构建前端应用：
   ```bash
   pnpm build
   ```

2. 启动服务器：
   ```bash
   pnpm serve
   ```

### 服务器部署

1. 上传项目文件到服务器
2. 安装依赖：`pnpm install --production`
3. 构建前端：`pnpm build`
4. 启动服务：`pnpm serve`

## 环境变量

- `PORT`: 服务器端口（默认3001）
- `NODE_ENV`: 环境模式（development/production）

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License 