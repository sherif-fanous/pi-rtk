/**
 * pi-rtk — Pi extension that routes bash commands through rtk.
 *
 * rtk (https://github.com/rtk-ai/rtk) is a CLI proxy that filters and compresses
 * tool output before it reaches the LLM context, achieving 60-90% token savings on
 * common dev operations (git, cargo, npm, grep, etc.).
 *
 * This extension overrides Pi's built-in bash tool. Before a command executes,
 * the spawnHook passes it to `rtk rewrite` which rewrites it to its rtk
 * equivalent (e.g. `git status` → `rtk git status`). For unsupported commands,
 * `rtk rewrite` exits with error code 1 and the original command runs unchanged.
 *
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createBashTool } from "@mariozechner/pi-coding-agent";
import { execFileSync } from "node:child_process";

export default function (pi: ExtensionAPI) {
  const cwd = process.cwd();

  const bashTool = createBashTool(cwd, {
    spawnHook: ({ command, cwd, env }) => {
      try {
        const rewritten = execFileSync("rtk", ["rewrite", command], {
          encoding: "utf-8",
          timeout: 5000,
        }).trimEnd();

        return { command: rewritten, cwd, env };
      } catch {
        return { command, cwd, env };
      }
    },
  });

  pi.registerTool(bashTool);
}
