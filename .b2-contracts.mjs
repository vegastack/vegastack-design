import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const BASE = "@base-ui/react@^1.6.0";
const CVA = "class-variance-authority@^0.7.1";
const LUCIDE = "lucide-react@^1.24.0";
const DESIGN = "@vegastack/design@^0.4.1";
const TOKENS = "@vegastack/design-tokens@^0.4.0";

/** name -> { deps, registryDeps, title, description, category, family, wave, whenToUse, whenNotToUse } */
const SPEC = {
  button: { deps: [BASE, CVA, DESIGN, TOKENS], reg: ["@vegastack/spinner"] },
  "button-group": {
    deps: [BASE, CVA, DESIGN, TOKENS], reg: ["@vegastack/separator"],
    title: "Button Group", category: "actions", family: "actions", wave: "Actions",
    description: "Joins buttons, inputs, selects and dropdowns into one connected control group — horizontal or vertical, with a separator and a text addon.",
    whenToUse: "Join related controls into one unit — a split action, a segmented action bar, an input with a leading or trailing control.",
    whenNotToUse: "A single selection among peers (ToggleGroup) or unrelated actions that only happen to sit together.",
    summary: "Joins buttons, inputs, selects and dropdowns into one connected control group.",
  },
  badge: { deps: [BASE, CVA, DESIGN, TOKENS], reg: [] },
  kbd: { deps: [DESIGN, TOKENS], reg: [] },
  label: { deps: [DESIGN, TOKENS], reg: [] },
  separator: { deps: [BASE, DESIGN, TOKENS], reg: [] },
  skeleton: { deps: [DESIGN, TOKENS], reg: [] },
  spinner: { deps: [LUCIDE, DESIGN, TOKENS], reg: [] },
  avatar: { deps: [BASE, DESIGN, TOKENS], reg: [] },
  "aspect-ratio": {
    deps: [DESIGN, TOKENS], reg: [],
    title: "Aspect Ratio", category: "layout", family: "layout", wave: "Layout",
    description: "Constrains its children to a given width-to-height ratio.",
    whenToUse: "Reserve a fixed ratio for media — a video embed, a cover image, a map tile — so the layout does not shift as it loads.",
    whenNotToUse: "Content whose height must follow its text; use ordinary flow instead.",
    summary: "Constrains its children to a given width-to-height ratio.",
  },
  toggle: { deps: [BASE, CVA, DESIGN, TOKENS], reg: ["@vegastack/spinner"] },
  "toggle-group": { deps: [BASE, CVA, DESIGN, TOKENS], reg: ["@vegastack/toggle"] },
  tooltip: { deps: [BASE, DESIGN, TOKENS], reg: [] },
  item: { deps: [BASE, CVA, DESIGN, TOKENS], reg: ["@vegastack/separator"] },
  empty: { deps: [CVA, DESIGN, TOKENS], reg: [] },
  card: { deps: [DESIGN, TOKENS], reg: [] },
  alert: { deps: [CVA, DESIGN, TOKENS], reg: [] },
};

const NEW_DESCRIPTIONS = {
  button: "Trigger an action — upstream's six variants and eight sizes, plus a loading state (API-5).",
  badge: "A compact label or status chip — upstream's six variants plus our four status tones (COL-12).",
  kbd: "A keyboard-key chip, and a group that lays several of them out inline.",
  label: "A styled native label for form controls.",
  separator: "A thin rule dividing content — horizontal or vertical, built on Base UI.",
  skeleton: "A pulsing placeholder that reserves layout space while content loads.",
  spinner: "An indeterminate loading indicator that inherits its host's ink.",
  avatar: "A circular user or entity image with a fallback, a badge, and an overlapping group.",
  toggle: "A two-state button that can be pressed on or off, with a loading state (API-5).",
  "toggle-group": "Toggle buttons sharing one selection — single or multiple, horizontal or vertical.",
  tooltip: "A floating label on hover or focus, portaled inside the theme scope (OVL-13).",
  item: "A composable row for list and feed content — media, title, description, actions.",
  empty: "A zero-data placeholder — media, title, description and a content slot.",
  card: "A content surface with composable header, content, footer and action parts.",
  alert: "A status banner — upstream's two variants plus our three extra status tones (COL-12).",
};

const NAMES = Object.keys(SPEC);

// ---- source exports, in the same shape verify-component-contracts.mjs derives ----------------
function exportsOf(path) {
  const sf = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const kinds = new Map();
  const record = (name, kind) => kinds.set(name, kind);
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) record(st.name.text, /^[A-Z]/.test(st.name.text) ? "component" : "function");
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) record(d.name.text, /Variants$/.test(d.name.text) ? "variant-builder" : "constant");
    if (ts.isTypeAliasDeclaration(st)) record(st.name.text, "type");
    if (ts.isInterfaceDeclaration(st)) record(st.name.text, "interface");
  }
  const names = new Set();
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
      for (const el of st.exportClause.elements) names.add(el.name.text);
    }
    const mods = ts.canHaveModifiers(st) ? (ts.getModifiers(st) ?? []) : [];
    if (mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(st) && st.name) names.add(st.name.text);
      if (ts.isTypeAliasDeclaration(st)) names.add(st.name.text);
      if (ts.isInterfaceDeclaration(st)) names.add(st.name.text);
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text);
    }
  }
  return [...names].sort().map((name) => {
    const kind = kinds.get(name) ?? "value";
    const isComponent = kind === "component";
    return {
      name, kind, source: path,
      ref: isComponent
        ? { status: "observed", target: "element", rationale: "Upstream forwards the ref to its own render target." }
        : { status: "not-applicable", rationale: "Not a rendering component; accepts no runtime ref." },
    };
  });
}

