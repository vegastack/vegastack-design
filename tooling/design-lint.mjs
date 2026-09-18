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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

import { ROOT as REPO_ROOT, walk as walkTree } from "./lib/fs.mjs";

// `--docs-shell` injects fixed repo-relative roots, but the docs package invokes this script with
// cwd=apps/docs. Those roots are anchored to REPO_ROOT (tooling/lib/fs.mjs) so the flag lints the
// same files regardless of the caller's cwd.

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
let emittedCssMode = false;
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--token-css") {
    const next = rawArgs[++i];
    if (next) tokenCssRoots.push(next);
  } else if (rawArgs[i] === "--docs-shell") {
    docsShellMode = true;
  } else if (rawArgs[i] === "--emitted-css") {
    emittedCssMode = true;
  } else {
    ROOTS.push(rawArgs[i]);
  }
}

// `--emitted-css` is the DC-02 lane over the BUILT stylesheet: the off-system values in the docs
// site come from Fumadocs and the typography plugin, so source linting can never see them. It
// lives in its own module (TG-08 edits this file in the same wave); this is the only hook.
if (emittedCssMode) {
  const { lintEmittedDocsCss } = await import("./design-lint-emitted-css.mjs");
  const { files, findings } = lintEmittedDocsCss();
  if (findings.length > 0) {
    console.error(
      `✗ design-lint --emitted-css: ${findings.length} offender(s)`,
    );
    for (const finding of findings.slice(0, 40))
      console.error(`  ✗ ${finding}`);
    process.exit(1);
  }
  console.log(
    `✓ design-lint --emitted-css: ${files.length} built stylesheet(s) on-system`,
  );
  process.exit(0);
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

// The motion vocabulary the transition-pairing rule accepts. A variant prefix (`hover:`,
// `data-[open]:`) may precede a token; a bare Tailwind step may not stand in for one.
const MOTION_DURATION_UTILITY =
  /(?:^|[\s:\]])duration-(?:fast|base|slow)(?=\s|$)/;
const MOTION_EASE_UTILITY =
  /(?:^|[\s:\]])ease-(?:standard|emphasized|exit|spring)(?=\s|$)/;
// Tailwind's own steps: `duration-<n>` for any n but 0 (`duration-0` is the structural collapse a
// `data-[instant]:` variant needs and is not a duration choice) and the five named default curves.
const RAW_MOTION_STEP =
  /(?:^|[\s:\]])(duration-(?!0(?=\s|$))\d+|ease-(?:in-out|in|out|linear|initial))(?=\s|$)/g;

// A class literal reaches more than this many levels into its own descendants and it has stopped
// styling itself. 20 is the audit's figure (04 §7); `audio-player` held 76 in one string.
const MAX_DESCENDANT_OVERRIDES = 20;

