## Context

`pi-rtk` today has no in-session controls: the extension is either
loaded (and silently rewriting) or uninstalled (and not loaded). Users
have asked for a session-scoped toggle so they can briefly turn off
rewriting (debugging a command, testing whether rtk is the cause of
unexpected behavior, etc.) without having to uninstall the package.

Pi's `ExtensionAPI` provides three primitives that together support
this cleanly:

- `pi.registerCommand(name, { description, handler, ... })` for slash
  commands with optional argument completions.
- `ctx.ui.setStatus(key, text)` for a passive, single-line indicator
  that joins other extensions' statuses in Pi's default footer.
- `ctx.ui.select(title, items)` / `ctx.ui.notify(msg, level)` for
  interactive and fire-and-forget UI from inside a command handler.

A previous design discussion identified that `process.env.RTK_DISABLED`
is NOT honored by rtk itself (rtk only inspects the env-prefix portion
of the command string, not the process environment). Adopting a
process-env contract inside `pi-rtk` would create divergence with rtk
for zero new functionality, so this change deliberately omits process-
env detection.

A more recent merged change (`notify-when-rtk-unavailable`) introduced
shared availability-detection infrastructure that this change can
reuse: a `cachedNotify` module-level callable captured from
`session_start`, a `classifySpawnError(err)` helper that maps
`NodeJS.ErrnoException.code` to `"missing" | "unexecutable" | "other"`,
and an `alertRtkUnavailable(reason)` gate-respecting warning emitter.
The slash command surface should compose with that infrastructure
rather than reinvent a parallel detection path.

## Goals / Non-Goals

**Goals:**

- Give users a Pi-native, in-session, reversible way to disable
  `pi-rtk`'s rewrite layer without uninstalling.
- Provide an always-on footer indicator so the user can confirm
  `pi-rtk` is loaded and what state it is in.
- Surface a `/rtk status` view that answers "what is `pi-rtk` doing
  right now?" without leaving the Pi session.
- Educate users in-band about rtk's per-command `RTK_DISABLED=` bypass
  via a static tip in `/rtk status`.

**Non-Goals:**

- Persisting the toggle to disk. The toggle is in-memory only and
  resets on every Pi process start. A persistent toggle is a
  separate feature.
- Per-project state. The toggle is per-Pi-process, not per-repo.
- Honoring `process.env.RTK_DISABLED`. See Context for the rationale.
- A general `/rtk` config surface beyond enable/disable/status. The
  bare `/rtk` overlay is a discoverability affordance, not a
  configuration UI.
- Surfacing rtk's deny-verdict in `/rtk status`. That belongs to the
  `document-rtk-deny-passthrough` change; this change must not
  contradict it.

## Decisions

### Decision: subcommands plus bare-form overlay

Command shape: `/rtk enable`, `/rtk disable`, `/rtk status`, plus
`/rtk` (no args) which opens a `ctx.ui.select` overlay listing the
three actions.

