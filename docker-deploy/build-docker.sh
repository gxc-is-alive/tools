#!/bin/bash

echo "==============================================="
echo "工具箱Docker构建和导出脚本"
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

# 停止并删除可能存在的测试容器
echo "清理可能存在的测试容器..."
docker stop tools-app-test >/dev/null 2>&1
docker rm tools-app-test >/dev/null 2>&1

# 构建Docker镜像
echo "开始构建Docker镜像..."
echo "镜像名称: tools-app:latest"
echo
if ! docker build -t tools-app:latest .; then
    echo "[错误] Docker镜像构建失败"
    exit 1
fi

echo "[成功] Docker镜像构建完成"
echo

# 测试镜像是否能正常启动
echo "测试镜像启动..."
if ! docker run -d --name tools-app-test -p 3001:3001 tools-app:latest; then
    echo "[错误] 镜像启动测试失败"
    exit 1
fi

# 等待几秒钟让应用启动
echo "等待应用启动..."
sleep 5

# 检查容器是否正常运行
if ! docker ps | grep -q tools-app-test; then
    echo "[错误] 容器启动后立即退出，请检查日志"
    docker logs tools-app-test
    docker stop tools-app-test >/dev/null 2>&1
    docker rm tools-app-test >/dev/null 2>&1
    exit 1
fi

echo "[成功] 镜像启动测试通过"
echo

# 停止测试容器
echo "停止测试容器..."
docker stop tools-app-test >/dev/null 2>&1
docker rm tools-app-test >/dev/null 2>&1

# 导出Docker镜像为tar文件
echo "导出Docker镜像为tar文件..."
OUTPUT_FILE="tools-app-latest.tar"
if ! docker save -o "$OUTPUT_FILE" tools-app:latest; then
    echo "[错误] Docker镜像导出失败"
    exit 1
fi

echo "[成功] Docker镜像已导出为: $OUTPUT_FILE"
echo

# 显示文件信息
echo "文件信息:"
ls -lh "$OUTPUT_FILE"
echo

# 显示镜像信息
echo "镜像信息:"
docker images | grep tools-app
echo

# 显示使用说明
echo "==============================================="
echo "构建和导出完成！"
echo "==============================================="
echo
echo "生成的文件: $OUTPUT_FILE"
echo
echo "使用方法:"
echo "1. 将 $OUTPUT_FILE 复制到 docker-deploy 目录"
echo "2. 在目标服务器上运行: docker load -i $OUTPUT_FILE"
echo "3. 运行容器: docker run -d -p 3001:3001 --name tools-app tools-app:latest"
echo
echo "或者使用docker-compose:"
echo "1. 复制 docker-compose.yml 到目标服务器"
echo "2. 运行: docker-compose up -d"
echo
echo "测试访问: http://localhost:3001" 