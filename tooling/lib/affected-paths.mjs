import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { ROOT } from "./change-set.mjs";

export const AFFECTED_DIAGNOSTICS_DIR = join(
  ROOT,
  ".gates",
  "diagnostics",
  "affected",
);
export const AFFECTED_SUMMARY_PATH = join(
  AFFECTED_DIAGNOSTICS_DIR,
  "summary.json",
);
export const AFFECTED_SAMPLES_DIR = join(AFFECTED_DIAGNOSTICS_DIR, "samples");
export const affectedRunDirectory = (sampleId) =>
  join(AFFECTED_DIAGNOSTICS_DIR, "runs", sampleId);

function inside(path, directory) {
  const value = relative(resolve(directory), resolve(path));
  return value === "" || (!value.startsWith(`..${sep}`) && value !== "..");
}

function assertAffectedParentPath(path) {
  const parent = dirname(resolve(path));
  const anchored = inside(parent, AFFECTED_DIAGNOSTICS_DIR);
  const start = anchored ? AFFECTED_DIAGNOSTICS_DIR : parent;
  const parts = anchored
    ? relative(start, parent).split(sep).filter(Boolean)
    : [];
  let cursor = start;
  for (const part of ["", ...parts]) {
    if (part) cursor = join(cursor, part);
    if (!existsSync(cursor)) continue;
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error(
        `affected sample parent is not a regular directory: ${cursor}`,
      );
  }
}

export function validateAffectedSummaryPath(path) {
  if (
    inside(path, AFFECTED_SAMPLES_DIR) ||
    inside(path, join(AFFECTED_DIAGNOSTICS_DIR, "runs"))
  )
    throw new Error(
      "affected summary report cannot target immutable sample or selected-run storage",
    );
  return path;
}

export function writeImmutableAffectedSample(path, sample) {
  assertAffectedParentPath(path);
  mkdirSync(dirname(path), { recursive: true });
  assertAffectedParentPath(path);
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(sample, null, 2)}\n`, {
    flag: "wx",
    mode: 0o600,
  });
  try {
    linkSync(temporary, path);
  } finally {
    unlinkSync(temporary);
  }
  return path;
}

export function loadAffectedSamples(directory = AFFECTED_SAMPLES_DIR) {
  const samples = [];
  const errors = [];
  if (existsSync(directory)) {
    const rootStat = lstatSync(directory);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory())
      return {
        samples,
        errors: ["sample root is not a regular directory"],
      };
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      if (!name.endsWith(".json")) {
        errors.push(`${name}: unexpected non-JSON/partial sample entry`);
        continue;
      }
      try {
        const stat = lstatSync(path);
        if (stat.isSymbolicLink() || !stat.isFile()) {
          errors.push(`${name}: sample entry is not a regular file`);
          continue;
        }
        const bytes = readFileSync(path, "utf8");
        const parsed = JSON.parse(bytes);
        const canonical = `${JSON.stringify(parsed, null, 2)}\n`;
        if (bytes !== canonical) {
          errors.push(
            `${name}: sample bytes are not canonical (tamper, duplicate key, or partial rewrite)`,
          );
          continue;
        }
        samples.push(parsed);
      } catch (error) {
        errors.push(`${name}: ${error.message}`);
      }
    }
  }
  return { samples, errors };
}

export function readAffectedProtectedFile(path) {
  if (!existsSync(path)) return null;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile())
    throw new Error(
      `protected affected file is not a regular non-symlink: ${path}`,
    );
  return readFileSync(path);
}

export function fingerprintAffectedProtectedDirectory(path) {
  if (!existsSync(path)) return "missing";
  const rootStat = lstatSync(path);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory())
    throw new Error(
      `protected affected root is not a regular directory: ${path}`,
    );
  const hash = createHash("sha256");
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const entry = join(directory, name);
      const stat = lstatSync(entry);
      const key = relative(path, entry);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
        throw new Error(
          `protected affected evidence contains unsupported entry: ${key}`,
        );
      hash.update(
        `${key}\0${stat.isDirectory() ? "directory" : "file"}\0${stat.mode.toString(8)}\0`,
      );
      if (stat.isDirectory()) walk(entry);
      else hash.update(readFileSync(entry));
    }
  };
  walk(path);
  return hash.digest("hex");
}
