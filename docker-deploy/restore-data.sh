#!/bin/bash

echo "==============================================="
echo "工具箱数据恢复脚本"
echo "==============================================="
echo

# 检查数据目录
if [ ! -d "data" ]; then
    echo "[错误] data目录不存在"
    exit 1
fi

# 列出可用的备份文件
echo "可用的备份文件:"
echo "=================="

# 数据库备份
echo "数据库备份:"
if ls data/storage.db.backup.* >/dev/null 2>&1; then
    ls -la data/storage.db.backup.* | awk '{print $9 " (" $5 " bytes, " $6 " " $7 " " $8 ")"}'
else
    echo "  无数据库备份文件"
fi

echo

# 访问统计备份
echo "访问统计备份:"
if ls data/visit_stats.json.backup.* >/dev/null 2>&1; then
    ls -la data/visit_stats.json.backup.* | awk '{print $9 " (" $5 " bytes, " $6 " " $7 " " $8 ")"}'
else
    echo "  无访问统计备份文件"
fi

echo

# 询问用户选择要恢复的文件
read -p "请输入要恢复的数据库备份文件名 (或按回车跳过): " db_backup
read -p "请输入要恢复的访问统计备份文件名 (或按回车跳过): " stats_backup

# 恢复数据库
if [ ! -z "$db_backup" ]; then
    if [ -f "data/$db_backup" ]; then
        echo "正在恢复数据库..."
        cp "data/$db_backup" "data/storage.db"
        echo "[成功] 数据库已恢复"
    else
        echo "[错误] 备份文件不存在: data/$db_backup"
    fi
fi

# 恢复访问统计
if [ ! -z "$stats_backup" ]; then
    if [ -f "data/$stats_backup" ]; then
        echo "正在恢复访问统计..."
        cp "data/$stats_backup" "data/visit_stats.json"
        echo "[成功] 访问统计已恢复"
    else
        echo "[错误] 备份文件不存在: data/$stats_backup"
    fi
fi

echo
echo "数据恢复完成！"
echo "注意: 如果容器正在运行，需要重启容器以加载恢复的数据"
echo "重启命令: docker restart tools-app" 