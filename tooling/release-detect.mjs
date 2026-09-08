#!/usr/bin/env node
// What will a push to `main` DO — open a Version PR, publish, or neither?
//
// ONE AUTHORITY, DELIBERATELY. This logic used to be shell inside `release.yml`'s `changes` job,
// which meant it could not be exercised until it had already run on `main`, and it was wrong there
// in both directions on 2026-07-25. It lives here, the workflow calls it, and
// `tooling/test/release-detect.test.mjs` exercises both outputs.
//
// The larger `classify-change.mjs` this replaces also answered "which browser gates must the receipt
// carry" — a question that no longer exists: `quality-gate` EXECUTES `pnpm verify` rather than
// inspecting a receipt (docs/plans/2026-09-08-verification-rebuild.md § 3.3 / § 3.4). What survives
// is the release path decision, and only that.
//
// OUTPUTS (printed, and written as key=value to $GITHUB_OUTPUT when it is set)
//   has_changesets   pending changesets exist, so the run opens a Version PR rather than publishing
//   publish          the release path is reachable for this push

import { spawnSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ROOT, readJson } from "./lib/fs.mjs";

const PUBLIC_PACKAGES = ["design", "design-tokens"];

const options = { before: null, after: null, checkNpm: false };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  if (flag === "--before") options.before = argv[++index];
  else if (flag === "--after") options.after = argv[++index];
  else if (flag === "--check-npm") options.checkNpm = true;
  else {
    console.error(
      `release-detect: unknown argument ${flag}\n` +
        "Usage: node tooling/release-detect.mjs [--before <ref>] [--after <ref>] [--check-npm]",
    );
    process.exit(2);
  }
}

const changesetFiles = (() => {
  try {
    return readdirSync(join(ROOT, ".changeset")).filter(
      (name) => name.endsWith(".md") && name !== "README.md",
    );
  } catch {
    return [];
  }
})();
const hasChangesets = changesetFiles.length > 0;

/** Files changed in the range, when one was given. An unresolvable range is treated as "unknown". */
const changed =
  options.before && options.after
    ? (
        spawnSync(
          "git",
          ["diff", "--name-only", `${options.before}..${options.after}`],
          { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
        ).stdout ?? ""
      )
        .split("\n")
        .filter(Boolean)
    : [];

/**
 * Ask the registry what is actually published. "Did `packages/` change in this push" alone is WRONG
 * for an INTERRUPTED release: versions can sit bumped-but-unpublished on `main` — as happened when an
 * empty changeset deadlocked the Version PR, leaving 0.2.0 on main and 0.1.1 on npm with no future
 * push able to set this true. Opt-in because it needs network.
 */
const unpublished = [];
if (options.checkNpm) {
  for (const directory of PUBLIC_PACKAGES) {
    const manifest = readJson(join(ROOT, `packages/${directory}/package.json`));
    const latest = spawnSync("npm", ["view", manifest.name, "version"], {
      encoding: "utf8",
      timeout: 60_000,
    });
    const published = (latest.stdout ?? "").trim();
    if (latest.status !== 0 || published !== manifest.version)
      unpublished.push(
        `${manifest.name} ${published || "(none)"} → ${manifest.version}`,
      );
  }
}

const publish =
  hasChangesets ||
  changed.some((file) => file.startsWith("packages/")) ||
  unpublished.length > 0;

const outputs = { has_changesets: hasChangesets, publish };
console.log(`release-detect:`);
console.log(
  `  has_changesets  ${hasChangesets} (${changesetFiles.length} pending)`,
);
console.log(
  `  publish         ${publish}${unpublished.length ? ` — unpublished: ${unpublished.join(", ")}` : ""}`,
);

if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(""),
  );
