#!/usr/bin/env node

/**
 * Fail-closed reconciliation for packages/ui/component-contracts.json.
 *
 * The contract inventory is tooling metadata, not a consumer API. This verifier deliberately
 * derives the authoritative item classes from registry type + source path so `icon-button` can
 * never be mistaken for one of the generated `icon-*` mirrors.
 *
 *   node tooling/verify-component-contracts.mjs                          # reconcile
 *   node tooling/verify-component-contracts.mjs --write-data-attributes  # resync the extraction
 *   node tooling/verify-component-contracts.mjs --self-test              # NEGATIVE: prove drift fails
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import prettier from "prettier";
import { ensureBuildOutputs } from "./lib/derived-build-outputs.mjs";

import { ROOT as root, relativeToRoot, walk } from "./lib/fs.mjs";
import {
  isGeneratedAnimatedIcon,
  registryFilePaths,
} from "./lib/animated-icon-inventory.mjs";

// This verifier reads the contract-derived BUILD OUTPUTS (the icon gallery and the home catalog)
// and asserts they reconcile with the contract. They are untracked since WP4/R4, so in a fresh
// clone they may not exist yet; generate them first. That also makes THIS the check that catches a
// stale generator — regenerate, then reconcile, rather than comparing a checked-in file.
ensureBuildOutputs({ force: true });
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const registry = readJson("packages/ui/registry.json");
const contractsPath = "packages/ui/component-contracts.json";
const contracts = readJson(contractsPath);
const problems = [];
// `--write-data-attributes` regenerates every component's `dataAttributes` field from source
// and rewrites the contract (prettier-formatted); the default mode verifies the field matches.
const writeDataAttributes = process.argv.includes("--write-data-attributes");

function fail(message) {
  problems.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function sameStrings(actual, expected, label) {
  const a = sorted(actual);
  const e = sorted(expected);
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    fail(
      `${label}: expected ${JSON.stringify(e)}, received ${JSON.stringify(a)}`,
    );
  }
}

function expectedEnginePackages(dependencies = []) {
  const packages = new Set();
  for (const dependency of dependencies) {
    if (dependency.startsWith("@shadcn/react"))
      packages.add("@shadcn/react/message-scroller");
    if (dependency.startsWith("react-resizable-panels"))
      packages.add("react-resizable-panels");
    if (dependency.startsWith("recharts")) packages.add("recharts");
    if (dependency === "motion" || dependency.startsWith("motion@"))
      packages.add("motion");
    if (dependency.startsWith("@tiptap/")) packages.add("tiptap");
    if (dependency.startsWith("next-themes")) packages.add("next-themes");
    if (dependency.startsWith("react-day-picker"))
      packages.add("react-day-picker");
    if (dependency.startsWith("react-markdown")) packages.add("react-markdown");
    if (dependency.startsWith("remark-gfm")) packages.add("remark-gfm");
    // The D1-D4 sanctioned engines (MK, 2026-07-27). `-hitbox` folds into the
    // pragmatic engine identity.
    if (dependency.startsWith("@tanstack/react-table"))
      packages.add("@tanstack/react-table");
    if (dependency.startsWith("@tanstack/react-virtual"))
      packages.add("@tanstack/react-virtual");
    if (dependency.startsWith("@atlaskit/pragmatic-drag-and-drop"))
      packages.add("@atlaskit/pragmatic-drag-and-drop");
    if (dependency.startsWith("react-dropzone")) packages.add("react-dropzone");
  }
  return sorted(packages);
}

function extractExports(source) {
  // Public examples in JSDoc often contain `export default function ...`; strip comments so the
  // lexical extractor only sees module declarations. Generated icon files keep their real export.
  // Line comments are removed first because an alias example such as `@/components/ui/*` inside
  // one would otherwise look like the start of a block comment and swallow the next declaration.
  source = source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const names = new Set();
  const direct =
    /\bexport\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of source.matchAll(direct)) names.add(match[1]);
  const lists = /\bexport\s+(?:type\s+)?{([^}]+)}/gs;
  for (const match of source.matchAll(lists)) {
    for (const entry of match[1].split(",")) {
      const clean = entry.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      if (!clean) continue;
      const pieces = clean.replace(/^type\s+/, "").split(/\s+as\s+/);
      const exported = (pieces[1] ?? pieces[0]).trim();
      if (/^[A-Za-z_$][\w$]*$/.test(exported)) names.add(exported);
    }
  }
  return sorted(names);
}

function sourceExports(paths) {
  const names = new Set();
  for (const path of paths.filter((candidate) => /\.tsx?$/.test(candidate))) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) continue;
    for (const name of extractExports(readFileSync(absolute, "utf8")))
      names.add(name);
  }
  return sorted(names);
}

/* ── `dataAttributes` — the `data-*` attributes and CSS custom properties each exported part renders
 *
 * Extracted from the canonical source through the TypeScript AST, never hand-typed: for every
 * exported function component the walk collects the JSX attributes named `data-*` in that
 * function's own body (a literal string value is listed; an expression value — `data-size={size}`,
 * a conditional, `dataSlot ?? "button"` — records the literal branches it can see and otherwise
 * `values: []`, meaning "mirrors a prop or state"), plus the `--*` keys of object-literal `style`
 * props. Attributes rendered by an unexported helper the part composes are attributed to the
 * helper, not the part — the contract records what a part's own function paints.
 *
 * The docs generate the Anatomy `data-slot` names and the API Reference "data attributes" table
 * from this field (`apps/docs/lib/generated-sections.ts`, `components/api-table.tsx`); this
 * verifier fails when the field drifts from the source, and `--write-data-attributes` resyncs it.
 */
function literalStrings(node) {
  if (!node) return [];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return [node.text];
  }
  if (ts.isParenthesizedExpression(node))
    return literalStrings(node.expression);
  if (ts.isConditionalExpression(node)) {
    return [
      ...literalStrings(node.whenTrue),
      ...literalStrings(node.whenFalse),
    ];
  }
  if (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  ) {
    return [...literalStrings(node.left), ...literalStrings(node.right)];
  }
  return [];
}

