import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./change-set.mjs";

/**
 * Fingerprint machine-authority bytes and filesystem identity. This is deliberately smaller than a
 * working-tree hash: model factories retain it so a caller can prove that the authority used to
 * construct an in-memory graph is still the authority present inside its exact-tree envelope.
 */
export function authorityFingerprint(paths, { root = ROOT } = {}) {
  const hash = createHash("sha256");
  for (const path of [...new Set(paths)].sort()) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      hash.update(`${path}\0missing\n`);
      continue;
    }
    const stat = lstatSync(absolute);
    const type = stat.isSymbolicLink()
      ? "symlink"
      : stat.isFile()
        ? "file"
        : "other";
    hash.update(`${path}\0${type}\0${stat.mode.toString(8)}\0`);
    if (type === "symlink") hash.update(readlinkSync(absolute));
    else if (type === "file") hash.update(readFileSync(absolute));
    hash.update("\n");
  }
  return hash.digest("hex");
}

export function assertAuthorityFingerprint(
  paths,
  expected,
  label,
  { root = ROOT } = {},
) {
  const actual = authorityFingerprint(paths, { root });
  if (actual !== expected)
    throw new Error(
      `${label} changed while its dependency model was in memory (${expected} -> ${actual})`,
    );
  return actual;
}
