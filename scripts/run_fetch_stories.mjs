import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const candidates = [
  "D:\\AnacondaTools\\anac\\envs\\wc2026\\python.exe",
  "D:\\AnacondaTools\\anac\\python.exe",
  "python",
];

const python = candidates.find((candidate) => candidate === "python" || existsSync(candidate));

if (!python) {
  console.error("No Python runtime found. Install Anaconda or update scripts/run_fetch_stories.mjs.");
  process.exit(1);
}

const result = spawnSync(python, ["scripts/fetch_off_field_stories.py"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

process.exit(result.status ?? 1);
