## ADDED Requirements

### Requirement: Single Rewrite Per Intercepted User Bash Event

The system MUST issue at most one `rtk rewrite` subprocess
invocation per intercepted `user_bash` event. When the `user_bash`
handler claims a context-visible shell command for optimization,
the rewrite result computed at probe time MUST be reused when the
optimized command is ultimately executed.

#### Scenario: handler intercepts a supported command

- **GIVEN** a user shell command submitted via Pi's `!<cmd>` syntax
- **WHEN** the `user_bash` handler determines that `rtk rewrite`
  produces a non-empty rewrite for the command
- **THEN** the system MUST spawn `rtk rewrite` exactly once for
  that user shell command
- **AND** the executed command MUST be the rewrite produced by that
  single spawn

#### Scenario: handler does not intercept

- **GIVEN** a user shell command submitted via Pi's `!<cmd>` syntax
- **WHEN** the `user_bash` handler determines that `rtk rewrite`
  produces no rewrite (or fails to run)
- **THEN** the system MUST NOT cause additional `rtk rewrite`
  subprocess spawns for that event beyond the single probe
- **AND** Pi MUST handle execution using its normal shell behavior
