// `vegastack-design doctor` — check a consuming project's setup.
//
// Motivated by a real consumer failure (VegaStack CRM, 2026-07-27): a missing
// `@tailwindcss/postcss` plugin produces two different, equally misleading results.
// Under Turbopack the build dies with `Can't resolve 'tw-animate-css'`, naming a
// dependency that is installed and fine. Under webpack the build SUCCEEDS, the token
// theme lands (it is literal CSS inside preset.css), and zero utility classes are
// generated — so the app renders with correct colours and no spacing or layout, which
// reads as "the design system is broken".
//
// A human will not attribute either symptom correctly, which is exactly why this is a
// command and not a paragraph in a guide. Every check here maps to a documented failure
// mode in the Troubleshooting guide.
//
// It also scans the project's OWN source for vocabulary the shadcn reset retired (0.5.0 → now):
// `text-h2`, `bg-destructive-subtle`, `var(--z-toast)`, an `@/components/ui/icon-button` import.
// A retired utility compiles to NOTHING — no build error, no type error — so a heading silently
// renders as body text. The Regent consumer carried 338 such classes past every other check
// (2026-09-23), which is why this is a failing check and not a guide section.
//
// Read-only: it never writes, installs, or edits. Exit 0 = all good, 1 = a real problem,
// so it composes into CI as `vegastack-design doctor`.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const POSTCSS_CONFIGS = [
  "postcss.config.mjs",
  "postcss.config.js",
  "postcss.config.cjs",
  "postcss.config.ts",
  "postcss.config.json",
  ".postcssrc",
  ".postcssrc.json",
];

const CSS_SEARCH_DIRS = [
  "app",
  "src/app",
  "src/styles",
  "styles",
  "src",
  "apps",
];

const USAGE = `
Usage: vegastack-design doctor [options]

Checks a consuming project's VegaStack setup and reports what is wrong and how to fix it.
Also scans the project's own source (not node_modules, build output, or the components.json
\`ui\` alias directory) for vocabulary the shadcn reset retired, and reports each as file:line.

Options:
  --dir <path>   Project root to inspect (default: the current directory)
  -h, --help     Show this help

Exit codes: 0 = no problems · 1 = at least one failure · 2 = bad usage
`.trim();

/** Collect .css files under a few conventional roots, shallowly, without walking node_modules. */
function findCssFiles(root, max = 200) {
  const out = [];
  const seen = new Set();
  const walk = (dir, depth) => {
    if (out.length >= max || depth > 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= max) return;
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (seen.has(full)) continue;
      seen.add(full);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.name.endsWith(".css")) out.push(full);
    }
  };
  for (const d of CSS_SEARCH_DIRS) {
    const full = join(root, d);
    if (existsSync(full) && statSync(full).isDirectory()) walk(full, 0);
  }
  return out;
}

/** CSS comments frequently *mention* the thing we are looking for — strip them before matching. */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Nearest ancestor of `from` (inclusive) that has a package.json, bounded by `root`. */
function nearestPackageRoot(from, root) {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "package.json"))) return dir;
    if (dir === root) break;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return root;
}

