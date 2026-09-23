#!/usr/bin/env node
// Design-lint: the VegaStack rules that byte parity with upstream cannot see, over component source
// (default root `packages/ui/registry`; pass other roots as arguments). Rules are rebuilt from the
// shadcn reset's decision register — a rule exists only where the decision row is **ours**:
//   - colour: no hex literal, no numbered Tailwind palette (`bg-neutral-900`, `text-red-500`)
//   - `!important`: never in authored CSS outside the two documented raw-CSS exceptions, and never
//     as Tailwind's `!` modifier (`p-0!`, `!p-0`) in a class string outside the rationale-counted
//     `IMPORTANT_MODIFIER_EXEMPTIONS` (upstream's own verbatim uses, plus two of ours)
//   - focus: no ring glow (FOC-1/FOC-6); surfaces: no `ring-1 ring-foreground/…` outline (BRD-1)
//   - type: no local `tracking-*` but `tracking-widest` (TYP-15), no `uppercase` (TYP-7), no
//     arbitrary font size (TYP-18), tabular figures on formatted numbers (TYP-10)
//   - icons: sanctioned sources only (ICO-1), no inline <svg> as an icon, one loader mark (ICO-8),
//     icon-only Buttons carry an accessible name
//   - structure: no Omit<…,'render'> (§7.6), no React.forwardRef, no hand-rolled ref merge, native
//     controls only under a counted exemption, no presentational `'use client'`
//   - hygiene: class-glue, class-whitespace, descendant-override density, flex+truncate
//
// Arbitrary values (`h-[18.4px]`) and inline `style={…}` are NOT banned any more (DOC-10 = shadcn):
// upstream ships both in its own source. What is still banned inside them is a hex colour, a raw
// palette step, or an arbitrary FONT SIZE. Each rule is observed failing by
// `tooling/verify-design-lint-structural.mjs`.
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
// A bare run lints the components. It used to default to `packages/ui/src`, which after the reset
// holds only the barrel and the provider, so `node tooling/design-lint.mjs` reported "clean"
// without reading a single component (found 2026-09-23 by the Regent consumer audit).
if (ROOTS.length === 0 && tokenCssRoots.length === 0)
  ROOTS.push(resolve(REPO_ROOT, "packages/ui/registry"));
