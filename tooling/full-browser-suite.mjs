#!/usr/bin/env node

// Manual-only complete component suite. Automatic workflows are forbidden from invoking this
// command by verify-workflow-security.mjs; workflow_dispatch/full-suite.yml is its one CI caller.

import { spawnSync } from "node:child_process";

const PREFIX = "test:full";
let engines = "chromium";
for (let index = 2; index < process.argv.length; index++) {
  const value = process.argv[index];
  if (value === "--engines") engines = process.argv[++index];
  else if (value.startsWith("--engines=")) engines = value.split("=", 2)[1];
  else {
    console.error(`${PREFIX}: unknown argument ${value}`);
    process.exit(2);
  }
}
if (!new Set(["chromium", "all"]).has(engines)) {
  console.error(`${PREFIX}: --engines must be chromium or all`);
  process.exit(2);
}

const argv =
  engines === "chromium"
    ? ["exec", "turbo", "run", "test", "--filter=@vegastack/ui"]
    : ["-F", "@vegastack/ui", "test:all-browsers"];
const started = Date.now();
console.log(`${PREFIX}: complete UI suite (${engines}) — manual audit`);
const result = spawnSync("pnpm", argv, { stdio: "inherit", env: process.env });
const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (result.error) {
  console.error(`${PREFIX}: could not start pnpm: ${result.error.message}`);
  process.exit(2);
}
if (result.signal) {
  console.error(`${PREFIX}: ended on ${result.signal} after ${seconds}s`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`${PREFIX}: failed after ${seconds}s`);
  process.exit(result.status ?? 1);
}
console.log(`${PREFIX}: passed in ${seconds}s`);
