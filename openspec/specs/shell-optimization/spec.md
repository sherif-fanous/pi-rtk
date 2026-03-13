# Shell Optimization Specification

## Purpose

Define how `pi-rtk` optimizes shell command execution to reduce LLM token consumption while preserving normal shell behavior when optimization cannot be applied.

## Requirements

### Requirement: Pre-Execution Optimization Attempt

The system MUST attempt to optimize shell commands before execution.

#### Scenario: Optimization succeeds

- GIVEN a command submitted to the `bash` tool
- WHEN the optimization layer successfully produces an optimized command
- THEN the `bash` tool MUST execute the optimized command
- AND the original execution context, including working directory and environment, MUST be preserved

#### Scenario: Optimization cannot be applied

- GIVEN a command submitted to the `bash` tool
- WHEN the optimization layer cannot produce an optimized command
- THEN the `bash` tool MUST execute the original command unchanged
- AND command execution MUST continue without requiring agent intervention

### Requirement: `rtk`-Based Optimization

The system MUST perform shell optimization using the `rtk` rewrite mechanism.

#### Scenario: Rewrite delegation

- GIVEN a command submitted to the `bash` tool
- WHEN the system attempts shell optimization
- THEN the system MUST delegate rewrite generation to `rtk`
- AND the command executed by the `bash` tool MUST be the rewrite output when that rewrite succeeds

### Requirement: Bounded Optimization Latency

The optimization step MUST NOT materially degrade shell tool responsiveness.

#### Scenario: Optimization exceeds time budget

- GIVEN a command submitted for optimization
- WHEN the optimization attempt exceeds its allowed time budget
- THEN the optimization attempt MUST be abandoned
- AND the original command MUST be executed unchanged
