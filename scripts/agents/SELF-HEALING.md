# SELF-HEALING PROTOCOL — All Agents

This protocol applies to EVERY agent in the swarm. If you discover a fix for a recurring problem, you MUST encode it at the source — not just in build-log notes.

## The Rule

Fixes that only go into build-log.json or blackboard.json notes are fixes that will be rediscovered next session. That's wasted compute. Every fix must be persisted at the level where it prevents recurrence:

### Fix Hierarchy (apply at the HIGHEST applicable level):

1. **Code fix** → Commit it to the repo (build agent only)
2. **Config fix** → Update the config file (vitest.config.ts, tsconfig.json, package.json, etc.) and commit
3. **Agent prompt fix** → Update the relevant agent .md file in scripts/agents/
4. **Swarm config fix** → Update swarm.sh
5. **Blackboard fix** → Update blackboard.json known_constraints or known_fixes
6. **Build-log fix** → LAST RESORT. Only for transient issues that won't recur

### Examples:

| Problem | Wrong fix | Right fix |
|---------|-----------|-----------|
| `workspace:*` fails with npm | Note in build-log | Change package.json to `file:../sdk` and COMMIT |
| vitest process.chdir fails | Note "use forks pool" | Update vitest.config.ts to `pool: 'forks'` and COMMIT |
| HEAD.lock on bindfs mount | Note "clone to /tmp" | Add clone-first instruction to build-agent.md |
| Support agent times out reading context | Note "skip context" | Add FAST_MODE to agent prompt header |
| New Zod pattern discovered | Note in build-log | Add to CRITICAL FIXES section of build-agent.md |

### For Support Agents (reviewer, architect, research, profile):

You cannot commit code, but you CAN:
- Write fix recommendations to `blackboard.json → upcoming_improvements.queue` with `type: "fix"` and `priority: "critical"`
- Flag recurring issues in your agent_runs entry with `"self_healing_needed": true`
- The build agent reads these and applies them in its next run

### For Build Agent:

You CAN and MUST commit fixes directly:
- If you discover a workaround, check if the underlying file should be fixed
- If you fix a config issue, commit the fix — don't just work around it in /tmp
- If you update your own prompt (scripts/agents/build-agent.md), commit that too
- Add the fix to build-log.json `known_fixes` AND to the source file
