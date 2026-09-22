#!/usr/bin/env node

// Prove that `pnpm version-packages` changed only release metadata and provenance. The release job
// runs this before committing with contents:write; a deny list would let a new runtime path slip in.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROOT } from "./lib/fs.mjs";

const HEADER_PATH =
  /^(?:packages\/ui\/registry\/(?:ui|lib|blocks)\/|apps\/docs\/components\/ui\/|apps\/docs\/lib\/(?:geo-data|drag-item)\.ts$)/;
const GENERATED_PATH =
  /^(?:apps\/docs\/public\/r\/|packages\/ui\/(?:component-contracts|registry)\.json$|docs\/ledger\/component-matrix\.md$|docs\/research\/design-md-audit\/(?:audit-register\.json|audits\/coverage\.json)$)/;
const CHANGELOG_PATH =
  /^(?:CHANGELOG\.md$|apps\/docs\/content\/docs\/changelog\.mdx$|packages\/(?:design|design-tokens|ui)\/CHANGELOG\.md$)/;
const PACKAGE_PATH = /^packages\/(?:design|design-tokens|ui)\/package\.json$/;
const LOCKFILE_PATH = /^pnpm-lock\.yaml$/;

function git(args, { cwd = ROOT } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw new Error(`git did not run: ${result.error.message}`);
  if (result.status !== 0)
    throw new Error(
      `git ${args.join(" ")} failed: ${(result.stderr ?? "").trim()}`,
    );
  return result;
}

function baseTexts(base, paths, cwd) {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return new Map();
  const result = spawnSync("git", ["cat-file", "--batch"], {
    cwd,
    input: Buffer.from(unique.map((path) => `${base}:${path}\n`).join("")),
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error)
    throw new Error(`git cat-file did not run: ${result.error.message}`);
  if (result.status !== 0)
    throw new Error(`git cat-file failed: ${String(result.stderr).trim()}`);
  const output = result.stdout;
  let offset = 0;
  const texts = new Map();
  for (const path of unique) {
    const headerEnd = output.indexOf(10, offset);
    if (headerEnd === -1)
      throw new Error(`git cat-file omitted its header for ${path}`);
    const header = output.subarray(offset, headerEnd).toString("utf8");
    offset = headerEnd + 1;
    if (header.endsWith(" missing")) {
      texts.set(path, null);
      continue;
    }
    const size = Number(header.split(" ").at(-1));
    if (!Number.isSafeInteger(size))
      throw new Error(
        `git cat-file returned an invalid size for ${path}: ${header}`,
      );
    texts.set(path, output.subarray(offset, offset + size).toString("utf8"));
    offset += size + 1; // content plus cat-file's record separator newline
  }
  return texts;
}

function stripHeader(text) {
  return text.replace(/^\/\/ @vegastack [^\n]+\n(?:\n)?/, "");
}

function normalizedPackage(text) {
  const value = JSON.parse(text);
  delete value.version;
  for (const field of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ])
    for (const name of Object.keys(value[field] ?? {}))
      if (name.startsWith("@vegastack/"))
        value[field][name] = "<internal-version>";
  return JSON.stringify(value);
}

// The lockfile is the one release output where a NEW THIRD-PARTY DEPENDENCY could hide, so it is
// not allowed wholesale the way the changelogs are. `version-packages` regenerates it because
// `version-sync` rewrites the internal `@vegastack/*` ranges and the lockfile records each of those
// as a `specifier:` under the dependency's own key; the legitimate diff is exactly those lines.
//
// So: neutralise the `specifier:`/`version:` lines that sit under a `@vegastack/*` key — the same
// move `normalizedPackage` makes for the manifests — and require everything else to be byte
// identical. A release that pulled in, bumped or re-resolved any other package changes a line
// outside that set and is rejected.
function normalizedLockfile(text) {
  let internal = false;
  return text
    .split("\n")
    .map((line) => {
      if (/^\s*'?@vegastack\/[^']*'?:\s*$/.test(line)) {
        internal = true;
        return line;
      }
      const field = /^(\s*)(specifier|version):\s.*$/.exec(line);
      if (field) {
        return internal ? `${field[1]}${field[2]}: <internal>` : line;
      }
      // Any other line ends the entry the key opened.
      if (line.trim() !== "") internal = false;
      return line;
    })
    .join("\n");
}

function versionTuple(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value ?? "");
  return match ? match.slice(1).map(Number) : null;
}

function versionIncreased(before, after) {
  const left = versionTuple(before);
  const right = versionTuple(after);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index++) {
    if (right[index] !== left[index]) return right[index] > left[index];
  }
  return false;
}

function outsideNumbers(text) {
  return text.replace(
    /<!-- NUMBERS:START[\s\S]*?<!-- NUMBERS:END -->/,
    "<generated-numbers>",
  );
}

