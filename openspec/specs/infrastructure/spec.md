# Infrastructure Specification

## Purpose

Define how `pi-rtk` integrates with Pi as an installable package that provides a replacement shell tool.

## Requirements

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

### Requirement: Bash Tool Integration

The system MUST provide a `bash` tool implementation that Pi uses when the `pi-rtk` package is loaded.

#### Scenario: Extension activation

- GIVEN the `pi-rtk` extension is loaded by Pi
- WHEN the agent invokes the `bash` tool
- THEN Pi MUST use the `pi-rtk` `bash` tool implementation
- AND shell command execution MUST pass through that implementation

### Requirement: Pi Package Installability

The system MUST be installable and discoverable as a standard Pi package.

#### Scenario: Package metadata

- GIVEN a Pi package installation flow
- THEN the package metadata MUST identify the package as a Pi package
- AND the package metadata MUST declare the extension entry point required to load the package

### Requirement: Pi SDK Compatibility

The package MUST remain compatible with the supported Pi extension runtime and MUST require the documented Pi API surface needed for shell optimization.

#### Scenario: Runtime loading on supported Pi version

- **GIVEN** the package is installed in a Pi v0.60.0 or later environment
- **WHEN** Pi loads the package
- **THEN** the extension MUST load using Pi's exported `createLocalBashOperations()` helper
- **AND** the package MUST NOT require a bundled duplicate of Pi's local bash operations implementation

#### Scenario: Unsupported Pi version

- **GIVEN** a Pi environment earlier than v0.60.0
- **WHEN** a user attempts to use a release of `pi-rtk` that depends on Pi's exported `createLocalBashOperations()` helper
- **THEN** that Pi version MUST be considered unsupported by the package
- **AND** the package documentation and changelog MUST communicate the minimum supported Pi version as a breaking compatibility requirement
