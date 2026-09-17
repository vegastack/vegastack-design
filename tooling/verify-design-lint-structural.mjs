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
const invalidDir = join(scratch, "packages/ui/registry/ui/invalid");
const vocabularyDir = join(scratch, "packages/ui/registry/ui/vocabulary");
const glowDir = join(scratch, "packages/ui/registry/ui/glow");
const classGlueDir = join(scratch, "packages/ui/registry/ui/class-glue");
const validDir = join(scratch, "packages/ui/registry/ui/valid");
for (const dir of [
  invalidDir,
  vocabularyDir,
  glowDir,
  classGlueDir,
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
  </>;
}
`,
  );

  const vocabulary = run(vocabularyDir);
  const vocabularyIds = [
    "restated-motion-reduce",
    "class-whitespace",
    "descendant-override-density",
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
    <div className="shadow-[0_0_0_3px_var(--ring)]">a box-shadow ring</div>
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

  // ── class-glue ──────────────────────────────────────────────────────────────────────────────
  // Two adjacent class literals joined by `+` with no separating space. The seam is invisible to
  // every literal-scoped rule, and it destroys the utility on BOTH sides — the exact shape of the
  // four live defects found on `main` (switch ×2, otp-input, number-field), which is why this rule
  // reads the AST rather than the literal.
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
    <div className="h-[18.4px] rounded-[4px] p-[3px] text-[0.8rem]" />{/* upstream's own arbitrary values (DOC-10 = shadcn) */}
    <div className="rounded-[min(var(--radius-md),10px)]" />{/* upstream's size-tier radius clamp */}
    <div className="bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />{/* upstream's modal scrim (OVL-3 = shadcn) */}
    <div className="text-4xl font-semibold tracking-tight" />{/* off-scale size, heavy weight and raw tracking are upstream's (TYP-4/TYP-6/TYP-8) */}
    <div className="z-50 cursor-default" />{/* upstream's z band and its menu-item cursor (OVL-2/INT-10) */}
    <div className="bg-card hover:bg-muted" />{/* a hover with no pressed rung is upstream's norm (INT-4 = shadcn) */}
    <div className="outline-2 outline-offset-1 outline-ring focus:border-ring" />{/* the KEPT focus affordance: an outline and a text-entry border tint, never a ring */}
    <div className="translate-x-1 motion-reduce:transform-none" />{/* suppresses the END STATE, which base.css does not */}
    <div className={["flex items-center", "gap-2 rounded-md"].join(" ")} />{/* the canonical multi-fragment join — cannot express the class-glue bug */}
    <div title={"a sentence split across two source lines " + "is prose, not a class seam"} />{/* no class context on either side */}
    <p>{"a multi-line literal mentioning max-h-40\\n\\nkeeps its blank lines: it is prose, not a class string"}</p>
  </>;
}
`,
  );
  const valid = run(validDir);
  if (valid.status !== 0) {
    fail("design-lint structural positive specimen failed", valid.output);
  }

  console.log(
    `✓ design-lint structural specimens: ${requiredIds.length} structural + ${vocabularyIds.length} ` +
      `token-vocabulary rules fail closed, all 5 focus-ring-glow forms are rejected, a class seam ` +
      `with no separating space is rejected; the reviewed Textarea adapter passes, and with it ` +
      `13 deliberate non-violations covering upstream's motion, radius, shadow, alpha, arbitrary ` +
      `value, type, z-index and hover vocabulary`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
