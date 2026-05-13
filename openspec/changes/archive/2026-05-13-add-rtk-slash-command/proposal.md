## Why

`pi-rtk` today is a load-it-or-uninstall-it extension: there is no
in-session way to turn the rewrite layer off, query what it is doing,
or confirm that it is loaded. The only existing bypass is rtk's own
per-command `RTK_DISABLED=1 <cmd>` env-prefix, which works fine
for one-off bypasses but does not address the common case of "I want
to disable rtk for the rest of this session and re-enable it later."

Adding a `/rtk` slash command and an always-on footer indicator gives
users a Pi-native, reversible, in-session toggle plus a persistent
visual confirmation that `pi-rtk` is loaded. It also creates a
discoverable surface for future state (the spec keeps the surface
minimal for now: enable, disable, status, plus a bare-form overlay
for discoverability).

## What Changes

- Register a `/rtk` slash command via `pi.registerCommand`, with
  subcommands `enable`, `disable`, `status`, and a bare invocation
  (`/rtk` with no args) that opens a settings overlay via
  `ctx.ui.select`.
- Maintain an in-memory session toggle. Default is enabled. The
  toggle is reset to enabled on every Pi process start (no
  persistence to disk).
- When the toggle is `disabled`, both the agent `bash` `spawnHook`
  and the `user_bash` handler MUST bypass `rtk rewrite` entirely
  (no spawn) and fall through to the original command.
- Show a persistent footer indicator via `ctx.ui.setStatus("pi-rtk",
...)`. Always-on: dim styling for the enabled (default) state,
  warn styling for the disabled state. Indicator updates immediately
  on toggle.
- `/rtk status` output includes (a) current session state, (b)
  detected `rtk` binary version and path, and (c) a one-line
  educational tip about rtk's per-command `!RTK_DISABLED=1 <cmd>`
  bypass. The tip is purely static help text — the extension does
  not inspect any environment variable.
- Explicitly do not honor `process.env.RTK_DISABLED`. rtk itself does
  not honor it; adopting a process-env contract here would diverge
  from rtk without adding behavior that is not already covered by
  the session toggle or the per-command prefix.

No removals. No breaking changes to existing behavior — the toggle
defaults to enabled, so users who do not invoke `/rtk` see no
behavioral change.

## Capabilities

### New Capabilities

<!-- None. All requirements attach to existing capabilities. -->

### Modified Capabilities

- `infrastructure`: adds requirement for `/rtk` slash command
  registration as a new extension surface.
- `shell-optimization`: adds requirement that the session toggle
  short-circuits the rewrite path before any `rtk` subprocess is
  spawned, with explicit orthogonality against rtk's per-command
  `RTK_DISABLED=` env prefix.
- `user-interaction`: adds requirements for the session toggle's
  user-facing semantics, the persistent footer indicator, and the
  `/rtk status` output (including the static educational tip about
  rtk's per-command bypass).

## Impact

- `index.ts`: introduces module-level toggle state, registers the
  `/rtk` slash command, installs the footer status, and gates both
  call sites of `rtkRewriteCommand` on the toggle.
- `README.md`: new section documenting `/rtk`, its subcommands, and
  the footer indicator.
- `package.json`: no new dependencies.
- No API breakage. Existing callers see no behavior change while the
  toggle remains in its default enabled state.
