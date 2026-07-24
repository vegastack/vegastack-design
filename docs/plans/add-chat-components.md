# Plan — Add shadcn chat/AI components + shimmer & scroll-fade utilities

> **Status:** ✅ IMPLEMENTED 2026-06-28. All 6 items (marker, message, bubble,
> message-scroller + shimmer/scroll-fade utilities) shipped LOCAL across canonical →
> copy-in → registry JSON → docs, with tests, previews, nav (Communication group +
> Utilities section), and VRT routes. All gates green: tokens lint/build, design-lint,
> ui typecheck + 19 component tests, docs typecheck + lint, registry:build (idempotent),
> verify-base/parity/consume (507/507 × 2 layouts + real `shadcn add` 7/7). Cloud-preview
> verified in light + dark (shimmer animates, scroll-fade masks, scroller auto-scrolls/anchors,
> tinted bubble = brand purple). Bubble `tinted` kept via the existing `purple-subtle` brand
> token (no new tokens needed). One in-pattern robustness fix: `verify-shadcn-consume.mjs`
> preflight fetch now retries connection-level failures (the no-retry path flaked on the first
> request after the inter-pass `tsc` gap once marker became item #1). `@shadcn/react` exception
> recorded in `AGENTS.md`.
> **Authored 2026-06-28.**
> **Operating mode:** build LOCAL, stop at publish/deploy. This plan never runs
> `npm publish`, the Deploy workflow, `changeset` version bumps that ship, or any
> push beyond the working branch. Those are the user's to trigger.

Add five items requested by the user, plus one required companion, sourced from
shadcn's **Base UI ("base-rhea") variant** registry and ported to VegaStack
standards (semantic tokens only, `cn` from `@vegastack/utils`, `@base-ui/react`
primitives, provenance headers, full JSDoc, a11y, tests, VRT, docs).

Source of truth for the imported code: `https://ui.shadcn.com/r/styles/base-rhea/<name>.json`
and the shimmer/scroll-fade `@utility` blocks inside `shadcn@4.12.0`'s
`tailwind.css` (`https://unpkg.com/shadcn/tailwind.css`). Local copies were saved
to the session scratchpad during research.

---

## 1. Decisions (locked via interview, 2026-06-28)

| #   | Decision                                                                                                                                    | Choice                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Include `bubble` (Message's chat-bubble companion, not in the original list)                                                                | **Yes — add Bubble**                                                                                 |
| 2   | `message-scroller` needs `@shadcn/react` (new headless-primitive vendor; deviates from the "Primitives = `@base-ui/react`" locked decision) | **Add `@shadcn/react` dep**                                                                          |
| 3   | Where `shimmer` + `scroll-fade` CSS utilities live                                                                                          | **`@vegastack/tokens`** (new `utilities.css`, imported by docs `global.css` + consumer `preset.css`) |
| 4   | Docs IA                                                                                                                                     | **New "Communication" component group + new "Utilities" docs section**                               |

> Decision #2 is an explicit, user-approved deviation from a locked decision in
> `AGENTS.md`. Record it in the scope ledger when implementing (see §8).

---

## 2. Inventory, dependency graph & build order

```
shimmer (CSS util)  ─┐
scroll-fade (CSS util)│  ← Phase 1 (tokens/utilities.css) — no JS, no registry item
scrollbar-* (CSS util)┘
                       │
marker ────────────────┤  ← Phase 2  (uses shimmer optionally; Base UI useRender; lint-clean)
message ───────────────┤  ← Phase 3  (only `cn`; pure layout; lint-clean)
bubble ────────────────┤  ← Phase 4  (Base UI useRender; NEEDS tokenization — see §7)
message-scroller ──────┘  ← Phase 5  (needs scroll-fade + scrollbar utils + @shadcn/react
                                       + Button + lucide ArrowDown)
```

**What each item actually is** (verified from the base-rhea source, not the docs prose):

| Item                 | Kind                     | Exports                                                                                                                                                                          | External deps                                                                                        | Lint as-is                                                                          |
| -------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **shimmer**          | CSS `@utility` (~80 ln)  | classes `shimmer`, `shimmer-once/-reverse/-none`, `shimmer-color-*`, `shimmer-duration-*`, `shimmer-spread-*`, `shimmer-angle-*` + `@keyframes tw-shimmer`                       | none                                                                                                 | n/a (CSS exempt from utility rules; has `prefers-reduced-motion` + `@variant dark`) |
| **scroll-fade**      | CSS `@utility` (~430 ln) | `scroll-fade`, `-y/-x/-t/-b/-l/-r/-s/-e`, `scroll-fade-*`, `scroll-fade-none` + `@property` + `@keyframes scroll-fade-reveal-*`                                                  | none                                                                                                 | n/a                                                                                 |
| **marker**           | Base UI component        | `Marker`, `MarkerIcon`, `MarkerContent`, `markerVariants` (default/separator/border)                                                                                             | `@base-ui/react` (have), `cva`, `cn`                                                                 | ✅ clean                                                                            |
| **message**          | Layout component         | `MessageGroup`, `Message`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`                                                                                   | `cn` only                                                                                            | ✅ clean; **no `'use client'`**                                                     |
| **bubble**           | Base UI component        | `BubbleGroup`, `Bubble`, `BubbleContent`, `BubbleReactions` (variants default/secondary/muted/tinted/outline/ghost/destructive)                                                  | `@base-ui/react`, `cva`, `cn`                                                                        | ⚠️ **fails** — `bg-[oklch(…)]` / `bg-[color-mix(…)]` (see §7)                       |
| **message-scroller** | Component + 3 hooks      | `MessageScrollerProvider/`, `MessageScroller`, `…Viewport`, `…Content`, `…Item`, `…Button`, `useMessageScroller`, `useMessageScrollerScrollable`, `useMessageScrollerVisibility` | **`@shadcn/react@^0.1.0`** (new), `Button` (have), `lucide ArrowDown`, scroll-fade + scrollbar utils | ⚠️ rewrite icon + scrollbar utils                                                   |

**Categories:** existing set is `actions, data, data-display, feedback, form, icons,
layout, media, navigation, overlay, rich-text`. Add **`communication`** for
marker/message/bubble/message-scroller.

---

## 3. The canonical "add a component" pipeline (per AGENTS.md, applies to every component below)

Each component is one **canonical** file you edit; a script regenerates the two
copies. For each of marker / message / bubble / message-scroller:

1. **Canonical source** → `packages/ui/registry/ui/<name>.tsx` (EDIT THIS ONLY).
2. **Registry manifest** → add an item to `packages/ui/registry.json`
   (`name`, `type: registry:ui`, `title`, `description`, `categories: ["communication"]`,
   `dependencies`, `registryDependencies`, `files[].target: "@ui/<name>.tsx"`, `meta`).
3. **Build** → `pnpm run registry:build` (= `shadcn build` → `registry-stamp` →
   `registry-header` → `verify-headers`). This regenerates
   `apps/docs/components/ui/<name>.tsx` (byte-for-byte copy-in) + `apps/docs/public/r/<name>.json`
   and stamps the `// @vegastack <name>@<ver> sha256-…` provenance header. **Never hand-edit the copy-in or the JSON.**
4. **Tests** → `packages/ui/registry/ui/<name>.test.tsx` (Vitest browser + `vitest-axe`),
   mirroring an existing component's test (e.g. `avatar.test.tsx`).
5. **Docs preview** → `apps/docs/components/preview/<name>.tsx` (composition only —
   NEVER fix component styling here) + add `export * from './<name>';` to
   `apps/docs/components/preview/index.tsx`.
6. **Docs page** → `apps/docs/content/docs/components/<name>.mdx` (frontmatter
   `title`/`description`/`preview`, `## Installation` with
   `pnpm dlx shadcn@latest add @vegastack/<name>`, `<RegistryInstallCallout />`,
   `## Usage`, `## Anatomy`, `## Examples` with `<ComponentPreview …>`,
   `## API Reference` via `<AutoTypeTable path="../../packages/ui/registry/ui/<name>.tsx" name="…Props" />`,
   `## Accessibility`, `## Do / Don't`).
7. **Nav** → add the name to `apps/docs/content/docs/components/meta.json` `pages`
   (grouped after the existing list; see §6 for the Communication grouping).
8. **VRT** → Playwright will capture `__screenshots__` for the new previews on first run.

> Components use named exports + rich JSDoc + `data-slot` + `React.forwardRef`
> (or the `function`+`ref`-prop style — both exist in the repo). Match the
> nearest existing component's style; do not copy the bare shadcn export style verbatim.

---

## 4. Phase 0 — prerequisites & wiring

1. **Add the runtime dependency** to `packages/ui/package.json`:
   `"@shadcn/react": "^0.1.0"` (peer: react ≥19 — already satisfied). Run
   `pnpm install` at the repo root so the workspace lockfile updates **locally**.
2. **Create the tokens utilities file** `packages/tokens/src/utilities.css` (Phase 1
   fills it). Confirm `packages/tokens/build-tokens.mjs` copies `src/utilities.css`
   → `dist/utilities.css` (it already copies `base.css`; extend the copy list if needed).
3. **Export it** from `packages/tokens/package.json` `exports`:
   `"./utilities.css": "./dist/utilities.css"`.
4. **Wire it into the docs app** — add to `apps/docs/app/global.css` after the
   tokens import (line ~4):
   `@import '@vegastack/tokens/utilities.css';`
5. **Wire it into the consumer preset** — add to
   `packages/tailwind-preset/preset.css` after the tokens imports:
   `@import "@vegastack/tokens/utilities.css";`
   (so real npm consumers of the preset get shimmer/scroll-fade/scrollbar utilities,
   which marker/bubble/message-scroller's classes depend on).
6. **Rebuild tokens** → `pnpm --filter @vegastack/tokens build` (regenerates `dist/`).

> `@theme inline` bridge + `--spacing`/`--color-*` theme vars already exist, so
> shimmer's `oklch(from currentColor …)`, `color-mix(in oklch, …)`, and the
> `shimmer-color-*` `--value(--color, [color])` lookups resolve against our token
> palette with no extra config.

---

## 5. Phase 1 — shimmer + scroll-fade + scrollbar utilities (`packages/tokens/src/utilities.css`)

Port **verbatim** from `shadcn@4.12.0`'s `tailwind.css` into the new
`utilities.css` (CSS files are exempt from the Tailwind-utility lint rules; the
only CSS lint is `!important` outside reduced-motion — the source has **none**):

- **scroll-fade block** — lines 97–545 of the source: the `@property --scroll-fade-*`
  declarations, the `@keyframes scroll-fade-reveal-{t,b,s,e}`, and every
  `@utility scroll-fade*`. Uses scroll-driven `animation-timeline: scroll()` +
  `mask-image` (no JS). Keep the graceful static fallback for browsers without
  scroll-driven animations.
- **shimmer block** — lines 537–629: `@keyframes tw-shimmer`, every
  `@utility shimmer*`, the `@variant dark` highlight override, the RTL reverse,
  and the `@media (prefers-reduced-motion: reduce)` reset.
- **scrollbar utilities** (NEW — required by `message-scroller`'s Viewport; these
  are NOT in shadcn's `tailwind.css` and are NOT stock Tailwind v4). Add minimal,
  native-CSS `@utility` blocks:
  ```css
  @utility scrollbar-none {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  @utility scrollbar-thin {
    scrollbar-width: thin;
  }
  @utility scrollbar-gutter-stable {
    scrollbar-gutter: stable;
  }
  ```

**Verify:** `pnpm --filter @vegastack/tokens lint` (contrast-check + design-lint on
`src`), then start docs dev and confirm a `<p className="shimmer">` animates and a
`scroll-fade-b` container masks its bottom edge. No registry item / no `shadcn add`
command for these — they ship inside the already-imported token package.

---

## 6. Phases 2–5 — the components

For each: do the §3 pipeline. Component-specific notes only below.

### Phase 2 — `marker`

- Port `marker.tsx`. Swap imports to ours: `cn` from `@vegastack/utils`;
  `useRender`/`mergeProps` from `@base-ui/react/use-render` + `@base-ui/react/merge-props`
  (already used by badge/breadcrumb/pagination/sidebar — confirmed available).
- Lint-clean as-is; all classes are semantic tokens (`text-muted-foreground`,
  `bg-border`). Keep the `render` prop (Base UI §7.6 contract; don't `Omit<…,'render'>`).
- `registry.json`: `dependencies: ["@base-ui/react@^1.6.0","class-variance-authority@^0.7.1","@vegastack/utils@^0.1.0","@vegastack/tokens@^0.1.0"]`, `registryDependencies: []`, `categories: ["communication"]`.
- Docs: show default / separator / border variants + the "render as link/button" example + a shimmer-on-streaming-text example + a Spinner-paired example.

### Phase 3 — `message`

- Port `message.tsx`. Only `cn` import → `@vegastack/utils`. **No `'use client'`**
  (pure layout, server-safe). Lint-clean.
- It composes Avatar/Bubble via **children** (no imports), so registry
  `registryDependencies: []` is correct, but the docs **Usage/Examples** import
  `Avatar` and `Bubble`, so the docs page examples create the visual dependency.
- `registry.json`: `dependencies: ["@vegastack/utils@^0.1.0","@vegastack/tokens@^0.1.0"]`,
  `registryDependencies: []`, `categories: ["communication"]`.
- Docs: start/end alignment, MessageGroup, header/footer slots, avatar anchoring;
  compose with Bubble in the rich example.

### Phase 4 — `bubble` ⚠️ requires tokenization (see §7)

- Port `bubble.tsx`. Imports → ours. Keep `render` on `BubbleContent`.
- Apply the §7 rewrites so it passes `design-lint`. Everything else
  (`max-w-[80%]` → `%` is allowed; `ring-card`, `ring-3`, `bg-primary/80`,
  `bg-muted`, the `data-[…]`/`[&>…]` arbitrary **variants/selectors**) already passes.
- `registry.json`: `dependencies: ["@base-ui/react@^1.6.0","class-variance-authority@^0.7.1","@vegastack/utils@^0.1.0","@vegastack/tokens@^0.1.0"]`,
  `registryDependencies: []`, `categories: ["communication"]`.
- Docs: all variants, sent vs received (`align`), `BubbleGroup`, `BubbleReactions`.

### Phase 5 — `message-scroller` ⚠️ new dep + rewrites

- Port `message-scroller.tsx` (`'use client'` stays). Swap:
  - `cn` → `@vegastack/utils`; keep `@shadcn/react/message-scroller` import.
  - `Button` import → our registry Button (`@/components/ui/button` in copy-in;
    canonical references resolve through the registry like other composites — mirror
    how `split-button.tsx` / `icon-button.tsx` import Button).
  - **Replace `IconPlaceholder`** (`@/app/(create)/components/icon-placeholder`, a
    shadcn scaffolding shim) with a direct lucide icon:
    `import { ArrowDown } from "lucide-react";` → render `<ArrowDown />` + keep the
    `<span className="sr-only">Scroll to {end|start}</span>`.
  - Viewport scrollbar classes (`scrollbar-thin scrollbar-gutter-stable
data-autoscrolling:scrollbar-none` + `scroll-fade-b`) resolve against the Phase 1
    utilities. Verify `data-autoscrolling:` variant works (primitive sets
    `data-autoscrolling` during programmatic scroll).
- `Button` defaults used by `MessageScrollerButton` (`variant="secondary"`,
  `size="icon-sm"`) — **confirmed present** in our Button.
- Arbitrary values that **pass** lint but are hardcoded literals (polish, optional):
  `ease-[cubic-bezier(…)]` (prefer `ease-[var(--motion-ease-*)]` if a token matches;
  otherwise leave — `ease` isn't a lint-checked prefix) and
  `[contain-intrinsic-size:auto_10rem]` / `[content-visibility:auto]` (bare-bracket,
  not lint-checked; keep as a perf hint or route the `10rem` through a `var`).
- `registry.json`:
  `dependencies: ["@shadcn/react@^0.1.0","@vegastack/utils@^0.1.0","@vegastack/tokens@^0.1.0"]`,
  `registryDependencies: ["@vegastack/button"]` (matches the `@vegastack/<name>`
  convention used by split-button/icon-button/copy-button),
  `categories: ["communication"]`.
- Docs: live auto-scroll/anchor demo (`autoScroll`, `defaultScrollPosition`,
  `scrollAnchor` on items, the floating scroll-to-end Button), plus a hooks section
  (`useMessageScroller().scrollToEnd()`, `useMessageScrollerVisibility()`).

### Docs IA (Decision #4)

- `apps/docs/content/docs/components/meta.json`: append a **Communication** grouping —
  `marker`, `message`, `bubble`, `message-scroller`. (Fumadocs renders a flat list;
  add a `---Communication---` separator entry if the existing meta uses separators,
  else append the four names in order.)
- Create a **Utilities** section for the CSS-only utilities:
  `apps/docs/content/docs/utilities/{shimmer,scroll-fade}.mdx` + a
  `apps/docs/content/docs/utilities/meta.json` (`title: "Utilities"`,
  `pages: ["shimmer","scroll-fade"]`), and add `"...utilities"` to the root
  `apps/docs/content/docs/meta.json` `pages` (sibling to `...foundations`,
  `...components`). These pages document the classes + props (no `shadcn add`
  command — note they ship with `@vegastack/tokens`/preset).

---

## 7. Token-cleanliness rewrite ledger (Bubble)

`design-lint` flags arbitrary `[...]` values **only** on color/length prefixes
(`bg|text|border|ring|fill|stroke|…` and `h|w|min-w|…`) **unless** the inner value
is `var(--…)`, a `--*` custom prop, a `calc()` containing `var(--…)`, a numeric
`fr/%/auto/min-content/max-content/0`, or a CSS-wide keyword. The offending Bubble
classes and their fixes:

| Variant / state                    | Source (fails lint)                                              | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `secondary` hover                  | `bg-[color-mix(in oklch,var(--secondary),var(--foreground) 5%)]` | `bg-secondary/80` (opacity modifier — matches Button's `hover:bg-secondary/80`)                                                                                                                                                                                                                                                                                                                                                                                                 |
| `muted` hover                      | `bg-[color-mix(in oklch,var(--muted),var(--foreground) 5%)]`     | `bg-muted/80`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `tinted` fill (light/dark) + hover | `bg-[oklch(from var(--primary) 0.93 calc(c*0.4) h)]` etc.        | **Recommended:** add `--bubble-tinted`, `--bubble-tinted-foreground`, `--bubble-tinted-hover` to `@vegastack/tokens` (derive from `--primary` via the same `oklch(from …)` formulas, with a `dark` override) and reference via `bg-[var(--bubble-tinted)]` / `hover:bg-[var(--bubble-tinted-hover)]` — `var(--…)` passes lint and preserves the exact design. **Fallback:** drop the `tinted` variant entirely (zero token additions) if we don't want component-scoped tokens. |

Everything else in Bubble already passes: `max-w-[80%]` (numeric `%`), `ring-card`,
`ring-3`, `bg-primary/80`, the `*:data-[slot=…]` and `[&>[data-slot=…]:hover]`
**arbitrary variants** (selectors, not values), and `bg-transparent`.

> Adding `--bubble-*` tokens is **additive** to the v2 palette (not a re-opening of
> the locked palette decision). Run `contrast-check` after, since tinted carries
> `text-foreground` / `text-primary-foreground`.

---

## 8. Verification gates (run after each phase; full sweep at the end)

- `pnpm --filter @vegastack/tokens lint` (contrast + design-lint on token CSS).
- `pnpm --filter @vegastack/tokens build` (regenerate `dist/` incl. `utilities.css`).
- `pnpm run registry:build` → must end with `verify-headers` passing (idempotent,
  local; re-run twice — second run must be a no-op = proof of clean round-trip).
- `pnpm --filter docs lint` (eslint + `design-lint --token-css app` + content-lint +
  provider-dogfood) — this is where Bubble's arbitrary-value violations would surface.
- `pnpm --filter docs typecheck` (fumadocs-mdx + next typegen + tsc).
- `pnpm run shadcn:verify-base` + `pnpm run registry:verify-consume` (real
  `shadcn add` round-trip incl. the new `@shadcn/react` dep + `@vegastack/button`
  registryDependency for the scroller) + `pnpm run registry:verify-parity`.
- Component tests (Vitest browser + axe) for marker/message/bubble/message-scroller.
- `pnpm --filter docs test:vrt` (Playwright) — generates `__screenshots__` for the
  new previews; review the snapshots.
- Browser smoke via the preview tools: shimmer animates, scroll-fade masks edges,
  message-scroller auto-scrolls + the floating button shows/hides, all in light + dark.
- **Update the scope ledger** recording Decision #2 (the approved `@shadcn/react`
  deviation) per the project's R-series handoff convention.

---

## 9. Risks & open sub-decisions

1. **`@shadcn/react` deviation (approved).** New headless-primitive vendor alongside
   Base UI. It is tiny (zero runtime deps, one export). Pin `^0.1.0`; record in the
   ledger; surface in the message-scroller docs "Dependencies" note.
2. **Bubble `tinted` tokenization** — recommend the `--bubble-*` token route (preserves
   design, passes lint); fallback is dropping `tinted`. Confirm preference at
   implementation time if uncertain (low-risk either way).
3. **scroll-driven CSS support** — `scroll-fade` relies on `animation-timeline:
scroll()`; older engines fall back to a static fade (acceptable; documented).
4. **`data-autoscrolling:` variant** — depends on the primitive emitting the attribute;
   verify against `@shadcn/react@0.1.0`'s actual DOM output during Phase 5 smoke test.
5. **Fumadocs nav grouping** — confirm whether `components/meta.json` supports inline
   group separators or needs a sub-folder; adjust §6 accordingly.

## 10. Out of scope (build-local mode)

- `pnpm changeset` version bump that publishes, `release.yml`, the Deploy workflow,
  npm publish, Cloudflare deploy, Sigstore signing — all user-triggered.
- Any second new primitive vendor beyond the approved `@shadcn/react`.
- Re-opening the v2 token palette (only additive `--bubble-*`/scrollbar utilities).
