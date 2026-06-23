import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const scriptArgs = ["scripts/update_official_player_data.py", ...process.argv.slice(2)];
const candidates = [
  "D:\\AnacondaTools\\anac\\envs\\wc2026\\python.exe",
  "D:\\AnacondaTools\\anac\\python.exe",
  process.env.PYTHON,
  "python",
].filter(Boolean);

for (const python of candidates) {
  if (python !== "python" && !existsSync(python)) continue;
  const result = spawnSync(python, scriptArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  if (result.error?.code === "ENOENT") continue;
  process.exit(result.status ?? 1);
}

console.error("No Python runtime found. Install Anaconda or set PYTHON to a valid python.exe.");
process.exit(1);
