# Docker 构建和部署指南

## 📦 构建 Docker 镜像并导出 tar 文件

### Windows 用户

1. **启动 Docker Desktop**

   - 双击桌面上的 Docker Desktop 图标
   - 或者从开始菜单启动 Docker Desktop
   - 等待 Docker Desktop 完全启动（系统托盘图标变为绿色）

2. **运行构建脚本**
   ```cmd
   # 在项目根目录下运行
   build-docker.bat
   ```

### Linux/Mac 用户

1. **确保 Docker 运行**

   ```bash
   # 检查Docker状态
   docker info

   # 如果Docker未运行，启动Docker服务
   sudo systemctl start docker  # Linux
   # 或者启动Docker Desktop (Mac)
   ```

2. **运行构建脚本**
   ```bash
   # 在项目根目录下运行
   chmod +x build-docker.sh
   ./build-docker.sh
   ```

### 手动构建（如果脚本无法使用）

```bash
# 1. 构建镜像
docker build -t tools-app:latest .

# 2. 导出镜像为tar文件
docker save -o tools-app-latest.tar tools-app:latest

# 3. 查看文件大小
ls -lh tools-app-latest.tar  # Linux/Mac
dir tools-app-latest.tar     # Windows
```

## 🚀 部署到目标服务器

### 方法 1：使用导出的 tar 文件

1. **复制文件到目标服务器**

   ```bash
   # 使用scp复制文件
   scp tools-app-latest.tar user@server:/path/to/destination/

   # 或者使用其他文件传输方式
   ```

2. **在目标服务器上加载镜像**

   ```bash
   # 加载Docker镜像
   docker load -i tools-app-latest.tar

   # 验证镜像加载成功
   docker images | grep tools-app
   ```

3. **运行容器**

   ```bash
   # 简单运行
   docker run -d -p 3001:3001 --name tools-app tools-app:latest

   # 带数据持久化的运行
   docker run -d \
     -p 3001:3001 \
     -v $(pwd)/docker-data/database:/app/data \
     -v $(pwd)/docker-data/uploads:/app/uploads \
     --name tools-app \
     tools-app:latest
   ```

### 方法 2：使用 docker-compose

1. **复制配置文件**

   ```bash
   # 复制docker-compose.yml到目标服务器
   scp docker-compose.yml user@server:/path/to/destination/
   ```

2. **启动服务**
   ```bash
   # 在docker-compose.yml所在目录运行
   docker-compose up -d
   ```

## 🔧 配置说明

### 端口映射

- 默认端口：3001
- 可以通过修改 docker-compose.yml 或运行命令中的端口映射来更改

### 数据持久化

- 数据库文件：`/app/data/storage.db`
- 上传文件：`/app/uploads/storage/`
- 建议挂载这两个目录到宿主机以保证数据持久化

### 环境变量

- `NODE_ENV=production`：生产环境模式
- `PORT=3001`：应用端口

## 📋 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs tools-app

# 进入容器shell
docker exec -it tools-app sh

# 停止容器
docker stop tools-app

# 删除容器
docker rm tools-app

# 删除镜像
docker rmi tools-app:latest

# 查看镜像大小
docker images tools-app
```

## 🛠️ 故障排除

### Docker Desktop 启动问题

- 确保 Hyper-V 和容器功能已启用（Windows）
- 检查系统资源是否充足
- 重启 Docker Desktop

### 构建失败

- 检查网络连接（需要下载依赖）
- 确保有足够的磁盘空间
- 查看构建日志中的错误信息

### 容器运行问题

- 检查端口是否被占用
- 查看容器日志：`docker logs tools-app`
- 确保数据目录权限正确

## 📏 文件大小预估

- Docker 镜像大小：约 400-600MB
- tar 文件大小：约 300-500MB（压缩后）

## 🔄 更新部署

1. 构建新版本镜像
2. 导出新的 tar 文件
3. 在目标服务器上：

   ```bash
   # 停止旧容器
   docker stop tools-app
   docker rm tools-app

   # 加载新镜像
   docker load -i tools-app-latest.tar

   # 启动新容器
   docker run -d -p 3001:3001 --name tools-app tools-app:latest
   ```
