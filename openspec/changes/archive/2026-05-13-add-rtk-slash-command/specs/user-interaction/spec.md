## ADDED Requirements

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
