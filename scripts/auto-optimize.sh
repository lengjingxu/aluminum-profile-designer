#!/bin/bash
# aluminum-profile-designer 自动优化脚本
# 每10分钟执行：找pending任务 → 实现 → 更新状态 → 部署 → GitHub

set -e

PROJECT="/tmp/aluminum-profile-designer"
DEPLOY_DIR="/tmp/aluminum-profile-designer-deploy"
LOG_FILE="/tmp/aluminum-optimize.log"

log() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$PROJECT"

# 读取第一个 pending 任务的编号
TASK_ID=$(grep -n "^## T" TASK_BACKLOG.md | grep -B1 "pending" | head -1 | sed 's/:.*//')
if [ -z "$TASK_ID" ]; then
  log "所有任务已完成，退出"
  exit 0
fi

# 提取任务标题
TASK_TITLE=$(sed -n "${TASK_ID}s/^## //p" TASK_BACKLOG.md | sed 's/ - .*//')
TASK_FILES=$(sed -n "${TASK_ID},$((TASK_ID+3))p" TASK_BACKLOG.md | grep "文件：" | sed 's/.*文件：//')

log "开始执行: $TASK_TITLE"
log "涉及文件: $TASK_FILES"

# 标记为进行中
sed -i "s/^## T${TASK_ID:2} - .*/## T${TASK_ID:2} - $TASK_TITLE\n**状态：in_progress**/" TASK_BACKLOG.md

echo "脚本执行中，任务 $TASK_TITLE 已标记为进行中"
echo "实际代码实现由 Hermes Agent 子代理完成"
