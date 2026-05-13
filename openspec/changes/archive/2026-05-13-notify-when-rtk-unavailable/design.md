## Context

`pi-rtk` is designed to fail open: if `rtk` is unavailable for any
reason, the extension falls through and Pi runs commands unchanged.
This is correct for resilience but it has a UX cost — a user who has
just installed `pi-rtk` and forgotten to install `rtk` sees zero
optimization happening and zero feedback explaining why.

The fix is one targeted warn-level toast under specific, recoverable
conditions. The design needs to thread three constraints:

1. `rtkRewriteCommand` does not own a `ctx` and cannot directly
   call `ctx.ui.notify`. A cached callable is required to bridge
   the gap.
2. Pi's extension lifecycle exposes `session_start`, which fires
   once per session (startup, reload, new, resume, fork) with a
   `ctx` parameter that includes `ctx.ui.notify`. This is the
   documented hook for "set up initial state."
3. The "show once" semantic the user wanted is best implemented as
   "once per transition from working to broken," not "once
   per Pi process," because the latter would silently swallow the
   common case of install-then-uninstall during a long session.

## Goals / Non-Goals

**Goals:**

- Detect `rtk` unavailability via ENOENT or EACCES on the same
  `spawnSync` call that the rewrite path already uses, so there is
  no separate detection mechanism.
- Emit at most one warn-level notification per transition from
  "rtk works" to "rtk does not work."
- Use Pi's TUI notification surface (`ctx.ui.notify`) at warn
  severity — no `console.warn`, no stderr noise.
- Keep the user-facing message diagnosis-specific: ENOENT and
  EACCES need different remedies.

**Non-Goals:**

- Differentiating timeout, EPIPE, signal interrupts, or generic
  errors. Those remain silent fall-throughs.
- Implementing a minimum-version probe. The existing extension
  works against any `rtk` that responds to `rtk rewrite`.
- Surfacing the same notification in multiple places (footer,
  status, dialog). One toast per transition, full stop.
- Resetting the gate on Pi restart. Each Pi process starts with a
  fresh gate; that is intrinsic to the in-memory design.

## Decisions

### Decision: detect via shared `spawnSync` error code, not a separate probe

When the eager probe in `session_start` runs `rtk --version`, its
`result.error` carries the same `code` field that
`rtkRewriteCommand`'s `spawnSync` would. We classify both call
sites' errors with one helper and route both through one
notification gate.

Rationale: zero extra infrastructure. Both `spawnSync` errors are
already-existing failure surfaces; this change just inspects the
code field rather than discarding it.

### Decision: re-warn on transition rather than once-per-process

The notification gate (`rtkUnavailableNotified`) is reset to `false`
whenever a `rtkRewriteCommand` `spawnSync` call returns without an
error. The next time the spawn fails with ENOENT or EACCES, a fresh
notification fires.

Rationale: the "I uninstalled rtk and forgot" case is the most
likely cause of a stale-warning scenario, and re-warning on the
transition restores actionability. The state cost is one boolean
toggle. The alternative — once-and-only-once per process — would
silently swallow the second-uninstall case.

Alternative considered: once-per-process. Rejected per above. A
user who finds the repeated warning annoying can simply install
`rtk` and not uninstall it.

### Decision: shared flag for ENOENT and EACCES

A single `rtkUnavailableNotified` boolean governs both error codes.
Whichever condition fires first during a given transition emits its
type-specific message and sets the flag; subsequent errors of either
type during the same transition stay silent until a successful spawn
resets the flag.

Rationale: a user toggling between ENOENT and EACCES in one
transition is a contrived scenario. Sharing the flag simplifies the
state machine without losing any practically useful UX.

### Decision: eager probe inside `session_start`, not `before_agent_start` or module load

The eager probe is wrapped in a `pi.on("session_start", ...)`
handler. `session_start` fires exactly once per session at startup
(and again on reload / new / resume / fork) with `ctx` available,
so the probe and the notify-callback capture both happen at the
earliest opportunity without needing a guard against repeated
invocations.

Rationale: at module load (inside the default export), no `ctx` is
available. Without `ctx`, we cannot call `ctx.ui.notify`, and the
user explicitly does not want `console.warn`. `session_start` is
Pi's documented hook for "session is starting; set up initial
state."

Trade-off: a user who only ever uses Pi without invoking the agent
still receives the notification, because `session_start` fires at
session startup regardless of whether the agent runs. That is the
intended UX: `pi-rtk` is the user's chosen optimization layer, so
the user should learn at session start if it is broken.

Alternative considered: `before_agent_start`. Rejected because it
fires per turn (forcing a separate `rtkEagerProbeDone` flag to
avoid spawning `rtk --version` every turn) AND because it fires
only on agent activity, so a user asking a non-bash question would
get a notification about a feature they were not using at that
moment. `session_start` fires once per session regardless of agent
use, which both eliminates the per-turn cost and ties the
notification to a more meaningful lifecycle moment (the session
beginning).

Alternative considered: module load. Rejected: no `ctx`.

### Decision: keep all other spawn-failure modes silent

Timeouts, EPIPE, signal interrupts, and unknown error codes
continue to produce caller-invisible fall-through, matching the
existing AGENTS.md "Rewrite contract" stance.

Rationale: those failure modes are typically transient (timeout
especially), and a sticky toast for a transient condition would
mislead. The user explicitly scoped "rtk not available" to ENOENT
plus EACCES.

## Risks / Trade-offs

- **Risk**: A user with `rtk` toggling rapidly between installed and
  uninstalled (unusual) sees a notification on every removal. →
  **Mitigation**: this is the desired behavior per the chosen
  transition-based semantic. The toast is dismissible.

- **Risk**: `session_start` does not fire for a Pi mode that does
  not start a session (none currently documented). →
  **Mitigation**: the lazy detection in `rtkRewriteCommand` and
  the `cachedNotify` capture in the `user_bash` handler provide
  defense in depth. Any code path that actually invokes a rewrite
  will detect unavailability and notify.

- **Risk**: `ctx.ui.notify` is unavailable in non-interactive Pi
  modes (e.g., print mode). → **Mitigation**: the cached callable
  is captured from `ctx.ui.notify` directly; if that surface is a
  no-op in non-interactive modes, the notification is silently
  dropped, which is acceptable for print mode.

- **Trade-off**: two new pieces of module-level state in `index.ts`
  (`rtkUnavailableNotified`, `cachedNotify`). Accepted because they
  are tightly scoped, well-named, and documented in the source.

- **Trade-off**: the gate-reset path runs on every successful
  `rtkRewriteCommand` spawn (which is the common case). Cost is
  one boolean assignment. Negligible.
