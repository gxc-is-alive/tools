@echo off
echo ========================================
echo Docker 部署包测试脚本
echo ========================================

echo 1. 检查文件完整性...
if not exist "tools-app.tar" (
    echo 错误: tools-app.tar 文件不存在
    pause
    exit /b 1
)

echo 2. 检查文件大小...
for %%A in (tools-app.tar) do set size=%%~zA
echo 镜像文件大小: %size% 字节

if %size% LSS 100000000 (
    echo 警告: 镜像文件可能不完整 (小于100MB)
)

echo 3. 测试镜像加载...
docker load -i tools-app.tar

if %errorlevel% neq 0 (
    echo 错误: 镜像加载测试失败
    pause
    exit /b 1
)

echo 4. 检查镜像信息...
docker images tools-tools-app:latest

echo.
echo ========================================
echo 测试完成！镜像文件正常
echo ========================================
echo 现在可以运行 deploy.bat 进行完整部署
echo ========================================

pause 