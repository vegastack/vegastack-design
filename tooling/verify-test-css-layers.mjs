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
  globSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, basename, dirname } from "node:path";

import { ROOT } from "./lib/fs.mjs";

const PRESET = join(ROOT, "packages/design/preset.css");
const LANE_DIR = join(ROOT, "packages/ui/test");

/**
 * Every `@import` specifier a stylesheet declares, in order.
 *
 * IT USED TO MATCH ONLY `@vegastack/design-tokens/<layer>.css`, which made the gate's own claim —
 * "the SAME layer set production ships" — narrower than it reads. `packages/design/preset.css`
 * also ships `@import "tw-animate-css"`, and because the pattern could not see it, no lane imported
 * it and nothing said so. Harmless while zero `animate-in` / `fade-in` / `zoom-in` /
 * `slide-in-from-*` classes exist in this tree (checked 2026-09-09), and invisible the moment one
 * does: a `tw-animate-css` utility with no definition compiles to NOTHING, exactly like a missing
 * `@utility`, and the lane would measure a fixture stripped of its enter animation. The specifier
 * is the unit now, so any import production adopts is required of every lane automatically.
 */
function importedSpecifiers(css) {
  return [...css.matchAll(/^\s*@import\s+["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
}

/** The `@source` globs a stylesheet declares, with the line each was written on. */
function declaredSources(css) {
  return css
    .split("\n")
    .map((text, index) => ({
      match: /^\s*@source\s+["']([^"']+)["']/.exec(text),
      line: index + 1,
    }))
    .filter((entry) => entry.match)
    .map((entry) => ({ glob: entry.match[1], line: entry.line }));
}

function laneStylesheets() {
  return readdirSync(LANE_DIR)
    .filter((name) => name.endsWith(".css"))
    .sort()
    .map((name) => ({ name, path: join(LANE_DIR, name) }));
}

/** Returns the list of problems for one lane stylesheet, given the required import set. */
function check(name, css, required) {
  const problems = [];
  const present = new Set(importedSpecifiers(css));
  for (const specifier of required) {
    if (!present.has(specifier)) {
      problems.push(
        `${name} does not import "${specifier}" — ` +
          `production (packages/design/preset.css) does, so anything this lane measures that ` +
          `depends on it is compiled to nothing and the assertion passes over it`,
      );
    }
  }
  if (!present.has("tailwindcss")) {
    problems.push(
      `${name} does not import "tailwindcss" — no utility compiles at all`,
    );
  }
  return problems;
}

/**
 * A declared `@source` that matches no file on disk scans NOTHING, silently — the same fail-open
 * one layer over: the glob documents an intent the compiler never acts on. This does not prove a
 * glob is non-REDUNDANT (Tailwind v4 also auto-detects sources under the Vite root, so a glob can
 * match files and still add nothing — two in `geometry.css` were removed on 2026-09-09 for exactly
 * that), which would take a second compile per glob to establish. It proves the weaker, cheap and
 * still load-bearing half: the path resolves.
 */
function unresolvedSources(name, path, css) {
  const base = dirname(path);
  return declaredSources(css)
    .filter(({ glob }) => globSync(glob, { cwd: base }).length === 0)
    .map(
      ({ glob, line }) =>
        `${name}:${line} declares \`@source '${glob}'\` and it matches NO file. A glob that ` +
        `resolves to nothing raises no error — it simply scans nothing, so every class it was ` +
        `written to compile is silently absent from this lane.`,
    );
}

const presetCss = readFileSync(PRESET, "utf8");
// `tailwindcss` is asserted separately, with its own message, because a lane missing THAT compiles
// no utility at all rather than dropping one layer.
const required = importedSpecifiers(presetCss).filter(
  (specifier) => specifier !== "tailwindcss",
);
if (required.length === 0) {
  console.error(
    `✗ verify-test-css-layers: no @import declarations found in ${PRESET}. ` +
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
  const css = readFileSync(lane.path, "utf8");
  problems.push(...check(lane.name, css, required));
  problems.push(...unresolvedSources(lane.name, lane.path, css));
}

if (process.argv.includes("--self-test")) {
  // Non-vacuity: for every lane and every required layer, a copy with that import deleted must be
  // reported, naming the layer. A gate never observed failing is an assumption.
  const scratch = mkdtempSync(join(tmpdir(), "vegastack-css-layers-"));
  try {
    let cases = 0;
    const escape = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    let sourceCases = 0;
    for (const lane of lanes) {
      const css = readFileSync(lane.path, "utf8");
      for (const specifier of required) {
        const mutated = css.replace(
          new RegExp(`^\\s*@import\\s+["']${escape(specifier)}["'].*$`, "m"),
          "",
        );
        if (mutated === css) {
          console.error(
            `✗ verify-test-css-layers --self-test: could not remove ` +
              `"${specifier}" from ${lane.name}; the mutation matched nothing, so this case tests nothing`,
          );
          process.exit(1);
        }
        const path = join(
          scratch,
          `${basename(lane.name, ".css")}-${specifier.replace(/[^a-z0-9]+/gi, "-")}.css`,
        );
        writeFileSync(path, mutated);
        const found = check(lane.name, mutated, required);
        if (!found.some((problem) => problem.includes(`"${specifier}"`))) {
          console.error(
            `✗ verify-test-css-layers --self-test: removing "${specifier}" from ${lane.name} was NOT caught`,
          );
          process.exit(1);
        }
        cases++;
      }
      // …and a `@source` pointed at a path that no longer exists must be reported, not ignored.
      const broken = css.replace(
        /^(\s*@source\s+["'])([^"']+)(["'])/m,
        "$1$2.gone-on-purpose$3",
      );
      if (broken === css) {
        console.error(
          `✗ verify-test-css-layers --self-test: ${lane.name} declares no @source to break`,
        );
        process.exit(1);
      }
      if (unresolvedSources(lane.name, lane.path, broken).length === 0) {
        console.error(
          `✗ verify-test-css-layers --self-test: a @source glob matching nothing was NOT caught in ${lane.name}`,
        );
        process.exit(1);
      }
      sourceCases++;
    }
    console.log(
      `✓ verify-test-css-layers --self-test: ${cases} missing-import mutation(s) ` +
        `(${lanes.length} lane(s) × ${required.length} required import(s)) and ${sourceCases} ` +
        `unresolvable-@source mutation(s) rejected`,
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
  `✓ verify-test-css-layers: ${lanes.length} compiled-CSS lane(s) import the production set ` +
    `(${required.join(", ")}) and every declared @source resolves`,
);