export function validateReleaseOutput({ base, cwd = ROOT }) {
  if (!base) return ["--base is required"];
  const raw = git(["diff", "--name-status", "-z", base, "--"], { cwd }).stdout;
  const fields = raw.split("\0").filter(Boolean);
  const changes = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    const paths = [fields[index++]];
    if (/^[RC]/.test(status)) paths.push(fields[index++]);
    changes.push({ status, paths });
  }
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"], {
    cwd,
  })
    .stdout.split("\0")
    .filter(Boolean)
    .map((path) => ({ status: "?", paths: [path] }));
  changes.push(...untracked);
  const errors = [];
  for (const line of git(["diff", "--summary", base, "--"], { cwd })
    .stdout.split("\n")
    .filter((entry) => entry.includes("mode change")))
    errors.push(`release may not change file modes: ${line.trim()}`);
  const baseContent = baseTexts(
    base,
    changes
      .flatMap((change) => change.paths)
      .filter(
        (path) =>
          HEADER_PATH.test(path) ||
          PACKAGE_PATH.test(path) ||
          LOCKFILE_PATH.test(path) ||
          path === "AGENTS.md",
      ),
    cwd,
  );
  for (const { status, paths } of changes) {
    for (const path of paths) {
      if (path.startsWith(".changeset/") && path.endsWith(".md")) {
        if (path === ".changeset/README.md")
          errors.push(
            ".changeset/README.md: release must preserve the Changesets authority readme",
          );
        else if (status !== "D")
          errors.push(`${path}: release may only delete consumed changesets`);
        continue;
      }
      const allowed =
        HEADER_PATH.test(path) ||
        PACKAGE_PATH.test(path) ||
        LOCKFILE_PATH.test(path) ||
        path === "AGENTS.md" ||
        GENERATED_PATH.test(path) ||
        CHANGELOG_PATH.test(path);
      if (!allowed) {
        errors.push(`${path}: not an allowed generated release output`);
        continue;
      }
      if (status !== "M") {
        errors.push(
          `${path}: allowed release output must be modified in place, not ${status}`,
        );
        continue;
      }
      if (HEADER_PATH.test(path)) {
        const before = baseContent.get(path) ?? null;
        const after = existsSync(resolve(cwd, path))
          ? readFileSync(resolve(cwd, path), "utf8")
          : null;
        if (
          before === null ||
          after === null ||
          stripHeader(before) !== stripHeader(after)
        )
          errors.push(
            `${path}: release changed content beyond the provenance header`,
          );
        continue;
      }
      if (PACKAGE_PATH.test(path)) {
        const before = baseContent.get(path) ?? null;
        const after = readFileSync(resolve(cwd, path), "utf8");
        const beforePackage = before === null ? null : JSON.parse(before);
        const afterPackage = JSON.parse(after);
        if (
          beforePackage === null ||
          !versionIncreased(beforePackage.version, afterPackage.version)
        )
          errors.push(`${path}: release version must increase by semver`);
        if (
          before === null ||
          normalizedPackage(before) !== normalizedPackage(after)
        )
          errors.push(
            `${path}: release changed package metadata beyond versions/internal ranges`,
          );
        continue;
      }
      if (LOCKFILE_PATH.test(path)) {
        const before = baseContent.get(path) ?? null;
        const after = readFileSync(resolve(cwd, path), "utf8");
        if (
          before === null ||
          normalizedLockfile(before) !== normalizedLockfile(after)
        )
          errors.push(
            `${path}: release changed the lockfile beyond the internal @vegastack/* ranges`,
          );
        continue;
      }
      if (path === "AGENTS.md") {
        const before = baseContent.get(path) ?? null;
        const after = readFileSync(resolve(cwd, path), "utf8");
        if (before === null || outsideNumbers(before) !== outsideNumbers(after))
          errors.push(
            "AGENTS.md: release changed content outside the generated Numbers block",
          );
        continue;
      }
      if (GENERATED_PATH.test(path) || CHANGELOG_PATH.test(path)) continue;
    }
  }
  if (changes.length === 0)
    errors.push("version-packages produced no release output");
  return errors.sort();
}

const isMain =
  resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isMain) {
  const index = process.argv.indexOf("--base");
  const base = index === -1 ? null : process.argv[index + 1];
  const unknown = process.argv.slice(2).filter((value, offset, all) => {
    if (value === "--base") return false;
    if (offset > 0 && all[offset - 1] === "--base") return false;
    return true;
  });
  if (unknown.length > 0) {
    console.error(
      `verify-release-output-scope: unknown argument(s): ${unknown.join(", ")}`,
    );
    process.exit(2);
  }
  try {
    const errors = validateReleaseOutput({ base });
    if (errors.length > 0) {
      for (const error of errors) console.error(`✗ ${error}`);
      process.exit(1);
    }
    console.log(
      "verify-release-output-scope: generated release delta is bounded",
    );
  } catch (error) {
    console.error(`verify-release-output-scope: ${error.message}`);
    process.exit(2);
  }
}
