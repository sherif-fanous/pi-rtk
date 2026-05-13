# User Interaction Specification

## Purpose

Define the user-visible behavior of `pi-rtk`, including transparency during normal operation and resilience when shell optimization fails.

## Requirements

### Requirement: Non-Disruptive Fallback

Failures in the shell optimization layer MUST NOT interrupt normal shell tool usage.

#### Scenario: Optimization failure

- GIVEN a command submitted to the `bash` tool
- WHEN shell optimization fails before command execution
- THEN the command MUST still execute using normal shell behavior
- AND the optimization failure MUST NOT crash, block, or disable the host agent

### Requirement: Transparent Operation

The optimization layer MUST remain invisible during normal use.

#### Scenario: Standard command execution

- GIVEN normal shell command execution through the `bash` tool
- THEN the system MUST NOT add user-facing notifications solely to report optimization activity
- AND the user experience MUST remain consistent whether optimization is applied or bypassed

### Requirement: Graceful Operation Without `rtk`

The system MUST continue to provide normal shell execution when `rtk` is unavailable.

#### Scenario: `rtk` is unavailable

- GIVEN `rtk` is not installed, not resolvable on `PATH`, or otherwise unavailable to the optimization layer
- WHEN a command is submitted to the `bash` tool
- THEN the system MUST execute the original command unchanged
- AND the user MUST retain normal shell tool functionality

### Requirement: Respect For User Context Visibility Choice

The system MUST preserve the semantic distinction between Pi's context-visible and context-excluded user shell command modes.

#### Scenario: User selects context-visible shell mode

- **WHEN** a user executes a shell command using Pi's `!<cmd>` syntax while `pi-rtk` is loaded
- **THEN** the command MUST remain eligible for optimization behavior
- **AND** successful optimization MUST preserve the normal experience of running a user shell command in Pi

#### Scenario: User selects context-excluded shell mode

- **WHEN** a user executes a shell command using Pi's `!!<cmd>` syntax while `pi-rtk` is loaded
- **THEN** the command MUST bypass `pi-rtk` optimization behavior
- **AND** the user's choice to exclude output from model context MUST be respected

### Requirement: Transparent User Bash Optimization

The system MUST keep user bash optimization non-disruptive during normal operation.

#### Scenario: Optimization succeeds for a user shell command

- **WHEN** a supported shell command executed through Pi's `!<cmd>` syntax is optimized successfully
- **THEN** the command MUST complete without requiring additional user interaction solely for optimization reporting
- **AND** the user experience MUST remain consistent with normal shell execution

### Requirement: Session-Scoped Rewrite Toggle

The extension MUST expose an in-memory, session-scoped toggle that
controls whether `pi-rtk` performs rewrites. The toggle's default
state MUST be `enabled`. The toggle MUST reset to `enabled` on every
Pi process start. The toggle MUST NOT be persisted to disk.

#### Scenario: /rtk disable turns the toggle off

- **GIVEN** the session toggle is in any state
- **WHEN** the user invokes `/rtk disable`
- **THEN** the toggle MUST transition to `disabled`
- **AND** the extension MUST surface a user-facing confirmation
- **AND** the footer indicator MUST update to reflect the disabled
  state

#### Scenario: /rtk enable turns the toggle on

- **GIVEN** the session toggle is in any state
- **WHEN** the user invokes `/rtk enable`
- **THEN** the toggle MUST transition to `enabled`
- **AND** the extension MUST surface a user-facing confirmation
- **AND** the footer indicator MUST update to reflect the enabled
  state

#### Scenario: toggle resets on new Pi process

- **WHEN** Pi exits and is launched again
- **THEN** the session toggle MUST start in the `enabled` state
- **AND** no toggle state MUST be read from disk

### Requirement: Persistent Footer State Indicator

The extension MUST register a single footer status entry via
`ctx.ui.setStatus("pi-rtk", ...)` and MUST keep that entry present
for the lifetime of the extension. The entry MUST visually
differentiate the `enabled` and `disabled` states. The entry MUST
update immediately when the session toggle changes.

#### Scenario: indicator present on load

- **WHEN** the `pi-rtk` extension is loaded by Pi
- **THEN** the footer MUST display a `pi-rtk` status entry
- **AND** the entry MUST reflect the `enabled` default state

#### Scenario: indicator updates on toggle

- **GIVEN** the footer is displaying the `pi-rtk` status entry in
  the `enabled` style
- **WHEN** the user invokes `/rtk disable`
- **THEN** the footer entry MUST transition to a visually distinct
  `disabled` style

### Requirement: /rtk Bare Invocation Opens Settings Overlay

The extension MUST treat the bare `/rtk` invocation (no arguments)
as a request for a settings overlay. The overlay MUST allow the user
to select among the same actions exposed by the subcommands.

#### Scenario: bare /rtk opens overlay

- **WHEN** the user invokes `/rtk` with no arguments
- **THEN** the extension MUST display an interactive selection
  overlay listing at least `enable`, `disable`, and `status`
- **AND** selecting an item MUST execute the corresponding action
- **AND** dismissing the overlay MUST NOT change any state

### Requirement: /rtk Status Report

