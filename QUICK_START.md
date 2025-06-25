# 🚀 快速开始指南

## 步骤 1：启动 Docker Desktop

**Windows 用户：**

1. 点击桌面或开始菜单中的"Docker Desktop"图标
2. 等待 Docker Desktop 完全启动（系统托盘图标变为绿色）
3. 确认 Docker 运行正常：在命令行输入 `docker --version`

## 步骤 2：构建并导出 Docker 镜像

**自动构建（推荐）：**

```cmd
# Windows用户，双击运行：
build-docker.bat

# 或者在命令行中运行：
.\build-docker.bat
```

**手动构建：**

```bash
# 1. 构建镜像
docker build -t tools-app:latest .

# 2. 导出为tar文件
docker save -o tools-app-latest.tar tools-app:latest

# 3. 查看文件大小
dir tools-app-latest.tar
```

## 步骤 3：使用导出的镜像

生成的 `tools-app-latest.tar` 文件可以：

1. **复制到其他服务器**
2. **在目标服务器上加载**：
   ```bash
   docker load -i tools-app-latest.tar
   ```
3. **运行容器**：
   ```bash
   docker run -d -p 3001:3001 --name tools-app tools-app:latest
   ```

## 🔧 如果 Docker Desktop 启动有问题

1. **重启电脑**后再试
2. **以管理员身份运行**Docker Desktop
3. **检查系统要求**：
   - Windows 10/11 专业版或企业版
   - 启用 Hyper-V 功能
   - 启用容器功能

## 📞 需要帮助？

如果遇到问题，请：

1. 查看 `DOCKER_BUILD_README.md` 获取详细说明
2. 检查 Docker Desktop 的日志
3. 确保系统满足 Docker 运行要求
