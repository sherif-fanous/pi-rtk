## MODIFIED Requirements

### Requirement: Context-Visible User Bash Optimization

The system MUST attempt shell optimization for user-issued shell commands whose
output is intended to be included in LLM context, using Pi's exported local bash
operations helper.

#### Scenario: Supported context-visible user bash command

- **WHEN** a user executes a supported shell command using Pi's `!<cmd>` syntax
  while `pi-rtk` is loaded on Pi v0.60.0 or later
- **THEN** the system MUST attempt to optimize the command before execution
- **AND** the command MUST execute through the optimized path when optimization
  succeeds
- **AND** the optimized execution MUST delegate local bash operations to Pi's
  exported `createLocalBashOperations()` helper
