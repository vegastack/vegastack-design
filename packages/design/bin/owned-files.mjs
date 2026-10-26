// `vegastack-design owned-files` — list the registry-owned files installed in a consuming project.
//
// A consumer keeps registry copies out of its own gates: lint ignores, the unused-code scan, the
// design audit, the drift check. Kept by hand, those lists drift from each other and from what is
// installed (the Regent app had three, each missing a different `@lib` file). This prints the one
// list they can all read, derived from what is actually on disk.
//
// A file is registry-owned when the registry index names its install target and the file exists
// there — an `@ui/`, `@lib/`, `@hooks/` or `@components/` target resolved through components.json
// `aliases`, or a block's project-relative target — or when it carries the provenance header the
// registry stamps (`// @vegastack <name>@<version> sha256-…`). `shadcn add` strips that header on
// install, so the index is what finds most copies; `--offline` (or `--index <file>`) avoids the
// network. The index is fetched exactly the way `check-updates` fetches it: same config, same
// credential headers, same trusted-origin and no-redirect rules.
//
// Read-only: it never writes, installs or edits.

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import {
  fetchRegistryIndex,
  ITEM_NAME_RE,
  PROVENANCE_RE,
  terminalText,
} from "./check-updates.mjs";

const USAGE = `vegastack-design owned-files — list the registry-owned files installed in this project

Usage: vegastack-design owned-files [options]

Prints the project-relative path of every file the VegaStack registry installed here, one per
line, so lint ignores, knip and drift checks can read one generated list.

A file is registry-owned when the registry index names its install target (resolved through
components.json aliases) and the file exists, or when it carries the registry's provenance
header (// @vegastack <name>@<version> sha256-…). shadcn add strips that header, so the index
finds most copies; --offline reports header-carrying files only.

Options:
  --dir <path>      Project root holding components.json (default: the current directory)
  --json            Print { files: string[], items: { name, type, version, files[] }[] }
  --offline         Do not read the registry index; report header-carrying files only
  --index <file>    Read the registry index from a local registry.json instead of fetching it
  --registry <url>  Override the registry URL template (…/{name}.json)
  -h, --help        Show this help

Read-only. Exit codes: 0 = listed · 2 = bad usage, no components.json, or no readable index`;

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  ".turbo",
  "coverage",
]);
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?|css)$/;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = {
    dir: ".",
    json: false,
    offline: false,
    index: null,
    registry: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--offline") opts.offline = true;
    else if (a === "--dir" || a === "--index" || a === "--registry") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-"))
        throw new UsageError(`${a} requires a value`);
      i += 1;
      if (a === "--dir") opts.dir = value;
      else if (a === "--index") opts.index = value;
      else opts.registry = value;
    } else throw new UsageError(`unknown option: ${a}`);
  }
  if (opts.offline && (opts.index || opts.registry))
    throw new UsageError("--offline reads no index; drop --index/--registry");
  return opts;
}

/** `@/components/ui` → `<root>/components/ui`, or `<root>/src/components/ui` when only that exists. */
function aliasDir(root, alias) {
  if (typeof alias !== "string" || alias.length === 0) return null;
  const rel = alias.replace(/^(?:@|~)\//, "");
  const direct = resolve(root, rel);
  if (existsSync(direct)) return direct;
  const src = resolve(root, "src", rel);
  return existsSync(src) ? src : direct;
}

const inside = (dir, path) => path === dir || path.startsWith(dir + sep);

/** Whether `path` is under `root` once every symlink on the way is resolved. */
function reallyInside(root, path) {
  try {
    return inside(realpathSync(root), realpathSync(path));
  } catch {
    return false;
  }
}

/**
 * Where a registry file's `target` lands in this project: `@ui/…`, `@lib/…`, `@hooks/…` and
 * `@components/…` through components.json aliases; a block's bare target (`components/email/x.ts`)
 * under `src/` when the project has one, else under the root — shadcn's own placement.
 */
export function resolveTarget(root, aliases, target) {
  if (typeof target !== "string" || target.length === 0) return null;
  const placeholder = /^@(ui|lib|hooks|components)\/(.+)$/.exec(target);
  let candidates;
  if (placeholder) {
    const dir = aliasDir(
      root,
      aliases?.[placeholder[1]] ??
        { ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" }[
          placeholder[1]
        ],
    );
    if (!dir) return null;
    candidates = [resolve(dir, placeholder[2])];
  } else if (target.startsWith("@")) {
    return null; // a placeholder this command does not know (`@utils/…`)
  } else {
    const rel = target.replace(/^~\//, "");
    candidates = [resolve(root, "src", rel), resolve(root, rel)];
  }
  for (const path of candidates) {
    // Lexically AND physically inside the project: a `..` in a target, or a symlinked alias dir
    // or ancestor pointing elsewhere, never lists (or reads) a file outside it. A symlinked file
    // itself is not a registry copy either.
    if (!inside(root, path) || !reallyInside(root, path)) continue;
    try {
      if (lstatSync(path).isFile()) return path;
    } catch {
      // not installed here
    }
  }
  return null;
}

/** Every source file under `dir` (no symlinks, no build output) whose first line is a provenance header. */
function headeredFiles(dir, out = new Map()) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.isSymbolicLink()) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) headeredFiles(full, out);
    else if (e.isFile() && SOURCE_FILE.test(e.name)) {
      let first;
      try {
        first = readFileSync(full, "utf8").split("\n", 1)[0].replace(/\r$/, "");
      } catch {
        continue;
      }
      const m = PROVENANCE_RE.exec(first);
      if (m) out.set(full, { name: m[1], version: m[2] });
    }
  }
  return out;
}

