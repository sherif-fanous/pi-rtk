## Context

`pi-rtk` is a thin shim that wires `rtk rewrite` into Pi's bash execution
paths (the agent `bash` tool via `createBashTool({ spawnHook })`, and
context-visible user shell commands via the `user_bash` event). The
existing `AGENTS.md § Rewrite contract` documents the "trust stdout,
ignore exit code" decision behind `rtkRewriteCommand`. That decision was
made for the rewrite verdicts (allow, no equivalent, ask). The deny
verdict was not explicitly addressed because, at the time, the silent
fall-through happened to produce the desired behavior.

This change does not alter behavior. It captures the implicit decision
about the deny verdict as an explicit spec requirement and surfaces the
rationale where users (README) and contributors (source comment) will
find it.

## Goals / Non-Goals

**Goals:**

- Make `pi-rtk`'s non-enforcement of `rtk`'s deny verdict an explicit
  contract in `openspec/specs/user-interaction/spec.md` so a future
  contributor cannot "fix" it into an enforcement gate without
  consciously amending the spec.
- Give users a one-paragraph user-facing explanation of the scope
  decision, with a generic pointer to the Pi package catalog for
  command-level gating.
- Give contributors the rtk-specific reason inline at the only call
  site (`rtkRewriteCommand`) so the code itself answers the question
  "why isn't this handling exit 2?".

**Non-Goals:**

- Implementing deny enforcement, even behind a flag. That is a separate
  conversation and would require a different scope and a different
  extension architecture (Pi `tool_call` listener rather than
  `createBashTool` spawn hook).
- Adding configuration surface to `pi-rtk` (env vars, sidecar config,
  etc.). AGENTS.md takes an explicit zero-config stance; this change
  does not relax it.
- Cross-linking AGENTS.md and README to each other. The two files have
  different release lifecycles and the deliberate separation should be
  preserved.

## Decisions

### Decision: lock the behavior in `user-interaction`, not `shell-optimization`

The deny case is framed as "what `pi-rtk` does not do to the user." The
`user-interaction` capability is the natural home for that framing (it
already owns Transparent Operation, Non-Disruptive Fallback, and
Respect For User Context Visibility Choice). `shell-optimization`
covers the optimization machinery itself and is silent on refusal
semantics by design.

Alternative considered: place the requirement in `shell-optimization`
as a corollary of the rewrite contract. Rejected because the requirement
is about a user-facing absence of behavior, not an optimization pathway.

### Decision: explicitly forbid pi-rtk-originated refusal messages

The new requirement includes "AND `pi-rtk` MUST NOT emit a refusal
message of its own." Without this clause, a contributor could argue
that printing a `[pi-rtk] command denied by rtk: ...` warning is
consistent with passing the command through. That would still violate
Transparent Operation by inference, but only weakly; the explicit
clause makes the contract unambiguous.

### Decision: README section placed at the end of the file

The user requested end-of-file placement. The trade-off was visibility
(between How It Works and Prerequisites) vs. install-flow continuity
(end of file). End-of-file preserves the install/use narrative for new
users and treats the scope explanation as reference material for users
who go looking after a surprise.

### Decision: README points only to the Pi package catalog

The README does not name specific permission, guardrail, or shield
extensions. Reasons: the catalog already has search and type filters;
naming specific packages incurs ongoing maintenance to keep links
fresh; and `pi-rtk` should not appear to endorse one gating extension
over another.

### Decision: source comment references rtk's internal location

The deny-verdict paragraph in `rtkRewriteCommand` mentions
`src/hooks/permissions.rs::load_permission_rules` in the upstream rtk
repo. That string survives most refactors (function-name granularity)
and gives a contributor enough to verify the claim without leaving
their editor. If rtk relocates that function, the comment becomes
mildly stale but remains grep-able. Acceptable trade-off vs. the
maintenance cost of pinned line numbers.

## Risks / Trade-offs

- **Risk**: Users who switch from Claude Code expect Pi to honor the
  same deny rules. → **Mitigation**: README section names the
  divergence explicitly and points to permission extensions in the
  catalog. AGENTS.md continues to document the "trust stdout" stance.

- **Risk**: rtk evolves so that deny verdicts come from a Pi-native or
  rtk-native source (not `.claude/settings.json`), invalidating the
  stated rationale. → **Mitigation**: the spec requirement is framed
  as "based on a permission verdict surfaced by `rtk rewrite`,"
  independent of where that verdict originates, so it remains
  meaningful even if rtk's deny source changes. Only the README
  paragraph and source comment would need a refresh.

- **Trade-off**: contributors who skim the source might still wonder
  why the code does not branch on exit code. → **Accepted**: the
  existing exit-code-trust block plus the new deny paragraph together
  cover the reasoning; tightening further would lose the rationale
  this change is trying to lock in.
