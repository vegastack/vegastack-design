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

// `@vegastack/design` depends on `@vegastack/design-tokens` by SEMVER RANGE, not `workspace:*`, and
// `version-sync` rewrites that range to `^<tokens version>` on the Version Packages PR. So during a
// release the range names a version that does not exist on npm yet — this very release publishes it.
//
// npm hoists the consumer's `file:` tokens tarball and is satisfied; pnpm resolves each package's
// dependencies independently, goes to the registry for `^0.7.0`, and fails the whole gate with
// ERR_PNPM_NO_MATCHING_VERSION. That is a false negative: it is testing whether the sibling is
// ALREADY published, which on the release PR is never true (`docs/ledger/bugs.md`, 2026-09-22).
// `verify-shadcn-consume` hit the same wall and solved it with a local sidecar registry;
// `version-sync.mjs`'s own header records that incident.
//
// The fix points BOTH package managers at the tarball we just built, which is exactly the
// relationship that holds once both publish. It does not weaken the gate, because the claim the
// registry lookup was accidentally standing in for is asserted directly below: the range
// `@vegastack/design` declares must admit the `@vegastack/design-tokens` being shipped beside it.
// Overriding without that assertion WOULD be a weakening — it would hide a range pointing at the
// wrong sibling entirely.
function assertSiblingRangeMatches() {
  const design = JSON.parse(
    readFileSync(join(root, "packages/design/package.json"), "utf8"),
  );
  const tokens = JSON.parse(
    readFileSync(join(root, "packages/design-tokens/package.json"), "utf8"),
  );
  const declared = design.dependencies?.["@vegastack/design-tokens"];
  assert.equal(
    declared,
    `^${tokens.version}`,
    `@vegastack/design depends on @vegastack/design-tokens ${declared}, but the version being ` +
      `shipped beside it is ${tokens.version}. version-sync.mjs writes this range as ` +
      `\`^<version>\`; a mismatch means it did not run, or ran before the bump.`,
  );
}

function writeConsumerManifest(directory, designTarball, tokensTarball) {
  mkdirSync(directory, { recursive: true });
  const tokensFile = `file:${tokensTarball}`;
  writeFileSync(
    join(directory, "package.json"),
    `${JSON.stringify(
      {
        name: "vegastack-package-consumer",
        private: true,
        dependencies: {
          "@vegastack/design": `file:${designTarball}`,
          "@vegastack/design-tokens": tokensFile,
        },
        // npm reads the top-level `overrides` key.
        overrides: { "@vegastack/design-tokens": tokensFile },
      },
      null,
      2,
    )}\n`,
  );
  // pnpm 11 does NOT read `pnpm.overrides` from package.json — it moved that, like every other
  // pnpm-specific setting, into pnpm-workspace.yaml. Writing it here is what makes the pnpm leg of
  // this gate resolve the sibling from the tarball instead of the public registry. A single-project
  // `pnpm-workspace.yaml` with no `packages:` key is valid and makes this directory its own root,
  // which also stops pnpm walking up into the repository's workspace and its catalogs.
  writeFileSync(
    join(directory, "pnpm-workspace.yaml"),
    `overrides:\n  "@vegastack/design-tokens": "${tokensFile}"\n`,
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
  assertSiblingRangeMatches();
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
