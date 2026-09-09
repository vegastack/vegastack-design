#!/usr/bin/env node
// Every compiled-CSS test lane must import the SAME @vegastack/design-tokens layer set that
// production ships, and it must not do so by accident.
//
// WHY THIS GATE EXISTS
//   A Tailwind v4 custom `@utility` that is never defined compiles to NOTHING. No error, no
//   warning, no missing-import diagnostic — the class simply produces an empty rule. So a lane
//   whose stylesheet omits `@vegastack/design-tokens/utilities.css` renders every fixture wearing
//   `scroll-fade-*`, `scrollbar-thin`, `motion-dock-*` or `motion-pop-in` STRIPPED of that utility,
//   and then measures a layout no user ever sees. That is a gate reporting green over the wrong
//   page — the worst failure mode a gate has.
//
//   It has already happened: `geometry.css` imported theme + base and not utilities, and M2 (#64)
//   traced four red geometry fixtures to exactly that. `contrast.css` and `stacking.css` carried
//   the same defect until G1-b. A comment warning the next author is not a gate; this is.
//
// THE AUTHORITY
//   `packages/design/preset.css` is the stylesheet real consumers import (`@vegastack/design`'s
//   Tailwind preset), so its `@vegastack/design-tokens/*` imports ARE the production layer set. It
//   is read at run time rather than restated here, so adding a layer to the product automatically
//   requires every lane to adopt it — the list can never go stale.
//
// SCOPE
//   `packages/ui/test/*.css` — the compiled-CSS entries imported by the browser lanes. A lane's
//   stylesheet is the only place this can be enforced statically; the runtime sentinel in
//   `geometry.browser.test.tsx` proves the sheet REACHED the page, which is a different fact.
//
// `--self-test` proves the gate is not vacuous: a copy of each lane stylesheet with one required
// layer removed must be rejected, naming that layer.

import {
  readFileSync,
  readdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

import { ROOT } from "./lib/fs.mjs";

const PRESET = join(ROOT, "packages/design/preset.css");
const LANE_DIR = join(ROOT, "packages/ui/test");

/** The `@vegastack/design-tokens/<layer>.css` imports a stylesheet makes, in order. */
function tokenLayers(css) {
  return [
    ...css.matchAll(
      /^\s*@import\s+["']@vegastack\/design-tokens\/([a-z-]+)\.css["']/gm,
    ),
  ].map((match) => match[1]);
}

function laneStylesheets() {
  return readdirSync(LANE_DIR)
    .filter((name) => name.endsWith(".css"))
    .sort()
    .map((name) => ({ name, path: join(LANE_DIR, name) }));
}

/** Returns the list of problems for one lane stylesheet, given the required layer set. */
function check(name, css, required) {
  const problems = [];
  const present = new Set(tokenLayers(css));
  for (const layer of required) {
    if (!present.has(layer)) {
      problems.push(
        `${name} does not import @vegastack/design-tokens/${layer}.css — ` +
          `production (packages/design/preset.css) does, so anything this lane measures that ` +
          `depends on that layer is compiled to nothing and the assertion passes over it`,
      );
    }
  }
  if (!/^\s*@import\s+["']tailwindcss["']/m.test(css)) {
    problems.push(
      `${name} does not import "tailwindcss" — no utility compiles at all`,
    );
  }
  return problems;
}

const presetCss = readFileSync(PRESET, "utf8");
const required = tokenLayers(presetCss);
if (required.length === 0) {
  console.error(
    `✗ verify-test-css-layers: no @vegastack/design-tokens imports found in ${PRESET}. ` +
      `That file is the authority for the production layer set; if it moved, update this gate ` +
      `rather than letting the required set silently become empty.`,
  );
  process.exit(2);
}

const lanes = laneStylesheets();
if (lanes.length === 0) {
  console.error(
    `✗ verify-test-css-layers: no *.css lane entries under ${LANE_DIR} — the gate would pass over nothing`,
  );
  process.exit(2);
}

const problems = [];
for (const lane of lanes) {
  problems.push(...check(lane.name, readFileSync(lane.path, "utf8"), required));
}

if (process.argv.includes("--self-test")) {
  // Non-vacuity: for every lane and every required layer, a copy with that import deleted must be
  // reported, naming the layer. A gate never observed failing is an assumption.
  const scratch = mkdtempSync(join(tmpdir(), "vegastack-css-layers-"));
  try {
    let cases = 0;
    for (const lane of lanes) {
      const css = readFileSync(lane.path, "utf8");
      for (const layer of required) {
        const mutated = css.replace(
          new RegExp(
            `^\\s*@import\\s+["']@vegastack/design-tokens/${layer}\\.css["'].*$`,
            "m",
          ),
          "",
        );
        if (mutated === css) {
          console.error(
            `✗ verify-test-css-layers --self-test: could not remove ` +
              `${layer}.css from ${lane.name}; the mutation matched nothing, so this case tests nothing`,
          );
          process.exit(1);
        }
        const path = join(
          scratch,
          `${basename(lane.name, ".css")}-${layer}.css`,
        );
        writeFileSync(path, mutated);
        const found = check(lane.name, mutated, required);
        if (!found.some((problem) => problem.includes(`${layer}.css`))) {
          console.error(
            `✗ verify-test-css-layers --self-test: removing ${layer}.css from ${lane.name} was NOT caught`,
          );
          process.exit(1);
        }
        cases++;
      }
    }
    console.log(
      `✓ verify-test-css-layers --self-test: ${cases} missing-layer mutation(s) rejected ` +
        `(${lanes.length} lane(s) × ${required.length} required layer(s))`,
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (problems.length > 0) {
  console.error(`✗ verify-test-css-layers: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(
  `✓ verify-test-css-layers: ${lanes.length} compiled-CSS lane(s) import the production layer set ` +
    `(${required.join(", ")})`,
);
