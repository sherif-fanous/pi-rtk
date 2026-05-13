## ADDED Requirements

### Requirement: User Notification When rtk Is Unavailable

The system MUST emit at most one user-visible warning-level
notification per transition from "rtk works" to "rtk does not work"
within a single Pi process. The notification MUST originate from
Pi's TUI notification surface (e.g., `ctx.ui.notify`). The
unavailability conditions that trigger the notification MUST be
strictly `ENOENT` (binary not on PATH) and `EACCES` (binary present
but not executable). All other spawn-failure conditions, including
timeout and signal interruption, MUST remain silent.

#### Scenario: rtk missing at session start

- **GIVEN** `rtk` is not on PATH when Pi starts
- **WHEN** the extension receives Pi's `session_start` event
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary was not found on PATH
- **AND** the notification MUST include an actionable install
  pointer

#### Scenario: rtk missing at first user bash activity

- **GIVEN** `rtk` is not on PATH when Pi starts
- **WHEN** the user's first relevant interaction is a context-visible
  `!<cmd>` user shell command
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary was not found on PATH
- **AND** the notification MUST include an actionable install
  pointer

#### Scenario: rtk present but not executable at session start

- **GIVEN** `rtk` is on PATH but the file is not executable when
  Pi starts
- **WHEN** the extension receives Pi's `session_start` event
- **THEN** the extension MUST emit one warning-level notification
  identifying that the `rtk` binary is not executable
- **AND** the notification MUST include an actionable remedy hint
  (for example, a `chmod` suggestion)

#### Scenario: rtk removed mid-session

- **GIVEN** `rtk` was available earlier in the session and the
  extension is in the "rtk works" state with no pending
  notification
- **WHEN** `rtk` becomes unavailable (uninstalled or chmod -x'd)
  and the user invokes a shell command that triggers
  `rtkRewriteCommand`
- **THEN** the extension MUST emit one warning-level notification
  describing the current unavailability condition (ENOENT or
  EACCES) at the time of detection

#### Scenario: rtk restored mid-session after a notification

- **GIVEN** a notification has already fired during the current
  unavailability transition
- **WHEN** `rtk` becomes available again and a subsequent
  `rtkRewriteCommand` `spawnSync` call returns without an error
- **THEN** the extension MUST reset its notification gate so that a
  later unavailability transition can emit a fresh notification

#### Scenario: rtk uninstalled twice in one session

- **GIVEN** a notification fired for an earlier unavailability
  transition and the extension's notification gate has been reset
  by a successful spawn in between
- **WHEN** `rtk` becomes unavailable again
- **THEN** the extension MUST emit one fresh warning-level
  notification for the new unavailability transition

#### Scenario: repeated unavailable spawns within one transition

- **GIVEN** a notification has already fired for the current
  unavailability transition and no successful spawn has occurred
  since
- **WHEN** additional `rtkRewriteCommand` invocations occur and
  also fail with `ENOENT` or `EACCES`
- **THEN** the extension MUST NOT emit additional notifications for
  those repeated failures

#### Scenario: non-availability spawn failures remain silent

- **WHEN** a `rtkRewriteCommand` `spawnSync` call fails with a
  reason other than `ENOENT` or `EACCES` (such as timeout, EPIPE,
  signal interrupt, or any unknown error code)
- **THEN** the extension MUST NOT emit a user-facing notification
- **AND** the extension MUST continue to fall through to Pi's
  normal shell behavior unchanged
