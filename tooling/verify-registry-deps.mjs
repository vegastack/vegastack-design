// verify-registry-deps.mjs — cross-check every registry item's declared
// `registryDependencies` against the component's ACTUAL `@/components/ui/<name>`
// imports. Catches both phantom deps (declared but never imported — register
// P0-07's notification-bell→separator/button) and missing deps (imported but
// undeclared, which breaks a downstream `shadcn add`). Direct deps only —
// shadcn resolves transitively, so an item declares exactly what it imports.
//
// It also reconciles the npm ranges an item ships to a consumer against THE
// VERSION THIS WORKSPACE ACTUALLY INSTALLS AND TESTS. That second half is the
// one with teeth, and it was the half that leaked: until 2026-09-18 the gate
// compared an item's range against the FLOOR of `packages/ui/package.json`'s own
// range — a proxy for the installed version, not the installed version. A floor
// is by construction admitted by the range it came from, so the check could only
// fail when the two DECLARATIONS disagreed; it could never notice a declaration
// that had stopped describing the installed tree. That is exactly how
// `lucide-react` shipped at `^1.20.0` on some items and `^0.525.0` on others
// while the tree installed 1.x. The authority is now `pnpm-lock.yaml` —
// the committed record of what `pnpm install` resolves for `packages/ui` — so an
// item's range must admit the real version or the gate fails.
//
// Fail-closed: any mismatch exits 1. Runs as part of `registry:build`.
// `--self-test` observes every rule rejecting its own failure mode, including
// the case the old floor comparison let through, and runs in `pnpm lint`.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { parse as parseYaml } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseVersion(v) {
  const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(v);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Minimal semver-satisfies for the range shapes registry items actually use:
// exact `x.y.z`, caret `^x[.y[.z]]`, tilde `~x.y[.z]`. Anything else (ranges,
// tags, workspace protocols) returns null — "cannot judge", not a failure.
export function rangeSatisfies(version, range) {
  const v = parseVersion(version);
  if (!v) return null;
  const m = /^([\^~]?)(\d+(?:\.\d+){0,2})$/.exec(String(range).trim());
  if (!m) return null;
  const base = parseVersion(m[2]);
  if (compareVersions(v, base) < 0) return false;
  if (m[1] === "^") {
    if (base[0] > 0) return v[0] === base[0];
    return v[0] === 0 && v[1] === base[1];
  }
  if (m[1] === "~") return v[0] === base[0] && v[1] === base[1];
  return compareVersions(v, base) === 0;
}

// The minimum version a declared range admits. Used ONLY as a fallback, for a
// package the lockfile importer does not resolve — it proves less than the
// installed version does, and the message says which authority judged.
function minimumOfRange(range) {
  const m = /^[\^~]?(\d+(?:\.\d+){0,2})/.exec(String(range).trim());
  return m ? m[1] : null;
}

/**
 * What `pnpm install` actually resolves for `packages/ui`, as `name -> x.y.z`.
 *
 * `packages/ui` is the right importer to read: registry items ARE its sources,
 * so the version a component was compiled and tested against is the version a
 * consumer installing that item should get. Lockfile entries carry their peer
 * suffix (`1.47.0(react@19.2.8)`), and a workspace link resolves to
 * `link:../..`, which is not a version and is skipped.
 */
export function installedVersionsFromLock(
  lockSource,
  importer = "packages/ui",
) {
  const lock = parseYaml(lockSource);
  const sections = lock?.importers?.[importer] ?? {};
  const out = {};
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "devDependencies",
    "peerDependencies",
  ]) {
    for (const [name, entry] of Object.entries(sections[section] ?? {})) {
      const version = String(entry?.version ?? "")
        .replace(/\(.*$/, "")
        .trim();
      if (/^\d+\.\d+\.\d+/.test(version)) out[name] = version;
    }
  }
  return out;
}

