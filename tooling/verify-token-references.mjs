#!/usr/bin/env node
// Every `--token` a component names must EXIST in the built token contract.
//
// WHY THIS GATE EXISTS
//   A CSS custom property that was never defined is not an error anywhere in this stack. Tailwind
//   compiles `bg-(--color-surface-4)` into `background-color: var(--color-surface-4)` whether or
//   not that variable exists; the browser then treats the declaration as invalid at computed-value
//   time and paints the inherited or initial value. So a typo, a token renamed in `design.md`, or a
//   token deleted from the DTCG source produces a control that renders — with the wrong colour, or
//   no colour — and NOTHING in the repository says so. `design-lint` checks the token VOCABULARY
//   (is this the right kind of token for this property); it has no way to check EXISTENCE.
//
//   That is the same shape as the missing `@utility` layer this batch also closed: a reference
//   with no definition, compiling to nothing, in silence.
//
// WHAT COUNTS AS DEFINED
//   1. Anything in the built `@vegastack/design-tokens/theme.css` — the contract consumers get.
//      Built, not authored, so a token that fails to survive the Style Dictionary build is not
//      "defined" here either.
//   2. Anything the FILE ITSELF declares. Components legitimately compute a local variable and
//      consume it from a class (`--btn-fill`, `--panel-width-md`, `--te-min-h`); that is the
//      sanctioned escape hatch from the inline-style ban, so it must stay legal. A local is
//      recognised by its declaration form: `"--x":` / `'--x':` in a style object, `[--x:…]` as an
//      arbitrary property utility, or `--x:` in a CSS file.
//   3. The Base UI positioner runtime variables, which the primitive sets on the element at run
//      time and no stylesheet declares. That list is short, closed, and named below.
//
// `--self-test` proves the gate is not vacuous: a specimen naming a token that does not exist must
// be rejected, and one naming a file-local must not.

import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createRequire } from "node:module";

import { ROOT, walk } from "./lib/fs.mjs";

const THEME = join(ROOT, "packages/design-tokens/dist/theme.css");
// Tailwind v4 ships its own default theme as CSS custom properties (`--spacing`, `--container-*`,
// `--color-*`, `--text-*`, …). A component that consumes one is consuming a real, defined variable,
// so the contract for this gate is BOTH themes. Resolved rather than vendored so a Tailwind upgrade
// cannot make this gate start rejecting variables Tailwind still defines.
// `tailwindcss` does not export `./theme.css` from its package.json `exports`, so resolve the
// package entry and take the sibling file. Resolved rather than vendored so a Tailwind upgrade
// cannot make this gate start rejecting variables Tailwind still defines.
const TAILWIND_THEME = createRequire(
  join(ROOT, "packages/ui/package.json"),
).resolve("tailwindcss/theme.css");

// Set by Base UI on the positioner/popup at run time (Popover, Select, Menu, Tooltip, …). Nothing
// declares them in CSS, and a component that consumes one is correct. Closed list: a new entry is
// a new Base UI surface, not a pattern to copy.
const RUNTIME_VARIABLES = new Set([
  "--anchor-width",
  "--anchor-height",
  "--available-width",
  "--available-height",
  "--transform-origin",
  "--positioner-width",
  "--positioner-height",
  "--side",
  "--align",
  // Base UI panel/indicator measurements, written to the element by the primitive's own effect.
  "--accordion-panel-height",
  "--accordion-panel-width",
  "--collapsible-panel-height",
  "--collapsible-panel-width",
  "--panel-height",
  "--panel-width",
  "--popup-height",
  "--popup-width",
  "--active-tab-left",
  "--active-tab-right",
  "--active-tab-top",
  "--active-tab-bottom",
  "--active-tab-width",
  "--active-tab-height",
  // Base UI Toast, which positions the stack from these: the toast's index in the stack, the
  // measured heights the collapsed stack animates between, and the swipe telemetry.
  "--toast-index",
  "--toast-height",
  "--toast-frontmost-height",
  "--toast-offset-y",
  "--toast-swipe-movement-x",
  "--toast-swipe-movement-y",
  // Base UI Drawer (Sheet runs on it) swipe telemetry.
  "--drawer-swipe-movement-x",
  "--drawer-swipe-movement-y",
  // react-remove-scroll-bar, injected as a runtime <style> during scroll lock.
  "--removed-body-scroll-bar-size",
]);

// Chart series colours are CONSUMER data: `chart.tsx` writes `--color-<seriesKey>` from the
// `ChartConfig` the application passes, and the fixtures that demonstrate it name their own series
// (`--color-desktop`, `--color-requests`). The key is the consumer's, so no contract can list it.
//
// Scoped BY FILE, not by pattern. A bare `/^--color-/` exemption would swallow every colour-token
// typo in the system — `--color-surface-4` reads exactly like a series key — which would make the
// gate useless for the case it exists to catch. Only the chart component and the fixtures that
// demonstrate it may name a series colour.
const CHART_SERIES_FILES =
  /(?:^|\/)(?:chart|dashboard-chart)\.tsx$|\/preview\/chart\.tsx$/;
const CHART_SERIES = /^--color-[a-z][a-z0-9-]*$/;

