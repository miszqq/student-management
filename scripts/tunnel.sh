#!/bin/bash
LOG_DIR="/Users/mis_right/student-management/logs"
URL_FILE="$LOG_DIR/tunnel-url.txt"

ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -R 80:localhost:3000 \
    nokey@localhost.run > "$LOG_DIR/tunnel-output.log" 2>&1
