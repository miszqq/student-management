#!/bin/bash
LOG_FILE="/Users/mis_right/student-management/logs/tunnel-output.log"
if [ -f "$LOG_FILE" ]; then
    grep -o 'https://[a-zA-Z0-9.-]*\.lhr\.life' "$LOG_FILE" | tail -1
else
    echo "隧道日志不存在，服务可能未启动"
fi