function collectDataAttributes(fn, sourceFile, into) {
  const visit = (node) => {
    // Nested function components are their own parts (or private helpers); do not descend.
    if (
      node !== fn &&
      (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node))
    ) {
      return;
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (name.startsWith("data-")) {
        const entry = into.attributes.get(name) ?? new Set();
        into.attributes.set(name, entry);
        if (node.initializer) {
          const values = ts.isJsxExpression(node.initializer)
            ? literalStrings(node.initializer.expression)
            : literalStrings(node.initializer);
          for (const value of values) entry.add(value);
        }
      }
      if (
        name === "style" &&
        node.initializer &&
        ts.isJsxExpression(node.initializer)
      ) {
        let expression = node.initializer.expression;
        while (
          expression &&
          (ts.isAsExpression(expression) ||
            ts.isParenthesizedExpression(expression))
        ) {
          expression = expression.expression;
        }
        if (expression && ts.isObjectLiteralExpression(expression)) {
          for (const property of expression.properties) {
            if (!ts.isPropertyAssignment(property)) continue;
            const key = property.name;
            const text = ts.isComputedPropertyName(key)
              ? literalStrings(key.expression)[0]
              : ts.isStringLiteral(key)
                ? key.text
                : undefined;
            if (text?.startsWith("--")) into.cssVariables.add(text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(fn);
}

function computeDataAttributes(record) {
  const result = {};
  for (const path of record.sourceFiles.filter((candidate) =>
    /\.tsx$/.test(candidate),
  )) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) continue;
    const sourceFile = ts.createSourceFile(
      path,
      readFileSync(absolute, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    for (const statement of sourceFile.statements) {
      if (
        !ts.isFunctionDeclaration(statement) ||
        !statement.name ||
        !statement.body
      ) {
        continue;
      }
      const name = statement.name.text;
      const isPart = (record.publicSymbols ?? []).some(
        (symbol) => symbol.name === name && symbol.kind === "component",
      );
      if (!isPart) continue;
      const found = { attributes: new Map(), cssVariables: new Set() };
      collectDataAttributes(statement, sourceFile, found);
      if (found.attributes.size === 0 && found.cssVariables.size === 0)
        continue;
      result[name] = {
        attributes: [...found.attributes.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([attribute, values]) => ({
            name: attribute,
            values: sorted(values),
          })),
        cssVariables: sorted(found.cssVariables),
      };
    }
  }
  return result;
}

/**
 * The `dataAttributes` drift comparison, as one function so `--self-test` can prove it REJECTS a
 * drifted record. The reconciliation below calls it; nothing else compares the two.
 */
function dataAttributesProblem(record, expected) {
  if (
    JSON.stringify(record.dataAttributes ?? null) === JSON.stringify(expected)
  ) {
    return null;
  }
  return `component ${record.name}: dataAttributes is stale — run node tooling/verify-component-contracts.mjs --write-data-attributes`;
}

/**
 * `--self-test` — the NEGATIVE proof for the extraction gate.
 *
 * The reconciliation's own green run only shows that the contract currently matches the source.
 * It says nothing about whether a mismatch would be CAUGHT, and a gate never observed failing is
 * an assumption (AGENTS.md § Verification). So this drifts a real component record in
 * memory — four ways, each a distinct shape of rot — and requires every one to be rejected, then
 * requires the pristine record to pass.
 *
 *   node tooling/verify-component-contracts.mjs --self-test
 */
function selfTest() {
  const components = contracts.components ?? [];
  const subject = components.find(
    (record) =>
      Object.keys(computeDataAttributes(record)).length > 0 &&
      Object.values(computeDataAttributes(record)).some(
        (part) => part.attributes.length > 0,
      ),
  );
  if (!subject) {
    console.error(
      "✗ verify-component-contracts self-test: no component record yields extractable dataAttributes — the extractor is not being exercised",
    );
    process.exit(1);
  }
  const expected = computeDataAttributes(subject);
  const part = Object.keys(expected).find(
    (name) => expected[name].attributes.length > 0,
  );

  const clone = () => JSON.parse(JSON.stringify(expected));
  const drifts = [
    [
      "an attribute the source no longer renders",
      (data) => {
        data[part].attributes.push({ name: "data-gone", values: [] });
      },
    ],
    [
      "an attribute the source renders and the contract dropped",
      (data) => {
        data[part].attributes.shift();
      },
    ],
    [
      "a changed literal value",
      (data) => {
        data[part].attributes[0].values = ["not-what-the-source-says"];
      },
    ],
    [
      "a whole part the source no longer exports",
      (data) => {
        data.PartThatDoesNotExist = { attributes: [], cssVariables: [] };
      },
    ],
  ];

  for (const [label, drift] of drifts) {
    const data = clone();
    drift(data);
    const problem = dataAttributesProblem(
      { name: subject.name, dataAttributes: data },
      expected,
    );
    if (!problem) {
      console.error(
        `✗ verify-component-contracts self-test: "${label}" was NOT rejected`,
      );
      process.exit(1);
    }
  }

  if (
    dataAttributesProblem(
      { name: subject.name, dataAttributes: null },
      expected,
    ) === null
  ) {
    console.error(
      "✗ verify-component-contracts self-test: a MISSING dataAttributes field was not rejected",
    );
    process.exit(1);
  }

  if (
    dataAttributesProblem(
      { name: subject.name, dataAttributes: expected },
      expected,
    ) !== null
  ) {
    console.error(
      "✗ verify-component-contracts self-test: the pristine record was rejected",
    );
    process.exit(1);
  }

  console.log(
    `✓ verify-component-contracts self-test: dataAttributes drift on \`${subject.name}.${part}\` rejected in five shapes (added, dropped, changed value, phantom part, missing field); the extracted record accepted`,
  );
  process.exit(0);
}

if (process.argv.includes("--self-test")) selfTest();

function validateRichRecord(record, item, label) {
  assert(
    record && typeof record === "object",
    `${label}: record must be an object`,
  );
  if (!record || typeof record !== "object") return;
  assert(
    record.registryType === item.type,
    `${label}: registryType must be ${item.type}`,
  );
  assert(
    typeof record.family === "string" && record.family.length > 0,
    `${label}: missing family`,
  );
  assert(
    typeof record.wave === "string" && record.wave.length > 0,
    `${label}: missing wave`,
  );
  sameStrings(
    record.sourceFiles ?? [],
    registryFilePaths(item),
    `${label} sourceFiles`,
  );
  for (const path of record.sourceFiles ?? []) {
    assert(
      existsSync(join(root, path)),
      `${label}: source file is missing: ${path}`,
    );
  }

  assert(
    Array.isArray(record.publicSymbols) && record.publicSymbols.length > 0,
    `${label}: publicSymbols must be non-empty`,
  );
  sameStrings(
    (record.publicSymbols ?? []).map((symbol) => symbol.name),
    sourceExports(record.sourceFiles ?? []),
    `${label} public symbols`,
  );
  for (const symbol of record.publicSymbols ?? []) {
    assert(
      typeof symbol.kind === "string" && symbol.kind.length > 0,
      `${label}/${symbol.name}: missing symbol kind`,
    );
    assert(
      symbol.ref && typeof symbol.ref.status === "string",
      `${label}/${symbol.name}: missing ref status`,
    );
    assert(
      typeof symbol.ref?.target === "string" ||
        typeof symbol.ref?.rationale === "string",
      `${label}/${symbol.name}: ref needs a target or rationale`,
    );
  }

  for (const dimension of ["variants", "sizes"]) {
    const value = record[dimension];
    assert(
      value && typeof value.status === "string",
      `${label}: missing ${dimension} status`,
    );
    assert(
      Array.isArray(value?.dimensions),
      `${label}: ${dimension}.dimensions must be an array`,
    );
    assert(
      (value?.dimensions?.length ?? 0) > 0 ||
        typeof value?.rationale === "string",
      `${label}: empty ${dimension} needs a rationale`,
    );
  }

  for (const stateKind of ["behavior", "accessibility", "visual"]) {
    const state = record.states?.[stateKind];
    assert(
      state && typeof state.status === "string",
      `${label}: missing states.${stateKind}.status`,
    );
    assert(
      Array.isArray(state?.values) && state.values.length > 0,
      `${label}: states.${stateKind}.values must be non-empty`,
    );
    assert(
      typeof state?.evidence === "string",
      `${label}: states.${stateKind} needs evidence`,
    );
  }
  assert(
    record.responsive && typeof record.responsive.status === "string",
    `${label}: missing responsive status`,
  );
  assert(
    Array.isArray(record.responsive?.risks),
    `${label}: responsive.risks must be an array`,
  );
  assert(
    typeof record.responsive?.rationale === "string",
    `${label}: responsive needs a rationale`,
  );
  assert(
    record.motion && typeof record.motion.status === "string",
    `${label}: missing motion status`,
  );
  assert(
    Array.isArray(record.motion?.mechanisms),
    `${label}: motion.mechanisms must be an array`,
  );
  assert(
    typeof record.motion?.reducedMotion?.status === "string",
    `${label}: missing reduced-motion status`,
  );
  assert(
    typeof record.motion?.reducedMotion?.rationale === "string",
    `${label}: reduced motion needs a rationale`,
  );
  assert(Array.isArray(record.engines), `${label}: engines must be an array`);
  sameStrings(
    (record.engines ?? []).map((engine) => engine.package),
    expectedEnginePackages(item.dependencies),
    `${label} engines`,
  );
  for (const engine of record.engines ?? []) {
    assert(
      typeof engine.role === "string" && engine.role.length > 0,
      `${label}/${engine.package}: engine role is required`,
    );
  }
  assert(
    typeof record.docsSlug === "string" && record.docsSlug.startsWith("/"),
    `${label}: invalid docsSlug`,
  );
  sameStrings(
    record.registryDependencies ?? [],
    item.registryDependencies ?? [],
    `${label} registryDependencies`,
  );
  sameStrings(
    record.npmDependencies ?? [],
    item.dependencies ?? [],
    `${label} npmDependencies`,
  );

  assert(
    Array.isArray(record.testFiles) && record.testFiles.length > 0,
    `${label}: testFiles must be non-empty`,
  );
  for (const path of record.testFiles ?? []) {
    assert(
      existsSync(join(root, path)),
      `${label}: test file is missing: ${path}`,
    );
  }
  assert(
    record.coverage && typeof record.coverage === "object",
    `${label}: missing coverage model`,
  );
}

assert(contracts.schemaVersion === 1, "schemaVersion must be 1");
assert(
  contracts.kind === "vegastack-component-contract-inventory",
  "unexpected inventory kind",
);

const expectedWaves = {
  "Core controls": 24,
  "Forms/editing": 23,
  "Navigation/layout": 14,
  Overlays: 14,
  "Data display": 12,
  "Content/marketing": 23,
  "AI/chat": 6,
};
// The homepage renames three waves for display. The map is the only hand-maintained coupling
// between the contract's wave keys and `home-component-catalog.generated.ts`; an unmapped wave is a
// hard failure rather than a silent skip.
const HOME_WAVE_TITLES = {
  "Core controls": "Core controls",
  "Forms/editing": "Forms & editing",
  "Navigation/layout": "Navigation & layout",
  Overlays: "Overlays",
  "Data display": "Data display",
  "Content/marketing": "Content & marketing",
  "AI/chat": "AI & chat",
};

const expectedComponentWaveMembers = {
  "Core controls": [
    "button",
    "icon-button",
    "copy-button",
    "notification-bell",
    "badge",
    "avatar",
    "label",
    "input",
    "textarea",
    "checkbox",
    "checkbox-group",
    "radio-group",
    "switch",
    "slider",
    "progress",
    "separator",
    "skeleton",
    "spinner",
    "status-icon",
    "kbd",
    "relative-time",
    "animated-number",
    "toggle",
    "toggle-group",
  ],
  "Forms/editing": [
    "field",
    "field-inline",
    "settings-row",
    "auto-save-input",
    "password-input",
    "otp-input",
    "color-picker",
    "select",
    "combobox",
    "country-select",
    "region-select",
    "searchable-select",
    "date-picker",
    "filter-bar",
    "tag-group",
    "text-edit",
    "segmented",
    "editable-cell",
    "number-field",
    "chip-input",
    "filter-bar-managed",
    "sortable-list",
    "dropzone",
  ],
  "Navigation/layout": [
    "accordion",
    "breadcrumb",
    "collapsible",
    "command",
    "pagination",
    "tabs",
    "sidebar",
    "navigation-menu",
    "app-shell",
    "resizable",
    "scroll-area",
    "split-button",
    "stepper",
    "board",
  ],
  Overlays: [
    "floating-surface",
    "alert-dialog",
    "dialog",
    "sheet",
    "popover",
    "hover-card",
    "tooltip",
    "dropdown-menu",
    "context-menu",
    "emoji-picker",
    "toast",
    "provider",
    "action-bar",
    "shortcut-overlay",
  ],
  "Data display": [
    "card",
    "chip",
    "table",
    "data-table-parts",
    "data-list",
    "data-grid",
    "chart",
    "comparison-matrix",
    "property-list",
    "stat",
    "progress-indicator",
    "timeline",
  ],
  "Content/marketing": [
    "alert",
    "empty",
    "truncated-text",
    "image",
    "audio-player",
    "video-player",
    "onboarding-checklist",
    "markdown-view",
    "code-block",
    "page-header",
    "item",
    "marketing-surface",
    "media-player-controls",
    "section-header",
    "figure-frame",
    "terminal",
    "logo-row",
    "testimonial",
    "announcement-banner",
    "ruled-band",
    "pricing-section",
    "staggered-text-reveal",
    "particle-field",
  ],
  "AI/chat": [
    "marker",
    "message",
    "bubble",
    "message-scroller",
    "attachment",
    "tool-call-chip",
  ],
};
for (const [wave, count] of Object.entries(expectedWaves)) {
  assert(
    contracts.expectedWaveCounts?.[wave] === count,
    `expectedWaveCounts[${wave}] must be ${count}`,
  );
  sameStrings(
    contracts.expectedWaveMembers?.[wave] ?? [],
    expectedComponentWaveMembers[wave],
    `expectedWaveMembers[${wave}]`,
  );
}

assert(Array.isArray(registry.items), "registry.items must be an array");
const registryNames = registry.items.map((item) => item.name);
assert(
  new Set(registryNames).size === registryNames.length,
  "registry item names must be unique",
);
const registryByName = new Map(registry.items.map((item) => [item.name, item]));

const registryIcons = registry.items.filter(isGeneratedAnimatedIcon);
const registryComponents = registry.items.filter(
  (item) => item.type === "registry:ui" && !isGeneratedAnimatedIcon(item),
);
const registryHooks = registry.items.filter(
  (item) => item.type === "registry:hook",
);
const registryBlocks = registry.items.filter(
  (item) => item.type === "registry:block",
);
// `registry:lib` — a pure data/helper module with no React in it, installed under the consumer's
// `lib` alias. It renders nothing, so it carries no docs page, preview, VRT route or wave.
const registryLibs = registry.items.filter(
  (item) => item.type === "registry:lib",
);

// ── the inventory counts, DERIVED ───────────────────────────────────────────────────────────────
//
// These were five hardcoded literals, so adding a component meant editing a gate script — and a
// literal that has to be edited by hand is a literal that can be edited WRONG. O1 (#66) found
// `components: 111` committed against `totalRegistryItems: 559` on a tree whose real partition was
// 112 + 439 + 7 + 1; the arithmetic did not close, and nothing noticed, because each number was
// only ever compared against a copy of itself.
//
// `packages/ui/registry.json` is the machine authority for inventory (AGENTS.md § Truth hierarchy,
// rank 2), so the counts are read off its partition and every consumer below is reconciled against
// THAT. The gate still fails closed in both directions — the contract file, the generated home
// catalog, the icon gallery, the animated-icon manifest and § Numbers must all agree with the
// registry — but it no longer holds an opinion of its own that can drift away from it.
const expected = {
  totalRegistryItems: registry.items.length,
  components: registryComponents.length,
  animatedIcons: registryIcons.length,
  hooks: registryHooks.length,
  blocks: registryBlocks.length,
  libs: registryLibs.length,
};

// The partition must be exhaustive: an item that is none of the five kinds would otherwise be
// counted in the total and in nothing else, which is the shape of O1's defect. `registry:lib`
// arrived on main while this change was in flight and is exactly the event this assertion is for.
assert(
  expected.components +
    expected.animatedIcons +
    expected.hooks +
    expected.blocks +
    expected.libs ===
    expected.totalRegistryItems,
  `registry.json partition does not close: ${expected.components} components + ` +
    `${expected.animatedIcons} animated icons + ${expected.hooks} hooks + ${expected.blocks} ` +
    `blocks + ${expected.libs} libs = ${expected.components + expected.animatedIcons + expected.hooks + expected.blocks + expected.libs}, ` +
    `but the registry holds ${expected.totalRegistryItems} items. Some item is of a kind this ` +
    `gate does not model.`,
);

// `component-contracts.json` is the OTHER authority (inventory membership); it must agree with the
// registry item for item. This is the assertion that corrupting registry.json's item list trips.
for (const [key, value] of Object.entries(expected)) {
  assert(
    contracts.expectedCounts?.[key] === value,
    `expectedCounts.${key} is ${contracts.expectedCounts?.[key]} but packages/ui/registry.json ` +
      `holds ${value}. Run \`pnpm design:derived\`; if the registry itself is wrong, fix it there.`,
  );
}
assert(
  registryComponents.some((item) => item.name === "icon-button"),
  "icon-button must be modeled as a component",
);
assert(
  !registryIcons.some((item) => item.name === "icon-button"),
  "icon-button must not be modeled as an animated icon",
);

const components = contracts.components ?? [];
const icons = contracts.animatedIcons?.members ?? [];
const hooks = contracts.hooks ?? [];
const blocks = contracts.blocks ?? [];
const libs = contracts.libs ?? [];
assert(
  components.length === expected.components,
  `contracts.components must contain ${expected.components} records`,
);
assert(
  icons.length === expected.animatedIcons,
  `animatedIcons.members must contain ${expected.animatedIcons} records`,
);
assert(
  hooks.length === expected.hooks,
  `contracts.hooks must contain ${expected.hooks} records`,
);
assert(
  blocks.length === expected.blocks,
  `contracts.blocks must contain ${expected.blocks} record`,
);
assert(
  libs.length === expected.libs,
  `contracts.libs must contain ${expected.libs} record`,
);

const modeled = [...components, ...icons, ...hooks, ...blocks, ...libs];
const modeledNames = modeled.map((record) => record.name);
assert(
  modeledNames.length === expected.totalRegistryItems,
  `modeled total must be ${expected.totalRegistryItems}`,
);
assert(
  new Set(modeledNames).size === modeledNames.length,
  "every modeled item name must be globally unique",
);
sameStrings(modeledNames, registryNames, "modeled/registry item names");

const waveCounts = Object.fromEntries(
  Object.keys(expectedWaves).map((wave) => [wave, 0]),
);
for (const record of components) {
  const item = registryByName.get(record.name);
  assert(
    item && registryComponents.includes(item),
    `component ${record.name} does not map to a registry component`,
  );
  if (!item) continue;
  validateRichRecord(record, item, `component ${record.name}`);
  // Canon row 0's `status` and `since` live here and are written onto the page by
  // `tooling/sync-component-derived.mjs`. The vocabulary is checked once, at the authority.
  assert(
    ["stable", "preview", "deprecated"].includes(record.status),
    `component ${record.name}: status must be stable | preview | deprecated (found ${JSON.stringify(record.status)})`,
  );
  assert(
    typeof record.since === "string" && /^\d+\.\d+\.\d+$/.test(record.since),
    `component ${record.name}: since must be a semver version (found ${JSON.stringify(record.since)})`,
  );
  const expectedDataAttributes = computeDataAttributes(record);
  if (writeDataAttributes) {
    record.dataAttributes = expectedDataAttributes;
  } else {
    const drift = dataAttributesProblem(record, expectedDataAttributes);
    if (drift) fail(drift);
  }
  if (record.wave in waveCounts) waveCounts[record.wave]++;
  else fail(`component ${record.name}: unknown wave ${record.wave}`);

  const docsFile = join(root, "apps/docs/content", `${record.docsSlug}.mdx`);
  assert(
    existsSync(docsFile),
    `component ${record.name}: docs page missing for ${record.docsSlug}`,
  );
  const previewFile = join(
    root,
    "apps/docs/components/preview",
    `${record.previewModule}.tsx`,
  );
  assert(
    existsSync(previewFile),
    `component ${record.name}: preview module missing: ${record.previewModule}.tsx`,
  );
  if (existsSync(docsFile) && existsSync(previewFile)) {
    const docsSource = readFileSync(docsFile, "utf8");
    // The page's SECTIONS are `tooling/content-lint.mjs`'s job — it owns `design.md` § Docs canon
    // (vocabulary, order, the tail rule, generated-not-typed) and proves each rule fails on a
    // fixture. A second heading list here could only drift out of agreement with it. What stays
    // here is what only the contract can check: that the page renders a real preview, and that the
    // preview export the frontmatter names exists.
    assert(
      docsSource.includes("<ComponentPreview"),
      `component ${record.name}: Examples must include a rendered ComponentPreview`,
    );
    const previewName = docsSource.match(
      /^preview:\s*([A-Za-z_$][\w$]*)\s*$/m,
    )?.[1];
    assert(
      Boolean(previewName),
      `component ${record.name}: docs frontmatter is missing its preview export name`,
    );
    if (previewName) {
      const previewSource = readFileSync(previewFile, "utf8");
      assert(
        /^\s*(['"])use client\1;/m.test(previewSource),
        `component ${record.name}: preview module must declare 'use client'`,
      );
      const exported = new RegExp(
        `\\bexport\\s+(?:async\\s+)?(?:function|const)\\s+${previewName}\\b`,
      );
      assert(
        exported.test(previewSource),
        `component ${record.name}: ${record.previewModule}.tsx does not export ${previewName}`,
      );
    }
  }
  const testSource = (record.testFiles ?? [])
    .map((path) => readFileSync(join(root, path), "utf8"))
    .join("\n");
  assert(
    testSource.includes("expectNoA11yViolations"),
    `component ${record.name}: browser test lacks the axe helper`,
  );
}
for (const [wave, count] of Object.entries(expectedWaves)) {
  assert(
    waveCounts[wave] === count,
    `${wave} must contain ${count} components; received ${waveCounts[wave]}`,
  );
  sameStrings(
    components
      .filter((record) => record.wave === wave)
      .map((record) => record.name),
    expectedComponentWaveMembers[wave],
    `${wave} component membership`,
  );
}
sameStrings(
  contracts.expectedWaveMembers?.Hooks ?? [],
  [
    "use-animation-replay",
    "use-announcer",
    "use-drag-reorder",
    "use-inline-edit",
    "use-file-drop",
    "use-list-nav",
    "use-media-query",
    "use-mobile",
    "use-overflow",
    "use-platform",
  ],
  "Hooks membership",
);
sameStrings(
  contracts.expectedWaveMembers?.Block ?? [],
  ["dashboard-01"],
  "Block membership",
);
assert(
  contracts.expectedWaveMembers?.["Animated icons"] ===
    "packages/ui/animated-icon-sources.json",
  "Animated icons membership must be sourced from packages/ui/animated-icon-sources.json",
);
assert(
  contracts.expectedWaveCounts?.Hooks === 10,
  "expectedWaveCounts.Hooks must be 10",
);
assert(
  contracts.expectedWaveCounts?.Block === 1,
  "expectedWaveCounts.Block must be 1",
);
// DERIVED, like `expectedCounts.animatedIcons` above: the count comes off `packages/ui/registry.json`,
// which is a different file from the `component-contracts.json` value being checked, so this
// reconciles two authorities rather than comparing a number with a copy of itself.
assert(
  contracts.expectedWaveCounts?.["Animated icons"] === registryIcons.length,
  `expectedWaveCounts[Animated icons] is ${contracts.expectedWaveCounts?.["Animated icons"]} but ` +
    `packages/ui/registry.json holds ${registryIcons.length} animated icons`,
);

const sharedIcon = contracts.animatedIcons?.sharedContract;
assert(
  sharedIcon && sharedIcon.generated === true,
  "animatedIcons.sharedContract.generated must be true",
);
assert(
  sharedIcon?.family === "animated-icon",
  "animated icon shared family must be animated-icon",
);
assert(
  sharedIcon?.wave === "Animated icons",
  "animated icon shared wave must be Animated icons",
);
assert(
  sharedIcon?.ref?.target === "animation handle",
  "animated icon shared ref target must be animation handle",
);
assert(
  Array.isArray(sharedIcon?.publicSymbolShape),
  "animated icon publicSymbolShape must be an array",
);
assert(
  Array.isArray(sharedIcon?.engines) &&
    sharedIcon.engines.some((engine) => engine.package === "motion"),
  "animated icons must model the motion engine",
);
assert(
  typeof sharedIcon?.motion?.reducedMotion?.status === "string",
  "animated icon shared contract needs reduced-motion status",
);
assert(
  typeof sharedIcon?.motion?.reducedMotion?.rationale === "string",
  "animated icon shared contract needs reduced-motion rationale",
);
assert(
  sharedIcon?.motion?.reducedMotion?.status === "intrinsic",
  "animated icons must implement intrinsic reduced motion",
);
assert(
  sharedIcon?.sizes?.dimensions?.some((dimension) =>
    dimension.values?.some((value) => value.includes("var(--icon-default)")),
  ),
  "animated icons must model the tokenized default size",
);
sameStrings(
  sharedIcon?.registryDependencies ?? [],
  [],
  "animated icon shared registryDependencies",
);
sameStrings(
  sharedIcon?.npmDependencies ?? [],
  ["motion@^13.2.0", "@vegastack/design@^0.1.0"],
  "animated icon shared npmDependencies",
);

for (const member of icons) {
  const item = registryByName.get(member.name);
  assert(
    item && registryIcons.includes(item),
    `animated icon ${member.name} does not map to a generated icon registry item`,
  );
  if (!item) continue;
  const paths = registryFilePaths(item);
  assert(
    member.sourceFile === paths[0],
    `animated icon ${member.name}: sourceFile must match registry`,
  );
  assert(
    existsSync(join(root, member.sourceFile)),
    `animated icon ${member.name}: source is missing`,
  );
  sameStrings(
    member.publicSymbols ?? [],
    sourceExports([member.sourceFile]),
    `animated icon ${member.name} public symbols`,
  );
}
const animatedSourceManifest = readJson(
  "packages/ui/animated-icon-sources.json",
);
assert(
  animatedSourceManifest.itemCount === expected.animatedIcons &&
    animatedSourceManifest.items?.length === expected.animatedIcons,
  `animated-icon source manifest must contain all ${expected.animatedIcons} items`,
);
sameStrings(
  animatedSourceManifest.items?.map((item) => `icon-${item.name}`) ?? [],
  icons.map((member) => member.name),
  "animated-icon source manifest membership",
);
for (const item of animatedSourceManifest.items ?? []) {
  assert(
    item.license === "MIT",
    `animated icon ${item.name}: license must be MIT`,
  );
  assert(
    /^https:\/\/lucide-animated\.com\/r\/.+\.json$/.test(item.url),
    `animated icon ${item.name}: invalid upstream URL`,
  );
  assert(
    /^[a-f0-9]{64}$/.test(item.sha256),
    `animated icon ${item.name}: invalid upstream SHA-256`,
  );
}
const animatedBrowserTest = readFileSync(
  join(root, "packages/ui/registry/ui/animated-icons.test.tsx"),
  "utf8",
);
assert(
  animatedBrowserTest.includes("import.meta.glob") &&
    animatedBrowserTest.includes(`toHaveLength(${expected.animatedIcons})`) &&
    animatedBrowserTest.includes("prefers-reduced-motion"),
  "animated-icon browser test must eagerly import all members and verify reduced motion",
);

for (const record of hooks) {
  const item = registryByName.get(record.name);
  assert(
    item && registryHooks.includes(item),
    `hook ${record.name} does not map to a registry hook`,
  );
  if (!item) continue;
  validateRichRecord(record, item, `hook ${record.name}`);
}

for (const record of libs) {
  const item = registryByName.get(record.name);
  assert(
    item && registryLibs.includes(item),
    `lib ${record.name} does not map to a registry lib`,
  );
  if (!item) continue;
  validateRichRecord(record, item, `lib ${record.name}`);
}

for (const record of blocks) {
  const item = registryByName.get(record.name);
  assert(
    item && registryBlocks.includes(item),
    `block ${record.name} does not map to a registry block`,
  );
  if (!item) continue;
  validateRichRecord(record, item, `block ${record.name}`);
  const docsFile = join(root, "apps/docs/content", `${record.docsSlug}.mdx`);
  assert(
    existsSync(docsFile),
    `block ${record.name}: docs page missing for ${record.docsSlug}`,
  );
  assert(
    existsSync(
      join(root, "apps/docs/components/preview", `${record.previewModule}.tsx`),
    ),
    `block ${record.name}: preview module missing`,
  );
  const testSource = (record.testFiles ?? [])
    .map((path) => readFileSync(join(root, path), "utf8"))
    .join("\n");
  assert(
    testSource.includes("expectNoA11yViolations"),
    `block ${record.name}: browser test lacks the axe helper`,
  );
}

// Canonical source parity: no unregistered non-test implementation may hide beside the modeled
// files. Generated icon mirrors are reconciled separately from top-level components/hooks.
const topLevelCanonical = readdirSync(join(root, "packages/ui/registry/ui"), {
  withFileTypes: true,
})
  .filter(
    (entry) =>
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.tsx?$/.test(entry.name),
  )
  .map((entry) => `packages/ui/registry/ui/${entry.name}`);
const modeledTopLevel = [...components, ...hooks]
  .flatMap((record) => record.sourceFiles)
  .filter((path) => /^packages\/ui\/registry\/ui\/[^/]+\.tsx?$/.test(path));
sameStrings(
  modeledTopLevel,
  topLevelCanonical,
  "top-level canonical source inventory",
);
// The same parity for `registry:lib` sources. `utils.ts` is the repo-local `@/lib/utils` shim
// (a re-export of `cn` so canonical sources resolve in-tree) — never a registry item, never
// shipped, so it is the one exempt file here.
const canonicalLibFiles = readdirSync(join(root, "packages/ui/registry/lib"), {
  withFileTypes: true,
})
  .filter(
    (entry) =>
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.tsx?$/.test(entry.name) &&
      entry.name !== "utils.ts",
  )
  .map((entry) => `packages/ui/registry/lib/${entry.name}`);
sameStrings(
  libs.flatMap((record) => record.sourceFiles),
  canonicalLibFiles,
  "canonical registry:lib source inventory",
);
const iconFiles = readdirSync(join(root, "packages/ui/registry/ui/icons"))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => `packages/ui/registry/ui/icons/${name}`);
sameStrings(
  icons.map((member) => member.sourceFile),
  iconFiles,
  "animated-icon source inventory",
);
// The shared walker (tooling/lib/fs.mjs) rather than a private one: it fails closed on an
// unreadable root and never follows a symlink, so a moved blocks tree cannot read as "no drift".
const blockFiles = walk(join(root, "packages/ui/registry/blocks"), {
  include: (relative) => !/\.test\.tsx?$/.test(relative),
}).map((absolute) => relativeToRoot(absolute));
sameStrings(
  blocks.flatMap((record) => record.sourceFiles),
  blockFiles,
  "block source inventory",
);

// Docs navigation and the preview barrel must cover every applicable modeled page exactly once.
const componentNav = readJson(
  "apps/docs/content/docs/components/meta.json",
).pages.filter((page) => !page.startsWith("---"));
const componentDocNames = components.map((record) =>
  record.docsSlug.split("/").at(-1),
);
assert(
  new Set(componentNav).size === componentNav.length,
  "component navigation contains duplicate pages",
);
sameStrings(componentNav, componentDocNames, "component docs navigation");
const blockNav = readJson(
  "apps/docs/content/docs/blocks/meta.json",
).pages.filter((page) => !page.startsWith("---"));
sameStrings(
  blockNav,
  blocks.map((record) => record.docsSlug.split("/").at(-1)),
  "block docs navigation",
);

const previewIndex = readFileSync(
  join(root, "apps/docs/components/preview/index.tsx"),
  "utf8",
);
const previewExports = [
  ...previewIndex.matchAll(/export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g),
].map((match) => match[1]);
assert(
  new Set(previewExports).size === previewExports.length,
  "preview index contains duplicate exports",
);
for (const record of [...components, ...blocks]) {
  assert(
    previewExports.includes(record.previewModule),
    `${record.name}: preview index does not export ${record.previewModule}`,
  );
}
const allowedPreviewInfrastructure = new Set(["index", "utilities", "wrapper"]);
const previewFiles = readdirSync(join(root, "apps/docs/components/preview"))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => name.replace(/\.tsx$/, ""))
  .filter((name) => !allowedPreviewInfrastructure.has(name));
sameStrings(
  previewFiles,
  [...components, ...blocks].map((record) => record.previewModule),
  "preview module inventory",
);

// The homepage catalog is a contract-derived build output, and until WP4 nothing
// reconciled it: a generator mutated to drop a component, mis-group one, or emit a wrong title
// passed `verify-component-contracts.mjs`, `design:derived:check` (which skips build outputs) and
// docs lint alike. It is asserted here on the same terms as the route lists above — regenerated by
// `ensureBuildOutputs({ force: true })` at the top of this file, then reconciled against
// `expectedWaveMembers` / `expectedCounts`, so the check catches the GENERATOR, not a stale file.
const homeCatalogSource = readFileSync(
  join(root, "apps/docs/lib/home-component-catalog.generated.ts"),
  "utf8",
);
const homeGroupsMatch = homeCatalogSource.match(
  /export const HOME_COMPONENT_GROUPS = ([\s\S]*?) as const;/,
);
assert(Boolean(homeGroupsMatch), "could not parse HOME_COMPONENT_GROUPS");
const homeGroups = homeGroupsMatch ? JSON.parse(homeGroupsMatch[1]) : [];
for (const [constant, value] of [
  ["HOME_TOTAL_REGISTRY_ITEM_COUNT", expected.totalRegistryItems],
  ["HOME_COMPONENT_COUNT", expected.components],
  ["HOME_ANIMATED_ICON_COUNT", expected.animatedIcons],
  ["HOME_HOOK_COUNT", expected.hooks],
  ["HOME_BLOCK_COUNT", expected.blocks],
]) {
  assert(
    new RegExp(`export const ${constant} = ${value};`).test(homeCatalogSource),
    `generated home catalog: ${constant} must be ${value}`,
  );
}
sameStrings(
  homeGroups.map((group) => group.title),
  Object.keys(expectedWaves).map((wave) => HOME_WAVE_TITLES[wave]),
  "generated home catalog wave groups",
);
const componentByName = new Map(
  components.map((record) => [record.name, record]),
);
const homeCatalogNames = [];
for (const [wave] of Object.entries(expectedWaves)) {
  const group = homeGroups.find(
    (candidate) => candidate.title === HOME_WAVE_TITLES[wave],
  );
  assert(Boolean(group), `generated home catalog is missing wave ${wave}`);
  if (!group) continue;
  sameStrings(
    group.components.map((entry) => entry.name),
    contracts.expectedWaveMembers?.[wave] ?? [],
    `generated home catalog membership [${wave}]`,
  );
  assert(
    group.components.length === contracts.expectedWaveCounts?.[wave],
    `generated home catalog [${wave}] must list ${contracts.expectedWaveCounts?.[wave]} components; received ${group.components.length}`,
  );
  for (const entry of group.components) {
    homeCatalogNames.push(entry.name);
    const record = componentByName.get(entry.name);
    assert(
      Boolean(record),
      `generated home catalog names an unmodeled component: ${entry.name}`,
    );
    if (!record) continue;
    assert(
      entry.title === record.title,
      `generated home catalog title for ${entry.name}: expected ${JSON.stringify(record.title)}, received ${JSON.stringify(entry.title)}`,
    );
    assert(
      entry.href === record.docsSlug,
      `generated home catalog href for ${entry.name}: expected ${record.docsSlug}, received ${entry.href}`,
    );
  }
}
assert(
  homeCatalogNames.length === expected.components &&
    new Set(homeCatalogNames).size === homeCatalogNames.length,
  `generated home catalog must list each of the ${expected.components} components exactly once; received ${homeCatalogNames.length} (${new Set(homeCatalogNames).size} unique)`,
);
sameStrings(
  homeCatalogNames,
  components.map((record) => record.name),
  "generated home catalog component inventory",
);

const iconDocsFile = join(
  root,
  "apps/docs/content",
  `${contracts.animatedIcons.sharedContract.docsSlug}.mdx`,
);
assert(existsSync(iconDocsFile), "shared animated-icon docs page is missing");
if (existsSync(iconDocsFile)) {
  const iconDocs = readFileSync(iconDocsFile, "utf8");
  assert(
    iconDocs.includes("<IconGallery"),
    "shared animated-icon docs page must render IconGallery",
  );
}
const generatedIconGallery = readFileSync(
  join(root, "apps/docs/components/animated-icon-gallery.generated.tsx"),
  "utf8",
);
const generatedIconImports = [
  ...generatedIconGallery.matchAll(
    /import\s+{\s*([A-Za-z_$][\w$]*Icon)\s*}\s+from\s+['"]@\/components\/ui\/icons\/([^'"]+)['"]/g,
  ),
];
assert(
  generatedIconImports.length === expected.animatedIcons,
  `generated icon gallery must import ${expected.animatedIcons} members; received ${generatedIconImports.length}`,
);
sameStrings(
  generatedIconImports.map((match) => match[2]),
  icons.map((member) => member.name.replace(/^icon-/, "")),
  "generated icon gallery membership",
);
const foundationNav = readJson(
  "apps/docs/content/docs/foundations/meta.json",
).pages.filter((page) => !page.startsWith("---"));
assert(
  foundationNav.includes("icons"),
  "foundations navigation is missing the shared Icons page",
);

const exemptions = contracts.modeledExemptions ?? [];
assert(
  Array.isArray(exemptions) && exemptions.length > 0,
  "modeledExemptions must be non-empty",
);
assert(
  new Set(exemptions.map((entry) => entry.id)).size === exemptions.length,
  "modeled exemption ids must be unique",
);
for (const exemption of exemptions) {
  assert(
    typeof exemption.id === "string" && exemption.id.length > 0,
    "modeled exemption needs an id",
  );
  assert(
    Array.isArray(exemption.appliesTo) && exemption.appliesTo.length > 0,
    `${exemption.id}: appliesTo must be non-empty`,
  );
  assert(
    typeof exemption.rationale === "string" && exemption.rationale.length > 0,
    `${exemption.id}: rationale is required`,
  );
}

let unknownStatuses = 0;
function countUnknownStatuses(value) {
  if (!value || typeof value !== "object") return;
  if (value.status === "unknown") unknownStatuses += 1;
  for (const child of Object.values(value)) countUnknownStatuses(child);
}
countUnknownStatuses(contracts);
assert(
  unknownStatuses === 0,
  `component contract must contain zero unknown statuses; received ${unknownStatuses}`,
);

if (writeDataAttributes) {
  const formatted = await prettier.format(JSON.stringify(contracts, null, 2), {
    parser: "json",
    filepath: join(root, contractsPath),
  });
  writeFileSync(join(root, contractsPath), formatted);
  console.log(
    `✓ verify-component-contracts: wrote dataAttributes for ${components.length} components — run pnpm design:derived next`,
  );
  process.exit(0);
}

if (problems.length > 0) {
  console.error(`✗ verify-component-contracts: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log("✓ verify-component-contracts: complete registry reconciliation");
console.log(
  `  inventory: ${modeledNames.length} unique items (${components.length} components + ${icons.length} animated icons + ${hooks.length} hooks + ${blocks.length} block + ${libs.length} libs)`,
);
console.log(
  `  component audit matrix: ${components.length}/${components.length} source + test + docs + nav + preview contracts reconciled`,
);
console.log(
  `  animated icons: ${icons.length}/${icons.length} exact generated members reconciled through the shared contract`,
);
console.log(`  modeled exemptions: ${exemptions.length}`);
for (const exemption of exemptions)
  console.log(`    - ${exemption.id}: ${exemption.rationale}`);
