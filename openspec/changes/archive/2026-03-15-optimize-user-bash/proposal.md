# Proposal: Optimize User Bash Commands

## Why

`pi-rtk` previously optimized only agent-initiated `bash` tool calls.
User-issued shell commands entered through Pi's `!<cmd>` syntax could still send
unoptimized shell output into model context, even though they represent the same
kind of context-visible shell interaction.

This change extends optimization to that user-visible path so `pi-rtk` can
reduce token usage for shell output intentionally included in LLM context, while
preserving the meaning of `!!<cmd>` commands whose output is explicitly excluded
from model context.

## What Changes

- Apply `rtk`-based optimization to user `!<cmd>` commands
- Preserve the current rewrite-then-fallback behavior used by the replacement
  `bash` tool
- Leave `!!<cmd>` behavior unmodified
- Preserve normal shell execution when optimization cannot be applied
- Keep successful optimization silent during normal operation

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `shell-optimization`: extend shell optimization requirements to cover
  context-visible user `!<cmd>` execution, non-disruptive fallback, and explicit
  bypass for `!!<cmd>`
- `user-interaction`: preserve the semantic distinction between `!<cmd>` and
  `!!<cmd>` and keep successful user bash optimization silent during normal
  operation

## Impact

- Affected code: `index.ts`, `README.md`
- Affected behavior: Pi replacement `bash` tool behavior remains best-effort;
  user `!<cmd>` execution becomes eligible for optimization; user `!!<cmd>`
  remains unmodified
- Dependencies / systems: relies on Pi's `user_bash` extension event and
  `rtk rewrite`; no new user-facing configuration introduced
