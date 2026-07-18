# Full icon coverage: lucide + thesvg + lucide-animated

**Goal:** Support *all* icons from the three sanctioned sources through `@vegastack/icons`. Build local, uncommitted.

## Verified current state
- **lucide-react** v1.21.0 — 5,951 exports (every lucide icon + aliases). `Icon as={X}`. ✅ complete.
- **thesvg** v3.0.17 — ~2,046 brand icons (modules: `{slug,title,hex,categories,aliases,svg,variants{default,mono,light,dark,wordmark},license,url}`). `BrandIcon icon={X}`. ✅ complete, but only `default`/`mono` exposed.
- **lucide-animated** — shadcn copy-paste registry at `https://lucide-animated.com/r/`, **440 items** (registry index confirms), each a `"use client"` `motion` `forwardRef<XIconHandle>` component (`size=28`, imports `cn` from `@/lib/utils`, handle = `startAnimation()/stopAnimation()`). **Not implemented**; docs falsely claim it's mirrored. ❌

## Decisions (from MK)
1. **Mirror all 440 into the private registry** + add an `AnimatedIcon` wrapper convention.
2. Correct the `icons.mdx` claim.
3. Expose thesvg `light/dark/wordmark` variants on `BrandIcon`.

## Architecture
- **`AnimatedIcon`** (new, in `@vegastack/icons`): thin wrapper like `Icon`/`BrandIcon` — `as={SomeAnimatedIcon}`, size tokens `xs/sm/md/lg` → 14/16/20/24px, forwards the `…IconHandle` ref, a11y (`aria-label`/`aria-hidden`). **No `motion` import** → keeps the base package dependency-light; `motion` is pulled only by the mirrored components when added. Global reduced-motion documented via `<MotionConfig reducedMotion="user">` at app root.
- **Mirror pipeline** (`tooling/mirror-animated-icons.mjs`): fetch `/r/registry.json` → for each of 440: fetch item JSON, transform the file content (`@/lib/utils` → `@vegastack/utils`, stamp a provenance + upstream-attribution header), write canonical source to `packages/ui/registry/icons/<name>.tsx`, and emit a generated `packages/ui/registry.icons.json`. Kept SEPARATE from the 64-component `registry.json` so it doesn't pollute the component matrix.
- **Build**: `shadcn build packages/ui/registry.icons.json -o apps/docs/public/r` (same output dir, distinct names) + copy-ins under `apps/docs/components/ui/` + integrity stamping via the existing `registry-stamp`/`registry-header`/`verify-headers` (extended to cover the icons set).
- **Lint**: `motion` is not on design-lint's icon denylist (ok); the inline-`<svg>` rule only matches `<svg` (these use `<motion.svg>` → not matched) — verify, allowlist if needed. License: lucide-animated is MIT/ISC; preserve attribution in each header.

## Steps
1. `AnimatedIcon` wrapper + export + `motion` as optional `peerDependency` (optional) in `@vegastack/icons`. ✅ verify typecheck/build.
2. Cleanups: `BrandIcon` variants (`color|mono|light|dark|wordmark`); fix `icons.mdx`.
3. `tooling/mirror-animated-icons.mjs` — write, validate on a 5-icon batch end-to-end (fetch→transform→build→lint).
4. Full run (440) → build → verify-headers → design-lint → typecheck.
5. Docs: `IconGallery` / icons.mdx show an animated example; document `AnimatedIcon` + `shadcn add @vegastack/<icon>` + reduced-motion.

## Verify
typecheck (icons pkg), design-lint clean, verify-headers, a sample animated icon renders + animates in the live docs, reduced-motion respected.

## DONE ✅
- AnimatedIcon wrapper + BrandIcon variants shipped (icons pkg typechecks + builds; exports `AnimatedIcon`).
- Mirror: **439 unique** lucide-animated icons (upstream lists 440 with a `chess-bishop` dupe) → `packages/ui/registry/ui/icons/*` + copy-ins + `apps/docs/public/r/*.json`. registry now **503 items (64 components + 439 icons)**; registry:build green; **verify-headers 503/503**.
- `design-lint` clean for icons (0 violations) — added `registry/ui/icons/**` exemptions for the inline-`<svg>` and inline-`style` (Motion `transformOrigin`/`transformBox`) rules; hex/raw-palette still enforced (mirror also asserts it).
- `motion@^12.40.0` added to apps/docs; IconGallery shows a live animated row; icons.mdx corrected (3 conventions, real mirror, AnimatedIcon usage, reduced-motion via MotionConfig). Verified live in the docs (all 3 sections render, no errors).

## Pre-existing finding (NOT icons) — surfaced, not fixed
5 overlay components (`alert-dialog`, `dialog`, `hover-card`, `popover`, `sheet`) fail design-lint's file-scoped `outline-none` rule (no in-file focus affordance). Root cause: the earlier focus-consolidation removed their per-component outlines; the colors-task lint check missed it because `design-lint.mjs` with no args defaults to `packages/ui/src` (the barrel), not the registry. They're documented false-positives (focus is centralized in base.css + asserted by axe browser tests). Recommended fix: add the 5 to `OUTLINE_NONE_EXEMPT` with rationale (and update its now-stale "empty by design" comment) — awaiting MK's nod (exempt vs add affordances).
