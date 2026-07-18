#!/usr/bin/env node
// verify-provider-dogfood (Codex R8 MED): prove the showcase actually consumes the PUBLISHED
// `@vegastack/ui` provider entrypoint, not a hand-reconstructed copy.
//
// The docs build/typecheck only proves the package is consumed if `apps/docs/components/provider.tsx`
// genuinely imports `VegaStackProvider` from `@vegastack/ui` and renders it. If someone reverts the
// provider to a local DirectionProvider/Tooltip.Provider reconstruction, the package entrypoint could
// silently break/diverge while the docs still build — the "@vegastack/ui consumed in showcase" claim
// would be unproven. This gate fails closed on that regression.
//
// Wired into `apps/docs` `lint` (alongside content-lint), so it runs in CI with the rest of lint.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROVIDER = join(ROOT, 'apps/docs/components/provider.tsx');
const rel = PROVIDER.replace(ROOT + '/', '');

let src;
try {
  src = readFileSync(PROVIDER, 'utf8');
} catch {
  console.error(`\n✗ verify-provider-dogfood: cannot read ${rel}`);
  process.exit(1);
}

// 1. Must IMPORT VegaStackProvider from the workspace package (the load-bearing entrypoint import
//    that makes the package's public API typecheck against the showcase).
const importsProvider = /import\s*\{[^}]*\bVegaStackProvider\b[^}]*\}\s*from\s*['"]@vegastack\/ui['"]/s.test(src);
// 2. Must RENDER it (so it isn't an unused import that tree-shakes away without exercising anything).
const rendersProvider = /<VegaStackProvider\b/.test(src);

const failures = [];
if (!importsProvider)
  failures.push(`must import { VegaStackProvider } from '@vegastack/ui' (dogfood the published provider entrypoint)`);
if (!rendersProvider) failures.push(`must render <VegaStackProvider> to actually exercise the package provider`);

if (failures.length) {
  console.error(`\n✗ verify-provider-dogfood: ${rel}`);
  for (const f of failures) console.error(`    - ${f}`);
  console.error(
    `\n  The showcase must consume the PUBLISHED @vegastack/ui provider so a broken/divergent\n` +
      `  entrypoint fails the docs build — don't reconstruct DirectionProvider/Tooltip.Provider locally.`,
  );
  process.exit(1);
}

console.log('✓ verify-provider-dogfood: docs provider imports + renders @vegastack/ui VegaStackProvider');
