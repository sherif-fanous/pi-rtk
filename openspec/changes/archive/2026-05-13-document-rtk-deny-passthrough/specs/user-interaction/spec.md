## ADDED Requirements

### Requirement: No Refusal On rtk Permission Verdict

The system MUST NOT refuse to execute a shell command based on a
permission verdict surfaced by `rtk rewrite`. Command-level refusal is
the responsibility of Pi's built-in approval flow or of a dedicated Pi
permission extension installed by the user.

#### Scenario: rtk surfaces a deny verdict

- **WHEN** `rtk rewrite` indicates that a shell command submitted to
  `pi-rtk` matches a deny rule
- **THEN** `pi-rtk` MUST NOT block command execution
- **AND** the command MUST continue through Pi's normal shell
  execution path
- **AND** `pi-rtk` MUST NOT emit a refusal message of its own

#### Scenario: rtk surfaces a non-deny verdict

- **WHEN** `rtk rewrite` returns an allow, no-equivalent, or ask
  verdict for a shell command submitted to `pi-rtk`
- **THEN** existing rewrite and fall-through behavior MUST apply
  unchanged
- **AND** the new requirement MUST NOT alter handling of those
  verdicts
