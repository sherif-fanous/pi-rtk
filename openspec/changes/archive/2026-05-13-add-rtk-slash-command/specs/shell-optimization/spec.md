## ADDED Requirements

### Requirement: Session Toggle Gates Rewrite Attempt

When the session toggle is in the `disabled` state, the system MUST
NOT call `rtk rewrite` for any shell command, regardless of execution
path (agent `bash` tool, user `!<cmd>` shell). When the toggle is in
the `enabled` state, existing rewrite behavior MUST continue
unchanged.

#### Scenario: agent bash with toggle disabled

- **WHEN** the session toggle is `disabled`
- **AND** the agent invokes the `bash` tool with a shell command
- **THEN** the extension MUST NOT spawn `rtk rewrite`
- **AND** the original command MUST execute through Pi's normal
  shell behavior

#### Scenario: user !<cmd> with toggle disabled

- **WHEN** the session toggle is `disabled`
- **AND** the user executes a context-visible shell command via
  Pi's `!<cmd>` syntax
- **THEN** the extension MUST NOT spawn `rtk rewrite`
- **AND** the command MUST execute through Pi's normal user shell
  path

#### Scenario: toggle enabled preserves existing rewrite behavior

- **WHEN** the session toggle is `enabled` (the default)
- **AND** a shell command is submitted via the agent `bash` tool or
  user `!<cmd>` syntax
- **THEN** the existing rewrite, fall-through, and timeout behavior
  MUST apply unchanged

### Requirement: Toggle Composes With Per-Command Bypass

The extension MUST treat the session toggle and rtk's per-command
env-prefix bypass (commands beginning with `RTK_DISABLED=`) as
orthogonal concerns. The session toggle controls whether `pi-rtk`
calls `rtk rewrite` at all. The per-command env-prefix controls
whether `rtk rewrite`, once called, produces a rewrite for that
specific command. Neither mechanism MUST short-circuit the other.

#### Scenario: enabled toggle plus per-command prefix

- **WHEN** the session toggle is `enabled`
- **AND** the command is `RTK_DISABLED=1 git status`
- **THEN** `pi-rtk` MUST call `rtk rewrite` as normal
- **AND** `rtk rewrite` is expected to return no rewrite due to the
  env prefix
- **AND** the original command MUST execute through Pi's normal
  shell behavior

#### Scenario: disabled toggle short-circuits regardless of prefix

- **WHEN** the session toggle is `disabled`
- **AND** the command is `RTK_DISABLED=1 git status` or any other
  command
- **THEN** the extension MUST NOT spawn `rtk rewrite`
- **AND** the original command MUST execute through Pi's normal
  shell behavior
