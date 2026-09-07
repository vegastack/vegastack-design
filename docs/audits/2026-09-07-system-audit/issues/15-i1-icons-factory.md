---
title: "I1 · Animated icons: one factory + data modules instead of 439 controller copies"
labels: [audit-2026-09, icons, tooling]
---

## Context

Audit 2026-09-07, `02-batch-09-marketing-hooks-icons.md` B9-01, `05-docs-chrome.md` DC-12, DC-16.
Decision **D28**: factory + data modules. Public icon names and the `AnimatedIcon` wrapper API
stay unchanged.

## Problem

- `packages/ui/registry/ui/icons/*.tsx`: 439 files, 79,078 lines, 3.4 MB; 440 generated
  `public/r/icon-*.json`. `bell.tsx:33-170` is representative: the `useAnimation`/
  `useReducedMotion` controller, `runAnimation`/`resetAnimation`, five pointer/focus handlers,
  the `isControlledRef` trick and a block `<div>` host are identical in every file; only
  `SVG_VARIANTS` and the `<path>` list differ (~15 lines).
- Every icon has a `useEffect` with **no dependency array** (`bell.tsx:83-85`) that runs after
  every render.
- `tooling/verify-animated-icons.mjs:179-191` _requires_ the duplicated shape; the mirror
  (`tooling/mirror-animated-icons.mjs`) already rewrites upstream bytes, so the shape is ours.
- Docs: `AnimatedIconCard` is a focusable `<div>` with no role (439 tab stops on the icons page);
  `IconGallery` is in the global MDX map (~2.3 MB of JS on every route).

## Do

1. `packages/design/src/icons/create-animated-icon.tsx`: `createAnimatedIcon({ name, variants,
paths, transition })` returns the component with the controller, an `inline-flex` `<span>` host
   (or the `<svg>` itself as root), `[]`-dependency reduced-motion effect, `pointerType` rules
   (hover on fine pointers, pointer-down on touch, focus/blur), `size` default
   `var(--icon-default)`, imperative `startAnimation`/`stopAnimation` handle.
2. Mirror emits data modules: each `icons/<name>.tsx` becomes ~20 lines (`export const XIcon =
createAnimatedIcon({...})` with variants + path data, possibly per-path variants); provenance
   header unchanged; manifest hashes still bind to upstream bytes.
3. `verify-animated-icons.mjs`: assert the factory (once) for reduced motion, controlled ref,
   pointer rules; assert each data module against the manifest and the schema; keep the
   fail-closed count (439).
4. Registry: `icon-*` items depend on `@vegastack/design` (already); `registry:build` idempotent;
   `AnimatedIcon` wrapper unchanged.
5. Docs: `AnimatedIconCard` → `<button type="button" aria-label>`; icon gallery moves to its own
   route segment so the wall is not shipped to every page.
6. Changelog `🛠`; `design.md` §Icons: "the factory owns the controller; icons are data".

## Acceptance

- `cat packages/ui/registry/ui/icons/*.tsx | wc -l` < 12,000; `du -sh apps/docs/public/r` down
  by ≥2 MB.
- Every icon still renders 16×16 at `size="var(--icon-default)"` (probe from the audit), animates
  on hover/focus, stops under reduced motion (existing tests + factory tests).
- `pnpm lint` (animated-icon verify), `pnpm registry:build && git status --porcelain` clean,
  `verify-shadcn-consume` on two icons, axe on the icons page (no focusable div).
