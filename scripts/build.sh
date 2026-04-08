#!/bin/bash
#
# Theatrical SDK — Autonomous Build Agent
#
# Usage:
#   ./scripts/build.sh          Run today's commits
#   ./scripts/build.sh --bg     Run in background (detached)
#
# This launches a Claude Code agent that:
#   1. Reads the 30-day playbook
#   2. Figures out what day it is
#   3. Checks what's already committed
#   4. Builds and commits everything remaining for today
#   5. Pushes to GitHub
#   6. Updates the build log with what it learned
#
# No human input required. No permission prompts.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PROMPT_FILE="$SCRIPT_DIR/build-agent.md"
LOG_FILE="$REPO_DIR/../theatrical-task-queue/build-log.json"

# Ensure we're in the repo
cd "$REPO_DIR"

echo "============================================"
echo "  Theatrical SDK — Build Agent"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# Check prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: Agent prompt not found at $PROMPT_FILE"
    exit 1
fi

# Read the prompt
PROMPT=$(cat "$PROMPT_FILE")

# Background mode
if [ "${1:-}" = "--bg" ]; then
    echo "Launching in background..."
    nohup claude -p \
        --permission-mode bypassPermissions \
        --model sonnet \
        --allowedTools "Bash Edit Read Write Glob Grep" \
        "$PROMPT" \
        > "$REPO_DIR/scripts/.build-output-$(date +%Y%m%d-%H%M%S).log" 2>&1 &

    BUILD_PID=$!
    echo "Agent running in background (PID: $BUILD_PID)"
    echo "Log: $REPO_DIR/scripts/.build-output-$(date +%Y%m%d-%H%M%S).log"
    echo ""
    echo "Check progress:"
    echo "  tail -f $REPO_DIR/scripts/.build-output-$(date +%Y%m%d-%H%M%S).log"
    echo "  git log --oneline --since='midnight'"
    exit 0
fi

# Foreground mode — you can watch it work
echo "Starting build agent..."
echo "Press Ctrl+C to stop (commits already pushed are safe)"
echo ""

claude -p \
    --permission-mode bypassPermissions \
    --model sonnet \
    --allowedTools "Bash Edit Read Write Glob Grep" \
    "$PROMPT"

echo ""
echo "============================================"
echo "  Build complete. Check: git log --oneline"
echo "============================================"
