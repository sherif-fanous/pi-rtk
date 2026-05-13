# pi-rtk

[Pi](https://github.com/badlogic/pi-mono) coding agent extension that uses [rtk](https://github.com/rtk-ai/rtk) to reduce LLM token usage for shell command execution.

When `pi-rtk` is loaded, it participates in two Pi shell paths:

- agent-initiated `bash` tool calls
- user-issued `!<cmd>` shell commands whose output is included in model context

In both cases, `pi-rtk` first attempts to rewrite the command with:

```shell
rtk rewrite "<original command>"
```

If rewrite succeeds, Pi executes the rewritten command. If rewrite fails for any reason, `pi-rtk` falls back silently so normal Pi shell behavior continues.

Commands entered with `!!<cmd>` are intentionally not intercepted. They continue through Pi's normal context-excluded shell execution path unchanged.

## Prerequisites

- Pi v0.60.0 or later
- [rtk](https://github.com/rtk-ai/rtk), installed and available on your `PATH`

If `rtk` is unavailable, `pi-rtk` still preserves normal shell behavior by falling back to the original command.

## Install

Make sure your Pi installation is v0.60.0 or later before installing this package.

```shell
pi install npm:@sherif-fanous/pi-rtk
```

Or try without installing:

```shell
pi -e npm:@sherif-fanous/pi-rtk
```

To uninstall:

```shell
pi remove npm:@sherif-fanous/pi-rtk
```

## How It Works

### Agent `bash` tool calls

`pi-rtk` registers a replacement `bash` tool for Pi. Before the tool executes a command, the extension attempts an `rtk rewrite` and uses the rewritten command when available.

This preserves the normal `bash` tool interface while routing supported commands through `rtk`, which can filter and compress output before it reaches the model.

If `rtk` is unavailable, times out, or cannot rewrite the command, the original command runs unchanged.

#### Behavior summary

```text
Agent bash tool call
        │
        ▼
pi-rtk replacement bash tool
        │
        ├─ try: rtk rewrite "<command>"
        │      │
        │      ├─ success -> execute rewritten command
        │      └─ failure -> execute original command unchanged
        │
        ▼
    same bash tool interface to Pi
```

### User `!<cmd>` shell commands

`pi-rtk` also hooks Pi's `user_bash` event for context-visible user shell commands entered with `!<cmd>`.

For these commands, the extension probes rewrite eligibility before claiming the event. If rewrite succeeds, it returns custom bash operations so Pi can keep owning the normal execution lifecycle and UI behavior. If rewrite does not succeed, the extension falls through and Pi handles the command normally.

This keeps optimization best-effort, silent, and non-disruptive during normal operation.

#### Behavior summary

```text
User !<cmd>
        │
        ├─ try: rtk rewrite "<command>"
        │      │
        │      ├─ success -> return custom bash operations
        │      └─ failure -> fall through to normal Pi user_bash handling
        │
        ▼
    same user shell experience in Pi
```

### User `!!<cmd>` shell commands

Commands entered with `!!<cmd>` are excluded from model context by design, so `pi-rtk` does not intercept them.

They bypass `pi-rtk` completely and continue through Pi's normal context-excluded shell handling.

#### Behavior summary

```text
User !!<cmd>
        │
        ▼
    bypass pi-rtk and use normal Pi context-excluded shell handling
```

## `/rtk` Slash Command

`pi-rtk` registers a `/rtk` slash command for session-scoped control:

- `/rtk enable` turns command rewriting on for the current Pi session.
- `/rtk disable` turns command rewriting off for the current Pi session.
- `/rtk status` shows the current toggle state, detected `rtk` binary details, and a bypass tip.
- `/rtk` opens an overlay where you can choose the same actions interactively.

The footer includes a persistent `pi-rtk` status indicator: `rtk ✓` in green when rewriting is enabled, `rtk ✗` in red when disabled.

The toggle is in-memory only. It resets to enabled every time Pi restarts and is not written to disk. For a single-command bypass while leaving the session toggle enabled, use rtk's per-command form:

```shell
!RTK_DISABLED=1 <cmd>
```

## What pi-rtk Does Not Do

`pi-rtk` is a rewrite shim. It does not gate, prompt for, sandbox, or deny commands based on their content, including when `rtk rewrite` surfaces a deny verdict.

That scope is intentional. `rtk`'s deny verdict comes from a permission source that does not match Pi's permission model, and Pi's built-in approval flow plus Pi's extension ecosystem cover command gating better as composable layers.

If you want command-level permissions, guardrails, or shields, install a dedicated Pi extension for that. Browse [pi.dev/packages](https://pi.dev/packages) filtered by extension and search for terms like `permission`, `guardrail`, or `shield`.

Those extensions compose with `pi-rtk`: they block disallowed commands at execution time, whether or not `pi-rtk` has rewritten the command.
