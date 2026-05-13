## Why

`rtk rewrite` returns more than a rewrite — it also surfaces a permission
verdict (allow, no equivalent, deny, ask). `pi-rtk` currently inspects
only stdout and so, by default, lets denied commands fall through to
Pi's normal execution path. That behavior is correct for `pi-rtk`'s
scope as a rewrite shim, but it is implicit: nothing in the specs or
public docs commits to it, so a future contributor could plausibly
"fix" `pi-rtk` into a permission gate that silently couples Pi
behavior to a Claude Code config file. This change locks the current
behavior into the spec and documents the rationale where users and
contributors will see it.

## What Changes

- Add a new requirement to the `user-interaction` capability stating
  that `pi-rtk` MUST NOT refuse execution based on `rtk rewrite`'s
  permission verdict, MUST allow Pi's normal shell execution path to
  proceed, and MUST NOT emit a refusal message of its own.
- Add a README section (`What pi-rtk Does Not Do`) at the end of the
  README that explains the scope decision in user-facing terms and
  directs users to the Pi package catalog at
  [pi.dev/packages](https://pi.dev/packages) for permission /
  guardrail / shield extensions.
- Extend the existing source-level rationale comment on
  `rtkRewriteCommand` in `index.ts` with a paragraph explaining why
  the deny verdict is not enforced, and correct the inline
  `// empty stdout = exit 1` comment to reflect that empty stdout
  also covers the deny case (exit 2).

No behavior change. Documentation- and contract-only.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `user-interaction`: adds a new requirement codifying that `pi-rtk`
  does not refuse execution based on `rtk`'s permission verdict.

## Impact

- `openspec/specs/user-interaction/spec.md`: new requirement appended.
- `README.md`: new end-of-file section.
- `index.ts`: comment-only edits on `rtkRewriteCommand` (rationale
  paragraph plus one inline-comment fix).
- No runtime behavior change. No API change. No dependency change.
