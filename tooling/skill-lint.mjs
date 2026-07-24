#!/usr/bin/env node
// skill-lint — fail-closed validation of repo skills against the Agent Skills standard
// (shared by Claude Code and Codex).
//
// Skills are grouped by AUDIENCE:
//   skills/internal/<name>/SKILL.md   maintainers of this repo. Never published.
//   skills/public/<name>/SKILL.md     shipped inside @vegastack/design to consumers.
//
// Discovery is verified against both vendors' primary docs:
//   Claude Code reads .claude/skills/<name>/SKILL.md and follows symlinked skill directories.
//   Codex reads .agents/skills (repo root, CWD, and $HOME) — explicitly NOT .claude/skills —
//   and likewise follows symlink targets. So one canonical skill + two symlinks serves both.
//
// Checks (frontmatter rules track the Agent Skills spec at agentskills.io/specification):
//   • frontmatter carries only spec-defined keys; name + description are required
//   • name === directory name (the spec requires it, and it is what both agents invoke),
//     1-64 chars, lowercase alphanumeric + single hyphens, no leading/trailing/double hyphen
//   • description long enough to trigger reliably, and within the spec's 1024-char cap
//   • public dirs are `vegastack-`-prefixed (no collision in a consumer's skills dir);
//     internal dirs are not (they stay short to type)
//   • public skill bodies reference NO repo-internal path — a consumer has no packages/,
//     tooling/, apps/ or docs/ directory, so such a reference is a bug by construction
//   • every relative link resolves to a real file inside the skill
//   • SKILL.md stays under the spec's recommended 500-line ceiling
//   • cross-tool discovery: .agents/skills/<name> AND .claude/skills/<name> exist as symlinks
//     resolving to the canonical skill, for EVERY skill — and neither surface carries a stale
//     or extra entry (a deleted skill leaving a dangling link is otherwise invisible)
//   • the review skill's rule reference and tooling/design-lint.mjs agree on the rule id set,
//     in both directions — the reference calls itself a mirror, so prove it
//
// Fails closed on an empty inventory: finding zero skills means the layout moved, not that
// everything is valid. (A flat readdirSync was the source of truth before the audience split;
// afterwards it found only `internal`/`public`, neither of which has a SKILL.md, so every
// per-skill check silently passed over ZERO skills while still reporting success.)
import {
  readFileSync,
  readdirSync,
  existsSync,
  lstatSync,
  realpathSync,
} from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(ROOT, "skills");
const GROUPS = ["internal", "public"];
const SURFACES = [".agents/skills", ".claude/skills"];
// The full Agent Skills frontmatter vocabulary. Anything outside it is a typo or an invented
// field: a client that does not recognise it silently ignores it, so it would never fail loudly
// on its own. We keep name + description required and leave the rest optional, rather than
// banning spec-legal keys we might legitimately need later (`allowed-tools` on a release skill,
// `compatibility` on one with tool prerequisites).
const ALLOWED_FRONTMATTER = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);
const MAX_SKILL_LINES = 500; // spec recommendation — past this, split into references/

// A public skill runs inside a consumer's repo, which has none of these directories.
// Anchored so npm specifiers (@vegastack/design-tokens/theme.css) and URLs
// (https://design.vegastack.com/docs/...) do not false-positive.
const REPO_INTERNAL_PATTERNS = [
  [/(?<![\w./@-])packages\//, "packages/"],
  [/(?<![\w./@-])tooling\//, "tooling/"],
  [/(?<![\w./@-])apps\//, "apps/"],
  [
    /(?<![\w./@-])docs\/(plans|ledger|requirements|gap-analysis|audits|research)/,
    "docs/<internal>",
  ],
  [/(?<![\w./@-])\.changeset/, ".changeset"],
  [/registry:build|design:derived|design:verify/, "a repo-only pnpm script"],
  [/component-contracts\.json/, "component-contracts.json"],
];

const problems = [];

/** name -> { dir, group } for every skills/<group>/<name>/SKILL.md */
function discoverSkills() {
  const found = new Map();
  for (const group of GROUPS) {
    const groupDir = join(SKILLS, group);
    if (!existsSync(groupDir)) {
      problems.push(
        `skills/${group}/ is missing — the audience split is part of the layout`,
      );
      continue;
    }
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(groupDir, entry.name);
      if (!existsSync(join(dir, "SKILL.md"))) {
        problems.push(
          `skills/${group}/${entry.name}/: directory has no SKILL.md`,
        );
        continue;
      }
      if (found.has(entry.name)) {
        problems.push(
          `${entry.name}: defined in more than one group — names must be unique across skills/`,
        );
        continue;
      }
      found.set(entry.name, { dir, group });
    }
  }
  return found;
}

/** Every markdown file that ships with a skill, so references/ is checked too. */
function skillFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    out.push(join(entry.parentPath ?? entry.path, entry.name));
  }
  return out;
}