`/rtk status` MUST report the current session toggle state and the
detected `rtk` binary identity, and MUST include a static
educational tip about rtk's per-command `!RTK_DISABLED=1 <cmd>`
bypass. The tip MUST be plain documentation text — the extension
MUST NOT read environment variables when producing the status
report.

#### Scenario: status reports current state

- **WHEN** the user invokes `/rtk status`
- **THEN** the output MUST identify the current session toggle
  state (`enabled` or `disabled`)
- **AND** the output MUST identify the detected `rtk` binary
  version and path, or MUST clearly indicate when `rtk` is not on
  PATH
- **AND** the output MUST include a one-line tip mentioning the
  per-command `!RTK_DISABLED=1 <cmd>` bypass

#### Scenario: status does not inspect process environment

- **WHEN** the user invokes `/rtk status`
- **THEN** the extension MUST NOT read `process.env.RTK_DISABLED`
  or any other process environment variable as part of building
  the status output
- **AND** the per-command tip MUST appear regardless of the host
  environment

### Requirement: No Refusal On rtk Permission Verdict

The system MUST NOT refuse to execute a shell command based on a
permission verdict surfaced by `rtk rewrite`. Command-level refusal is
the responsibility of Pi's built-in approval flow or of a dedicated Pi
permission extension installed by the user.

#### Scenario: rtk surfaces a deny verdict

- **WHEN** `rtk rewrite` indicates that a shell command submitted to
  `pi-rtk` matches a deny rule
- **THEN** `pi-rtk` MUST NOT block command execution
- **AND** the command MUST continue through Pi's normal shell
  execution path
- **AND** `pi-rtk` MUST NOT emit a refusal message of its own

#### Scenario: rtk surfaces a non-deny verdict

- **WHEN** `rtk rewrite` returns an allow, no-equivalent, or ask
  verdict for a shell command submitted to `pi-rtk`
- **THEN** existing rewrite and fall-through behavior MUST apply
  unchanged
- **AND** the new requirement MUST NOT alter handling of those
  verdicts

### Requirement: User Notification When rtk Is Unavailable

The system MUST emit at most one user-visible warning-level
notification per transition from "rtk works" to "rtk does not work"
within a single Pi process. The notification MUST originate from Pi's
TUI notification surface (e.g., `ctx.ui.notify`). The unavailability
conditions that trigger the notification MUST be strictly `ENOENT`
(binary not on PATH) and `EACCES` (binary present but not executable).
All other spawn-failure conditions, including timeout and signal
interruption, MUST remain silent.

#### Scenario: rtk missing at session start

- **GIVEN** `rtk` is not on PATH when Pi starts
- **WHEN** the extension receives Pi's `session_start` event
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary was not found on PATH
- **AND** the notification MUST include an actionable install pointer

#### Scenario: rtk missing at first user bash activity

- **GIVEN** `rtk` is not on PATH when Pi starts
- **WHEN** the user's first relevant interaction is a context-visible
  `!<cmd>` user shell command
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary was not found on PATH
- **AND** the notification MUST include an actionable install pointer

#### Scenario: rtk present but not executable at session start

- **GIVEN** `rtk` is on PATH but the file is not executable when Pi
  starts
- **WHEN** the extension receives Pi's `session_start` event
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary is not executable
- **AND** the notification MUST include an actionable remedy hint (for
  example, a `chmod` suggestion)

#### Scenario: rtk removed mid-session

- **GIVEN** `rtk` was available earlier in the session and the
  extension is in the "rtk works" state with no pending notification
- **WHEN** `rtk` becomes unavailable (uninstalled or chmod -x'd) and
  the user invokes a shell command that triggers `rtkRewriteCommand`
- **THEN** the extension MUST emit one warning-level notification
  describing the current unavailability condition (ENOENT or EACCES)
  at the time of detection

#### Scenario: rtk restored mid-session after a notification

- **GIVEN** a notification has already fired during the current
  unavailability transition
- **WHEN** `rtk` becomes available again and a subsequent
  `rtkRewriteCommand` `spawnSync` call returns without an error
- **THEN** the extension MUST reset its notification gate so that a
  later unavailability transition can emit a fresh notification

#### Scenario: rtk uninstalled twice in one session

- **GIVEN** a notification fired for an earlier unavailability
  transition and the extension's notification gate has been reset by a
  successful spawn in between
- **WHEN** `rtk` becomes unavailable again
- **THEN** the extension MUST emit one fresh warning-level notification
  for the new unavailability transition

#### Scenario: repeated unavailable spawns within one transition

- **GIVEN** a notification has already fired for the current
  unavailability transition and no successful spawn has occurred since
- **WHEN** additional `rtkRewriteCommand` invocations occur and also
  fail with `ENOENT` or `EACCES`
- **THEN** the extension MUST NOT emit additional notifications for
  those repeated failures

#### Scenario: non-availability spawn failures remain silent

- **WHEN** a `rtkRewriteCommand` `spawnSync` call fails with a reason
  other than `ENOENT` or `EACCES` (such as timeout, EPIPE, signal
  interrupt, or any unknown error code)
- **THEN** the extension MUST NOT emit a user-facing notification
- **AND** the extension MUST continue to fall through to Pi's normal
  shell behavior unchanged
