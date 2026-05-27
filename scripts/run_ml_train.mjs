import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const scriptArgs = ["scripts/train_model.py", ...process.argv.slice(2)];
const condaRunArgs = ["run", "-n", "wc2026", "python", ...scriptArgs];
const bundledPython = join(
  homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe",
);
const localAnacondaConda = "D:\\AnacondaTools\\anac\\condabin\\conda.bat";

const candidates = [
  existsSync(localAnacondaConda) ? { command: localAnacondaConda, args: condaRunArgs } : null,
  { command: "conda", args: condaRunArgs },
  process.env.PYTHON ? { command: process.env.PYTHON, args: scriptArgs } : null,
  { command: "python", args: scriptArgs },
  { command: "py", args: ["-3", ...scriptArgs] },
  existsSync(bundledPython) ? { command: bundledPython, args: scriptArgs } : null,
].filter(Boolean);

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, candidate.args, {
    stdio: "inherit",
    shell: process.platform === "win32" && candidate.command.toLowerCase().endsWith(".bat"),
  });

  if (result.error?.code === "ENOENT") continue;
  process.exit(result.status ?? 1);
}

console.error("No Python executable was found.");
console.error("Install Anaconda, create the wc2026 environment, or set PYTHON to the full python.exe path, then run npm run ml:train again.");
process.exit(1);