const skills = discoverSkills();
if (skills.size === 0) {
  problems.push(
    "no SKILL.md found under skills/ — the layout changed and this gate is blind",
  );
}

for (const [name, { dir, group }] of skills) {
  const id = `skills/${group}/${name}`;
  const src = readFileSync(join(dir, "SKILL.md"), "utf8");

  // ── frontmatter ────────────────────────────────────────────────────────────
  const fm = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!fm) {
    problems.push(`${id}: SKILL.md missing YAML frontmatter`);
    continue;
  }
  const fields = new Map();
  for (const line of fm[1].split("\n")) {
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (m) fields.set(m[1], m[2].trim());
  }
  for (const key of fields.keys()) {
    if (!ALLOWED_FRONTMATTER.has(key)) {
      problems.push(
        `${id}: frontmatter key "${key}" is not in the Agent Skills vocabulary (${[...ALLOWED_FRONTMATTER].join(", ")}) — agents ignore unknown keys silently`,
      );
    }
  }

  const declared = fields.get("name");
  const desc = fields.get("description");
  if (!declared) problems.push(`${id}: frontmatter missing "name"`);
  else if (declared !== name) {
    problems.push(
      `${id}: frontmatter name "${declared}" !== directory "${name}" — the spec requires they match, and the directory name is what both agents invoke`,
    );
  } else if (declared.length > 64) {
    problems.push(
      `${id}: name is ${declared.length} chars — the spec caps it at 64`,
    );
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(declared)) {
    problems.push(
      `${id}: name "${declared}" must be lowercase alphanumeric separated by single hyphens, with no leading, trailing, or consecutive hyphen`,
    );
  }

  if (!desc) problems.push(`${id}: frontmatter missing "description"`);
  else if (desc.length < 40)
    problems.push(
      `${id}: description too short (${desc.length}) to trigger reliably`,
    );
  else if (desc.length > 1024) {
    problems.push(
      `${id}: description ${desc.length} chars — the spec caps it at 1024`,
    );
  }

  const lineCount = src.split("\n").length;
  if (lineCount > MAX_SKILL_LINES) {
    problems.push(
      `${id}: SKILL.md is ${lineCount} lines — keep it under ${MAX_SKILL_LINES} and move detail into references/`,
    );
  }

  // ── naming by audience ─────────────────────────────────────────────────────
  const prefixed = name.startsWith("vegastack-");
  if (group === "public" && !prefixed) {
    problems.push(
      `${id}: public skills must be "vegastack-"-prefixed (it installs into a consumer's skills dir)`,
    );
  }
  if (group === "internal" && prefixed) {
    problems.push(
      `${id}: internal skills must NOT be "vegastack-"-prefixed (they stay short to type)`,
    );
  }

  // ── body rules, across SKILL.md and every references/*.md ──────────────────
  for (const file of skillFiles(dir)) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");

    if (group === "public") {
      for (const [re, label] of REPO_INTERNAL_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            problems.push(
              `${rel}:${i + 1}: public skill references repo-internal "${label}" — consumers have no such path`,
            );
            break; // one report per pattern per file is enough to act on
          }
        }
      }
    }

    for (const m of text.matchAll(
      /\]\((?!https?:|#|mailto:)([^)#]+)(?:#[^)]*)?\)/g,
    )) {
      const target = m[1].trim();
      if (target.startsWith("/")) {
        problems.push(
          `${rel}: absolute link "${target}" — use a path relative to the skill`,
        );
        continue;
      }
      const resolved = join(dirname(file), target);
      if (!existsSync(resolved)) {
        problems.push(`${rel}: broken relative link ${target}`);
      } else if (
        group === "public" &&
        !realpathSync(resolved).startsWith(realpathSync(dir) + sep)
      ) {
        problems.push(
          `${rel}: link "${target}" escapes the skill — it will not exist once installed`,
        );
      }
    }
  }
}

