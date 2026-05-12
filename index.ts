/**
 * pi-rtk — Pi extension that uses `rtk rewrite` to optimize shell commands.
 *
 * The extension participates in two Pi execution paths:
 * - agent-initiated `bash` tool calls via a replacement bash tool
 * - user-issued `!<cmd>` shell commands via the `user_bash` event
 *
 * In both paths, optimization is best-effort: when `rtk rewrite` succeeds,
 * Pi executes the rewritten command; when rewrite fails, times out, or `rtk`
 * is unavailable, execution falls back to Pi's normal shell behavior.
 *
 * Commands entered with `!!<cmd>` are intentionally not intercepted so the
 * user's choice to exclude shell output from model context is preserved.
 */

import { spawnSync } from "node:child_process";

import {
  createBashTool,
  createLocalBashOperations,
  type ExtensionAPI,
} from "@mariozechner/pi-coding-agent";

const REWRITE_TIMEOUT_MS = 5000;

function rtkRewriteCommand(command: string): string | undefined {
  // rtk's exit codes encode permission verdicts (0 = allow, 1 = no equivalent,
  // 2 = deny, 3 = ask). Pi has its own approval flow for bash tool calls, so we
  // trust stdout as the rewrite and let Pi gate execution. We only skip the
  // rewrite when rtk explicitly produced no replacement (exit 1, empty stdout)
  // or when rtk itself failed to run.
  try {
    const result = spawnSync("rtk", ["rewrite", command], {
      encoding: "utf-8",
      timeout: REWRITE_TIMEOUT_MS,
    });

    if (result.error) return undefined; // spawn failed (rtk not on PATH, timeout, etc.)

    const out = (result.stdout ?? "").trimEnd();

    return out.length > 0 ? out : undefined; // empty stdout = exit 1 "no rtk equivalent"
  } catch {
    return undefined;
  }
}

export default function (pi: ExtensionAPI) {
  const cwd = process.cwd();
  const localBashOperations = createLocalBashOperations();

  const bashTool = createBashTool(cwd, {
    spawnHook: ({ command, cwd, env }) => {
      return { command: rtkRewriteCommand(command) ?? command, cwd, env };
    },
  });

  pi.registerTool(bashTool);

  pi.on("user_bash", (event) => {
    if (event.excludeFromContext) {
      return;
    }

    if (!rtkRewriteCommand(event.command)) {
      return;
    }

    return {
      operations: {
        exec: (command, cwd, options) => {
          return localBashOperations.exec(
            rtkRewriteCommand(command) ?? command,
            cwd,
            options,
          );
        },
      },
    };
  });
}
