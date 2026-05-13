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
} from "@earendil-works/pi-coding-agent";

const REWRITE_TIMEOUT_MS = 5000;

function rtkRewriteCommand(command: string): string | undefined {
  // rtk's exit codes are permission verdicts (0/1/2/3 = allow/no-equiv/deny/
  // ask). We trust stdout and ignore the exit code. The deny verdict is
  // intentionally not enforced — this shim rewrites, it does not gate.
  try {
    const result = spawnSync("rtk", ["rewrite", command], {
      encoding: "utf-8",
      timeout: REWRITE_TIMEOUT_MS,
    });

    if (result.error) return undefined;

    const out = (result.stdout ?? "").trimEnd();

    return out.length > 0 ? out : undefined; // empty stdout = exit 1 or 2
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

    const rewritten = rtkRewriteCommand(event.command);

    if (rewritten === undefined) {
      return;
    }

    return {
      operations: {
        exec: (_command, cwd, options) => {
          return localBashOperations.exec(rewritten, cwd, options);
        },
      },
    };
  });
}
