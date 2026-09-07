#!/usr/bin/env node
/**
 * verify-docs-base-mirror — DC-17. `apps/docs/app/global.css` hand-copies rule blocks from
 * `packages/design-tokens/src/base.css` (the docs load `theme.css`, not the full `base.css`):
 * the pointer-cursor and disabled-cursor rules, the `:focus-visible` ring, the two forced-colors
 * focus rules, and the reduced-motion reset — the six selectors listed below. Each block says
 * "keep in sync with base.css"; this gate is what keeps them in sync.
 *
 * Every declaration in a mirrored block of base.css must appear, with the same selector, in
 * global.css. Comments and whitespace are ignored; the docs copy may carry extra rules (the
 * `:focus-visible` outline lives in the same `@layer base` block) but may not drop or alter one.
 *
 *   node tooling/verify-docs-base-mirror.mjs             # verify
 *   node tooling/verify-docs-base-mirror.mjs --self-test # prove a dropped declaration is caught
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const basePath = "packages/design-tokens/src/base.css";
const docsPath = "apps/docs/app/global.css";

/**
 * The mirrored blocks, identified by a selector that occurs in each. `@layer base` in base.css
 * also carries the `*`/`body` resets the docs deliberately do NOT mirror (Fumadocs owns the body
 * background), so the pointer block is matched by its own selectors, not by the whole layer.
 */
const MIRRORED_SELECTORS = [
  'button,[role="button"],[role="tab"],[role="switch"],[role="checkbox"],[role="radio"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="option"],summary',
  ':disabled,[aria-disabled="true"],[data-disabled]',
  ":focus-visible",
  "@media (forced-colors: active)>:focus-visible",
  // F1's B1-01 block covers every text-entry control, not just TextEdit: the tint is the focus
  // affordance on all four, and forced colours replaces `border-color` on all four. The key is the
  // whole selector list because that is one rule — mirroring a subset would let the docs copy drop
  // three of them silently.
  '@media (forced-colors: active)>input:focus,textarea:focus,[contenteditable="true"]:focus,[data-slot="text-edit"]:focus-within',
  "@media (prefers-reduced-motion: reduce)>*,::before,::after",
];

/** Flatten CSS into `selector → declarations` (declarations normalised, nesting joined with `>`). */
export function parseRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = new Map();
  const stack = [];
  let buffer = "";
  for (const ch of clean) {
    if (ch === "{") {
      stack.push(normaliseSelector(buffer));
      buffer = "";
    } else if (ch === "}") {
      const declarations = normaliseDeclarations(buffer);
      if (declarations.length > 0) {
        const key = stack.filter((s) => !s.startsWith("@layer")).join(">");
        rules.set(key, [...(rules.get(key) ?? []), ...declarations]);
      }
      stack.pop();
      buffer = "";
    } else {
      buffer += ch;
    }
  }
  return rules;
}

function normaliseSelector(text) {
  const last = text.split(";").pop() ?? "";
  return last
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*,\s*/g, ",")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}

/**
 * `@apply` is a declaration for mirroring purposes — the focus-ring block is expressed ONLY as
 * `@apply outline-2 outline-offset-1 outline-ring` on both sides, so dropping every `@`-prefixed
 * line would compare that block as empty against empty and never fail. Nested at-RULES (`@media`,
 * `@layer`) carry braces and are consumed as selectors by the brace walk, never as declarations.
 */
function normaliseDeclarations(text) {
  return text
    .split(";")
    .map((d) => d.replace(/\s+/g, " ").trim())
    .filter((d) => d && (!d.startsWith("@") || d.startsWith("@apply ")))
    .map((d) => (d.startsWith("@apply ") ? d : d.replace(/\s*:\s*/, ":")));
}

export function findDrift(baseCss, docsCss) {
  const base = parseRules(baseCss);
  const docs = parseRules(docsCss);
  const drift = [];
  for (const selector of MIRRORED_SELECTORS) {
    const expected = base.get(selector);
    if (!expected) {
      drift.push(
        `base.css no longer has "${selector}" — update MIRRORED_SELECTORS or the docs copy`,
      );
      continue;
    }
    const actual = docs.get(selector) ?? [];
    for (const declaration of expected) {
      // The docs copy omits the touch-action/tap-highlight pair on purpose: Fumadocs' own controls
      // already declare them, and the pointer rule is the contract being mirrored.
      if (/^(touch-action|-webkit-tap-highlight-color):/.test(declaration))
        continue;
      if (!actual.includes(declaration)) {
        drift.push(
          `"${selector}" is missing \`${declaration}\` in ${docsPath}`,
        );
      }
    }
  }
  return drift;
}

const args = process.argv.slice(2);
const baseCss = readFileSync(join(root, basePath), "utf8");
const docsCss = readFileSync(join(root, docsPath), "utf8");

if (args.includes("--self-test")) {
  const broken = docsCss.replace("cursor: pointer;", "");
  if (findDrift(baseCss, broken).length === 0) {
    console.error(
      "✗ verify-docs-base-mirror self-test: a dropped `cursor: pointer` was NOT caught",
    );
    process.exit(1);
  }
  const retinted = docsCss.replace(
    "outline-color: Highlight;",
    "outline-color: red;",
  );
  if (findDrift(baseCss, retinted).length === 0) {
    console.error(
      "✗ verify-docs-base-mirror self-test: an altered forced-colors outline was NOT caught",
    );
    process.exit(1);
  }
  const reringed = docsCss.replace(
    "@apply outline-2 outline-offset-1 outline-ring;",
    "@apply outline-1 outline-offset-1 outline-ring;",
  );
  if (findDrift(baseCss, reringed).length === 0) {
    console.error(
      "✗ verify-docs-base-mirror self-test: a weakened `@apply` focus ring was NOT caught",
    );
    process.exit(1);
  }
  if (findDrift(baseCss, docsCss).length > 0) {
    console.error(
      "✗ verify-docs-base-mirror self-test: the real copy does not pass",
    );
    process.exit(1);
  }
  console.log(
    "✓ verify-docs-base-mirror self-test: dropped, altered and weakened-@apply declarations rejected; real copy accepted",
  );
} else {
  const drift = findDrift(baseCss, docsCss);
  if (drift.length > 0) {
    console.error(
      `✗ verify-docs-base-mirror: ${drift.length} drift(s) between ${basePath} and ${docsPath}`,
    );
    for (const item of drift) console.error(`  ✗ ${item}`);
    process.exit(1);
  }
  console.log(
    `✓ verify-docs-base-mirror: ${MIRRORED_SELECTORS.length} mirrored blocks match ${basePath}`,
  );
}
