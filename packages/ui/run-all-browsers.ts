import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { allBrowserEngines } from "./webkit-lane.ts";

const cwd = fileURLToPath(new URL(".", import.meta.url));
const rawForwarded = process.argv.slice(2);
// `pnpm run script -- <args>` preserves the separator for Node scripts. Vitest treats everything
// after a literal `--` as positional filters, so leaving it in front would turn reporter/retry
// options into filenames and accidentally run the complete suite.
const forwarded =
  rawForwarded[0] === "--" ? rawForwarded.slice(1) : rawForwarded;
const engines = await allBrowserEngines();
const hasFileFilters = forwarded.some((argument) => !argument.startsWith("-"));

console.log(`test:all-browsers — sequential engines: ${engines.join(" → ")}`);

for (const engine of engines) {
  // Chromium's complete four-worker run is the same stable topology as `pnpm verify`. Firefox and
  // WebKit are both more sensitive to concurrent trusted actions, while one 143-file browser page
  // accumulates enough cross-file state to become unstable too. Four sequential shards give each
  // slow engine a fresh one-worker browser process every ~36 files. A focused developer command
  // stays one invocation so filters cannot produce empty shards.
  const shardCount = engine === "chromium" || hasFileFilters ? 1 : 4;
  for (let shard = 1; shard <= shardCount; shard += 1) {
    const shardLabel =
      shardCount === 1 ? "" : ` · shard ${shard}/${shardCount}`;
    console.log(
      `\n── ${engine}${shardLabel} ────────────────────────────────────────────────`,
    );
    const result = spawnSync(
      "pnpm",
      [
        "exec",
        "vitest",
        "run",
        "--config",
        "vitest.all-browsers.config.ts",
        `--browser.name=${engine}`,
        ...(shardCount === 1 ? [] : [`--shard=${shard}/${shardCount}`]),
        ...forwarded,
      ],
      {
        cwd,
        env: { ...process.env, VEGASTACK_BROWSER_ENGINE: engine },
        stdio: "inherit",
      },
    );

    if (result.error) {
      console.error(
        `test:all-browsers: could not start ${engine}${shardLabel}: ${result.error.message}`,
      );
      process.exit(2);
    }
    if (result.signal) {
      console.error(
        `test:all-browsers: ${engine}${shardLabel} ended on ${result.signal}`,
      );
      process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

console.log(
  `\n✓ test:all-browsers: ${engines.join(" + ")} passed sequentially`,
);