function readIfExists(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function readJson(path) {
  const raw = readIfExists(path);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---- retired vocabulary ----------------------------------------------------------------------
// Each entry: a pattern over one source line, a replacement hint (from the "Migrating to the shadcn
// reset" guide, where every row has its full table), and — for token families a project may
// legitimately define for itself — the custom property whose DECLARATION in the scanned source
// means "this is yours, not ours". Kept here and dependency-free on purpose: doctor must run in a
// fresh consumer before anything else is installed correctly.
const GUIDE = "https://design.vegastack.com/docs/guides/migrating-shadcn-reset";
const HEADING_HINT = {
  "text-h1": "text-3xl font-semibold (page heading)",
  "text-h2": "text-2xl font-semibold (section heading)",
  "text-h3": "text-lg font-semibold",
  "text-h4": "text-base font-medium (card / dialog title)",
};
const DISPLAY_HINT = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-6xl",
  xl: "text-7xl",
};
// The literal each deleted `--alpha-*` token carried. Derived from the token HISTORY, not only the
// last pre-reset snapshot: every name ever declared in packages/design-tokens (git log -S over
// src/tokens.ts and tokens/*.tokens.json) is here. Nineteen are the migration guide's section 4.2
// ladder, retired by the shadcn reset; five were retired before it, per the design-tokens
// CHANGELOG — fill-hover, input-hover and surface-subtle with `track` (#77), soft-hover and
// soft-surface with the Bubble contrast fix (#113). A theme-split token gives [light, dark].
const ALPHA = {
  "fill-hover": 80,
  "input-hover": 50,
  "surface-subtle": 10,
  "soft-surface": [10, 20],
  "soft-hover": [20, 30],
  "surface-faint": 5,
  hover: 7,
  border: 8,
  pressed: 10,
  "ink-tint": 10,
  "ink-tint-strong": 15,
  "border-subtle": 20,
  "border-soft": 30,
  input: 30,
  "wash-faint": 40,
  wash: 50,
  "outline-border": 50,
  "outline-soft": 50,
  "wash-strong": 60,
  "backdrop-soft": 60,
  "tint-border": 70,
  "link-hover": 88,
  glass: 90,
  "glass-hover": 95,
};
const OPACITY = { track: 25, dim: 50, "hint-soft": 60, hint: 70 };
const Z = {
  raised: "z-10",
  overlay: "z-50 — one overlay band, DOM order decides",
  toast:
    "nothing — the Toast viewport sets its own z-60, the one exception to z-50",
};
const RETIRED_COMPONENTS = {
  "icon-button":
    'Button with size="icon" (or icon-sm / icon-lg) and an aria-label',
  segmented: "a joined ToggleGroup",
  "password-input":
    "an InputGroup composition (Input + an InputGroupButton reveal toggle)",
  "progress-indicator": "Progress (determinate) or Spinner (indeterminate)",
  "field-inline": "EditableCell",
  "floating-surface": "Popover / HoverCard — FloatingSurface was internal only",
  "section-header":
    "nothing — removed with the marketing layer; compose your own heading",
  sonner:
    "toast (`@/components/ui/toast`, `toast.add({ title })`) — Sonner was retired in 0.12.0",
};
const B = String.raw`(?<![\w-])`; // a utility or custom property starts here
const E = String.raw`(?![\w-])`; // …and ends here
/** An alternation of exactly these names, longest first so `border-subtle` wins over `border`. */
const oneOf = (names) =>
  [...names].sort((a, b) => b.length - a.length).join("|");
// The four STATUS families are the only ones that ever shipped a `-subtle` step (guide section 4.5);
// `--tag-*-subtle` is kept, and a `muted`/`accent`/project family never had one, so neither is matched.
const SUBTLE_FAMILIES = ["destructive", "success", "warning", "info"];
export const RETIRED_VOCABULARY = [
  {
    id: "text-h*",
    re: new RegExp(`${B}text-h[1-4]${E}`, "g"),
    hint: (m) => HEADING_HINT[m],
    declared: (m) => `--text-${m.slice(5)}`,
  },
  {
    id: "text-label*",
    re: new RegExp(`${B}text-label(?:-sm)?${E}`, "g"),
    hint: (m) =>
      m.endsWith("-sm") ? "text-xs font-medium" : "text-sm font-medium",
    declared: (m) => `--${m}`,
  },
  {
    id: "text-mono-label",
    re: new RegExp(`${B}text-mono-label${E}`, "g"),
    hint: () =>
      "font-mono text-xs for code/data — a label is font-sans text-xs font-medium; no tracking, no uppercase",
    declared: (m) => `--${m}`,
  },
  {
    id: "text-code*",
    re: new RegExp(`${B}text-code(?:-sm)?${E}`, "g"),
    hint: (m) =>
      m.endsWith("-sm") ? "font-mono text-xs" : "font-mono text-sm",
    declared: (m) => `--${m}`,
  },
  {
    id: "text-strong",
    re: new RegExp(`${B}text-strong${E}`, "g"),
    hint: () => "text-sm font-semibold",
    declared: (m) => `--${m}`,
  },
  {
    id: "text-display-*",
    re: new RegExp(`${B}text-display-(?:sm|md|lg|xl)${E}`, "g"),
    hint: (m) =>
      `${DISPLAY_HINT[m.slice(13)]} — the ramp supplies tracking; write no tracking-*`,
    declared: (m) => `--${m}`,
  },
  {
    // The four STATUS families lost their -subtle step — and only those four ever had one, so the
    // hint's `text-<family>-text` always names a real token.
    id: "*-subtle",
    re: new RegExp(
      `${B}(?:bg|text|border|ring|outline|fill|stroke|divide|from|to|via)-(${SUBTLE_FAMILIES.join("|")})-subtle(?:-hover|-active)?${E}`,
      "g",
    ),
    hint: (m, family) => {
      return m.includes("-subtle-")
        ? `hover:bg-${family}/20 (the -hover/-active steps are gone)`
        : `bg-${family}/10 (a tint of the family), with text-${family}-text for text on it`;
    },
    declared: (m) => {
      const name = m.replace(/^[a-z]+-/, "");
      return [`--${name}`, `--color-${name}`];
    },
  },
  {
    // Only the names the system shipped (see ALPHA). `--alpha-*` is an open prefix other
    // libraries use too, and a name we never shipped is not ours to call retired.
    id: "--alpha-*",
    re: new RegExp(`${B}--alpha-(?:${oneOf(Object.keys(ALPHA))})${E}`, "g"),
    hint: (m) => {
      const pct = ALPHA[m.slice(8)];
      if (Array.isArray(pct))
        return `the literal /${pct[0]} in light with a dark: variant at /${pct[1]}, e.g. bg-destructive/${pct[0]} dark:bg-destructive/${pct[1]}`;
      return `the literal /${pct}, e.g. bg-foreground/${pct}`;
    },
    declared: (m) => m,
  },
  {
    id: "--opacity-*",
    re: new RegExp(`${B}--opacity-(?:${oneOf(Object.keys(OPACITY))})${E}`, "g"),
    hint: (m) => `opacity-${OPACITY[m.slice(10)]}`,
    declared: (m) => m,
  },
  {
    // `--z-index`, `--z-modal`, … belong to other libraries; only the three named bands are ours.
    id: "--z-*",
    re: new RegExp(`${B}--z-(?:${oneOf(Object.keys(Z))})${E}`, "g"),
    hint: (m) => Z[m.slice(4)],
    declared: (m) => m,
  },
  {
    id: "shadow-overlay",
    re: new RegExp(`${B}(?:--)?shadow-overlay${E}`, "g"),
    hint: () => "shadow-md (a popover) or shadow-lg (a modal)",
    declared: () => "--shadow-overlay",
  },
  {
    id: "backdrop-blur-glass",
    re: new RegExp(`${B}backdrop-blur-glass${E}`, "g"),
    hint: () =>
      "delete it — the glass effect went with the marketing layer (backdrop-blur-xs is upstream's scrim blur)",
    declared: () => "--blur-glass",
  },
  {
    id: "retired component",
    // An import/require/dynamic-import specifier whose LAST path segment is a retired item — and
    // only when the specifier resolves INTO the ui alias directory (`accept`): a project's own
    // `@/components/layout/section-header` or `./sonner` is its code, not a registry copy. A bare
    // `"sonner"` (the npm package) is not a registry import and is left alone.
    re: new RegExp(
      String.raw`(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)["']([^"']*)\/(${Object.keys(RETIRED_COMPONENTS).join("|")})(?:\.[jt]sx?)?["']`,
      "g",
    ),
    accept: (m, ctx) => importsIntoUi(m[1], ctx),
    hint: (_m, _dir, name) => RETIRED_COMPONENTS[name],
    declared: () => null,
    label: (_m, _dir, name) => `import …/${name}`,
  },
];

// Code and stylesheets only. Prose (`.md`/`.mdx`) that NAMES a retired token — a changelog, a
// migration note — is not a use of it, and would bury the real findings.
const SCAN_EXTENSIONS = /\.(?:[cm]?[jt]sx?|css|scss)$/;
const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "storybook-static",
]);
const SCAN_MAX_FILES = 20000;
const SCAN_MAX_BYTES = 1024 * 1024;

