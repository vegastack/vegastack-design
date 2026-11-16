// Which registry-owned files nothing in the consuming project reaches — the copies a pull keeps
// refreshing although no screen uses them (`vegastack-design owned-files --unreached`).
//
// A project's unused-code scan cannot say: it ignores the registry folders, because their files
// are the design system's to change, so a copy nobody imports rides along with every pull. This
// walks the imports the project's OWN files make — static and dynamic `import`, `export … from`,
// `require`, `vi.mock`, and the ESM lines of an `.mdx` page — through relative paths and
// `tsconfig.json` path aliases, follows them through the registry files they land on, and
// reports the owned files it never lands on. Comments are masked first, so a code example in a
// JSDoc block reaches nothing. Read-only.
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

/** The module specifiers a file's code imports (comments masked; an `.mdx` page's ESM lines only). */
export function specifiersOf(file, src) {
  const code = file.endsWith(".mdx")
    ? src
        .split("\n")
        .filter((line) => /^(?:import|export)\s/.test(line))
        .join("\n")
    : maskNonUsage(src);
  return [...code.matchAll(SPECIFIER)].map((m) => m[2]);
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

/**
 * The owned files (root-relative, as `ownedFiles` lists them) that no project-owned file
 * reaches, sorted.
 */
export function unreachedFiles(root, owned) {
  const ownedAbs = new Set(owned.map((f) => resolve(root, f)));
  const aliases = pathAliases(root);
  const resolveSpec = (from, spec) => {
    let base;
    const hit = aliases.find(([prefix]) => spec.startsWith(prefix));
    if (hit) base = hit[1] + spec.slice(hit[0].length);
    else if (/^\.\.?(?:\/|$)/.test(spec)) base = resolve(dirname(from), spec);
    else return null;
    for (const ext of EXTENSIONS) {
      const candidate = base + ext;
      if (existsSync(candidate) && SOURCE.test(candidate)) return candidate;
    }
    return null;
  };
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
    for (const spec of specifiersOf(file, src)) {
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
