# Shell Optimization Specification

## Purpose

Define how `pi-rtk` optimizes shell command execution to reduce LLM token consumption while preserving normal shell behavior when optimization cannot be applied.

## Requirements

### Requirement: Pre-Execution Optimization Attempt

The system MUST attempt to optimize shell commands before execution.

#### Scenario: Optimization succeeds

- GIVEN a command submitted to the `bash` tool
- WHEN the optimization layer successfully produces an optimized command
- THEN the `bash` tool MUST execute the optimized command
- AND the original execution context, including working directory and environment, MUST be preserved

#### Scenario: Optimization cannot be applied

- GIVEN a command submitted to the `bash` tool
- WHEN the optimization layer cannot produce an optimized command
- THEN the `bash` tool MUST execute the original command unchanged
- AND command execution MUST continue without requiring agent intervention

### Requirement: `rtk`-Based Optimization

The system MUST perform shell optimization using the `rtk` rewrite mechanism.

#### Scenario: Rewrite delegation

- GIVEN a command submitted to the `bash` tool
- WHEN the system attempts shell optimization
- THEN the system MUST delegate rewrite generation to `rtk`
- AND the command executed by the `bash` tool MUST be the rewrite output when that rewrite succeeds

### Requirement: Bounded Optimization Latency

The optimization step MUST NOT materially degrade shell tool responsiveness.

#### Scenario: Optimization exceeds time budget

- GIVEN a command submitted for optimization
- WHEN the optimization attempt exceeds its allowed time budget
- THEN the optimization attempt MUST be abandoned
- AND the original command MUST be executed unchanged

### Requirement: Context-Visible User Bash Optimization

The system MUST attempt shell optimization for user-issued shell commands whose output is intended to be included in LLM context, using Pi's exported local bash operations helper.

#### Scenario: Supported context-visible user bash command

- **WHEN** a user executes a supported shell command using Pi's `!<cmd>` syntax while `pi-rtk` is loaded on Pi v0.60.0 or later
- **THEN** the system MUST attempt to optimize the command before execution
- **AND** the command MUST execute through the optimized path when optimization succeeds
- **AND** the optimized execution MUST delegate local bash operations to Pi's exported `createLocalBashOperations()` helper

### Requirement: Non-Disruptive Fallback For User Bash Optimization

The system MUST preserve normal Pi shell behavior when optimization cannot be applied to a context-visible user shell command.

#### Scenario: Unsupported context-visible user bash command

- **WHEN** a user executes an unsupported shell command using Pi's `!<cmd>` syntax while `pi-rtk` is loaded
- **THEN** the command MUST still execute using normal Pi shell behavior
- **AND** execution MUST continue without requiring user intervention

#### Scenario: Optimization infrastructure unavailable for context-visible user bash command

- **WHEN** a user executes a shell command using Pi's `!<cmd>` syntax and the optimization layer cannot be used because `rtk` is unavailable, errors, or exceeds its time budget
- **THEN** the command MUST still execute using normal Pi shell behavior
- **AND** the optimization failure MUST NOT block, crash, or disable user shell execution

### Requirement: Context-Excluded User Bash Bypass

The system MUST NOT apply `pi-rtk` optimization to user shell commands whose output is explicitly excluded from LLM context.

#### Scenario: Context-excluded user bash command

- **WHEN** a user executes a shell command using Pi's `!!<cmd>` syntax while `pi-rtk` is loaded
- **THEN** `pi-rtk` MUST NOT intercept the command for optimization
- **AND** Pi MUST handle execution using its normal context-excluded shell behavior

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
