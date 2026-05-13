## 1. Module state

- [x] 1.1 Add a module-level mutable boolean `sessionEnabled` in
      `index.ts`, defaulting to `true`. Add a typed getter and a
      setter that the slash command handlers can call. Document
      that this state is intentionally in-memory only.

## 2. Slash command

- [x] 2.1 Register `/rtk` via `pi.registerCommand` inside the
      default export. Provide a short description and
      `getArgumentCompletions` returning `enable`, `disable`, and
      `status`.
- [x] 2.2 Implement the handler dispatch: route `enable`,
      `disable`, and `status` to dedicated functions; route the
      bare invocation (no args) to a `ctx.ui.select` overlay
      listing the three actions.
- [x] 2.3 Reject unknown subcommands with a `ctx.ui.notify` error
      message listing the valid forms. Do not change toggle state
      on rejection.

## 3. Footer indicator

- [x] 3.1 On extension load, call `ctx.ui.setStatus("pi-rtk", ...)`
      with the enabled-state text. Re-render the indicator whenever
      the toggle changes. Use `theme.fg("success", "rtk ✓")` for
      enabled and `theme.fg("error", "rtk ✗")` for disabled. The Pi
      `setStatus` API is fire-and-forget; no explicit teardown
      required.
      NOTE: `setStatus` is exposed on `ctx.ui` inside command
      handlers; if extension-load has no `ctx`, set the initial
      status on the first handler invocation or via the relevant
      lifecycle hook in `ExtensionAPI`.

## 4. Rewrite gating

- [x] 4.1 In the `createBashTool` `spawnHook`, short-circuit when
      `sessionEnabled === false`: return `{ command, cwd, env }`
      unchanged without calling `rtkRewriteCommand`.
- [x] 4.2 In the `user_bash` handler, short-circuit when
      `sessionEnabled === false`: return without claiming the
      event so Pi's normal user-bash path runs the command
      unchanged.
- [x] 4.3 Verify both call sites still respect the existing
      `excludeFromContext` guard in `user_bash` (i.e., the
      `excludeFromContext` early-return MUST come before the
      toggle check).

## 5. /rtk status output

- [x] 5.1 Implement `statusReport()` that returns a structured
      report containing: (a) current session state with the
      enabled/disabled style indicator, (b) `rtk` binary version
      and path obtained via a bounded `rtk --version` subprocess
      call, gracefully degrading to a clear "rtk not detected"
      message on spawn failure, (c) a static one-line tip about
      the per-command `!RTK_DISABLED=1 <cmd>` bypass.
- [x] 5.2 When the `rtk --version` spawn fails inside
      `statusReport()`, classify the error via the existing
      `classifySpawnError` helper from
      `notify-when-rtk-unavailable` and call
      `alertRtkUnavailable(reason)` for `"missing"` or
      `"unexecutable"` so the standard warning-once-per-outage
      gate also covers the slash command surface. The
      `alertRtkUnavailable` gate already prevents duplicate
      toasts within the same outage.
- [x] 5.3 Render via `ctx.ui.notify` as a multi-line info-level
      message. The handler MUST NOT read any environment variable
      to produce the tip line.
- [x] 5.4 Do NOT add a `cacheNotify` call inside any `/rtk`
      handler. Pi's lifecycle guarantees `session_start` fires
      before any slash command, and `session_start` already
      captures `cachedNotify`. Slash command handlers use
      `ctx.ui.notify` directly for their own UI output.

## 6. README

- [x] 6.1 Add a new section documenting the `/rtk` slash command,
      its subcommands, the bare-form overlay, and the footer
      indicator. Place it after the existing `User !!<cmd>`
      section and before the `What pi-rtk Does Not Do` section
      from the `document-rtk-deny-passthrough` change.
- [x] 6.2 In the same section, explicitly call out that the
      toggle is session-scoped and resets on Pi restart, and link
      to rtk's per-command `RTK_DISABLED=` form as the
      complementary single-command bypass.

## 7. Specification sync

- [x] 7.1 Sync the four spec deltas to the main specs (these are
      additive; copy each requirement block from the change's
      delta into the corresponding main spec): - `openspec/changes/add-rtk-slash-command/specs/infrastructure/spec.md`
      → `openspec/specs/infrastructure/spec.md` - `openspec/changes/add-rtk-slash-command/specs/shell-optimization/spec.md`
      → `openspec/specs/shell-optimization/spec.md` - `openspec/changes/add-rtk-slash-command/specs/user-interaction/spec.md`
      → `openspec/specs/user-interaction/spec.md`

## 8. Verification

- [x] 8.1 `mise run check` passes (format-check, type-check, lint).
- [x] 8.2 `openspec validate add-rtk-slash-command --strict`
      passes.
- [x] 8.3 Diff the change's spec deltas against the corresponding
      main spec sections after sync; confirm scenarios are
      identical (same titles, same order, same wording).
- [ ] 8.4 Manual smoke: load extension, observe footer indicator;
      run `/rtk` (overlay), `/rtk status`, `/rtk disable`,
      `/rtk enable`, `/rtk garbage` (error path); confirm an agent
      bash call after `/rtk disable` does NOT spawn `rtk` (e.g.
      via `RTK_LOG`-style instrumentation or `dtruss`/`strace`).
- [ ] 8.5 Manual orthogonality smoke: with toggle enabled, run
      `!RTK_DISABLED=1 git status` via Pi — rtk should be called,
      see its prefix, and bail.
- [ ] 8.6 Manual smoke (unavailability integration): with toggle
      enabled and rtk missing, run `/rtk status` and confirm both
      (a) the status output reports "rtk not detected" and (b)
      the standard ENOENT warning toast fires (unless the gate
      already closed earlier in the session).
