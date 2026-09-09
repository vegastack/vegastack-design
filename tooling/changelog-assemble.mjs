#!/usr/bin/env node
// changelog-assemble — the root CHANGELOG.md release entry is ASSEMBLED from the pending
// changesets, once per version, instead of being hand-edited once per PR.
//
//   node tooling/changelog-assemble.mjs             # write the entry into /CHANGELOG.md
//   node tooling/changelog-assemble.mjs --dry-run   # print the entry, touch nothing
//   node tooling/changelog-assemble.mjs --check     # exit 1 if the pending set cannot be assembled
//
// WHY (docs/plans/2026-09-08-verification-rebuild.md, R5): every PR used to hand-write its own
// bullet into /CHANGELOG.md. That file is one list, at the top, touched by every branch — the
// merge-conflict engine of the audit train. A changeset is per-file and never conflicts, so the
// per-PR artefact is now the changeset alone and the entry is built at version time.
//
// THE SECTION-MARKER CONVENTION (enforced by tooling/changeset-lint.mjs on every changeset):
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
// IDEMPOTENCY IS MARKER-KEYED, NOT VERSION-KEYED. A written entry carries
// `<!-- assembled from N changesets: <fingerprint> -->` under its heading, and a second run over
// the same pending set is a no-op. A `## [x.y.z]` heading that carries NO such marker is a
// HAND-WRITTEN entry for the version about to be released: the assembler refuses, loudly, rather
// than silently exiting 0 and letting `changeset version` delete every pending changeset whose
// prose was never placed. This script never merges into a hand-written entry.
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

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

/** The provenance line an assembled entry carries under its heading. */
export const ASSEMBLED_MARKER_RE =
  /^<!-- assembled from (\d+) changesets?: ([0-9a-f]{12}) -->$/;
const assembledMarker = (count, fingerprint) =>
  `<!-- assembled from ${count} changeset${count === 1 ? "" : "s"}: ${fingerprint} -->`;

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

