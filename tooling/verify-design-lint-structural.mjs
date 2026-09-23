#!/usr/bin/env node
// Executable regression specimens for design-lint. The invalid specimens must fail with every rule
// ID the rebuilt lint still owns; the positive specimen exercises the rationale-counted native
// control exemption and every deliberate NON-violation, without depending on production source.
//
// REBUILT BY THE SHADCN RESET (Batch 1, 2026-09-18). Fourteen rules were deleted because their
// decision row resolves to **shadcn** — `restated-focus`, `viewport-magic`, `hover-without-pressed`,
// `fill-token-as-text`, `standard-control-cursor`, `transition-pairing`, `raw-motion`,
// `uppercase-mono`, `arbitrary-value`, `inline-style`, `raw-effect`, `raw-alpha`/`raw-opacity` and
// the radius/size/z/type bans — and their specimens went with them. One rule was ADDED,
// `no-focus-ring-glow`, and it gets the specimen those deletions freed up.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { ROOT } from "./lib/fs.mjs";

const scratch = mkdtempSync(join(tmpdir(), "vegastack-design-lint-"));
// Each specimen group gets its OWN tree, with the group name ABOVE `packages/` rather than below
// `registry/ui/`. Batch 8 of the shadcn reset (2026-09-18) is why: the native-control exemptions
// are now keyed by the file's repo path (`registry/ui/textarea.tsx`) instead of its basename, so
// that a block's `components/date-picker.tsx` can no longer inherit the component's rationale —
// and a specimen written to `registry/ui/valid/textarea.tsx` would no longer be the file the
// exemption names. Lifting the group name keeps every specimen at the path it is pretending to be.
const groupDir = (name) => join(scratch, name, "packages/ui/registry/ui");
const invalidDir = groupDir("invalid");
const vocabularyDir = groupDir("vocabulary");
const glowDir = groupDir("glow");
const classGlueDir = groupDir("class-glue");
const iconNameDir = groupDir("icon-name");
const loaderMarkDir = groupDir("loader-mark");
const importantDir = groupDir("important");
const surfaceRingDir = groupDir("surface-ring");
const validDir = groupDir("valid");
for (const dir of [
  invalidDir,
  vocabularyDir,
  glowDir,
  classGlueDir,
  iconNameDir,
  loaderMarkDir,
  importantDir,
  surfaceRingDir,
  validDir,
]) {
  mkdirSync(dir, { recursive: true });
}

