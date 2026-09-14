## ADDED Requirements

### Requirement: Respect For User Context Visibility Choice

The system MUST preserve the semantic distinction between Pi's context-visible
and context-excluded user shell command modes.

#### Scenario: User selects context-visible shell mode

- **WHEN** a user executes a shell command using Pi's `!<cmd>` syntax while
  `pi-rtk` is loaded
- **THEN** the command MUST remain eligible for optimization behavior
- **AND** successful optimization MUST preserve the normal experience of running
  a user shell command in Pi

#### Scenario: User selects context-excluded shell mode

- **WHEN** a user executes a shell command using Pi's `!!<cmd>` syntax while
  `pi-rtk` is loaded
- **THEN** the command MUST bypass `pi-rtk` optimization behavior
- **AND** the user's choice to exclude output from model context MUST be
  respected

### Requirement: Transparent User Bash Optimization

The system MUST keep user bash optimization non-disruptive during normal
operation.

#### Scenario: Optimization succeeds for a user shell command

- **WHEN** a supported shell command executed through Pi's `!<cmd>` syntax is
  optimized successfully
- **THEN** the command MUST complete without requiring additional user
  interaction solely for optimization reporting
- **AND** the user experience MUST remain consistent with normal shell execution
