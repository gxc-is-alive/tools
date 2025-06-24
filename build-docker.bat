@echo off
echo ===============================================
echo 工具箱Docker构建和导出脚本
echo ===============================================
echo.

REM 检查Docker是否运行
echo 检查Docker状态...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker Desktop未运行或未安装
    echo 请先启动Docker Desktop，然后重新运行此脚本
    pause
    exit /b 1
)

echo [成功] Docker运行正常
echo.

REM 构建Docker镜像
echo 开始构建Docker镜像...
echo 镜像名称: tools-app:latest
echo.
docker build -t tools-app:latest .
if %errorlevel% neq 0 (
    echo [错误] Docker镜像构建失败
    pause
    exit /b 1
)

echo [成功] Docker镜像构建完成
echo.

REM 导出Docker镜像为tar文件
echo 导出Docker镜像为tar文件...
set OUTPUT_FILE=tools-app-latest.tar
docker save -o %OUTPUT_FILE% tools-app:latest
if %errorlevel% neq 0 (
    echo [错误] Docker镜像导出失败
    pause
    exit /b 1
)

echo [成功] Docker镜像已导出为: %OUTPUT_FILE%
echo.

REM 显示文件信息
echo 文件信息:
dir %OUTPUT_FILE%
echo.

REM 显示使用说明
echo ===============================================
echo 构建和导出完成！
echo ===============================================
echo.
echo 生成的文件: %OUTPUT_FILE%
echo.
echo 使用方法:
echo 1. 将 %OUTPUT_FILE% 复制到目标服务器
echo 2. 在目标服务器上运行: docker load -i %OUTPUT_FILE%
echo 3. 运行容器: docker run -d -p 3001:3001 --name tools-app tools-app:latest
echo.
echo 或者使用docker-compose:
echo 1. 复制 docker-compose.yml 到目标服务器
echo 2. 运行: docker-compose up -d
echo.
pause 