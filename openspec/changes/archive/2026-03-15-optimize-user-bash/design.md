## Context

`pi-rtk` currently optimizes agent-initiated `bash` tool calls by overriding
Pi's built-in `bash` tool and attempting `rtk rewrite` before execution. This
keeps optimization best-effort: when rewrite succeeds, Pi executes the rewritten
command; when rewrite fails, Pi executes the original command unchanged.

Pi also supports user-issued shell commands through the `user_bash` extension
event. These commands have two distinct modes:

- `!<cmd>`: command output is included in model context
- `!!<cmd>`: command output is excluded from model context

This change extends `pi-rtk` to optimize only the context-visible `!<cmd>` path
while preserving the semantic boundary of `!!<cmd>`. The design must also
account for Pi's extension composition model, where `user_bash` interception is
effectively first-handler-wins.

## Goals / Non-Goals

**Goals:**

- Optimize eligible user `!<cmd>` executions through `rtk`
- Preserve the current rewrite-then-fallback behavior used for agent `bash` tool
  calls
- Leave `!!<cmd>` behavior unchanged
- Reuse Pi's native user bash execution flow for UI rendering, truncation, and
  session recording
- Minimize interference with other extensions that may also intercept
  `user_bash`
- Keep optimization silent during normal operation

**Non-Goals:**

- Replacing Pi's user bash execution end-to-end
- Changing Pi's `user_bash` event contract or session semantics
- Adding new user-facing configuration or debug UI in the initial implementation
- Changing how agent-initiated `bash` tool calls are optimized
- Optimizing commands whose output is explicitly excluded from model context

## Decisions

### Decision: Use `user_bash` interception for user-issued shell commands

`pi-rtk` will add a `user_bash` handler rather than attempting to infer user
shell execution from other events.

Rationale:

- Pi already exposes `user_bash` specifically for `!` and `!!` commands
- The event provides `excludeFromContext`, which directly captures the semantic
  distinction `pi-rtk` needs
- This keeps the feature aligned with Pi's extension architecture instead of
  layering separate input parsing logic

Alternative considered:

- Intercept raw user input and parse `!`/`!!` syntax manually. Rejected because
  it duplicates Pi behavior, is more fragile, and loses the direct
  `excludeFromContext` signal.

### Decision: Do not intercept `!!<cmd>` commands

The handler will immediately fall through when `event.excludeFromContext` is
true.

Rationale:

- `!!<cmd>` explicitly communicates that command output is not meant for LLM
  context
- Applying `pi-rtk` in that path provides little value and risks surprising
  users
- Respecting Pi's built-in distinction keeps the package behavior easy to
  explain

Alternative considered:

- Apply optimization to both `!` and `!!`. Rejected because it weakens the
  user-intent boundary and optimizes a path whose output is intentionally hidden
  from the model.

### Decision: Use custom `BashOperations` instead of returning a full user bash result

For supported `!<cmd>` commands, the `user_bash` handler will return custom
operations and let Pi continue owning execution lifecycle concerns.

Rationale:

- Pi will continue handling UI updates, streaming, truncation, full-output file
  paths, and session recording
- This avoids duplicating Pi's bash execution semantics inside `pi-rtk`
- It keeps the user bash path closer to the native Pi experience

Alternative considered:

- Fully handle user bash execution in the extension and return `result`.
  Rejected because it would duplicate execution behavior that Pi already
  implements well and increase drift risk between agent bash and user bash
  paths.

### Decision: Probe rewrite success before claiming the `user_bash` event

The handler will attempt rewrite eligibility up front and only return custom
operations when rewrite succeeds.

Rationale:

- `user_bash` interception is effectively first-handler-wins
- Blanket interception of all `!<cmd>` commands would prevent other extensions
  from handling unsupported commands
- Selective interception preserves extension composability while still
  optimizing supported commands

Alternative considered:

- Return operations for every `!<cmd>` command and decide inside execution
  whether to rewrite or fall back. Rejected because it is too greedy for a
  first-handler-wins API.

### Decision: Share rewrite policy between agent bash and user bash paths

The rewrite attempt logic should be centralized in a helper used by both:

- the existing replacement `bash` tool path
- the new `user_bash` path

Rationale:

- Keeps timeout, fallback, and rewrite behavior consistent across both entry
  points
- Reduces maintenance drift
- Makes it easier to reason about optimization semantics across the package

Alternative considered:

- Keep independent rewrite logic in each path. Rejected because the two code
  paths would diverge over time.

## Risks / Trade-offs

- **[Extension ordering]** Another extension may intercept `user_bash` before
  `pi-rtk` sees the event. → Accept as normal Pi extension composition behavior
  and keep `pi-rtk` selective so it composes well when it does receive the
  event.
- **[Rewrite drift]** Agent bash and user bash behavior could diverge if rewrite
  policy is implemented twice. → Centralize rewrite logic in a shared helper.
- **[Semantic mismatch]** A rewritten command may behave differently than the
  original command. → Preserve the existing trust model already used for agent
  bash execution and fall through to normal execution when rewrite is
  unavailable.
- **[Unsupported command handling]** Overeager interception could block other
  useful `user_bash` extensions. → Only claim `user_bash` when rewrite succeeds.
- **[Documentation gap]** Users may not realize `!` is optimized but `!!` is
  not. → Document the distinction clearly in README without adding noisy runtime
  notifications.
