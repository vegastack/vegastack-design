# 05 — Docs chrome (apps/docs shell)

_Agent report, 2026-09-07. Read-only pass over the site shell: layouts, preview frame, MDX components, global CSS. Component sources and previews are covered by the batch files._

## Verdict

The shell is in better shape than most Fumadocs sites: the `--docs-shell` and `--token-css app` design-lint lanes both pass clean, colour is token-driven everywhere I could find, the provider dogfoods `@vegastack/ui` + the copied-in `Toaster`, and the only literal hex values are the unavoidable `<meta theme-color>` / manifest / OG-image cases (each commented). The problems are structural rather than cosmetic: the preview frame's product-scale scope is a half-boundary (vars re-bound, inherited font-size not), the per-preview toolbar is repeated six times on the Button page, the fullscreen overlay is a `role="dialog"` with no focus trap, the frontmatter hero preview is a different frame from `ComponentPreview`, and several bits of chrome hand-roll what the system already ships (tablist, callout, kbd, buttons). Typography is the biggest doctrinal clash: every Fumadocs heading, sidebar section title and prose `<strong>` renders at weight 600 in a system whose ladder is 400/500, and nothing in `global.css` remaps it.

## Findings

**DC-01 · HIGH · type scale · `.vs-type-product` re-binds the `text-*` vars but not the inherited font-size, so demos render on a 15px/28px prose base**
`apps/docs/app/global.css:67-83` sets `--type-*` custom properties only. Measured in `docs/audits/2026-09-07-system-audit/captures/button/record.json` (`buttonVariants__1280-light-ltr`, first entry): the `div.vs-type-product` computes `fontSize: 15px, lineHeight: 28px` — inherited from Fumadocs prose — while the buttons inside are 14/20 only because `Button` sets `text-sm` explicitly. Any component or demo copy that relies on inheritance (Card/Item body, table cells, `<p>` in a `Wrapper` hero, `PlaygroundControlField` labels) renders off-scale. Fix: in the same rule add `font-size: var(--type-product-base); line-height: var(--type-product-base--line-height);` (and `[data-base-ui-portal]` likewise), and assert it in the contract lane by reading the container's computed font-size.

**DC-02 · HIGH · dogfooding / typography · Fumadocs chrome renders weight 600, the system bans it**
`AGENTS.md` §Build rules: "weight ladder is 400/500; `font-bold`/`font-semibold` are banned". Screenshots `captures/button/page__1280-light.png`, `dialog/…`, `data-grid/…` show `DocsTitle` ("Button"), every `##` heading, sidebar group titles ("Buttons & Actions"), the callout title and `<strong>` at 600. `packages/design-tokens/dist/theme.css:526-542` pins the role tokens to 400 but no `--font-weight-semibold`/`--font-weight-bold` remap exists and `global.css` has none. Fix: decide (DD-1) then either remap `--font-weight-semibold: 500; --font-weight-bold: 500` under `:root` in `global.css` (one line, whole shell), or record the docs shell as a sanctioned exception in `design.md`.

**DC-03 · HIGH · a11y · Fullscreen preview is `role="dialog" aria-modal="true"` with no focus trap and no `inert` on the page**
`apps/docs/components/preview-controls.tsx:203-224`. It moves focus to the close button and listens for Esc (`:164-180`), but Tab walks straight out into the hidden docs chrome behind the overlay, and screen readers can still reach it. It also leaves `document.documentElement.style.overflow` set if the component unmounts mid-fullscreen via navigation only through cleanup — fine — but scroll-lock via inline style bypasses the `scrollbar-gutter` compensation logic documented in `global.css:168-184`. Fix: render the overlay with the system's own `Dialog` (Base UI gives trap, `inert`, scroll-lock, Esc, portal ordering for free) or at minimum wrap in Base UI `FocusTrap`/set `inert` on the sibling app root.

**DC-04 · MEDIUM · UX · Preview toolbar repeats once per `<ComponentPreview>`**
`apps/docs/components/component-preview.tsx:38-46` admits it: Button shows the width toggle + fullscreen + "Copy Prompt" six times (`captures/button/page__1280-light.png`, six identical toolbars). Radix/Base UI/Geist docs place "Copy prompt"-type actions once in the page header. Fix: move `CopyPromptButton` into the header row in `app/docs/[[...slug]]/page.tsx:88-98` beside `SafeMarkdownCopyButton` (it already has the registry name via `page.data.preview`), leave the width/fullscreen toggles per-frame.

**DC-05 · MEDIUM · UX / consistency · The frontmatter hero preview is a different frame from `ComponentPreview`**
`app/docs/[[...slug]]/page.tsx:100` renders `<PreviewComp />` bare, so the hero uses `components/preview/wrapper.tsx` (`border-fd-border bg-fd-card p-6`, no tabs, no toolbar, no code) while every later example uses the Tabs frame. Visible on all three screenshots: the top box has a different border/background from the tab panels below. Fix: route the hero through `ComponentPreview` (with `file` omitted → "Preview" only) so frame chrome, width toggle and product-scale scope are identical.

