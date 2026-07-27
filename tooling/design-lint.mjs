#!/usr/bin/env node
// Design-lint: enforce the VegaStack token-only component styling rules on packages/ui source.
//   - no hex colors / no raw Tailwind palette utilities (bg-neutral-900, text-red-500, …)
//   - no !important
//   - sanctioned icon sources only (G18): lucide-react / lucide-animated / @vegastack/design/icons /
//     thesvg via Icon/BrandIcon — no other icon library, no inline <svg> used as an icon
//   - §7.6 render-contract: single-Base-UI-root wrappers must not Omit<…,'render'>
//
// EXPLICIT, COMPLETE exception set (everything else is a violation — Codex R6 MED). The token-only
// contract is strict: NO hardcoded visual literal anywhere. The only allowed non-literal forms are:
//   • Arbitrary values `*-[…]` ONLY when: (1) `var(--token)` / a CSS custom property (semantic tokens
//     + Base UI runtime positioner vars like --available-height/--anchor-width/--transform-origin), or
//     (2) `calc()` containing a var() or a viewport/relative unit (dvh/vw/%…), or (3) a layout
//     primitive (fr/%/auto/min-content/max-content/0), or (4) a CSS-wide keyword. A hardcoded
//     `h-[13px]` / `bg-[#fff]` / `calc(100px-2rem)` fails. (Motion durations use the `duration-fast`
//     /`-base`/`-slow` token utilities — see @theme inline bridge — never `duration-[var(--…)]`.)
//   • Inline `style={…}` ONLY when EITHER (a) it assigns ONLY CSS custom properties — every key is a
//     `--*` variable (dynamic layout/sizing routes through a var that an arbitrary-value class
//     consumes: --swatch-cols, --te-min-h/--te-max-h, --cell-w, --sidebar-width), OR (b) it is the
//     ONE documented swatch-fill exception: a dynamic `backgroundColor`/`background` on the
//     color-picker swatch (no Tailwind utility exists for a runtime user-supplied color). ANY other
//     `style={…}` carrying a DIRECT visual property (gridTemplateColumns, width, height, minHeight,
//     maxHeight, padding, …) — dynamic OR literal — FAILS. A hardcoded hex/px/rem literal in any
//     style object also fails. Formalized in requirements §7.1 (semantic-tokens-only contract).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// `--docs-shell` injects fixed repo-relative roots, but the docs package invokes this script with
// cwd=apps/docs. Anchor those roots to the repo root (this file lives in <repo>/tooling/) so the
// flag lints the same 85 files regardless of the caller's cwd.
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Roots passed with the `--token-css` flag are EXPORTED token CSS (e.g. `packages/design-tokens/src`).
// These ship to consumers as `@vegastack/design-tokens/base.css` and so must honor the same no-`!important`
// design-audit contract — but they are PLAIN CSS, not Tailwind component source, so the
// Tailwind-utility rules (hex / raw-palette / arbitrary-value / icon-source / render / inline-style)
// do NOT apply (they would false-positive on legitimate oklch token declarations / CSS custom
// properties). For token CSS we run ONLY the scoped `!important` check below (Codex R14 MED).
const rawArgs = process.argv.slice(2);
const tokenCssRoots = [];
const ROOTS = [];
let docsShellMode = false;
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--token-css") {
    const next = rawArgs[++i];
    if (next) tokenCssRoots.push(next);
  } else if (rawArgs[i] === "--docs-shell") {
    docsShellMode = true;
  } else {
    ROOTS.push(rawArgs[i]);
  }
}
if (docsShellMode && ROOTS.length === 0) {
  ROOTS.push(
    resolve(REPO_ROOT, "apps/docs/app"),
    resolve(REPO_ROOT, "apps/docs/lib"),
    resolve(REPO_ROOT, "apps/docs/components"),
  );
}
if (ROOTS.length === 0 && tokenCssRoots.length === 0)
  ROOTS.push("packages/ui/src");
const PALETTES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PROPS =
  "bg|text|border|ring|fill|stroke|decoration|divide|from|via|to|caret|accent|shadow|outline";
const LEN_PROPS =
  "h|w|size|min-w|max-w|min-h|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|top|bottom|left|right|inset|rounded|leading|text|basis|grid-cols|grid-rows|translate-x|translate-y|scale|scale-x|scale-y|aspect|origin";

