# 工具箱 Docker 部署包

这是一个完整的 Docker 应用部署包，包含镜像文件和部署脚本。

## 文件说明

### 镜像文件

- `tools-app.tar` - 最新 Docker 镜像文件 (约 480MB)

### 构建脚本

- `build-docker.bat` - Windows 构建脚本 (包含自动测试)
- `build-docker.sh` - Linux/Mac 构建脚本 (包含自动测试)

### 部署脚本

- `deploy.bat` - Windows 部署脚本
- `deploy.sh` - Linux/Mac 部署脚本

### 数据管理脚本

- `restore-data.bat` - Windows 数据恢复脚本
- `restore-data.sh` - Linux/Mac 数据恢复脚本

### 配置文件

- `docker-compose.yml` - Docker Compose 配置文件
- `Dockerfile` - Docker 镜像构建文件
- `README.md` - 本说明文档

## 构建新镜像

### Windows 用户

```bash
# 运行构建脚本
build-docker.bat
```

### Linux/Mac 用户

```bash
# 给脚本执行权限
chmod +x build-docker.sh

# 运行构建脚本
./build-docker.sh
```

构建脚本会自动：

1. 检查 Docker 环境
2. 构建新镜像
3. 测试镜像启动
4. 导出 tar 文件

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
    tools-app:latest
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
docker rmi tools-app:latest
```

## 数据持久化

### 数据目录

应用数据存储在以下目录：

- `./data` - 数据库文件和访问统计
- `./uploads` - 上传的文件

这些目录会自动创建并挂载到容器中。

### 数据备份

部署脚本会自动备份现有数据：

- 数据库文件：`data/storage.db.backup.YYYYMMDD_HHMMSS`
- 访问统计：`data/visit_stats.json.backup.YYYYMMDD_HHMMSS`

### 数据恢复

如果数据丢失，可以使用恢复脚本：

#### Windows 用户

```bash
# 运行恢复脚本
restore-data.bat
```

#### Linux/Mac 用户

```bash
# 给脚本执行权限
chmod +x restore-data.sh

# 运行恢复脚本
./restore-data.sh
```

#### 手动恢复

```bash
# 查看备份文件
ls -la data/*.backup.*

# 恢复数据库
cp data/storage.db.backup.YYYYMMDD_HHMMSS data/storage.db

# 恢复访问统计
cp data/visit_stats.json.backup.YYYYMMDD_HHMMSS data/visit_stats.json

# 重启容器以加载恢复的数据
docker restart tools-app
```

### 数据安全

- 每次部署前会自动备份现有数据
- 备份文件包含时间戳，便于识别
- 建议定期手动备份重要数据
- 可以将 `data` 目录复制到安全位置

## 故障排除

### 端口被占用

如果 3001 端口被占用，可以修改端口映射：

```bash
docker run -d --name tools-app -p 3002:3001 tools-app:latest
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

### 原生模块问题

如果遇到 sqlite3 或 sharp 模块问题，确保：

1. 使用最新版本的镜像
2. 容器有足够的构建工具
3. 依赖正确安装

### 脚本执行问题 (Linux)

如果遇到脚本执行问题：

```bash
# 设置执行权限
chmod +x *.sh

# 修复换行符问题
sed -i 's/\r$//' deploy.sh
sed -i 's/\r$//' build-docker.sh
```

### 数据丢失问题

如果发现数据丢失：

1. 检查 `data` 目录是否存在备份文件
2. 使用恢复脚本恢复数据
3. 重启容器加载恢复的数据
4. 检查数据卷映射是否正确

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
- 访问统计

## 版本更新

### 最新版本特性

- 修复了 sqlite3 原生模块在 Docker 中的兼容性问题
- 使用 npm 替代 pnpm 在生产阶段安装依赖
- 添加了自动测试功能
- 优化了构建流程
- 改进了错误处理和日志输出

## 技术支持

如有问题，请检查：

1. Docker 是否正常运行
2. 端口 3001 是否被占用
3. 磁盘空间是否充足
4. 防火墙设置
5. 使用最新版本的镜像文件
6. 脚本执行权限 (Linux)
