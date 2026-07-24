#!/usr/bin/env node
// Executable regression specimens for the AST-only design-lint rules. The invalid specimen must
// fail with every structural rule ID; the positive Textarea adapter specimen exercises the exact,
// rationale-counted native-control exemption without depending on production source contents.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const scratch = mkdtempSync(join(tmpdir(), "vegastack-design-lint-"));
const invalidDir = join(scratch, "packages/ui/registry/ui/invalid");
const validDir = join(scratch, "packages/ui/registry/ui/valid");
mkdirSync(invalidDir, { recursive: true });
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
  writeFileSync(
    join(validDir, "textarea.tsx"),
    `import type { ComponentProps } from 'react';

export function Textarea(props: ComponentProps<'textarea'>) {
  return <><textarea {...props} /><div className="grid-cols-[auto_repeat(3,auto)]" /></>;
}
`,
  );

  const invalid = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", invalidDir],
    {
      cwd: process.cwd(),
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

  const valid = spawnSync(
    process.execPath,
    ["tooling/design-lint.mjs", validDir],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  if (valid.status !== 0) {
    console.error("✗ design-lint structural positive specimen failed");
    console.error(`${valid.stdout ?? ""}\n${valid.stderr ?? ""}`.trim());
    process.exit(1);
  }

  console.log(
    `✓ design-lint structural specimens: ${requiredIds.length} negative rules fail closed; reviewed Textarea adapter passes`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
