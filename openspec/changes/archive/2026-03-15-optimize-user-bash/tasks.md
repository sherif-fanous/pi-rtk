## 1. Rewrite policy refactor

- [x] 1.1 Extract the existing `rtk rewrite` attempt logic into a shared helper
- [x] 1.2 Preserve the current timeout and graceful fallback behavior for
      agent-initiated `bash` tool calls

## 2. User bash optimization support

- [x] 2.1 Add a `user_bash` event handler to the extension
- [x] 2.2 Skip interception when `event.excludeFromContext` is true
- [x] 2.3 Probe rewrite eligibility for context-visible user shell commands
      before claiming the `user_bash` event
- [x] 2.4 Return custom bash operations only when rewrite succeeds
- [x] 2.5 Allow unsupported or unrewritable `!<cmd>` commands to fall through to
      Pi's normal `user_bash` handling

## 3. Behavior preservation

- [x] 3.1 Ensure agent-initiated `bash` tool optimization behavior remains
      unchanged
- [x] 3.2 Ensure user `!!<cmd>` behavior remains unchanged
- [x] 3.3 Ensure optimization failure never blocks, crashes, or disables user
      shell execution
- [x] 3.4 Ensure successful user `!<cmd>` optimization remains silent during
      normal operation

## 4. Validation and documentation

- [x] 4.1 Validate behavior for supported user `!<cmd>` commands
- [x] 4.2 Validate fallback behavior for unsupported or unrewritable user
      `!<cmd>` commands
- [x] 4.3 Validate bypass behavior for user `!!<cmd>` commands
- [x] 4.4 Update README to describe support for user `!<cmd>` optimization and
      the explicit non-interception of `!!<cmd>`
