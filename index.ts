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

import { rtkify } from "@arthur-fontaine/rtkify";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  createBashTool,
  createLocalBashOperations,
} from "@mariozechner/pi-coding-agent";

function rtkRewriteCommand(command: string): string | undefined {
  try {
    return rtkify(command);
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
