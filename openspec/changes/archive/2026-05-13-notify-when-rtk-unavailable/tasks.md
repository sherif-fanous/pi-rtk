## 1. Module state

- [x] 1.1 In `index.ts`, introduce module-level state: - `rtkUnavailableNotified: boolean` (default `false`) - `cachedNotify: ((message: string, level: "info" | "warning" | "error") => void) | null` (default `null`) - A `classifySpawnError(err): "missing" | "unexecutable" | "other"` helper that maps `NodeJS.ErrnoException.code` to the three buckets.

## 2. Notification helper

- [x] 2.1 Add an `alertRtkUnavailable(reason: "missing" | "unexecutable")` helper that returns early when either `rtkUnavailableNotified` is true or `cachedNotify` is null. Otherwise it sets the flag to `true` and calls `cachedNotify(message, "warning")`, choosing the diagnosis-specific message from a small mapping: - `"missing"`: `[pi-rtk] rtk binary not found on PATH. Shell command rewrites are disabled. Install rtk: <link>` - `"unexecutable"`: `[pi-rtk] rtk binary found on PATH but is not executable. Shell command rewrites are disabled. Run: chmod +x $(command -v rtk)`

## 3. Eager probe + ctx capture

- [x] 3.1 Register a `pi.on("session_start", (_event, ctx) => { ... })` handler in the default export. Inside, call `cacheNotify` with a wrapper that calls `ctx.ui.notify(message, level)` so the notify callable is captured on the first session start.
- [x] 3.2 In the same handler, run an eager probe by `spawnSync("rtk", ["--version"], { timeout: REWRITE_TIMEOUT_MS })`, and route its `result.error` through `classifySpawnError` → `alertRtkUnavailable(reason)`. Treat the `"other"` bucket as a no-op. `session_start` fires once per session, so no separate guard flag is needed.
- [x] 3.3 Capture `ctx.ui.notify` in the `user_bash` handler before calling `rtkRewriteCommand`, as defense in depth so lazy ENOENT/EACCES detection still notifies if any code path reaches `rtkRewriteCommand` before `session_start` has fired.

## 4. Lazy detection inside rtkRewriteCommand

- [x] 4.1 Inside `rtkRewriteCommand`, when `result.error` is present, classify the error and call `alertRtkUnavailable(reason)` for the `"missing"` or `"unexecutable"` buckets only. Keep the existing `return undefined` fall-through unchanged.
- [x] 4.2 When `result.error` is absent (the spawn succeeded), set `rtkUnavailableNotified = false` so a later transition can re-warn.

## 5. Source comments

- [x] 5.1 Add a short comment block above the new module-level state explaining the warn-once-per-outage semantic and why `cachedNotify` is captured from lifecycle/event context rather than at module load.
- [x] 5.2 Cross-reference the existing exit-code-trust comment on `rtkRewriteCommand` so a reader navigating the file understands both rationales without context-switching.

## 6. Specification sync

- [x] 6.1 Sync the new user-notification requirement into `openspec/specs/user-interaction/spec.md`.

## 7. Verification

- [x] 7.1 `mise run check` passes.
- [x] 7.2 `openspec validate notify-when-rtk-unavailable --strict` passes.
- [x] 7.3 Manual smoke (rtk missing at start): temporarily move `rtk` off PATH, start Pi, and confirm a single warning-level toast appears at session start (no agent prompt or bash invocation required).
- [x] 7.4 Manual smoke (rtk not executable at start): `chmod -x $(command -v rtk)`, start Pi, and confirm the EACCES variant of the toast fires once at session start. Restore with `chmod +x`.
- [x] 7.5 Manual smoke (mid-session removal): start Pi with rtk present, run a rewrite-eligible command to confirm no toast. Then `mv $(command -v rtk) /tmp/rtk-stash`, run another rewrite-eligible command, and confirm one toast appears.
- [x] 7.6 Manual smoke (transition re-warn): from the state in 7.5, restore rtk with `mv /tmp/rtk-stash $(command -v rtk || echo /opt/homebrew/bin/rtk)`, run a rewrite (no toast), remove again, confirm a fresh toast appears.
- [x] 7.7 Manual smoke (other errors stay silent): no automated check practical for timeout or EPIPE. Code review confirms `"other"` bucket from `classifySpawnError` is a no-op in both call sites.