/** A stable digest of the pending set — what an assembled entry was built from. */
export function fingerprint(changesets) {
  const hash = createHash("sha256");
  for (const changeset of changesets)
    hash.update(`${changeset.file}\n${changeset.body}\n\0`);
  return hash.digest("hex").slice(0, 12);
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
  } catch (error) {
    // `changeset status` reports real authoring mistakes (a changeset naming a package that is not
    // in the workspace, a malformed bump type). Its diagnosis is on stdout/stderr as Buffers, which
    // an unhandled throw prints as `<Buffer 20 4d 69 …>` — useless. Re-emit it as text.
    const text = (stream) =>
      stream ? Buffer.from(stream).toString().trim() : "";
    const detail = [text(error.stdout), text(error.stderr)]
      .filter(Boolean)
      .join("\n");
    console.error(
      "✗ changelog-assemble: `changeset status` failed — the pending changesets do not form a release plan.",
    );
    if (detail)
      for (const line of detail.split("\n")) console.error(`  | ${line}`);
    else console.error(`  | ${error.message}`);
    console.error(
      "\n  Read the diagnosis above: usually a changeset names a package that is not in this\n" +
        "  workspace, a bump type changesets does not recognise, or the config's baseBranch is\n" +
        "  missing from this clone. This script reimplements none of that — fix the input.",
    );
    process.exit(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * A public package's version as its own package.json states it, BEFORE the bump.
 *
 * The release plan's `oldVersion` is the LINKED GROUP's version, not the package's: with
 * `linked: [["@vegastack/design-tokens", "@vegastack/design"]]`, changesets reports 0.3.2 for
 * design-tokens while its package.json says 0.2.0. "(was 0.3.2)" would be a version that package
 * never had on npm.
 */
function workspaceVersion(name) {
  for (const dir of ["packages", "apps"]) {
    const parent = join(ROOT, dir);
    if (!existsSync(parent)) continue;
    for (const entry of readdirSync(parent)) {
      const manifest = join(parent, entry, "package.json");
      if (!existsSync(manifest)) continue;
      const json = JSON.parse(readFileSync(manifest, "utf8"));
      if (json.name === name) return json.version ?? null;
    }
  }
  return null;
}

/** Short sha of the commit that last touched a changeset file, or null outside a usable history. */
function commitFor(path) {
  try {
    // `--abbrev=7` matches the 7-character shas every existing entry links.
    const sha = execFileSync(
      "git",
      ["log", "-1", "--abbrev=7", "--format=%h", "--", path],
      { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] },
    )
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

/**
 * One assembled bullet: `- text`, every continuation line indented two spaces.
 *
 * The indent is not cosmetic. An unindented continuation line is a LAZY continuation: markdown
 * still reads it as part of the bullet, but prettier rewrites it to the indented form, so an
 * assembled file would fail `prettier --check` the moment it was written.
 */
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
      if (sha) {
        // The format's trailer is `[docs](…) · [`sha`](…)`. When the body already ends in a link
        // line, join with the same middle dot rather than stacking two bare links.
        const lines = text.split("\n");
        const last = lines.length - 1;
        if (/\]\([^)]+\)\s*$/.test(lines[last])) lines[last] += " ·";
        text = [
          ...lines,
          `[\`${sha}\`](https://github.com/VegaStack/vegastack-design/commit/${sha})`,
        ].join("\n");
      }
    }
    bySection.get(resolved.section).push(bullet(text));
  }

  if (problems.length)
    return { entry: null, version: null, problems, changesets };

  const releases = releasePlan().filter((release) => release.type !== "none");
  const ui = releases.find((release) => release.name === "@vegastack/ui");
  if (!ui) {
    problems.push(
      "no @vegastack/ui release in the plan: the design-system (registry) version does not move, so this entry has no heading version. Add an @vegastack/ui changeset (patch is honest — version-sync re-stamps every item) or assemble by hand.",
    );
    return { entry: null, version: null, problems, changesets };
  }

  // 📦 npm is a fact of the release plan, not prose: every PUBLIC package that moves is listed,
  // and the registry version is stated. An authored 📦 bullet that already names a package wins.
  const npm = bySection.get("📦 npm");
  const authored = npm.join("\n");
  for (const release of releases) {
    if (release.name === "@vegastack/ui") continue;
    if (authored.includes(release.name)) continue;
    const was = workspaceVersion(release.name) ?? release.oldVersion;
    npm.push(
      `- **\`${release.name}\`** → **\`${release.newVersion}\`** (was \`${was}\`).`,
    );
  }
  npm.push(
    `- The design-system registry (\`@vegastack/ui\`) bumps ${workspaceVersion("@vegastack/ui") ?? ui.oldVersion} → ${ui.newVersion}.`,
  );

  const lines = [
    `## [${ui.newVersion}] — ${friendlyDate(date)}`,
    "",
    assembledMarker(changesets.length, fingerprint(changesets)),
  ];
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

/**
 * What the CHANGELOG already says about `version`.
 *
 * `absent` — no heading; write it.
 * `assembled` — the heading carries this pending set's marker; a second run is a no-op.
 * `stale` — the heading carries SOME assembled marker, but not this pending set's.
 * `handwritten` — the heading exists and carries no marker at all. Always an error.
 */
export function inspectChangelog(source, version, expectedFingerprint) {
  const lines = source.split("\n");
  const index = lines.findIndex((line) => line.startsWith(`## [${version}] `));
  if (index === -1) return { state: "absent" };
  const marker = lines
    .slice(index + 1, index + 4)
    .map((line) => ASSEMBLED_MARKER_RE.exec(line.trim()))
    .find(Boolean);
  if (!marker) return { state: "handwritten" };
  if (marker[2] !== expectedFingerprint)
    return { state: "stale", fingerprint: marker[2], count: Number(marker[1]) };
  return { state: "assembled", fingerprint: marker[2] };
}

