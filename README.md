# pi-rtk

[Pi](https://github.com/badlogic/pi-mono) coding agent extension that registers a replacement `bash` tool and uses [rtk](https://github.com/rtk-ai/rtk) to reduce LLM token usage during shell command execution.

## How it works

When `pi-rtk` is loaded, it provides its own `bash` tool implementation for Pi.

Before a shell command executes, the tool attempts to rewrite the command by invoking:

```shell
rtk rewrite "<original command>"
```

If rewrite succeeds, Pi executes the rewritten command. This typically routes supported commands through `rtk`, which filters and compresses command output before it reaches the model, reducing token consumption.

If `rtk` is not installed, is not available on `PATH`, times out, or the rewrite attempt fails for any reason, `pi-rtk` falls back to the original command and executes it unchanged.

Unsupported commands therefore continue to behave like normal shell commands.

## Behavior summary

```text
Pi bash tool call
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

## Prerequisites

[rtk](https://github.com/rtk-ai/rtk) is required to get the token-saving optimization behavior and should be [installed](https://github.com/rtk-ai/rtk#installation) and available on your `PATH`.

If `rtk` is unavailable, `pi-rtk` still preserves normal `bash` tool behavior by falling back to the original command.

## Install

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