const RULES = [
  {
    id: "hex-color",
    re: /#[0-9a-fA-F]{3,8}\b/g,
    msg: "hex color literal (use a semantic token)",
  },
  {
    id: "raw-palette",
    re: new RegExp(`\\b(?:${COLOR_PROPS})-(?:${PALETTES})-\\d{2,3}\\b`, "g"),
    msg: "raw Tailwind palette utility (use a semantic token, e.g. bg-primary)",
  },
  { id: "important", re: /!important/g, msg: "!important is not allowed" },
  // G18 — sanctioned icon SOURCES only. Importing any other icon library into component source is
  // banned (it bypasses the locked lucide/thesvg + Icon/BrandIcon contract). Denylist of the common
  // ones so there are no false positives on legitimate packages.
  {
    id: "icon-source",
    re: /from\s+['"](?:@heroicons\/|@tabler\/icons|react-icons|phosphor-react|@phosphor-icons\/|feather-icons|react-feather|@radix-ui\/react-icons|@fortawesome\/|ionicons|@ant-design\/icons|@mui\/icons-material|boxicons|@iconify\/)/g,
    msg: "non-sanctioned icon library (use lucide-react / lucide-animated / @vegastack/design/icons / thesvg via Icon/BrandIcon)",
  },
  // T5 — the 5th radius step is removed: containers cap at rounded-lg; the marketing sharp
  // gesture is rounded-(--radius-sharp). Without this ban `rounded-xl` silently falls back to
  // Tailwind's default theme value (the exact trap radius-xs used to be — register P1-09/10).
  {
    id: "removed-radius-xl",
    re: /\brounded-xl\b/g,
    msg: "radius-xl was removed from the scale (containers cap at rounded-lg; marketing sharp = rounded-(--radius-sharp))",
  },
  // T5 — the 28/32/40 control scale is tokenized: no raw h-7/h-8/h-10 (or size-/min-w- mirrors).
  // 24px (h-6/size-6) is deliberately NOT banned: it is shared by non-control scales (badge,
  // switch track, select scroll strips) — the xs control tier uses h-(--size-xs) by convention.
  {
    id: "raw-control-size",
    re: /\b(?:h|size|min-w)-(?:7|8|10)\b/g,
    msg: "control-scale literal (use h-(--size-sm|md|lg) / size-(--size-*) — the 28/32/40 scale is tokenized)",
  },
  // T5 — icon sizes route through the icon tokens inside svg selectors (fractions like size-1/2
  // and the 4px dot glyph size-1 are geometry, not icon-scale, and stay).
  {
    id: "raw-icon-size",
    re: /svg[^\]]*\]:size-(?:3(?:\.5)?|4|5|6)\b(?!\/)/g,
    msg: "raw icon size in an svg selector (use ]:size-(--icon-compact|inline|default|action|feature))",
  },
  {
    id: "transition-all",
    re: /\btransition-all\b/g,
    msg: "transition-all is banned; enumerate only the causal opacity/transform/geometry properties",
  },
  {
    id: "color-transition",
    re: /\btransition-colors\b|\btransition-\[(?:[^\],]+,)*(?:color|background-color|border-color|fill|stroke)(?:,[^\]]+)*\]/g,
    msg: "interaction color changes are immediate; reserve motion for opacity, transform, indicators, disclosure, overlays, progress, and causal feedback",
  },
  // (T4's transition-pairing rule is string-literal-scoped — see checkTransitionPairing below.)
  // T3 — z-index is two token bands (`z-(--z-raised)` local raises, `z-(--z-overlay)` portaled
  // surfaces; DOM order resolves nesting within the band). Raw `z-N` literals are banned.
  {
    id: "raw-z-index",
    re: /\bz-\d+\b/g,
    msg: "raw z-index literal (use z-(--z-raised) or z-(--z-overlay) — see foundations/elevation §Stacking)",
  },
  // T2 — zero hardcoded opacity: color-alpha modifiers must route through an `--alpha-*` token
  // (`bg-destructive/(--alpha-surface-faint)`), never a raw `/NN` step.
  {
    id: "raw-alpha",
    re: /\b(?:bg|text|border|ring|outline|fill|stroke|divide|from|via|to|accent|caret|decoration|shadow)-[a-z][a-z0-9-]*\/\d+(?:\.\d+)?\b/g,
    msg: "raw color-alpha modifier (use an --alpha-* role token, e.g. bg-destructive/(--alpha-surface-faint))",
  },
  // T2 — element opacity must route through an `--opacity-*` token. `opacity-0`/`opacity-100`
  // are exempt structural endpoints (fully hidden/shown in transitions), not design values.
  {
    id: "raw-opacity",
    re: /\bopacity-(?!0\b|100\b)\d+\b/g,
    msg: "raw opacity step (use an --opacity-* role token, e.g. opacity-(--opacity-dim); 0/100 are exempt)",
  },
  {
    id: "alpha-opacity-role",
    re: /\b(?:bg|text|border|ring|outline|fill|stroke|divide|from|via|to|accent|caret|decoration|shadow)-[^\s"'`]+\/\(--opacity-[^)]+\)/g,
    msg: "color compositing must use an --alpha-* role, never an element --opacity-* role",
  },
  {
    id: "opacity-alpha-role",
    re: /\bopacity-\(--alpha-[^)]+\)/g,
    msg: "element opacity must use an --opacity-* role, never a color --alpha-* role",
  },
  {
    id: "raw-tracking",
    re: /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/g,
    msg: "letter spacing is owned by named typography roles; raw tracking utilities are banned",
  },
  {
    id: "raw-heavy-weight",
    re: /\bfont-(?:bold|semibold)\b/g,
    msg: "bold/semibold utilities are banned; use the 400/500 ladder or an approved named role",
  },
  {
    id: "raw-effect",
    re: /\b(?:backdrop-)?blur-\[[^\]]+\]|\b(?:drop-shadow|shadow)-\[[^\]]+\]|\b(?:backdrop-)?blur-(?!glass\b|\(--)[a-z0-9-]+\b|\b(?:drop-shadow|shadow)-(?:xs|sm|md|lg|xl|2xl|inner)\b/g,
    msg: "raw blur/shadow effect (use a named semantic effect or elevation role)",
  },
  // T1 — the type scale is xs…3xl (token-driven, base = 14px) plus the role utilities
  // (text-h1…h4, text-label*, text-code*) and the display tier (text-display-sm/md/lg/xl).
  // Anything past 3xl is off-scale; arbitrary `text-[…]` sizes are caught by the ARB rule.
  {
    id: "off-scale-text",
    re: /\btext-(?:4xl|5xl|6xl|7xl|8xl|9xl)\b/g,
    msg: "off-scale font size (scale ends at text-3xl = 24px; use text-display-sm/md/lg/xl for display sizes)",
  },
];

// Inline <svg> used as an icon is banned in component source — use a sanctioned lucide icon or the
// `Icon`/`BrandIcon` wrapper. Allowlist files that legitimately draw a NON-icon graphic primitive
// with SVG geometry (e.g. a determinate progress ring) — those aren't icons.
// `progress-indicator` draws a non-icon graphic primitive; canonical and generated `icons/**` are the mirrored
// lucide-animated icons (Motion <svg> components) — their inline <svg> IS the sanctioned icon source,
// regenerated by tooling/mirror-animated-icons.mjs (the mirror asserts no hex/raw-palette itself).
const SVG_GRAPHIC_ALLOWLIST =
  /(?:^|\/)(?:empty|progress-indicator)\.tsx$|(?:registry\/ui|components\/ui)\/icons\//;

// `muted-foreground-faint` is intentionally sub-AA and therefore limited to placeholder/disabled
// copy. These two files use it on aria-hidden decorative glyphs, never meaningful text.
const FAINT_DECORATIVE_ALLOWLIST =
  /(?:^|\/)(?:breadcrumb|comparison-matrix)\.tsx$/;

