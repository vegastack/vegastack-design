#!/usr/bin/env node

// Runtime proof for the published packages' CommonJS contract. Reading the manifest is not enough:
// Node's conditional-exports resolution must actually find and execute every declared `require`
// target, including the package.json subpath tools commonly resolve.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function packageRequire(directory) {
  return createRequire(join(root, "packages", directory, "package.json"));
}

const requireDesign = packageRequire("design");
const design = requireDesign("@vegastack/design");
assert.equal(
  typeof design.cn,
  "function",
  "@vegastack/design CommonJS root does not export cn",
);
assert.equal(
  typeof requireDesign("@vegastack/design/icons").Icon,
  "function",
  "@vegastack/design/icons CommonJS export is not executable",
);
assert.equal(
  typeof requireDesign("@vegastack/design/create-animated-icon")
    .createAnimatedIcon,
  "function",
  "@vegastack/design/create-animated-icon CommonJS export is not executable",
);
assert.equal(
  typeof requireDesign("@vegastack/design/theme-scope").useInternalThemeScope,
  "function",
  "@vegastack/design/theme-scope CommonJS export is not executable",
);
assert.equal(typeof requireDesign("@vegastack/design/preset"), "object");
assert.equal(
  requireDesign("@vegastack/design/package.json").name,
  "@vegastack/design",
  "@vegastack/design/package.json is not exported",
);

const requireTokens = packageRequire("design-tokens");
assert.equal(
  typeof requireTokens("@vegastack/design-tokens"),
  "object",
  "@vegastack/design-tokens CommonJS root is not executable",
);
assert.equal(
  requireTokens("@vegastack/design-tokens/package.json").name,
  "@vegastack/design-tokens",
  "@vegastack/design-tokens/package.json is not exported",
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_audit: "false",
      npm_config_fund: "false",
    },
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`,
  );
  return result.stdout;
}

function pack(directory, destination) {
  const output = run(
    "npm",
    [
      "pack",
      join(root, "packages", directory),
      "--pack-destination",
      destination,
      "--json",
    ],
    destination,
  );
  const [{ filename }] = JSON.parse(output);
  return join(destination, filename);
}

function writeConsumerManifest(directory, designTarball, tokensTarball) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, "package.json"),
    `${JSON.stringify(
      {
        name: "vegastack-package-consumer",
        private: true,
        dependencies: {
          "@vegastack/design": `file:${designTarball}`,
          "@vegastack/design-tokens": `file:${tokensTarball}`,
        },
      },
      null,
      2,
    )}\n`,
  );
}

function assertInstalled(directory) {
  const installedDesign = JSON.parse(
    readFileSync(
      join(directory, "node_modules/@vegastack/design/package.json"),
      "utf8",
    ),
  );
  const installedTokens = JSON.parse(
    readFileSync(
      join(directory, "node_modules/@vegastack/design-tokens/package.json"),
      "utf8",
    ),
  );
  assert.equal(installedDesign.name, "@vegastack/design");
  assert.equal(installedTokens.name, "@vegastack/design-tokens");
}

// Exercise the same npm-packed manifests consumers receive. Workspace and catalog protocols are
// valid inside this pnpm workspace but make both npm and pnpm reject the published package before
// writing node_modules, which runtime export checks cannot observe.
const consumer = mkdtempSync(join(tmpdir(), "vegastack-package-consumer-"));
try {
  const tokensTarball = pack("design-tokens", consumer);
  const designTarball = pack("design", consumer);
  const npmConsumer = join(consumer, "npm");
  writeConsumerManifest(npmConsumer, designTarball, tokensTarball);
  run(
    "npm",
    ["install", "--ignore-scripts", "--package-lock=false"],
    npmConsumer,
  );
  assertInstalled(npmConsumer);

  const pnpmConsumer = join(consumer, "pnpm");
  writeConsumerManifest(pnpmConsumer, designTarball, tokensTarball);
  run("pnpm", ["install", "--ignore-scripts"], pnpmConsumer);
  assertInstalled(pnpmConsumer);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}

console.log(
  "✓ package exports: CommonJS roots/subpaths execute and npm-packed manifests install with npm and pnpm",
);
