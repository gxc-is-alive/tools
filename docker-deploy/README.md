# Docker 应用部署包

这是一个完整的 Docker 应用部署包，包含镜像文件和部署脚本。

## 文件说明

- `tools-app.tar` - Docker 镜像文件 (约 470MB)
- `deploy.bat` - Windows 部署脚本
- `deploy.sh` - Linux/Mac 部署脚本
- `docker-compose.yml` - Docker Compose 配置文件
- `README.md` - 本说明文档

## 部署要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少 2GB 可用磁盘空间
- 端口 3001 未被占用

## 快速部署

### Windows 用户

```bash
# 双击运行
deploy.bat
```

### Linux/Mac 用户

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 使用 Docker Compose

```bash
# 1. 加载镜像
docker load -i tools-app.tar

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

## 手动部署

如果脚本无法运行，可以手动执行以下步骤：

```bash
# 1. 加载镜像
docker load -i tools-app.tar

# 2. 创建数据目录
mkdir -p data uploads

# 3. 启动容器
docker run -d \
    --name tools-app \
    -p 3001:3001 \
    -v "$(pwd)/data:/app/data" \
    -v "$(pwd)/uploads:/app/uploads" \
    --restart unless-stopped \
    tools-tools-app:latest
```

## 访问应用

部署完成后，打开浏览器访问：

- http://localhost:3001

## 常用命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs tools-app

# 停止容器
docker stop tools-app

# 启动容器
docker start tools-app

# 重启容器
docker restart tools-app

# 删除容器
docker rm -f tools-app

# 删除镜像
docker rmi tools-tools-app:latest
```

## 数据持久化

应用数据存储在以下目录：

- `./data` - 数据库文件
- `./uploads` - 上传的文件

这些目录会自动创建并挂载到容器中。

## 故障排除

### 端口被占用

如果 3001 端口被占用，可以修改端口映射：

```bash
docker run -d --name tools-app -p 3002:3001 tools-tools-app:latest
```

### 容器启动失败

查看详细日志：

```bash
docker logs tools-app
```

### 权限问题 (Linux)

确保当前用户有 Docker 权限：

```bash
sudo usermod -aG docker $USER
```

## 应用功能

这是一个多功能工具集合，包含：

- WebP 图片转换
- API 测试工具
- 文本对比工具
- 时间戳转换
- Base64 编解码
- JSON 格式化
- 备忘录功能
- 错误监控

## 技术支持

如有问题，请检查：

1. Docker 是否正常运行
2. 端口 3001 是否被占用
3. 磁盘空间是否充足
4. 防火墙设置
