#!/bin/bash

echo "==============================================="
echo "工具箱Docker部署脚本"
echo "==============================================="
echo

# 检查Docker是否运行
echo "检查Docker状态..."
if ! docker info >/dev/null 2>&1; then
    echo "[错误] Docker未运行或未安装"
    echo "请先启动Docker，然后重新运行此脚本"
    exit 1
fi

echo "[成功] Docker运行正常"
echo

# 检查镜像文件是否存在
if [ ! -f "docker-deploy/tools-app-latest.tar" ]; then
    echo "[错误] 镜像文件 docker-deploy/tools-app-latest.tar 不存在"
    echo "请先运行构建脚本生成镜像文件"
    exit 1
fi

# 停止并删除可能存在的容器
echo "清理可能存在的容器..."
docker stop tools-app >/dev/null 2>&1
docker rm tools-app >/dev/null 2>&1

# 删除可能存在的旧镜像
echo "清理旧镜像..."
docker rmi tools-app:latest >/dev/null 2>&1

# 加载镜像
echo "加载Docker镜像..."
if ! docker load -i docker-deploy/tools-app-latest.tar; then
    echo "[错误] 镜像加载失败"
    exit 1
fi

echo "[成功] 镜像加载完成"
echo

# 创建数据目录
echo "创建数据目录..."
mkdir -p data uploads

# 启动容器
echo "启动容器..."
if ! docker run -d --name tools-app -p 3001:3001 -v "$(pwd)/data:/app/data" -v "$(pwd)/uploads:/app/uploads" --restart unless-stopped tools-app:latest; then
    echo "[错误] 容器启动失败"
    exit 1
fi

echo "[成功] 容器启动完成"
echo

# 等待应用启动
echo "等待应用启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q tools-app; then
    echo "[成功] 应用部署完成！"
    echo
    echo "访问地址: http://localhost:3001"
    echo
    echo "常用命令:"
    echo "  查看日志: docker logs tools-app"
    echo "  停止服务: docker stop tools-app"
    echo "  启动服务: docker start tools-app"
    echo "  重启服务: docker restart tools-app"
    echo "  删除容器: docker rm -f tools-app"
else
    echo "[错误] 容器启动后立即退出"
    echo "查看日志:"
    docker logs tools-app
    exit 1
fi 