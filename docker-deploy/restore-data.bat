@echo off
echo ===============================================
echo 工具箱数据恢复脚本
echo ===============================================
echo.

REM 检查数据目录
if not exist "data" (
    echo [错误] data目录不存在
    pause
    exit /b 1
)

REM 列出可用的备份文件
echo 可用的备份文件:
echo ==================

REM 数据库备份
echo 数据库备份:
if exist "data\storage.db.backup.*" (
    for %%f in (data\storage.db.backup.*) do (
        echo   %%f
    )
) else (
    echo   无数据库备份文件
)

echo.

REM 访问统计备份
echo 访问统计备份:
if exist "data\visit_stats.json.backup.*" (
    for %%f in (data\visit_stats.json.backup.*) do (
        echo   %%f
    )
) else (
    echo   无访问统计备份文件
)

echo.

REM 询问用户选择要恢复的文件
set /p db_backup="请输入要恢复的数据库备份文件名 (或按回车跳过): "
set /p stats_backup="请输入要恢复的访问统计备份文件名 (或按回车跳过): "

REM 恢复数据库
if not "%db_backup%"=="" (
    if exist "data\%db_backup%" (
        echo 正在恢复数据库...
        copy "data\%db_backup%" "data\storage.db"
        echo [成功] 数据库已恢复
    ) else (
        echo [错误] 备份文件不存在: data\%db_backup%
    )
)

REM 恢复访问统计
if not "%stats_backup%"=="" (
    if exist "data\%stats_backup%" (
        echo 正在恢复访问统计...
        copy "data\%stats_backup%" "data\visit_stats.json"
        echo [成功] 访问统计已恢复
    ) else (
        echo [错误] 备份文件不存在: data\%stats_backup%
    )
)

echo.
echo 数据恢复完成！
echo 注意: 如果容器正在运行，需要重启容器以加载恢复的数据
echo 重启命令: docker restart tools-app
pause 