/**
 * The registry-owned files under `root`: `{ files, items }`, every path project-relative with `/`.
 * `index` is the registry index's `items` (or null for headers only).
 */
export function ownedFiles(root, componentsJson, index) {
  const aliases = componentsJson?.aliases ?? {};
  const owners = new Map(); // absolute path → { name, type, version }

  // Headers first: they name the item and the version that was installed.
  const roots = ["ui", "lib", "hooks", "components"]
    .map((kind) => aliasDir(root, aliases[kind]))
    .filter(
      (d) =>
        d &&
        existsSync(d) &&
        inside(root, d) &&
        reallyInside(root, d) &&
        !lstatSync(d).isSymbolicLink(),
    );
  const searched = roots.filter(
    (d, i) => !roots.some((o, j) => j !== i && d !== o && inside(o, d)),
  );
  for (const d of [...new Set(searched)])
    for (const [path, header] of headeredFiles(d))
      owners.set(path, { ...header, type: null });

  for (const item of index ?? []) {
    if (
      !item ||
      typeof item !== "object" ||
      !ITEM_NAME_RE.test(item.name ?? "") ||
      !Array.isArray(item.files)
    )
      continue;
    for (const file of item.files) {
      const path = resolveTarget(root, aliases, file?.target);
      if (!path) continue;
      const known = owners.get(path);
      if (known && known.name !== item.name) continue; // the header (or an earlier item) wins
      owners.set(path, {
        name: item.name,
        type: typeof item.type === "string" ? item.type : null,
        version: known?.version ?? null,
      });
    }
  }

  const items = new Map();
  for (const [path, owner] of owners) {
    const rel = relative(root, path).split(sep).join("/");
    const entry = items.get(owner.name) ?? {
      name: owner.name,
      type: owner.type,
      version: null,
      files: [],
    };
    entry.type ??= owner.type;
    entry.version ??= owner.version;
    entry.files.push(rel);
    items.set(owner.name, entry);
  }
  const sorted = [...items.values()]
    .map((item) => ({ ...item, files: item.files.sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { files: sorted.flatMap((i) => i.files).sort(), items: sorted };
}

export async function main(argv = []) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`owned-files: ${terminalText(err.message)}\n`);
    console.error(USAGE);
    return 2;
  }
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }
  const root = resolve(opts.dir);
  const cjPath = join(root, "components.json");
  let componentsJson;
  try {
    componentsJson = JSON.parse(readFileSync(cjPath, "utf8"));
  } catch (err) {
    console.error(
      `✗ could not read ${terminalText(cjPath)}: ${terminalText(err.message)} — owned-files resolves install targets through its aliases`,
    );
    return 2;
  }

  let index = null;
  let source = "headers";
  if (opts.index) {
    try {
      index = JSON.parse(readFileSync(resolve(opts.index), "utf8")).items;
      if (!Array.isArray(index)) throw new Error("no items array");
      source = terminalText(opts.index);
    } catch (err) {
      console.error(
        `✗ could not read the index ${terminalText(opts.index)}: ${terminalText(err.message)}`,
      );
      return 2;
    }
  } else if (!opts.offline) {
    try {
      const fetched = await fetchRegistryIndex({
        cwd: root,
        registry: opts.registry,
        componentsJson,
      });
      index = fetched.items;
      source = fetched.url;
    } catch (err) {
      console.error(`✗ ${terminalText(err.message)}`);
      console.error(
        "  pass --offline to list header-carrying files only, or --index <registry.json>",
      );
      return 2;
    }
  }

  const result = ownedFiles(root, componentsJson, index);
  if (opts.json) {
    console.log(JSON.stringify({ source, ...result }, null, 2));
    return 0;
  }
  for (const file of result.files) console.log(file);
  if (result.files.length === 0)
    console.error(`no registry-owned files found (index: ${source})`);
  return 0;
}
