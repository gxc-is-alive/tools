#!/bin/bash

echo "========================================"
echo "Docker 应用部署脚本"
echo "========================================"

# 检查Docker是否运行
if ! docker version >/dev/null 2>&1; then
    echo "错误: Docker未运行，请先启动Docker"
    exit 1
fi

echo "1. 检查现有容器..."
docker ps -a --filter "name=tools-app" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "2. 停止并删除现有容器..."
docker stop tools-app 2>/dev/null
docker rm tools-app 2>/dev/null

echo ""
echo "3. 删除现有镜像..."
docker rmi tools-tools-app:latest 2>/dev/null

echo ""
echo "4. 加载Docker镜像..."
docker load -i tools-app.tar

if [ $? -ne 0 ]; then
    echo "错误: 镜像加载失败"
    exit 1
fi

echo ""
echo "5. 创建数据目录..."
mkdir -p data uploads

echo ""
echo "6. 启动容器..."
docker run -d \
    --name tools-app \
    -p 3001:3001 \
    -v "$(pwd)/data:/app/data" \
    -v "$(pwd)/uploads:/app/uploads" \
    --restart unless-stopped \
    tools-tools-app:latest

if [ $? -ne 0 ]; then
    echo "错误: 容器启动失败"
    exit 1
fi

echo ""
echo "7. 检查容器状态..."
sleep 3
docker ps --filter "name=tools-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "========================================"
echo "部署完成！"
echo "========================================"
echo "应用地址: http://localhost:3001"
echo "容器名称: tools-app"
echo ""
echo "常用命令:"
echo "  查看日志: docker logs tools-app"
echo "  停止容器: docker stop tools-app"
echo "  启动容器: docker start tools-app"
echo "  重启容器: docker restart tools-app"
echo "  删除容器: docker rm -f tools-app"
echo "========================================" 