const HANDWRITTEN_HELP = (version) =>
  `✗ changelog-assemble: /CHANGELOG.md already carries a HAND-WRITTEN [${version}] entry, and there are
  pending changesets.

  The assembler owns the entry for a version and never merges into a hand-written one, so
  continuing would either duplicate the section or silently drop every pending changeset's prose
  when \`changeset version\` deletes them.

  Fix it once, in the CHANGELOG:
    1. For each bullet under "## [${version}]" that a pending changeset already says: delete it.
    2. For each bullet the changesets do NOT say: move the prose into the matching changeset body
       (or add a new changeset — an empty one, \`---\\n---\`, if it publishes nothing) with the
       right section marker.
    3. Delete the "## [${version}]" heading itself. Then re-run.

  An assembled entry is recognised by the "<!-- assembled from N changesets: … -->" line under its
  heading; a hand-written one has none.`;

const STALE_HELP = (version, found) =>
  `✗ changelog-assemble: the [${version}] entry in /CHANGELOG.md was assembled from a DIFFERENT
  pending set (marker ${found}) than the one on disk now.

  A changeset was added, edited or removed after the entry was written, and this script never
  merges into an existing entry. Delete the "## [${version}]" entry and re-run to rebuild it.`;

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
    // A release-plan problem is not a vocabulary problem; printing the marker table under one
    // sends the reader to fix a file that is already correct.
    if (problems.some((problem) => /^[^:]+\.md: /.test(problem)))
      console.error(
        "\n  Every changeset body must OPEN with exactly one section marker:\n" +
          SECTIONS.map(
            ([marker, section]) => `    ${marker}  → ${section}`,
          ).join("\n"),
      );
    process.exit(1);
  }

  if (!entry) {
    console.log(
      "✓ changelog-assemble: no pending changesets — nothing to assemble",
    );
    return;
  }

  // The state of the CHANGELOG is part of "can this be assembled", so --check and --dry-run
  // report exactly what a write would do rather than a rosier subset of it.
  const current = readFileSync(CHANGELOG, "utf8");
  const state = inspectChangelog(current, version, fingerprint(changesets));
  if (state.state === "handwritten") {
    console.error(HANDWRITTEN_HELP(version));
    process.exit(1);
  }
  if (state.state === "stale") {
    console.error(STALE_HELP(version, state.fingerprint));
    process.exit(1);
  }

  if (check) {
    console.log(
      `✓ changelog-assemble --check: ${changesets.length} pending changeset(s), all assemblable into [${version}]` +
        (state.state === "assembled"
          ? " (already assembled — a run would be a no-op)"
          : ""),
    );
    return;
  }

  if (dryRun) {
    process.stdout.write(entry);
    return;
  }

  if (state.state === "assembled") {
    console.log(
      `✓ changelog-assemble: [${version}] was already assembled from these ${changesets.length} changeset(s) — no-op`,
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
  // SAY THAT THE FILE IS NOW DIRTY, because the next command in `pnpm version-packages` is
  // `changeset version` — and when THAT fails, changesets prints "no files should have been
  // affected", which is false for this one. The ordering cannot be swapped (assembly must read the
  // changesets that `changeset version` deletes), so the message is what gets to be honest: a run
  // that dies after this point leaves /CHANGELOG.md modified, and re-running is safe because
  // idempotency here is keyed on the assembled-from marker, not on the version.
  console.log(
    `✓ changelog-assemble: wrote the [${version}] entry from ${changesets.length} changeset(s).\n` +
      `  /CHANGELOG.md IS NOW MODIFIED, before \`changeset version\` has run. If the next step ` +
      `fails, changesets will say "no files should have been affected" — that is true of every ` +
      `file except this one. Re-running \`pnpm version-packages\` is safe: the entry carries an ` +
      `assembled-from marker and a second pass over the same changesets is a no-op.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
