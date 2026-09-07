// Builds the dependency graph + register for the 2026-09-07 system audit.
// Source of truth: packages/ui/registry/ui/* and component-contracts.json. Regenerate with:
//   node docs/audits/2026-09-07-system-audit/graph.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const uiDir = path.join(root, "packages/ui/registry/ui");
const contracts = JSON.parse(
  fs.readFileSync(
    path.join(root, "packages/ui/component-contracts.json"),
    "utf8",
  ),
);
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "packages/ui/registry.json"), "utf8"),
);
const regByName = new Map(registry.items.map((i) => [i.name, i]));

const items = [
  ...contracts.components.map((c) => ({ ...c, kind: "component" })),
  ...contracts.hooks.map((c) => ({ ...c, kind: "hook" })),
  ...contracts.blocks.map((c) => ({ ...c, kind: "block" })),
];

const importRe = /from\s+["']([^"']+)["']/g;
function readSource(item) {
  const files = item.sourceFiles ?? [];
  return files
    .filter((f) => fs.existsSync(path.join(root, f)))
    .map((f) => ({
      file: f,
      text: fs.readFileSync(path.join(root, f), "utf8"),
    }));
}

const nodes = new Map();
for (const item of items) {
  const srcs = readSource(item);
  const text = srcs.map((s) => s.text).join("\n");
  const loc = srcs.reduce((n, s) => n + s.text.split("\n").length, 0);
  const imports = [...text.matchAll(importRe)].map((m) => m[1]);
  const internal = new Set();
  const baseUi = new Set();
  const external = new Set();
  for (const imp of imports) {
    let m;
    if ((m = imp.match(/^@\/components\/ui\/([a-z0-9-]+)/))) internal.add(m[1]);
    else if ((m = imp.match(/^\.\/([a-z0-9-]+)$/))) internal.add(m[1]);
    else if ((m = imp.match(/^@base-ui\/react\/([a-z0-9-]+)/)))
      baseUi.add(m[1]);
    else if (imp === "@base-ui/react") baseUi.add("(root)");
    else if (
      /^(react|react-dom|@vegastack\/design|@vegastack\/design-tokens|class-variance-authority|lucide-react)(\/|$)/.test(
        imp,
      )
    )
      continue;
    else if (!imp.startsWith(".") && !imp.startsWith("@/")) external.add(imp);
  }
  internal.delete(item.name);
  const name = item.name;
  const reg = regByName.get(name);
  nodes.set(name, {
    name,
    kind: item.kind,
    family: item.family,
    wave: item.wave,
    loc,
    files: srcs.map((s) => s.file),
    useClient: /^\s*["']use client["']/m.test(text),
    internal: [...internal].sort(),
    baseUi: [...baseUi].sort(),
    external: [...external].sort(),
    registryDeps: (reg?.registryDependencies ?? []).map((d) =>
      d.replace("@vegastack/", ""),
    ),
    npmDeps: (reg?.dependencies ?? []).map((d) => d.replace(/@\^.*$/, "")),
    symbols: (item.publicSymbols ?? []).filter((s) => s.kind === "component")
      .length,
    docs: fs.existsSync(
      path.join(root, `apps/docs/content/docs/components/${name}.mdx`),
    ),
    preview: fs.existsSync(
      path.join(root, `apps/docs/components/preview/${name}.tsx`),
    ),
    test: srcs.some((s) =>
      fs.existsSync(path.join(root, s.file.replace(/\.tsx?$/, ".test.tsx"))),
    ),
  });
}

// Tiers: longest path from a leaf over internal edges.
const tierOf = new Map();
function tier(n, stack = new Set()) {
  if (tierOf.has(n)) return tierOf.get(n);
  if (stack.has(n)) return 0; // cycle guard
  stack.add(n);
  const node = nodes.get(n);
  const deps = (node?.internal ?? []).filter((d) => nodes.has(d));
  const t = deps.length ? 1 + Math.max(...deps.map((d) => tier(d, stack))) : 0;
  tierOf.set(n, t);
  return t;
}
for (const n of nodes.keys()) tier(n);

// Reverse edges: who consumes me.
const consumers = new Map([...nodes.keys()].map((n) => [n, []]));
for (const node of nodes.values())
  for (const d of node.internal) consumers.get(d)?.push(node.name);

// Drift between source imports and registry.json registryDependencies.
const drift = [];
for (const node of nodes.values()) {
  const src = new Set(node.internal);
  const reg = new Set(node.registryDeps);
  const missing = [...src].filter((d) => !reg.has(d));
  const extra = [...reg].filter((d) => !src.has(d));
  if (missing.length || extra.length)
    drift.push({ name: node.name, missing, extra });
}

const out = [...nodes.values()].map((n) => ({
  ...n,
  tier: tierOf.get(n.name),
  consumers: consumers.get(n.name).sort(),
}));
out.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

const dir = import.meta.dirname;
fs.writeFileSync(
  path.join(dir, "00-graph.json"),
  JSON.stringify(
    { generated: new Date().toISOString(), nodes: out, drift },
    null,
    2,
  ),
);

// Register markdown
const rows = out.map(
  (n) =>
    `| ${n.name} | ${n.kind} | ${n.tier} | ${n.loc} | ${n.useClient ? "client" : "server"} | ${n.internal.join(", ") || "—"} | ${n.consumers.join(", ") || "—"} | ${n.baseUi.join(", ") || "—"} | ${n.external.join(", ") || "—"} | ${n.docs ? "✓" : "✗"} | ${n.preview ? "✓" : "✗"} | ${n.test ? "✓" : "✗"} |`,
);
const byTier = {};
for (const n of out) (byTier[n.tier] ??= []).push(n.name);
const register = `# 00 — Register and dependency graph

Generated ${new Date().toISOString().slice(0, 10)} by \`graph.mjs\` from source imports, \`component-contracts.json\`, and \`registry.json\`.
Items: ${out.length} (${out.filter((n) => n.kind === "component").length} components · ${out.filter((n) => n.kind === "hook").length} hooks · ${out.filter((n) => n.kind === "block").length} blocks). Total LOC ${out.reduce((s, n) => s + n.loc, 0)}.

**Tier** = longest internal-dependency path from a leaf (T0 imports no other registry item).

## Tiers

${Object.entries(byTier)
  .map(([t, names]) => `- **T${t}** (${names.length}): ${names.join(", ")}`)
  .join("\n")}

## Most-consumed items (fix here first, everything downstream inherits)

${out
  .filter((n) => n.consumers.length)
  .sort((a, b) => b.consumers.length - a.consumers.length)
  .slice(0, 20)
  .map(
    (n) => `- **${n.name}** ← ${n.consumers.length}: ${n.consumers.join(", ")}`,
  )
  .join("\n")}

## Source-vs-registry dependency drift

${drift.length ? drift.map((d) => `- **${d.name}** — source imports not in registry.json: ${d.missing.join(", ") || "none"}; registry.json deps not imported: ${d.extra.join(", ") || "none"}`).join("\n") : "None."}

## Register

| item | kind | tier | LOC | boundary | imports | consumed by | Base UI | external | docs | preview | test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
fs.writeFileSync(path.join(dir, "00-register.md"), register);

// Mermaid graph (internal edges only, hooks included)
const edges = [];
for (const n of out)
  for (const d of n.internal)
    if (nodes.has(d)) edges.push(`  ${d} --> ${n.name}`);
const mermaid = `# 00 — Dependency graph (mermaid)

Edges point from dependency to consumer. Leaves (T0) with no consumers and no imports are omitted for legibility; they are listed in \`00-register.md\`.

\`\`\`mermaid
graph LR
${edges.join("\n")}
\`\`\`
`;
fs.writeFileSync(path.join(dir, "00-graph.md"), mermaid);
console.log(`nodes=${out.length} edges=${edges.length} drift=${drift.length}`);
console.log(
  Object.entries(byTier)
    .map(([t, n]) => `T${t}=${n.length}`)
    .join(" "),
);
