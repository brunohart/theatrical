#!/bin/bash
#
# Theatrical SDK — Agent Swarm Orchestrator v3
# Powered by Claude Code CLI (sandbox-aware, self-healing)
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
# v3 Changes (2026-04-14):
#   - BUILD_TIMEOUT increased to 600s (10 min). Prior 480s caused 100% timeout rate Day 7+.
#   - Build agent prompt rewritten: eliminated STEP 0 context load, front-loaded all known fixes.
#   - CLONE_FIRST: build agent prompt instructs clone to /tmp (bypasses bindfs HEAD.lock).
#   - SELF-HEALING: agents commit fixes to their own prompts, not just build-log notes.
#   - REPO_URL injected into prompt so build agent can clone without parsing.
#   - Failure log consolidated — deduplicates "Same pattern" entries.
#
# Architecture:
#   - Each run is day-gated: agents calculate today's day number and ONLY do today's work
#   - Commit slots spread work across morning/afternoon/evening for natural commit patterns
#   - Support agents run in parallel after code is committed (with timeout enforcement)
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
FAILURES_LOG="$LOG_DIR/failures.log"

mkdir -p "$LOG_DIR"

cd "$REPO_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLOT="${1:-full}"

# ─── Path Resolution ────────────────────────────────────
# BASE_DIR = the "Vista Group" parent directory that contains theatrical/, theatrical-task-queue/, etc.

BASE_DIR="$(dirname "$REPO_DIR")"

# Get the repo URL (with PAT) for injection into agent prompts
REPO_URL=$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
    echo "ERROR: Cannot determine repo URL from git remote"
    exit 1
fi

# ─── Day Gate ───────────────────────────────────────────

EPOCH="2026-04-06"
TODAY=$(date +%Y-%m-%d)
DAY_NUM=$(( ( $(date -d "$TODAY" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$TODAY" +%s) - $(date -d "$EPOCH" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$EPOCH" +%s) ) / 86400 ))

if [ "$DAY_NUM" -lt 1 ] || [ "$DAY_NUM" -gt 30 ]; then
    echo "Day $DAY_NUM is outside the 30-day build window. Nothing to do."
    exit 0
fi

# ─── Agent Timeouts ─────────────────────────────────────
# Build: 10 min (was 8 — caused 100% timeout Day 7+)
# Support: 5 min (was 4 — reviewer/research hit this consistently)
BUILD_TIMEOUT=600
SUPPORT_TIMEOUT=300

# ─── Helpers ─────────────────────────────────────────────

load_and_patch_prompt() {
    local name="$1"
    local prompt_file="$AGENTS_DIR/${name}-agent.md"

    if [ ! -f "$prompt_file" ]; then
        echo ""
        return 1
    fi

    local prompt
    prompt=$(cat "$prompt_file")

    # Replace {{BASE_DIR}} placeholder with actual path
    prompt="${prompt//\{\{BASE_DIR\}\}/$BASE_DIR}"

    echo "$prompt"
}

run_agent() {
    local name="$1"
    local slot="${2:-full}"
    local timeout_secs="${3:-$SUPPORT_TIMEOUT}"
    local log_file="$LOG_DIR/${name}-${TIMESTAMP}.log"

    local prompt
    prompt=$(load_and_patch_prompt "$name")
    if [ -z "$prompt" ]; then
        echo "  ERROR: $AGENTS_DIR/${name}-agent.md not found"
        echo "[$(date -Iseconds)] AGENT_MISSING — ${name}-agent.md not found" >> "$FAILURES_LOG"
        return 1
    fi

    # ── Build agent: inject slot, repo URL, and clone-first instructions ──
    if [ "$name" = "build" ]; then
        local build_preamble="REPO_URL: $REPO_URL
WORKING_BASE: $BASE_DIR
TODAY: $TODAY
DAY_NUMBER: $DAY_NUM

"
        # Inject commit-slot context
        if [ "$slot" != "full" ]; then
            local slot_instruction=""
            case "$slot" in
                morning)
                    slot_instruction="COMMIT SLOT: MORNING. Atomize the FIRST playbook commit into 4-7 micro-commits. Leave others for later runs."
                    ;;
                afternoon)
                    slot_instruction="COMMIT SLOT: AFTERNOON. Check git log --since='midnight' for morning work. Atomize the SECOND playbook commit. If done, exit."
                    ;;
                evening)
                    slot_instruction="COMMIT SLOT: EVENING. Final run of the day. Atomize ALL REMAINING playbook commits. Do not leave anything undone."
                    ;;
            esac
            build_preamble="${build_preamble}${slot_instruction}

"
        fi
        prompt="${build_preamble}${prompt}"
    fi

    # ── Support agents: inject fast-mode and path context ──
    if [ "$name" != "build" ]; then
        local fast_mode="EXECUTION MODE: FAST (${timeout_secs}s timeout). You are running with a hard timeout.
