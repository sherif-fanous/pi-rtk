# Agents

## mise

This project uses [mise](https://mise.jdx.dev/) as the task runner. mise
automatically provisions the correct Node.js version (declared in `mise.toml`
under `[tools]`) before every command, so the runtime is always consistent.

Run any task with:

```shell
mise run <task>
```

### Available tasks

| Task                         | Description                                                                                                                        |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `mise run check`             | Run format-check, type-check, and lint (the full pre-commit gate)                                                                  |
| `mise run fallow`            | Run both `fallow-dead-code` and `fallow-dupes` as an advisory audit                                                                |
| `mise run fallow-dead-code`  | Report unused exports / dead code via `fallow dead-code`                                                                           |
| `mise run fallow-dupes`      | Report duplicated code via `fallow dupes`                                                                                          |
| `mise run format`            | Auto-format source files with Prettier                                                                                             |
| `mise run format-check`      | Check formatting without writing changes                                                                                           |
| `mise run install-deps`      | Install npm dependencies                                                                                                           |
| `mise run install-dev-deps`  | Install npm dev dependencies (`pnpm add --save-dev`)                                                                               |
| `mise run lint`              | Lint source files with Biome and ESLint                                                                                            |
| `mise run lint-fix`          | Auto-fix lint violations with Biome and ESLint                                                                                     |
| `mise run login`             | Log in to npm via `pnpm login` (interactive; only needed if you don't use a token in `.env`)                                       |
| `mise run pack-check`        | Run the full `check` gate, then `pnpm pack --dry-run` to verify the package builds and packs cleanly                               |
| `mise run publish`           | Run `pack-check`, then publish to npm with `pnpm publish --access public` (auth via `NPM_ACCESS_TOKEN` from `.env` and `./.npmrc`) |
| `mise run sort-package-json` | Sort `package.json` keys                                                                                                           |
| `mise run type-check`        | Run TypeScript type checking                                                                                                       |
| `mise run uninstall-deps`    | Uninstall npm dependencies                                                                                                         |
| `mise run update-deps`       | Update npm dependencies                                                                                                            |

## Code conventions

The `fallow-*` tasks (and their `fallow` aggregator) are **advisory
audits, not gates**. Run them periodically — e.g. before a release or
when cleaning up a module — and use human judgement on the output.
They are intentionally excluded from `check` because their reports
routinely contain legitimate false positives (public API exports,
intentionally-parallel code) that would make the pre-commit gate
noisy and encourage reflexive "fix it to shut the tool up" refactors.

Prettier, Biome, ESLint, and `tsc` enforce formatting, import order,
naming, file-section ordering, kebab-case filenames, function-declaration
style, and bans on `any` / `!` / `console.*` / one-letter identifiers.
Run `mise run check` to surface violations across all four tools — most
are auto-fixable via `mise run format` or `mise run lint-fix`.

The conventions below are the ones the linter cannot enforce. They are
project-wide unless noted.

### Documentation

- Every source file opens with a module-level JSDoc block stating:
  (a) the file's role in one line, (b) what it owns vs. what it does
  NOT own. Keep it high-level and change-agnostic — do NOT mention
  OpenSpec change names, future-change extension points, or
  implementation details (those belong on the relevant function/type,
  in the OpenSpec proposal, or in inline comments).
- Comments explain _why_, not _what_. Common patterns: rationale on
  decisions that contradict an obvious "fix" (the exit-code-trust
  block), inline notes naming exit-code-meaning relationships
  (`// empty stdout = exit 1 OR exit 2`), and any
  `try/catch` guard whose existence depends on rtk's contract.
- Lifecycle handlers (`user_bash`, `bashTool.spawnHook`) wrap calls
  in defense-in-depth handling for the rtk-unavailable / rtk-hangs
  case. The fall-through-to-original-command behavior IS the guard;
  do not add `try/catch` on top.
