#!/usr/bin/env node
// Content lint for skills + docs prose: rejects stale shadcn CLI snippets in
// consumer-facing commands. VegaStack consumes current shadcn Base UI support via
// `pnpm dlx shadcn@latest`; old pinned `shadcn@4.7.0` snippets silently drift back
// toward the pre-Base workflow.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

import { fatal, ROOT, walk as walkTree } from "./lib/fs.mjs";

const STALE_SHADCN_RE = /\b(?:npx\s+)?shadcn@4\.7\.0\b/g;

// Only the CONSUMER-FACING surfaces — the agent skills and the published docs content (commands a
// consumer actually runs). Internal planning/ledger/research notes under docs/ are out of scope.
const SCAN_DIRS = [join(ROOT, "skills"), join(ROOT, "apps/docs/content")];
const PUBLIC_DOCS_DIR = join(ROOT, "apps/docs/content/docs");
const INTERNAL_DOCS_DIR = join(ROOT, "apps/docs/content/internal");
const DOCS_GLOBAL_CSS = join(ROOT, "apps/docs/app/global.css");
const COMPONENT_PAGES_DIR = join(ROOT, "apps/docs/content/docs/components");
const CONTRACTS = join(ROOT, "packages/ui/component-contracts.json");

// Deferred-visual-coverage rot (Codex R14). The geometry contracts in
// `packages/ui/test/geometry.browser.test.tsx` are the blocking visual-surface gate and derive their
// fixtures from the preview barrel, so a skipped visual `describe` — in a test, or in an authoring
// skill that teaches the workflow — leaves a component with NO active behaviour coverage while
// reading as covered. Reject it, scoped to the browser tests plus the skill markdown.
const VISUAL_SCAN_DIRS = [join(ROOT, "packages/ui/test"), join(ROOT, "skills")];
const VISUAL_EXT = /\.(md|mdx|ts|tsx|mts|cts|js|mjs|cjs|jsx)$/;
// A SKIPPED visual describe — `describe.skip(`, `test.describe.skip(`, `it.skip(` style calls.
const SKIPPED_DESCRIBE_RE = /\b(?:test\.|it\.)?describe\.skip\s*\(/g;
// Committed screenshots were removed on 2026-07-25: captures are local, before/after, and never
// stored. Guidance that still tells an author to commit or regenerate a baseline sends them to a
// workflow that no longer exists — and `tooling/verify-workflow-security.mjs` will reject it.
// `--update-snapshots` is deliberately NOT matched: no lane in this repository writes a persistent
// baseline any more, so there is nothing for it to silently overwrite.
const COMMITTED_BASELINE_RE =
  /commit\s+(?:the\s+)?(?:VRT\s+)?baselines?|update_baselines|verify:vrt-baselines/g;

/**
 * FAILS CLOSED on an unreadable root. The previous walker returned `[]` when `readdirSync` threw,
 * so a moved `skills/` or `apps/docs/content` tree read as clean — the exact fail-open
 * design-lint.mjs had already fixed for its own roots (audit TG-07). Exit 2 is "could not run",
 * which is the truthful answer when the thing to lint is not there.
 */
function walk(dir, ext = /\.(md|mdx)$/) {
  try {
    return walkTree(dir, { include: (relative) => ext.test(relative) });
  } catch (error) {
    return fatal(
      "content-lint",
      `cannot read root '${dir.replace(ROOT + "/", "")}': ${error.message} — an unreadable root is not a clean one`,
    );
  }
}

// ---------------------------------------------------------------------------------------------
// The page canon (`design.md` § Docs canon), enforced. Do1-b migrated every component page to
// this shape; without a gate the shape rots back one page at a time, which is exactly how the
// three reference pages ended up being the only conforming ones for a whole release.
//
// What is NOT here: the DD-3 Explorer policy ("never both a curated playground and the Story
// explorer, and an Explorer always wrapped"). `tooling/verify-docs-export.mjs` owns it, with its
// own self-test; duplicating it would give two rules that can disagree.

/** Canon section order (rows 1–10). Row 0 is frontmatter. */
export const CANON_SECTIONS = [
  "Install",
  "Usage",
  "Scope",
  "Anatomy",
  "Examples",
  "Playground",
  "API Reference",
  "Accessibility",
  "Do / Don't",
  "Changelog",
];

/** Row -> the generated component that owns its machine-readable half. */
const GENERATED_SECTIONS = {
  Install: "InstallSteps",
  Anatomy: "Anatomy",
  Accessibility: "StatesTested",
  Changelog: "ComponentChangelog",
};
/** Sections every component page must carry. Scope/Anatomy/Playground are conditional. */
const REQUIRED_SECTIONS = [
  "Install",
  "Usage",
  "Examples",
  "API Reference",
  "Accessibility",
  "Do / Don't",
  "Changelog",
];

function frontmatterOf(source) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  return match ? match[1] : undefined;
}