/**
 * The directories components.json's `ui` alias names, resolved against the file's own folder.
 * Those files are registry copies — `check-updates` owns them, and a re-pull replaces them — so
 * a retired name inside one is not the consumer's own code. `@/x` and `~/x` resolve to `x` or
 * `src/x`, whichever exists (the shadcn convention for a src-dir project).
 */
export function uiAliasDirs(componentsJson, componentsDir) {
  const alias = componentsJson?.aliases?.ui;
  const candidates = [];
  if (typeof alias === "string" && alias.length > 0) {
    const bare = alias.replace(/^(?:@|~)\//, "");
    candidates.push(
      join(componentsDir, bare),
      join(componentsDir, "src", bare),
    );
  } else {
    candidates.push(
      join(componentsDir, "components", "ui"),
      join(componentsDir, "src", "components", "ui"),
    );
  }
  return candidates.filter((d) => existsSync(d)).map((d) => resolve(d));
}

/**
 * Does an import specifier (the part before the retired name) resolve into the ui alias directory?
 * Three spellings do: the components.json `ui` alias (`@/components/ui`), the registry's own
 * `@/components/ui` convention, and a relative path that lands in one of the ui alias dirs.
 */
function importsIntoUi(specDir, { file, uiAliases, uiDirs }) {
  if (uiAliases.includes(specDir)) return true;
  if (specDir === "." || specDir === ".." || /^\.\.?\//.test(specDir)) {
    const target = resolve(dirname(file), specDir);
    return uiDirs.includes(target);
  }
  return false;
}

/**
 * Blank what is not class or CSS usage, keeping every newline so line numbers survive: `//` and
 * `/* *\/` comments, and — in script files — a string literal that reads as prose ("Use text-strong
 * for emphasis"). A class string is lower-case utility tokens; a capitalised word or sentence
 * punctuation marks a sentence (never `!`, which is Tailwind's important modifier: `hidden!`).
 *
 * In a script file, JSX TEXT is not code, so nothing in it may open a comment or a string: an
 * apostrophe ("Don't"), a URL's `//`, a glob's `/*`. Without a parser, position decides — a string
 * opens only where an expression can begin (after `=`, `(`, `,`, `[`, `{`, `:`, `?`, an operator,
 * `=>`, or a keyword such as `return`), and a comment only after whitespace or code punctuation,
 * never after `:` (`https://`) or a word (`src/*.ts`).
 */
const EXPRESSION_KEYWORDS = new Set([
  "return",
  "case",
  "typeof",
  "in",
  "of",
  "yield",
  "await",
  "void",
  "delete",
  "throw",
  "from",
  "import",
  "export",
  "default",
  "else",
  "do",
]);
function canStartExpression(src, i) {
  let k = i - 1;
  while (k >= 0 && /\s/.test(src[k])) k -= 1;
  if (k < 0) return true;
  const p = src[k];
  if (p === ">") return src[k - 1] === "="; // `=>`, never a JSX tag's `>`
  if ("=(,[{:?&|!+-*%^~<;".includes(p)) return true;
  if (/[\w$]/.test(p)) {
    let w = k;
    while (w >= 0 && /[\w$]/.test(src[w])) w -= 1;
    return EXPRESSION_KEYWORDS.has(src.slice(w + 1, k + 1));
  }
  return false;
}
const canStartComment = (src, i) => i === 0 || /[\s;,{}()[\]]/.test(src[i - 1]);

export function maskNonUsage(
  src,
  { script = true, lineComments = script } = {},
) {
  const out = src.split("");
  const blank = (from, to) => {
    for (let k = from; k < to; k += 1) if (out[k] !== "\n") out[k] = " ";
  };
  const isProse = (text) =>
    /(?:^|\s)[A-Z][a-z]+(?=[\s,.;:!?]|$)|[a-z][.,;:?](?:\s|$)/.test(
      text.replace(/\[[^\]]*\]|\([^)]*\)/g, ""),
    );
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "*" && (!script || canStartComment(src, i))) {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      blank(i, stop);
      i = stop;
    } else if (
      c === "/" &&
      next === "/" &&
      lineComments &&
      (script ? canStartComment(src, i) : i === 0 || /\s/.test(src[i - 1]))
    ) {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      blank(i, stop);
      i = stop;
    } else if (
      (c === '"' || c === "'" || c === "`") &&
      (!script || canStartExpression(src, i))
    ) {
      let j = i + 1;
      while (j < src.length && src[j] !== c) {
        if (src[j] === "\\") j += 1;
        else if (src[j] === "\n" && c !== "`") break;
        j += 1;
      }
      if (script && isProse(src.slice(i + 1, j))) blank(i + 1, j);
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return out.join("");
}

