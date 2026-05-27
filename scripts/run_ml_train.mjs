import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const scriptArgs = ["scripts/train_model.py", ...process.argv.slice(2)];
const bundledPython = join(
  homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe",
);

const candidates = [
  process.env.PYTHON ? { command: process.env.PYTHON, args: scriptArgs } : null,
  { command: "python", args: scriptArgs },
  { command: "py", args: ["-3", ...scriptArgs] },
  existsSync(bundledPython) ? { command: bundledPython, args: scriptArgs } : null,
].filter(Boolean);

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, candidate.args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error?.code === "ENOENT") continue;
  process.exit(result.status ?? 1);
}

console.error("No Python executable was found.");
console.error("Install Python 3, or set PYTHON to the full python.exe path, then run npm run ml:train again.");
process.exit(1);
