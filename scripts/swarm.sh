#!/bin/bash
#
# Theatrical SDK — Agent Swarm Orchestrator
# Powered by Claude Code CLI (parallel headless agents)
#
# Usage:
#   ./scripts/swarm.sh                  Full day: all commits + all support agents
#   ./scripts/swarm.sh morning          Commit slot 1 only (build agent)
#   ./scripts/swarm.sh afternoon        Commit slot 2 only (build agent)
#   ./scripts/swarm.sh evening          Remaining commits + full support swarm
#   ./scripts/swarm.sh build            Build agent only (all remaining today)
#   ./scripts/swarm.sh <agent-name>     Single agent (architect, reviewer, research, profile)
#   ./scripts/swarm.sh --bg             Full day in background
#
# Architecture:
#   - Each run is day-gated: agents calculate today's day number and ONLY do today's work
#   - Commit slots spread work across morning/afternoon/evening for natural commit patterns
#   - Support agents run as PARALLEL Claude Code processes after code is committed
#   - All agents share state via blackboard.json and build-log.json
#   - The build agent is the ONLY agent that modifies the codebase
#
# Day-gating:
#   Day 1 = April 7, 2026. Day number = (today - April 6) in days.
#   If all commits for today are already pushed, agents log completion and exit.
#   Agents NEVER build ahead into future days.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$SCRIPT_DIR/agents"
LOG_DIR="$SCRIPT_DIR/.logs"

mkdir -p "$LOG_DIR"

cd "$REPO_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLOT="${1:-full}"

# ─── Day Gate ───────────────────────────────────────────
# Calculate current day number. If outside 1-30, exit.

EPOCH="2026-04-06"
TODAY=$(date +%Y-%m-%d)
DAY_NUM=$(( ( $(date -d "$TODAY" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$TODAY" +%s) - $(date -d "$EPOCH" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$EPOCH" +%s) ) / 86400 ))

if [ "$DAY_NUM" -lt 1 ] || [ "$DAY_NUM" -gt 30 ]; then
    echo "Day $DAY_NUM is outside the 30-day build window. Nothing to do."
    exit 0
fi

# ─── Helpers ─────────────────────────────────────────────

run_agent() {
    local name="$1"
    local slot="${2:-full}"
    local prompt_file="$AGENTS_DIR/${name}-agent.md"
    local log_file="$LOG_DIR/${name}-${TIMESTAMP}.log"

    if [ ! -f "$prompt_file" ]; then
        echo "  ERROR: $prompt_file not found"
        return 1
    fi

    local prompt
    prompt=$(cat "$prompt_file")

    # Inject commit-slot context for the build agent
    if [ "$name" = "build" ] && [ "$slot" != "full" ]; then
        local slot_instruction=""
        case "$slot" in
            morning)
                slot_instruction="COMMIT SLOT: MORNING. Take the FIRST commit listed in today's playbook section and ATOMIZE it into 4-7 smaller, meaningful micro-commits. Each micro-commit must compile and pass tests. Leave other playbook commits for later runs. Target: 4-7 commits this run."
                ;;
            afternoon)
                slot_instruction="COMMIT SLOT: AFTERNOON. Check git log --since='midnight' to see what the morning run already committed. Take the SECOND commit listed in today's playbook section and ATOMIZE it into 4-7 smaller, meaningful micro-commits. If it's already done, log and exit. If the first commit is missing, atomize that one instead. Target: 4-7 commits this run."
                ;;
            evening)
                slot_instruction="COMMIT SLOT: EVENING. Check git log --since='midnight' to see what morning and afternoon already committed. ATOMIZE ALL REMAINING playbook commits for today into 4-7 micro-commits each. Do not leave anything undone — this is the final run of the day. Target: 4-7 commits per remaining playbook commit."
                ;;
        esac
        prompt="$slot_instruction

$prompt"
    fi

    echo "  ▸ $name agent (slot: $slot) → $log_file"

    echo "$prompt" | claude -p \
        --permission-mode bypassPermissions \
        --model sonnet \
        --allowedTools "Bash,Edit,Read,Write,Glob,Grep,WebSearch,WebFetch" \
        > "$log_file" 2>&1

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "  ✓ $name agent complete"
    else
        echo "  ✗ $name agent failed (exit $exit_code) — see $log_file"
    fi
    return $exit_code
}

run_agent_bg() {
    local name="$1"
    local slot="${2:-full}"
    run_agent "$name" "$slot" &
}

