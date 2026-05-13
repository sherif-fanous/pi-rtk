## Context

The current `user_bash` handler is shaped around an early decision
("should I claim this event?") that requires knowing whether `rtk
rewrite` produces output for the command. The natural way to answer
that question is to call `rtk rewrite` and check its result — which
is exactly what the handler does. But then the handler returns a
`operations.exec` closure that Pi calls later, and that closure
re-calls `rtk rewrite` to obtain the rewritten command. The first
call's result was never stored, so it cannot be reused.

The fix is mechanical: store the probe-time rewrite in a local
`const` and let the closure capture it. Pi's user_bash dispatch
(verified in `pi-coding-agent`
`modes/interactive/interactive-mode.js::handleBashCommand`) passes
the original event command unchanged to `operations.exec`, so the
captured rewrite is the correct command to run.

## Goals / Non-Goals

**Goals:**

- Halve the number of `rtk rewrite` subprocess spawns per intercepted
  `!<cmd>`.
- Express the new constraint in the `shell-optimization` spec so the
  reduction is part of the contract rather than an accident of the
  current code shape.
- Keep the `user_bash` handler shape recognisable: same early-return
  for `excludeFromContext`, same fall-through when rtk has no
  rewrite, same `operations` shape returned to Pi.

**Non-Goals:**

- Introducing a generalised rewrite cache (LRU, TTL, etc.).
- Touching the agent `bash` tool path. That path already calls
  `rtkRewriteCommand` exactly once per command via `spawnHook`.
- Hardening against a hypothetical future Pi where
  `operations.exec`'s `command` argument differs from
  `event.command`. If Pi changes that contract, this extension MUST
  fail loudly via an explicit update — silent degradation would hide
  a behavior change.

## Decisions

### Decision: trust Pi's documented contract, no equality guard

The closure uses the captured `rewritten` directly. It does not
check `command === event.command` before reusing the cached rewrite.

Rationale: Pi documents and implements the pass-through contract.
Defending against a hypothetical contract break would (a) be
anti-information for future readers ("why is this guard here?"),
(b) hide a real Pi regression behind a silent fallback, and (c) cost
a per-call equality check for zero useful benefit today. If Pi ever
changes the contract, `pi-rtk` should be updated explicitly with a
clear commit and changelog entry.

Alternative considered: defensive equality check with
fall-back-to-original-command-on-mismatch. Rejected for the reasons
above.

### Decision: spec the call-count constraint, not the implementation

The new requirement says "at most one rtk rewrite call per
intercepted user_bash event." It does NOT say "use a closure" or
"store the result in a `const`." Implementation freedom is preserved
for future refactors (e.g., switching to a `Map` if pi-rtk ever
wants to deduplicate across events).

### Decision: limit the change to the `user_bash` path

The agent `bash` path already invokes `rtkRewriteCommand` exactly
once per command via `createBashTool({ spawnHook })`. Touching that
path here would be scope creep and would risk regressing the
existing well-tested behavior.

## Risks / Trade-offs

- **Risk**: Pi changes the `user_bash` dispatch in a future release
  so that the `command` argument to `operations.exec` differs from
  `event.command`. → **Mitigation**: this is documented as a
  contract dependency in AGENTS.md. A regression would surface as
  rtk being called on the rewritten command (idempotent) or, in a
  pathological case, on a different command entirely; either way the
  outcome is a clear bug rather than a silent quiet degradation,
  which is easier to diagnose. The current Pi version (0.74.0) is
  pinned via `package.json` `peerDependencies` once we choose to add
  a guard there; until then, a sentence in AGENTS.md is the
  source-of-truth for this expectation.

- **Trade-off**: the spec now constrains call count, which is a
  performance dimension rather than a behavioral one. Accepted
  because the call count delta is the entire point of this change.
  Without the requirement, a future contributor could revert the
  refactor "for clarity" without realising the cost.
