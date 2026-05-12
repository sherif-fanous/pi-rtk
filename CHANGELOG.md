# Changelog

This changelog follows [Common Changelog](https://common-changelog.org/).

## [0.5.0] - 2026-05-12

### Changed

- **Breaking:** The extension now targets Pi published under the `@earendil-works` npm scope (Pi `0.74.0` and later). Pi has moved away from its old `@mariozechner` scope, and `pi-rtk` v0.5.0 will not load on Pi versions prior to `0.74.0`. Upgrade Pi to `0.74.0` or newer before upgrading this extension.

## [0.4.0] - 2026-05-12

### Fixed

- The extension now applies rtk rewrites for the vast majority of shell commands. Previously, rewrites were silently dropped for every command outside a narrow read-only allow-list (`ls`, `grep`, `find`, `wc`, `cat`) — meaning `head`, `tail`, every pipe ending in head/tail, and every destructive command ran in their original un-rewritten form and produced no token savings. The extension now applies rtk's rewrite whenever one is produced, with Pi's existing per-command approval continuing to gate execution. ([#2](https://github.com/sherif-fanous/pi-rtk/issues/2))

## [0.3.0] - 2026-03-18

### Changed

- **Breaking:** Require Pi v0.60.0 or later and use Pi's exported `createLocalBashOperations()` helper for optimized `user_bash` handling

## [0.2.0] - 2026-03-15

### Added

- Support for optimizing context-visible user shell commands entered with Pi's `!<cmd>` syntax

## [0.1.0] - 2026-03-09

_Initial release._

[0.5.0]: https://github.com/sherif-fanous/pi-rtk/releases/tag/v0.5.0
[0.4.0]: https://github.com/sherif-fanous/pi-rtk/releases/tag/v0.4.0
[0.3.0]: https://github.com/sherif-fanous/pi-rtk/releases/tag/v0.3.0
[0.2.0]: https://github.com/sherif-fanous/pi-rtk/releases/tag/v0.2.0
[0.1.0]: https://github.com/sherif-fanous/pi-rtk/releases/tag/v0.1.0
