## Why

The current `user_bash` handler calls `rtkRewriteCommand` twice for
every intercepted `!<cmd>` invocation: once at probe time to decide
whether to claim the event, and a second time inside the returned
`operations.exec` closure when Pi actually runs the command. The
second call recomputes the same rewrite the probe already produced
and discards from the first call.

For a typical `!ls -al`, that means two `rtk rewrite "ls -al"`
subprocess spawns per command. Each spawn is on the order of tens of
milliseconds. The first spawn's stdout is computed, evaluated only
for truthiness, and then thrown away. Capturing the probe result in
the handler's closure eliminates the second spawn without changing
end behavior.

Pi documents that the `command` argument to `operations.exec` is the
same string as the `command` field of the `UserBashEvent`. The
upstream call site (`pi-coding-agent`
`modes/interactive/interactive-mode.js::handleBashCommand`) shows the
unmodified pass-through. Closing over the rewrite computed at probe
time is therefore safe.

## What Changes

- Refactor the `user_bash` handler in `index.ts` to compute the
  rewrite once and reuse it inside the `operations.exec` closure.
- Replace the discarded-result probe `if (!rtkRewriteCommand(...))
  return;` pattern with a typed `const rewritten = ...` binding that
  the closure captures.
- Update the AGENTS.md "Rewrite contract" section with a short
  paragraph stating that the `user_bash` handler reuses the rewrite
  computed at probe time, and naming the upstream Pi guarantee that
  makes this safe.
- Add a `shell-optimization` requirement codifying that at most one
  `rtk rewrite` subprocess is spawned per intercepted user shell
  command.

No user-visible behavior change. Same input, same output, fewer
subprocess spawns.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `shell-optimization`: adds a new requirement constraining the
  number of `rtk rewrite` calls per intercepted `user_bash` event,
  and codifies reuse of the probe-time rewrite.

## Impact

- `index.ts`: refactor of the `user_bash` handler. No API surface
  change.
- `AGENTS.md`: one-paragraph addition to the "Rewrite contract"
  section.
- `openspec/specs/shell-optimization/spec.md`: new requirement.
- No new dependencies. No breaking changes. No behavior change
  observable to the user or the model.