const PALETTES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PROPS =
  "bg|text|border|ring|fill|stroke|decoration|divide|from|via|to|caret|accent|shadow|outline";

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
  // BRD-1 (ours since MK 2026-09-23) — a surface separates with a real 1px `border border-border`,
  // never shadcn's `ring-1 ring-foreground/10` box-shadow outline. The reset had taken upstream's
  // ring, `foundations/elevation.mdx` kept describing a border, and consumers read the ring as an
  // unwanted outline; the Regent audit is what surfaced the contradiction. Card, dialog,
  // alert-dialog, popover, hover-card, select, the three menus, combobox, navigation-menu and
  // settings-row each carry the swap in their patch, and this rule is what keeps the next upstream
  // pull from bringing the ring back — the same job `no-focus-ring-glow` does for the halo.
  //
  // Keyed on BOTH halves of an outline, under any variant, since either alone is enough to draw
  // one: the 1px WIDTH (`ring-1`, `ring-px`, `ring-[1px]` — nothing in this system is a 1px ring
  // except a surface edge; focus is an outline, FOC-1) and the hairline INKS (`foreground`,
  // `border`, `black`, `white`, `input`, `sidebar-border`, with or without an alpha). The first
  // version keyed only on `ring-foreground/…` and let `ring-1 ring-border`, `ring-1 ring-black/10`
  // and the floating sidebar's `ring-sidebar-border` through (review round 1, 2026-09-23).
  // Avatar's `ring-2 ring-background` is NOT this — it is the page-coloured gap between stacked
  // avatars in a group, a separator rather than an outline — and neither is a bare focus-ring
  // COLOUR such as `ring-sidebar-ring` (upstream's vestigial ring colour, painted by nothing since
  // FOC-1 removed the width). Both stay legal; the positive specimen in
  // `verify-design-lint-structural.mjs` observes it.
  {
    id: "no-surface-ring",
    re: /(?:^|[\s"'`:])ring-(?:1|px|\[1px\]|(?:foreground|border|black|white|input|sidebar-border)(?:\/[\w.[\]]+)?)(?=[\s"'`]|$)/,
    msg: "surface ring outline (BRD-1): cards and floating surfaces draw `border border-border` (the sidebar `border-sidebar-border`), not a 1px `ring-*` box-shadow outline in any ink",
  },
  // TYP-15 — the ramp owns tracking; a component never restates it.
  //
  // NEGATIVE tracking is an optical correction that scales with size, and the `@theme inline`
  // bridge owns it: per-size `--text-*--letter-spacing` for the heading tier (`text-lg` and up,
  // −0.012em at 18px to −0.06em at 72px), with the COPY tier held at zero, which is Geist's own
  // copy/heading split. A local `tracking-tight` either restates that or contradicts it, and
  // because Tailwind compiles the ramp as `letter-spacing: var(--tw-tracking, <ramp value>)`, the
  // local class SILENTLY WINS — one component quietly stops obeying the global ramp while
  // everything still looks fine.
  //
  // POSITIVE tracking is banned too, and the reason is worth keeping. The first version of this
  // rule allowed `tracking-wide`/`wider` after it flagged twelve uppercase mono eyebrows across
  // the docs shell — a rationalisation of the pattern rather than a judgement about it. Those
  // labels should not have been uppercase at all: `design.md` § Voice & content says sentence case
  // for everything, and TYP-7 resolves as **shadcn**, whose answer to "uppercase is mono-only" is
  // simply "no uppercase". Positive tracking exists to make uppercase legible; delete the
  // uppercase and it has no remaining job. Both went (2026-09-22, MK).
  //
  // `tracking-widest` is the ONE allowance and it is not the same thing: the keyboard-shortcut
  // hint (`⌘K`) in Command, Menubar, DropdownMenu and ContextMenu, where the spacing separates
  // glyph keys rather than compensating for a case transform. It is upstream's own idiom in
  // upstream's own four files.
  {
    id: "raw-tracking",
    re: /\btracking-(?!widest\b)[a-z0-9[\]().-]+/g,
    msg: "raw letter-spacing (TYP-15): the ramp in the @theme bridge owns tracking and a local `tracking-*` silently overrides it through `var(--tw-tracking, …)`. Only `tracking-widest` (the keyboard-shortcut hint idiom) is allowed — positive tracking existed to serve uppercase, and uppercase is gone",
  },
  // No uppercase. `design.md` § Voice & content: sentence case for EVERYTHING — buttons, headings,
  // labels, body, toasts. TYP-7 resolves as **shadcn**, and upstream's column reads "No uppercase";
  // the old `uppercase-mono` rule was deleted because upstream has none, not because the transform
  // became free. Twelve `font-mono text-xs uppercase` eyebrows had survived across the docs shell
  // regardless.
  //
  // Two of them were not a matter of taste at all: the home page rendered real CSS custom-property
  // names through the transform, so `--text-lg` displayed as `--TEXT-LG` — a false identifier on a
  // design-system docs site. That is the strongest argument against the utility. Where a string
  // genuinely IS uppercase, write it uppercase; do not transform it in CSS, where it silently
  // rewrites whatever it is handed.
  {
    id: "uppercase-transform",
    re: /(?:^|[\s:"'])uppercase\b/g,
    msg: "`uppercase` text transform (TYP-7 = shadcn; design.md § Voice & content is sentence case for everything). It also REWRITES its content, which turned token names like `--text-lg` into `--TEXT-LG`. If a string is uppercase, write it that way in the string",
  },
  // TYP-18 — no arbitrary font size.
  //
  // An arbitrary value bypasses the `--text-*` namespace entirely, so it can never receive the
  // ramp's line-height or letter-spacing and it sits on no tier anyone can name. Upstream's three
  // `text-[0.8rem]` sites are now on the ramp (`button`/`toggle` sm at `text-sm`, `calendar`'s
  // dense grid labels at `text-xs`).
  //
  // Matches a LENGTH only, so `text-[var(--x)]`, `text-[#fff]` (the `hex-color` rule's job) and
  // arbitrary colour values are not this rule's business.
  {
    id: "arbitrary-text-size",
    re: /\btext-\[[0-9.]+(?:px|r?em|ch|ex|pt)\]/g,
    msg: "arbitrary font size (TYP-18): an arbitrary value bypasses the --text-* namespace, so it receives neither the ramp's line-height nor its letter-spacing — use a ramp step",
  },
];

/**
 * The `important` rule's class-string half: Tailwind's `!` modifier (`p-0!`, legacy `!p-0`) compiles
 * to `!important` exactly as a hand-written declaration does, so the raw-CSS rule alone left the
 * commonest spelling unchecked. Found 2026-09-23 by the Regent consumer audit.
 *
 * EXPLICIT, COUNTED, fail-closed in both directions — the shape `RAW_INTERACTIVE_EXEMPTIONS` uses.
 * A file not listed here may carry no `!` modifier; a listed file must carry EXACTLY its count, so
 * adding one and removing the last both force a re-read of the rationale. Keyed by the path TAIL
 * starting at `/ui/` or `/blocks/`, so the canonical file and its byte-identical docs copy-in
 * (`apps/docs/components/ui/…`) share one entry and nothing else can borrow it.
 *
 * Every entry but the last two is UPSTREAM VERBATIM — the `!` is in
 * `vendor/shadcn/4.21.0/{ui,blocks}/…` and byte parity holds it there; stripping it would be a patch
 * hunk with no decision ID behind it. It exists where upstream must beat a declaration of equal
 * specificity from a composed part (Command over Dialog and InputGroup, a Sidebar button collapsing
 * to icon size, the Tooltip arrow over its side offset). The two of ours say why on their own line.
 */
const UPSTREAM_IMPORTANT =
  "upstream verbatim (vendor/shadcn/4.21.0) — overrides an equal-specificity declaration of a composed part; byte parity holds it";
const IMPORTANT_MODIFIER_EXEMPTIONS = new Map([
  ["/ui/tooltip.tsx", { count: 4, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/command.tsx", { count: 7, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/sidebar.tsx", { count: 3, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/menubar.tsx", { count: 1, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/badge.tsx", { count: 1, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/button-group.tsx", { count: 2, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/pagination.tsx", { count: 2, rationale: UPSTREAM_IMPORTANT }],
  ["/ui/attachment.tsx", { count: 1, rationale: UPSTREAM_IMPORTANT }],
  [
    "/blocks/chart-bar-interactive/chart-bar-interactive.tsx",
    { count: 2, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/blocks/chart-line-interactive/chart-line-interactive.tsx",
    { count: 1, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/blocks/dashboard-01/components/app-sidebar.tsx",
    { count: 2, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/blocks/dashboard-01/components/chart-area-interactive.tsx",
    { count: 1, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/blocks/sidebar-09/components/app-sidebar.tsx",
    { count: 1, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/blocks/sidebar-16/components/app-sidebar.tsx",
    { count: 1, rationale: UPSTREAM_IMPORTANT },
  ],
  [
    "/ui/data-table-parts.tsx",
    {
      count: 2,
      rationale:
        "ours — `pe-2!` reinstates the trailing padding upstream's TableHead zeroes on a checkbox cell, keeping the 24px select-all target inside its column (A11Y-2, measured by the geometry lane)",
    },
  ],
  [
    "/ui/media-player-controls.tsx",
    {
      count: 1,
      rationale:
        "ours — `*:min-h-0!` releases upstream Slider's vertical `min-h-40` floor inside the volume pill, which it would otherwise overhang; the floor has equal specificity and no decision row to patch it",
    },
  ],
]);

/**
 * The `!`-modifier tokens in one class literal. A token qualifies only if it is shaped like a
 * utility — it carries a `-`, `:` or `[` — so prose that ends in an exclamation mark ("Heads up!")
 * is never read as a class. That shape test is the whole prose filter: a literal that spans lines
 * (a multi-line template class string) is split on every whitespace run like any other, because
 * skipping it returned `[]` and let `p-0!` through on the second line (review round 1, 2026-09-23).
 */
function importantModifierTokens(lit) {
  return lit.split(/\s+/).filter((token) => {
    if (token === "!important" || !/[-:[]/.test(token)) return false;
    // `![…]` is Tailwind's important arbitrary PROPERTY only when the bracket closes inside the
    // token and holds `prop:value`; markdown image syntax (`![Alt text](url)`) is neither.
    if (
      /(?:^|:)!\[/.test(token) &&
      !/(?:^|:)!\[[^\]\s]+:[^\]\s]+\](?!\()/.test(token)
    )
      return false;
    const bare = token.replace(/\[[^\]]*\]/g, "[]");
    return /[\w\])%]!$/.test(bare) || /(?:^|:)!-?[a-z@*[]/.test(bare);
  });
}

// Inline <svg> used as an icon is banned in component source — use a sanctioned lucide icon or the
// `Icon`/`BrandIcon` wrapper. Allowlist files that legitimately draw a NON-icon graphic primitive
// with SVG geometry — those aren't icons. `empty` draws upstream's decorative backdrop.
// Two entries have left this list rather than being carried: the mirrored lucide-animated icons
// (now data modules over one factory with no JSX at all, which `tooling/verify-animated-icons.mjs`
// asserts directly) and `progress-indicator`, whose determinate ring went with the component when
// Batch 7a of the shadcn reset retired it for `progress` + `spinner`. An exemption that can no
// longer be reached is an exemption that should not exist.
const SVG_GRAPHIC_ALLOWLIST = /(?:^|\/)(?:empty)\.tsx$/;

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

  // 0. `<Button size="icon"><Icon /><span className="sr-only">Go to next page</span></Button>` —
  //    the name is on the Button's OWN children. Batch 8 of the shadcn reset (2026-09-18) is why
  //    this clause exists: upstream's blocks spell an icon control exactly this way, and the rule
  //    reported four correctly-named controls in `dashboard-01` as anonymous. It is the same
  //    evidence `nameOn` already accepts from a host, read one element closer — not a widening:
  //    a Button with no name anywhere still fails, which the structural gate observes.
  if (ts.isJsxOpeningElement(button) && nameOn(button)) return true;

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
    "registry/ui/dropzone.tsx",
    {
      counts: { input: 1 },
      rationale:
        "the display:none form/picker bridge behind the role=button drop surface — react-dropzone's prop-getter must attach to a native <input type=file>; no VegaStack control substitutes for it",
    },
  ],
  [
    "registry/ui/data-list.tsx",
    {
      counts: { button: 1 },
      rationale:
        "row activation control preserves table semantics \u2014 the sort header composes Button through the shared table parts",
    },
  ],
  [
    "registry/ui/markdown-view.tsx",
    {
      counts: { input: 1 },
      rationale: "react-markdown non-checkbox input passthrough",
    },
  ],
  // `extras.md` dispositions `onboarding-checklist` as block-only, so `onboarding-01` carries its
  // own copy of these two parts and inherits the same rationale at its own path. The component
  // entry above goes when the component does; this one is the one that survives.
  [
    "registry/blocks/onboarding-01/components/checklist.tsx",
    {
      counts: { button: 2 },
      rationale:
        "the collapsed progress pill and the step rows \u2014 both carry VISIBLE text, so they are text controls, not icon buttons (the icon-only collapse toggle is an icon Button)",
    },
  ],
  [
    "registry/ui/sidebar.tsx",
    {
      counts: { button: 1 },
      rationale:
        "`SidebarRail`, the collapse strip along the rail's edge — upstream's own raw <button>, and the one control here no VegaStack component substitutes for: it is a 16px full-height hit strip with no label, no icon and no text, `tabIndex={-1}` by design, and a Button at any size would paint a box where the design wants an invisible seam. Batch 5 of the shadcn reset put this file on upstream's source, which dropped the count from 2 to 1: `SidebarMenuButton`'s fallback is now `useRender`'s, not a literal <button>, and `SidebarTrigger` composes Button.",
    },
  ],
  [
    "registry/ui/tag-group.tsx",
    {
      counts: { button: 1 },
      rationale:
        "the overflow disclosure control — a Chip rendered as a button, because a chip's root is a span and no VegaStack control is a pill-shaped text button (tag removal became Chip's icon Button in T2)",
    },
  ],
  [
    "registry/ui/native-select.tsx",
    {
      counts: { select: 1 },
      rationale:
        "NativeSelect IS the tokenized native <select> adapter — the platform picker is the whole point of the component, and no VegaStack control substitutes for it (Select is the rendered alternative, on its own page)",
    },
  ],
  [
    "registry/ui/textarea.tsx",
    {
      counts: { textarea: 1 },
      rationale: "Textarea is the tokenized native textarea adapter",
    },
  ],
  // Batch 8 of the shadcn reset (2026-09-18) — upstream's two interactive chart blocks. The
  // control is a full-bleed CARD-HEADER CELL: a border-divided column that fills the header, two
  // stacked text lines inside it (a muted series label over a 30px figure), selected by
  // `data-[active=true]:bg-muted/50`. No VegaStack control substitutes for it — a Button at any
  // size paints its own box, height and horizontal padding where the design wants a seamless
  // header segment, and `ToggleGroup` would impose the pill track the header explicitly is not.
  // Both carry visible text, so they are named text controls, not icon buttons.
  [
    "registry/blocks/chart-bar-interactive/chart-bar-interactive.tsx",
    {
      counts: { button: 1 },
      rationale:
        "upstream's segmented card-header stat cell — a bordered header column with a label and a figure, not a control surface a Button can wear",
    },
  ],
  [
    "registry/blocks/chart-line-interactive/chart-line-interactive.tsx",
    {
      counts: { button: 1 },
      rationale:
        "upstream's segmented card-header stat cell — a bordered header column with a label and a figure, not a control surface a Button can wear",
    },
  ],
]);

const RAW_INTERACTIVE_TAGS = new Set(["button", "input", "select", "textarea"]);

// §7.6 Base UI render contract — a wrapper over a SINGLE Base UI root MUST keep Base UI's
// polymorphic `render` prop in its public API.
// `Omit<..., 'render'>` (or `'value' | 'render'`, etc.) silently removes it, regressing the
// contract. Flag any `Omit<...>` that strips `'render'` in registry component source.
//
// There is NO exemption list any more. `split-button.tsx` was the single entry — a multi-element
// composite with no polymorphic root — and Batch 7a of the shadcn reset retired it in favour of
// upstream's `button-group` example. An exemption that can no longer be reached is an exemption
// that should not exist (the call Batch 5 made on the geometry lane's `resizableNested`, and
// Batch 6 on `/attachment.tsx`'s raw-interactive count). A composite that genuinely owns no single
// root has no `render` prop to begin with, which is not the same thing as stripping one.

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
// 2026-09-09: switch.tsx ×2, the retired OTP field, number-field.tsx). So it has to be seen
// STRUCTURALLY, at the seam, which is a `BinaryExpression` and not a literal.
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
    const importantModifiers = [];
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

      // (g) Tailwind's `!` modifier — the class-string half of the `important` rule. Counted per
      // file against IMPORTANT_MODIFIER_EXEMPTIONS after the loop.
      for (const token of importantModifierTokens(lit)) {
        importantModifiers.push({ line, token });
      }

      // The `hover-without-pressed` rule is GONE (INT-4 = shadcn). It failed any class string
      // that changed the fill on hover without a pressed rung beside it. Upstream's own controls
      // almost never carry one — the default button is `hover:bg-primary/80` and nothing else — so
      // the rule now rejects upstream's files by construction.
    }

    {
      const exemption = [...IMPORTANT_MODIFIER_EXEMPTIONS].find(([tail]) =>
        file.replaceAll("\\", "/").endsWith(tail),
      );
      if (!exemption) {
        for (const { line, token } of importantModifiers) {
          console.log(
            `${file}:${line} [important] Tailwind \`!\` modifier "${token}" compiles to !important — ` +
              "fix the specificity instead (a data-slot the child owns, or the composed part's own prop); " +
              "only the counted upstream-verbatim cases in IMPORTANT_MODIFIER_EXEMPTIONS are allowed",
          );
          violations++;
        }
      } else if (importantModifiers.length !== exemption[1].count) {
        console.log(
          `${file} [important] reviewed Tailwind \`!\` modifier count changed from ${exemption[1].count} to ` +
            `${importantModifiers.length} (${exemption[1].rationale}); re-audit, then update IMPORTANT_MODIFIER_EXEMPTIONS` +
            (importantModifiers.length
              ? `\n    ${importantModifiers.map((m) => `${m.line}:${m.token}`).join("  ")}`
              : ""),
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

    for (const line of renderOmitLines(file, src)) {
      console.log(
        `${file}:${line} [render-contract] Omit<…, 'render'> removes Base UI's polymorphic render prop (§7.6). Expose render on single-root wrappers; a multi-element composite that owns no single root simply has no render prop to strip — see docs/ledger/component-matrix.md.`,
      );
      violations++;
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
      // ── loader-mark (ICO-8) ───────────────────────────────────────────────────────────────────
      //
      // ONE indeterminate loading shape across the system: lucide `Loader`, the radiating-dash
      // glyph. `Loader2`, `LoaderCircle` and their `*Icon` aliases are the SAME upstream mark under
      // four names — `Loader2Icon` is literally re-exported from `LoaderCircle` — which is why this
      // reads the imported name rather than the local binding, and why an aliased
      // `import { LoaderCircle as Spin }` is caught too.
      //
      // Byte parity already holds `spinner` and `toast` to the ICO-8 hunks in their
      // patches (`sonner` carried one too, until it was retired on 2026-09-22, OVL-10): a re-pull that restored `Loader2Icon` there would fail `upstream:check` because
      // the patch would stop applying. What parity CANNOT see is a NEW component — one of ours,
      // with no upstream counterpart and so no patch — reaching for `LoaderCircleIcon` because
      // that is what upstream writes everywhere. This is that gate, and it is the same shape as
      // `no-focus-ring-glow`: the rule that keeps an upstream habit from creeping back in one file
      // at a time.
      //
      // Scoped to canonical registry source, which excludes `registry/ui/icons/` — the 467
      // animated mirrors are a lucide CATALOGUE, and `icons/loader-circle.tsx` is the mirror of
      // that catalogue entry, not a loading affordance. It imports nothing from `lucide-react`, so
      // the provenance check would skip it regardless; the scope makes the intent explicit. The
      // docs' own `spinnerCustomization` preview mounts `LoaderCircleIcon` deliberately, to show
      // what swapping the mark looks like, and previews are not registry source.
      // TYP-10 — tabular figures on data.
      //
      // TYP-10 has been **ours** since the reset ("Geist Sans and Geist Mono; tabular figures on
      // code and data") and had NO gate at all: `number-field` formatted through
      // `Intl.NumberFormat` and shipped with proportional digits, so holding its stepper made the
      // value visibly jitter as digit widths changed. A locked decision nothing observes is
      // indistinguishable from one that cannot fail.
      //
      // THE SIGNAL IS DELIBERATELY NARROW. `Intl.NumberFormat` and `.toFixed(` format a NUMBER and
      // nothing else. `.toLocaleString(` is excluded on purpose: `calendar` calls it with
      // `{ month: "short" }` to produce a month NAME, so including it would have made the rule
      // fire on a string — the kind of false positive that gets a gate switched off. Components
      // that render digits through a fixed-width box (`pagination`'s `size="icon"` links) or that
      // render no figure text at all (`slider`, which renders thumbs; `kbd`, which renders key
      // glyphs) are not in scope, because there is no jitter to prevent.
      //
      // Per-column opt-in satisfies this: `data-grid` inherits `tabular-nums` from
      // `columnCellClass` when a column declares `mono`, which is correct — not every column
      // holds figures.
      if (canonicalRegistryFile && /Intl\.NumberFormat|\.toFixed\(/.test(src)) {
        if (!/\btabular-nums\b/.test(src)) {
          const line =
            src
              .split("\n")
              .findIndex((l) => /Intl\.NumberFormat|\.toFixed\(/.test(l)) + 1;
          console.log(
            `${file}:${line} [tabular-figures] formats a number (Intl.NumberFormat / toFixed) but nothing in this file carries \`tabular-nums\` (TYP-10): proportional digits change width as the value changes, so the figure jitters on every step, keystroke and reformat`,
          );
          violations++;
        }
      }

      if (canonicalRegistryFile) {
        const BANNED_LOADER = /^(?:Loader2|LoaderCircle)(?:Icon)?$/;
        for (const statement of sf.statements) {
          if (!ts.isImportDeclaration(statement)) continue;
          if (statement.moduleSpecifier.text !== "lucide-react") continue;
          const bindings = statement.importClause?.namedBindings;
          if (!bindings || !ts.isNamedImports(bindings)) continue;
          for (const element of bindings.elements) {
            const imported = element.propertyName?.text ?? element.name.text;
            if (!BANNED_LOADER.test(imported)) continue;
            const line =
              sf.getLineAndCharacterOfPosition(element.getStart(sf)).line + 1;
            console.log(
              `${file}:${line} [loader-mark] '${imported}' is lucide's loader-circle under one of its four names (ICO-8): the one indeterminate loading mark is \`LoaderIcon\` — compose the Spinner registry item where a loading affordance is what you mean`,
            );
            violations++;
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
                  `${file}:${line + 1} [icon-button-name] <Button size=${sizeText}> without aria-label/aria-labelledby — icon-only controls need an accessible name (or a host that names it: \`render={<Button size="icon" />}\` on an element carrying aria-label or an sr-only label)`,
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
        // Keyed by the file's REPO PATH tail, not its basename. Batch 8 of the shadcn reset
        // (2026-09-18) is why: `/date-picker.tsx` also matched
        // `registry/blocks/sidebar-12/components/date-picker.tsx`, so an upstream block inherited a
        // component's exemption — a rationale silently lent to a file nobody had reviewed, and the
        // "reviewed count changed" arm then fired on a file that had no raw control at all.
        const exemption = [...RAW_INTERACTIVE_EXEMPTIONS].find(([path]) =>
          file.endsWith(path),
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