// ── cross-tool discovery symlinks ────────────────────────────────────────────
for (const surface of SURFACES) {
  const surfaceDir = join(ROOT, surface);
  if (!existsSync(surfaceDir)) {
    problems.push(
      `${surface}/ is missing — neither agent can discover any skill`,
    );
    continue;
  }

  for (const [name, { dir }] of skills) {
    const link = join(surfaceDir, name);
    try {
      if (!lstatSync(link).isSymbolicLink()) {
        problems.push(
          `${surface}/${name}: exists but is not a symlink (must point at ${relative(ROOT, dir)})`,
        );
      } else if (realpathSync(link) !== realpathSync(dir)) {
        problems.push(
          `${surface}/${name}: symlink resolves to ${relative(ROOT, realpathSync(link))}, expected ${relative(ROOT, dir)}`,
        );
      }
    } catch {
      problems.push(`${surface}/${name}: missing (agent discovery symlink)`);
    }
  }

  // Stale entries: a removed or renamed skill leaves a dangling link that nothing else notices.
  for (const entry of readdirSync(surfaceDir)) {
    if (skills.has(entry)) continue;
    problems.push(
      `${surface}/${entry}: stale entry — no matching skill under skills/`,
    );
  }
}

// ── the audit rule reference must mirror the linter exactly ──────────────────
const LINT = join(ROOT, "tooling/design-lint.mjs");
const RULE_DOC = join(SKILLS, "internal/review/references/lint-rules.md");
if (existsSync(LINT) && existsSync(RULE_DOC)) {
  const lintSrc = readFileSync(LINT, "utf8");
  const actual = new Set();
  // RULES array entries…
  for (const m of lintSrc.matchAll(/\bid:\s*["']([a-z][a-z0-9-]*)["']/g))
    actual.add(m[1]);
  // …and the dedicated passes, which report `${file}:N [rule-id] message`.
  for (const m of lintSrc.matchAll(
    /\$\{file\}[^`]*?\[([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\]/g,
  ))
    actual.add(m[1]);

  const documented = new Set();
  for (const m of readFileSync(RULE_DOC, "utf8").matchAll(
    /\*\*`([a-z][a-z0-9-]*)`\*\*/g,
  ))
    documented.add(m[1]);

  for (const rule of actual) {
    if (!documented.has(rule)) {
      problems.push(
        `skills/internal/review/references/lint-rules.md: rule "${rule}" is enforced but undocumented`,
      );
    }
  }
  for (const rule of documented) {
    if (!actual.has(rule)) {
      problems.push(
        `skills/internal/review/references/lint-rules.md: documents "${rule}", which design-lint.mjs does not enforce`,
      );
    }
  }
} else {
  problems.push(
    "skill-lint: design-lint.mjs or the audit rule reference is missing — the parity gate is blind",
  );
}

// ── report ───────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`✗ skill-lint: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const internal = [...skills.values()].filter(
  (s) => s.group === "internal",
).length;
console.log(
  `✓ skill-lint: ${skills.size} skills (${internal} internal, ${skills.size - internal} public) — ` +
    "frontmatter, links, audience boundary, discovery symlinks, and design-lint rule parity all valid",
);
