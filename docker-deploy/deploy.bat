@echo off
echo ===============================================
echo 工具箱Docker部署脚本
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

REM 检查镜像文件是否存在
if not exist "tools-app.tar" (
    echo [错误] 镜像文件 tools-app.tar 不存在
    echo 请先运行构建脚本生成镜像文件
    pause
    exit /b 1
)

REM 创建数据目录
echo 创建数据目录...
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads

REM 备份现有数据
echo 备份现有数据...
set backup_time=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_time=%backup_time: =0%

if exist "data\storage.db" (
    copy "data\storage.db" "data\storage.db.backup.%backup_time%"
    echo [成功] 数据库已备份
)

if exist "data\visit_stats.json" (
    copy "data\visit_stats.json" "data\visit_stats.json.backup.%backup_time%"
    echo [成功] 访问统计已备份
)

REM 停止并删除可能存在的容器
echo 清理可能存在的容器...
docker stop tools-app >nul 2>&1
docker rm tools-app >nul 2>&1

REM 删除可能存在的旧镜像
echo 清理旧镜像...
docker rmi tools-app:latest >nul 2>&1

REM 加载镜像
echo 加载Docker镜像...
docker load -i tools-app.tar
if %errorlevel% neq 0 (
    echo [错误] 镜像加载失败
    pause
    exit /b 1
)

echo [成功] 镜像加载完成
echo.

REM 启动容器
echo 启动容器...
docker run -d --name tools-app -p 3001:3001 -v "%cd%/data:/app/data" -v "%cd%/uploads:/app/uploads" --restart unless-stopped tools-app:latest
if %errorlevel% neq 0 (
    echo [错误] 容器启动失败
    pause
    exit /b 1
)

echo [成功] 容器启动完成
echo.

REM 等待应用启动
echo 等待应用启动...
timeout /t 5 /nobreak >nul

REM 检查容器状态
docker ps | findstr tools-app >nul
if %errorlevel% equ 0 (
    echo [成功] 应用部署完成！
    echo.
    echo 访问地址: http://localhost:3001
    echo.
    echo 数据目录:
    echo   数据库文件: %cd%\data\storage.db
    echo   上传文件: %cd%\uploads\
    echo   备份文件: %cd%\data\*.backup.*
    echo.
    echo 常用命令:
    echo   查看日志: docker logs tools-app
    echo   停止服务: docker stop tools-app
    echo   启动服务: docker start tools-app
    echo   重启服务: docker restart tools-app
    echo   删除容器: docker rm -f tools-app
    echo.
    echo 数据管理:
    echo   查看备份: dir data\*.backup.*
    echo   恢复数据: copy data\storage.db.backup.YYYYMMDD_HHMMSS data\storage.db
) else (
    echo [错误] 容器启动后立即退出
    echo 查看日志:
    docker logs tools-app
    pause
    exit /b 1
)

pause 