# ─── Banner ──────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       Theatrical SDK — Agent Swarm           ║"
echo "║       Day $DAY_NUM / 30  •  Slot: $SLOT"
echo "║       $(date '+%Y-%m-%d %H:%M:%S')                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Background mode ────────────────────────────────────

if [ "$SLOT" = "--bg" ]; then
    echo "Launching full swarm in background..."
    SLOT="full" nohup "$0" > "$LOG_DIR/swarm-${TIMESTAMP}.log" 2>&1 &
    SWARM_PID=$!
    echo "  PID: $SWARM_PID"
    echo "  Log: $LOG_DIR/swarm-${TIMESTAMP}.log"
    echo ""
    echo "Monitor:"
    echo "  tail -f $LOG_DIR/swarm-${TIMESTAMP}.log"
    echo "  git log --oneline --since='midnight'"
    exit 0
fi

# ─── Single agent mode ───────────────────────────────────

if [ "$SLOT" = "architect" ] || [ "$SLOT" = "reviewer" ] || [ "$SLOT" = "research" ] || [ "$SLOT" = "profile" ]; then
    echo "Running ${SLOT} agent only..."
    run_agent "$SLOT" "full"
    exit $?
fi

if [ "$SLOT" = "build" ]; then
    echo "Running build agent (all remaining commits for today)..."
    run_agent "build" "full"
    exit $?
fi

# ─── Morning slot ────────────────────────────────────────
# Just commit 1 via build agent. No support agents.

if [ "$SLOT" = "morning" ]; then
    echo "Morning run: Build agent — commit slot 1"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "morning"
    exit $?
fi

# ─── Afternoon slot ──────────────────────────────────────
# Just commit 2 via build agent. No support agents.

if [ "$SLOT" = "afternoon" ]; then
    echo "Afternoon run: Build agent — commit slot 2"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "afternoon"
    exit $?
fi

# ─── Evening slot ────────────────────────────────────────
# Remaining commits + full parallel support swarm.

if [ "$SLOT" = "evening" ]; then
    echo "Evening run: Build agent — all remaining commits"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "evening"
    BUILD_EXIT=$?
    echo ""

    if [ $BUILD_EXIT -ne 0 ]; then
        echo "Build agent failed. Running support agents on existing code."
    fi

    echo "Support agents (parallel Claude Code processes)"
    echo "─────────────────────────────────────────────────────"

    run_agent_bg "reviewer" "full"
    REVIEWER_PID=$!

    run_agent_bg "architect" "full"
    ARCHITECT_PID=$!

    run_agent_bg "research" "full"
    RESEARCH_PID=$!

    run_agent_bg "profile" "full"
    PROFILE_PID=$!

    echo "  Waiting for all support agents..."
    wait $REVIEWER_PID 2>/dev/null || true
    wait $ARCHITECT_PID 2>/dev/null || true
    wait $RESEARCH_PID 2>/dev/null || true
    wait $PROFILE_PID 2>/dev/null || true

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║       Evening swarm complete (Day $DAY_NUM)       ║"
    echo "╚══════════════════════════════════════════════╝"
    exit 0
fi

# ─── Full mode (default) ────────────────────────────────
# All commits + full parallel support swarm in one shot.

echo "Phase 1: Build Agent (all commits for Day $DAY_NUM)"
echo "─────────────────────────────────────────────────────"
run_agent "build" "full"
BUILD_EXIT=$?
echo ""

if [ $BUILD_EXIT -ne 0 ]; then
    echo "Build agent failed. Running support agents on existing code."
fi

echo "Phase 2: Support Agents (parallel Claude Code processes)"
echo "─────────────────────────────────────────────────────"

run_agent_bg "reviewer" "full"
REVIEWER_PID=$!

run_agent_bg "architect" "full"
ARCHITECT_PID=$!

run_agent_bg "research" "full"
RESEARCH_PID=$!

run_agent_bg "profile" "full"
PROFILE_PID=$!

echo "  Waiting for all support agents..."
wait $REVIEWER_PID 2>/dev/null || true
wait $ARCHITECT_PID 2>/dev/null || true
wait $RESEARCH_PID 2>/dev/null || true
wait $PROFILE_PID 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          Full swarm complete (Day $DAY_NUM)       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Results:"
echo "  git log --oneline --since='midnight'"
echo "  ls -la $LOG_DIR/*${TIMESTAMP}*"
echo ""
