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
  // Base UI Drawer. Batch 4 of the shadcn reset brought the real Drawer in as its own component
  // (Sheet went back to being Base UI's Dialog), and its popup reads the engine's whole telemetry
  // set: the swipe offsets and their normalised progress/strength, the measured heights the nested
  // stack animates between, the active snap point's offset, and the inset the viewport applies.
  "--drawer-swipe-movement-x",
  "--drawer-swipe-movement-y",
  "--drawer-swipe-progress",
  "--drawer-swipe-strength",
  "--drawer-height",
  "--drawer-frontmost-height",
  "--drawer-inset",
  "--drawer-snap-point-offset",
  "--nested-drawers",
  // react-remove-scroll-bar, injected as a runtime <style> during scroll lock.
  "--removed-body-scroll-bar-size",
  // `SidebarProvider` writes these three onto its wrapper element as an inline style, so every
  // descendant — including a BLOCK's own sidebar parts, which is what surfaced this in Batch 8 —
  // reads a variable that genuinely exists at runtime and can exist nowhere in the token contract
  // (the widths are the provider's constants, not theme values).
  "--sidebar-width",
  "--sidebar-width-icon",
  "--sidebar-width-mobile",
]);

// Chart series colours are CONSUMER data: `chart.tsx` writes `--color-<seriesKey>` from the
// `ChartConfig` the application passes, and the fixtures that demonstrate it name their own series
// (`--color-desktop`, `--color-requests`). The key is the consumer's, so no contract can list it.
//
// Scoped BY FILE, not by pattern. A bare `/^--color-/` exemption would swallow every colour-token
// typo in the system — `--color-surface-4` reads exactly like a series key — which would make the
// gate useless for the case it exists to catch. Only the chart component and the fixtures that
// demonstrate it may name a series colour.
// Batch 8 of the shadcn reset (2026-09-18) widened the file list and narrowed it at the same
// time. `dashboard-chart.tsx` LEFT it: upstream's `dashboard-01` replaced our pre-reset block and
// that file no longer exists, and an exemption that can no longer be reached is one that should
// not exist. What joined it is the 68 ported chart blocks (`registry/blocks/chart-*/chart-*.tsx`,
// plus the one `dashboard-01` composes) and the seven family preview modules — every one of them
// a `ChartContainer` composition whose series keys are its own inline sample data, which is
// exactly the case the exemption was written for. It is still a FILE list, not a pattern: a
// `--color-*` typo anywhere else in the system still fails.
const CHART_SERIES_FILES =
  /(?:^|\/)chart\.tsx$|\/preview\/chart\.tsx$|\/preview\/charts-[a-z]+\.tsx$|\/registry\/blocks\/[^/]+\/(?:components\/)?chart-[a-z0-9-]+\.tsx$|\/registry\/blocks\/dashboard-01\/components\/data-table\.tsx$/;
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

/**
 * The problems in one file, given the contract.
 *
 * `siblings` is the set a BLOCK's other files declare. Batch 8 of the shadcn reset (2026-09-18)
 * added it: a block is installed as ONE unit, so when `dashboard-01/page.tsx` sets
 * `--header-height` on the wrapper and `dashboard-01/components/site-header.tsx` reads it, the
 * variable is declared — just not in the reading file. Scoped to the block's own directory, so it
 * can never let a component read a variable some unrelated file happens to declare.
 */
