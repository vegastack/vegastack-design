#!/usr/bin/env node
// Run the real `shadcn add` consume proof (tooling/verify-shadcn-consume.mjs, ~5 min) only when the
// change can affect it. Usage: node tooling/consume-if-affected.mjs --base <sha> --head <sha>
// With no range (a local working-tree run) it compares against origin/main.
import { spawnSync } from "node:child_process";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const base = arg("--base") ?? "origin/main";
const head = arg("--head");
const diff = spawnSync(
  "git",
  ["diff", "--name-only", head ? `${base}...${head}` : base],
  { encoding: "utf8" },
);
if (diff.status !== 0) {
  console.error(`consume-if-affected: git diff failed: ${diff.stderr}`);
  process.exit(1);
}
const AFFECTS_CONSUME =
  /^(packages\/ui\/registry\.json|packages\/design\/(bin|src)\/|packages\/design\/(package\.json|tsup\.config\.ts)|packages\/design-tokens\/|tooling\/(verify-shadcn-consume|verify-registry-deps|registry-[a-z-]+|consume-if-affected)\.mjs|apps\/docs\/components\.json|pnpm-lock\.yaml|package\.json)/;
const hits = diff.stdout
  .split("\n")
  .filter((file) => AFFECTS_CONSUME.test(file));
if (hits.length === 0) {
  console.log("consume-if-affected: no consume input changed; skipped");
  process.exit(0);
}
console.log(
  `consume-if-affected: ${hits.length} consume input(s) changed (${hits.slice(0, 5).join(", ")}…)`,
);
// The consume proof packs the public packages, so they must be built (a turbo cache hit after typecheck).
const build = spawnSync(
  "pnpm",
  [
    "exec",
    "turbo",
    "run",
    "build",
    "--filter=@vegastack/design",
    "--filter=@vegastack/design-tokens",
  ],
  { stdio: "inherit" },
);
if (build.status !== 0) process.exit(build.status ?? 1);
const run = spawnSync("pnpm", ["registry:verify-consume"], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
