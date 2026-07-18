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
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Roots passed with the `--token-css` flag are EXPORTED token CSS (e.g. `packages/design-tokens/src`).
// These ship to consumers as `@vegastack/design-tokens/base.css` and so must honor the same no-`!important`
// design-audit contract — but they are PLAIN CSS, not Tailwind component source, so the
// Tailwind-utility rules (hex / raw-palette / arbitrary-value / icon-source / render / inline-style)
// do NOT apply (they would false-positive on legitimate oklch token declarations / CSS custom
// properties). For token CSS we run ONLY the scoped `!important` check below (Codex R14 MED).
const rawArgs = process.argv.slice(2);
const tokenCssRoots = [];
const ROOTS = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--token-css') {
    const next = rawArgs[++i];
    if (next) tokenCssRoots.push(next);
  } else {
    ROOTS.push(rawArgs[i]);
  }
}
if (ROOTS.length === 0 && tokenCssRoots.length === 0) ROOTS.push('packages/ui/src');
const PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_PROPS = 'bg|text|border|ring|fill|stroke|decoration|divide|from|via|to|caret|accent|shadow|outline';
const LEN_PROPS =
  'h|w|size|min-w|max-w|min-h|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|top|bottom|left|right|inset|rounded|leading|text|basis';

const RULES = [
  { id: 'hex-color', re: /#[0-9a-fA-F]{3,8}\b/g, msg: 'hex color literal (use a semantic token)' },
  {
    id: 'raw-palette',
    re: new RegExp(`\\b(?:${COLOR_PROPS})-(?:${PALETTES})-\\d{2,3}\\b`, 'g'),
    msg: 'raw Tailwind palette utility (use a semantic token, e.g. bg-primary)',
  },
  { id: 'important', re: /!important/g, msg: '!important is not allowed' },
  // G18 — sanctioned icon SOURCES only. Importing any other icon library into component source is
  // banned (it bypasses the locked lucide/thesvg + Icon/BrandIcon contract). Denylist of the common
  // ones so there are no false positives on legitimate packages.
  {
    id: 'icon-source',
    re: /from\s+['"](?:@heroicons\/|@tabler\/icons|react-icons|phosphor-react|@phosphor-icons\/|feather-icons|react-feather|@radix-ui\/react-icons|@fortawesome\/|ionicons|@ant-design\/icons|@mui\/icons-material|boxicons|@iconify\/)/g,
    msg: 'non-sanctioned icon library (use lucide-react / lucide-animated / @vegastack/design/icons / thesvg via Icon/BrandIcon)',
  },
  // T5 — the 5th radius step is removed: containers cap at rounded-lg; the marketing sharp
  // gesture is rounded-(--radius-sharp). Without this ban `rounded-xl` silently falls back to
  // Tailwind's default theme value (the exact trap radius-xs used to be — register P1-09/10).
  {
    id: 'removed-radius-xl',
    re: /\brounded-xl\b/g,
    msg: 'radius-xl was removed from the scale (containers cap at rounded-lg; marketing sharp = rounded-(--radius-sharp))',
  },
  // T5 — the 28/32/40 control scale is tokenized: no raw h-7/h-8/h-10 (or size-/min-w- mirrors).
  // 24px (h-6/size-6) is deliberately NOT banned: it is shared by non-control scales (badge,
  // switch track, select scroll strips) — the xs control tier uses h-(--size-xs) by convention.
  {
    id: 'raw-control-size',
    re: /\b(?:h|size|min-w)-(?:7|8|10)\b/g,
    msg: 'control-scale literal (use h-(--size-sm|md|lg) / size-(--size-*) — the 28/32/40 scale is tokenized)',
  },
  // T5 — icon sizes route through the icon tokens inside svg selectors (fractions like size-1/2
  // and the 4px dot glyph size-1 are geometry, not icon-scale, and stay).
  {
    id: 'raw-icon-size',
    re: /svg[^\]]*\]:size-(?:3(?:\.5)?|4|5|6)\b(?!\/)/g,
    msg: 'raw icon size in an svg selector (use ]:size-(--icon-compact|inline|default|action|feature))',
  },
  // (T4's transition-pairing rule is string-literal-scoped — see checkTransitionPairing below.)
  // T3 — z-index is two token bands (`z-(--z-raised)` local raises, `z-(--z-overlay)` portaled
  // surfaces; DOM order resolves nesting within the band). Raw `z-N` literals are banned.
  {
    id: 'raw-z-index',
    re: /\bz-\d+\b/g,
    msg: 'raw z-index literal (use z-(--z-raised) or z-(--z-overlay) — see foundations/elevation §Stacking)',
  },
  // T2 — zero hardcoded opacity: color-alpha modifiers must route through an `--alpha-*` token
  // (`bg-destructive/(--alpha-surface-faint)`), never a raw `/NN` step.
  {
    id: 'raw-alpha',
    re: /\b(?:bg|text|border|ring|outline|fill|stroke|divide|from|via|to|accent|caret|decoration|shadow)-[a-z][a-z0-9-]*\/\d+(?:\.\d+)?\b/g,
    msg: 'raw color-alpha modifier (use an --alpha-* role token, e.g. bg-destructive/(--alpha-surface-faint))',
  },
  // T2 — element opacity must route through an `--opacity-*` token. `opacity-0`/`opacity-100`
  // are exempt structural endpoints (fully hidden/shown in transitions), not design values.
  {
    id: 'raw-opacity',
    re: /\bopacity-(?!0\b|100\b)\d+\b/g,
    msg: 'raw opacity step (use an --opacity-* role token, e.g. opacity-(--opacity-dim); 0/100 are exempt)',
  },
  // T1 — the type scale is xs…3xl (token-driven, base = 14px) plus the role utilities
  // (text-h1…h4, text-label*, text-code*) and the display tier (text-display-sm/md/lg/xl).
  // Anything past 3xl is off-scale; arbitrary `text-[…]` sizes are caught by the ARB rule.
  {
    id: 'off-scale-text',
    re: /\btext-(?:4xl|5xl|6xl|7xl|8xl|9xl)\b/g,
    msg: 'off-scale font size (scale ends at text-3xl = 24px; use text-display-sm/md/lg/xl for display sizes)',
  },
];

