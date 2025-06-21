#!/bin/bash

echo "🚀 启动在线工具箱 - Vue3版本"
echo "================================"

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 正在构建前端应用..."
    pnpm build
fi

# 启动服务器
echo "🌐 启动服务器在 http://localhost:3001"
echo "按 Ctrl+C 停止服务器"
echo ""

node server.js 