Rationale: subcommands are fast and scriptable for users who know
what they want; the bare-form overlay covers discoverability ("I
typed /rtk to see what it does"). Argument completions on the `/rtk`
command should suggest `enable | disable | status` so tab-complete
works.

Alternatives considered:

- Sibling commands (`/rtk-enable`, `/rtk-disable`, `/rtk-status`):
  rejected — pollutes the command namespace with three entries.
- Single toggle on bare `/rtk`: rejected — no way to query state via
  the command, only via the footer.

### Decision: in-memory state only

The toggle is a module-level boolean in `index.ts`. No disk I/O, no
config file, no env var. Reset to `true` (enabled) on every Pi
process start.

Rationale: this is the simplest implementation that satisfies the
user need ("disable for this session"). Persistence is a separate,
larger feature with its own UX questions (per-project? global?
TTL?) and should not be folded in here. AGENTS.md's zero-config
stance is preserved.

### Decision: always-on footer indicator with semantic color

`ctx.ui.setStatus("pi-rtk", ...)` is called on extension load and on
every toggle. The indicator is always present, with `theme.fg("success",
"rtk ✓")` for the enabled state and `theme.fg("error", "rtk ✗")` for the
disabled state.

Rationale: "always show" gives positive confirmation that the
extension is loaded — a user with a long extension list benefits
from seeing pi-rtk's presence in the footer regardless of state.
Dim styling keeps the enabled indicator unobtrusive.

Alternatives considered:

- Show only when disabled ("notable only"): rejected — loses the
  load-time confirmation benefit.
- Full footer takeover via `ctx.ui.setFooter`: rejected — would
  conflict with footer extensions like `pi-powerline-footer`.

### Decision: do not detect process.env.RTK_DISABLED

The extension does not read `process.env.RTK_DISABLED` and does not
adjust behavior based on it.

Rationale: rtk's own contract for `RTK_DISABLED` is strictly
per-command env-prefix (`RTK_DISABLED=1 git status`). The process
env var has no effect inside rtk. Inventing process-env semantics
in `pi-rtk` would create two mechanisms with the same name and
different scopes, surprising users familiar with rtk's contract.
All three disable use cases are already addressed:

- Per command: rtk handles `RTK_DISABLED=<any> <cmd>` natively.
- This session: the new `/rtk disable` slash command.
- Permanent: `pi remove npm:@sherif-fanous/pi-rtk`.

### Decision: include a static educational tip in `/rtk status`

`/rtk status` includes a one-line tip mentioning the per-command form
(`!RTK_DISABLED=1 <cmd>`). The tip is static text — no env inspection,
no state.

Rationale: surfaces a useful but obscure rtk feature where users are
already looking for "how do I disable rtk?". Avoids the failure mode
where users find the README-only documentation, learn about
`/rtk disable`, and never discover the per-command form.

### Decision: toggle short-circuits BEFORE the rtk subprocess

When disabled, the gate skips the `rtkRewriteCommand` call entirely
in both the `bash` `spawnHook` and the `user_bash` handler. No `rtk`
subprocess is spawned.

Rationale: disabling rtk should also remove its observable cost
(spawn latency). The orthogonality scenario between session toggle
and per-command `RTK_DISABLED=` prefix is preserved: when the session
is enabled and a command carries the per-command prefix, the call
proceeds to rtk and rtk itself bails on the prefix detection.

### Decision: slash command handlers do NOT capture `cachedNotify`

The `/rtk` slash command handler will not call `cacheNotify(...)` to
capture `ctx.ui.notify`. Pi's lifecycle guarantees that
`session_start` fires before any user-initiated slash command, and
`session_start` is where `cachedNotify` gets captured. Slash command
handlers therefore can either (a) use `ctx.ui.notify` directly for
their own user-facing output (the normal pattern) or (b) trust that
other code paths that go through `alertRtkUnavailable` will already
find `cachedNotify` populated.

Rationale: avoids a third call site for the same `cacheNotify` pattern
and keeps the "notify-capture lives in `session_start`" mental model
intact. The defense-in-depth capture in the `user_bash` handler exists
specifically because `user_bash` could in principle fire before any
first-class session lifecycle hook in a hypothetical future Pi runtime
mode; the slash command handler has no such concern because slash
commands fundamentally cannot be issued before a session is active.

### Decision: `/rtk status` reuses the existing availability gate

The `statusReport()` function spawns `rtk --version` to render the
binary version and path. When that spawn fails with `ENOENT` or
`EACCES`, the function MUST classify the error via
`classifySpawnError` and call `alertRtkUnavailable(reason)`, then
render an "rtk not detected" (or equivalent) line in the status
output. The output line shown to the user is independent of the
notification: the user sees the diagnosis in the status view AND, if
the outage gate is open, gets the toast.

Rationale: the status command is the most likely surface where a user
will discover that rtk is broken, so triggering the standard
notification path keeps the warning-once-per-outage semantic intact
without the user needing to do anything else. The gate-respecting
check inside `alertRtkUnavailable` ensures no duplicate toast if a
notification already fired during the same outage.

Alternative considered: status-only diagnosis (no notification
side-effect). Rejected because it would split availability awareness
into two parallel mechanisms (toast for spawn-driven detection,
status-line for slash-command detection) and lose the
warning-once-per-outage gate's authority over the slash command
surface.

## Risks / Trade-offs

- **Risk**: User toggles `/rtk disable`, expects it to persist across
  Pi restarts, and is surprised when the next session starts with
  rewrites on. → **Mitigation**: README and `/rtk status` make clear
  that the toggle is session-scoped. If persistence becomes a real
  ask, propose it as a separate change.

- **Risk**: Always-on footer indicator competes for footer space with
  other extensions a user runs. → **Mitigation**: use `setStatus`
  (not `setFooter`) so Pi's default footer aggregator handles
  layout. Keep the text short (`rtk ✓` enabled, `rtk ✗`
  disabled). Color carries the semantic (success / error); the
  symbols provide a colorblind-safe textual cue.

- **Risk**: User mis-types `/rtk disabled` instead of `/rtk disable`.
  → **Mitigation**: `getArgumentCompletions` returns the three valid
  subcommands; unknown args trigger a `ctx.ui.notify` error with
  the list of valid forms. Do NOT silently treat unknown args as
  no-op.

- **Trade-off**: A `/rtk status` that includes the per-command tip
  is one line noisier than a pure state report. Accepted because
  in-band discoverability is genuinely valuable here.

- **Trade-off**: The toggle gate adds a single boolean check per
  bash command. Negligible cost.
