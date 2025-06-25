# 局域网访问配置说明

## 概述

项目已配置支持局域网访问，允许同一局域网内的其他设备（如手机、平板、其他电脑）访问工具箱。

## 配置详情

### 前端配置 (Vite)

- **文件**: `vite.config.js`
- **配置**: `host: '0.0.0.0'` - 允许外部访问
- **端口**: 3000

### 后端配置 (Node.js)

- **文件**: `server.js`
- **配置**: `app.listen(PORT, '0.0.0.0')` - 监听所有网络接口
- **端口**: 3002
- **CORS**: 已配置支持局域网 IP 地址访问

## 启动方式

### 方式一：使用现有命令

```bash
pnpm run dev
```

### 方式二：使用便捷脚本

**Windows:**

```bash
start-lan.bat
```

**Linux/macOS:**

```bash
./start-lan.sh
```

## 访问地址

启动后，控制台会显示：

```
🚀 后端API服务器运行在 http://localhost:3002
🎨 Vue3开发服务器运行在 http://localhost:3000

🌐 局域网访问地址:
   📡 后端API服务器: http://[你的IP]:3002
   🎯 前端开发服务器: http://[你的IP]:3000

📱 移动设备可通过以上地址访问
💡 如果端口冲突，前端会自动切换到其他端口
```

## 获取本机 IP 地址

### Windows

```cmd
ipconfig | findstr "IPv4"
```

### Linux/macOS

```bash
hostname -I
# 或
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 防火墙设置

### Windows

1. 打开 Windows Defender 防火墙
2. 点击"允许应用或功能通过防火墙"
3. 添加端口 3000 和 3002 的入站规则

### Linux (Ubuntu/Debian)

```bash
sudo ufw allow 3000
sudo ufw allow 3002
```

### macOS

```bash
# 通常 macOS 默认允许，如需手动配置：
sudo pfctl -e
# 添加规则到 /etc/pf.conf
```

## 支持的局域网 IP 段

CORS 配置已支持以下私有 IP 段：

- `192.168.x.x` (最常见的家庭网络)
- `10.x.x.x` (企业网络)
- `172.16.x.x - 172.31.x.x` (企业网络)

## 移动设备访问

1. 确保手机/平板与电脑在同一 WiFi 网络
2. 在移动设备浏览器中输入局域网地址
3. 建议使用 Chrome、Safari 等现代浏览器

## 故障排除

### 无法访问

1. 检查防火墙设置
2. 确认设备在同一网络
3. 检查 IP 地址是否正确
4. 尝试重启开发服务器

### CORS 错误

- 检查 `server.js` 中的 CORS 配置
- 确认访问的 IP 地址格式正确

### 网络问题

```bash
# 测试端口是否开放
telnet [IP地址] 3000
telnet [IP地址] 3002
```

## 安全注意事项

⚠️ **仅在开发环境使用**

- 当前配置为开发环境优化
- 生产环境需要额外的安全配置
- 建议仅在受信任的局域网内使用

## 常见用途

- 移动设备调试
- 团队协作开发
- 跨设备功能测试
- 演示和展示
