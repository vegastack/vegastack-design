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

// 1+2. sync every item's meta.version in the canonical registry manifest
const registryPath = join(repoRoot, "packages/ui/registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
let updated = 0;
for (const item of registry.items ?? []) {
  item.meta ??= {};
  if (item.meta.version !== version) {
    item.meta.version = version;
    updated++;
  }
}
if (updated > 0) {
  // match the file's existing 2-space formatting + trailing newline (keeps diffs clean)
  writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
}
console.log(
  `✓ version-sync: ${updated} item meta.version field(s) → ${version}`,
);

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