// Native controls are allowed only where the component owns a semantic adapter/integration that a
// higher-level VegaStack control cannot replace. Exact per-tag counts fail closed in BOTH directions:
// adding a control and removing the last reviewed control require re-auditing this rationale list.
const RAW_INTERACTIVE_EXEMPTIONS = new Map([
  [
    "/alert.tsx",
    { counts: { button: 1 }, rationale: "alert-local dismiss control" },
  ],
  [
    "/announcement-banner.tsx",
    { counts: { button: 1 }, rationale: "banner-local dismiss control" },
  ],
  [
    "/attachment.tsx",
    { counts: { button: 1 }, rationale: "useRender native-button fallback" },
  ],
  [
    "/dropzone.tsx",
    {
      counts: { input: 1 },
      rationale:
        "the display:none form/picker bridge behind the role=button drop surface — react-dropzone's prop-getter must attach to a native <input type=file>; no VegaStack control substitutes for it",
    },
  ],
  [
    "/data-grid.tsx",
    {
      counts: { button: 2 },
      rationale:
        "table sort-header and group-toggle controls preserve table semantics (same class as data-list's exemption)",
    },
  ],
  [
    "/data-list.tsx",
    {
      counts: { button: 2 },
      rationale: "table sort and row action controls preserve table semantics",
    },
  ],
  [
    "/date-picker.tsx",
    {
      counts: { button: 1 },
      rationale: "react-day-picker day-cell integration",
    },
  ],
  [
    "/markdown-view.tsx",
    {
      counts: { input: 1 },
      rationale: "react-markdown non-checkbox input passthrough",
    },
  ],
  [
    "/onboarding-checklist.tsx",
    { counts: { button: 3 }, rationale: "compound collapse and step controls" },
  ],
  [
    "/pagination.tsx",
    { counts: { button: 2 }, rationale: "headless pager boundary controls" },
  ],
  [
    "/password-input.tsx",
    { counts: { button: 1 }, rationale: "field-integrated visibility toggle" },
  ],
  [
    "/sidebar.tsx",
    {
      counts: { button: 3 },
      rationale: "useRender fallbacks and resize rail control",
    },
  ],
  [
    "/tag-group.tsx",
    {
      counts: { button: 2 },
      rationale: "tag removal and overflow disclosure controls",
    },
  ],
  [
    "/textarea.tsx",
    {
      counts: { textarea: 1 },
      rationale: "Textarea is the tokenized native textarea adapter",
    },
  ],
]);

const RAW_INTERACTIVE_TAGS = new Set(["button", "input", "select", "textarea"]);

// §7.6 Base UI render contract — a wrapper over a SINGLE Base UI root MUST keep Base UI's
// polymorphic `render` prop in its public API.
// `Omit<..., 'render'>` (or `'value' | 'render'`, etc.) silently removes it, regressing the
// contract. Flag any `Omit<...>` that strips `'render'` in registry component source — EXCEPT the
// documented exemptions: multi-element composites that own no single polymorphic root (compose
// them via their slots/children instead; see docs/ledger/component-matrix.md §7.6 note).
const RENDER_OMIT_EXEMPT = /(?:^|\/)(?:split-button)\.tsx$/;

