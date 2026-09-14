## Why

Pi now exposes a documented `createLocalBashOperations()` helper for `user_bash`
handling in v0.60.0, which makes `pi-rtk`'s duplicated local implementation
unnecessary. Requiring the documented API lets the extension remove
process-management copy/paste code, reduce drift risk against Pi, and make its
platform requirements explicit.

## What Changes

- Simplify the extension to import and use Pi's exported
  `createLocalBashOperations()` for optimized `user_bash` handling
- Remove the duplicated local `createLocalBashOperations()` and
  `killProcessTree()` implementation from `index.ts`
- Update package documentation to state that `pi-rtk` requires Pi v0.60.0 or
  later
- Update `CHANGELOG.md` to document the new minimum supported Pi version as a
  **BREAKING** change following Common Changelog guidance

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `shell-optimization`: require Pi v0.60.0+ for user bash optimization and align
  `user_bash` execution with Pi's exported local bash operations helper
- `infrastructure`: document and communicate the minimum supported Pi version as
  part of the package's supported runtime contract

## Impact

- Affected code: `index.ts`, `README.md`, `CHANGELOG.md`
- Affected behavior: user `!<cmd>` optimization continues to work, but the
  extension now depends on Pi's exported `createLocalBashOperations()` instead
  of bundled compatibility code
- Compatibility: this release becomes incompatible with Pi versions earlier than
  v0.60.0
- Dependencies / systems: relies on the `@mariozechner/pi-coding-agent` API
  surface provided by Pi v0.60.0+