const run = (dir) => {
  const result = spawnSync(process.execPath, ["tooling/design-lint.mjs", dir], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
};

const fail = (message, output) => {
  console.error(`✗ ${message}`);
  console.error(output.trim());
  process.exit(1);
};

try {
  writeFileSync(
    join(invalidDir, "invalid.tsx"),
    `'use client';
import React from 'react';
import type { ComponentProps } from 'react';

export const Legacy = React.forwardRef<HTMLButtonElement>((props, ref) => (
  <button ref={ref} {...props}>Bad</button>
));

export function RawSelect() {
  return <><input aria-label="Bad input" /><select aria-label="Bad select"><option>Bad</option></select></>;
}

type RenderlessProps = Omit<
  ComponentProps<'button'>,
  'render'
>;

// A ref fanned out by hand. Deliberately hook-free: adding a hook here would EARN the client
// boundary and silently retire the presentational-client-boundary specimen in the same file.
export function HandRolledRefMerge({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const setRefs = (element: HTMLDivElement | null) => {
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
  };
  return <div ref={setRefs} />;
}

export function LiteralRules(_props: RenderlessProps) {
  return <>
    <div className="flex truncate">Truncation</div>
    <div className="bg-[#ff0000] text-red-500">Off-system colour</div>
    <div className="text-4xl tracking-tight">TYP-15: the ramp owns heading tracking; a local utility silently wins through var(--tw-tracking)</div>
    <div className="text-[13px]">TYP-18: an arbitrary size receives neither half of the ramp</div>
    <div className="uppercase">TYP-7: no uppercase transform; it also rewrites token names</div>
    <svg viewBox="0 0 16 16"><path d="M0 0" /></svg>
  </>;
}
`,
  );

  // ── the literal-scoped vocabulary rules ─────────────────────────────────────────────────────
  // One specimen, one violation per rule, so a missing rule ID names itself.
  writeFileSync(
    join(vocabularyDir, "vocabulary.tsx"),
    `export function Vocabulary() {
  return <>
    <div className="rounded-md motion-reduce:transition-none">Restated reduced motion</div>
    <div className="flex  items-center ">Whitespace</div>
    <div className="${Array.from({ length: 11 }, (_, i) => `[&_p${i}]:hidden [&_[data-slot=part-${i}]]:hidden`).join(" ")}">Reaching in</div>
    <div>{new Intl.NumberFormat("en-US").format(1234)}</div>
  </>;
}
`,
  );

  const vocabulary = run(vocabularyDir);
  const vocabularyIds = [
    "restated-motion-reduce",
    "class-whitespace",
    "descendant-override-density",
    // TYP-10 (MK 2026-09-22). The decision has been **ours** since the reset and had no gate at
    // all for four days, which is how `number-field` shipped an `Intl.NumberFormat` value with
    // proportional digits that visibly jittered on every stepper press. Its trigger is a numeric
    // FORMATTER rather than a class, so it specimen-tests here rather than with the class rules.
    "tabular-figures",
  ];
  const missingVocabulary = vocabularyIds.filter(
    (id) => !vocabulary.output.includes(`[${id}]`),
  );
  if (vocabulary.status === 0 || missingVocabulary.length > 0) {
    if (missingVocabulary.length > 0) {
      console.error(`  missing rule IDs: ${missingVocabulary.join(", ")}`);
    }
    fail(
      "design-lint token-vocabulary specimen did not fail closed",
      vocabulary.output,
    );
  }

  // ── no-focus-ring-glow (FOC-1 / FOC-6) ──────────────────────────────────────────────────────
  // THE rule this reset adds, and the one most likely to be silently defeated: every future batch
  // starts by copying an upstream file that carries the glow verbatim, so a rule that stopped
  // firing would let the halo back in with no diff anywhere saying so. Each of the five forms
  // shadcn actually ships is a separate specimen line.
  writeFileSync(
    join(glowDir, "glow.tsx"),
    `export function Glow() {
  return <>
    <div className="focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">upstream button</div>
    <div className="focus-visible:ring-[3px]">the bracketed spelling</div>
    <div className="ring-ring/40">the glow colour on its own</div>
    <div className="focus-visible:ring-destructive/20">an invalid-state glow</div>
    <div className="focus-visible:shadow-[0_0_0_3px_var(--ring)]">a box-shadow ring</div>
  </>;
}
`,
  );
  const glow = run(glowDir);
  const glowLines = glow.output
    .split("\n")
    .filter((line) => line.includes("[no-focus-ring-glow]")).length;
  if (glow.status === 0 || glowLines < 5) {
    console.error(`  observed ${glowLines} of 5 glow forms rejected`);
    fail(
      "design-lint accepted a focus-ring glow — FOC-1/FOC-6 give this system ONE focus " +
        "affordance, the global :focus-visible outline in base.css",
      glow.output,
    );
  }

  // …and the other half of that rule: a RESTING 1px hairline drawn as a box-shadow is a border
  // technique, not an affordance, and must pass. Upstream's `SidebarMenuButton` outline variant is
  // exactly this (`shadow-[0_0_0_1px_var(--sidebar-border)]`), and before Batch 5 narrowed the
  // rule to focus variants it was rejected. A rule that fires on both is a rule nobody can keep.
  writeFileSync(
    join(glowDir, "glow.tsx"),
    `export function Hairline() {
  return (
    <div className="bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]">
      upstream's resting hairline
    </div>
  );
}
`,
  );
  const hairline = run(glowDir);
  if (hairline.output.includes("[no-focus-ring-glow]")) {
    fail(
      "design-lint rejected a RESTING box-shadow hairline — FOC-1/FOC-6 decide the focus " +
        "affordance, not every 0 0 0 shadow; upstream draws borders this way",
      hairline.output,
    );
  }

  // ── important: Tailwind's `!` modifier (2026-09-23) ───────────────────────────────────────
  // The raw-CSS half of this rule only ever saw the literal text `!important`, so the spelling
  // component source actually uses — `p-0!`, or the legacy prefix `!p-0` — compiled to
  // `!important` with no gate noticing. All three shapes are specimen lines: the suffix, the prefix
  // behind a variant, and a suffix after an arbitrary-selector variant.
  writeFileSync(
    join(importantDir, "important.tsx"),
    `export function Important() {
  return <>
    <div className="flex p-0!">suffix</div>
    <div className="hover:!mt-2">prefix behind a variant</div>
    <div className="[&>svg]:size-3!">after an arbitrary variant</div>
    <div className="![color:red]">an important arbitrary property</div>
  </>;
}

// Markdown image syntax is prose, not a class: \`![Alt text](url)\` must never be read as
// Tailwind's \`![prop:value]\` (review round 2, 2026-09-23 — the markdown-view preview tripped it).
export const markdown = \`![A calm abstract mesh](https://example.com/mesh.png)\`;

// A class string that spans lines is still a class string: the old tokenizer returned nothing for
// any literal containing a newline, so this p-0! on the second line was never seen.
export const multiline = \`flex items-center
  p-0! gap-2\`;
`,
  );
  // …and the fail-closed count on a listed file: `/ui/badge.tsx` is allowed exactly ONE (upstream's
  // `[&>svg]:size-3!`), so a second one must fail even though the file is on the list.
  writeFileSync(
    join(importantDir, "badge.tsx"),
    `export const badge = "inline-flex [&>svg]:size-3! h-5!";
`,
  );
  const important = run(importantDir);
  const importantLines = important.output
    .split("\n")
    .filter((line) => /important\.tsx:\d+ \[important\]/.test(line)).length;
  if (
    important.status === 0 ||
    importantLines !== 5 ||
    !/badge\.tsx \[important\] reviewed Tailwind `!` modifier count changed from 1 to 2/.test(
      important.output,
    )
  ) {
    console.error(
      `  observed ${importantLines} of 5 \`!\` modifier specimens rejected (4 forms + the multi-line literal; markdown must pass)`,
    );
    fail(
      "design-lint accepted a Tailwind `!` modifier outside IMPORTANT_MODIFIER_EXEMPTIONS, or " +
        "an exempt file whose reviewed count changed",
      important.output,
    );
  }

  // ── no-surface-ring (BRD-1, ours since MK 2026-09-23) ───────────────────────────────────────
  // Surfaces draw `border border-border`. Upstream's `ring-1 ring-foreground/10` outline arrives
  // verbatim with every pull of card, dialog, popover, select and the menus, so this rule is the
  // only thing that notices it coming back. Every ink an outline has been written in (the
  // foreground at an alpha and without one, the border token, a raw black/white hairline, the
  // sidebar's own border), a bare 1px width — including bare `ring`, which is 1px in Tailwind v4 —
  // the `inset-ring` twin of each, and a variant-scoped spelling of each half.
  writeFileSync(
    join(surfaceRingDir, "surface-ring.tsx"),
    `export function Surfaces() {
  return <>
    <div className="rounded-xl bg-card ring-1 ring-foreground/10">upstream card</div>
    <div className="bg-popover ring-1 dark:ring-foreground/20">a variant-scoped outline</div>
    <div className="rounded-lg ring-1 ring-border">the border token as a ring</div>
    <div className="rounded-lg ring-1 ring-black/10">a raw hairline</div>
    <div className="rounded-lg ring-2 ring-foreground">the foreground with no alpha</div>
    <div className="group-data-[variant=floating]:ring-sidebar-border">the floating sidebar's edge</div>
    <div className="rounded-lg ring-[1px]">a bare 1px width</div>
    <div className="rounded-lg ring ring-muted">bare \`ring\`, which is 1px in Tailwind v4</div>
    <div className="rounded-lg ring ring-primary/20">bare \`ring\` in a brand ink</div>
    <div className="rounded-lg inset-ring inset-ring-border">an inset hairline</div>
    <div className="rounded-lg data-[open]:inset-ring-1 dark:inset-ring-foreground/10">a variant-scoped inset outline</div>
  </>;
}
`,
  );
  const surfaceRing = run(surfaceRingDir);
  const surfaceRingLines = surfaceRing.output
    .split("\n")
    .filter((line) => line.includes("[no-surface-ring]")).length;
  if (surfaceRing.status === 0 || surfaceRingLines < 11) {
    console.error(
      `  observed ${surfaceRingLines} of 11 surface-ring forms rejected`,
    );
    fail(
      "design-lint accepted a ring surface outline — BRD-1 gives surfaces a real " +
        "`border border-border`",
      surfaceRing.output,
    );
  }

  // ── loader-mark (ICO-8) ─────────────────────────────────────────────────────────────────────
  // The same failure mode as the glow: every future batch starts from an upstream file, and
  // upstream writes `Loader2Icon` for a spinner in three different components. `Loader2`,
  // `Loader2Icon`, `LoaderCircle` and `LoaderCircleIcon` are FOUR NAMES for one glyph — lucide
  // re-exports the first two straight off `LoaderCircle` — so all four are specimen lines, plus an
  // aliased import, which is the spelling a regex over the local binding would miss.
  writeFileSync(
    join(loaderMarkDir, "loader-mark.tsx"),
    `import { Loader2, Loader2Icon, LoaderCircle, LoaderCircleIcon, LoaderCircle as Spin } from 'lucide-react';

export function Marks() {
  return <>
    <Loader2 className="animate-spin" />
    <Loader2Icon className="animate-spin" />
    <LoaderCircle className="animate-spin" />
    <LoaderCircleIcon className="animate-spin" />
    <Spin className="animate-spin" />
  </>;
}
`,
  );
  const loaderMark = run(loaderMarkDir);
  const loaderMarkLines = loaderMark.output
    .split("\n")
    .filter((line) => line.includes("[loader-mark]")).length;
  if (loaderMark.status === 0 || loaderMarkLines < 5) {
    console.error(
      `  observed ${loaderMarkLines} of 5 loader-circle spellings rejected`,
    );
    fail(
      "design-lint accepted lucide's loader-circle in registry source — ICO-8 gives this system " +
        "ONE indeterminate loading mark, lucide `Loader`",
      loaderMark.output,
    );
  }

  // …and the other half: `LoaderIcon` IS the sanctioned mark, and a name that merely CONTAINS one
  // of the banned ones is not one of them. A rule that fired on either would be unusable, and the
  // animated-icon mirror `icons/loader-circle.tsx` exports a `LoaderCircleIcon` of its own — from
  // a catalogue, importing nothing from lucide — which is why this rule reads import provenance
  // rather than identifiers.
  writeFileSync(
    join(loaderMarkDir, "loader-mark.tsx"),
    `import { LoaderIcon, LoaderPinwheelIcon } from 'lucide-react';
import { LoaderCircleIcon } from '@/components/ui/icons/loader-circle';

export function Sanctioned() {
  return <>
    <LoaderIcon className="animate-spin" />
    <LoaderPinwheelIcon />
    <LoaderCircleIcon />
  </>;
}
`,
  );
  const loaderOk = run(loaderMarkDir);
  if (loaderOk.output.includes("[loader-mark]")) {
    fail(
      "design-lint rejected the SANCTIONED loader mark — ICO-8 bans loader-circle, not every " +
        "identifier with 'Loader' in it, and the animated-icon catalogue is not a loading affordance",
      loaderOk.output,
    );
  }

  // ── class-glue ──────────────────────────────────────────────────────────────────────────────
  // Two adjacent class literals joined by `+` with no separating space. The seam is invisible to
  // every literal-scoped rule, and it destroys the utility on BOTH sides — the exact shape of the
  // four live defects found on `main` (switch ×2, the retired OTP field, number-field), which is
  // why this rule reads the AST rather than the literal.
  writeFileSync(
    join(classGlueDir, "class-glue.tsx"),
    `const glued =
  "block rounded-full transition-transform duration-150" +
  "data-checked:translate-x-4";

export function Glue() {
  return <div className={glued}>Glued</div>;
}
`,
  );
  const classGlue = run(classGlueDir);
  if (
    classGlue.status === 0 ||
    !classGlue.output.includes("[class-glue]") ||
    !classGlue.output.includes("duration-150data-checked:translate-x-4")
  ) {
    fail(
      "design-lint accepted two class literals concatenated with no separating space — " +
        "the seam destroys the utility on BOTH sides and no literal-scoped rule can see it",
      classGlue.output,
    );
  }

  // ── icon-button-name, and the host escape hatch the reset added ─────────────────────────────
  // Both halves, because this rule was NARROWED in Batch 4 (2026-09-18) and a narrowing nobody
  // watches is a rule quietly switched off. Upstream names the HOST, not the Button: an icon
  // Button in a `render` prop is named when the element rendering it carries `aria-label` or an
  // `sr-only` label. An anonymous host must still fail.
  writeFileSync(
    join(iconNameDir, "icon-name.tsx"),
    `import { Button } from '@/components/ui/button';

export function Anonymous() {
  return <Anything render={<Button size="icon-sm" />} />;
}
`,
  );
  const iconName = run(iconNameDir);
  if (
    iconName.status === 0 ||
    !iconName.output.includes("[icon-button-name]")
  ) {
    fail(
      "design-lint accepted an icon-only Button whose host names it neither with aria-label " +
        "nor with an sr-only label",
      iconName.output,
    );
  }

  // The POSITIVE half of the same rule, added in Batch 8 (2026-09-18). Upstream's blocks put the
  // name on the Button's OWN children — `<Button size="icon"><Icon /><span className="sr-only">Go
  // to next page</span></Button>` — and the rule read only the Button's attributes and its render
  // host, so it reported four correctly-named `dashboard-01` controls as anonymous. A false
  // positive teaches an author to reach for the exemption list, so this fixture pins the accepted
  // spelling; the anonymous case above still fails, which is what keeps the pair honest.
  writeFileSync(
    join(iconNameDir, "icon-name.tsx"),
    `import { Button } from '@/components/ui/button';

export function NamedByItsOwnChildren() {
  return (
    <Button size="icon">
      <Glyph />
      <span className="sr-only">Go to next page</span>
    </Button>
  );
}
`,
  );
  const iconNameOwn = run(iconNameDir);
  if (iconNameOwn.output.includes("[icon-button-name]")) {
    fail(
      "design-lint reported an icon-only Button that carries its own sr-only label as unnamed",
      iconNameOwn.output,
    );
  }

  // ── the structural rules ────────────────────────────────────────────────────────────────────
  const invalid = run(invalidDir);
  const requiredIds = [
    "forward-ref",
    "raw-interactive-html",
    "presentational-client-boundary",
    "flex-truncate-conflict",
    "render-contract",
    "hand-rolled-ref-merge",
    "inline-svg-icon",
    "hex-color",
    "raw-palette",
    // TYP-15 / TYP-18 (MK 2026-09-22). Both rules exist to stop a component opting out of the
    // global type ramp one utility at a time, and both are exactly the shape that rots silently:
    // the ramp keeps working, so nothing LOOKS broken while a file quietly stops obeying it.
    // `tabular-figures` is not listed here — its trigger is a numeric FORMATTER rather than a
    // class, so it is specimen-tested in the token-vocabulary group instead.
    "raw-tracking",
    "arbitrary-text-size",
    "uppercase-transform",
  ];
  const missing = requiredIds.filter(
    (id) => !invalid.output.includes(`[${id}]`),
  );
  const missingControlTags = ["input=1", "select=1"].filter(
    (detail) => !invalid.output.includes(detail),
  );
  if (
    invalid.status === 0 ||
    missing.length > 0 ||
    missingControlTags.length > 0
  ) {
    if (missing.length > 0)
      console.error(`  missing rule IDs: ${missing.join(", ")}`);
    if (missingControlTags.length > 0) {
      console.error(
        `  missing native-control evidence: ${missingControlTags.join(", ")}`,
      );
    }
    fail(
      "design-lint structural negative specimen did not fail closed",
      invalid.output,
    );
  }

  // ── the positive specimen ───────────────────────────────────────────────────────────────────
  // Every line below is a DELIBERATE non-violation. They are specimens, not decoration: without
  // them a later tightening would start rejecting a real upstream pattern and nothing would say so.
  writeFileSync(
    join(validDir, "textarea.tsx"),
    `import type { ComponentProps } from 'react';

export function Textarea(props: ComponentProps<'textarea'>) {
  return <><textarea {...props} />
    <div className="transition-all duration-100 ease-in-out" />{/* upstream's own motion vocabulary (MOT-2/MOT-3 = shadcn) */}
    <div className="rounded-xl shadow-md bg-muted/50 opacity-50" />{/* radius, shadow, raw alpha and raw opacity are upstream's (BRD-3/BRD-4/BRD-6, COL-20's ladder half) */}
    <div className="h-[18.4px] rounded-[4px] p-[3px]" />{/* upstream's own arbitrary values (DOC-10 = shadcn) — but NOT an arbitrary FONT SIZE, which TYP-18 rejects: it bypasses the --text-* namespace and so receives neither half of the ramp */}
    <div className="rounded-[min(var(--radius-md),10px)]" />{/* upstream's size-tier radius clamp */}
    <div className="bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />{/* upstream's modal scrim (OVL-3 = shadcn) */}
    <div className="[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-dot[stroke='#fff']]:stroke-transparent" />{/* a hex in an ATTRIBUTE-SELECTOR VALUE targets recharts' own default so a token can replace it — COL-20 enforced, not broken (Batch 6) */}
    <div className="text-4xl font-semibold" />{/* an upstream size step and a heavy weight are still upstream's (TYP-4/TYP-8 = shadcn). text-4xl now carries the ramp's own leading and -0.05em tracking, which is exactly why a LOCAL tracking utility beside it is rejected (TYP-15) */}
    <div className="tracking-widest" />{/* the ONE sanctioned tracking: the keyboard-shortcut hint idiom, a role the ramp does not cover */}
    <div className="z-50 cursor-default" />{/* upstream's z band and its menu-item cursor (OVL-2/INT-10) */}
    <div className="bg-card hover:bg-muted" />{/* a hover with no pressed rung is upstream's norm (INT-4 = shadcn) */}
    <div className="outline-2 outline-offset-1 outline-ring focus:border-ring" />{/* the KEPT focus affordance: an outline and a text-entry border tint, never a ring */}
    <div className="translate-x-1 motion-reduce:transform-none" />{/* suppresses the END STATE, which base.css does not */}
    <div className={["flex items-center", "gap-2 rounded-md"].join(" ")} />{/* the canonical multi-fragment join — cannot express the class-glue bug */}
    <div title={"a sentence split across two source lines " + "is prose, not a class seam"} />{/* no class context on either side */}
    <p>{"a multi-line literal mentioning max-h-40\\n\\nkeeps its blank lines: it is prose, not a class string"}</p>
    <div className="size-8 rounded-full ring-2 ring-background" />{/* avatar's stacking gap in a group — a separator in the page colour, not a surface outline (BRD-1) */}
    <div className="rounded-xl border border-border bg-card" />{/* the BRD-1 surface edge */}
    <Swatches tokens={["border", "input", "ring"]} title="Add a ring" />{/* \`ring\` as a token NAME and as a word, not a class string (BRD-1) */}
    <div className="rounded-md ring-sidebar-ring ring-0" />{/* upstream's vestigial focus-ring COLOUR with no width, and a zeroed ring: neither draws an outline */}
    <p>{"Heads up! Saved."}</p>{/* prose ending in an exclamation mark is not a Tailwind \`!\` modifier */}
    <Close aria-label="Close toast" render={<Button size="icon-sm" />} />{/* the host names it with aria-label */}
    <Close render={<Button size="icon-sm" />}><XIcon /><span className="sr-only">Close</span></Close>{/* the host names it with an sr-only label */}
  </>;
}

// The 'render' DEFAULT spelling: the Button never sees the name, the host forwards the binding on.
export function ToastClose({ render = <Button size="icon-sm" /> }: { render?: unknown }) {
  return <Close aria-label="Close toast" render={render} />;
}
`,
  );
  const valid = run(validDir);
  if (valid.status !== 0) {
    fail("design-lint structural positive specimen failed", valid.output);
  }

  console.log(
    `✓ design-lint structural specimens: ${requiredIds.length} structural + ${vocabularyIds.length} ` +
      `token-vocabulary rules fail closed, all 5 focus-ring-glow forms and all 5 loader-circle ` +
      `spellings are rejected while \`LoaderIcon\` and the animated-icon catalogue pass, a class seam ` +
      `with no separating space is rejected, all 4 Tailwind \`!\` modifier forms and a changed ` +
      `exempt count are rejected, all 11 surface-ring spellings are rejected, an icon-only Button ` +
      `with an anonymous host is rejected while one carrying its own sr-only label is accepted; ` +
      `the reviewed Textarea adapter passes, and with it 21 deliberate non-violations ` +
      `covering upstream's motion, radius, shadow, alpha, arbitrary value, type, z-index and ` +
      `hover vocabulary, avatar's ring-2 gap, a border surface and prose ending in "!", plus all ` +
      `three spellings of naming an icon Button through its host`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