function sourceFileFor(file, src) {
  return ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

// Parse actual string/template literal nodes instead of pairing quote characters with a regex.
// Comments and apostrophes outside literals are therefore structurally incapable of disabling the
// transition/truncation/motion/uppercase rules for the rest of a source line.
function staticStringLiterals(file, src) {
  if (!/\.tsx?$/.test(file)) return [];
  const sourceFile = sourceFileFor(file, src);
  const literals = [];
  const push = (node, text) => {
    const line =
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1;
    literals.push({ text, line });
  };
  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) {
      push(node, node.text);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      push(
        node,
        [
          node.head.text,
          ...node.templateSpans.map((span) => span.literal.text),
        ].join(" "),
      );
      for (const span of node.templateSpans) visit(span.expression);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return literals;
}

function renderOmitLines(file, src) {
  if (!/\.tsx?$/.test(file)) return [];
  const sourceFile = sourceFileFor(file, src);
  const lines = [];
  const visit = (node) => {
    if (
      ts.isTypeReferenceNode(node) &&
      node.typeName.getText(sourceFile) === "Omit" &&
      node.typeArguments
        ?.slice(1)
        .some((argument) => /['"]render['"]/.test(argument.getText(sourceFile)))
    ) {
      lines.push(
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return lines;
}

// §7.1 inline-style contract — `style={…}` may ONLY (a) assign CSS custom properties (every key is a
// `--*` variable; runtime layout/sizing routes through a var consumed by an arbitrary-value class),
// or (b) be the documented swatch-fill exception: a dynamic `backgroundColor`/`background` on the
// color-picker swatch. ANY direct visual property (gridTemplateColumns, width, height, minHeight,
// padding, …) — dynamic OR literal — fails, plus any hex/px/rem literal in the style expression.
const STYLE_FILL_EXCEPTION_FILE = /(?:^|\/)color-picker\.tsx$/;
// Satori requires serializable inline style objects and cannot consume the app's Tailwind runtime.
const INLINE_STYLE_FILE_ALLOWLIST =
  /apps\/docs\/(?:lib\/og\.tsx|components\/foundations\.tsx)$/;
// This one docs-only specimen displays the exact authored easing strings and token-driven inline
// animation recipes. It is a visualizer, not shipped component motion.
const RAW_MOTION_FILE_ALLOWLIST = /apps\/docs\/components\/foundations\.tsx$/;
// Browser/PWA metadata intentionally uses the broadly supported hex serialization of generated
// semantic theme colors; Satori likewise needs concrete paint values at image-render time.
const HEX_COLOR_FILE_ALLOWLIST =
  /apps\/docs\/(?:lib\/og\.tsx|app\/(?:layout\.tsx|manifest\.ts))$/;
const STYLE_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem)\b/;
// Extract the balanced `{…}` expression of a `style={…}` attribute starting at the `{` after `=`.
function readBalancedBraces(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { expr: src.slice(openIdx, i + 1), end: i };
    }
  }
  return null;
}
// Collect the property KEYS declared in an object literal inside a style expression. Recognizes bare
// identifier keys (`backgroundColor:`), quoted/computed keys (`'--x':`, `["--x"]:`), and reports
// spreads separately. Returns null when the expression has NO object literal (a bare variable
// reference like `style={contentStyle}` — its keys are validated at the construction site).
function styleObjectKeys(expr) {
  if (!/\{/.test(expr)) return null; // no object literal — e.g. style={someVar}
  const keys = [];
  let hasSpread = false;
  // bare-identifier keys:  foo:  (not `::`, not after a `.`); guard against pseudo matches via word boundary
  for (const m of expr.matchAll(/(?:^|[{,(\s])([A-Za-z_$][\w$]*)\s*:/g))
    keys.push(m[1]);
  // quoted keys: '--x':  "--x":
  for (const m of expr.matchAll(/['"]([^'"]+)['"]\s*:/g)) keys.push(m[1]);
  // computed keys: ['--x']:  ["--x"]:
  for (const m of expr.matchAll(/\[\s*['"]([^'"]+)['"]\s*\]\s*:/g))
    keys.push(m[1]);
  if (/\.\.\./.test(expr)) hasSpread = true;
  return { keys, hasSpread };
}

// arbitrary value with a hard color/length — but allow var(--token), CSS custom props, calc, and %.
const ARB = new RegExp(
  `\\b(?:${COLOR_PROPS}|${LEN_PROPS})-\\[([^\\]]+)\\]`,
  "g",
);
const LAYOUT_ATOM =
  "(?:\\d+(?:\\.\\d+)?(?:fr|%)|min-content|max-content|auto|0)";
const LAYOUT_TRACK = `(?:${LAYOUT_ATOM}|minmax\\(${LAYOUT_ATOM},${LAYOUT_ATOM}\\))`;
const LAYOUT_COMPOSITE = new RegExp(
  `^(?:${LAYOUT_TRACK}|repeat\\([1-9]\\d*,${LAYOUT_TRACK}\\))(?:_(?:${LAYOUT_TRACK}|repeat\\([1-9]\\d*,${LAYOUT_TRACK}\\)))*$`,
);

// Sanctioned focus affordances that legitimately replace the native outline (see the outline-none
// file rule below): a focus-visible/focus-within ring, Base UI roving-tabindex state styling, or
// the text-entry border-tint pattern (`focus:border-…` — design.md §Components: Input/Textarea/OTP
// use the darkened `ring/70` border as their sole focus cue, deliberately on `focus` not
// `focus-visible` so click and Tab read identically in a text field).
const FOCUS_AFFORDANCE =
  /focus-visible:|focus-within:|focus:border-|data-\[highlighted\]|data-\[selected\]|data-\[focused\]/;
// Files exempt from the outline-none focus contract. As of the P0-02 fix, overlay POPUP surfaces
// no longer carry `outline-none` (the centralized base.css `:focus-visible` outline is their
// keyboard-focus indicator); the remaining `outline-none` in these files sits on the non-focusable
// fixed VIEWPORT containers only (never keyboard-reachable — a dialog always contains tabbable
// controls, so browsers never promote the scroll container into the tab order). Add a filename
// suffix here WITH a one-line rationale only for this non-focusable-container pattern.
const OUTLINE_NONE_EXEMPT = [
  "/alert-dialog.tsx", // viewport container only
  "/dialog.tsx", // viewport container only
  "/sheet.tsx", // viewport container only
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (
      s.isDirectory() &&
      !(
        docsShellMode &&
        /apps\/docs\/components\/(?:preview|stories|ui)$/.test(
          p.replaceAll("\\", "/"),
        )
      )
    ) {
      walk(p, out);
    }
    // Lint shipped component source only — skip test files (test scaffolding may use inline sizing).
    else if (
      /\.(tsx?|css)$/.test(name) &&
      !/\.test\.(tsx?)$/.test(name) &&
      !(docsShellMode && name.endsWith(".css"))
    ) {
      out.push(p);
    }
  }
  return out;
}

let violations = 0;
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch (err) {
    // Fail loudly: an unreadable/nonexistent root silently reported '✓ clean' and made the
    // whole gate a no-op (--docs-shell shipped that way). Never swallow.
    console.error(`design-lint: cannot read root '${root}': ${err.message}`);
    process.exit(2);
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    const literals = staticStringLiterals(file, src);

    // T4 transition-pairing contract: any string literal that declares a `transition*` utility
    // MUST pair it with a `duration-*` AND an `ease-*` token in the SAME literal (otherwise the
    // element silently inherits Tailwind's untokenized default curve — audit 09 §b1). The unit is
    // the string literal because the fix pattern co-locates the trio; `transition-none` /
    // `transition-discrete` are structural, not animated, and are exempt.
    for (const { text: lit, line } of literals) {
      const tokens = [
        ...lit.matchAll(
          /(?:^|[\s:\]])((?:transition)(?:-\w+|-\[[^\]]+\])?)(?=\s|$)/g,
        ),
      ]
        .map((t) => t[1])
        .filter((t) => t !== "transition-none" && t !== "transition-discrete");
      if (tokens.length === 0) continue;
      if (!/\bduration-/.test(lit) || !/\bease-/.test(lit)) {
        console.log(
          `${file}:${line} [transition-pairing] "${tokens[0]}" without a duration-*/ease-* token pair in the same class string`,
        );
        violations++;
      }
    }

    // R flex+truncate co-location ban (audit 12 §b2): `truncate`/`line-clamp-*` on the same
    // element as `flex`/`inline-flex` is a display conflict — line-clamp needs -webkit-box and
    // truncate's ellipsis never renders for flex CHILDREN; whichever display wins, the intent
    // loses (verified in the compiled cascade: .flex wins, leaving clip-no-ellipsis). Correct
    // pattern: `flex min-w-0` on the container, `truncate` on the inner text span.
    for (const { text: lit, line } of literals) {
      if (
        /(?:^|\s)(?:inline-)?flex(?:\s|$)/.test(lit) &&
        /(?:^|\s)(?:truncate|line-clamp-\d+)(?:\s|$)/.test(lit)
      ) {
        console.log(
          `${file}:${line} [flex-truncate-conflict] flex + truncate/line-clamp on one element — put truncate on an inner span (container gets min-w-0)`,
        );
        violations++;
      }
    }

    // M motion-lint: raw motion values are banned in class strings — animations route through the
    // motion tokens (duration-fast/base/slow · ease-standard/emphasized/exit/spring) or the
    // sanctioned motion-* utilities (motion-pop-in/enter-up/shake, utilities.css) — or, for
    // stroke-draw/complex icon motion, the lucide-animated mirrors in registry/ui/icons/.
    // `animate-spin`/`animate-pulse` stay allowed (documented platform-default loader exception,
    // audit 09 §f); arbitrary animate-[…], raw curves, and arbitrary duration-[…]/ease-[…] do not.
    for (const { text: lit, line } of literals) {
      const raw = lit.match(
        /(animate-\[[^\]]*\]|cubic-bezier\([^)]*\)|(?<![-\w])linear\([^)]*\)|duration-\[[^\]]*\]|ease-\[[^\]]*\])/,
      );
      if (raw && !RAW_MOTION_FILE_ALLOWLIST.test(file)) {
        console.log(
          `${file}:${line} [raw-motion] "${raw[1]}" — use the motion tokens or a sanctioned motion-* utility`,
        );
        violations++;
      }
    }

    if (!RENDER_OMIT_EXEMPT.test(file)) {
      for (const line of renderOmitLines(file, src)) {
        console.log(
          `${file}:${line} [render-contract] Omit<…, 'render'> removes Base UI's polymorphic render prop (§7.6). Expose render on single-root wrappers; only multi-element composites (split-button) are exempt — see docs/ledger/component-matrix.md.`,
        );
        violations++;
      }
    }

    // outline-none focus contract (Codex R8): a file that strips the native focus outline MUST
    // provide an alternative focus affordance — a `focus-visible:` / `focus-within:` ring on the
    // control, or Base UI's `data-[highlighted]` / `[selected]` / `[focused]` state styling on
    // roving-tabindex items. Enforced FILE-scoped (not per-element) on purpose: Base UI's
    // focus-within wrapper pattern (inner input `outline-none`, wrapper `focus-within:ring`),
    // non-focusable positioner/panel containers, and split CVA strings make a naive same-element
    // regex throw false positives — per-element focus is asserted at runtime by the axe browser
    // tests. A file that kills outlines with ZERO focus affordance anywhere is the genuine a11y
    // regression this rule catches. Extend OUTLINE_NONE_EXEMPT (with rationale) for any genuinely
    // non-interactive file that legitimately needs `outline-none` and no focus affordance.
    if (
      /\boutline-none\b/.test(src) &&
      !FOCUS_AFFORDANCE.test(src) &&
      !OUTLINE_NONE_EXEMPT.some((suffix) => file.endsWith(suffix))
    ) {
      console.log(
        `${file} [outline-none] strips the focus outline but provides no focus affordance ` +
          `(focus-visible:/focus-within: ring or data-[highlighted]/[selected]/[focused]) anywhere in the file`,
      );
      violations++;
    }

    // §7.1 inline-style contract — source-level (multi-line-aware) so `style={ … }` objects that
    // span lines are validated as a whole. For each `style=` attribute we read the balanced `{…}`
    // expression and require it to EITHER set only CSS custom properties (`--*` keys), OR be the
    // file-scoped color-picker swatch-fill exception (a dynamic backgroundColor/background). A direct
    // visual property key (width, gridTemplateColumns, minHeight, …) — dynamic or literal — fails, as
    // does any hex/px/rem literal inside the style expression.
    // Mirrored lucide-animated icons (registry/ui/icons/**) are vendored Motion components — their
    // inline `style={{ transformOrigin, transformBox }}` is legitimate animation transform setup, not a
    // design-token violation (the mirror asserts no hex/raw-palette). Exempt them from the inline-style
    // rule, same as the inline-<svg> allowlist above.
    if (
      !/(?:registry\/ui|components\/ui)\/icons\//.test(file) &&
      !INLINE_STYLE_FILE_ALLOWLIST.test(file)
    ) {
      const styleAttr = /\bstyle=\{/g;
      let sm;
      while ((sm = styleAttr.exec(src))) {
        const openIdx = sm.index + sm[0].length - 1; // index of the `{` after `style=`
        const lineNo = src.slice(0, sm.index).split("\n").length;
        const lineText = lines[lineNo - 1] ?? "";
        const trimmedLine = lineText.trim();
        // Skip prose/JSDoc mentions of `style={…}` (comment lines).
        if (
          trimmedLine.startsWith("//") ||
          trimmedLine.startsWith("*") ||
          trimmedLine.startsWith("/*")
        )
          continue;
        const bal = readBalancedBraces(src, openIdx);
        if (!bal) continue;
        const expr = bal.expr;
        // A hardcoded hex/px/rem literal in any style expression is always a violation.
        if (STYLE_LITERAL.test(expr)) {
          console.log(
            `${file}:${lineNo} [inline-style] inline style with a hardcoded value (route layout/sizing through a CSS var consumed by an arbitrary-value class)\n    ${trimmedLine}`,
          );
          violations++;
          continue;
        }
        const parsed = styleObjectKeys(expr);
        // No object literal (bare variable reference like `style={contentStyle}`): keys are validated
        // at the construction site, which is itself linted — allow here.
        if (parsed === null) continue;
        for (const key of parsed.keys) {
          if (key.startsWith("--")) continue; // CSS custom property — the sanctioned var-only form
          // The ONE direct-visual-property exception: the color-picker swatch fill.
          if (
            (key === "backgroundColor" || key === "background") &&
            STYLE_FILL_EXCEPTION_FILE.test(file)
          ) {
            continue;
          }
          console.log(
            `${file}:${lineNo} [inline-style] direct visual property '${key}' in inline style (allowed only: CSS custom properties, or the color-picker swatch-fill color). Route layout/sizing through a '--*' var + an arbitrary-value class (§7.1).\n    ${trimmedLine}`,
          );
          violations++;
        }
      }
    }

    lines.forEach((line, i) => {
      // skip comment-only lines
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*")
      )
        return;
      for (const { id, re, msg } of RULES) {
        if (id === "hex-color" && HEX_COLOR_FILE_ALLOWLIST.test(file)) continue;
        re.lastIndex = 0;
        if (re.test(line)) {
          console.log(`${file}:${i + 1} [${id}] ${msg}\n    ${trimmed}`);
          violations++;
        }
      }
      if (
        /\btext-muted-foreground-faint\b/.test(line) &&
        !/placeholder:text-muted-foreground-faint\b/.test(line) &&
        !FAINT_DECORATIVE_ALLOWLIST.test(file)
      ) {
        console.log(
          `${file}:${i + 1} [faint-text-role] muted-foreground-faint is sub-AA and restricted to placeholder/disabled copy; use a contrast-safe semantic text role`,
        );
        violations++;
      }
      let m;
      ARB.lastIndex = 0;
      while ((m = ARB.exec(line))) {
        const inner = m[1];
        // EXPLICIT sanctioned-exception set for arbitrary values (everything else fails — Codex R6):
        //  (1) token / runtime CSS-variable values: `*-[var(--token)]` — semantic tokens AND Base UI's
        //      runtime positioner vars (--available-height, --anchor-width, --transform-origin, panel
        //      heights). The value IS a token/runtime var, never a hardcoded literal.
        if (/var\(--|^--/.test(inner)) continue;
        //  (2) calc() ONLY when it references a design-token `var(--…)`. A viewport unit alone is
        //      NOT enough: any fixed offset must itself be a token, e.g. `calc(100dvh-var(--spacing)*8)`
        //      — never a literal like `calc(100dvh-2rem)` / `calc(100px-2rem)` (Codex R8 MED tightened
        //      this; the previous viewport-unit allowance let `2rem` insets slip through).
        if (/calc\(/.test(inner) && /var\(--/.test(inner)) continue;
        //  (3) structural grid/layout primitives, including underscore-separated template tracks
        //      and minmax()/finite repeat() compositions made exclusively from
        //      fr/%/auto/content/0 atoms. Fixed lengths inside a layout template (7rem, 320px, …)
        //      are still design literals.
        if (LAYOUT_COMPOSITE.test(inner)) continue;
        //  (4) CSS-wide keywords.
        if (/^(inherit|initial|unset|revert|revert-layer)$/.test(inner))
          continue;
        console.log(
          `${file}:${i + 1} [arbitrary-value] hardcoded arbitrary "${m[0]}" (use a token utility, a var(--token), or a token/viewport calc — not a hardcoded literal)\n    ${trimmed}`,
        );
        violations++;
      }
    });
  }
}

// ── Raw-CSS `!important` scan (Codex R14 MED; extended R16 MED) ───────────────────────────────────
// Exported token CSS (`--token-css packages/design-tokens/src`) AND the docs app's shipped CSS
// (`--token-css apps/docs/app`) ship under the SAME no-`!important` design-audit contract as component
// source, but they are plain CSS, so we apply ONLY the `!important` rule here (the Tailwind-utility
// rules would false-positive on legitimate oklch token declarations / CSS custom properties / @source
// directives). `!important` is permitted via exactly TWO scoped, documented exceptions, nothing else:
//   (A) Inside a `@media (prefers-reduced-motion: reduce)` block — the WCAG reduced-motion
//       accessibility reset (the canonical sanctioned `!important`; packages/design-tokens/src/base.css +
//       requirements §7.5). Any `!important` OUTSIDE such a block fails unless (B) applies.
//   (B) Codex R16 MED — the scroll-lock scrollbar-compensation zero-out: under the documented
//       `html > body[data-scroll-locked]` selector, `react-remove-scroll-bar` injects a runtime
//       `<style>` with `margin-right: <gap>px !important`, which a plain declaration can NEVER beat,
//       so the override that zeroes it (and the `--removed-body-scroll-bar-size` size var) MUST use
//       `!important`. Allowed ONLY for those two declarations, ONLY zeroed (`0`/`0px`), ONLY inside
//       that exact selector block — see apps/docs/app/global.css + requirements §7.5.
// The two `SCROLL_LOCK_*` matchers below scope (B) tightly; anything broader still fails.
const SCROLL_LOCK_SELECTOR = /html\s*>\s*body\[\s*data-scroll-locked\s*\]/;
const SCROLL_LOCK_DECL =
  /^\s*(?:margin-right|--removed-body-scroll-bar-size)\s*:\s*0(?:px)?\s*!important\s*;?\s*$/;
function walkCss(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walkCss(p, out);
    else if (/\.css$/.test(name)) out.push(p);
  }
  return out;
}

