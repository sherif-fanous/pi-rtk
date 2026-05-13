## ADDED Requirements

### Requirement: /rtk Slash Command Registration

The extension MUST register a `/rtk` slash command via Pi's
`registerCommand` API on load. The command MUST accept the
subcommand arguments `enable`, `disable`, and `status`, and MUST
support a bare invocation with no arguments.

#### Scenario: extension registers /rtk at load

- **WHEN** Pi loads the `pi-rtk` extension
- **THEN** `/rtk` MUST appear in Pi's slash command registry with a
  human-readable description
- **AND** invoking `/rtk` MUST route to the extension's handler

#### Scenario: argument completion lists valid subcommands

- **WHEN** the user types `/rtk ` and triggers argument completion
- **THEN** Pi MUST offer `enable`, `disable`, and `status` as the
  available completions

#### Scenario: unknown subcommand is rejected

- **WHEN** the user invokes `/rtk` with an argument that is not
  `enable`, `disable`, or `status`
- **THEN** the extension MUST surface a user-facing error message
  listing the valid subcommands
- **AND** the session toggle state MUST NOT change
