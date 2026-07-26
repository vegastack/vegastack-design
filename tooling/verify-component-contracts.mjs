#!/usr/bin/env node

/**
 * Fail-closed reconciliation for packages/ui/component-contracts.json.
 *
 * The contract inventory is tooling metadata, not a consumer API. This verifier deliberately
 * derives the authoritative item classes from registry type + source path so `icon-button` can
 * never be mistaken for one of the generated `icon-*` mirrors.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const registry = readJson("packages/ui/registry.json");
const contracts = readJson("packages/ui/component-contracts.json");
const problems = [];

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

function registryFilePaths(item) {
  return (item.files ?? []).map((file) =>
    typeof file === "string" ? file : file.path,
  );
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
    if (dependency.startsWith("sonner")) packages.add("sonner");
    if (dependency.startsWith("next-themes")) packages.add("next-themes");
    if (dependency.startsWith("react-day-picker"))
      packages.add("react-day-picker");
    if (dependency.startsWith("react-markdown")) packages.add("react-markdown");
    if (dependency.startsWith("remark-gfm")) packages.add("remark-gfm");
  }
  return sorted(packages);
}

function isGeneratedAnimatedIcon(item) {
  return (
    item.type === "registry:ui" &&
    registryFilePaths(item).length === 1 &&
    registryFilePaths(item)[0].startsWith("packages/ui/registry/ui/icons/")
  );
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

const expected = {
  totalRegistryItems: 546,
  components: 102,
  animatedIcons: 439,
  hooks: 4,
  blocks: 1,
};
for (const [key, value] of Object.entries(expected)) {
  assert(
    contracts.expectedCounts?.[key] === value,
    `expectedCounts.${key} must be ${value}`,
  );
}

const expectedWaves = {
  "Core controls": 23,
  "Forms/editing": 19,
  "Navigation/layout": 13,
  Overlays: 12,
  "Data display": 9,
  "Content/marketing": 20,
  "AI/chat": 6,
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
    "date-picker",
    "filter-bar",
    "tag-group",
    "text-edit",
    "segmented",
    "editable-cell",
    "number-field",
    "chip-input",
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
  ],
  Overlays: [
    "alert-dialog",
    "dialog",
    "sheet",
    "popover",
    "hover-card",
    "tooltip",
    "dropdown-menu",
    "context-menu",
    "emoji-picker",
    "sonner",
    "provider",
    "action-bar",
  ],
  "Data display": [
    "card",
    "table",
    "data-list",
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
    "onboarding-checklist",
    "markdown-view",
    "code-block",
    "page-header",
    "item",
    "marketing-surface",
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
assert(
  registry.items.length === expected.totalRegistryItems,
  `registry must contain exactly ${expected.totalRegistryItems} items`,
);
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
assert(
  registryComponents.length === expected.components,
  `registry component count must be ${expected.components}`,
);
assert(
  registryIcons.length === expected.animatedIcons,
  `registry animated-icon count must be ${expected.animatedIcons}`,
);
assert(
  registryHooks.length === expected.hooks,
  `registry hook count must be ${expected.hooks}`,
);
assert(
  registryBlocks.length === expected.blocks,
  `registry block count must be ${expected.blocks}`,
);
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

const modeled = [...components, ...icons, ...hooks, ...blocks];
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
    for (const heading of [
      "Installation",
      "Usage",
      "Examples",
      "Accessibility",
      "Do / Don't",
    ]) {
      assert(
        docsSource.includes(`## ${heading}`),
        `component ${record.name}: docs page is missing the exact \"## ${heading}\" section`,
      );
    }
    assert(
      docsSource.includes("## API Reference") ||
        docsSource.includes("<!-- api-reference-exemption:"),
      `component ${record.name}: docs page needs \"## API Reference\" or an explicit api-reference-exemption`,
    );
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
  ["use-animation-replay", "use-list-nav", "use-mobile", "use-platform"],
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
  contracts.expectedWaveCounts?.Hooks === 4,
  "expectedWaveCounts.Hooks must be 4",
);
assert(
  contracts.expectedWaveCounts?.Block === 1,
  "expectedWaveCounts.Block must be 1",
);
assert(
  contracts.expectedWaveCounts?.["Animated icons"] === 439,
  "expectedWaveCounts[Animated icons] must be 439",
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
  ["motion@^12.42.2", "@vegastack/design@^0.1.0"],
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
  "animated-icon source manifest must contain all 439 items",
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
const iconFiles = readdirSync(join(root, "packages/ui/registry/ui/icons"))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => `packages/ui/registry/ui/icons/${name}`);
sameStrings(
  icons.map((member) => member.sourceFile),
  iconFiles,
  "animated-icon source inventory",
);
const blockFiles = [];
function walkBlock(path) {
  for (const entry of readdirSync(join(root, path), { withFileTypes: true })) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) walkBlock(child);
    else if (!/\.test\.tsx?$/.test(entry.name)) blockFiles.push(child);
  }
}
walkBlock("packages/ui/registry/blocks");
sameStrings(
  blocks.flatMap((record) => record.sourceFiles),
  blockFiles,
  "block source inventory",
);

// Docs navigation, preview barrel, and VRT must cover every applicable modeled page exactly once.
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

const vrtSource = readFileSync(
  join(root, "apps/docs/vrt/components.spec.ts"),
  "utf8",
);
const vrtPageRoutesSource = readFileSync(
  join(root, "apps/docs/vrt/page-routes.ts"),
  "utf8",
);
const generatedRouteSource = readFileSync(
  join(root, "apps/docs/vrt/contract-routes.generated.ts"),
  "utf8",
);
function parseGeneratedRoutes(name) {
  const match = generatedRouteSource.match(
    new RegExp(`export const ${name} = (\\[[\\s\\S]*?\\]) as const;`),
  );
  assert(Boolean(match), `could not parse generated ${name}`);
  return match ? JSON.parse(match[1]) : [];
}
const generatedComponentRoutes = parseGeneratedRoutes("COMPONENT_ROUTES");
const generatedBlockRoutes = parseGeneratedRoutes("BLOCK_ROUTES");
sameStrings(
  generatedComponentRoutes,
  components.map((record) => record.docsSlug),
  "generated component VRT routes",
);
sameStrings(
  generatedBlockRoutes,
  blocks.map((record) => record.docsSlug),
  "generated block VRT routes",
);
assert(
  vrtSource.includes("VRT_PAGE_ROUTES"),
  "VRT capture spec must consume the shared page-route authority",
);
assert(
  vrtPageRoutesSource.includes("...COMPONENT_ROUTES") &&
    vrtPageRoutesSource.includes("...BLOCK_ROUTES"),
  "shared VRT page routes must consume both generated contract route lists",
);
assert(
  vrtSource.includes("VRT — component fixtures") &&
    /maxDiffPixels:\s*0/.test(vrtSource),
  "VRT must include element-scoped component fixtures at maxDiffPixels: 0",
);
const pagesMatch = vrtPageRoutesSource.match(
  /export\s+const\s+VRT_PAGE_ROUTES\s*=\s*\[([\s\S]*?)\]\s+as\s+const;/,
);
assert(Boolean(pagesMatch), "could not parse shared VRT page routes");
const supplementalVrtPages = pagesMatch
  ? [...pagesMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1])
  : [];
const vrtPages = [
  ...supplementalVrtPages,
  ...generatedComponentRoutes,
  ...generatedBlockRoutes,
];
assert(
  new Set(vrtPages).size === vrtPages.length,
  "shared VRT page routes contain duplicates",
);
for (const record of [...components, ...blocks]) {
  assert(
    vrtPages.includes(record.docsSlug),
    `${record.name}: shared VRT page routes are missing ${record.docsSlug}`,
  );
}
assert(
  vrtPages.includes(contracts.animatedIcons.sharedContract.docsSlug),
  "shared VRT page routes are missing the animated-icon docs route",
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
const generatedIconVrt = readFileSync(
  join(root, "apps/docs/vrt/icon-chunks.generated.ts"),
  "utf8",
);
assert(
  generatedIconVrt.includes(`ANIMATED_ICON_COUNT = ${expected.animatedIcons}`),
  "generated icon VRT count is stale",
);
assert(
  vrtSource.includes("VRT — all animated-icon chunks") &&
    vrtSource.includes("ANIMATED_ICON_CHUNK_COUNT"),
  "VRT must render every generated animated-icon chunk",
);
const foundationNav = readJson(
  "apps/docs/content/docs/foundations/meta.json",
).pages.filter((page) => !page.startsWith("---"));
assert(
  foundationNav.includes("icons"),
  "foundations navigation is missing the shared Icons page",
);

// Cross-browser smoke is intentionally selective. It is reported from real config and reconciled
// against modeled tests, but non-selection is not treated as a coverage failure.
const smokeSource = readFileSync(
  join(root, "packages/ui/vitest.smoke.config.ts"),
  "utf8",
);
assert(
  smokeSource.includes("contract-smoke-tests.generated.json"),
  "cross-browser config must consume the contract-generated test inventory",
);
const smokeTests = readJson(
  "packages/ui/contract-smoke-tests.generated.json",
).map((path) => `packages/ui/${path}`);
const allModeledTests = new Set(
  [...components, ...hooks, ...blocks].flatMap((record) => record.testFiles),
);
for (const path of smokeTests)
  assert(
    allModeledTests.has(path),
    `cross-browser smoke test is not modeled: ${path}`,
  );
sameStrings(
  smokeTests,
  [...components, ...hooks, ...blocks]
    .filter((record) => record.coverage?.crossBrowserSmoke === "selected")
    .flatMap((record) => record.testFiles),
  "contract-selected cross-browser smoke tests",
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

if (problems.length > 0) {
  console.error(`✗ verify-component-contracts: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log("✓ verify-component-contracts: complete registry reconciliation");
console.log(
  `  inventory: ${modeledNames.length} unique items (${components.length} components + ${icons.length} animated icons + ${hooks.length} hooks + ${blocks.length} block)`,
);
console.log(
  `  component audit matrix: ${components.length}/${components.length} source + test + docs + nav + preview + VRT contracts reconciled`,
);
console.log(
  `  animated icons: ${icons.length}/${icons.length} exact generated members reconciled through the shared contract`,
);
console.log(
  `  cross-browser smoke: ${smokeTests.length} modeled test files selected (intentional subset)`,
);
console.log(`  modeled exemptions: ${exemptions.length}`);
for (const exemption of exemptions)
  console.log(`    - ${exemption.id}: ${exemption.rationale}`);
