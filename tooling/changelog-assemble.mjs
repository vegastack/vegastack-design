#!/usr/bin/env node
// changelog-assemble — the root CHANGELOG.md release entry is ASSEMBLED from the pending
// changesets, once per version, instead of being hand-edited once per PR.
//
//   node tooling/changelog-assemble.mjs             # write the entry into /CHANGELOG.md
//   node tooling/changelog-assemble.mjs --dry-run   # print the entry, touch nothing
//   node tooling/changelog-assemble.mjs --check     # exit 1 if any pending changeset cannot be assembled
//
// WHY (docs/plans/2026-09-08-verification-rebuild.md, R5): every PR used to hand-write its own
// bullet into /CHANGELOG.md. That file is one list, at the top, touched by every branch — the
// merge-conflict engine of the audit train. A changeset is per-file and never conflicts, so the
// per-PR artefact is now the changeset alone and the entry is built at version time.
//
// THE SECTION-MARKER CONVENTION (enforced by tooling/changeset-lint.mjs on new changesets):
// the first non-empty line of a changeset body starts with ONE of the eight vocabulary emoji,
// followed by the entry text. The emoji selects the CHANGELOG section; it is stripped from the
// assembled bullet. Exactly one marker per changeset — a change that belongs in two sections is
// two changesets.
//
//   ---
//   "@vegastack/ui": minor
//   ---
//
//   🔧 **Button** — `variant` × `tone` replaces fifteen hand-maintained variants.
//
// An EMPTY changeset (`---\n---`) with body text is allowed and IS assembled: it is the "no
// release, but the humans need to know" note (a tooling or CI change). It still needs a marker.
//
// ORDER OF OPERATIONS. `changeset version` DELETES the changesets it consumes, so assembly must
// run BEFORE it and read the pending files. The next versions therefore cannot be read from
// package.json yet; they come from `changeset status --output`, which is changesets' own release
// plan (linked groups, ignore list, internal-dependency policy) rather than a reimplementation of
// its semver arithmetic here. Hence `pnpm version-packages`:
//
//   changelog-assemble → changeset version → version-sync → sync-changelog
//
// IDEMPOTENT: an entry whose `## [x.y.z]` heading already exists is not written twice.
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGESET_DIR = join(ROOT, ".changeset");
const CHANGELOG = join(ROOT, "CHANGELOG.md");

// The fixed vocabulary, in the order sections appear in an entry. Keys are the marker emoji with
// any variation selector (U+FE0F) stripped, so `🛠` and `🛠️` are the same marker.
export const SECTIONS = [
  ["🧩", "🧩 New components"],
  ["🔧", "🔧 Changed components"],
  ["🗑", "🗑 Removed / renamed"],
  ["🛠", "🛠 CLI & tooling"],
  ["📦", "📦 npm"],
  ["📚", "📚 Docs"],
  ["🐛", "🐛 Fixed"],
  ["⚠", "⚠️ Breaking"],
];
const SECTION_BY_MARKER = new Map(SECTIONS);
const stripVariationSelectors = (text) => text.replace(/\uFE0F/g, "");

/** Split a changeset file into its frontmatter lines and its body. */
export function splitChangeset(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n"))
    return { frontmatter: null, body: normalized.trim() };
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: null, body: normalized.trim() };
  return {
    frontmatter: normalized.slice(4, end + 1),
    body: normalized.slice(normalized.indexOf("\n", end + 1) + 1).trim(),
  };
}

/**
 * Read a changeset body and resolve its section.
 *
 * Returns `{ marker, section, text }` on success and `{ problem }` on failure — one shape so
 * `--check`, changeset-lint and the assembler all report the same wording for the same defect.
 */
export function resolveSection(body) {
  const trimmed = body.trim();
  if (!trimmed) return { problem: "body is empty" };
  const lines = trimmed.split("\n");
  const markers = [];
  for (const [index, line] of lines.entries()) {
    const head = stripVariationSelectors(line.trimStart());
    for (const [marker] of SECTIONS) {
      if (head.startsWith(marker)) markers.push({ marker, index });
    }
  }
  if (markers.length === 0)
    return {
      problem: `body does not start with a section marker (one of ${SECTIONS.map(([m]) => m).join(" ")})`,
    };
  if (markers.length > 1)
    return {
      problem: `body carries ${markers.length} section markers (${markers.map((m) => m.marker).join(" ")}); exactly one is allowed — split it into one changeset per section`,
    };
  const [{ marker, index }] = markers;
  if (index !== 0)
    return {
      problem: `the section marker ${marker} must open the body, not line ${index + 1}`,
    };
  const first = stripVariationSelectors(lines[0].trimStart());
  const text = first.slice(marker.length).trim();
  if (!text) return { problem: `nothing follows the ${marker} marker` };
  return {
    marker,
    section: SECTION_BY_MARKER.get(marker),
    text: [text, ...lines.slice(1)].join("\n"),
  };
}

/** Every pending changeset, as `{ file, path, frontmatter, body }`, in stable filename order. */
export function readPendingChangesets() {
  return readdirSync(CHANGESET_DIR)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort()
    .map((name) => {
      const path = join(CHANGESET_DIR, name);
      return {
        file: name,
        path,
        ...splitChangeset(readFileSync(path, "utf8")),
      };
    });
}

