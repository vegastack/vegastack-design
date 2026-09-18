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
 *   1. **A raw-palette colour** in a rule that reaches the page — `var(--color-emerald-500)` on a
 *      class the built HTML actually carries. It cannot be fixed by a token remap; it needs a real
 *      override in `app/global.css`.
 *   2. **A missing remap** — `.font-semibold` must resolve through `var(--font-weight-semibold)`.
 *      If Tailwind ever inlines the value instead, the class silently returns to the stock one;
 *      asserting the indirection catches that the moment it happens.
 *
 * It USED to reject an off-ladder `font-weight` and a `rounded-xl` that did not route through
 * `--radius-xl`. Batch 1 of the shadcn reset deleted the doctrine under both (the 400/500 ladder
 * and the radius remap), so Batch 8 deleted the checks — see the note above `findOffences`.
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
 * Every raw-palette colour the built stylesheet actually renders.
 *
 * Batch 8 of the shadcn reset (2026-09-18) removed this lane's OTHER arm. It used to reject any
 * `font-weight` over 500 and to require `.rounded-xl`/`.rounded-2xl` to resolve through
 * `--radius-xl`/`--radius-2xl`, because the pre-reset system had a 400/500 weight ladder and a
 * radius remap. Batch 1 deleted both — AGENTS.md § Build rules: "`font-semibold`, `tracking-tight`
 * and `text-4xl` are ordinary utilities" and "Radius derives from one `--radius` (0.625rem)
 * exactly as upstream derives it" — so a weight of 600 in the shell and a stock `rounded-xl` are
 * both on-system now, and the checks had no subject left. They went with the machinery that served
 * them (the `:where()` covering analysis and the selector expander), rather than being left
 * asserting doctrine the system no longer holds. Nothing else in this lane changed; the gate still
 * runs only inside `verify:distribution`, which is how this was found.
 */
export function findOffences(css, usedClasses) {
  const offences = [];

  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    const declarations = match[2];
    if (!selector || selector.startsWith("@")) continue;
    if (ALLOWED_SELECTOR_PREFIXES.some((prefix) => selector.startsWith(prefix)))
      continue;

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
  const cases = [
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
    ".font-semibold{font-weight:var(--font-weight-semibold)}" +
    ".font-bold{font-weight:var(--font-weight-bold)}" +
    // On-system now: Batch 1 deleted the 400/500 ladder and the radius remap, so neither a 600
    // weight nor a stock radius is a finding. Pinned as ACCEPTED, so re-adding either rule
    // without re-adding the doctrine turns this fixture red.
    ".prose :where(h2):not(:where([class~=not-prose])){font-weight:600}" +
    ".rounded-xl{border-radius:.75rem}";
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
  // The allowlisted syntax themes keep their own palette.
  if (
    findOffences(".shiki span{color:var(--color-sky-500)}", null).length > 0
  ) {
    console.error(
      "✗ design-lint --emitted-css self-test: an allowlisted Shiki rule was reported",
    );
    process.exit(1);
  }
  console.log(
    "✓ design-lint --emitted-css self-test: rendered raw palette and a lost weight remap rejected; " +
      "unrendered palette classes, allowlisted syntax themes, and the post-Batch-1 vocabulary " +
      "(a 600 weight, a stock radius) accepted",
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
