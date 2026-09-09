#!/usr/bin/env node
// Executable regression specimens for the AST-only design-lint rules. The invalid specimen must
// fail with every structural rule ID; the positive Textarea adapter specimen exercises the exact,
// rationale-counted native-control exemption without depending on production source contents.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { ROOT } from "./lib/fs.mjs";

const scratch = mkdtempSync(join(tmpdir(), "vegastack-design-lint-"));
const invalidDir = join(scratch, "packages/ui/registry/ui/invalid");
const vocabularyDir = join(scratch, "packages/ui/registry/ui/vocabulary");
const rawStepsDir = join(scratch, "packages/ui/registry/ui/raw-steps");
const fieldGroupDir = join(scratch, "packages/ui/registry/ui/field-group");
const validDir = join(scratch, "packages/ui/registry/ui/valid");
mkdirSync(invalidDir, { recursive: true });
mkdirSync(vocabularyDir, { recursive: true });
mkdirSync(rawStepsDir, { recursive: true });
mkdirSync(fieldGroupDir, { recursive: true });
mkdirSync(validDir, { recursive: true });

try {
  writeFileSync(
    join(invalidDir, "invalid.tsx"),
    `'use client';
import React from 'react';
import type { ComponentProps } from 'react';

export const Legacy = React.forwardRef<HTMLButtonElement>((props, ref) => (
  <button className="cursor-default" ref={ref} {...props}>Bad</button>
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
    {/* Don't let an apostrophe disable later literal rules on this line. */}<div className="transition-opacity">Transition</div>
    <div className="flex truncate">Truncation</div>
    <div className="duration-[125ms]">Motion</div>
    <div className="text-lg uppercase">Voice</div>
    <div className="grid-cols-[200px_1fr] translate-x-[7px] scale-[0.97] aspect-[7/3] backdrop-blur-[12px]">Arbitrary</div>
  </>;
}
`,
  );
  // Tailwind's raw motion steps satisfied the old prefix-only pairing check: `duration-300` starts
  // with `duration-` and `ease-in-out` starts with `ease-`. This specimen passes that rule and must
  // fail the anchored one (audit TG-08). `duration-0` next to a real token pair stays legal.
  writeFileSync(
    join(rawStepsDir, "raw-steps.tsx"),
    `export function RawSteps() {
  return <div className="transition-opacity duration-300 ease-in-out">Raw steps</div>;
}
`,
  );
  // ── the G1-b token-vocabulary rules (issue #49 §7) ───────────────────────────────────────────
  // One specimen, one violation per rule, so a missing rule ID names itself. Every string below is
  // a class literal on a JSX element, which is the only unit these rules look at.
  writeFileSync(
    join(vocabularyDir, "vocabulary.tsx"),
    `export function Vocabulary() {
  return <>
    <div className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">Restated ring</div>
    <div className="rounded-md motion-reduce:transition-none">Restated reduced motion</div>
    <div className="w-full min-h-screen">Viewport</div>
    <div className="flex  items-center ">Whitespace</div>
    <div className="rounded-md bg-card hover:bg-surface-2">Hover with no pressed rung</div>
    <div className="bg-destructive-subtle text-destructive">Solid status fill used as body ink</div>
    <div className="${Array.from({ length: 11 }, (_, i) => `[&_p${i}]:hidden [&_[data-slot=part-${i}]]:hidden`).join(" ")}">Reaching in</div>
  </>;
}
`,
  );

  const vocabulary = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", vocabularyDir],
    { cwd: ROOT, encoding: "utf8" },
  );
  const vocabularyOutput = `${vocabulary.stdout ?? ""}\n${vocabulary.stderr ?? ""}`;
  const vocabularyIds = [
    "restated-focus",
    "restated-motion-reduce",
    "viewport-magic",
    "class-whitespace",
    "hover-without-pressed",
    "descendant-override-density",
    // A solid status FILL as a text ink. It is outside every pair list `contrast-check.mjs`
    // knows — the gate only ever measures `<family>-text` — so `bubble`'s destructive variant
    // shipped 2.56:1 in dark with every gate green (audit 2026-09-09, HIGH-1).
    "fill-token-as-text",
  ];
  const missingVocabulary = vocabularyIds.filter(
    (id) => !vocabularyOutput.includes(`[${id}]`),
  );
  if (vocabulary.status === 0 || missingVocabulary.length > 0) {
    console.error(
      "✗ design-lint token-vocabulary specimen did not fail closed",
    );
    if (missingVocabulary.length > 0)
      console.error(`  missing rule IDs: ${missingVocabulary.join(", ")}`);
    console.error(vocabularyOutput.trim());
    process.exit(1);
  }

  // `fieldControlGroup` ↔ `data-field-group` is one contract split across two places: the recipe
  // paints the wrapper, and `base.css` hangs the forced-colours focus outline off the bare
  // attribute (the group's `overflow-hidden` clips the inner control's own outline). The rule is
  // FILE-scoped, so it needs a file of its own — one that uses the recipe and never renders the
  // attribute, and a sibling that does both and must stay clean.
  writeFileSync(
    join(fieldGroupDir, "unpaired.tsx"),
    `import { cn, fieldControlGroup } from '@vegastack/design';

export function Unpaired() {
  return <div className={cn(fieldControlGroup, 'flex items-center')} />;
}
`,
  );
  const fieldGroup = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", fieldGroupDir],
    { cwd: ROOT, encoding: "utf8" },
  );
  const fieldGroupOutput = `${fieldGroup.stdout ?? ""}\n${fieldGroup.stderr ?? ""}`;
  if (
    fieldGroup.status === 0 ||
    !fieldGroupOutput.includes("[field-group-pairing]")
  ) {
    console.error(
      "✗ design-lint accepted fieldControlGroup with no data-field-group — the forced-colours " +
        "focus outline would be silently lost",
    );
    console.error(fieldGroupOutput.trim());
    process.exit(1);
  }
  writeFileSync(
    join(fieldGroupDir, "unpaired.tsx"),
    `import { cn, fieldControlGroup } from '@vegastack/design';

export function Paired() {
  return <div data-field-group className={cn(fieldControlGroup, 'flex items-center')} />;
}
`,
  );
  const fieldGroupPaired = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", fieldGroupDir],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (fieldGroupPaired.status !== 0) {
    console.error(
      "✗ design-lint rejected a CORRECTLY paired fieldControlGroup + data-field-group",
    );
    console.error(
      `${fieldGroupPaired.stdout ?? ""}\n${fieldGroupPaired.stderr ?? ""}`.trim(),
    );
    process.exit(1);
  }

  writeFileSync(
    join(validDir, "textarea.tsx"),
    `import type { ComponentProps } from 'react';

export function Textarea(props: ComponentProps<'textarea'>) {
  return <><textarea {...props} /><div className="grid-cols-[auto_repeat(3,auto)]" /><div className="transition-opacity duration-fast ease-standard data-[instant]:duration-0" />
    {/* Each line below is a DELIBERATE non-violation of a G1-b rule. They are specimens, not
        decoration: without them a later tightening of one of those rules would start rejecting a
        real pattern and nothing would say so. */}
    <div className="bg-primary hover:bg-primary" />{/* restating the SAME fill opts out of the recipe's hover */}
    <div className="bg-card hover:bg-transparent" />{/* cancelling an inherited hover, not declaring one */}
    <div className="bg-border hover:bg-primary data-[separator=active]:bg-primary" />{/* the pressed rung is component state */}
    <div className="translate-x-1 motion-reduce:transform-none" />{/* suppresses the END STATE, which base.css does not */}
    <div className="max-w-[calc(100vw-var(--spacing)*8)]" />{/* a viewport bound whose inset is a token */}
    <p>{"a multi-line literal mentioning max-h-40\\n\\nkeeps its blank lines: it is prose, not a class string"}</p>
  </>;
}
`,
  );

  const invalid = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", invalidDir],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  const invalidOutput = `${invalid.stdout ?? ""}\n${invalid.stderr ?? ""}`;
  const requiredIds = [
    "forward-ref",
    "raw-interactive-html",
    "standard-control-cursor",
    "presentational-client-boundary",
    "transition-pairing",
    "flex-truncate-conflict",
    "raw-motion",
    "uppercase-mono",
    "render-contract",
    "arbitrary-value",
    "raw-effect",
    "hand-rolled-ref-merge",
  ];
  const missing = requiredIds.filter(
    (id) => !invalidOutput.includes(`[${id}]`),
  );
  const missingControlTags = ["input=1", "select=1"].filter(
    (detail) => !invalidOutput.includes(detail),
  );
  if (
    invalid.status === 0 ||
    missing.length > 0 ||
    missingControlTags.length > 0
  ) {
    console.error(
      "✗ design-lint structural negative specimen did not fail closed",
    );
    if (missing.length > 0)
      console.error(`  missing rule IDs: ${missing.join(", ")}`);
    if (missingControlTags.length > 0) {
      console.error(
        `  missing native-control evidence: ${missingControlTags.join(", ")}`,
      );
    }
    console.error(invalidOutput.trim());
    process.exit(1);
  }

  const rawSteps = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", rawStepsDir],
    { cwd: ROOT, encoding: "utf8" },
  );
  const rawStepsOutput = `${rawSteps.stdout ?? ""}\n${rawSteps.stderr ?? ""}`;
  if (
    rawSteps.status === 0 ||
    !rawStepsOutput.includes("[transition-pairing]") ||
    !rawStepsOutput.includes('"duration-300"') ||
    !rawStepsOutput.includes('"ease-in-out"')
  ) {
    console.error(
      "✗ design-lint accepted Tailwind's raw motion steps as a token pair — transition-pairing is " +
        "anchored to duration-fast/base/slow + ease-standard/emphasized/exit/spring and must name the raw step",
    );
    console.error(rawStepsOutput.trim());
    process.exit(1);
  }

  const valid = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", validDir],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  if (valid.status !== 0) {
    console.error("✗ design-lint structural positive specimen failed");
    console.error(`${valid.stdout ?? ""}\n${valid.stderr ?? ""}`.trim());
    process.exit(1);
  }

  console.log(
    `✓ design-lint structural specimens: ${requiredIds.length} structural + ${vocabularyIds.length} ` +
      `token-vocabulary rules fail closed, raw motion steps are rejected as a pairing, an unpaired fieldControlGroup is rejected and a paired one is not; the reviewed ` +
      `Textarea adapter passes, and with it six deliberate non-violations (same-fill hover, ` +
      `hover:bg-transparent, a state-expressed pressed rung, motion-reduce end-state suppression, ` +
      `a token viewport calc, and multi-line prose)`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
