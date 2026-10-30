#!/usr/bin/env node
// docs/RUNBOOK.md → apps/docs/content/internal/runbook.mdx (30-10-2026). The runbook has ONE source,
// the repo file every agent reads; the docs page is generated from it so the two can never disagree.
// Run by `pnpm gen`; `--check` fails when the page is stale.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "docs/RUNBOOK.md"), "utf8");
const target = join(root, "apps/docs/content/internal/runbook.mdx");

const body = source
  // The page title comes from frontmatter.
  .replace(/^# .*\n+/, "")
  // Mermaid fences become the design system's own MermaidBlock (registered as `Mermaid`).
  .replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_, diagram) => `<Mermaid source={${JSON.stringify(diagram.trimEnd())}} />`,
  );

const raw = `---
title: Runbook
description: The one procedure for the design system — change, CI, review, release on merge, registry and docs deploy, recovery, and pulling into an app.
audience: internal
---

${body}`;
// Emit prettier's own shape, so `prettier --check` and this generator never undo each other.
const page = await prettier.format(raw, {
  ...(await prettier.resolveConfig(target)),
  filepath: target,
});

if (process.argv.includes("--check")) {
  if (!existsSync(target) || readFileSync(target, "utf8") !== page) {
    console.error(
      "✗ sync-runbook-page: apps/docs/content/internal/runbook.mdx is stale; run pnpm gen",
    );
    process.exit(1);
  }
  process.exit(0);
}
writeFileSync(target, page);