WORKING DIRECTORY: $REPO_DIR
BASE PATH: $BASE_DIR
DAY_NUMBER: $DAY_NUM

PRIORITY: Write findings to the blackboard EARLY and OFTEN. A partial analysis that saves 3 findings beats a thorough analysis that gets killed before writing anything. Update blackboard after EVERY file you review, not at the end.

CLONE PROTOCOL: If the mounted repo has lock file issues, clone fresh:
  git clone $REPO_URL /tmp/theatrical_${name} && cd /tmp/theatrical_${name}

"
        prompt="${fast_mode}${prompt}"
    fi

    # Inject recent failures for self-learning (last 5 only — keep it lean)
    if [ -f "$FAILURES_LOG" ] && [ -s "$FAILURES_LOG" ]; then
        local recent_failures
        recent_failures=$(tail -5 "$FAILURES_LOG")
        prompt="RECENT FAILURES (do not repeat these):
${recent_failures}

${prompt}"
    fi

    echo "  ▸ $name agent (slot: $slot, timeout: ${timeout_secs}s) → $log_file"

    # Run with timeout
    local exit_code=0
    timeout "$timeout_secs" bash -c 'echo "$1" | claude -p \
        --permission-mode bypassPermissions \
        --model sonnet \
        --allowedTools "Bash,Edit,Read,Write,Glob,Grep,WebSearch,WebFetch"' \
        -- "$prompt" > "$log_file" 2>&1 || exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "  ✓ $name agent complete"
    elif [ $exit_code -eq 124 ]; then
        echo "  ⏱ $name agent TIMED OUT after ${timeout_secs}s — see $log_file"
        echo "[$(date -Iseconds)] TIMEOUT — $name agent killed after ${timeout_secs}s (slot: $slot, day: $DAY_NUM)" >> "$FAILURES_LOG"
    else
        echo "  ✗ $name agent failed (exit $exit_code) — see $log_file"
        echo "[$(date -Iseconds)] FAILED — $name agent exit $exit_code (slot: $slot, day: $DAY_NUM)" >> "$FAILURES_LOG"
    fi

    return $exit_code
}

run_agent_bg() {
    local name="$1"
    local slot="${2:-full}"
    local timeout_secs="${3:-$SUPPORT_TIMEOUT}"
    run_agent "$name" "$slot" "$timeout_secs" &
}

verify_push() {
    echo ""
    echo "Push verification..."
    local local_head remote_head
    local_head=$(git -C "$REPO_DIR" rev-parse HEAD 2>/dev/null || echo "unknown")
    # Use /tmp clone if it exists (build agent works there)
    if [ -d "/tmp/theatrical_build" ]; then
        local_head=$(git -C /tmp/theatrical_build rev-parse HEAD 2>/dev/null || echo "$local_head")
    fi
    remote_head=$(git ls-remote "$REPO_URL" HEAD 2>/dev/null | cut -f1 || echo "unknown")

    if [ "$local_head" = "$remote_head" ]; then
        echo "  ✓ Push verified: HEAD matches origin ($local_head)"
    else
        echo "  ✗ PUSH GAP: local=$local_head remote=$remote_head"
        echo "[$(date -Iseconds)] PUSH_GAP — local $local_head != remote $remote_head (day: $DAY_NUM)" >> "$FAILURES_LOG"
    fi
}

# ─── Banner ──────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       Theatrical SDK — Agent Swarm v3        ║"
echo "║       Day $DAY_NUM / 30  •  Slot: $SLOT"
echo "║       $(date '+%Y-%m-%d %H:%M:%S')                    ║"
echo "║       Base: $BASE_DIR"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Show recent failures if any
if [ -f "$FAILURES_LOG" ] && [ -s "$FAILURES_LOG" ]; then
    FAILURE_COUNT=$(wc -l < "$FAILURES_LOG")
    echo "⚠ ${FAILURE_COUNT} logged failures (last 3):"
    tail -3 "$FAILURES_LOG"
    echo ""
fi

# ─── Background mode ────────────────────────────────────

if [ "$SLOT" = "--bg" ]; then
    echo "Launching full swarm in background..."
    SLOT="full" nohup "$0" > "$LOG_DIR/swarm-${TIMESTAMP}.log" 2>&1 &
    SWARM_PID=$!
    echo "  PID: $SWARM_PID → $LOG_DIR/swarm-${TIMESTAMP}.log"
    exit 0
fi

# ─── Single agent mode ───────────────────────────────────

if [ "$SLOT" = "architect" ] || [ "$SLOT" = "reviewer" ] || [ "$SLOT" = "research" ] || [ "$SLOT" = "profile" ]; then
    echo "Running ${SLOT} agent only..."
    run_agent "$SLOT" "full" "$SUPPORT_TIMEOUT"
    exit $?
fi