/**
 * Class names a stylesheet DEFINES — `@utility text-h2 { … }` (a `-*` functional utility as a
 * prefix) and plain class selectors such as `.text-strong { … }`. A retired name the project defines
 * itself compiles, so it is the project's, not a silent no-op.
 */
function definedClasses(css) {
  const exact = new Set();
  const prefixes = [];
  for (const m of css.matchAll(/([^{};]+)\{/g)) {
    const prelude = m[1].trim();
    const utility = prelude.match(/^@utility\s+([\w-]+?)(-\*)?$/);
    if (utility) {
      if (utility[2]) prefixes.push(`${utility[1]}-`);
      else exact.add(utility[1]);
    } else if (!prelude.startsWith("@")) {
      for (const c of prelude.matchAll(/\.((?:\\.|[\w-])+)/g))
        exact.add(c[1].replace(/\\(.)/g, "$1"));
    }
  }
  return { exact, prefixes };
}

/** Every retired-vocabulary occurrence under `root`, skipping build output and the ui alias dirs. */
export function scanRetiredVocabulary(
  root,
  { skipDirs = [], uiAlias = null } = {},
) {
  const skip = new Set(skipDirs.map((d) => resolve(d)));
  const uiAliases = [
    ...new Set(
      [uiAlias, "@/components/ui"]
        .filter((a) => typeof a === "string" && a.length > 0)
        .map((a) => a.replace(/\/+$/, "")),
    ),
  ];
  const uiDirs = [...skip];
  const files = [];
  const walk = (dir) => {
    if (files.length >= SCAN_MAX_FILES) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || SCAN_SKIP_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!skip.has(resolve(full))) walk(full);
      } else if (e.isFile() && SCAN_EXTENSIONS.test(e.name)) {
        files.push(full);
        if (files.length >= SCAN_MAX_FILES) return;
      }
    }
  };
  walk(root);

  const sources = [];
  const declared = new Set();
  const declaredClasses = new Set();
  const classPrefixes = [];
  for (const file of files) {
    try {
      if (statSync(file).size > SCAN_MAX_BYTES) continue;
    } catch {
      continue;
    }
    const raw = readIfExists(file);
    if (raw == null) continue;
    const css = /\.s?css$/.test(file);
    const src = maskNonUsage(raw, {
      script: !css,
      lineComments: !css || file.endsWith(".scss"),
    });
    sources.push({ file, src });
    for (const m of src.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g))
      declared.add(m[1]);
    if (css) {
      const defined = definedClasses(src);
      for (const name of defined.exact) declaredClasses.add(name);
      classPrefixes.push(...defined.prefixes);
    }
  }
  const definesClass = (name) =>
    declaredClasses.has(name) ||
    classPrefixes.some((prefix) => name.startsWith(prefix));

  const findings = [];
  for (const { file, src } of sources) {
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.length > 4000) continue; // minified output that slipped past the dir skips
      for (const rule of RETIRED_VOCABULARY) {
        rule.re.lastIndex = 0;
        for (const m of line.matchAll(rule.re)) {
          const groups = m.slice(1);
          if (rule.accept && !rule.accept(m, { file, uiAliases, uiDirs }))
            continue;
          const own = [rule.declared(m[0], ...groups)].flat().filter(Boolean);
          if (own.some((name) => declared.has(name))) continue;
          if (!m[0].startsWith("--") && definesClass(m[0])) continue;
          findings.push({
            file: relative(root, file).split(sep).join("/"),
            line: i + 1,
            match: rule.label ? rule.label(m[0], ...groups) : m[0],
            hint: rule.hint(m[0], ...groups),
          });
        }
      }
    }
  }
  return {
    files: sources.length,
    findings,
    truncated: files.length >= SCAN_MAX_FILES,
  };
}

