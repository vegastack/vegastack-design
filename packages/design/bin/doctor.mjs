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
// And it holds pages to the one page layout: an `AppShellPage` picks its width with `size`
// (`prose` · `default` · `full`) and pads with the shared page gutter, so a `max-w-*`, `mx-*`,
// `w-*` or padding class on one is a page choosing its own width or gutter, and fails.
//
// And it warns where code works around a DS part instead of using it — a Tailwind `!` on a ui part,
// a width class on a popover or menu popup, a hand-written `<header>` inside overlay content, an
// `AppShellPage size` that disagrees with the route map. Those four warn by default and fail under
// `--strict`, so a consumer can take the release, fix what they report, and then turn the gate on.
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
\`ui\` alias directory) and reports each finding as file:line:

  retired vocabulary      a utility, token or component the shadcn reset retired      (fails)
  page layout             an AppShellPage class that sets the page's width or gutter  (fails)
  important on DS parts   a Tailwind \`!\` modifier in the className of a ui part       (warns)
  popup width             w-*/min-w-*/max-w-* on a popover, menu or select popup       (warns)
  overlay header          a hand-written <header> inside Sheet/Drawer/Dialog content   (warns)
  page width vs route map an AppShellPage size in an App Router page or layout that
                          disagrees with the definePageWidths route map               (warns)

Options:
  --dir <path>   Project root to inspect (default: the current directory)
  --strict       Fail (exit 1) on the four composition checks instead of warning
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
  "text-h1":
    "PageHeader (font-heading text-2xl font-semibold, the page heading)",
  "text-h2": "font-heading text-base font-medium (section heading)",
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
 *
 * `blankStrings` blanks EVERY string's content (quotes kept): the structure copy the composition
 * scan finds tags in, where no string may open or close one.
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

/**
 * The index of the quote closing the string that opens at `i` (or of the line end / file end where
 * an unterminated one gives up). A template's `${…}` is skipped whole — braces counted, strings and
 * nested templates inside it skipped — so a backtick in an interpolation does not end the template.
 */
function stringEnd(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length && src[j] !== q) {
    if (src[j] === "\\") j += 1;
    else if (src[j] === "\n" && q !== "`") break;
    else if (q === "`" && src[j] === "$" && src[j + 1] === "{") {
      let depth = 0;
      for (j += 1; j < src.length; j += 1) {
        const ch = src[j];
        if (ch === '"' || ch === "'" || ch === "`") j = stringEnd(src, j);
        else if (ch === "{") depth += 1;
        else if (ch === "}" && (depth -= 1) === 0) break;
      }
    }
    j += 1;
  }
  return j;
}

