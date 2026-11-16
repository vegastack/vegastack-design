// Which registry-owned files nothing in the consuming project reaches — the copies a pull keeps
// refreshing although no screen uses them (`vegastack-design owned-files --unreached`).
//
// A project's unused-code scan cannot say: it ignores the registry folders, because their files
// are the design system's to change, so a copy nobody imports rides along with every pull. This
// walks the imports the project's OWN files make — static and dynamic `import`, `export … from`,
// `require`, `vi.mock`, and the ESM blocks of an `.mdx` page (never its code fences) — follows
// them through the registry files they land on, and reports the owned files it never lands on.
// With the project's own `typescript` installed (every TS consumer has it) the specifiers come
// from TypeScript's pre-processor and resolve exactly as the compiler resolves them — the
// effective `tsconfig.json` (`extends` included), alias precedence and fallbacks, `.js` → `.ts`.
// Without it, a masked-source scan and the root `tsconfig.json` `paths` stand in. Read-only.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { maskNonUsage } from "./doctor.mjs";

const SOURCE = /\.(?:[cm]?[jt]sx?|mdx)$/;
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  ".source",
  "dist",
  "build",
  "out",
  "coverage",
]);
const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".jsx",
  ".mjs",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bvi\.(?:mock|doMock|importActual)\s*\(\s*)(["'`])([^"'`\n]+)\1/g;

function sourceFiles(root, dir = root, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(root, full, out);
    else if (e.isFile() && SOURCE.test(e.name)) out.push(full);
  }
  return out;
}

/**
 * An `.mdx` page's ESM: each block that starts a line with `import`/`export` outside a code fence
 * and runs to the next blank line (MDX's own rule), so a multi-line import counts and an example
 * inside a fence does not.
 */
export function mdxEsm(src) {
  const out = [];
  let fence = null;
  let inEsm = false;
  for (const line of src.split("\n")) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length
      )
        fence = null;
      continue;
    }
    if (inEsm) {
      if (line.trim() === "") inEsm = false;
      else out.push(line);
      continue;
    }
    if (marker) fence = marker[1];
    else if (/^(?:import|export)\b/.test(line)) {
      inEsm = true;
      out.push(line);
    }
  }
  return out.join("\n");
}

/** `vi.mock("x")` and friends: the module a test replaces is a module it reaches. */
const VI_MOCK =
  /\bvi\.(?:mock|doMock|importActual)\s*\(\s*(["'`])([^"'`\n]+)\1/g;

/** The module specifiers a file's code imports. */
export function specifiersOf(file, src, ts = null) {
  const code = file.endsWith(".mdx") ? mdxEsm(src) : src;
  if (ts) {
    const info = ts.preProcessFile(code, true, true);
    const mocks = [
      ...maskNonUsage(code, { blankStrings: false }).matchAll(VI_MOCK),
    ].map((m) => m[2]);
    return [...info.importedFiles.map((f) => f.fileName), ...mocks];
  }
  return [...maskNonUsage(code).matchAll(SPECIFIER)].map((m) => m[2]);
}

/** The consuming project's own TypeScript, when it has one. */
function projectTypeScript(root) {
  try {
    return createRequire(join(root, "package.json"))("typescript");
  } catch {
    return null;
  }
}

/** `tsconfig.json`'s `paths` as [prefix, absolute target prefix] pairs (`@/` → `<root>/src/`). */
function pathAliases(root) {
  let config;
  try {
    // tsconfig allows comments and trailing commas: drop both, leaving strings ("**/*.ts") alone.
    const text = readFileSync(join(root, "tsconfig.json"), "utf8")
      .replace(
        /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
        (m, str) => str ?? "",
      )
      .replace(
        /("(?:\\.|[^"\\])*")|,(\s*[}\]])/g,
        (m, str, tail) => str ?? tail,
      );
    config = JSON.parse(text);
  } catch {
    return [];
  }
  const base = resolve(root, config?.compilerOptions?.baseUrl ?? ".");
  return Object.entries(config?.compilerOptions?.paths ?? {}).flatMap(
    ([from, [to] = []]) =>
      from.endsWith("/*") && typeof to === "string" && to.endsWith("/*")
        ? [[from.slice(0, -1), resolve(base, to.slice(0, -2)) + sep]]
        : [],
  );
}

/** Resolution exactly as the project's compiler does it, from its effective tsconfig. */
function compilerResolver(ts, root) {
  const configPath = ts.findConfigFile(
    root,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  let options = {
    allowJs: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  if (configPath) {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      configPath,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: () => {},
      },
    );
    if (parsed) options = { ...parsed.options, allowJs: true };
  }
  const host = ts.createCompilerHost(options);
  const fallback = fallbackResolver(root);
  return (from, spec) => {
    const hit = ts.resolveModuleName(spec, from, options, host).resolvedModule;
    if (
      hit &&
      !hit.isExternalLibraryImport &&
      SOURCE.test(hit.resolvedFileName)
    )
      return resolve(hit.resolvedFileName);
    // An `.mdx` target, which the compiler does not resolve.
    return spec.endsWith(".mdx") ? fallback(from, spec) : null;
  };
}

/** Without TypeScript: relative paths and the root `tsconfig.json` `paths`, longest prefix first. */
function fallbackResolver(root) {
  const aliases = pathAliases(root).sort((a, b) => b[0].length - a[0].length);
  return (from, spec) => {
    let base;
    const hit = aliases.find(([prefix]) => spec.startsWith(prefix));
    if (hit) base = hit[1] + spec.slice(hit[0].length);
    else if (/^\.\.?(?:\/|$)/.test(spec)) base = resolve(dirname(from), spec);
    else return null;
    const stem = base.replace(/\.(?:[cm]?js|jsx)$/, "");
    for (const candidate of [base, ...EXTENSIONS.map((ext) => stem + ext)]) {
      if (existsSync(candidate) && SOURCE.test(candidate)) return candidate;
    }
    return null;
  };
}

/**
 * The owned files (root-relative, as `ownedFiles` lists them) that no project-owned file
 * reaches, sorted. `ts` defaults to the project's own TypeScript (null: the fallback scan).
 */
export function unreachedFiles(
  root,
  owned,
  { ts = projectTypeScript(root) } = {},
) {
  const ownedAbs = new Set(owned.map((f) => resolve(root, f)));
  const resolveSpec = ts ? compilerResolver(ts, root) : fallbackResolver(root);
  const queue = sourceFiles(root).filter((f) => !ownedAbs.has(f));
  const seen = new Set(queue);
  const reached = new Set();
  while (queue.length > 0) {
    const file = queue.pop();
    let src;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const spec of specifiersOf(file, src, ts)) {
      const target = resolveSpec(file, spec);
      if (!target || seen.has(target)) continue;
      seen.add(target);
      if (ownedAbs.has(target)) reached.add(target);
      queue.push(target);
    }
  }
  return owned
    .filter((f) => SOURCE.test(f) && !reached.has(resolve(root, f)))
    .map((f) => relative(root, resolve(root, f)).split(sep).join("/"))
    .sort();
}
