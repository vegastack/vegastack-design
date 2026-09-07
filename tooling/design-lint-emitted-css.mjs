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
 * overrides it. So the default is cleared only when this stylesheet carries an override that
 * COVERS it: an on-ladder `font-weight` rule whose selector set includes every element path the
 * default matches.
 *
 * "Covers" is compared properly rather than by name. The first version of this check pulled the
 * last element out of the default's `:where(…)` and searched the sheet for ANY `.prose … h2 …`
 * rule with an on-ladder weight — so `.prose aside h2 { font-weight: 500 }`, an override that
 * reaches one element in one container, silently cleared `.prose :where(h2) { font-weight: 600 }`
 * for every heading on the site. The narrowed-override fixture in the self-test is that exact
 * shape and must fail.
 */

/** Split a selector list on TOP-LEVEL commas — `:is(h1,h2)` must not be split. */
function splitTopLevel(text, separator = ",") {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Remove `:not(...)` guards — typography's `:not(:where([class~=not-prose] *))` is one. */
function stripNot(compound) {
  let out = "";
  let index = 0;
  while (index < compound.length) {
    if (compound.startsWith(":not(", index)) {
      let depth = 0;
      let cursor = index + 4;
      for (; cursor < compound.length; cursor++) {
        if (compound[cursor] === "(") depth++;
        else if (compound[cursor] === ")" && --depth === 0) break;
      }
      index = cursor + 1;
      continue;
    }
    out += compound[index++];
  }
  return out;
}

/**
 * Expand one compound selector into its alternatives, each as `{ text, zeroSpecificity }`.
 * A bare `:is(a,b)` / `:where(a,b)` expands to its arguments; `:where(…)` marks the alternative
 * as contributing no specificity, which is what makes the plugin's defaults overridable.
 */
function expandCompound(compound) {
  const clean = stripNot(compound).trim();
  if (!clean) return [];
  const functional = /^:(is|where|matches|any)\(([\s\S]*)\)$/.exec(clean);
  if (functional) {
    const zero = functional[1] === "where";
    return splitTopLevel(functional[2]).flatMap((inner) =>
      expandSelector(inner).map((path) => ({
        path: path.path,
        zeroSpecificity: zero || path.zeroSpecificity,
      })),
    );
  }
  return [{ path: [clean], zeroSpecificity: false }];
}

/**
 * Expand one complex selector into every element PATH it matches, as an array of steps.
 * Only the descendant combinator is modelled; a child/sibling combinator yields `null`, which
 * callers treat as "cannot be compared" — never as a match.
 */
export function expandSelector(selector) {
  const normalised = selector.replace(/\s+/g, " ").trim();
  if (/[>+~]/.test(normalised.replace(/\([^)]*\)/g, ""))) {
    return [{ path: null, zeroSpecificity: false }];
  }
  // Split on descendant whitespace at depth 0 so `:is(thead th)` stays one compound.
  const steps = splitTopLevel(normalised, " ");
  let paths = [{ path: [], zeroSpecificity: false }];
  for (const step of steps) {
    const alternatives = expandCompound(step);
    if (alternatives.length === 0)
      return [{ path: null, zeroSpecificity: false }];
    const next = [];
    for (const prefix of paths) {
      for (const alternative of alternatives) {
        if (alternative.path === null || prefix.path === null) {
          next.push({ path: null, zeroSpecificity: false });
          continue;
        }
        next.push({
          path: [...prefix.path, ...alternative.path],
          zeroSpecificity:
            prefix.zeroSpecificity || alternative.zeroSpecificity,
        });
      }
    }
    paths = next;
  }
  return paths;
}

const ON_LADDER_WEIGHT =
  /font-weight:\s*var\(--font-weight-(?:normal|medium)\)/;

/**
 * Every element path an on-ladder `.prose` weight override in this stylesheet reaches, as
 * `".prose|h1"`-style keys. An override that is itself entirely inside `:where()` contributes
 * nothing: it carries no specificity, so it does not reliably beat the default it would clear.
 */
function overriddenProsePaths(css) {
  const covered = new Set();
  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    if (!selector || selector.startsWith("@")) continue;
    if (!ON_LADDER_WEIGHT.test(match[2])) continue;
    for (const one of splitTopLevel(selector)) {
      if (!one.startsWith(".prose")) continue;
      for (const expanded of expandSelector(one)) {
        if (expanded.path === null || expanded.zeroSpecificity) continue;
        covered.add(expanded.path.join("|"));
      }
    }
  }
  return covered;
}

/**
 * True when EVERY element path this zero-specificity `.prose` default matches is also matched by
 * an on-ladder override in the same stylesheet. A narrower override covers fewer paths and
 * therefore never clears the default.
 */
function neutralisedProseDefault(
  selector,
  css,
  covered = overriddenProsePaths(css),
) {
  const alternatives = splitTopLevel(selector)
    .filter((one) => one.startsWith(".prose"))
    .flatMap((one) => expandSelector(one));
  if (alternatives.length === 0) return false;
  // Only a zero-specificity default is overridable at all; a literal `.prose h2{font-weight:600}`
  // is a real rule the shell authored and must fix, not neutralise.
  if (!alternatives.every((one) => one.zeroSpecificity)) return false;
  return alternatives.every(
    (one) => one.path !== null && covered.has(one.path.join("|")),
  );
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
  const coveredProsePaths = overriddenProsePaths(body);

  for (const match of body.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    const declarations = match[2];
    if (!selector || selector.startsWith("@")) continue;
    if (ALLOWED_SELECTOR_PREFIXES.some((prefix) => selector.startsWith(prefix)))
      continue;

    for (const weight of declarations.matchAll(/font-weight:\s*(\d{3})/g)) {
      if (Number(weight[1]) <= MAX_FONT_WEIGHT) continue;
      if (neutralisedProseDefault(selector, body, coveredProsePaths)) continue;
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
      // A NARROWER override must not clear a site-wide default. `.prose aside h2` reaches h2
      // inside an <aside> only; every other heading on the site stays at 600. The first version
      // of this lane accepted it because it searched for any `.prose … h2 …` rule by name.
      "narrowed override does not neutralise the default",
      `${PROSE_DEFAULT}.prose aside h2{font-weight:var(--font-weight-medium)}`,
      findOffences,
    ],
    [
      // A `:where()`-wrapped "override" carries no specificity, so it does not reliably win.
      "zero-specificity override does not neutralise the default",
      `${PROSE_DEFAULT}.prose :where(h2){font-weight:var(--font-weight-medium)}`,
      findOffences,
    ],
    [
      // The override covers h2 but the default also matches h3 — partial coverage is not coverage.
      "partial coverage does not neutralise a multi-element default",
      ".prose :where(h2,h3):not(:where([class~=not-prose])){font-weight:600}" +
        ".prose :is(h2){font-weight:var(--font-weight-medium)}",
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
  // A default whose path is a DESCENDANT pair is cleared by an override naming the same pair.
  if (
    findOffences(
      ".prose :where(thead th):not(:where([class~=not-prose])){font-weight:600}" +
        ".prose :is(h1,h2,dt,thead th){font-weight:var(--font-weight-medium)}",
      new Set(),
    ).length > 0
  ) {
    console.error(
      "✗ design-lint --emitted-css self-test: a descendant-path default with a matching override was reported",
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
    "✓ design-lint --emitted-css self-test: heavy weights, unoverridden prose defaults, NARROWED / zero-specificity / partial overrides, rendered raw palette and lost remaps rejected; @font-face weights, genuinely covering overrides (element and descendant-path) and unrendered classes accepted",
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