// A registry item is imported either through the `ui` alias (`registry:ui` / `registry:hook`) or
// the `lib` alias (`registry:lib` — pure data/helper modules such as `geo-data`). Both resolve to
// an item NAME, so both must be reconciled against `registryDependencies`; without the second arm
// a `@vegastack/geo-data` dependency would read as a phantom.
function registrySpecifier(specifier) {
  return /^@\/(?:components\/ui|lib)\/([a-z0-9-]+)(?:\/|$)/.exec(
    specifier,
  )?.[1];
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

/**
 * The whole gate as a pure function of its inputs, so `--self-test` can run the
 * REAL rules against a fixture rather than re-stating what they should conclude.
 *
 * Vendored animated icons live under registry/ui/icons/** and are registry items
 * too, but they import nothing from @/components/ui — the generic check covers
 * them fine.
 */
export function checkRegistryDeps({
  registry,
  declaredRanges = {},
  installedVersions = {},
  readSource,
}) {
  const problems = [];
  let checked = 0;

  for (const item of registry.items ?? []) {
    const componentFiles = (item.files ?? []).filter((f) =>
      /\.tsx?$/.test(f.path),
    );
    if (componentFiles.length === 0) continue;

    const imported = new Set();
    for (const f of componentFiles) {
      let src;
      try {
        src = readSource(f.path);
      } catch {
        problems.push(`${item.name}: listed file missing on disk — ${f.path}`);
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
        problems.push(
          `${item.name}: phantom registryDependency "@vegastack/${dep}" — not imported by any of its files`,
        );
      }
    }
    for (const dep of imported) {
      if (!declared.has(dep)) {
        problems.push(
          `${item.name}: missing registryDependency "@vegastack/${dep}" — imported via @/components/ui/${dep} but not declared`,
        );
      }
    }

    // npm dependency ranges: the range an item ships must admit the version this
    // workspace installs and tests. @vegastack/* are workspace packages whose
    // published ranges legitimately differ from `workspace:*` — skip them.
    for (const spec of item.dependencies ?? []) {
      const m = /^(@?[^@]+(?:\/[^@]+)?)@(.+)$/.exec(spec);
      if (!m) continue;
      const [, name, declaredRange] = m;
      if (name.startsWith("@vegastack/")) continue;

      const installed = installedVersions[name];
      const authority = installed
        ? `installed ${name}@${installed} (pnpm-lock.yaml, importer packages/ui)`
        : null;
      const version = installed ?? minimumOfRange(declaredRanges[name]);
      if (!version) continue;

      if (rangeSatisfies(version, declaredRange) === false) {
        problems.push(
          `${item.name}: npm dependency pin "${spec}" does not admit the ` +
            `${authority ?? `declared "${name}@${declaredRanges[name]}" (packages/ui/package.json)`} — ` +
            `take the pin from what this workspace installs, never from a neighbouring item`,
        );
      }
    }
    checked++;
  }

  return { problems, checked };
}

// ---------------------------------------------------------------------------------------------

/**
 * Observe every rule rejecting its own failure mode — by RUNNING the real
 * checker over a fixture, never by asserting what it ought to say.
 *
 * The third claim is the one this gate exists for: a pin the OLD floor
 * comparison admitted, because the floor came out of a range that had stopped
 * describing the installed tree.
 */
function selfTest() {
  const failures = [];
  const claim = (label, ok) => {
    console.log(
      `verify-registry-deps:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) failures.push(label);
  };

  const fixture = (
    deps,
    files = { "ui/widget.tsx": "export const A = 1;\n" },
  ) => ({
    registry: {
      items: [
        {
          name: "widget",
          files: Object.keys(files).map((path) => ({ path })),
          dependencies: deps,
        },
      ],
    },
    readSource: (path) => {
      if (!(path in files)) throw new Error(`no such file: ${path}`);
      return files[path];
    },
  });

  const run = (input) => checkRegistryDeps(input).problems;

  claim(
    "a pin across a major boundary from the installed version is rejected",
    run({
      ...fixture(["lucide-react@^0.525.0"]),
      declaredRanges: { "lucide-react": "^1.47.0" },
      installedVersions: { "lucide-react": "1.47.0" },
    }).some((p) => p.includes("lucide-react@^0.525.0")),
  );

  claim(
    "the same item pinned at the installed version's own range passes",
    run({
      ...fixture(["lucide-react@^1.47.0"]),
      declaredRanges: { "lucide-react": "^1.47.0" },
      installedVersions: { "lucide-react": "1.47.0" },
    }).length === 0,
  );

  claim(
    "a pin the declared range's FLOOR admits but the installed version does not is still rejected",
    run({
      ...fixture(["lucide-react@^1.24.0"]),
      declaredRanges: { "lucide-react": "^1.24.0" },
      installedVersions: { "lucide-react": "2.0.1" },
    }).some((p) => p.includes("2.0.1")),
  );

  claim(
    "a package the lockfile importer does not resolve falls back to the declared range, and still fails",
    run({
      ...fixture(["motion@^11.0.0"]),
      declaredRanges: { motion: "^13.2.0" },
      installedVersions: {},
    }).some((p) => p.includes("packages/ui/package.json")),
  );

  claim(
    "a range shape this gate cannot judge is not a violation",
    run({
      ...fixture(["tailwindcss@>=4 <5"]),
      declaredRanges: { tailwindcss: "catalog:" },
      installedVersions: { tailwindcss: "4.3.3" },
    }).length === 0,
  );

  claim(
    "a declared registryDependency nothing imports is rejected",
    run({
      registry: {
        items: [
          {
            name: "widget",
            files: [{ path: "ui/widget.tsx" }],
            registryDependencies: ["@vegastack/button"],
          },
        ],
      },
      readSource: () => "export const A = 1;\n",
    }).some((p) => p.includes("phantom")),
  );

  claim(
    "an imported registry item nothing declares is rejected",
    run({
      registry: {
        items: [{ name: "widget", files: [{ path: "ui/widget.tsx" }] }],
      },
      readSource: () => 'import { Button } from "@/components/ui/button";\n',
    }).some((p) => p.includes("missing registryDependency")),
  );

  claim(
    "a listed file that is not on disk is rejected",
    run({
      registry: {
        items: [{ name: "widget", files: [{ path: "ui/gone.tsx" }] }],
      },
      readSource: () => {
        throw new Error("ENOENT");
      },
    }).some((p) => p.includes("missing on disk")),
  );

  if (failures.length) {
    console.error(
      `\n✗ verify-registry-deps: ${failures.length} rule(s) did not reject their own failure mode`,
    );
    return 1;
  }
  console.log(
    "\n✓ verify-registry-deps --self-test: every rule observed failing",
  );
  return 0;
}

// ---------------------------------------------------------------------------------------------

if (process.argv.includes("--self-test")) {
  process.exit(selfTest());
}

const registry = JSON.parse(
  readFileSync(join(root, "packages/ui/registry.json"), "utf8"),
);
const uiPkg = JSON.parse(
  readFileSync(join(root, "packages/ui/package.json"), "utf8"),
);
const declaredRanges = {
  ...uiPkg.peerDependencies,
  ...uiPkg.devDependencies,
  ...uiPkg.dependencies,
};
const installedVersions = installedVersionsFromLock(
  readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
);

const { problems, checked } = checkRegistryDeps({
  registry,
  declaredRanges,
  installedVersions,
  readSource: (path) => readFileSync(join(root, path), "utf8"),
});

for (const problem of problems) console.log(problem);

if (problems.length > 0) {
  console.log(
    `\n✗ verify-registry-deps: ${problems.length} mismatch(es) across ${checked} items`,
  );
  process.exit(1);
}
console.log(
  `✓ verify-registry-deps: ${checked} items — registryDependencies match imports, npm pins admit the installed versions`,
);
