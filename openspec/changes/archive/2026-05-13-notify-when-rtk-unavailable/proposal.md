## Why

`pi-rtk` today fails silently when `rtk` is not on PATH or is present
but not executable. The bash spawnHook and the `user_bash` handler
both fall through to running the original command unchanged, which
is the right default for resilience — but it means a user who
installed `pi-rtk` and forgot to install `rtk` (or whose `rtk` binary
lost its executable bit) sees no rewrites happen and has no signal
explaining why.

This change adds a single, actionable, in-band notification using
Pi's TUI surface: when `pi-rtk` detects that `rtk` is unavailable
(ENOENT or EACCES on spawn), the user gets a warn-level toast with
a diagnosis and a remedy. The notification is throttled so it
appears at most once per transition from "rtk works" to "rtk does
not work" — a user who installs `rtk` mid-session, then uninstalls
it again later, gets a fresh notification rather than silence.

## What Changes

- Add an eager probe inside a `pi.on("session_start", ...)`
  handler. `session_start` fires once per session (startup,
  reload, new, resume, fork) with `ctx` available. The probe
  spawns `rtk --version`. On `ENOENT` or `EACCES`, emit a
  warning-level notification via `ctx.ui.notify` with
  diagnosis-specific wording.
- Cache Pi's `ctx.ui.notify` callable at module scope from the same
  lifecycle handler so that `rtkRewriteCommand` (which has no
  direct `ctx` access) can emit notifications via the cached
  callback.
- Add lazy detection inside `rtkRewriteCommand`: when `spawnSync`
  fails with `ENOENT` or `EACCES`, route through the same shared
  notification gate.
- Reset the notification gate whenever a `rtkRewriteCommand`
  `spawnSync` call succeeds. This implements the "warn-once per
  transition from working to broken" UX: a user who installs and
  uninstalls `rtk` repeatedly during one Pi session receives a
  fresh notification each time `rtk` becomes unavailable, but at
  most one notification per such transition.
- Use one shared flag for ENOENT and EACCES (no per-error
  flag set). Whichever condition fires first owns the current
  transition's notification.
- Silence all other spawn failure modes (timeout, EPIPE, signal
  interrupts, generic errors). They remain caller-invisible per the
  existing fallback contract.

No code behavior change beyond the notification: when `rtk` is
available, nothing in this change has any effect; when `rtk` is
unavailable, the existing silent fall-through continues exactly as
before — the only addition is the at-most-one warn toast per
transition.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `user-interaction`: adds a new requirement codifying the
  warn-once-per-transition notification semantics for ENOENT and
  EACCES on `rtk` spawn.

## Impact

- `index.ts`: introduces two module-scope pieces of state
  (`rtkUnavailableNotified`, `cachedNotify`) and a notify helper;
  adds a `session_start` handler with an eager probe; captures
  `cachedNotify` in the `user_bash` handler as defense in depth;
  routes spawn failures inside `rtkRewriteCommand` through the
  shared notification gate; resets the gate on every successful
  rewrite spawn.
- `openspec/specs/user-interaction/spec.md`: new requirement
  ("User Notification When rtk Is Unavailable").
- No new dependencies. No public API change. No behavior change
  when `rtk` is on PATH and executable.
