#!/usr/bin/env node
/**
 * design-lint `--emitted-css` — the docs-shell lane that reads the BUILT stylesheet (DC-02, DD-1).
 *
 * `--docs-shell` lints the docs' own TSX/CSS SOURCE, which has always been clean: the off-system
 * values in the docs site are not authored here at all. They arrive from Fumadocs' chrome and the
 * `@tailwindcss/typography` plugin, which are compiled against Tailwind's stock theme — weight 600
 * headings, `rounded-xl`/`2xl` cards, the `shadow-sm…2xl` ladder, raw palette utilities. Source
 * linting cannot see any of them, so this lane reads what the browser actually receives.
 *
 * Two kinds of offence, both measured against `apps/docs/out/**\/*.css`:
 *
 *   1. **A literal off-ladder value** in a rule that reaches the page — `font-weight:600`,
 *      `border-radius:.75rem`, a `box-shadow` that is not one of the two sanctioned shadows, or a
 *      raw-palette colour. These cannot be fixed by a token remap; they need a real override in
 *      `app/global.css`.
 *   2. **A missing remap** — `.font-semibold` must resolve through `var(--font-weight-semibold)`
 *      and `.rounded-xl` through `var(--radius-xl)`, with `:root` re-pointing both at system
 *      values. If Tailwind ever inlines those instead, the class silently returns to the stock
 *      value; asserting the indirection catches that the moment it happens.
 *
 * Deliberately its OWN module, imported by `design-lint.mjs` in one place: TG-08 (G1-a) edits that
 * file in the same wave, and a lane living here cannot conflict with it.
 *
 *   node tooling/design-lint.mjs --docs-shell --emitted-css
 *   node tooling/design-lint-emitted-css.mjs --self-test
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(REPO_ROOT, "apps/docs/out");

/** The weight ladder is 400/500 (AGENTS.md §Build rules). */
const MAX_FONT_WEIGHT = 500;

/**
 * `@font-face` blocks legitimately declare every weight a variable font carries — that is a font
 * FILE descriptor, not a rendered weight. They are cut before the scan.
 */
function stripFontFaces(css) {
  return css.replace(/@font-face\s*\{[^}]*\}/g, "");
}

const PALETTES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

/**
 * Rules the shell is allowed to keep, each with the reason. Anything not listed is a finding.
 *
 * - Shiki's two code themes (`github-light`/`github-dark`) ship their own token colours as hex;
 *   they are a syntax palette, not UI surface colour, and are re-themed wholesale or not at all.
 * - `--color-red-400` is re-pointed at `--destructive-text` in `global.css`, so the one raw-palette
 *   class `@fumadocs/story` emits resolves to a system colour.
 */
const ALLOWED_SELECTOR_PREFIXES = [
  ".shiki",
  "html .shiki",
  ".twoslash",
  "[data-rehype-pretty-code",
];

/**
 * A `:where()` selector contributes ZERO specificity, so such a rule is a default any real rule
 * beats — `@tailwindcss/typography` writes all ten of its heavy weights that way. Flagging the
 * default itself would be unfixable (the plugin owns it); what matters is that the shell actually
 * overrides it. So the default is cleared only when this stylesheet also carries a `.prose` rule
 * that names the same element and puts it back on the ladder. Delete the override in `global.css`
 * and every one of these findings returns.
 */
function neutralisedProseDefault(selector, css) {
  const target = /^\.prose :where\(([^)]*)\)/.exec(selector);
  if (!target) return false;
  const element = target[1].trim().split(/\s+/).pop();
  if (!element) return false;
  const override = new RegExp(
    `\\.prose[^{}]*\\b${element}\\b[^{}]*\\{[^}]*font-weight:\\s*var\\(--font-weight-(?:normal|medium)\\)`,
  );
  return override.test(css);
}

/**
 * `usedClasses` — every class actually present in a `class=` attribute of the built HTML. Tailwind
 * generates a utility for any class-like string it scans, INCLUDING one quoted in prose: the
 * foundations pages document `bg-neutral-900` as a Don't, so the rule exists while no element ever
 * carries it. Without this the lane would report the documentation of a rule as a violation of it.
 */
export function findOffences(css, usedClasses) {
  const offences = [];
  const body = stripFontFaces(css);

  for (const match of body.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    const declarations = match[2];
    if (!selector || selector.startsWith("@")) continue;
    if (ALLOWED_SELECTOR_PREFIXES.some((prefix) => selector.startsWith(prefix)))
      continue;

    for (const weight of declarations.matchAll(/font-weight:\s*(\d{3})/g)) {
      if (Number(weight[1]) <= MAX_FONT_WEIGHT) continue;
      if (neutralisedProseDefault(selector, body)) continue;
      offences.push(
        `${selector} { font-weight: ${weight[1]} } — the ladder is 400/500; override it in app/global.css`,
      );
    }
    for (const palette of declarations.matchAll(
      new RegExp(`var\\(--color-(?:${PALETTES})-\\d{2,3}\\)`, "g"),
    )) {
      // The one re-pointed palette var (see above) resolves to a system token.
      if (palette[0] === "var(--color-red-400)") continue;
      const className = /^\.([\w-]+)$/.exec(selector)?.[1];
      if (usedClasses && className && !usedClasses.has(className)) continue;
      offences.push(
        `${selector} { … ${palette[0]} } — raw Tailwind palette in the docs shell`,
      );
    }
  }
  return offences;
}