**DC-06 · MEDIUM · a11y / duplicate landmarks · previews inject a second `<main>` (known B6-07) and there is no skip link**
Confirmed still open: `docs/audits/2026-09-07-system-audit/02-batch-06-navigation-layout.md:62-68`. Additionally `grep -rl "Skip" fumadocs-ui/dist/layouts` finds nothing and `app/layout.tsx` / `app/docs/layout.tsx` add none, so keyboard users tab through the whole sidebar on every page. Fix: add a `sr-only focus:not-sr-only` skip link as the first child of `<body>` in `app/layout.tsx:69` targeting Fumadocs' `#nd-page` / the `DocsPage` article; for B6-07 give shell previews `render={<div role="region" />}`.

**DC-07 · MEDIUM · dogfooding · Home "system trace" hand-rolls a tablist out of `Button`s instead of `Tabs`**
`apps/docs/components/home-system-trace.tsx:337-366` — manual `role="tablist"`, roving `tabIndex`, arrow-key handler (`:295-323`), `requestAnimationFrame` focus. The registry ships `tabs` (`content/docs/components/meta.json` lists it). Also the active style `data-[active]:bg-foreground data-[active]:text-background` (`:358`) invents an inverted-surface state that no component variant uses. Fix: `Tabs`/`TabsList`/`TabsTrigger` with `variant="segmented"` or the `segmented` component.

**DC-08 · MEDIUM · dogfooding · `RegistryInstallCallout` hand-rolls an Alert and uses physical margins**
`apps/docs/components/registry-install-callout.tsx:3-16`: bespoke `border-info/(--alpha-outline-border) bg-info/(--alpha-surface-faint)` box, `<div>`-not-`<Alert>`, `mx-1` / `ml-1` (physical, breaks RTL — the rest of the shell uses `ms-`/`pe-`), a raw `<a>` instead of `Link`, and it is repeated on all 110 component pages. Fix: `<Alert variant="info">` from `components/ui/alert.tsx`, logical spacing, `Link`.

