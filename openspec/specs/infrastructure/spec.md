# Infrastructure Specification

## Purpose

Define how `pi-rtk` integrates with Pi as an installable package that provides a replacement shell tool.

## Requirements

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

The package MUST remain compatible with the Pi extension runtime.

#### Scenario: Runtime loading

- GIVEN the package is installed in a Pi environment
- WHEN Pi loads the package
- THEN the extension MUST load without requiring a bundled duplicate of the Pi SDK
