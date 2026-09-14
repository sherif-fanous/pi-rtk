## MODIFIED Requirements

### Requirement: Pi SDK Compatibility

The package MUST remain compatible with the supported Pi extension runtime and
MUST require the documented Pi API surface needed for shell optimization.

#### Scenario: Runtime loading on supported Pi version

- **GIVEN** the package is installed in a Pi v0.60.0 or later environment
- **WHEN** Pi loads the package
- **THEN** the extension MUST load using Pi's exported
  `createLocalBashOperations()` helper
- **AND** the package MUST NOT require a bundled duplicate of Pi's local bash
  operations implementation

#### Scenario: Unsupported Pi version

- **GIVEN** a Pi environment earlier than v0.60.0
- **WHEN** a user attempts to use a release of `pi-rtk` that depends on Pi's
  exported `createLocalBashOperations()` helper
- **THEN** that Pi version MUST be considered unsupported by the package
- **AND** the package documentation and changelog MUST communicate the minimum
  supported Pi version as a breaking compatibility requirement