// Inline <svg> used as an icon is banned in component source — use a sanctioned lucide icon or the
// `Icon`/`BrandIcon` wrapper. Allowlist files that legitimately draw a NON-icon graphic primitive
// with SVG geometry (e.g. a determinate progress ring) — those aren't icons.
// `progress-indicator` draws a non-icon graphic primitive; `registry/ui/icons/**` are the mirrored
// lucide-animated icons (Motion <svg> components) — their inline <svg> IS the sanctioned icon source,
// regenerated by tooling/mirror-animated-icons.mjs (the mirror asserts no hex/raw-palette itself).
const SVG_GRAPHIC_ALLOWLIST = /(?:^|\/)(?:progress-indicator)\.tsx$|registry\/ui\/icons\//;

// §7.6 Base UI render contract — a wrapper over a SINGLE Base UI root MUST keep Base UI's
// polymorphic `render` prop in its public API.
// `Omit<..., 'render'>` (or `'value' | 'render'`, etc.) silently removes it, regressing the
// contract. Flag any `Omit<...>` that strips `'render'` in registry component source — EXCEPT the
// documented exemptions: multi-element composites that own no single polymorphic root (compose
// them via their slots/children instead; see docs/ledger/component-matrix.md §7.6 note).
const RENDER_OMIT = /\bOmit<.*['"]render['"]/;
const RENDER_OMIT_EXEMPT = /(?:^|\/)(?:split-button)\.tsx$/;

// §7.1 inline-style contract — `style={…}` may ONLY (a) assign CSS custom properties (every key is a
// `--*` variable; runtime layout/sizing routes through a var consumed by an arbitrary-value class),
// or (b) be the documented swatch-fill exception: a dynamic `backgroundColor`/`background` on the
// color-picker swatch. ANY direct visual property (gridTemplateColumns, width, height, minHeight,
// padding, …) — dynamic OR literal — fails, plus any hex/px/rem literal in the style expression.
const STYLE_FILL_EXCEPTION_FILE = /(?:^|\/)color-picker\.tsx$/;
const STYLE_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem)\b/;
// Extract the balanced `{…}` expression of a `style={…}` attribute starting at the `{` after `=`.
function readBalancedBraces(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
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
  for (const m of expr.matchAll(/(?:^|[{,(\s])([A-Za-z_$][\w$]*)\s*:/g)) keys.push(m[1]);
  // quoted keys: '--x':  "--x":
  for (const m of expr.matchAll(/['"]([^'"]+)['"]\s*:/g)) keys.push(m[1]);
  // computed keys: ['--x']:  ["--x"]:
  for (const m of expr.matchAll(/\[\s*['"]([^'"]+)['"]\s*\]\s*:/g)) keys.push(m[1]);
  if (/\.\.\./.test(expr)) hasSpread = true;
  return { keys, hasSpread };
}

// arbitrary value with a hard color/length — but allow var(--token), CSS custom props, calc, and %.
const ARB = new RegExp(`\\b(?:${COLOR_PROPS}|${LEN_PROPS})-\\[([^\\]]+)\\]`, 'g');

// Sanctioned focus affordances that legitimately replace the native outline (see the outline-none
// file rule below): a focus-visible/focus-within ring, Base UI roving-tabindex state styling, or
// the text-entry border-tint pattern (`focus:border-…` — design.md §Components: Input/Textarea/OTP
// use the darkened `ring/70` border as their sole focus cue, deliberately on `focus` not
// `focus-visible` so click and Tab read identically in a text field).
const FOCUS_AFFORDANCE = /focus-visible:|focus-within:|focus:border-|data-\[highlighted\]|data-\[selected\]|data-\[focused\]/;
// Files exempt from the outline-none focus contract. As of the P0-02 fix, overlay POPUP surfaces
// no longer carry `outline-none` (the centralized base.css `:focus-visible` outline is their
// keyboard-focus indicator); the remaining `outline-none` in these files sits on the non-focusable
// fixed VIEWPORT containers only (never keyboard-reachable — a dialog always contains tabbable
// controls, so browsers never promote the scroll container into the tab order). Add a filename
// suffix here WITH a one-line rationale only for this non-focusable-container pattern.
const OUTLINE_NONE_EXEMPT = [
  '/alert-dialog.tsx', // viewport container only
  '/dialog.tsx', // viewport container only
  '/sheet.tsx', // viewport container only
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    // Lint shipped component source only — skip test files (test scaffolding may use inline sizing).
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.(tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

let violations = 0;
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue;
  }
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');

    // T4 transition-pairing contract: any string literal that declares a `transition*` utility
    // MUST pair it with a `duration-*` AND an `ease-*` token in the SAME literal (otherwise the
    // element silently inherits Tailwind's untokenized default curve — audit 09 §b1). The unit is
    // the string literal because the fix pattern co-locates the trio; `transition-none` /
    // `transition-discrete` are structural, not animated, and are exempt.
    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const m of lines[li].matchAll(/["'`]([^"'`]*)["'`]/g)) {
        const lit = m[1];
        const tokens = [...lit.matchAll(/(?:^|[\s:\]])((?:transition)(?:-\w+|-\[[^\]]+\])?)(?=\s|$)/g)]
          .map((t) => t[1])
          .filter((t) => t !== 'transition-none' && t !== 'transition-discrete');
        if (tokens.length === 0) continue;
        if (!/\bduration-/.test(lit) || !/\bease-/.test(lit)) {
          console.log(
            `${file}:${li + 1} [transition-pairing] "${tokens[0]}" without a duration-*/ease-* token pair in the same class string`,
          );
          violations++;
        }
      }
    }

    // R flex+truncate co-location ban (audit 12 §b2): `truncate`/`line-clamp-*` on the same
    // element as `flex`/`inline-flex` is a display conflict — line-clamp needs -webkit-box and
    // truncate's ellipsis never renders for flex CHILDREN; whichever display wins, the intent
    // loses (verified in the compiled cascade: .flex wins, leaving clip-no-ellipsis). Correct
    // pattern: `flex min-w-0` on the container, `truncate` on the inner text span.
    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const m of lines[li].matchAll(/["'`]([^"'`]*)["'`]/g)) {
        const lit = m[1];
        if (
          /(?:^|\s)(?:inline-)?flex(?:\s|$)/.test(lit) &&
          /(?:^|\s)(?:truncate|line-clamp-\d+)(?:\s|$)/.test(lit)
        ) {
          console.log(
            `${file}:${li + 1} [flex-truncate-conflict] flex + truncate/line-clamp on one element — put truncate on an inner span (container gets min-w-0)`,
          );
          violations++;
        }
      }
    }

    // M motion-lint: raw motion values are banned in class strings — animations route through the
    // motion tokens (duration-fast/base/slow · ease-standard/emphasized/exit/spring) or the
    // sanctioned motion-* utilities (motion-pop-in/enter-up/shake, utilities.css) — or, for
    // stroke-draw/complex icon motion, the lucide-animated mirrors in registry/ui/icons/.
    // `animate-spin`/`animate-pulse` stay allowed (documented platform-default loader exception,
    // audit 09 §f); arbitrary animate-[…], raw curves, and arbitrary duration-[…]/ease-[…] do not.
    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const m of lines[li].matchAll(/["'`]([^"'`]*)["'`]/g)) {
        const lit = m[1];
        const raw = lit.match(/(animate-\[[^\]]*\]|cubic-bezier\([^)]*\)|(?<![-\w])linear\([^)]*\)|duration-\[[^\]]*\]|ease-\[[^\]]*\])/);
        if (raw) {
          console.log(
            `${file}:${li + 1} [raw-motion] "${raw[1]}" — use the motion tokens or a sanctioned motion-* utility`,
          );
          violations++;
        }
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
    if (!/registry\/ui\/icons\//.test(file)) {
      const styleAttr = /\bstyle=\{/g;
      let sm;
      while ((sm = styleAttr.exec(src))) {
        const openIdx = sm.index + sm[0].length - 1; // index of the `{` after `style=`
        const lineNo = src.slice(0, sm.index).split('\n').length;
        const lineText = lines[lineNo - 1] ?? '';
        const trimmedLine = lineText.trim();
        // Skip prose/JSDoc mentions of `style={…}` (comment lines).
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) continue;
        const bal = readBalancedBraces(src, openIdx);
        if (!bal) continue;
        const expr = bal.expr;
        // A hardcoded hex/px/rem literal in any style expression is always a violation.
        if (STYLE_LITERAL.test(expr)) {
          console.log(`${file}:${lineNo} [inline-style] inline style with a hardcoded value (route layout/sizing through a CSS var consumed by an arbitrary-value class)\n    ${trimmedLine}`);
          violations++;
          continue;
        }
        const parsed = styleObjectKeys(expr);
        // No object literal (bare variable reference like `style={contentStyle}`): keys are validated
        // at the construction site, which is itself linted — allow here.
        if (parsed === null) continue;
        for (const key of parsed.keys) {
          if (key.startsWith('--')) continue; // CSS custom property — the sanctioned var-only form
          // The ONE direct-visual-property exception: the color-picker swatch fill.
          if (
            (key === 'backgroundColor' || key === 'background') &&
            STYLE_FILL_EXCEPTION_FILE.test(file)
          ) {
            continue;
          }
          console.log(`${file}:${lineNo} [inline-style] direct visual property '${key}' in inline style (allowed only: CSS custom properties, or the color-picker swatch-fill color). Route layout/sizing through a '--*' var + an arbitrary-value class (§7.1).\n    ${trimmedLine}`);
          violations++;
        }
      }
    }

    lines.forEach((line, i) => {
      // skip comment-only lines
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      for (const { id, re, msg } of RULES) {
        re.lastIndex = 0;
        if (re.test(line)) {
          console.log(`${file}:${i + 1} [${id}] ${msg}\n    ${trimmed}`);
          violations++;
        }
      }
      // Inline <svg> JSX as an icon (comment lines already skipped above; JSDoc `* …<svg>` is safe).
      if (/<svg[\s>]/.test(line) && !SVG_GRAPHIC_ALLOWLIST.test(file)) {
        console.log(`${file}:${i + 1} [inline-svg-icon] inline <svg> in component source (use a sanctioned lucide icon / Icon wrapper; allowlist genuine graphic primitives)\n    ${trimmed}`);
        violations++;
      }
      // §7.6 Base UI render contract — a single-Base-UI-root wrapper must not strip `render`.
      if (RENDER_OMIT.test(line) && !RENDER_OMIT_EXEMPT.test(file)) {
        console.log(`${file}:${i + 1} [render-contract] Omit<…, 'render'> removes Base UI's polymorphic render prop (§7.6). Expose render on single-root wrappers; only multi-element composites (split-button) are exempt — see docs/ledger/component-matrix.md.\n    ${trimmed}`);
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
        //  (3) layout primitives (fr / % / min-content / max-content / auto / 0).
        if (/^(\d+(\.\d+)?(fr|%)|min-content|max-content|auto|0)$/.test(inner)) continue;
        //  (4) CSS-wide keywords.
        if (/^(inherit|initial|unset|revert|revert-layer)$/.test(inner)) continue;
        console.log(`${file}:${i + 1} [arbitrary-value] hardcoded arbitrary "${m[0]}" (use a token utility, a var(--token), or a token/viewport calc — not a hardcoded literal)\n    ${trimmed}`);
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
const SCROLL_LOCK_DECL = /^\s*(?:margin-right|--removed-body-scroll-bar-size)\s*:\s*0(?:px)?\s*!important\s*;?\s*$/;
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
  } catch {
    continue;
  }
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');
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
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = codeOnly[i] ?? '';
      const opensReducedMotion =
        /@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(line);
      if (opensReducedMotion && reducedMotionDepth === -1) reducedMotionDepth = depth;
      // Detect the scroll-lock selector on a line that also opens its block (`… { … }` on the rule's
      // opening line). The exempt window is the brace depth INSIDE the block (depth + 1).
      const opensScrollLock = SCROLL_LOCK_SELECTOR.test(line) && /\{/.test(line);
      if (opensScrollLock && scrollLockDepth === -1) scrollLockDepth = depth + 1;
      const inReducedMotion = reducedMotionDepth !== -1;
      const inScrollLock = scrollLockDepth !== -1;
      if (/!important/.test(line) && !inReducedMotion) {
        // (B) the narrow scroll-lock zero-out exception: only the two sanctioned decls, only inside the
        // documented `html > body[data-scroll-locked]` block.
        const isScrollLockExempt = inScrollLock && SCROLL_LOCK_DECL.test(lines[i] ?? '');
        if (!isScrollLockExempt) {
          console.log(
            `${file}:${i + 1} [important] !important is not allowed in raw CSS ` +
              `(sanctioned ONLY in a @media (prefers-reduced-motion: reduce) reset, or the documented ` +
              `scroll-lock margin/size zero-out under html > body[data-scroll-locked] — requirements §7.5)` +
              `\n    ${(lines[i] ?? '').trim()}`,
          );
          violations++;
        }
      }
      // Update brace depth AFTER classifying this line; when we exit back to the depth at which a
      // tracked block opened, we've left it.
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (inReducedMotion && depth === reducedMotionDepth) reducedMotionDepth = -1;
          if (inScrollLock && depth < scrollLockDepth) scrollLockDepth = -1;
        }
      }
    }
  }
}


/* ─────────────────────────────────────────────────────────────────────────────────────────────
 * A — AST accessible-name rule (icon-only controls). Regex can't see multi-line JSX, so this
 * pass parses each component/preview file with the TypeScript compiler API and walks JSX:
 * a `<Button size="icon*">` (icon-only by definition — no visible text names it) MUST carry
 * `aria-label` or `aria-labelledby` on the SAME element. `IconButton` already enforces this at
 * the type level; this closes the raw-`Button` escape hatch uniformly (no grandfathering).
 * CopyButton and other wrappers that render Button internally are checked at their own render
 * site inside the registry — consumers of those wrappers get their names from the wrapper's
 * own required props.
 * ─────────────────────────────────────────────────────────────────────────────────────────── */
{
  const ts = (await import('typescript')).default;
  for (const root of ROOTS) {
    let files;
    try {
      files = walk(root);
    } catch {
      continue;
    }
    for (const file of files.filter((f) => f.endsWith('.tsx'))) {
      const src = readFileSync(file, 'utf8');
      if (!/size=["{']icon/.test(src)) continue;
      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node) => {
        if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
          const tag = node.tagName.getText(sf);
          if (tag === 'Button') {
            const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
            const get = (n) => attrs.find((a) => a.name.getText(sf) === n);
            const size = get('size');
            const sizeText = size?.initializer?.getText(sf) ?? '';
            if (/^["'{]?\s*["']icon/.test(sizeText)) {
              const named = get('aria-label') || get('aria-labelledby');
              // A spread (e.g. {...props} on a wrapper's internal Button) may carry the name —
              // only flag when there is NO spread that could provide it.
              const hasSpread = node.attributes.properties.some(ts.isJsxSpreadAttribute);
              if (!named && !hasSpread) {
                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
                console.log(
                  `${file}:${line + 1} [icon-button-name] <Button size=${sizeText}> without aria-label/aria-labelledby — icon-only controls need an accessible name (or use IconButton, which requires one at the type level)`,
                );
                violations++;
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
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
  } catch {
    continue;
  }
  for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const m of lines[li].matchAll(/["'`]([^"'`]*)["'`]/g)) {
        const lit = m[1];
        if (!/(?:^|\s)uppercase(?:\s|$)/.test(lit)) continue;
        const stylesType = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|h\d|label|label-sm|code|code-sm|display-\w+|mono-label)\b/.test(lit);
        if (!stylesType) continue;
        const mono = /\bfont-mono\b|\btext-mono-label\b/.test(lit);
        const big = /\btext-(?:lg|xl|2xl|3xl|h[1-4]|display-\w+)\b/.test(lit);
        if (!mono || big) {
          console.log(
            `${file}:${li + 1} [uppercase-mono] uppercase type must be the mono voice (font-mono/text-mono-label, ≤14px) — uppercase Geist Sans and big uppercase mono are banned (D20)`,
          );
          violations++;
        }
      }
    }
  }
}

if (violations) {
  console.error(`\n✗ design-lint: ${violations} violation(s)`);
  process.exit(1);
}
console.log('✓ design-lint: clean');
