# pi-rtk

[Pi](https://github.com/badlogic/pi-mono) coding agent extension that routes bash commands through [rtk](https://github.com/rtk-ai/rtk) for LLM token savings.

## How it works

This extension overrides Pi's built-in bash tool. Before a command executes, it is passed to `rtk rewrite` which rewrites it to its rtk equivalent. When the rewritten command runs, rtk filters and compresses the output so fewer tokens are consumed. Unsupported commands run unchanged.

## Prerequisites

[rtk](https://github.com/rtk-ai/rtk) must be [installed](https://github.com/rtk-ai/rtk#installation) and available on your `PATH`.

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