export function maskNonUsage(
  src,
  { script = true, lineComments = script, blankStrings = false } = {},
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
      const j = stringEnd(src, i);
      if (script && (blankStrings || isProse(src.slice(i + 1, j))))
        blank(i + 1, j);
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

// ---- page layout -----------------------------------------------------------------------------

/**
 * A class on an `AppShellPage` that picks the page's width or gutter — which `size` and the page
 * gutter own. `pb-*` stays legal: room at the bottom for a docked save bar is not a gutter.
 */
const PAGE_OVERRIDE =
  /(?<![\w-])(?:[\w@\[\]()/.:-]*:)?(?:max-w|min-w|w|mx|ms|me|px|ps|pe|p|py|pt)-[^\s"'`]+/g;

/**
 * Every `AppShellPage` in the project's own source that sets its own width or gutter (a failure)
 * or still says `size="narrow"` (a warning — `prose` is its name now).
 */
export function scanPageLayout(root, { skipDirs = [] } = {}) {
  const skip = new Set(skipDirs.map((d) => resolve(d)));
  const findings = [];
  const deprecated = [];
  const walk = (dir) => {
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
        continue;
      }
      if (!e.isFile() || !/\.[jt]sx$/.test(e.name)) continue;
      const src = readIfExists(full);
      if (src == null || !src.includes("<AppShellPage")) continue;
      const file = relative(root, full).split(sep).join("/");
      for (const tag of src.matchAll(/<AppShellPage\b(?:[^>{]|\{[^}]*\})*>/g)) {
        const line = src.slice(0, tag.index).split("\n").length;
        const cls = /\bclassName=(?:"([^"]*)"|\{([\s\S]*?)\}(?=\s|\/?>))/.exec(
          tag[0],
        );
        const text = cls ? (cls[1] ?? cls[2] ?? "") : "";
        for (const m of text.matchAll(PAGE_OVERRIDE))
          findings.push({ file, line, match: m[0] });
        if (/\bsize=(?:"narrow"|\{\s*["']narrow["']\s*\})/.test(tag[0]))
          deprecated.push({ file, line, match: 'size="narrow"' });
      }
    }
  };
  walk(root);
  return { findings, deprecated };
}

// ---- composition: DS parts used as designed --------------------------------------------------
// Four lexical checks over the project's own JSX. No parser: each file is read twice over the same
// offsets — a STRUCTURE copy with comments and every string's content blanked (quotes kept), where
// tags, attributes and braces are found, and the source itself, where values are read. Blanking the
// strings is what keeps a `"</SheetContent>"` or a `'<header>'` in a string from opening or closing
// anything, and an apostrophe in JSX text ("Don't") from swallowing the rest of a tag.
// They report as WARNINGS by default and as failures under `--strict`, so a consumer can adopt a
// new release, fix what it reports, and then turn the gate on.
//
// Known limits, all toward silence: a part re-exported through the project's own module is not a
// ui import; a `<header>` counts only when it sits inside the overlay content in the SAME file (a
// child component's header is not seen); a JSX attribute string ending in a backslash
// (`title="C:\"`) or spanning lines can desynchronise that tag's scan; route-map rows count only as
// string literals; and an `AppShellPage` outside an App Router page or layout file, or with a
// `size={…}` expression, is counted rather than compared.

/** Popover and menu popups whose width the part owns: `PopoverContent size`, or the longest item. */
export const WIDTH_OWNING_CONTENT = [
  "PopoverContent",
  "DropdownMenuContent",
  "ContextMenuContent",
  "MenubarContent",
  "SelectContent",
  "ComboboxContent",
  "HoverCardContent",
];

/** Overlay panels whose header the part owns, with the part that renders it. */
export const OVERLAY_HEADERS = {
  SheetContent: "SheetHeader",
  DrawerContent: "DrawerHeader",
  DialogContent: "DialogHeader",
  AlertDialogContent: "AlertDialogHeader",
};

/** From a `{` at `j` in the structure copy, the index just past its matching `}`. */
function skipBraces(scan, j) {
  let depth = 0;
  for (let k = j; k < scan.length; k += 1) {
    const c = scan[k];
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return k + 1;
    }
  }
  return scan.length;
}

/** From a `<` at `j` (TSX type arguments: `<DataGrid<Row> …>`), the index just past its `>`. */
function skipTypeArguments(scan, j) {
  let depth = 0;
  let braces = 0; // an object type: `<DataGrid<{ id: string; name: string }>`
  const limit = Math.min(scan.length, j + 2000);
  for (let k = j; k < limit; k += 1) {
    const c = scan[k];
    if (c === "{") braces += 1;
    else if (c === "}") {
      if ((braces -= 1) < 0) return -1;
    } else if (braces > 0) continue;
    else if (c === "<") depth += 1;
    else if (c === ">" && scan[k - 1] !== "=") {
      depth -= 1;
      if (depth === 0) return k + 1;
    } else if (c === ";") return -1;
  }
  return -1;
}

/** The `>` closing an opening tag whose attributes start at `j`, or -1 when it is not a tag. */
function tagEnd(scan, j) {
  const limit = Math.min(scan.length, j + 20000);
  let k = j;
  while (k < limit) {
    const c = scan[k];
    if (c === '"' || c === "'") {
      const close = scan.indexOf(c, k + 1);
      if (close === -1) return -1;
      k = close + 1;
      continue;
    }
    if (c === "{") {
      k = skipBraces(scan, k);
      continue;
    }
    if (c === ">") return k;
    if (c === "<" || c === ";" || c === "}" || c === ")") return -1;
    k += 1;
  }
  return -1;
}

const OPEN_TAG = /<([A-Za-z][\w.]*)(?=[\s/><])/y;
const CLOSE_TAG = /<\/\s*([A-Za-z][\w.]*)?\s*>/y;

/** Every JSX opening and closing tag in a structure copy, in source order. */
export function jsxTags(scan) {
  const tags = [];
  for (let i = scan.indexOf("<"); i !== -1; i = scan.indexOf("<", i + 1)) {
    CLOSE_TAG.lastIndex = i;
    const close = CLOSE_TAG.exec(scan);
    if (close) {
      tags.push({ kind: "close", name: close[1] ?? "", index: i });
      continue;
    }
    OPEN_TAG.lastIndex = i;
    const open = OPEN_TAG.exec(scan);
    if (!open) continue;
    let start = i + open[0].length;
    if (scan[start] === "<") {
      start = skipTypeArguments(scan, start);
      if (start === -1) continue;
    }
    const end = tagEnd(scan, start);
    if (end === -1) continue;
    tags.push({
      kind: "open",
      name: open[1],
      attrsAt: start,
      attrsEnd: end,
      selfClosing: scan[end - 1] === "/",
      index: i,
    });
  }
  return tags;
}

/**
 * An opening tag's own attributes — never one on a JSX element nested in an attribute's value
 * (`render={<div className="…" />}`): `name → { from, to, kind }`, `kind` "string" or "expr".
 */
export function tagAttributes(tag, scan) {
  const out = new Map();
  const NAME = /[^\s=/>{"']+/y;
  let k = tag.attrsAt;
  while (k < tag.attrsEnd) {
    const c = scan[k];
    if (c === "{") {
      k = skipBraces(scan, k); // a spread
      continue;
    }
    NAME.lastIndex = k;
    const name = NAME.exec(scan);
    if (!name) {
      k += 1;
      continue;
    }
    let v = k + name[0].length;
    while (v < tag.attrsEnd && /\s/.test(scan[v])) v += 1;
    if (scan[v] !== "=") {
      out.set(name[0], { kind: "flag" });
      k = v;
      continue;
    }
    v += 1;
    while (v < tag.attrsEnd && /\s/.test(scan[v])) v += 1;
    const q = scan[v];
    if (q === '"' || q === "'") {
      const close = scan.indexOf(q, v + 1);
      out.set(name[0], { kind: "string", from: v + 1, to: close });
      k = close + 1;
    } else if (q === "{") {
      const close = skipBraces(scan, v);
      out.set(name[0], { kind: "expr", from: v + 1, to: close - 1 });
      k = close;
    } else k = v + 1;
  }
  return out;
}

/** An attribute's string value when it is a literal (`size="full"`, `size={"full"}`), else null. */
function literalValue(attr, scan, read) {
  if (!attr || attr.kind === "flag") return null;
  if (attr.kind === "string")
    return { text: read.slice(attr.from, attr.to), at: attr.from };
  const m = /^(\s*)(["'`])([^"'`]*)\2\s*$/.exec(scan.slice(attr.from, attr.to));
  if (!m) return null;
  const at = attr.from + m[1].length + 1;
  const text = read.slice(at, at + m[3].length);
  return m[2] === "`" && text.includes("${") ? null : { text, at };
}

/**
 * The literal text a template spells out: its static parts, and inside each `${…}` every string
 * literal and (recursively) every nested template — the classes a conditional interpolation adds.
 */
function templateFragments(text, at) {
  const out = [];
  let start = 0;
  let k = 0;
  while (k < text.length) {
    if (text[k] === "\\") {
      k += 2;
      continue;
    }
    if (text[k] === "$" && text[k + 1] === "{") {
      out.push({ text: text.slice(start, k), at: at + start });
      let depth = 0;
      let e = k + 1;
      for (; e < text.length; e += 1) {
        const c = text[e];
        if (c === '"' || c === "'" || c === "`") {
          const close = Math.min(stringEnd(text, e), text.length);
          const inner = text.slice(e + 1, close);
          if (c === "`") out.push(...templateFragments(inner, at + e + 1));
          else out.push({ text: inner, at: at + e + 1 });
          e = close;
        } else if (c === "{") depth += 1;
        else if (c === "}" && (depth -= 1) === 0) break;
      }
      k = e + 1;
      start = k;
      continue;
    }
    k += 1;
  }
  out.push({ text: text.slice(start), at: at + start });
  return out;
}

/** The class tokens a `className` value spells out in string literals, each with its offset. */
function classTokens(attr, scan, read) {
  const spans = [];
  if (attr.kind === "string")
    spans.push({ text: read.slice(attr.from, attr.to), at: attr.from });
  else if (attr.kind === "expr")
    for (let k = attr.from; k < attr.to; k += 1) {
      const q = scan[k];
      if (q !== '"' && q !== "'" && q !== "`") continue;
      const close = scan.indexOf(q, k + 1);
      if (close === -1 || close > attr.to) break;
      const text = read.slice(k + 1, close);
      if (q === "`") spans.push(...templateFragments(text, k + 1));
      else spans.push({ text, at: k + 1 });
      k = close;
    }
  const tokens = [];
  for (const span of spans)
    for (const t of span.text.matchAll(/\S+/g))
      tokens.push({ token: t[0], at: span.at + t.index });
  return tokens;
}

/** The utility a class token applies, with its variants (`md:`, `data-[x]:`) removed. */
function utilityOf(token) {
  let depth = 0;
  let last = 0;
  for (let k = 0; k < token.length; k += 1) {
    const c = token[k];
    if (c === "[" || c === "(") depth += 1;
    else if (c === "]" || c === ")") depth -= 1;
    else if (c === ":" && depth === 0) last = k + 1;
  }
  return token.slice(last);
}

const isImportant = (utility) =>
  utility.length > 1 &&
  /^!?-?[a-z[(@*]/.test(utility) &&
  (utility.startsWith("!") || utility.endsWith("!"));
const isWidthClass = (utility) =>
  /^-?(?:w|min-w|max-w)-\S/.test(utility.replace(/^!|!$/g, ""));

/**
 * The project's names for parts imported from the ui alias directory: `local → part`, with a
 * namespace import (`import * as Ui from "@/components/ui/popover"`) recorded as `Ui → "*"`.
 */
export function uiImports(src, file, { uiAliases, uiDirs }) {
  const intoUi = (spec) => {
    if (uiAliases.some((a) => spec === a || spec.startsWith(`${a}/`)))
      return true;
    if (!/^\.\.?(?:\/|$)/.test(spec)) return false;
    const target = resolve(dirname(file), spec);
    return uiDirs.some((d) => target === d || target.startsWith(d + sep));
  };
  const names = new Map();
  for (const m of src.matchAll(
    /\bimport\s+(?:type\s+)?([\w$*{}\s,]+?)\s*from\s*["']([^"']+)["']/g,
  )) {
    if (!intoUi(m[2])) continue;
    const clause = m[1];
    const ns = /\*\s*as\s+([\w$]+)/.exec(clause);
    if (ns) names.set(ns[1], "*");
    const named = /\{([^}]*)\}/.exec(clause);
    for (const part of named ? named[1].split(",") : []) {
      const p = /^\s*(?:type\s+)?([\w$]+)(?:\s+as\s+([\w$]+))?\s*$/.exec(part);
      if (p) names.set(p[2] ?? p[1], p[1]);
    }
    const def = /^\s*([\w$]+)\s*(?:,|$)/.exec(clause);
    if (def && def[1] !== "type") names.set(def[1], def[1]);
  }
  return names;
}

/** The ui part a tag renders, or null when the tag is not one. */
function partOf(name, imports) {
  const dot = name.indexOf(".");
  if (dot !== -1)
    return imports.get(name.slice(0, dot)) === "*" ? name.slice(dot + 1) : null;
  const part = imports.get(name);
  return part && part !== "*" ? part : null;
}

// ---- the page-width route map ----------------------------------------------------------------
// Copied from the `page-layout` registry lib (packages/ui/registry/lib/page-layout.ts) — the
// doctor runs before anything is installed and cannot import TypeScript. Keep them in step.

const ROUTE_RANK = {
  static: 0,
  dynamic: 1,
  "catch-all": 2,
  "optional-catch-all": 3,
};

export function routeSegments(path) {
  return path
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter((s) => s !== "" && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
}

function parseRoute(route) {
  return routeSegments(route).map((s) => {
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(s)) return { kind: "optional-catch-all" };
    if (/^\[\.\.\.[^\]]+\]$/.test(s)) return { kind: "catch-all" };
    if (/^\[[^\]]+\]$/.test(s)) return { kind: "dynamic" };
    return { kind: "static", value: s };
  });
}

export function matchRoute(route, pathname) {
  const pattern = parseRoute(route);
  const path = routeSegments(pathname);
  for (let i = 0; i < pattern.length; i += 1) {
    const seg = pattern[i];
    if (seg.kind === "optional-catch-all") return true;
    if (seg.kind === "catch-all") return path.length > i;
    if (i >= path.length) return false;
    if (seg.kind === "static" && seg.value !== path[i]) return false;
  }
  return path.length === pattern.length;
}

function bySpecificity(a, b) {
  const [ra, rb] = [parseRoute(a), parseRoute(b)];
  for (let i = 0; i < Math.min(ra.length, rb.length); i += 1) {
    const d = ROUTE_RANK[ra[i].kind] - ROUTE_RANK[rb[i].kind];
    if (d !== 0) return d;
  }
  return rb.length - ra.length;
}

/** A value no static row names: what a page's `[id]` stands for when it is matched as a path. */
const ANY_SEGMENT = "\u0000";

/**
 * The widths the route map gives the paths a page's route pattern serves: its own row; else —
 * matching concrete paths, with `[id]` as one value no static row names, `[...rest]` as one to three
 * of them and `[[...rest]]` as zero to three — the most specific row serving each, exactly as
 * `widthOfPath` picks, or `default` where none does. One width when every sample agrees.
 */
export function widthsForRoute(map, route) {
  const key = `/${routeSegments(route).join("/")}`;
  if (map.has(key)) return [{ width: map.get(key).width, row: key }];
  let paths = [[]];
  for (const seg of parseRoute(key)) {
    const counts =
      seg.kind === "catch-all"
        ? [1, 2, 3]
        : seg.kind === "optional-catch-all"
          ? [0, 1, 2, 3]
          : [1];
    paths = paths.flatMap((p) =>
      counts.map((n) =>
        seg.kind === "static"
          ? [...p, seg.value]
          : [...p, ...Array(n).fill(ANY_SEGMENT)],
      ),
    );
  }
  const patterns = [...map.keys()].sort(bySpecificity);
  const seen = new Map();
  for (const path of paths) {
    const row = patterns.find((p) => matchRoute(p, `/${path.join("/")}`));
    const width = row ? map.get(row).width : "default";
    if (!seen.has(`${width} ${row}`))
      seen.set(`${width} ${row}`, { width, row: row ?? null });
  }
  return [...seen.values()];
}

const ROUTE_ROW = /(["'])(\/[^"'\s]*)\1\s*:\s*(["'])(prose|default|full)\3/g;

/**
 * Route-map rows a source declares: the `"/route": "prose" | "default" | "full"` rows of the
 * object literal passed to `definePageWidths(…)`, and of every `widths: { … }` object literal (a
 * module registry that contributes its own routes to the map).
 */
export function routeMapRows(src, scan = src) {
  // Calls and object bounds come from the structure copy, so a `"}"` or a quoted example call
  // neither ends a map early nor starts one; the rows are read from the source.
  const spans = [];
  for (const m of scan.matchAll(
    /\bdefinePageWidths\s*(?:<[^>()]*>)?\s*\(\s*\{|\bwidths\s*:\s*\{/g,
  )) {
    const open = m.index + m[0].length - 1;
    spans.push([open, skipBraces(scan, open)]);
  }
  const rows = [];
  for (const [from, to] of spans)
    for (const m of src.slice(from, to).matchAll(ROUTE_ROW))
      rows.push({ route: m[2], width: m[4], index: from + m.index });
  return rows;
}

/**
 * A Next.js App Router page or layout's route: `src/app/(app)/tasks/[id]/page.tsx` → `/tasks/[id]`.
 * Route groups and `@slot`s are not segments; an intercepting segment (`(.)x`, `(..)x`,
 * `(..)(..)x`, `(...)x`) renders the route it intercepts — the same level, one or two levels up,
 * or the root.
 */
export function appRouteOf(relPath) {
  const parts = relPath.split("/");
  const file = parts.pop();
  if (!/^(?:page|layout)\.[jt]sx?$/.test(file)) return null;
  const app = parts.indexOf("app");
  if (app === -1) return null;
  const route = [];
  for (const part of parts.slice(app + 1)) {
    const intercept = /^((?:\(\.{1,3}\))+)(.+)$/.exec(part);
    if (intercept) {
      for (const marker of intercept[1].match(/\(\.{1,3}\)/g)) {
        if (marker === "(...)") route.length = 0;
        else if (marker === "(..)") route.pop();
      }
      route.push(...routeSegments(intercept[2]));
    } else route.push(...routeSegments(part));
  }
  return `/${route.join("/")}`;
}

const COMPOSITION_EXTENSIONS = /\.[cm]?[jt]sx?$/;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\.[cm]?[jt]sx?$/;

/** 1-based line of an offset, by binary search over the newline offsets. */
function lineIndex(text) {
  const breaks = [];
  for (let k = text.indexOf("\n"); k !== -1; k = text.indexOf("\n", k + 1))
    breaks.push(k);
  return (index) => {
    let lo = 0;
    let hi = breaks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (breaks[mid] < index) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
}

/**
 * The four composition rules over the project's own source (the ui alias dirs, node_modules and
 * build output skipped): `!` on a DS part, a width class on a popover or menu popup, a hand-written
 * `<header>` inside an overlay panel, and an `AppShellPage size` that disagrees with the route map.
 */
export function scanComposition(root, { skipDirs = [], uiAlias = null } = {}) {
  const skip = new Set(skipDirs.map((d) => resolve(d)));
  const uiDirs = [...skip];
  const uiAliases = [
    ...new Set(
      [uiAlias, "@/components/ui"]
        .filter((a) => typeof a === "string" && a.length > 0)
        .map((a) => a.replace(/\/+$/, "")),
    ),
  ];
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
      } else if (e.isFile() && COMPOSITION_EXTENSIONS.test(e.name)) {
        files.push(full);
        if (files.length >= SCAN_MAX_FILES) return;
      }
    }
  };
  walk(root);
  files.sort();

  const important = [];
  const widths = [];
  const headers = [];
  const pages = [];
  const map = new Map();
  const conflicts = [];
  for (const full of files) {
    try {
      if (statSync(full).size > SCAN_MAX_BYTES) continue;
    } catch {
      continue;
    }
    const raw = readIfExists(full);
    if (raw == null) continue;
    const file = relative(root, full).split(sep).join("/");
    const read = raw.replace(/\r/g, "");
    // Comments (and prose strings) blanked: a commented-out row or an example in a doc block is
    // not part of the map, and an import in a comment imports nothing.
    const src = maskNonUsage(read, { script: true });
    const scan = maskNonUsage(read, { script: true, blankStrings: true });
    const lineAt = lineIndex(read);
    if (!TEST_FILE.test(file))
      for (const row of routeMapRows(src, scan)) {
        const at = { width: row.width, file, line: lineAt(row.index) };
        const known = map.get(row.route);
        if (!known) map.set(row.route, at);
        else if (known.width !== row.width)
          conflicts.push({
            file,
            line: at.line,
            match: `route-map row "${row.route}": "${row.width}"`,
            hint: `${known.file}:${known.line} already says "${known.width}"`,
          });
      }
    if (!/\.[jt]sx$/.test(full) || !read.includes("<")) continue;

    const imports = uiImports(src, full, { uiAliases, uiDirs });
    const overlays = [];
    const route = appRouteOf(file);
    for (const tag of jsxTags(scan)) {
      const part = partOf(tag.name, imports);
      if (tag.kind === "close") {
        if (part && part in OVERLAY_HEADERS) {
          const at = overlays.lastIndexOf(part);
          if (at !== -1) overlays.splice(at, 1);
        }
        continue;
      }
      if (tag.name === "header" && overlays.length > 0) {
        const inside = overlays[overlays.length - 1];
        headers.push({
          file,
          line: lineAt(tag.index),
          match: `<header> in ${inside}`,
          hint: OVERLAY_HEADERS[inside],
        });
      }
      const isPage = part === "AppShellPage" || tag.name === "AppShellPage";
      if (!part && !isPage) continue;
      const attrs = tagAttributes(tag, scan);
      if (isPage) {
        const size = attrs.get("size");
        pages.push({
          file,
          line: lineAt(tag.index),
          route,
          size:
            size == null
              ? "default"
              : (literalValue(size, scan, read)?.text ?? null),
        });
      }
      if (!part) continue;
      if (part in OVERLAY_HEADERS && !tag.selfClosing) overlays.push(part);
      const cls = attrs.get("className");
      if (!cls || cls.kind === "flag") continue;
      for (const { token, at } of classTokens(cls, scan, read)) {
        const utility = utilityOf(token);
        if (isImportant(utility))
          important.push({ file, line: lineAt(at), match: `${part} ${token}` });
        if (WIDTH_OWNING_CONTENT.includes(part) && isWidthClass(utility))
          widths.push({ file, line: lineAt(at), match: `${part} ${token}` });
      }
    }
  }

  // AppShellPage size vs the route map: route files only, literal (or absent) sizes only.
  const mismatches = [...conflicts];
  let compared = 0;
  let dynamic = 0;
  let outside = 0;
  for (const page of pages) {
    if (page.route == null) {
      outside += 1;
      continue;
    }
    if (page.size == null) {
      dynamic += 1;
      continue;
    }
    if (map.size === 0) continue;
    compared += 1;
    const size = page.size === "narrow" ? "prose" : page.size;
    const answers = widthsForRoute(map, page.route);
    if (answers.some((a) => a.width !== size))
      mismatches.push({
        file: page.file,
        line: page.line,
        match: `size="${page.size}" on ${page.route}`,
        hint: answers
          .map(({ width, row }) =>
            row
              ? `the map says "${width}" (${row}, ${map.get(row).file}:${map.get(row).line})`
              : `the map has no row for it, so it is "default"`,
          )
          .join("; and for other paths it serves, "),
      });
  }

  const byPlace = (a, b) =>
    a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line;
  return {
    files: files.length,
    important: important.sort(byPlace),
    widths: widths.sort(byPlace),
    headers: headers.sort(byPlace),
    routeMap: {
      rows: map.size,
      files: [...new Set([...map.values()].map((r) => r.file))].sort(),
      compared,
      dynamic,
      outside,
      mismatches: mismatches.sort(byPlace),
    },
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
  const strict = argv.includes("--strict");

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

  // ---- 8. every page takes its width from AppShellPage's size ------------------------------
  const layout = scanPageLayout(root, { skipDirs });
  if (layout.findings.length > 0) {
    results.push({
      level: "fail",
      name: "page layout",
      detail: `${layout.findings.length} class(es) on AppShellPage set the page's own width or gutter`,
      fix: "delete them — pick the width with size (prose · default · full) from the route map; the gutter is --page-gutter (https://design.vegastack.com/docs/foundations/page-layout)",
      findings: layout.findings.map((f) => `${f.file}:${f.line}  ${f.match}`),
    });
  } else {
    ok("page layout", "no AppShellPage sets its own width or gutter");
  }
  if (layout.deprecated.length > 0) {
    results.push({
      level: "warn",
      name: "page width names",
      detail: `${layout.deprecated.length} AppShellPage(s) still say size="narrow"`,
      fix: 'rename to size="prose" — narrow is removed in the next minor',
      findings: layout.deprecated.map((f) => `${f.file}:${f.line}  ${f.match}`),
    });
  }

  // ---- 9–12. DS parts used as designed ------------------------------------------------------
  // Warnings unless --strict: a consumer adopts the release, fixes what these report, then gates.
  const composition = scanComposition(root, {
    skipDirs,
    uiAlias: componentsJson?.aliases?.ui ?? null,
  });
  const level = strict ? "fail" : "warn";
  const compositionCheck = (name, findings, detail, fix, okDetail) => {
    if (findings.length === 0) return ok(name, okDetail);
    results.push({
      level,
      name,
      detail: `${findings.length} ${detail}`,
      fix,
      findings: findings.map(
        (f) =>
          `${f.file}:${f.line}  ${f.match}${f.hint ? `  →  ${f.hint}` : ""}`,
      ),
    });
  };
  compositionCheck(
    "important on DS parts",
    composition.important,
    "Tailwind `!` modifier(s) forcing a ui part's own classes",
    "use the part's variant or prop for it (ask for one in the design system if none fits) — `!` beats the part's own classes on every state and breaks on the next pull",
    "no ui part is forced with `!`",
  );
  compositionCheck(
    "popup width",
    composition.widths,
    "width class(es) on a popover, menu or select popup",
    "delete them — PopoverContent takes size (default · md · lg · fit); menus, selects and comboboxes size to their longest item",
    "no popover or menu popup sets its own width",
  );
  compositionCheck(
    "overlay header",
    composition.headers,
    "hand-written <header>(s) inside Sheet, Drawer or Dialog content",
    "use the overlay's own header part (SheetHeader · DrawerHeader · DialogHeader · AlertDialogHeader), or RecordPeek for a record panel",
    "no overlay content hand-writes a <header> (same-file nesting only)",
  );
  const rm = composition.routeMap;
  const coverage = `${rm.compared} App Router page/layout size(s) compared${
    rm.dynamic ? `, ${rm.dynamic} dynamic size={…} skipped` : ""
  }${
    rm.outside
      ? `, ${rm.outside} AppShellPage(s) outside page/layout files not checked (this rule reads route files only)`
      : ""
  }`;
  if (rm.rows === 0) {
    results.push({
      level: "skip",
      name: "page width vs route map",
      detail:
        'skipped (no route map) — no definePageWidths( call or widths: { "/route": … } rows found',
    });
  } else {
    compositionCheck(
      "page width vs route map",
      rm.mismatches,
      `AppShellPage size(s) disagree with the route map (${rm.rows} row(s) in ${rm.files.join(", ")}; ${coverage})`,
      "set size to the map's width, or change the map's row — a page and its skeleton read the same map (https://design.vegastack.com/docs/foundations/page-layout)",
      `${rm.rows} route-map row(s) in ${rm.files.join(", ")}; ${coverage}`,
    );
  }

  // ---- report -------------------------------------------------------------------------------
  const glyph = { ok: "✓", warn: "!", fail: "✗", skip: "–" };
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
