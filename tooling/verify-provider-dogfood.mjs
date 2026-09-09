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
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROVIDER = join(ROOT, "apps/docs/components/provider.tsx");
const rel = PROVIDER.replace(ROOT + "/", "");

let src;
try {
  src = readFileSync(PROVIDER, "utf8");
} catch {
  console.error(`\n✗ verify-provider-dogfood: cannot read ${rel}`);
  process.exit(1);
}

// 1. Must IMPORT VegaStackProvider from the workspace package (the load-bearing entrypoint import
//    that makes the package's public API typecheck against the showcase).
const importsProvider =
  /import\s*\{[^}]*\bVegaStackProvider\b[^}]*\}\s*from\s*['"]@vegastack\/ui['"]/s.test(
    src,
  );
// 2. Must RENDER it (so it isn't an unused import that tree-shakes away without exercising anything).
const rendersProvider = /<VegaStackProvider\b/.test(src);

// 3. TOAST MANAGER BINDING (appearance probe 2026-09-07, HIGH). `toast.tsx` calls
//    `Toast.createToastManager()` at MODULE scope, so the registry copy-in
//    (`@/components/ui/toast`) and the package mirror re-exported by `@vegastack/ui` each own a
//    separate store. A `<Toaster/>` shows whatever the nearest `ToastProvider` above it is bound
//    to, and every preview on this site fires the copy-in `toast()`. Mounting the copy-in Toaster
//    under the PACKAGE provider alone therefore renders a permanently empty viewport: no error,
//    no console warning, no toast — the docs Toast page was dead in production from the O2
//    sonner→Base UI migration until the appearance probes measured it. So: whichever module the
//    rendered `<Toaster/>` is imported from, a `<ToastProvider>` from THAT SAME module must be
//    rendered too. (`packages/ui/test/toast-manager-binding.browser.test.tsx` pins the runtime
//    half of the same rule.)
const importSpecifierOf = (symbol) => {
  const match = new RegExp(
    String.raw`import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]`,
    "g",
  );
  for (const [, names, specifier] of src.matchAll(match)) {
    const imported = names.split(",").map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop()
        .trim(),
    );
    if (imported.includes(symbol)) return specifier;
  }
  return null;
};
const toasterSpecifier = /<Toaster\b/.test(src)
  ? importSpecifierOf("Toaster")
  : null;
const toastProviderSpecifier = /<ToastProvider\b/.test(src)
  ? importSpecifierOf("ToastProvider")
  : null;

const failures = [];
if (toasterSpecifier && toastProviderSpecifier !== toasterSpecifier)
  failures.push(
    `renders <Toaster/> from '${toasterSpecifier}' but no <ToastProvider> from the same module` +
      `${toastProviderSpecifier ? ` (it renders one from '${toastProviderSpecifier}')` : ""} — ` +
      `the viewport would bind to a different toast manager than the previews' toast() writes to, ` +
      `and every toast would silently vanish`,
  );
if (!importsProvider)
  failures.push(
    `must import { VegaStackProvider } from '@vegastack/ui' (dogfood the published provider entrypoint)`,
  );
if (!rendersProvider)
  failures.push(
    `must render <VegaStackProvider> to actually exercise the package provider`,
  );

if (failures.length) {
  console.error(`\n✗ verify-provider-dogfood: ${rel}`);
  for (const f of failures) console.error(`    - ${f}`);
  console.error(
    `\n  The showcase must consume the PUBLISHED @vegastack/ui provider so a broken/divergent\n` +
      `  entrypoint fails the docs build — don't reconstruct DirectionProvider/Tooltip.Provider locally.\n` +
      `  And a copy-in <Toaster/> must be mounted inside the <ToastProvider> from the SAME module,\n` +
      `  because each toast module owns its own module-scope manager.`,
  );
  process.exit(1);
}

console.log(
  "✓ verify-provider-dogfood: docs provider imports + renders @vegastack/ui VegaStackProvider" +
    (toasterSpecifier
      ? `, and its <Toaster/> and <ToastProvider> both come from '${toasterSpecifier}' (one toast manager)`
      : ""),
);
