## Context

`pi-rtk` currently optimizes agent-initiated `bash` tool calls and
context-visible user `!<cmd>` shell commands. When user bash optimization was
added, Pi did not yet expose a reusable local bash operations helper, so the
extension copied both `createLocalBashOperations()` and `killProcessTree()` into
`index.ts` to preserve Pi-like shell execution semantics.

Pi v0.60.0 now documents and exports `createLocalBashOperations()` for
`user_bash` handling. That makes the local compatibility copy unnecessary and
changes the trade-off: keeping the duplicate code would preserve support for
older Pi versions, but would continue to carry process-management logic that
properly belongs to Pi itself.

This change is intentionally a breaking compatibility update. The package will
simplify around the documented Pi API and explicitly require Pi v0.60.0 or
later.

## Goals / Non-Goals

**Goals:**

- Remove duplicated local bash execution helpers from the extension
- Use Pi's exported `createLocalBashOperations()` for optimized `user_bash`
  execution
- Preserve current best-effort rewrite behavior for both agent `bash` calls and
  user `!<cmd>` commands
- Make the minimum supported Pi version explicit in package documentation and
  changelog
- Communicate the compatibility break clearly as part of the release notes

**Non-Goals:**

- Preserve runtime compatibility with Pi versions earlier than v0.60.0
- Change rewrite policy, timeout behavior, or the `!!<cmd>` bypass semantics
- Add a runtime version check or dual-path compatibility shim for older Pi
  releases
- Introduce new user-facing configuration or feature flags

## Decisions

### Decision: Require Pi v0.60.0+

The package will declare Pi v0.60.0 or later as the minimum supported runtime
version.

Rationale:

- v0.60.0 is the release that exposes the documented
  `createLocalBashOperations()` helper needed by the extension
- A hard minimum version keeps the implementation simple and aligned with Pi's
  public API
- Users who need older Pi compatibility can remain on an earlier `pi-rtk`
  release instead of forcing the current codebase to carry a legacy fallback
  path

Alternatives considered:

- Keep supporting older Pi versions through a local compatibility copy. Rejected
  because it preserves drift-prone duplicated code for limited value.
- Detect helper availability dynamically and branch at runtime. Rejected because
  it complicates imports, testing, and release behavior while still retaining
  legacy code.

### Decision: Treat local bash execution as Pi-owned infrastructure

The extension will import Pi's `createLocalBashOperations()` and use it as the
backend for optimized `user_bash` execution instead of maintaining its own copy.

Rationale:

- Pi should own shell spawning, signal handling, timeout handling, and
  process-tree termination semantics for its extension runtime
- Removing the local copy reduces maintenance burden and eliminates divergence
  risk from future Pi fixes
- The extension becomes easier to reason about because it owns only rewrite
  policy, not local shell execution internals

Alternatives considered:

- Keep a lightly wrapped local implementation for tighter control. Rejected
  because the extension does not gain meaningful product value from owning that
  code.

### Decision: Communicate the break in both README and changelog

The minimum supported Pi version will be stated in `README.md` and recorded in
`CHANGELOG.md` as a breaking change using Common Changelog conventions.

Rationale:

- The compatibility break affects installation and upgrade expectations, not
  just internal implementation
- README is the primary source for prospective users, while the changelog is the
  source of truth for release consumers
- Documenting both the requirement and the reason reduces surprise during
  upgrades

Alternatives considered:

- Mention the requirement only in README. Rejected because version-floor changes
  are release-significant and should be tracked historically.
- Mention the break only in changelog. Rejected because install-time
  requirements should also be visible in the main package documentation.

## Risks / Trade-offs

- **[Older Pi users cannot upgrade to this release]** → Mitigation: document the
  minimum version clearly and rely on previous `pi-rtk` releases as the
  compatibility path for older Pi installations.
- **[Upstream API assumptions could change again]** → Mitigation: depend only on
  Pi's documented helper and keep the integration minimal.
- **[Breaking change could be overlooked by users]** → Mitigation: record it
  prominently in `CHANGELOG.md` and state the version floor near installation
  instructions in `README.md`.
- **[Behavior drift during refactor]** → Mitigation: preserve rewrite logic
  as-is and limit the code change to swapping the local operations backend for
  Pi's exported helper.

## Migration Plan

1. Update the extension implementation to import Pi's
   `createLocalBashOperations()` and remove the local compatibility helpers.
2. Update `README.md` to state that `pi-rtk` requires Pi v0.60.0+ and explain
   why.
3. Add a changelog entry for the next release that marks the new minimum Pi
   version as a breaking change following Common Changelog guidance.
4. Release the new version. Users on Pi versions earlier than v0.60.0 must
   remain on the previous `pi-rtk` release until they upgrade Pi.

## Open Questions

- None. The compatibility direction is intentionally decided: current releases
  will target Pi v0.60.0+ only.
