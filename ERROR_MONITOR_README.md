# 错误监控工具使用说明

## 概述

错误监控工具已成功集成到工具箱中，提供以下功能：

- ✅ 前端错误监控界面
- ✅ POST 接口接收错误上报
- ✅ 支持跨域访问(CORS)
- ✅ Web 界面实时查看错误
- ✅ 错误详情查看
- ✅ 分页显示
- ✅ 错误统计
- ✅ 自动刷新
- ✅ 响应式设计

## 功能特性

### 1. 错误监控界面

- 实时错误列表显示
- 统计卡片（总错误数、今日错误、独特错误、当前页面）
- 错误详情弹窗
- 自动刷新功能（30 秒间隔）
- 清空错误记录
- 测试错误上报

### 2. 错误上报 API

#### POST /api/error - 上报错误

请求体示例：

```json
{
  "message": "错误消息",
  "stack": "错误堆栈信息",
  "url": "出错页面URL",
  "filename": "出错文件名",
  "line": 123,
  "column": 45,
  "timestamp": "2023-12-01T10:00:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "userId": "user123",
  "customData": "自定义数据"
}
```

响应示例：

```json
{
  "success": true,
  "message": "错误上报成功",
  "id": "1701421200000abc123"
}
```

#### GET /api/errors - 获取错误列表

查询参数：

- `page`: 页码（默认：1）
- `pageSize`: 每页数量（默认：20）

#### GET /api/error/:id - 获取错误详情

#### DELETE /api/errors - 清空所有错误

## 客户端集成

### 方式 1：使用独立 JS 文件

```html
<!-- 引入错误上报器 -->
<script src="/error-reporter.js"></script>

<!-- 配置（可选） -->
<script>
  // 基础配置
  ErrorReporter.config({
    url: "/api/error", // 上报接口地址
    userId: "user-123", // 可选：设置用户ID
    debug: false, // 可选：是否开启调试模式
  });
</script>
```

使用方法：

```javascript
// 手动上报错误
try {
  // 你的代码
  throw new Error("出错了");
} catch (error) {
  window.postError(error, {
    action: "user-click",
    module: "payment",
  });
}

// 或者使用完整API
ErrorReporter.report(new Error("自定义错误"), {
  level: "critical",
  userId: "user-123",
});

// 测试上报功能
ErrorReporter.test();
```

### 方式 2：原生 JavaScript 集成

```javascript
// 错误上报函数
function reportError(error, extraInfo = {}) {
  const errorData = {
    message: error.message || "未知错误",
    stack: error.stack || "",
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    // 额外信息
    ...extraInfo,
  };

  // 发送错误报告
  fetch("/api/error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(errorData),
  })
    .then((response) => {
      if (response.ok) {
        console.log("错误上报成功");
      }
    })
    .catch((err) => {
      console.error("错误上报失败:", err);
    });
}

// 监听JavaScript错误
window.addEventListener("error", (event) => {
  reportError(event.error || new Error(event.message), {
    type: "javascript-error",
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
  });
});

// 监听Promise错误
window.addEventListener("unhandledrejection", (event) => {
  reportError(new Error(event.reason), {
    type: "unhandled-promise-rejection",
  });
});
```

## 访问方式

1. **错误监控界面**: http://localhost:3001/#/error-monitor
2. **错误上报接口**: POST http://localhost:3001/api/error
3. **错误上报器文件**: http://localhost:3001/error-reporter.js

## 配置选项

### ErrorReporter 配置参数

```javascript
ErrorReporter.config({
  url: "/api/error", // 错误上报接口地址
  autoReport: true, // 是否自动监听全局错误
  timeout: 5000, // 请求超时时间(ms)
  maxRetries: 3, // 失败重试次数
  enableConsole: true, // 是否输出控制台日志
  userId: null, // 用户ID
  debug: false, // 调试模式
  maxErrorCount: 50, // 最大错误缓存数量
  reportInterval: 1000, // 错误上报间隔(ms)
  enableLocalStorage: true, // 是否启用本地存储
  filters: [], // 错误过滤器
});
```

## 注意事项

1. **存储限制**: 当前使用内存存储，最多保存 1000 条错误记录
2. **生产环境**: 建议使用数据库存储错误记录
3. **性能影响**: 错误上报会有轻微的性能影响，可通过配置进行优化
4. **隐私保护**: 避免上报敏感信息，可使用过滤器过滤

## 开发建议

1. **测试环境**: 先在测试环境验证错误上报功能
2. **错误分类**: 对不同类型的错误进行分类统计
3. **告警机制**: 可扩展添加错误告警功能
4. **数据分析**: 定期分析错误数据，优化产品质量

## 扩展功能

可以进一步扩展以下功能：

- 错误统计图表
- 邮件/短信告警
- 错误聚合分析
- 用户行为轨迹
- 性能监控
- 崩溃报告

## 故障排除

1. **错误上报失败**: 检查网络连接和 API 地址
2. **界面无法访问**: 确保服务器正在运行
3. **数据不显示**: 检查浏览器控制台是否有错误信息
4. **跨域问题**: 确保 CORS 配置正确

## 更新日志

- v2.0.0: 集成到工具箱，添加前端监控界面
- v1.0.0: 基础错误上报功能
