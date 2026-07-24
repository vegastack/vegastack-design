#!/usr/bin/env node
// sync-package-skills — mirror skills/public/** into packages/design/skills/**.
//
// The public skills are AUTHORED at skills/public/ and SHIPPED inside @vegastack/design (the
// package's `files` includes "skills"), so consumers get them from public npm with no repo
// access and no credentials. This is the same edit-canonical/re-mirror discipline as the
// Toaster pair — edit skills/public/, never the mirror.
//
// The mirror is COMMITTED, not a build artifact, so it is present at `npm pack` time regardless
// of build order. That is the whole reason it is a mirror rather than a build step.
//
//   node tooling/sync-package-skills.mjs           # write (idempotent)
//   node tooling/sync-package-skills.mjs --check    # exit 1 on drift (CI gate)
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "skills/public");
const DEST = join(ROOT, "packages/design/skills");
const check = process.argv.includes("--check");

/** Every file under dir, as paths relative to dir, POSIX-normalised for stable comparison. */
function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile()) continue;
    const abs = join(entry.parentPath ?? entry.path, entry.name);
    out.push(relative(dir, abs).split(sep).join("/"));
  }
  return out.sort();
}

if (!existsSync(SRC)) {
  console.error(
    "✗ sync-package-skills: skills/public/ is missing — nothing to mirror",
  );
  process.exit(1);
}

const sourceFiles = listFiles(SRC);
if (sourceFiles.length === 0) {
  // Fail closed: an empty source would otherwise "successfully" delete the entire shipped mirror.
  console.error(
    "✗ sync-package-skills: skills/public/ contains no files — refusing to empty the mirror",
  );
  process.exit(1);
}

const mirrorFiles = listFiles(DEST);
const problems = [];
let written = 0;

for (const rel of sourceFiles) {
  const from = join(SRC, rel);
  const to = join(DEST, rel);
  const expected = readFileSync(from);
  let actual;
  try {
    actual = readFileSync(to);
  } catch {
    actual = undefined;
  }
  if (actual && actual.equals(expected)) continue;

  if (check) {
    problems.push(
      actual ? `differs: ${rel}` : `missing from the mirror: ${rel}`,
    );
  } else {
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, expected);
    written++;
  }
}

// A skill deleted or renamed upstream must not linger in the published package.
for (const rel of mirrorFiles) {
  if (sourceFiles.includes(rel)) continue;
  if (check) {
    problems.push(`stale in the mirror (no longer in skills/public/): ${rel}`);
  } else {
    rmSync(join(DEST, rel));
    written++;
  }
}

if (check) {
  if (problems.length) {
    console.error(
      `✗ sync-package-skills --check: packages/design/skills is OUT OF SYNC with skills/public`,
    );
    for (const p of problems) console.error(`  - ${p}`);
    console.error(
      "  Fix: node tooling/sync-package-skills.mjs   (then commit the mirror)",
    );
    process.exit(1);
  }
  console.log(
    `✓ sync-package-skills: mirror matches skills/public (${sourceFiles.length} files)`,
  );
} else if (written) {
  console.log(
    `✓ sync-package-skills: mirrored ${sourceFiles.length} files (${written} changed)`,
  );
} else {
  console.log(
    `✓ sync-package-skills: already in sync (${sourceFiles.length} files)`,
  );
}
