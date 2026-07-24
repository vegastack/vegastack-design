#!/usr/bin/env node
// verify-rsc-safety — prove that "server-safe by default" is TRUE, not just intended.
//
// Two independent failures shipped in the 2026-07 wave and neither was catchable by any existing
// gate (design-lint, typecheck, unit tests and the docs build were all green):
//
//   1. `@vegastack/design`'s ROOT entry re-exported theme-scope, putting `React.createContext()`
//      at the module scope of the entry that 24 server-safe components import `cn` from. Under the
//      `react-server` condition React exports `createContext` as `undefined`, so every one of those
//      components threw `TypeError` the moment a Server Component imported it.
//   2. `stat`, `comparison-matrix` and `tool-call-chip` used client-only React APIs with no
//      `'use client'` directive — same crash, per component.
//
// Both are invisible to the rest of the suite because every in-repo consumer is itself a
// `'use client'` preview, so the react-server condition is never exercised. This script exercises
// it directly.
//
// PART A executes each server-safe published entry under `--conditions=react-server`.
// PART B statically checks every canonical registry component WITHOUT `'use client'` for the React
//        APIs that are `undefined` in that condition.
//
// design-lint's `presentational-client-boundary` rule is the INVERSE check (a `'use client'` that
// isn't earned). This is the missing direction: a client boundary that is required but absent.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Exactly the React exports that are `undefined` under the `react-server` condition (verified
// against the installed react — see react/react.react-server.js). `useCallback`, `useMemo`,
// `useId`, `use`, `forwardRef` and `memo` ARE available server-side and are deliberately absent.
const CLIENT_ONLY_REACT_APIS = [
  "createContext",
  "useContext",
  "useState",
  "useRef",
  "useEffect",
  "useLayoutEffect",
  "useReducer",
  "useImperativeHandle",
  "useSyncExternalStore",
  "useTransition",
  "useDeferredValue",
];

// Base UI's `useRender` calls `useRefWithInit` -> `React.useRef` internally, so a component using it
// is client-only even though no React hook appears in its own source. tool-call-chip shipped this way.
const CLIENT_ONLY_IMPORTS = [
  {
    spec: "@base-ui/react/use-render",
    why: "useRender calls React.useRef internally",
  },
];

const problems = [];

/* ── PART A — the published entries that are contractually server-safe ────────────────────────── */
// theme-scope and icons are deliberately client modules and are NOT listed here.
const SERVER_SAFE_ENTRIES = [
  "packages/design/dist/index.js",
  "packages/design/dist/preset.js",
];

let entriesChecked = 0;
for (const rel of SERVER_SAFE_ENTRIES) {
  const abs = resolve(REPO_ROOT, rel);
  if (!existsSync(abs)) {
    problems.push(
      `${rel}: not built — run \`pnpm --filter @vegastack/design build\` before this gate`,
    );
    continue;
  }
  try {
    execFileSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(abs)});`,
      ],
      { cwd: resolve(REPO_ROOT, "packages/design"), stdio: "pipe" },
    );
    entriesChecked++;
  } catch (err) {
    const detail = (err.stderr?.toString() || err.message)
      .trim()
      .split("\n")
      .slice(0, 3)
      .join(" / ");
    problems.push(
      `${rel}: throws under the react-server condition — a Server Component importing this crashes.\n` +
        `    ${detail}\n` +
        `    Fix: move the client-only module to its own entry + subpath export; do not re-export it here.`,
    );
  }
}

/* ── PART B — canonical registry components missing a required client boundary ────────────────── */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "icons") continue; // generated mirrors; covered by verify-animated-icons
      out.push(...walk(p));
    } else if (
      /\.tsx?$/.test(name) &&
      !/\.(?:test|spec)\.tsx?$/.test(name) &&
      !name.endsWith(".d.ts")
    ) {
      out.push(p);
    }
  }
  return out;
}

const roots = ["packages/ui/registry/ui", "packages/ui/registry/blocks"].map(
  (r) => resolve(REPO_ROOT, r),
);
let modulesChecked = 0;

for (const root of roots) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    if (/^\s*['"]use client['"];/m.test(src)) continue; // already a client module
    modulesChecked++;
    const rel = file.slice(REPO_ROOT.length + 1);
    const scriptKind = file.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(
      file,
      src,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );
    const directBindings = new Map();
    const reactNamespaces = new Set(["React"]);

    for (const statement of sf.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const spec = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (spec === "react" && clause) {
        if (clause.name) reactNamespaces.add(clause.name.text);
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings))
          reactNamespaces.add(bindings.name.text);
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            const importedName = (element.propertyName ?? element.name).text;
            if (CLIENT_ONLY_REACT_APIS.includes(importedName)) {
              directBindings.set(element.name.text, importedName);
            }
          }
        }
      }
      const unsafeImport = CLIENT_ONLY_IMPORTS.find(
        (entry) => entry.spec === spec,
      );
      if (unsafeImport) {
        const { line } = sf.getLineAndCharacterOfPosition(
          statement.getStart(sf),
        );
        problems.push(
          `${rel}:${line + 1} imports ${spec} (${unsafeImport.why}) — add a "use client" directive.`,
        );
      }
    }

    function visit(node) {
      if (ts.isCallExpression(node)) {
        let api;
        if (ts.isIdentifier(node.expression))
          api = directBindings.get(node.expression.text);
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          reactNamespaces.has(node.expression.expression.text) &&
          CLIENT_ONLY_REACT_APIS.includes(node.expression.name.text)
        ) {
          api = node.expression.name.text;
        }
        if (api) {
          const { line } = sf.getLineAndCharacterOfPosition(
            node.expression.getStart(sf),
          );
          problems.push(
            `${rel}:${line + 1} uses React.${api}, which is \`undefined\` under the react-server condition — ` +
              `add a "use client" directive (this module crashes when rendered in an RSC).`,
          );
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
}

if (problems.length) {
  console.error("✗ rsc-safety:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(
  `✓ rsc-safety: ${entriesChecked} server-safe entr(ies) import cleanly under the react-server ` +
    `condition; ${modulesChecked} canonical module(s) without "use client" use no client-only React API`,
);