export function main(argv = []) {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    return 0;
  }
  const dirFlag = argv.indexOf("--dir");
  if (dirFlag !== -1 && argv[dirFlag + 1] == null) {
    console.error("doctor: --dir requires a path\n");
    console.error(USAGE);
    return 2;
  }
  const root = dirFlag === -1 ? process.cwd() : argv[dirFlag + 1];

  if (!existsSync(root)) {
    console.error(`doctor: no such directory: ${root}`);
    return 2;
  }

  const results = [];
  const ok = (name, detail) => results.push({ level: "ok", name, detail });
  const warn = (name, detail, fix) =>
    results.push({ level: "warn", name, detail, fix });
  const fail = (name, detail, fix) =>
    results.push({ level: "fail", name, detail, fix });

  // ---- 1. the design system is installed -------------------------------------------------
  const pkg = readJson(join(root, "package.json"));
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };
  const designInstalled =
    "@vegastack/design" in deps ||
    existsSync(join(root, "node_modules", "@vegastack", "design"));

  if (designInstalled) {
    const installed = readJson(
      join(root, "node_modules", "@vegastack", "design", "package.json"),
    );
    ok(
      "@vegastack/design installed",
      installed?.version
        ? `v${installed.version}`
        : (deps["@vegastack/design"] ?? ""),
    );
  } else {
    fail(
      "@vegastack/design installed",
      "not found in package.json or node_modules",
      "pnpm add @vegastack/design",
    );
  }

  // ---- 2. the preset is imported ----------------------------------------------------------
  const cssFiles = findCssFiles(root);
  const presetFiles = cssFiles.filter((f) =>
    (readIfExists(f) ?? "").includes("@vegastack/design/preset.css"),
  );

  if (presetFiles.length > 0) {
    ok(
      "preset.css imported",
      presetFiles.map((f) => relative(root, f)).join(", "),
    );
  } else {
    fail(
      "preset.css imported",
      cssFiles.length === 0
        ? "no .css files found under app/, src/, or styles/"
        : `none of ${cssFiles.length} .css file(s) import it`,
      'add `@import "@vegastack/design/preset.css";` to your global stylesheet',
    );
  }

  // ---- 3. THE BIG ONE: the Tailwind PostCSS plugin ----------------------------------------
  // Without it Tailwind never runs: no utilities are generated, and depending on the bundler
  // you either get a misleading `Can't resolve 'tw-animate-css'` or a silently unstyled app.
  // In a workspace the config correctly lives in the APP package, not the repo root, so search
  // every package that owns a preset-importing stylesheet as well as the root itself.
  const postcssRoots = [
    root,
    ...presetFiles.map((f) => nearestPackageRoot(dirname(f), root)),
  ].filter((d, i, a) => a.indexOf(d) === i);
  const postcssPath = postcssRoots
    .flatMap((d) => POSTCSS_CONFIGS.map((n) => join(d, n)))
    .find(existsSync);
  const postcssOwnerPkg = postcssPath
    ? readJson(join(dirname(postcssPath), "package.json"))
    : null;
  const postcssInline = (postcssOwnerPkg ?? pkg)?.postcss
    ? JSON.stringify((postcssOwnerPkg ?? pkg).postcss)
    : null;
  const postcssSource = postcssPath ? readIfExists(postcssPath) : postcssInline;
  const hasPlugin =
    postcssSource != null && postcssSource.includes("@tailwindcss/postcss");

  if (hasPlugin) {
    ok(
      "Tailwind PostCSS plugin",
      postcssPath ? relative(root, postcssPath) : "package.json#postcss",
    );
  } else if (postcssSource != null) {
    fail(
      "Tailwind PostCSS plugin",
      `${postcssPath ? relative(root, postcssPath) : "package.json#postcss"} exists but does not configure @tailwindcss/postcss`,
      'add `"@tailwindcss/postcss": {}` to its plugins',
    );
  } else {
    fail(
      "Tailwind PostCSS plugin",
      "no PostCSS config found — Tailwind will not run, so NO utility classes are generated",
      'pnpm add -D @tailwindcss/postcss, then create postcss.config.mjs:\n     const config = { plugins: { "@tailwindcss/postcss": {} } };\n     export default config;',
    );
  }

  // ---- 4. no duplicate Tailwind import ----------------------------------------------------
  // preset.css already imports Tailwind; a second bare import is the documented cause of
  // "utilities exist but everything is unstyled".
  const duplicateTailwind = presetFiles.filter((f) => {
    const src = stripCssComments(readIfExists(f) ?? "");
    return /@import\s+["']tailwindcss["']/.test(src);
  });
  if (duplicateTailwind.length > 0) {
    warn(
      "no duplicate Tailwind import",
      `${duplicateTailwind.map((f) => relative(root, f)).join(", ")} also imports "tailwindcss" directly`,
      "remove it — preset.css imports Tailwind itself",
    );
  } else if (presetFiles.length > 0) {
    ok("no duplicate Tailwind import", "preset.css is the only Tailwind entry");
  }

  // ---- 5. registry access is configured ---------------------------------------------------
  let componentsJsonPath = join(root, "components.json");
  let componentsJson = readJson(componentsJsonPath);
  if (componentsJson == null) {
    // Walk up: in a workspace the canonical components.json commonly sits at the repo root.
    let dir = root;
    for (let i = 0; i < 5 && componentsJson == null; i += 1) {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
      const candidate = join(dir, "components.json");
      if (existsSync(candidate)) {
        componentsJsonPath = candidate;
        componentsJson = readJson(candidate);
      }
    }
  }
  if (componentsJson == null) {
    warn(
      "registry configured",
      "no components.json here or in any parent directory",
      "see the Quickstart — needed before `shadcn add @vegastack/<name>`",
    );
  } else if (componentsJson.registries?.["@vegastack"] == null) {
    fail(
      "registry configured",
      'components.json has no `registries["@vegastack"]` entry',
      "add the registries block from the Quickstart",
    );
  } else {
    ok(
      "registry configured",
      `${relative(root, componentsJsonPath) || "components.json"} declares @vegastack`,
    );
  }

  // ---- 6. monorepo hint --------------------------------------------------------------------
  // Source detection is relative to the CSS file, so components living outside the app's tree
  // compile to nothing unless declared. Only worth saying when this actually looks like a workspace.
  const isWorkspace =
    existsSync(join(root, "pnpm-workspace.yaml")) ||
    Array.isArray(pkg?.workspaces) ||
    pkg?.workspaces != null;
  if (isWorkspace && presetFiles.length > 0) {
    const declaresSource = presetFiles.some((f) =>
      (readIfExists(f) ?? "").includes("@source"),
    );
    if (declaresSource) {
      ok("monorepo sources declared", "@source directives present");
    } else {
      warn(
        "monorepo sources declared",
        "workspace detected but no @source directive — components outside this app's tree will compile to nothing",
        'add e.g. `@source "../../../../packages/ui/src";` next to the preset import',
      );
    }
  }

  // ---- 7. no retired vocabulary in the project's own source --------------------------------
  const skipDirs = componentsJson
    ? uiAliasDirs(componentsJson, dirname(componentsJsonPath))
    : uiAliasDirs(null, root);
  const scan = scanRetiredVocabulary(root, {
    skipDirs,
    uiAlias: componentsJson?.aliases?.ui ?? null,
  });
  const scanned = `${scan.files} source file(s)${
    skipDirs.length
      ? `, skipping ${skipDirs.map((d) => relative(root, d) || ".").join(", ")}`
      : ""
  }${scan.truncated ? ` (stopped at ${SCAN_MAX_FILES} files)` : ""}`;
  if (scan.findings.length === 0) {
    ok("no retired vocabulary", scanned);
  } else {
    const inFiles = new Set(scan.findings.map((f) => f.file)).size;
    results.push({
      level: "fail",
      name: "no retired vocabulary",
      detail: `${scan.findings.length} occurrence(s) in ${inFiles} file(s) of ${scanned} — these compile to nothing, silently`,
      fix: `rewrite each as its hint says; every row is in ${GUIDE}`,
      findings: scan.findings.map(
        (f) => `${f.file}:${f.line}  ${f.match}  →  ${f.hint}`,
      ),
    });
  }

  // ---- report -------------------------------------------------------------------------------
  const glyph = { ok: "✓", warn: "!", fail: "✗" };
  console.log("");
  for (const r of results) {
    console.log(
      `  ${glyph[r.level]} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`,
    );
    for (const finding of r.findings ?? []) console.log(`     ${finding}`);
    if (r.fix) console.log(`     fix: ${r.fix}`);
  }

  const failures = results.filter((r) => r.level === "fail").length;
  const warnings = results.filter((r) => r.level === "warn").length;
  console.log("");
  if (failures > 0) {
    console.log(
      `  ${failures} problem(s), ${warnings} warning(s). See https://design.vegastack.com/docs/guides/troubleshooting`,
    );
    return 1;
  }
  console.log(
    warnings > 0
      ? `  setup looks correct (${warnings} warning(s)).`
      : "  setup looks correct.",
  );
  return 0;
}
