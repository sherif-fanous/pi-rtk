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
  // rtk's exit codes encode permission verdicts (0 = allow, 1 = no equivalent,
  // 2 = deny, 3 = ask). Pi has its own approval flow for bash tool calls, so we
  // trust stdout as the rewrite and let Pi gate execution. We only skip the
  // rewrite when rtk explicitly produced no replacement (exit 1, empty stdout),
  // produced a deny verdict without a rewrite (exit 2, empty stdout), or when
  // rtk itself failed to run.
  //
  // rtk's exit 2 deny verdict is derived from its own permission rules, loaded
  // by src/hooks/permissions.rs::load_permission_rules. Those rules do not map
  // cleanly onto Pi's permission model, so command-level gating in Pi remains
  // the responsibility of Pi's approval flow or a dedicated Pi permission
  // extension. See the README's "What pi-rtk Does Not Do" section for the
  // user-facing rationale.
  try {
    const result = spawnSync("rtk", ["rewrite", command], {
      encoding: "utf-8",
      timeout: REWRITE_TIMEOUT_MS,
    });

    if (result.error) return undefined; // spawn failed (rtk not on PATH, timeout, etc.)

    const out = (result.stdout ?? "").trimEnd();

    return out.length > 0 ? out : undefined; // empty stdout = exit 1 OR exit 2
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
