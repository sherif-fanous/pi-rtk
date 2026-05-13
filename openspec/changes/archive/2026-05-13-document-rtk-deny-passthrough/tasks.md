## 1. Spec

- [x] 1.1 Append the `No Refusal On rtk Permission Verdict` requirement
      (both scenarios) to `openspec/specs/user-interaction/spec.md`,
      copied verbatim from
      `openspec/changes/document-rtk-deny-passthrough/specs/user-interaction/spec.md`.

## 2. README

- [x] 2.1 Add a new section titled `What pi-rtk Does Not Do` at the end
      of `README.md` (after the existing `User !!<cmd> shell commands`
      block).
- [x] 2.2 In that section, explain in user-facing terms that `pi-rtk`
      is a rewrite shim and does not gate, prompt, sandbox, or deny
      commands based on content — including `rtk`'s deny verdict.
- [x] 2.3 Give two short rationales: (1) rtk's deny verdict comes from
      a permission source that does not match Pi's permission model;
      (2) Pi's built-in approval flow plus the Pi extension ecosystem
      cover gating better as composable layers.
- [x] 2.4 Point users to [pi.dev/packages](https://pi.dev/packages),
      filtered by extension, with suggested search terms like
      `permission`, `guardrail`, or `shield`. Do not name specific
      packages.
- [x] 2.5 State the composition order explicitly: when a permission
      extension is installed alongside `pi-rtk`, the permission
      extension runs first on the original command.

## 3. Source comment

- [x] 3.1 In `index.ts`, append a deny-verdict rationale paragraph to
      the existing exit-code-trust comment block above
      `rtkRewriteCommand`. The paragraph must (a) name exit 2 as the
      deny verdict, (b) cite rtk's
      `src/hooks/permissions.rs::load_permission_rules` as the source
      of the deny rules, (c) state that command-level gating in Pi is
      the responsibility of Pi's approval flow or a Pi permission
      extension, and (d) cross-reference the new README section.
- [x] 3.2 Update the inline `// empty stdout = exit 1 "no rtk
equivalent"` comment to reflect that empty stdout also covers
      exit 2 (e.g. `// empty stdout = exit 1 OR exit 2`).

## 4. Verification

- [x] 4.1 `mise run check` passes (format-check, type-check, lint).
- [x] 4.2 `openspec validate document-rtk-deny-passthrough --strict`
      passes.
- [x] 4.3 Manual: read README end-to-end and confirm the new section
      reads cleanly in isolation (no missing context from removed
      cross-links).
- [x] 4.4 Manual: grep `index.ts` for `excludeFromContext`,
      `REWRITE_TIMEOUT_MS`, and the existing exit-code-trust block to
      confirm none of the existing rationale was perturbed.
