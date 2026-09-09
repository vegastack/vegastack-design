---
"@vegastack/ui": minor
---

📦 **Dependency batches 5–6: the Fumadocs 16.15.8 family, lucide-react 1.42, axe-core 4.13,
Playwright 1.63 and recharts 3.10.**

Fumadocs 16.11.5 → 16.15.8 (`fumadocs-ui`, `fumadocs-core`, `fumadocs-mdx` 15.4.0,
`fumadocs-typescript` 5.4.0, `@fumadocs/story` 1.3.0; `fumadocs-twoslash` takes the TS 6-safe 3.3.1
patch rather than 4.0, which needs TypeScript 7) is two migrations rather than a bump.
`fumadocs-core` 16.14 replaced Orama with ZBSearch behind the same module path — `oramaStaticClient`
is now a deprecated alias for `staticClient`, the client builds its own database, and the
`initOrama` factory plus the direct `@orama/orama` dependency are gone. `fumadocs-typescript` 5.4
swapped ts-morph for the native TypeScript 7 API, so the docs' own-props filter reads a property
symbol's `declarations[].path` instead of `getDeclarations()[].getSourceFile().getFilePath()`; the
generator cache is TypeScript-version bound and was cleared.

Two Fumadocs behaviour changes were audited and deliberately left alone. 16.13's global `d` theme
hotkey is inert here — `RootProvider` mounts its window-level `keydown` listener inside the
`theme.enabled !== false` branch and this site disables fumadocs' theme provider outright, so
nothing is registered; the reasoning is now recorded at the call site so re-enabling that provider
cannot silently reintroduce a hotkey that swallows a letter on every interactive page. 16.12 stopped
force-mounting inactive `Tabs` panels, so a `ComponentPreview`'s hidden Code panel is no longer in
the prerendered HTML; nothing depends on it, because the visual-surface contracts read the always-
mounted Preview panel and the markdown export reads fixture source from disk, so no `forceMount`
was added.

Nothing in the component sources changed for the icon or chart bumps. The lucide 1.25 → 1.42 rename
sweep is a no-op: all 126 distinct lucide names imported across the registry, the design package and
the docs app — 125 icons plus the `LucideIcon` type — resolve against the installed 1.42.0 module,
and lucide keeps every historical rename as a named alias, so there is nothing to sweep. The 439
animated-icon data modules regenerate byte-identical through the factory, with the 28 new upstream
icons left unadopted. axe-core 4.12.1 → 4.13.0 expands `aria-prohibited-attr` and
`role=image`, and the browser axe lane reports no new violation. recharts 3.9.2 → 3.10.1 deprecates
`Legend`'s `align`/`verticalAlign` in favour of `position`/`offset`; no `ChartLegend` call site
passes either and `Legend` still injects `verticalAlign` into custom content, so
`ChartLegendContent` keeps reading it. Only `chart`'s registry item changes, and only because its
documentation comment records that migration.