**DC-09 · MEDIUM · dogfooding / mixed vocabularies · Chrome components mix `fd-*` and system tokens, and hand-roll `<button>`/`<kbd>`**
`components/do-dont.tsx:17-24` (`border-fd-border bg-fd-card` next to `text-success-text`), `components/playground.tsx:90-107`, `components/icon-gallery.tsx:59,77,112`, `components/foundations.tsx:250-253` (raw `<button className="rounded-md bg-primary px-4 py-2 …">`), `:508-528` (raw `<kbd>`, raw `<button>`, raw `<input>` with hand-typed focus ring `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fd-ring` duplicating `global.css:131-133`). Fix: pick one vocabulary for chrome (the system's — `fd-*` is already aliased onto it by `shadcn.css`), and use `Button`/`Kbd`/`Input` in specimens; the FocusRingSpecimen in particular should demonstrate the real components' ring, not a lookalike.

**DC-10 · MEDIUM · code quality · Two copies of the markdown-fetch/copy state machine**
`components/copy-prompt.tsx:27-114` and `components/safe-markdown-copy-button.tsx:9-52` each own a `markdownCache`, `status`, `revertTimer`, toast pair; `copy-prompt.tsx:66-69` also re-derives the markdown URL instead of taking `getPageMarkdownUrl()`'s result as a prop (dev/prod URL logic duplicated with `lib/source.ts:19-24`). Fix: one `useMarkdownCopy(markdownUrl)` hook, pass `markdownUrl` from the server page.

**DC-11 · MEDIUM · UX · Story "Explorer" renders the subject full-width and its controls collapsed**
`captures/button/page__1280-light.png` (Explorer section): the button stretches edge-to-edge as a black bar and "Props › object" is collapsed, so the exhaustive explorer looks broken next to the centred `PropsPlayground` directly above. `@fumadocs/story/css/preset.css` is imported (`global.css:4`) without override. Fix: wrap `story.WithControl` in the same centred `vs-type-product` frame, expand the first props group by default, or drop Explorer on pages that already have a curated playground (DD-3).

**DC-12 · LOW · a11y · `AnimatedIconCard` is a focusable `<div>` with no role or accessible name**
`components/animated-icon-card.tsx:39-47` — `tabIndex={0}` on a `div` whose only accessible text is the icon's `aria-label`; 439 of them on `/docs/foundations/icons`, each a tab stop. Fix: make the card `role="button"` with `aria-label` (or `<button type="button">`), or drop `tabIndex` and animate on `:focus-within` of a real control.

**DC-13 · LOW · client boundary · Home hero/trace client surface is larger than needed**
`components/home-system-trace.tsx:1` is `'use client'` for the whole three-column trace (data tables, prose, links) because of one `useState` pair; `components/home-proof-statement.tsx:1` is client for a scroll listener. Fix: keep the state in a small leaf (`TraceTabs`) and render the three layer columns as server children via `children`/slots.

**DC-14 · LOW · consistency · `min-h-screen` vs `min-h-dvh`, and two `cn` import paths**
`app/layout.tsx:69` uses `min-h-screen` while `app/not-found.tsx:6` uses `min-h-dvh` (the correct mobile-safe one). `components/home-proof-statement.tsx:4` imports `cn` from `@vegastack/design` while everything else uses `@/lib/cn` (which re-exports it). Trivial but grep-visible.

**DC-15 · LOW · docs · `preview-controls.tsx` frame widths are inline px**
`components/preview-controls.tsx:19-23` — commented as fixture values, defensible, but `max-w-[var(--preview-frame-max-width)]` at `:192` is an arbitrary-value class; `max-w-(--preview-frame-max-width)` is the v4 form used elsewhere in the repo.

**DC-16 · LOW · perf · `IconGallery` is in the global MDX map, shipping ~2.3 MB of icon-wall JS to every docs route**
Self-documented in `components/icon-gallery.tsx:37-46` and unresolved; the fix named there (a dedicated route segment) is the right one. Recording it so it does not disappear from the ledger.

**DC-17 · LOW · mirror drift · Three "keep in sync with base.css" blocks have no gate**
`global.css:106-166` mirrors the pointer, focus-ring, forced-colors and reduced-motion rules from `packages/design-tokens/…/base.css` by hand; `grep -rl global.css tooling` shows nothing diffing them. Fix: a `verify-docs-base-mirror.mjs` that extracts both blocks and compares, or import `base.css` and undo the parts that conflict with Fumadocs.

## Verified fine

- Colour: zero raw palette / hex in chrome TSX (grep clean; `layout.tsx:36-41`, `manifest.ts`, `lib/og.tsx` are the only literals and are inherently non-CSS).
- `design-lint --docs-shell` and `--token-css app` both exit 0.
- Radius ≤ `rounded-lg` everywhere; z-index only via `z-(--z-overlay)` (`preview-controls.tsx:208`); shadows only via `shadow-overlay` / `shadow-(--shadow-lit)`; motion only `duration-fast ease-standard` / `motion-enter-up`.
- Controls are labelled: width toggle (`preview-controls.tsx:106-121`), fullscreen (`:135-136`), copy buttons with `role="status"` live text, footer social links (`home-footer.tsx:39`), GitHub nav icon (`layout.shared.tsx:20-23`).
- Footer is a sibling of `HomeLayout` so `contentinfo` survives (`home-footer.tsx:16-22`); `Last updated` is a server-rendered `<time>` (`page.tsx:23-44`).
- Provider ownership is clean: `RootProvider theme={{enabled:false}}` + single `VegaStackProvider` (`provider.tsx:22-26`); scroll-lock double-compensation neutralised (`global.css:181-184`).
- Search is the Orama static client with the standard ⌘K dialog (`search.tsx`, `api/search/route.ts` uses `staticGET` — export-safe).
- `meta.json` ordering is coherent; the Components group order matches the sidebar screenshots; `guides/meta.json` lists all ten guides.
- API tables are own-props-only and deterministically sorted (`mdx.tsx:76-137`).

## Doubts for the maintainer

| ID   | Question                                                                                                                  | Options                                                                                                          | Recommendation                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| DD-1 | Does the 400/500 weight ladder apply to the docs shell, or only to component source?                                      | (a) remap `--font-weight-semibold/bold` → 500 in `global.css`; (b) declare the shell an exception in `design.md` | (a) — a one-line remap makes the docs look like the product they document; today the h1/h2/sidebar are the loudest off-system elements on every page. |
| DD-2 | Should the preview toolbar live per-frame or once per page?                                                               | per-frame (status quo); header-only; header + per-frame width toggle                                             | header for Copy Prompt, per-frame for width/fullscreen (DC-04).                                                                                       |
| DD-3 | Keep the Story "Explorer" on pages that already have a curated `PropsPlayground`?                                         | keep both; keep Story only where no playground exists; restyle Story                                             | keep only where no playground exists until DC-11 is fixed.                                                                                            |
| DD-4 | Fullscreen preview: rebuild on the system `Dialog`, or keep the custom overlay and add a trap?                            | Dialog; custom + FocusTrap                                                                                       | Dialog — it is the component being dogfooded, and it already solves portal z-ordering.                                                                |
| DD-5 | Fix `.vs-type-product` by setting font-size on the scope, or by requiring every component to declare `text-*` explicitly? | scope rule; component rule + lint                                                                                | scope rule (DC-01); the component rule would be an unbounded audit.                                                                                   |
