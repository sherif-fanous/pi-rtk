## 1. Source

- [x] 1.1 In `index.ts`, replace the discarded-result probe pattern
      in the `user_bash` handler. Bind the probe result to a
      `const rewritten = rtkRewriteCommand(event.command)`. Return
      early when `rewritten === undefined`. The returned
      `operations.exec` closure MUST use `rewritten` directly
      (ignoring the `command` parameter Pi passes back) and MUST
      NOT call `rtkRewriteCommand` again.

## 2. Documentation

- [x] 2.1 Append a short paragraph to AGENTS.md "Rewrite contract"
      noting that the `user_bash` handler reuses the rewrite
      computed at probe time, and naming the upstream Pi guarantee
      (`pi-coding-agent`
      `modes/interactive/interactive-mode.js::handleBashCommand`)
      that makes this safe.

## 3. Verification

- [x] 3.1 `mise run check` passes.
- [x] 3.2 `openspec validate cache-user-bash-rewrite --strict`
      passes.
- [ ] 3.3 Manual smoke: run `!ls -al` (or any rtk-supported
      command) through Pi while temporarily instrumenting
      `rtkRewriteCommand` to count invocations. Confirm exactly
      one rtk spawn occurs.
- [ ] 3.4 Manual smoke: run `!RTK_DISABLED=1 ls` through Pi.
      Confirm the user_bash handler probes once, sees no rewrite
      (rtk bails on the env-prefix), and falls through to Pi's
      normal shell — no exec closure is returned, no second rtk
      spawn happens.
