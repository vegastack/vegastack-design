// version-sync (plan v5 Phase −1, Codex adversarial finding CX-3):
// ONE command that keeps @vegastack/ui's package version, every registry item's
// meta.version, and every provenance header in lockstep — so a Changesets version
// bump can never ship a registry whose items advertise a different version than
// the package that produced them.
//
//   1. read packages/ui/package.json version (post-`changeset version`)
//   2. rewrite every item meta.version in packages/ui/registry.json to match
//   3. re-run the full `registry:build` chain (shadcn build → stamp → header → verify)
//   4. fail-closed verify: for every apps/docs/public/r/<item>.json,
//      meta.version === package version (headers are already verified by verify-headers.mjs)
//
// Idempotent: running twice with no version change produces zero diff.
// Wired into release.yml as part of the changesets `version` command.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const uiPkg = JSON.parse(
  readFileSync(join(repoRoot, "packages/ui/package.json"), "utf8"),
);
const version = uiPkg.version;
if (!version) {
  console.error("✗ version-sync: packages/ui/package.json has no version");
  process.exit(1);
}

/**
 * The PUBLIC npm packages every registry item depends on, and the versions consumers must get.
 *
 * Registry items declare `"@vegastack/design@^0.1.0"` in their npm `dependencies`. Nothing used to
 * rewrite that on a release, and for 0.1.0 → 0.1.1 it did not matter because `^0.1.0` still matched.
 * The first MINOR bump broke it: `^0.1.0` means `>=0.1.0 <0.2.0`, so it EXCLUDES 0.2.0. Shipping that
 * would have left every `shadcn add @vegastack/<component>` installing the previous runtime beneath
 * components built against the new tokens — and npm versions are immutable, so it is not recoverable.
 *
 * Caught by `registry:verify-consume` on release run 30172679327, whose sidecar serves only the local
 * version and therefore could not satisfy the stale range.
 */
const PUBLIC_DEPENDENCIES = ["design", "design-tokens"].map((directory) => {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, `packages/${directory}/package.json`), "utf8"),
  );
  return { name: manifest.name, range: `^${manifest.version}` };
});

// 1+2. sync every item's meta.version in the canonical registry manifest
const registryPath = join(repoRoot, "packages/ui/registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
let updated = 0;
let rangesUpdated = 0;
for (const item of registry.items ?? []) {
  item.meta ??= {};
  if (item.meta.version !== version) {
    item.meta.version = version;
    updated++;
  }
  // Keep each item's npm dependency ranges pointing at the versions actually being published.
  if (Array.isArray(item.dependencies)) {
    item.dependencies = item.dependencies.map((dependency) => {
      for (const { name, range } of PUBLIC_DEPENDENCIES) {
        if (dependency === name || dependency.startsWith(`${name}@`)) {
          const next = `${name}@${range}`;
          if (next !== dependency) rangesUpdated++;
          return next;
        }
      }
      return dependency;
    });
  }
}
if (updated > 0 || rangesUpdated > 0) {
  writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  // Then hand it back to prettier, because `JSON.stringify(…, 2)` is NOT this file's formatting.
  // prettier keeps a short array on one line (`"categories": ["communication"],`) while stringify
  // expands every array across three — 408,865 bytes became 428,665 on a real bump, ~20KB of pure
  // reformatting across 538 items, buried in the release diff. The old comment here claimed to match
  // the existing formatting; that stopped being true once the file was prettier-formatted, and nothing
  // noticed because the rewrite only happens when the version actually changes.
  //
  // The API, not `pnpm exec prettier`: this runs inside the changesets action, and spawning through
  // pnpm failed outright in a detached worktree during testing. An import resolves from this file.
  const prettier = await import("prettier");
  const source = readFileSync(registryPath, "utf8");
  const options = await prettier.resolveConfig(registryPath);
  writeFileSync(
    registryPath,
    await prettier.format(source, { ...options, filepath: registryPath }),
  );
}
console.log(
  `✓ version-sync: ${updated} item meta.version field(s) → ${version}; ` +
    `${rangesUpdated} npm dependency range(s) → ${PUBLIC_DEPENDENCIES.map((d) => `${d.name}@${d.range}`).join(", ")}`,
);

// 2b. the MACHINE AUTHORITY records the same ranges, and `verify-component-contracts` compares the
// two — so if only the manifest moved, that gate fails with 96 problems. Both have to move together,
// in the same step, or every release breaks it. The range here is derived data, not a human decision;
// everything else in this file stays hand-maintained.
const contractsPath = join(repoRoot, "packages/ui/component-contracts.json");
const contracts = JSON.parse(readFileSync(contractsPath, "utf8"));
let contractRanges = 0;
for (const record of [
  ...(contracts.components ?? []),
  ...(contracts.hooks ?? []),
  ...(contracts.blocks ?? []),
]) {
  if (!Array.isArray(record.npmDependencies)) continue;
  record.npmDependencies = record.npmDependencies.map((dependency) => {
    for (const { name, range } of PUBLIC_DEPENDENCIES) {
      if (dependency === name || dependency.startsWith(`${name}@`)) {
        const next = `${name}@${range}`;
        if (next !== dependency) contractRanges++;
        return next;
      }
    }
    return dependency;
  });
}
if (contractRanges > 0) {
  writeFileSync(contractsPath, `${JSON.stringify(contracts, null, 2)}\n`);
  const prettier = await import("prettier");
  const source = readFileSync(contractsPath, "utf8");
  const options = await prettier.resolveConfig(contractsPath);
  writeFileSync(
    contractsPath,
    await prettier.format(source, { ...options, filepath: contractsPath }),
  );
  console.log(
    `✓ version-sync: ${contractRanges} contract npmDependencies range(s) updated — run \`pnpm design:derived\``,
  );
}

// 3. rebuild all generated surfaces so public/r JSONs + headers pick the version up
execSync("pnpm run registry:build", { cwd: repoRoot, stdio: "inherit" });

// 4. fail-closed: every built item must now advertise exactly this version
const outDir = join(repoRoot, "apps/docs/public/r");
const SKIP = new Set(["integrity-manifest.json", "registry.json"]);
const problems = [];
let checked = 0;
for (const f of readdirSync(outDir).filter(
  (n) => n.endsWith(".json") && !SKIP.has(n),
)) {
  const item = JSON.parse(readFileSync(join(outDir, f), "utf8"));
  checked++;
  if (item.meta?.version !== version) {
    problems.push(
      `${f}: meta.version "${item.meta?.version}" ≠ package version "${version}"`,
    );
  }
}
if (problems.length) {
  console.error(
    `✗ version-sync verification failed:\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `✓ version-sync: ${checked} built item(s) verified at v${version} (meta.version = package = headers)`,
);