if [ "$SLOT" = "build" ]; then
    echo "Running build agent (all remaining commits for today)..."
    run_agent "build" "full" "$BUILD_TIMEOUT"
    BUILD_EXIT=$?
    verify_push
    exit $BUILD_EXIT
fi

# ─── Morning slot ────────────────────────────────────────

if [ "$SLOT" = "morning" ]; then
    echo "Morning: Build agent — commit slot 1"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "morning" "$BUILD_TIMEOUT"
    BUILD_EXIT=$?
    verify_push
    exit $BUILD_EXIT
fi

# ─── Afternoon slot ──────────────────────────────────────

if [ "$SLOT" = "afternoon" ]; then
    echo "Afternoon: Build agent — commit slot 2"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "afternoon" "$BUILD_TIMEOUT"
    BUILD_EXIT=$?
    verify_push
    exit $BUILD_EXIT
fi

# ─── Evening slot ────────────────────────────────────────

if [ "$SLOT" = "evening" ]; then
    echo "Evening: Build agent — all remaining commits"
    echo "─────────────────────────────────────────────────────"
    run_agent "build" "evening" "$BUILD_TIMEOUT"
    BUILD_EXIT=$?
    verify_push
    echo ""

    if [ $BUILD_EXIT -ne 0 ]; then
        echo "Build agent failed (exit $BUILD_EXIT). Running support agents on existing code."
    fi

    echo "Support agents (parallel, ${SUPPORT_TIMEOUT}s timeout each)"
    echo "─────────────────────────────────────────────────────"

    run_agent_bg "architect" "full" "$SUPPORT_TIMEOUT"
    ARCHITECT_PID=$!
    run_agent_bg "profile" "full" "$SUPPORT_TIMEOUT"
    PROFILE_PID=$!
    run_agent_bg "reviewer" "full" "$SUPPORT_TIMEOUT"
    REVIEWER_PID=$!
    run_agent_bg "research" "full" "$SUPPORT_TIMEOUT"
    RESEARCH_PID=$!

    SUPPORT_FAILURES=0
    for PID_NAME in "$ARCHITECT_PID:architect" "$PROFILE_PID:profile" "$REVIEWER_PID:reviewer" "$RESEARCH_PID:research"; do
        PID="${PID_NAME%%:*}"
        NAME="${PID_NAME##*:}"
        wait "$PID" 2>/dev/null
        EXIT=$?
        [ $EXIT -ne 0 ] && SUPPORT_FAILURES=$((SUPPORT_FAILURES + 1))
        echo "  ${NAME}: $([ $EXIT -eq 0 ] && echo '✓' || echo "✗ exit $EXIT")"
    done

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║  Evening complete (Day $DAY_NUM)                  ║"
    echo "║  Build: $([ $BUILD_EXIT -eq 0 ] && echo 'OK' || echo "FAIL")  Support: $((4 - SUPPORT_FAILURES))/4 OK       ║"
    echo "╚══════════════════════════════════════════════╝"
    exit $BUILD_EXIT
fi

# ─── Full mode (default) ────────────────────────────────

echo "Phase 1: Build Agent (all commits for Day $DAY_NUM)"
echo "─────────────────────────────────────────────────────"
run_agent "build" "full" "$BUILD_TIMEOUT"
BUILD_EXIT=$?
verify_push
echo ""

if [ $BUILD_EXIT -ne 0 ]; then
    echo "Build agent failed. Running support agents on existing code."
fi

echo "Phase 2: Support Agents (parallel, ${SUPPORT_TIMEOUT}s timeout each)"
echo "─────────────────────────────────────────────────────"

run_agent_bg "architect" "full" "$SUPPORT_TIMEOUT"
ARCHITECT_PID=$!
run_agent_bg "profile" "full" "$SUPPORT_TIMEOUT"
PROFILE_PID=$!
run_agent_bg "reviewer" "full" "$SUPPORT_TIMEOUT"
REVIEWER_PID=$!
run_agent_bg "research" "full" "$SUPPORT_TIMEOUT"
RESEARCH_PID=$!

SUPPORT_FAILURES=0
for PID_NAME in "$ARCHITECT_PID:architect" "$PROFILE_PID:profile" "$REVIEWER_PID:reviewer" "$RESEARCH_PID:research"; do
    PID="${PID_NAME%%:*}"
    NAME="${PID_NAME##*:}"
    wait "$PID" 2>/dev/null
    EXIT=$?
    [ $EXIT -ne 0 ] && SUPPORT_FAILURES=$((SUPPORT_FAILURES + 1))
    echo "  ${NAME}: $([ $EXIT -eq 0 ] && echo '✓' || echo "✗ exit $EXIT")"
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Full swarm complete (Day $DAY_NUM)               ║"
echo "║  Build: $([ $BUILD_EXIT -eq 0 ] && echo 'OK' || echo "FAIL")  Support: $((4 - SUPPORT_FAILURES))/4 OK       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Results: git log --oneline --since='midnight'"
exit $BUILD_EXIT