/** Top-level `##` headings, in order, ignoring fenced code. */
function sectionsOf(body) {
  const found = [];
  let fenced = false;
  for (const [index, line] of body.split("\n").entries()) {
    if (/^(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const heading = /^## (.+?)\s*$/.exec(line);
    if (heading) found.push({ title: heading[1], line: index + 1 });
  }
  return found;
}

/** The body of one `##` section, by title. */
function sectionBody(source, title) {
  const pattern = new RegExp(
    `^## ${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$([\\s\\S]*?)(?=^## |\\s*$(?![\\s\\S]))`,
    "m",
  );
  return pattern.exec(source)?.[1] ?? "";
}

/**
 * Every canon violation on ONE component page. Pure: the caller supplies the page source and the
 * number of exported component parts the contract records, so the self-test can drive it with
 * fixtures instead of files.
 */
export function canonProblems(relative, source, componentParts) {
  const problems = [];
  const name = basename(relative, ".mdx");
  const say = (rule, message) =>
    problems.push(`${relative} [${rule}] ${message}`);

  // Row 0 — frontmatter. `registry` is REQUIRED and names the item: inferring it from the slug
  // (which `app/docs/[[...slug]]/page.tsx` used to do) lets a wrong or missing value pass silently.
  const frontmatter = frontmatterOf(source) ?? "";
  const field = (key) =>
    new RegExp(`^${key}:\\s*(.+)$`, "m")
      .exec(frontmatter)?.[1]
      .trim()
      .replace(/^["']|["']$/g, "");
  const registry = field("registry");
  if (!registry) {
    say(
      "docs-canon-frontmatter",
      "canon row 0: a component page must declare `registry:` — the `shadcn add @vegastack/<name>` target is never inferred from the slug.",
    );
  } else if (registry !== name) {
    say(
      "docs-canon-frontmatter",
      `canon row 0: registry "${registry}" does not match the page slug "${name}".`,
    );
  }
  for (const key of ["status", "since", "a11y"]) {
    if (!field(key))
      say(
        "docs-canon-frontmatter",
        `canon row 0: missing \`${key}:\` frontmatter.`,
      );
  }

  // Rows 1–10 — the sections, their vocabulary, and their order.
  const found = sectionsOf(source);
  const titles = found.map((section) => section.title);
  for (const section of found) {
    if (!CANON_SECTIONS.includes(section.title))
      say(
        "docs-canon-sections",
        `line ${section.line}: "## ${section.title}" is not a canon section — fold it into Usage or Scope, or make it a \`###\` under Examples.`,
      );
  }
  for (const title of REQUIRED_SECTIONS) {
    if (!titles.includes(title))
      say("docs-canon-sections", `canon requires a "## ${title}" section.`);
  }
  const duplicate = titles.find(
    (title, index) => titles.indexOf(title) !== index,
  );
  if (duplicate)
    say("docs-canon-sections", `"## ${duplicate}" appears more than once.`);
  const ranks = titles
    .filter((title) => CANON_SECTIONS.includes(title))
    .map((title) => CANON_SECTIONS.indexOf(title));
  for (let index = 1; index < ranks.length; index++) {
    if (ranks[index] < ranks[index - 1]) {
      say(
        "docs-canon-order",
        `"## ${CANON_SECTIONS[ranks[index]]}" precedes "## ${CANON_SECTIONS[ranks[index - 1]]}" — sections appear in the canon's order.`,
      );
      break;
    }
  }

  // "Nothing follows Do / Don't except the generated Changelog."
  const tail = titles.slice(titles.indexOf("Do / Don't") + 1);
  if (titles.includes("Do / Don't"))
    for (const title of tail) {
      if (title !== "Changelog")
        say(
          "docs-canon-tail",
          `"## ${title}" follows Do / Don't — nothing does, except the generated Changelog.`,
        );
    }

  // The machine-readable half of a section is GENERATED, never typed.
  for (const [title, component] of Object.entries(GENERATED_SECTIONS)) {
    if (!titles.includes(title)) continue;
    const body = sectionBody(source, title);
    const element = new RegExp(`<${component}\\s+name="([^"]+)"\\s*/>`).exec(
      body,
    );
    if (!element) {
      say(
        "docs-canon-generated",
        `"## ${title}" must render <${component} name="${registry ?? name}" /> — the machine-readable half of a section is generated, never typed.`,
      );
    } else if (registry && element[1] !== registry) {
      say(
        "docs-canon-generated",
        `<${component} name="${element[1]}" /> does not name this page's registry item ("${registry}").`,
      );
    }
  }
  if (
    titles.includes("Install") &&
    /```[\s\S]*?shadcn[\s\S]*?add[\s\S]*?```/.test(
      sectionBody(source, "Install"),
    )
  )
    say(
      "docs-canon-generated",
      "canon row 1: the install command is generated from registry.json by <InstallSteps>, never a hand-typed `shadcn add` fence.",
    );
  if (
    titles.includes("Changelog") &&
    sectionBody(source, "Changelog")
      .replace(/<ComponentChangelog\s+name="[^"]+"\s*\/>/, "")
      .trim()
  )
    say(
      "docs-canon-generated",
      "canon row 10: the Changelog section holds the generated entries and nothing else.",
    );
  if (componentParts > 1 && !titles.includes("Anatomy"))
    say(
      "docs-canon-sections",
      `canon row 4: a compound (${componentParts} exported parts) must carry a "## Anatomy" section.`,
    );

  return problems;
}

/** Exported component parts per registry item, from the machine authority. */
function componentPartCounts() {
  const inventory = JSON.parse(readFileSync(CONTRACTS, "utf8"));
  const counts = new Map();
  for (const record of inventory.components)
    counts.set(
      record.name,
      record.publicSymbols.filter((symbol) => symbol.kind === "component")
        .length,
    );
  return counts;
}

/**
 * Every rule above, driven by a fixture that violates it. A rule never observed failing is an
 * assumption, not a gate; `apps/docs` runs this alongside `verify-docs-export --self-test`.
 */
function selfTest() {
  const good = [
    "---",
    "title: Widget",
    "registry: widget",
    "status: stable",
    "since: 0.1.0",
    "a11y: native button",
    "---",
    "",
    "## Install",
    "",
    '<InstallSteps name="widget" />',
    "",
    "## Usage",
    "",
    "text",
    "",
    "## Anatomy",
    "",
    '<Anatomy name="widget" />',
    "",
    "## Examples",
    "",
    "text",
    "",
    "## API Reference",
    "",
    "text",
    "",
    "## Accessibility",
    "",
    '<StatesTested name="widget" />',
    "",
    "## Do / Don't",
    "",
    '<DoDont do="a" dont="b" />',
    "",
    "## Changelog",
    "",
    '<ComponentChangelog name="widget" />',
    "",
  ].join("\n");

  const cases = [
    [
      "missing registry frontmatter",
      good.replace("registry: widget\n", ""),
      "docs-canon-frontmatter",
    ],
    [
      "registry disagreeing with the slug",
      good.replace("registry: widget", "registry: gadget"),
      "docs-canon-frontmatter",
    ],
    [
      "missing since frontmatter",
      good.replace("since: 0.1.0\n", ""),
      "docs-canon-frontmatter",
    ],
    [
      "a non-canon section",
      good.replace("## Usage", "## How it works"),
      "docs-canon-sections",
    ],
    [
      "a missing required section",
      good.replace(/## Examples\n\ntext\n\n/, ""),
      "docs-canon-sections",
    ],
    [
      "sections out of canon order",
      good.replace(
        /## Usage\n\ntext\n\n## Anatomy\n\n<Anatomy name="widget" \/>\n\n/,
        '## Anatomy\n\n<Anatomy name="widget" />\n\n## Usage\n\ntext\n\n',
      ),
      "docs-canon-order",
    ],
    [
      "a section after Do / Don't",
      good + "\n## Usage\n\nstray\n",
      "docs-canon-tail",
    ],
    [
      "a hand-typed install fence",
      good.replace(
        '<InstallSteps name="widget" />',
        "```bash\nnpx shadcn@latest add @vegastack/widget\n```",
      ),
      "docs-canon-generated",
    ],
    [
      "a missing StatesTested",
      good.replace('<StatesTested name="widget" />', "- keyboard notes"),
      "docs-canon-generated",
    ],
    [
      "a generated section naming another item",
      good.replace('<Anatomy name="widget" />', '<Anatomy name="gadget" />'),
      "docs-canon-generated",
    ],
    [
      "prose in the generated Changelog",
      good.replace(
        '<ComponentChangelog name="widget" />',
        '<ComponentChangelog name="widget" />\n\nAnd a hand-written note.',
      ),
      "docs-canon-generated",
    ],
    [
      "a compound with no Anatomy section",
      good.replace(/## Anatomy\n\n<Anatomy name="widget" \/>\n\n/, ""),
      "docs-canon-sections",
    ],
  ];

  let failures = 0;
  if (canonProblems("widget.mdx", good, 4).length > 0) {
    failures++;
    console.log(
      `✗ content-lint --self-test: the conforming fixture reported ${canonProblems("widget.mdx", good, 4).join("; ")}`,
    );
  }
  for (const [label, fixture, rule] of cases) {
    const reported = canonProblems("widget.mdx", fixture, 4);
    if (!reported.some((problem) => problem.includes(`[${rule}]`))) {
      failures++;
      console.log(
        `✗ content-lint --self-test: ${label} was NOT rejected by [${rule}] (reported: ${reported.join("; ") || "nothing"})`,
      );
    }
  }
  if (failures) {
    console.error(
      `\n✗ content-lint --self-test: ${failures} rule(s) fail open`,
    );
    process.exit(1);
  }
  console.log(
    `✓ content-lint --self-test: ${cases.length} canon violations each observed failing, and the conforming page passes`,
  );
  process.exit(0);
}

if (process.argv.includes("--self-test")) selfTest();

let violations = 0;

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return undefined;
  const value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

const titleOwners = new Map();
for (const [dir, expectedAudience] of [
  [PUBLIC_DOCS_DIR, "public"],
  [INTERNAL_DOCS_DIR, "internal"],
]) {
  for (const file of walk(dir, /\.mdx$/)) {
    const contents = readFileSync(file, "utf8");
    const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
    const relative = file.replace(ROOT + "/", "");
    if (!frontmatterMatch) {
      violations++;
      console.log(
        `${relative}:1 [docs-frontmatter] MDX docs must start with YAML frontmatter.`,
      );
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const audience = frontmatterValue(frontmatter, "audience");
    const title = frontmatterValue(frontmatter, "title");
    const description = frontmatterValue(frontmatter, "description");

    if (audience !== expectedAudience) {
      violations++;
      console.log(
        `${relative}:1 [docs-audience] expected audience: ${expectedAudience}, found ${audience ?? "missing"} — public and internal collections must fail closed at the source boundary.`,
      );
    }
    if (!title || title.length > 70) {
      violations++;
      console.log(
        `${relative}:1 [docs-title] title must be non-empty and at most 70 characters (found ${title?.length ?? 0}).`,
      );
    } else if (titleOwners.has(title)) {
      violations++;
      console.log(
        `${relative}:1 [docs-title] duplicate title "${title}"; first used by ${titleOwners.get(title)}.`,
      );
    } else {
      titleOwners.set(title, relative);
    }
    if (!description || description.length < 60 || description.length > 160) {
      violations++;
      console.log(
        `${relative}:1 [docs-description] description must be 60–160 characters (found ${description?.length ?? 0}).`,
      );
    } else if (/<[^>]+>|&(?:[a-z]+|#\d+);/i.test(description)) {
      violations++;
      console.log(
        `${relative}:1 [docs-description] description must be plain text without HTML or unresolved entities.`,
      );
    }
  }
}

const cssWithoutComments = readFileSync(DOCS_GLOBAL_CSS, "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
let sawNonImportRule = false;
for (const [index, line] of cssWithoutComments.split("\n").entries()) {
  const value = line.trim();
  if (!value) continue;
  if (value.startsWith("@import ")) {
    if (sawNonImportRule) {
      violations++;
      console.log(
        `apps/docs/app/global.css:${index + 1} [css-import-order] every @import must precede Tailwind directives and normal CSS rules.`,
      );
    }
  } else {
    sawNonImportRule = true;
  }
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      STALE_SHADCN_RE.lastIndex = 0;
      let m;
      while ((m = STALE_SHADCN_RE.exec(line))) {
        violations++;
        console.log(
          `${file.replace(ROOT + "/", "")}:${i + 1} [stale-shadcn-cli] "${m[0]}" — use the current Base UI CLI form, for example "pnpm dlx shadcn@latest ...".\n    ${line.trim()}`,
        );
      }
    });
  }
}

// Reject stale visual-coverage guidance: skipped visual describes + committed-baseline instructions.
const seenVisualFiles = new Set();
for (const dir of VISUAL_SCAN_DIRS) {
  for (const file of walk(dir, VISUAL_EXT)) {
    if (seenVisualFiles.has(file)) continue;
    seenVisualFiles.add(file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const { re, label, msg } of [
        {
          re: SKIPPED_DESCRIBE_RE,
          label: "visual-skip",
          msg: "a skipped visual `describe.skip(` leaves a component with no active behaviour coverage — the geometry contracts derive their fixtures from the preview barrel, so add the preview and the component contract instead of skipping.",
        },
        {
          re: COMMITTED_BASELINE_RE,
          label: "committed-baseline",
          msg: "committed screenshot baselines were removed on 2026-07-25 and no capture lane replaced them — the blocking visual-surface gate is the geometry contract suite, which takes no screenshots. Rewrite this guidance.",
        },
      ]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line))) {
          violations++;
          console.log(
            `${file.replace(ROOT + "/", "")}:${i + 1} [${label}] "${m[0]}" — ${msg}\n    ${line.trim()}`,
          );
        }
      }
    });
  }
}

// The page canon, over every component page.
const partCounts = componentPartCounts();
for (const file of readdirSync(COMPONENT_PAGES_DIR).sort()) {
  if (!file.endsWith(".mdx")) continue;
  const relative = `apps/docs/content/docs/components/${file}`;
  const problems = canonProblems(
    relative,
    readFileSync(join(COMPONENT_PAGES_DIR, file), "utf8"),
    partCounts.get(basename(file, ".mdx")) ?? 0,
  );
  violations += problems.length;
  for (const problem of problems) console.log(problem);
}

if (violations) {
  console.error(`\n✗ content-lint: ${violations} violation(s)`);
  process.exit(1);
}
console.log(
  "✓ content-lint: clean (docs audience/metadata, the page canon, shadcn CLI, and visual-coverage guidance)",
);