/** cva `variants:` dimensions, straight from source. */
function cvaDimensions(path) {
  const src = readFileSync(path, "utf8");
  const sf = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = {};
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(sf) === "cva" && node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1])) {
      for (const p of node.arguments[1].properties) {
        if (!ts.isPropertyAssignment(p) || p.name.getText(sf) !== "variants") continue;
        if (!ts.isObjectLiteralExpression(p.initializer)) continue;
        for (const dim of p.initializer.properties) {
          if (!ts.isPropertyAssignment(dim) || !ts.isObjectLiteralExpression(dim.initializer)) continue;
          const key = dim.name.getText(sf).replace(/^["']|["']$/g, "");
          const values = dim.initializer.properties
            .map((v) => (v.name ? v.name.getText(sf).replace(/^["']|["']$/g, "") : null))
            .filter(Boolean);
          (out[key] ??= new Set());
          for (const v of values) out[key].add(v);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

// ---- registry.json --------------------------------------------------------------------------
const rPath = "packages/ui/registry.json";
const registry = JSON.parse(readFileSync(rPath, "utf8"));
const byName = new Map(registry.items.map((i) => [i.name, i]));

for (const name of NAMES) {
  const spec = SPEC[name];
  let item = byName.get(name);
  if (!item) {
    item = {
      name, type: "registry:ui",
      title: spec.title, description: spec.description,
      categories: [spec.category],
      dependencies: [], registryDependencies: [],
      files: [{ path: `packages/ui/registry/ui/${name}.tsx`, type: "registry:ui", target: `@ui/${name}.tsx` }],
      meta: { whenToUse: spec.whenToUse, whenNotToUse: spec.whenNotToUse, version: byName.get("button").meta.version },
    };
    registry.items.push(item);
    byName.set(name, item);
  }
  item.dependencies = spec.deps;
  item.registryDependencies = spec.reg;
  if (NEW_DESCRIPTIONS[name]) item.description = NEW_DESCRIPTIONS[name];
}
registry.items.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(rPath, JSON.stringify(registry, null, 2) + "\n");
console.log("registry.json updated");

// ---- component-contracts.json ---------------------------------------------------------------
const cPath = "packages/ui/component-contracts.json";
const contracts = JSON.parse(readFileSync(cPath, "utf8"));
const cByName = new Map(contracts.components.map((c) => [c.name, c]));

for (const name of NAMES) {
  const spec = SPEC[name];
  const file = `packages/ui/registry/ui/${name}.tsx`;
  let rec = cByName.get(name);
  if (!rec) {
    rec = {
      name, registryType: "registry:ui", title: spec.title, summary: spec.summary,
      status: "stable", since: "1.0.0", family: spec.family, wave: spec.wave,
      sourceFiles: [file], publicSymbols: [],
      variants: {}, sizes: {},
      states: {
        behavior: { status: "observed", values: ["default"], evidence: "Observed from branches, state attributes, and inline source contract." },
        accessibility: { status: "covered", values: ["native-or-base-ui-semantics", "browser-accessibility-test"], evidence: `${file} + packages/ui/registry/ui/${name}.test.tsx` },
        visual: { status: "observed", values: ["default"], evidence: "Observed from token classes, state selectors, or visual branches." },
      },
      responsive: { status: "modeled", risks: [], rationale: "Upstream's own layout; no component-owned responsive branch." },
      motion: { status: "not-applicable", mechanisms: [], reducedMotion: { status: "not-applicable", rationale: "No component-owned motion mechanism observed." } },
      engines: [],
      docsSlug: `/docs/components/${name}`,
      registryDependencies: [], npmDependencies: [],
      testFiles: [`packages/ui/registry/ui/${name}.test.tsx`],
      coverage: { source: "required", test: "required", docs: "required", navigation: "required", preview: "required", vrt: "required" },
      previewModule: name,
      dataAttributes: {},
    };
    contracts.components.push(rec);
    cByName.set(name, rec);
  }
  rec.sourceFiles = [file];
  rec.publicSymbols = exportsOf(file);
  rec.registryDependencies = spec.reg;
  rec.npmDependencies = spec.deps;
  rec.testFiles = [`packages/ui/registry/ui/${name}.test.tsx`];
  rec.previewModule = name;
  const dims = cvaDimensions(file);
  const mk = (key, rationale) =>
    dims[key]
      ? { status: "observed", dimensions: [{ name: key, values: dims[key], evidence: `${file}: cva variant` }] }
      : { status: "not-applicable-or-inherited", dimensions: [], rationale };
  rec.variants = mk("variant", "Upstream ships no variant dimension for this component.");
  rec.sizes = mk("size", "Upstream ships no size dimension for this component.");
}
writeFileSync(cPath, JSON.stringify(contracts, null, 2) + "\n");
console.log("component-contracts.json updated");