function fileProblems(relative, source, contract, siblings = new Set()) {
  const local = localTokens(source);
  const problems = [];
  for (const [token, line] of referencedTokens(source)) {
    if (contract.has(token)) continue;
    if (local.has(token)) continue;
    if (siblings.has(token)) continue;
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
  // The whole docs app, not only its fixtures. Until the shadcn reset's closing pass this root was
  // `components/preview` + `components/ui`, so the SITE's own chrome was unscanned — and it had
  // four dead references to tokens Batch 1 deleted, including a skip link whose `z-(--z-overlay)`
  // left it with no z-index at all. The defect class is the same one the message below describes;
  // the only thing that varied was whether anything looked.
  "apps/docs/app",
  "apps/docs/components",
  // The shared recipes (`fieldControl`, `fieldControlGroup`, `selectedChipVariants`,
  // `fillInteractive`, `surfaceInteractive`, `prose`) are class-literal source too, and they name
  // `--alpha-hover`, `--alpha-pressed`, `--alpha-ink-tint`, `--alpha-tint-border`,
  // `--alpha-link-hover` and more. A typo here reaches every component at once, and until
  // 2026-09-09 this root was not scanned at all: appending
  // `bg-foreground/(--alpha-does-not-exist)` to `index.ts` still exited 0 (audit MEDIUM-4).
  "packages/design/src",
];

function sourceFiles() {
  return ROOTS.flatMap((root) =>
    walk(join(ROOT, root), {
      include: (relative) =>
        /\.(tsx?|css)$/.test(relative) &&
        !/\.test\.tsx?$/.test(relative) &&
        // The docs app's own stylesheet, and the ONE file in these roots whose job is to bind
        // variables this gate cannot see the declaration of: `next/font` injects
        // `--font-geist-sans`, `--font-geist-mono` and `--font-newsreader` onto `<html>` at run
        // time, and `--home-proof-*` is set inline by the component that reads it. Its class
        // literals are what this gate checks and it has none — it is `@import`s, `@theme`
        // bindings and `@layer base`. Scoped OUT by path rather than allowlisted IN by name, so
        // no list of token names can rot: every `.tsx` under both docs roots is scanned, which is
        // where all four dead references the closing pass found actually were.
        relative !== "global.css",
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
// Per BLOCK, everything its own files declare — see `fileProblems`.
const blockSiblings = new Map();
for (const file of files) {
  const relative = file.replace(`${ROOT}/`, "");
  const block = /^packages\/ui\/registry\/blocks\/([^/]+)\//.exec(
    relative,
  )?.[1];
  if (!block) continue;
  const declared = blockSiblings.get(block) ?? new Set();
  for (const token of localTokens(readFileSync(file, "utf8")))
    declared.add(token);
  blockSiblings.set(block, declared);
}
const problems = [];
for (const file of files) {
  const relative = file.replace(`${ROOT}/`, "");
  const block = /^packages\/ui\/registry\/blocks\/([^/]+)\//.exec(
    relative,
  )?.[1];
  problems.push(
    ...fileProblems(
      relative,
      readFileSync(file, "utf8"),
      contract,
      block ? blockSiblings.get(block) : undefined,
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
    // The block-sibling arm, both halves. A block's page declares the variable its own header
    // reads; anything the block does NOT declare still fails, so the widening cannot be mistaken
    // for "a block may name whatever it likes".
    const blockRead = `export const ok = "h-(--header-height)";`;
    if (
      fileProblems(
        "packages/ui/registry/blocks/x/components/site-header.tsx",
        blockRead,
        contract,
        new Set(["--header-height"]),
      ).length !== 0
    ) {
      console.error(
        "✗ verify-token-references --self-test: a variable a SIBLING file in the same block " +
          "declares was rejected",
      );
      process.exit(1);
    }
    if (
      fileProblems(
        "packages/ui/registry/blocks/x/components/site-header.tsx",
        `export const bad = "h-(--not-declared-anywhere)";`,
        contract,
        new Set(["--header-height"]),
      ).length !== 1
    ) {
      console.error(
        "✗ verify-token-references --self-test: a block file naming a variable NO sibling " +
          "declares was accepted",
      );
      process.exit(1);
    }
    console.log(
      "✓ verify-token-references --self-test: two undefined tokens rejected; a file-local " +
        "custom property, a Base UI runtime variable and a block sibling's declaration accepted, " +
        "and an undeclared variable inside a block still rejected",
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
