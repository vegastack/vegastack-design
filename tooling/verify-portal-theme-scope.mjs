#!/usr/bin/env node
// Fail-closed inventory for every canonical component that mounts UI outside its theme subtree.
// A `.vs-marketing` class cannot cross a portal boundary by inheritance, so each owner must read
// the internal theme scope and attach it to a real element rendered inside the portal/engine host.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const ROOT = "packages/ui/registry/ui";

// This is deliberately explicit as well as discoverable: adding/removing a portal is an audited
// architecture change, not something that should silently change the expected coverage count.
const EXPECTED_HOSTS = new Map([
  ["packages/ui/registry/ui/alert-dialog.tsx", ["BaseAlertDialog.Portal"]],
  ["packages/ui/registry/ui/combobox.tsx", ["BaseCombobox.Portal"]],
  ["packages/ui/registry/ui/context-menu.tsx", ["ContextMenuPrimitive.Portal"]],
  ["packages/ui/registry/ui/dialog.tsx", ["BaseDialog.Portal"]],
  ["packages/ui/registry/ui/dropdown-menu.tsx", ["Menu.Portal"]],
  ["packages/ui/registry/ui/hover-card.tsx", ["BasePreviewCard.Portal"]],
  [
    "packages/ui/registry/ui/navigation-menu.tsx",
    ["BaseNavigationMenu.Portal"],
  ],
  ["packages/ui/registry/ui/popover.tsx", ["BasePopover.Portal"]],
  ["packages/ui/registry/ui/select.tsx", ["BaseSelect.Portal"]],
  ["packages/ui/registry/ui/sheet.tsx", ["BaseDialog.Portal"]],
  ["packages/ui/registry/ui/sonner.tsx", ["SonnerToaster"]],
  ["packages/ui/registry/ui/tooltip.tsx", ["BaseTooltip.Portal"]],
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name !== "icons") walk(path, out);
    } else if (name.endsWith(".tsx") && !name.endsWith(".test.tsx")) {
      out.push(path.replaceAll("\\", "/"));
    }
  }
  return out;
}

function isPortalHost(tag, portalAliases) {
  const leaf = tag.split(".").at(-1);
  return leaf === "Portal" || portalAliases.has(tag) || tag === "SonnerToaster";
}

function nearestFunction(ancestors) {
  return [...ancestors]
    .reverse()
    .find(
      (node) =>
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node),
    );
}

function functionLabel(node, sf) {
  if ("name" in node && node.name) return node.name.getText(sf);
  if (ts.isVariableDeclaration(node.parent) && node.parent.name)
    return node.parent.name.getText(sf);
  return "<anonymous>";
}

const observed = new Map();
const violations = [];

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const portalAliases = new Set();
  const createPortalBindings = new Set();
  const reactDomNamespaces = new Set();
  const importedScopeHook = sf.statements.some((statement) => {
    // The hook lives at the `/theme-scope` subpath: it calls `React.createContext()` at module
    // scope, so re-exporting it from the root entry would make that entry crash under the
    // `react-server` condition for every server-safe component that imports `cn` from it.
    // The bare root specifier stays accepted so a stale import is reported as a violation
    // by the scope check below rather than silently skipped here.
    if (
      !ts.isImportDeclaration(statement) ||
      (statement.moduleSpecifier.text !== "@vegastack/design/theme-scope" &&
        statement.moduleSpecifier.text !== "@vegastack/design")
    ) {
      return false;
    }
    const bindings = statement.importClause?.namedBindings;
    return (
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.some(
        (element) =>
          element.propertyName?.text === "useInternalThemeScope" ||
          element.name.text === "useInternalThemeScope",
      )
    );
  });
  for (const statement of sf.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const spec = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        const imported = (element.propertyName ?? element.name).text;
        if (imported === "Portal") portalAliases.add(element.name.text);
        if (spec === "react-dom" && imported === "createPortal") {
          createPortalBindings.add(element.name.text);
        }
      }
    }
    if (spec === "react-dom" && bindings && ts.isNamespaceImport(bindings)) {
      reactDomNamespaces.add(bindings.name.text);
    }
  }
  const hosts = [];
  const ancestors = [];

  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(sf);
      if (isPortalHost(tag, portalAliases)) {
        hosts.push(tag);
        const owner = nearestFunction(ancestors);
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        if (!owner) {
          violations.push(
            `${file}:${line + 1} ${tag} has no component/function owner`,
          );
        } else {
          const ownerText = owner.getText(sf);
          const hook = ownerText.match(
            /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*useInternalThemeScope\s*\(\s*\)/,
          );
          if (!importedScopeHook || !hook) {
            violations.push(
              `${file}:${line + 1} ${functionLabel(owner, sf)} renders ${tag} without calling useInternalThemeScope()`,
            );
          } else {
            const scopeName = hook[1];
            let scopedClassName = false;
            function inspectOwner(child) {
              if (
                ts.isJsxAttribute(child) &&
                child.name.getText(sf) === "className"
              ) {
                if (
                  new RegExp(`\\b${scopeName}\\b`).test(
                    child.initializer?.getText(sf) ?? "",
                  )
                ) {
                  scopedClassName = true;
                }
              }
              ts.forEachChild(child, inspectOwner);
            }
            // Scope must be attached inside this exact portal/engine subtree; using it on the
            // trigger or another sibling in the owner would not restore inheritance after the
            // portal jumps to `<body>`.
            inspectOwner(ts.isJsxOpeningElement(node) ? node.parent : node);
            if (!scopedClassName) {
              violations.push(
                `${file}:${line + 1} ${functionLabel(owner, sf)} reads ${scopeName} but does not attach it through a className inside ${tag}`,
              );
            }
          }
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const rawCreatePortal =
        (ts.isIdentifier(expression) &&
          createPortalBindings.has(expression.text)) ||
        (ts.isPropertyAccessExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          reactDomNamespaces.has(expression.expression.text) &&
          expression.name.text === "createPortal");
      if (rawCreatePortal) {
        const tag = "createPortal";
        hosts.push(tag);
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        violations.push(
          `${file}:${line + 1} raw ${tag}() bypasses the reviewed portal host contract; use an inventoried, theme-scoped host`,
        );
      }
    }
    ancestors.push(node);
    ts.forEachChild(node, visit);
    ancestors.pop();
  }

  visit(sf);
  if (hosts.length > 0) observed.set(file, hosts);
}

for (const [file, expected] of EXPECTED_HOSTS) {
  const actual = observed.get(file) ?? [];
  if (
    actual.length !== expected.length ||
    actual.some((host, index) => host !== expected[index])
  ) {
    violations.push(
      `${file} portal inventory changed: expected [${expected.join(", ")}], observed [${actual.join(", ")}]`,
    );
  }
}
for (const [file, hosts] of observed) {
  if (!EXPECTED_HOSTS.has(file)) {
    violations.push(
      `${file} introduces unreviewed portal host(s) [${hosts.join(", ")}]; add a scoped, rationale-reviewed inventory record`,
    );
  }
}

if (violations.length > 0) {
  console.error(`✗ portal theme scope: ${violations.length} violation(s)`);
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

const hostCount = [...observed.values()].reduce(
  (sum, hosts) => sum + hosts.length,
  0,
);
console.log(
  `✓ portal theme scope: ${observed.size} canonical owners / ${hostCount} hosts are explicitly inventoried and scoped`,
);