/** Custom properties the built token contract declares. */
function declaredIn(path) {
  const css = readFileSync(path, "utf8");
  return [...css.matchAll(/(?:^|[\s;{])(--[a-z0-9-]+)\s*:/gm)].map(
    (match) => match[1],
  );
}

function contractTokens() {
  return new Set([...declaredIn(THEME), ...declaredIn(TAILWIND_THEME)]);
}

/** Custom properties a source file declares for itself. */
function localTokens(source) {
  const local = new Set();
  // style={{ "--x": … }}, the computed-key form `{ ["--x"]: … }` (which TypeScript needs for a
  // custom property on `CSSProperties`), and a plain CSS declaration `--x: …`.
  for (const match of source.matchAll(/['"](--[a-z0-9-]+)['"]\s*\]?\s*:/g))
    local.add(match[1]);
  for (const match of source.matchAll(/(?:^|[\s;{])(--[a-z0-9-]+)\s*:/gm))
    local.add(match[1]);
  // the arbitrary-property utility form: `[--x:value]`
  for (const match of source.matchAll(/\[(--[a-z0-9-]+):/g))
    local.add(match[1]);
  return local;
}

/**
 * Every `--token` a source file REFERENCES.
 *
 * Both spellings Tailwind v4 accepts: the shorthand `prop-(--token)` (including the alpha modifier
 * `/(--token)`), and `var(--token)` inside an arbitrary value or an inline style.
 */
function referencedTokens(rawSource) {
  // Comments are prose ABOUT tokens, not references to them — `sheet.tsx`'s doc block explains the
  // arbitrary-value contract by naming a placeholder `var(--token)`. Blanked rather than removed so
  // every reported line number still matches the file.
  const source = rawSource
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(
      /(^|[^:])\/\/[^\n]*/g,
      (line, lead) => lead + " ".repeat(line.length - lead.length),
    );
  const referenced = new Map(); // token -> first line
  const lineOf = (index) => source.slice(0, index).split("\n").length;
  const dynamic = (token) => token.endsWith("-");
  for (const match of source.matchAll(/\((--[a-z0-9-]+)\)/g))
    if (!referenced.has(match[1]) && !dynamic(match[1]))
      referenced.set(match[1], lineOf(match.index));
  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/g))
    if (!referenced.has(match[1]) && !dynamic(match[1]))
      referenced.set(match[1], lineOf(match.index));
  return referenced;
}

/** The problems in one file, given the contract. */
function fileProblems(relative, source, contract) {
  const local = localTokens(source);
  const problems = [];
  for (const [token, line] of referencedTokens(source)) {
    if (contract.has(token)) continue;
    if (local.has(token)) continue;
    if (RUNTIME_VARIABLES.has(token)) continue;
    if (CHART_SERIES_FILES.test(relative) && CHART_SERIES.test(token)) continue;
    problems.push(
      `${relative}:${line} references ${token}, which is not in the built token contract ` +
        `(packages/design-tokens/dist/theme.css), is not declared in this file, and is not a ` +
        `Base UI runtime variable. An undefined custom property is not an error anywhere: the ` +
        `declaration is simply dropped and the element paints its inherited value.`,
    );
  }
  return problems;
}

const ROOTS = [
  "packages/ui/registry",
  "apps/docs/components/preview",
  "apps/docs/components/ui",
];

function sourceFiles() {
  return ROOTS.flatMap((root) =>
    walk(join(ROOT, root), {
      include: (relative) =>
        /\.(tsx?|css)$/.test(relative) && !/\.test\.tsx?$/.test(relative),
      // The mirrored animated icons are generated data modules; they carry no class literals.
      prune: (relative) => relative.endsWith("ui/icons"),
    }).map((file) => file),
  );
}

const contract = contractTokens();
if (contract.size < 100) {
  console.error(
    `✗ verify-token-references: only ${contract.size} tokens found in ${THEME}. The contract is ` +
      `the whole basis of this gate — build @vegastack/design-tokens before running it, and if ` +
      `the file moved, fix this path rather than letting the gate pass over an empty set.`,
  );
  process.exit(2);
}

const files = sourceFiles();
const problems = [];
for (const file of files) {
  problems.push(
    ...fileProblems(
      file.replace(`${ROOT}/`, ""),
      readFileSync(file, "utf8"),
      contract,
    ),
  );
}

if (process.argv.includes("--self-test")) {
  const scratch = mkdtempSync(join(tmpdir(), "vegastack-token-refs-"));
  try {
    const undefinedToken = `export const bad = "bg-(--color-surface-4) h-(--size-enormous)";`;
    const found = fileProblems("specimen.tsx", undefinedToken, contract);
    if (found.length !== 2) {
      console.error(
        `✗ verify-token-references --self-test: a specimen naming two non-existent tokens produced ` +
          `${found.length} problem(s), expected 2`,
      );
      process.exit(1);
    }
    const withLocal = `const s = { "--btn-fill": fill };\nexport const ok = "bg-(--btn-fill)";`;
    if (fileProblems("specimen.tsx", withLocal, contract).length !== 0) {
      console.error(
        "✗ verify-token-references --self-test: a file-local custom property was rejected; the " +
          "sanctioned `--*` escape hatch from the inline-style ban must stay legal",
      );
      process.exit(1);
    }
    const runtime = `export const ok = "max-h-(--available-height)";`;
    if (fileProblems("specimen.tsx", runtime, contract).length !== 0) {
      console.error(
        "✗ verify-token-references --self-test: a Base UI runtime variable was rejected",
      );
      process.exit(1);
    }
    console.log(
      "✓ verify-token-references --self-test: two undefined tokens rejected; a file-local " +
        "custom property and a Base UI runtime variable accepted",
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (problems.length > 0) {
  console.error(`✗ verify-token-references: ${problems.length} problem(s)`);
  for (const problem of problems.slice(0, 40)) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(
  `✓ verify-token-references: every --token named across ${files.length} source file(s) exists in ` +
    `the built contract (${contract.size} tokens), is file-local, or is a runtime variable`,
);
