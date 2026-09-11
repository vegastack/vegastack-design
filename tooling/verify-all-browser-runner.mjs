#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./lib/fs.mjs";

const FILES = {
  package: "packages/ui/package.json",
  selector: "packages/ui/webkit-lane.ts",
  runner: "packages/ui/run-all-browsers.ts",
  config: "packages/ui/vitest.all-browsers.config.ts",
};

function readSources() {
  return Object.fromEntries(
    Object.entries(FILES).map(([name, file]) => [
      name,
      readFileSync(join(ROOT, file), "utf8"),
    ]),
  );
}

function verify(sources) {
  const packageJson = JSON.parse(sources.package);
  assert.equal(
    packageJson.scripts?.["test:all-browsers"],
    "node run-all-browsers.ts",
    "packages/ui: test:all-browsers must go through the sequential runner",
  );

  assert.match(
    sources.selector,
    /process\.env\.CI \? "require" : "auto"/,
    "webkit-lane: CI must default to required WebKit",
  );
  assert.match(
    sources.selector,
    /return \["chromium", \.\.\.\(webkit \? \(\["webkit"\] as const\) : \[\]\), "firefox"\];/,
    "webkit-lane: release engine order must include Chromium, conditional WebKit, and Firefox",
  );

  assert.match(
    sources.runner,
    /const engines = await allBrowserEngines\(\);/,
    "all-browser runner must resolve the engine authority",
  );
  assert.match(
    sources.runner,
    /for \(const engine of engines\)/,
    "all-browser runner must execute every selected engine",
  );
  assert.match(
    sources.runner,
    /const shardCount = engine === "chromium" \|\| hasFileFilters \? 1 : 4;/,
    "all-browser runner must split each complete slow-engine suite into four fresh processes",
  );
  assert.match(
    sources.runner,
    /`--browser\.name=\$\{engine\}`/,
    "all-browser runner must select exactly the current engine",
  );
  assert.match(
    sources.runner,
    /`--shard=\$\{shard\}\/\$\{shardCount\}`/,
    "all-browser runner must pass each shard to Vitest",
  );
  assert.match(
    sources.runner,
    /VEGASTACK_BROWSER_ENGINE: engine/,
    "all-browser runner must bind the config to the current engine",
  );
  assert.match(
    sources.runner,
    /if \(result\.status !== 0\) process\.exit\(result\.status \?\? 1\);/,
    "all-browser runner must propagate a red child exit",
  );

  assert.match(
    sources.config,
    /if \(!selectedEngine\)/,
    "all-browser config must reject direct multi-instance execution",
  );
  assert.match(
    sources.config,
    /new Set\(\["chromium", "firefox", "webkit"\]\)/,
    "all-browser config must accept exactly the three release engines",
  );
  assert.match(
    sources.config,
    /maxWorkers: engine === "chromium" \? 4 : 1/,
    "all-browser config must keep the measured per-engine worker ceilings",
  );
  assert.match(
    sources.config,
    /retry: 1/,
    "all-browser config must keep one bounded release retry",
  );
}

const sources = readSources();
verify(sources);

if (process.argv.includes("--self-test")) {
  const mutations = [
    {
      name: "package script bypasses the sequential runner",
      file: "package",
      find: '"test:all-browsers": "node run-all-browsers.ts"',
      replace:
        '"test:all-browsers": "vitest run --config vitest.all-browsers.config.ts"',
    },
    {
      name: "Firefox is dropped from the release engine order",
      file: "selector",
      find: 'return ["chromium", ...(webkit ? (["webkit"] as const) : []), "firefox"];',
      replace: 'return ["chromium", ...(webkit ? (["webkit"] as const) : [])];',
    },
    {
      name: "WebKit is dropped from the release engine order",
      file: "selector",
      find: '...(webkit ? (["webkit"] as const) : []),',
      replace: "",
    },
    {
      name: "the runner executes only its first selected engine",
      file: "runner",
      find: "for (const engine of engines) {",
      replace: "for (const engine of engines.slice(0, 1)) {",
    },
    {
      name: "slow-engine fresh-process sharding is removed",
      file: "runner",
      find: 'const shardCount = engine === "chromium" || hasFileFilters ? 1 : 4;',
      replace: "const shardCount = 1;",
    },
    {
      name: "a red Vitest child no longer fails the runner",
      file: "runner",
      find: "if (result.status !== 0) process.exit(result.status ?? 1);",
      replace: "if (result.status !== 0) continue;",
    },
    {
      name: "direct unsafe multi-instance config use is allowed",
      file: "config",
      find: "if (!selectedEngine) {",
      replace: "if (false && !selectedEngine) {",
    },
    {
      name: "Firefox and WebKit regain Chromium's worker concurrency",
      file: "config",
      find: 'maxWorkers: engine === "chromium" ? 4 : 1,',
      replace: "maxWorkers: 4,",
    },
  ];

  for (const mutation of mutations) {
    const original = sources[mutation.file];
    const changed = original.replace(mutation.find, mutation.replace);
    assert.notEqual(
      changed,
      original,
      `self-test mutation did not apply: ${mutation.name}`,
    );
    assert.throws(
      () => verify({ ...sources, [mutation.file]: changed }),
      undefined,
      `runner verifier accepted: ${mutation.name}`,
    );
    console.log(`✓ ${mutation.name}`);
  }
  console.log(
    `✓ verify-all-browser-runner --self-test: ${mutations.length}/${mutations.length} mutations rejected`,
  );
} else {
  console.log(
    "✓ verify-all-browser-runner: sequential release topology intact",
  );
}
