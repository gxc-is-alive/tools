#!/bin/bash

echo "正在启动支持局域网访问的开发服务器..."
echo ""
echo "请确保已安装依赖: pnpm install"
echo ""

# 获取本机IP地址
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP="localhost"
fi

echo "本机IP地址: $LOCAL_IP"
echo "局域网访问地址将显示在服务器启动后"
echo ""

pnpm run dev 