for (const root of tokenCssRoots) {
  let files;
  try {
    files = walkCss(root);
  } catch (err) {
    // Fail loudly: an unreadable/nonexistent root silently reported '✓ clean' and made the
    // whole gate a no-op (--docs-shell shipped that way). Never swallow.
    console.error(`design-lint: cannot read root '${root}': ${err.message}`);
    process.exit(2);
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    // Track whether the current line sits inside a `@media (prefers-reduced-motion: reduce)` block, or
    // inside the documented `html > body[data-scroll-locked]` scroll-lock block, by counting brace
    // depth from each opener to its matching close. `!important` is exempt ONLY when (A) inside a
    // reduced-motion block, or (B) it is one of the two zeroed scroll-lock decls inside the scroll-lock
    // block; everything else is a violation.
    let reducedMotionDepth = -1; // -1 = not in a reduced-motion block
    let scrollLockDepth = -1; // -1 = not in the scroll-lock override block
    let depth = 0;
    // Strip CSS comments (`/* … */`, including multi-line) so prose that mentions `!important` in a
    // comment is never flagged — only real declarations count.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = codeOnly[i] ?? "";
      const opensReducedMotion =
        /@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(line);
      if (opensReducedMotion && reducedMotionDepth === -1)
        reducedMotionDepth = depth;
      // Detect the scroll-lock selector on a line that also opens its block (`… { … }` on the rule's
      // opening line). The exempt window is the brace depth INSIDE the block (depth + 1).
      const opensScrollLock =
        SCROLL_LOCK_SELECTOR.test(line) && /\{/.test(line);
      if (opensScrollLock && scrollLockDepth === -1)
        scrollLockDepth = depth + 1;
      const inReducedMotion = reducedMotionDepth !== -1;
      const inScrollLock = scrollLockDepth !== -1;
      if (/!important/.test(line) && !inReducedMotion) {
        // (B) the narrow scroll-lock zero-out exception: only the two sanctioned decls, only inside the
        // documented `html > body[data-scroll-locked]` block.
        const isScrollLockExempt =
          inScrollLock && SCROLL_LOCK_DECL.test(lines[i] ?? "");
        if (!isScrollLockExempt) {
          console.log(
            `${file}:${i + 1} [important] !important is not allowed in raw CSS ` +
              `(sanctioned ONLY in a @media (prefers-reduced-motion: reduce) reset, or the documented ` +
              `scroll-lock margin/size zero-out under html > body[data-scroll-locked] — requirements §7.5)` +
              `\n    ${(lines[i] ?? "").trim()}`,
          );
          violations++;
        }
      }
      // Update brace depth AFTER classifying this line; when we exit back to the depth at which a
      // tracked block opened, we've left it.
      for (const ch of line) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (inReducedMotion && depth === reducedMotionDepth)
            reducedMotionDepth = -1;
          if (inScrollLock && depth < scrollLockDepth) scrollLockDepth = -1;
        }
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────
 * A — AST structural rules. Regex cannot reliably see multiline JSX or import provenance, so one
 * TypeScript pass enforces accessible icon controls, direct lucide sizing, inline SVG review,
 * React 19 ref-as-prop, reviewed native-control exceptions, native cursor discipline, and
 * lowest-possible client boundaries.
 * ─────────────────────────────────────────────────────────────────────────────────────────── */
{
  const ts = (await import("typescript")).default;
  for (const root of ROOTS) {
    let files;
    try {
      files = walk(root);
    } catch (err) {
      console.error(`design-lint: cannot read root '${root}': ${err.message}`);
      process.exit(2);
    }
    for (const file of files.filter((f) => f.endsWith(".tsx"))) {
      const src = readFileSync(file, "utf8");
      const canonicalRegistryFile =
        /(?:^|\/)(?:packages\/ui\/)?registry\/(?:ui|blocks)\//.test(file) &&
        !/(?:^|\/)registry\/ui\/icons\//.test(file);
      if (
        canonicalRegistryFile &&
        /(?:^|\n)['"]use client['"];/.test(src) &&
        !/@base-ui|motion(?:\/react)?|sonner|react-day-picker|tiptap|recharts|react-resizable-panels|@shadcn\/react|React\.(?:use[A-Z]|createContext)|\buse[A-Z]\w*\s*\(|\bon[A-Z]\w*\s*=|\b(?:window|document|IntersectionObserver|ResizeObserver|MutationObserver|requestAnimationFrame)\b/.test(
          src,
        )
      ) {
        console.log(
          `${file}:1 [presentational-client-boundary] presentational component has no browser/hook/engine requirement; remove the client boundary`,
        );
        violations++;
      }

      const sf = ts.createSourceFile(
        file,
        src,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const lucideNames = new Set();
      const forwardRefNames = new Set();
      const reactNamespaceNames = new Set();
      for (const statement of sf.statements) {
        if (!ts.isImportDeclaration(statement)) continue;
        const bindings = statement.importClause?.namedBindings;
        if (statement.moduleSpecifier.text === "react") {
          if (statement.importClause?.name)
            reactNamespaceNames.add(statement.importClause.name.text);
          if (bindings && ts.isNamespaceImport(bindings))
            reactNamespaceNames.add(bindings.name.text);
        }
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        if (statement.moduleSpecifier.text === "lucide-react") {
          for (const element of bindings.elements)
            lucideNames.add(element.name.text);
        }
        if (statement.moduleSpecifier.text === "react") {
          for (const element of bindings.elements) {
            if (
              (element.propertyName?.text ?? element.name.text) === "forwardRef"
            ) {
              forwardRefNames.add(element.name.text);
            }
          }
        }
      }
      const rawInteractiveCounts = {
        button: 0,
        input: 0,
        select: 0,
        textarea: 0,
      };
      const visit = (node) => {
        if (ts.isCallExpression(node)) {
          const callee = node.expression;
          const directForwardRef =
            ts.isIdentifier(callee) && forwardRefNames.has(callee.text);
          const namespaceForwardRef =
            ts.isPropertyAccessExpression(callee) &&
            ts.isIdentifier(callee.expression) &&
            reactNamespaceNames.has(callee.expression.text) &&
            callee.name.text === "forwardRef";
          if (directForwardRef || namespaceForwardRef) {
            const { line } = sf.getLineAndCharacterOfPosition(
              node.getStart(sf),
            );
            console.log(
              `${file}:${line + 1} [forward-ref] React.forwardRef is banned in React 19 components; accept ref as a normal prop`,
            );
            violations++;
          }
        }

        if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
          const tag = node.tagName.getText(sf);
          if (tag === "Button") {
            const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
            const get = (n) => attrs.find((a) => a.name.getText(sf) === n);
            const size = get("size");
            const sizeText = size?.initializer?.getText(sf) ?? "";
            if (/^["'{]?\s*["']icon/.test(sizeText)) {
              const named = get("aria-label") || get("aria-labelledby");
              // A spread (e.g. {...props} on a wrapper's internal Button) may carry the name —
              // only flag when there is NO spread that could provide it.
              const hasSpread = node.attributes.properties.some(
                ts.isJsxSpreadAttribute,
              );
              if (!named && !hasSpread) {
                const { line } = sf.getLineAndCharacterOfPosition(
                  node.getStart(sf),
                );
                console.log(
                  `${file}:${line + 1} [icon-button-name] <Button size=${sizeText}> without aria-label/aria-labelledby — icon-only controls need an accessible name (or use IconButton, which requires one at the type level)`,
                );
                violations++;
              }
            }
          }

          if (tag === "svg" && !SVG_GRAPHIC_ALLOWLIST.test(file)) {
            const { line } = sf.getLineAndCharacterOfPosition(
              node.getStart(sf),
            );
            console.log(
              `${file}:${line + 1} [inline-svg-icon] inline <svg> in component source (use a sanctioned lucide icon / Icon wrapper; allowlist only genuine graphic primitives)`,
            );
            violations++;
          }

          if (lucideNames.has(tag)) {
            const className = node.attributes.properties
              .filter(ts.isJsxAttribute)
              .find((attribute) => attribute.name.getText(sf) === "className");
            const classText = className?.initializer?.getText(sf) ?? "";
            const sizeProp = node.attributes.properties
              .filter(ts.isJsxAttribute)
              .find((attribute) => attribute.name.getText(sf) === "size");
            if (/\bsize-(?:3(?:\.5)?|4|5|6)\b/.test(classText) || sizeProp) {
              const { line } = sf.getLineAndCharacterOfPosition(
                node.getStart(sf),
              );
              console.log(
                `${file}:${line + 1} [direct-lucide-size] direct lucide size bypasses --icon-* roles`,
              );
              violations++;
            }
          }

          if (canonicalRegistryFile && RAW_INTERACTIVE_TAGS.has(tag)) {
            rawInteractiveCounts[tag]++;
          }

          // Do not override a standard control with the cursor it already receives from the user
          // agent, and do not restate the native pointer cursor on navigation links. Beyond being
          // redundant, `cursor-default` on text-entry controls actively destroys their I-beam cue.
          if (RAW_INTERACTIVE_TAGS.has(tag) || tag === "a") {
            const className = node.attributes.properties
              .filter(ts.isJsxAttribute)
              .find((attribute) => attribute.name.getText(sf) === "className");
            const classText = className?.initializer?.getText(sf) ?? "";
            const redundant =
              (RAW_INTERACTIVE_TAGS.has(tag) &&
                /\bcursor-default\b/.test(classText)) ||
              (tag === "a" && /\bcursor-pointer\b/.test(classText));
            if (redundant) {
              const { line } = sf.getLineAndCharacterOfPosition(
                node.getStart(sf),
              );
              console.log(
                `${file}:${line + 1} [standard-control-cursor] redundant/conflicting explicit cursor on native <${tag}>; preserve the platform cursor`,
              );
              violations++;
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);

      if (canonicalRegistryFile) {
        const exemption = [...RAW_INTERACTIVE_EXEMPTIONS].find(([suffix]) =>
          file.endsWith(suffix),
        );
        const total = Object.values(rawInteractiveCounts).reduce(
          (sum, count) => sum + count,
          0,
        );
        if (!exemption && total > 0) {
          const detail = Object.entries(rawInteractiveCounts)
            .filter(([, count]) => count > 0)
            .map(([tag, count]) => `${tag}=${count}`)
            .join(", ");
          console.log(
            `${file} [raw-interactive-html] raw native control(s) (${detail}) require VegaStack composition or a rationale-counted exemption`,
          );
          violations++;
        } else if (exemption) {
          const expected = exemption[1].counts;
          const mismatch = Object.keys(rawInteractiveCounts).some(
            (tag) => rawInteractiveCounts[tag] !== (expected[tag] ?? 0),
          );
          if (mismatch) {
            const format = (counts) =>
              Object.entries(counts)
                .filter(([, count]) => count > 0)
                .map(([tag, count]) => `${tag}=${count}`)
                .join(", ") || "none";
            console.log(
              `${file} [raw-interactive-html] reviewed native-control count changed from ${format(expected)} to ${format(rawInteractiveCounts)} (${exemption[1].rationale}); re-audit the interaction model`,
            );
            violations++;
          }
        }
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────
 * B (D20) — uppercase is MONO-EXCLUSIVE, and the mono voice caps at 14px. Fires only when the
 * literal styles TYPE (contains a text-* utility): uppercase type must carry font-mono /
 * text-mono-label in the same literal, and must not pair with sizes past text-base (the voice
 * layer is 10–14px labels; big mono is reserved for DATA NUMERALS, which are never uppercase).
 * Content transforms without a type utility (e.g. avatar initials) are deliberately exempt —
 * that is casing user content, not setting brand voice.
 * ─────────────────────────────────────────────────────────────────────────────────────────── */
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch (err) {
    // Fail loudly: an unreadable/nonexistent root silently reported '✓ clean' and made the
    // whole gate a no-op (--docs-shell shipped that way). Never swallow.
    console.error(`design-lint: cannot read root '${root}': ${err.message}`);
    process.exit(2);
  }
  for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
    const src = readFileSync(file, "utf8");
    for (const { text: lit, line } of staticStringLiterals(file, src)) {
      if (!/(?:^|\s)uppercase(?:\s|$)/.test(lit)) continue;
      const stylesType =
        /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|h\d|label|label-sm|code|code-sm|display-\w+|mono-label)\b/.test(
          lit,
        );
      if (!stylesType) continue;
      const mono = /\bfont-mono\b|\btext-mono-label\b/.test(lit);
      const big = /\btext-(?:lg|xl|2xl|3xl|h[1-4]|display-\w+)\b/.test(lit);
      if (!mono || big) {
        console.log(
          `${file}:${line} [uppercase-mono] uppercase type must be the mono voice (font-mono/text-mono-label, ≤14px) — uppercase Geist Sans and big uppercase mono are banned (D20)`,
        );
        violations++;
      }
    }
  }
}

if (violations) {
  console.error(`\n✗ design-lint: ${violations} violation(s)`);
  process.exit(1);
}
console.log("✓ design-lint: clean");
