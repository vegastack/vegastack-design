// verify-registry-deps.mjs — cross-check every registry item's declared
// `registryDependencies` against the component's ACTUAL `@/components/ui/<name>`
// imports. Catches both phantom deps (declared but never imported — register
// P0-07's notification-bell→separator/button) and missing deps (imported but
// undeclared, which breaks a downstream `shadcn add`). Direct deps only —
// shadcn resolves transitively, so an item declares exactly what it imports.
//
// Fail-closed: any mismatch exits 1. Runs as part of `registry:build`.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(
  readFileSync(join(root, "packages/ui/registry.json"), "utf8"),
);

function registrySpecifier(specifier) {
  return /^@\/components\/ui\/([a-z0-9-]+)(?:\/|$)/.exec(specifier)?.[1];
}

function importedRegistryItems(src, path) {
  const imported = new Set();
  const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, kind);
  function addSpecifier(node) {
    if (!node || !ts.isStringLiteralLike(node)) return;
    const item = registrySpecifier(node.text);
    if (item) imported.add(item);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addSpecifier(node.moduleSpecifier);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) addSpecifier(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return imported;
}

// Vendored animated icons live under registry/ui/icons/** and are registry items too,
// but they import nothing from @/components/ui — the generic check covers them fine.
let violations = 0;
let checked = 0;

for (const item of registry.items) {
  const componentFiles = (item.files ?? []).filter((f) =>
    /\.tsx?$/.test(f.path),
  );
  if (componentFiles.length === 0) continue;

  const imported = new Set();
  for (const f of componentFiles) {
    let src;
    try {
      src = readFileSync(join(root, f.path), "utf8");
    } catch {
      console.log(`${item.name}: listed file missing on disk — ${f.path}`);
      violations++;
      continue;
    }
    for (const name of importedRegistryItems(src, f.path)) imported.add(name);
  }
  // A multi-file item may import its own sibling files — self-references are not deps.
  imported.delete(item.name);
  for (const f of componentFiles) {
    const base = f.path
      .split("/")
      .pop()
      .replace(/\.tsx?$/, "");
    imported.delete(base);
  }

  const declared = new Set(
    (item.registryDependencies ?? []).map((d) =>
      d.replace(/^@vegastack\//, ""),
    ),
  );

  for (const dep of declared) {
    if (!imported.has(dep)) {
      console.log(
        `${item.name}: phantom registryDependency "@vegastack/${dep}" — not imported by any of its files`,
      );
      violations++;
    }
  }
  for (const dep of imported) {
    if (!declared.has(dep)) {
      console.log(
        `${item.name}: missing registryDependency "@vegastack/${dep}" — imported via @/components/ui/${dep} but not declared`,
      );
      violations++;
    }
  }
  checked++;
}

if (violations > 0) {
  console.log(
    `\n✗ verify-registry-deps: ${violations} mismatch(es) across ${checked} items`,
  );
  process.exit(1);
}
console.log(
  `✓ verify-registry-deps: ${checked} items — declared registryDependencies match actual imports`,
);
