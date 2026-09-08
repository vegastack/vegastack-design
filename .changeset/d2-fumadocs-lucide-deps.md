---
"@vegastack/ui": minor
---

Dependency batches 5–6: the Fumadocs 16.15.8 family, lucide-react 1.42, axe-core 4.13, Playwright
1.63 and recharts 3.10.

Fumadocs is two migrations rather than a bump. `fumadocs-core` 16.14 replaced Orama with ZBSearch
behind the same module path — `oramaStaticClient` is now a deprecated alias for `staticClient`, the
client builds its own database, and the `initOrama` factory plus the direct `@orama/orama`
dependency are gone. `fumadocs-typescript` 5.4 swapped ts-morph for the native TypeScript 7 API, so
the docs' own-props filter reads a property symbol's `declarations[].path` instead of
`getDeclarations()[].getSourceFile().getFilePath()`.

Nothing in the component sources changed for the icon or chart bumps. The lucide 1.25→1.42 rename
sweep is a no-op — every named lucide import in the registry still resolves — and the 439
animated-icon data modules regenerate byte-identical through the factory. recharts 3.10 deprecates
Legend's `align`/`verticalAlign` in favour of `position`/`offset`; no `ChartLegend` call site passes
either and `Legend` still injects `verticalAlign` into custom content, so `ChartLegendContent`
keeps reading it. Only `chart`'s registry item changes, and only because its documentation comment
records that migration.