// A cheap "is this a class string" test, so the whitespace rule never fires on prose, an
// aria-label, or a JSX text node that happens to be a string literal.
const LOOKS_LIKE_CLASS_STRING =
  /(?:^|\s)(?:flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|items-|justify-|gap-|p[xytblrse]?-|m[xytblrse]?-|text-|bg-|border|rounded|shadow-|size-|h-|w-|min-|max-|overflow-|z-|opacity-|transition|duration-|ease-|truncate|shrink|grow|font-|leading-|tracking-|cursor-|select-|outline-|ring-|data-\[|group|peer)/;

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
  // ICO-1 — sanctioned icon SOURCES only. Importing any other icon library into component source
  // is banned (it bypasses the locked lucide/thesvg + Icon/BrandIcon contract). Denylist of the
  // common ones so there are no false positives on legitimate packages.
  {
    id: "icon-source",
    re: /from\s+['"](?:@heroicons\/|@tabler\/icons|react-icons|phosphor-react|@phosphor-icons\/|feather-icons|react-feather|@radix-ui\/react-icons|@fortawesome\/|ionicons|@ant-design\/icons|@mui\/icons-material|boxicons|@iconify\/)/g,
    msg: "non-sanctioned icon library (use lucide-react / lucide-animated / @vegastack/design/icons / thesvg via Icon/BrandIcon)",
  },
  // FOC-1 / FOC-6 — THE machine check that the glow never creeps back in through a later upstream
  // pull. shadcn writes `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`
  // on button, input, checkbox, switch, badge, accordion, slider, scroll-area and the field cards;
  // this system has exactly ONE focus affordance, the global 2px `:focus-visible` outline in
  // `base.css`. Every migrated component strips the glow, and this rule is what keeps it stripped —
  // without it, a re-pull in Batch 2 or a hand-written component silently reintroduces the halo
  // and nothing anywhere says so.
  //
  // The box-shadow half is scoped to a FOCUS variant, and Batch 5 is why. Upstream draws a
  // resting 1px hairline with `shadow-[0_0_0_1px_var(--sidebar-border)]` on `SidebarMenuButton`'s
  // `outline` variant — a border technique, always on, nothing to do with focus — and an
  // unscoped `shadow-[0_0_0_` rejected it. What FOC-1/FOC-6 decide is the AFFORDANCE, so the
  // rule now reads `focus:`/`focus-visible:`/`focus-within:shadow-[0_0_0_…]` and leaves a
  // resting hairline alone. Everything else stays unconditional: `ring-3`, `ring-[3px]`,
  // `ring-ring/NN` and any `focus-visible:ring-*` are the glow however they are spelled, and a
  // component that wants a hairline has `border` and this shadow spelling, not a ring.
  {
    id: "no-focus-ring-glow",
    re: /\bring-3\b|\bring-\[3px\]|\bring-ring\/\d+|focus-visible:ring-|\bfocus(?:-visible|-within)?:shadow-\[0_0_0_/g,
    msg: "focus ring glow (FOC-1/FOC-6): base.css owns the one `:focus-visible` outline — no ring-3, no ring-ring/NN, no focus-visible:ring-*, no focus 0 0 0 box-shadow ring",
  },
];

// Inline <svg> used as an icon is banned in component source — use a sanctioned lucide icon or the
// `Icon`/`BrandIcon` wrapper. Allowlist files that legitimately draw a NON-icon graphic primitive
// with SVG geometry (e.g. a determinate progress ring) — those aren't icons.
// `progress-indicator` draws a non-icon graphic primitive. The mirrored lucide-animated icons used
// to need an exemption here too — they were Motion <svg> components — but they are now data modules
// over one factory and contain no JSX at all, which `tooling/verify-animated-icons.mjs` asserts
// directly. An exemption that can no longer be reached is an exemption that should not exist.
const SVG_GRAPHIC_ALLOWLIST = /(?:^|\/)(?:empty|progress-indicator)\.tsx$/;

/**
 * `icon-button-name`'s host escape hatch (Batch 4 of the shadcn reset, 2026-09-18).
 *
 * Upstream never puts the name on the Button. It puts the Button in a `render` prop and names the
 * HOST — `<Dialog.Close render={<Button size="icon-sm" />}><XIcon /><span className="sr-only">
 * Close</span></Dialog.Close>`, or `<Toast.Close aria-label="Close toast" render={render} />`.
 * The rendered control is the host element wearing the Button's classes, so the accessible name is
 * the host's, and a rule that only reads the Button's own attributes reports four false positives
 * against dialog, sheet, toast and their mirror.
 *
 * The invariant is unchanged — an icon-only control must have an accessible name. What changes is
 * WHERE the rule is allowed to find it: on the Button, or on the host that renders it. A Button in
 * a `render` position with an anonymous host still fails, and
 * `tooling/verify-design-lint-structural.mjs` observes both halves.
 */
function namedByHost(button, sf) {
  const nameOn = (opening) => {
    const attrs = opening.attributes.properties.filter(ts.isJsxAttribute);
    if (
      attrs.some((a) => /^aria-(label|labelledby)$/.test(a.name.getText(sf)))
    ) {
      return true;
    }
    // An `sr-only` label anywhere in the host's own children is the other upstream spelling.
    const element = ts.isJsxOpeningElement(opening) ? opening.parent : null;
    return element ? /\bsr-only\b/.test(element.getText(sf)) : false;
  };

  // 1. `<Host render={<Button size="icon" />}>` — walk up to the `render` attribute's own element.
  for (let node = button.parent; node; node = node.parent) {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === "render") {
      const host = node.parent.parent;
      return nameOn(host);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) break;
    if (ts.isFunctionLike(node)) break;
  }

  // 2. `function Close({ render = <Button size="icon" />, … })` — the host is whichever element in
  //    the same function forwards that binding on. Only a binding literally named `render`
  //    qualifies, so this cannot be stretched into "some Button somewhere is named".
  const binding = (() => {
    for (let node = button.parent; node; node = node.parent) {
      if (ts.isBindingElement(node) || ts.isVariableDeclaration(node)) {
        return node.name.getText(sf) === "render" ? node : null;
      }
      if (ts.isFunctionLike(node)) return null;
    }
    return null;
  })();
  if (!binding) return false;

  let owner = binding.parent;
  while (owner && !ts.isFunctionLike(owner)) owner = owner.parent;
  if (!owner) return false;

  let named = false;
  const visit = (node) => {
    if (named) return;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const forwards = node.attributes.properties.some(
        (a) =>
          ts.isJsxAttribute(a) &&
          a.name.getText(sf) === "render" &&
          /^\{\s*render\s*\}$/.test(a.initializer?.getText(sf) ?? ""),
      );
      if (forwards && nameOn(node)) named = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(owner);
  return named;
}

// `muted-foreground-faint` is intentionally sub-AA and therefore limited to placeholder/disabled
// copy. These two files use it on aria-hidden decorative glyphs, never meaningful text.
const FAINT_DECORATIVE_ALLOWLIST =
  /(?:^|\/)(?:breadcrumb|comparison-matrix)\.tsx$/;

// Native controls are allowed only where the component owns a semantic adapter/integration that a
// higher-level VegaStack control cannot replace. Exact per-tag counts fail closed in BOTH directions:
// adding a control and removing the last reviewed control require re-auditing this rationale list.
// `/attachment.tsx` USED to be the first entry here, counting one native-button fallback. Batch 6
// of the shadcn reset (2026-09-18) reset the file onto upstream, whose `AttachmentTrigger` reaches
// its button through `useRender({ defaultTagName: "button" })` and writes no `<button>` JSX at all,
// so the count went to zero. The rule fails closed in both directions precisely so that shows up:
// the entry is DELETED rather than carried at `{}`, because an exemption that can no longer be
// reached is an exemption that should not exist (the same call Batch 5 made on the geometry lane's
// `resizableNested` exclusion).
const RAW_INTERACTIVE_EXEMPTIONS = new Map([
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
      counts: { button: 1 },
      rationale:
        "group-toggle control preserves table semantics (the sort header now composes Button via data-table-parts)",
    },
  ],
  [
    "/data-list.tsx",
    {
      counts: { button: 1 },
      rationale:
        "row activation control preserves table semantics (the sort header now composes Button via data-table-parts)",
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
    {
      counts: { button: 2 },
      rationale:
        "the collapsed progress pill and the step rows — both carry VISIBLE text, so they are text controls, not icon buttons (the icon-only collapse toggle became an IconButton in F2)",
    },
  ],
  [
    "/sidebar.tsx",
    {
      counts: { button: 1 },
      rationale:
        "`SidebarRail`, the collapse strip along the rail's edge — upstream's own raw <button>, and the one control here no VegaStack component substitutes for: it is a 16px full-height hit strip with no label, no icon and no text, `tabIndex={-1}` by design, and a Button at any size would paint a box where the design wants an invisible seam. Batch 5 of the shadcn reset put this file on upstream's source, which dropped the count from 2 to 1: `SidebarMenuButton`'s fallback is now `useRender`'s, not a literal <button>, and `SidebarTrigger` composes Button.",
    },
  ],
  [
    "/tag-group.tsx",
    {
      counts: { button: 1 },
      rationale:
        "the overflow disclosure control — a Chip rendered as a button, because a chip's root is a span and no VegaStack control is a pill-shaped text button (tag removal became Chip's IconButton in T2)",
    },
  ],
  [
    "/native-select.tsx",
    {
      counts: { select: 1 },
      rationale:
        "NativeSelect IS the tokenized native <select> adapter — the platform picker is the whole point of the component, and no VegaStack control substitutes for it (Select is the rendered alternative, on its own page)",
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
  // `template` marks a literal whose text was ASSEMBLED from a template's static spans joined by
  // a space. That join is synthetic: it inserts separators that were never in the source, so any
  // rule about the literal's own whitespace would be reading the joiner rather than the author.
  const push = (node, text, template = false) => {
    const line =
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1;
    literals.push({ text, line, template });
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
        true,
      );
      for (const span of node.templateSpans) visit(span.expression);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return literals;
}

// §Build-rules class-glue — two ADJACENT string literals joined by `+` with no separating space.
// JavaScript concatenates them into one word, so the last utility of the left literal and the first
// of the right literal are BOTH destroyed: `"…p-0.5" + "bg-surface-3 …"` ships `p-0.5bg-surface-3`,
// which Tailwind never emits and the browser silently drops. The defect is invisible to every rule
// that reads a literal on its own — `transition-pairing` finds `ease-standard` in the left literal
// and passes while the rendered element has no ease token at all (four live instances on `main`,
// 2026-09-09: switch.tsx ×2, otp-input.tsx, number-field.tsx). So it has to be seen STRUCTURALLY,
// at the seam, which is a `BinaryExpression` and not a literal.
//
// Only literal+literal seams are inspected: `"text-" + size` is a deliberate build, not a glue.
// The class-context guard is `LOOKS_LIKE_CLASS_STRING` on either side, so a concatenated prose
// message (an error string split across lines) is not a violation.
// The canonical fix is the `[...].join(" ")` form `input.tsx` uses, which cannot express this bug.
// Padding the seam with a space instead is NOT a fix: `class-whitespace` rejects a leading or
// trailing space inside a class literal, so `+`-concatenated class literals have no correct form.
function classConcatGlueSites(file, src) {
  if (!/\.tsx?$/.test(file)) return [];
  const sourceFile = sourceFileFor(file, src);
  const sites = [];
  // The literal ADJACENT to the seam on the left. `a + b + c` parses left-associatively as
  // `(a + b) + c`, so for the outer node the neighbour is the inner node's own right operand.
  const adjacentLeft = (node) => {
    if (ts.isStringLiteral(node)) return node;
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return ts.isStringLiteral(node.right) ? node.right : null;
    }
    if (ts.isParenthesizedExpression(node))
      return adjacentLeft(node.expression);
    return null;
  };
  const visit = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      ts.isStringLiteral(node.right)
    ) {
      const left = adjacentLeft(node.left);
      const right = node.right;
      if (left) {
        const l = left.text;
        const r = right.text;
        const classContext =
          LOOKS_LIKE_CLASS_STRING.test(l) || LOOKS_LIKE_CLASS_STRING.test(r);
        if (
          classContext &&
          l !== "" &&
          r !== "" &&
          !/\s$/.test(l) &&
          !/^\s/.test(r)
        ) {
          sites.push({
            line:
              sourceFile.getLineAndCharacterOfPosition(
                right.getStart(sourceFile),
              ).line + 1,
            glued: `${l.split(/\s+/).at(-1)}${r.split(/\s+/)[0]}`,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return sites;
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
/**
 * A hex inside an ATTRIBUTE-SELECTOR VALUE is a colour being TARGETED, not one being authored.
 *
 * Batch 6 of the shadcn reset (2026-09-18) is why this exists. Upstream's `chart.tsx` retargets
 * recharts' own hard-coded defaults with `[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50`
 * and `[&_.recharts-dot[stroke='#fff']]:stroke-transparent` — the `#ccc` and `#fff` are recharts'
 * values being MATCHED so a semantic token can replace them, which is COL-20 being enforced rather
 * than broken. A file allowlist would have switched the rule off for the whole of `chart.tsx`,
 * including its real declarations; masking by POSITION leaves every authored hex in every file
 * rejected and reaches only the selector position. Both halves are observed in
 * `tooling/verify-design-lint-structural.mjs` — a bare `#ccc` in the negative specimen, a
 * `[stroke='#ccc']` selector in the positive one.
 */
const SELECTOR_HEX = /\[[^\][]*?=(['"])#[0-9a-fA-F]{3,8}\1\]/g;
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

function walk(dir) {
  const absoluteRoot = resolve(dir).replaceAll("\\", "/");
  return walkTree(dir, {
    // In --docs-shell mode the component copy-in, previews, and stories are linted by their own
    // invocations; the shell walk skips those subtrees.
    prune: (relative) =>
      docsShellMode &&
      /apps\/docs\/components\/(?:preview|stories|ui)$/.test(
        `${absoluteRoot}/${relative}`,
      ),
    // Lint shipped component source only — skip test files (test scaffolding may use inline sizing).
    include: (relative) =>
      /\.(tsx?|css)$/.test(relative) &&
      !/\.test\.(tsx?)$/.test(relative) &&
      !(docsShellMode && relative.endsWith(".css")),
  });
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

    // The T4 transition-pairing contract is GONE (MOT-2 = shadcn). It required every
    // `transition*` literal to name a `duration-fast/base/slow` token AND an
    // `ease-standard/emphasized/exit/spring` token in the same string. Upstream writes
    // `transition-all`, `transition-colors`, `duration-100` and `ease-in-out` throughout, so the
    // rule now fails on almost every file this system is being rebuilt from.

    // The FIELD-GROUP PAIRING rule is GONE. It keyed on a file importing `fieldControlGroup`
    // from `@vegastack/design` — a recipe this batch deletes (FRM-1 = shadcn) — so the rule has no
    // trigger left. The contract it protected is intact: `base.css` still hangs the forced-colours
    // focus outline off the bare `data-field-group` attribute (FOC-7), and the geometry lane
    // measures that outline on a real focused addon field.

    // ── G1-b rules (issue #49 §7) — all literal-scoped, all with a negative fixture in
    // `verify-design-lint-structural.mjs`. Each is a token-vocabulary rule that source review kept
    // finding by hand; a rule nobody can forget is worth more than a review note.
    for (const { text: lit, line, template } of literals) {
      const report = (id, message) => {
        console.log(`${file}:${line} [${id}] ${message}`);
        violations++;
      };

      // The `restated-focus` rule is GONE, replaced by the `no-focus-ring-glow` RULE above.
      // It banned any `focus-visible:outline-*`/`focus-visible:ring-*`, which was right while every
      // component was ours; upstream restates focus per component, so a blanket ban would reject
      // every file this system is rebuilt from. The narrower rule bans the GLOW specifically, which
      // is the thing FOC-1 and FOC-6 actually decide.

      // (b) restated reduced-motion. base.css already collapses every animation and transition
      // under `@media (prefers-reduced-motion: reduce)`, globally and with the one sanctioned
      // `!important`. A `motion-reduce:` variant that says the SAME thing per element is dead
      // weight and a second place for the policy to drift.
      //
      // Scoped to the variants that are genuinely redundant. `motion-reduce:transform-none` and
      // friends are NOT restatements: they suppress the end STATE, not the animation to it, which
      // the global reset does not do and which is a real per-component decision.
      const restatedMotion = lit.match(
        /(?:^|[\s:])motion-reduce:(transition-none|animate-none|duration-0|transition-duration-\S+)/,
      );
      if (restatedMotion) {
        report(
          "restated-motion-reduce",
          `"motion-reduce:${restatedMotion[1]}" restates the global reduced-motion reset in ` +
            "base.css (animation and transition duration already collapse to 0.01ms there). " +
            "Remove it; `motion-reduce:transform-none` and other END-STATE suppressions are not " +
            "restatements and stay.",
        );
      }

      // (c) TD-3 — `text-xs` mono-only — IS NOT ENFORCED HERE, deliberately, and is the one rule
      // of issue #49 §7 that G1-b measured as landable and still did not land.
      //
      // The registry has ZERO `text-xs` offenders, so on the surface the rule is free. The docs
      // shell has EIGHT, every one a muted caption (`animated-icon-card.tsx:78`,
      // `foundations.tsx:137/437/527/544/692`, `icon-gallery.tsx:62/80`). Enforcing the rule means
      // choosing, eight times, between 14px sans and switching those captions to the mono voice —
      // a visible typographic change to the public docs site, in a repository where NO lane takes
      // a screenshot (AGENTS.md, locked decision R3) and the visual reviewer is a person opening
      // the site. Writing a rule and then quietly restricting it to the roots that already pass
      // would be the fail-open this batch exists to remove. Flagged for MK instead.
      // The `viewport-magic` rule is GONE (LAY-7 = shadcn). Upstream sizes its sidebar with
      // `min-h-svh` and its drawer with `min-h-dvh`.

      // (e) class-string hygiene. A leading, trailing or doubled space inside a class literal is
      // invisible in review and survives every merge, so the same file accumulates them. It also
      // defeats grep — `"a  b"` does not match `/a b/` — which is how several audit sweeps
      // undercounted. Only literals that actually look like class strings are checked.
      // Never a template's synthetic join, and never a multi-line literal: class strings in this
      // codebase are single-line (a long one is split into several literals `cn()` joins), whereas
      // a multi-line literal is prose — markdown fixtures, placeholder copy — whose blank lines and
      // indentation are content, not sloppiness.
      if (
        !template &&
        !lit.includes("\n") &&
        LOOKS_LIKE_CLASS_STRING.test(lit) &&
        /^\s|\s$|\s\s/.test(lit)
      ) {
        report(
          "class-whitespace",
          "class string has a leading, trailing or doubled space — single-space separated, trimmed",
        );
      }

      // (f) descendant-override density. A class literal that reaches more than
      // MAX_DESCENDANT_OVERRIDES levels down (`[&_svg]:`, `[&>div]:`, …) has stopped styling
      // itself and started styling its children's internals from the outside, which is the shape
      // that made `audio-player` unreadable (76 overrides in one string, audit 04 §7). The fix is
      // a `data-slot` on the child and a rule the child owns.
      // One level of nesting is allowed inside the selector, because real overrides carry it —
      // `[&_svg:not([class*='size-'])]:size-…` and `[&_[data-slot=x]]:hidden` would otherwise be
      // missed by a `[^\]]*` body and the density would read lower than it is.
      const overrides = (
        lit.match(/\[&[^\][]*(?:\[[^\]]*\][^\][]*)*\]:/g) ?? []
      ).length;
      if (overrides > MAX_DESCENDANT_OVERRIDES) {
        report(
          "descendant-override-density",
          `${overrides} descendant overrides in one class string (cap ${MAX_DESCENDANT_OVERRIDES}) — ` +
            "style the child through its own data-slot instead of reaching into it",
        );
      }

      // The `hover-without-pressed` rule is GONE (INT-4 = shadcn). It failed any class string
      // that changed the fill on hover without a pressed rung beside it. Upstream's own controls
      // almost never carry one — the default button is `hover:bg-primary/80` and nothing else — so
      // the rule now rejects upstream's files by construction.
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

    // The `raw-motion` rule is GONE (MOT-2 = shadcn). Upstream's drawer carries
    // `ease-[cubic-bezier(0.32,0.72,0,1)]` and `duration-[calc(var(--drawer-swipe-strength)*400ms)]`
    // in its own source.

    for (const { line, glued } of classConcatGlueSites(file, src)) {
      console.log(
        `${file}:${line} [class-glue] two adjacent class literals are concatenated with no separating space — ` +
          `the shipped element gets "${glued}", destroying the utility on BOTH sides of the seam. ` +
          `Join the fragments with [\u2026].join(" ") \u2014 the form input.tsx uses, and the only sanctioned ` +
          `one, since padding the seam with a trailing/leading space is itself a class-whitespace violation.`,
      );
      violations++;
    }

    if (!RENDER_OMIT_EXEMPT.test(file)) {
      for (const line of renderOmitLines(file, src)) {
        console.log(
          `${file}:${line} [render-contract] Omit<…, 'render'> removes Base UI's polymorphic render prop (§7.6). Expose render on single-root wrappers; only multi-element composites (split-button) are exempt — see docs/ledger/component-matrix.md.`,
        );
        violations++;
      }
    }

    // The `outline-none` file rule is GONE (FOC-11 = shadcn). Upstream writes `outline-none` on
    // button, input, textarea, tabs panel and every popup, and relies on its own focus ring; here
    // the global `:focus-visible` outline in base.css is the affordance, and the geometry lane
    // measures it per control on a real focused element rather than inferring it from a file.

    // The §7.1 inline-style contract and the arbitrary-value contract are GONE (DOC-10 = shadcn).
    // Upstream ships `h-[18.4px]`, `rounded-[4px]`, `p-[3px]`, `bottom-[-5px]`, `text-[0.8rem]` and
    // `rounded-[min(var(--radius-md),10px)]` in its own component source, so a contract that
    // permits only `var()`, a token calc, a layout primitive or a CSS keyword rejects the baseline
    // this system is rebuilt from.

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
        // `hex-color` reads the line with attribute-selector VALUES masked out — see SELECTOR_HEX.
        const subject =
          id === "hex-color" ? line.replace(SELECTOR_HEX, "[]") : line;
        re.lastIndex = 0;
        if (re.test(subject)) {
          console.log(`${file}:${i + 1} [${id}] ${msg}\n    ${trimmed}`);
          violations++;
        }
      }
      // `faint-text-role` is GONE, and so is the token it policed. `muted-foreground-faint` was a
      // deliberately sub-AA placeholder ink; FRM-2 is decided as **shadcn**, so a placeholder reads
      // `text-muted-foreground` and there is no sub-AA role left to restrict.
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
const walkCss = (dir) =>
  walkTree(dir, { include: (relative) => /\.css$/.test(relative) });

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
        !/@base-ui|motion(?:\/react)?|react-day-picker|tiptap|recharts|react-resizable-panels|@shadcn\/react|React\.(?:use[A-Z]|createContext)|\buse[A-Z]\w*\s*\(|\bon[A-Z]\w*\s*=|\b(?:window|document|IntersectionObserver|ResizeObserver|MutationObserver|requestAnimationFrame)\b/.test(
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
      // (i) hand-rolled ref merge. `mergeRefs` (`@vegastack/design`) is the ONE implementation of
      // "feed this node to my own ref AND to the consumer's". Under React 19 ref-as-prop, a
      // component that needs the node and must also forward it is the NORMAL case, so the pattern
      // reappears constantly — it was hand-inlined in nine registry files before `mergeRefs`
      // existed. Mk1 swept those; `table-scroll-region.tsx` then landed in T1 with a fresh copy and
      // nothing noticed, because a one-time grep is not a gate. This is the gate.
      //
      // The signature is unambiguous and cannot be written by accident: the same identifier is
      // tested with `typeof x === "function"` AND assigned through `x.current = …`. That pair is a
      // ref fan-out and nothing else. A component that only reads `ref.current`, or only branches
      // on some unrelated callable prop, matches neither half.
      {
        const callableTested = new Set();
        const currentAssigned = new Set();
        const nameOf = (expr) => (ts.isIdentifier(expr) ? expr.text : null);
        const collect = (node) => {
          if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
            ts.isTypeOfExpression(node.left) &&
            ts.isStringLiteral(node.right) &&
            node.right.text === "function"
          ) {
            const name = nameOf(node.left.expression);
            if (name) callableTested.add(name);
          }
          if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(node.left) &&
            node.left.name.text === "current"
          ) {
            const name = nameOf(node.left.expression);
            if (name) currentAssigned.add(name);
          }
          ts.forEachChild(node, collect);
        };
        collect(sf);
        for (const name of callableTested) {
          if (!currentAssigned.has(name)) continue;
          console.log(
            `${file}:1 [hand-rolled-ref-merge] '${name}' is fanned out by hand; use mergeRefs from @vegastack/design (wrap the call in useMemo — it is not memoized)`,
          );
          violations++;
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
              if (!named && !hasSpread && !namedByHost(node, sf)) {
                const { line } = sf.getLineAndCharacterOfPosition(
                  node.getStart(sf),
                );
                console.log(
                  `${file}:${line + 1} [icon-button-name] <Button size=${sizeText}> without aria-label/aria-labelledby — icon-only controls need an accessible name (or use IconButton, which requires one at the type level, or a host that names it: \`render={<Button size="icon" />}\` on an element carrying aria-label or an sr-only label)`,
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

          // The `direct-lucide-size` rule is GONE (ICO-2 = shadcn). Upstream sizes its icons
          // with `[&_svg:not([class*='size-'])]:size-4` on the parent and a literal `size-3`/
          // `size-3.5` at small tiers; the `--icon-*` roles it policed no longer exist.

          if (canonicalRegistryFile && RAW_INTERACTIVE_TAGS.has(tag)) {
            rawInteractiveCounts[tag]++;
          }

          // The `standard-control-cursor` rule is GONE (INT-10 = shadcn). Upstream sets
          // `cursor-default` on menu, select and command items by design; INT-1 keeps our own
          // global hand cursor, and a migrated component simply drops upstream's local override.
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

/* The `uppercase-mono` rule is GONE (TYP-7 = shadcn). It required every uppercase type literal to
 * carry the mono voice and to stay at or below 14px. Upstream uses no uppercase at all, so the rule
 * has nothing to police in a system rebuilt on it, and the one place it still could fire — our own
 * extras — is a Batch 7 judgement, not a lint. */

if (violations) {
  console.error(`\n✗ design-lint: ${violations} violation(s)`);
  process.exit(1);
}
console.log("✓ design-lint: clean");