/** Every class name that appears in a `class=` attribute of the built HTML. */
function collectUsedClasses(dir, into = new Set()) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collectUsedClasses(path, into);
    else if (path.endsWith(".html")) {
      for (const attribute of readFileSync(path, "utf8").matchAll(
        /class="([^"]*)"/g,
      )) {
        for (const name of attribute[1].split(/\s+/)) if (name) into.add(name);
      }
    }
  }
  return into;
}

/**
 * The token indirections the remaps in `app/global.css` depend on. Each entry is a class whose
 * emitted rule MUST route through a custom property rather than an inlined stock value.
 */
const REQUIRED_INDIRECTIONS = [
  [
    ".font-semibold",
    /\.font-semibold\{[^}]*font-weight:\s*var\(--font-weight-semibold\)/,
  ],
  [".font-bold", /\.font-bold\{[^}]*font-weight:\s*var\(--font-weight-bold\)/],
  [".rounded-xl", /\.rounded-xl\{[^}]*border-radius:\s*var\(--radius-xl\)/],
  [".rounded-2xl", /\.rounded-2xl\{[^}]*border-radius:\s*var\(--radius-2xl\)/],
];

export function findMissingIndirections(css) {
  return REQUIRED_INDIRECTIONS.filter(
    ([className, pattern]) =>
      css.includes(`${className}{`) && !pattern.test(css),
  ).map(
    ([className]) =>
      `${className} no longer resolves through its theme variable — the :root remap in app/global.css cannot reach it, so the class is back on Tailwind's stock value`,
  );
}

function cssFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) cssFiles(path, out);
    else if (path.endsWith(".css")) out.push(path);
  }
  return out;
}

/** Returns the findings; the caller decides how to report and exit. */
export function lintEmittedDocsCss() {
  const files = cssFiles(OUT_DIR);
  if (files.length === 0) {
    return {
      files,
      findings: [
        `no stylesheet under ${relative(REPO_ROOT, OUT_DIR)} — build the docs before running this lane`,
      ],
    };
  }
  const usedClasses = collectUsedClasses(OUT_DIR);
  const findings = [];
  for (const file of files) {
    const css = readFileSync(file, "utf8");
    const label = relative(REPO_ROOT, file);
    for (const offence of findOffences(css, usedClasses))
      findings.push(`${label}: ${offence}`);
    for (const missing of findMissingIndirections(css))
      findings.push(`${label}: ${missing}`);
  }
  return { files, findings };
}

export function emittedCssOutExists() {
  try {
    return statSync(OUT_DIR).isDirectory();
  } catch {
    return false;
  }
}

function selfTest() {
  const PROSE_DEFAULT =
    ".prose :where(h2):not(:where([class~=not-prose])){font-weight:600}";
  const cases = [
    ["literal heavy weight", ".prose h2{font-weight:600}", findOffences],
    [
      // The plugin default with NO override in the sheet — exactly the state before DC-02.
      "unoverridden prose default",
      PROSE_DEFAULT,
      findOffences,
    ],
    [
      "raw palette on a rendered class",
      ".fd-thing{color:var(--color-emerald-500)}",
      findOffences,
    ],
    [
      "lost weight indirection",
      ".font-semibold{font-weight:600}",
      findMissingIndirections,
    ],
    [
      "lost radius indirection",
      ".rounded-xl{border-radius:.75rem}",
      findMissingIndirections,
    ],
  ];
  for (const [label, fixture, check] of cases) {
    if (check(fixture).length === 0) {
      console.error(
        `✗ design-lint --emitted-css self-test: "${label}" was NOT rejected`,
      );
      process.exit(1);
    }
  }
  const clean =
    "@font-face{font-weight:700}.font-semibold{font-weight:var(--font-weight-semibold)}" +
    ".font-bold{font-weight:var(--font-weight-bold)}" +
    ".rounded-xl{border-radius:var(--radius-xl)}.rounded-2xl{border-radius:var(--radius-2xl)}" +
    // The plugin default, plus the shell override that provably beats it.
    PROSE_DEFAULT +
    ".prose :is(h1,h2,h3,h4) strong,.prose :is(h1,h2,h3,h4,dt,thead th){font-weight:var(--font-weight-medium)}";
  if (
    findOffences(clean, new Set()).length > 0 ||
    findMissingIndirections(clean).length > 0
  ) {
    console.error(
      "✗ design-lint --emitted-css self-test: the clean fixture was rejected",
    );
    process.exit(1);
  }
  // A palette utility that no element carries is documentation, not a violation.
  if (
    findOffences(
      ".bg-neutral-900{background-color:var(--color-neutral-900)}",
      new Set(),
    ).length > 0
  ) {
    console.error(
      "✗ design-lint --emitted-css self-test: an unrendered palette class was reported",
    );
    process.exit(1);
  }
  console.log(
    "✓ design-lint --emitted-css self-test: heavy weights, unoverridden prose defaults, rendered raw palette and lost remaps rejected; @font-face weights, overridden defaults and unrendered classes accepted",
  );
}

if (
  process.argv[1] &&
  process.argv[1].endsWith("design-lint-emitted-css.mjs")
) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const { files, findings } = lintEmittedDocsCss();
    if (findings.length > 0) {
      console.error(
        `✗ design-lint --emitted-css: ${findings.length} offender(s)`,
      );
      for (const finding of findings.slice(0, 40))
        console.error(`  ✗ ${finding}`);
      process.exit(1);
    }
    console.log(
      `✓ design-lint --emitted-css: ${files.length} built stylesheet(s) on-system`,
    );
  }
}