/** Changesets' own release plan for the pending set — no semver arithmetic reimplemented here. */
function releasePlan() {
  const dir = mkdtempSync(join(tmpdir(), "vsk-changeset-status-"));
  const out = join(dir, "status.json");
  try {
    execFileSync("pnpm", ["exec", "changeset", "status", "--output", out], {
      cwd: ROOT,
      stdio: "pipe",
    });
    return JSON.parse(readFileSync(out, "utf8")).releases ?? [];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Short sha of the commit that last touched a changeset file, or null outside a usable history. */
function commitFor(path) {
  try {
    const sha = execFileSync("git", ["log", "-1", "--format=%h", "--", path], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return sha || null;
  } catch {
    return null;
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const friendlyDate = (date) =>
  `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

/** One assembled bullet: `- text`, continuation lines indented two spaces. */
function bullet(text) {
  const [first, ...rest] = text.split("\n");
  return [
    `- ${first}`,
    ...rest.map((line) => (line.trim() ? `  ${line}` : "")),
  ].join("\n");
}

export function assemble({ date = new Date() } = {}) {
  const changesets = readPendingChangesets();
  if (changesets.length === 0)
    return { entry: null, version: null, problems: [], changesets };

  const problems = [];
  const bySection = new Map(SECTIONS.map(([, section]) => [section, []]));

  for (const changeset of changesets) {
    const resolved = resolveSection(changeset.body);
    if (resolved.problem) {
      problems.push(`${changeset.file}: ${resolved.problem}`);
      continue;
    }
    let text = resolved.text;
    // Keep the format's "every bullet links a commit" convention without asking the author to
    // paste a sha they cannot know while writing the changeset.
    if (!/commit\/[0-9a-f]{7,40}/.test(text)) {
      const sha = commitFor(changeset.path);
      if (sha)
        text += `\n[\`${sha}\`](https://github.com/VegaStack/vegastack-design/commit/${sha})`;
    }
    bySection.get(resolved.section).push(bullet(text));
  }

  const releases = releasePlan().filter((release) => release.type !== "none");
  const ui = releases.find((release) => release.name === "@vegastack/ui");
  if (!ui)
    problems.push(
      "no @vegastack/ui release in the plan: the design-system (registry) version does not move, so this entry has no heading version. Add an @vegastack/ui changeset (patch is honest — version-sync re-stamps every item) or assemble by hand.",
    );

  if (problems.length)
    return { entry: null, version: null, problems, changesets };

  // 📦 npm is a fact of the release plan, not prose: every PUBLIC package that moves is listed,
  // and the registry version is stated. An authored 📦 bullet that already names a package wins.
  const npm = bySection.get("📦 npm");
  const authored = npm.join("\n");
  for (const release of releases) {
    if (release.name === "@vegastack/ui") continue;
    if (authored.includes(release.name)) continue;
    npm.push(
      `- **\`${release.name}\`** → **\`${release.newVersion}\`** (was \`${release.oldVersion}\`).`,
    );
  }
  npm.push(
    `- The design-system registry (\`@vegastack/ui\`) bumps ${ui.oldVersion} → ${ui.newVersion}.`,
  );

  const lines = [`## [${ui.newVersion}] — ${friendlyDate(date)}`];
  for (const [, section] of SECTIONS) {
    const bullets = bySection.get(section);
    if (bullets.length === 0) continue;
    lines.push("", `### ${section}`, "", bullets.join("\n"));
  }
  return {
    entry: `${lines.join("\n")}\n`,
    version: ui.newVersion,
    problems: [],
    changesets,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const check = argv.includes("--check");

  const { entry, version, problems, changesets } = assemble();

  if (problems.length) {
    console.error(
      `✗ changelog-assemble: ${problems.length} pending changeset(s) cannot be assembled`,
    );
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      "\n  Every changeset body must OPEN with exactly one section marker:\n" +
        SECTIONS.map(([marker, section]) => `    ${marker}  → ${section}`).join(
          "\n",
        ),
    );
    process.exit(1);
  }

  if (check) {
    console.log(
      `✓ changelog-assemble --check: ${changesets.length} pending changeset(s), all assemblable`,
    );
    return;
  }

  if (!entry) {
    console.log(
      "✓ changelog-assemble: no pending changesets — nothing to assemble",
    );
    return;
  }

  if (dryRun) {
    process.stdout.write(entry);
    return;
  }

  const current = readFileSync(CHANGELOG, "utf8");
  if (current.includes(`\n## [${version}] `)) {
    console.log(
      `✓ changelog-assemble: /CHANGELOG.md already carries a [${version}] entry — not written twice`,
    );
    return;
  }
  const first = current.indexOf("\n## [");
  if (first === -1) {
    console.error(
      '✗ changelog-assemble: no "## [x.y.z]" entry found in CHANGELOG.md — cannot place the new entry',
    );
    process.exit(1);
  }
  writeFileSync(
    CHANGELOG,
    `${current.slice(0, first + 1)}${entry}\n${current.slice(first + 1)}`,
  );
  execFileSync("pnpm", ["exec", "prettier", "--write", basename(CHANGELOG)], {
    cwd: ROOT,
    stdio: "pipe",
  });
  console.log(
    `✓ changelog-assemble: wrote the [${version}] entry from ${changesets.length} changeset(s)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
