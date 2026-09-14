## ADDED Requirements

### Requirement: Context-Visible User Bash Optimization

The system MUST attempt shell optimization for user-issued shell commands whose
output is intended to be included in LLM context.

#### Scenario: Supported context-visible user bash command

- **WHEN** a user executes a supported shell command using Pi's `!<cmd>` syntax
  while `pi-rtk` is loaded
- **THEN** the system MUST attempt to optimize the command before execution
- **AND** the command MUST execute through the optimized path when optimization
  succeeds

### Requirement: Non-Disruptive Fallback For User Bash Optimization

The system MUST preserve normal Pi shell behavior when optimization cannot be
applied to a context-visible user shell command.

#### Scenario: Unsupported context-visible user bash command

- **WHEN** a user executes an unsupported shell command using Pi's `!<cmd>`
  syntax while `pi-rtk` is loaded
- **THEN** the command MUST still execute using normal Pi shell behavior
- **AND** execution MUST continue without requiring user intervention

#### Scenario: Optimization infrastructure unavailable for context-visible user bash command

- **WHEN** a user executes a shell command using Pi's `!<cmd>` syntax and the
  optimization layer cannot be used because `rtk` is unavailable, errors, or
  exceeds its time budget
- **THEN** the command MUST still execute using normal Pi shell behavior
- **AND** the optimization failure MUST NOT block, crash, or disable user shell
  execution

### Requirement: Context-Excluded User Bash Bypass

The system MUST NOT apply `pi-rtk` optimization to user shell commands whose
output is explicitly excluded from LLM context.

#### Scenario: Context-excluded user bash command

- **WHEN** a user executes a shell command using Pi's `!!<cmd>` syntax while
  `pi-rtk` is loaded
- **THEN** `pi-rtk` MUST NOT intercept the command for optimization
- **AND** Pi MUST handle execution using its normal context-excluded shell
  behavior
