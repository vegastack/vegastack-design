# Decisions and build rules (reference)

Moved out of AGENTS.md on 30-10-2026 so agents do not load it every session. AGENTS.md keeps the one-line rules; this file keeps the rationale. The enforcing scripts win over this prose. Re-opening a locked decision is an MK decision.

## Locked decisions

One line each; the rationale is in the cited plan or ledger, which are historical records — read them for _why_, never for _what is true now_. Re-opening one is an MK decision.

- **The system is shadcn `base-nova`, used as-is, plus one hundred recorded exceptions** (the shadcn reset, approved by MK 2026-09-17/18, `docs/plans/2026-09-18-shadcn-reset/`). **The register is the authority, not this list**: 236 rows in `decisions.md` there, machine copy at `packages/ui/upstream/decisions.json` — 108 resolved as **shadcn** (upstream ships unchanged) and 128 as **ours** (upstream is patched, and the patch header names the ID). `exception-map.json` assigns each exception to the components that must carry it; `ours.json` records the components upstream has no counterpart for; `excluded.json` records the names that DO NOT SHIP here whatever upstream does — both the ones we deleted in favour of an upstream replacement and the ones upstream ships that this system does not want (`sonner`, 2026-09-22). An excluded name leaves the enforced `migrated()` set, which is the only way out of it, and it never leaves quietly: the component, its patch, its registry item and its docs page go with it, and `component-contracts.json`'s expectedCounts fails until the counts move too. There is no third category, and `pnpm upstream:check` proves it. Everything the pre-reset system decided **against** upstream and this register resolves as shadcn — the warm neutral ramp, the surface ladder, the alpha and opacity ladders, the radius cap, the shadow ban, the 14px role type scale, the 400/500 weight ladder, the banned colour transitions, the mandatory pressed step, the Button `variant × tone` API, `IconButton`, the z-band names, the modal scrim, tooltip delays, menu chrome — **is gone**, with no compatibility layer (`docs/MIGRATING-SHADCN-RESET.md`). The reset ships as a MINOR bump, not a 1.0: `@vegastack/design` and `@vegastack/design-tokens` go to 0.5.0 and `@vegastack/ui` to 0.10.0. The marketing layer and its ten components were deleted outright, not ported. A new deviation from upstream is a new MK decision on that register; never invent a row (`A11Y-14` and `A11Y-15` are permanently burned because two subagents did).
- **Stack** — shadcn CLI 4.21.0, style `base-nova` (`-b base` + `-p nova`), pulled with `--pointer` and `--rtl`, colour base `neutral`; `@base-ui/react`; Tailwind v4; Next 16; React 19; Node pinned to 24.20.0 by pnpm (`devEngines.runtime`), not by any runner; pnpm 11; Turborepo 2. A version move is MK's decision: `vendor/shadcn/<cli>/` is committed and hashed, so work continues offline, and the parity gate makes the next bump a reviewable diff.
- **Distribution is hybrid** — public npm (`@vegastack/design` + zero-dep `@vegastack/design-tokens`) plus a private shadcn registry for components (copy-in); `docs/requirements.md` § 3. **Component model A (own it), no `Vega*` prefix** — export `Button`, and let `shadcn add --diff` surface upstream changes for deliberate cherry-pick; there is no pristine-shadcn tier. **The provider ships as a registry item** (`shadcn add @vegastack/provider`), and the `@vegastack/ui` provider is a documented mirror of that canonical source.
- **Tokens and docs** — DTCG → Style Dictionary (`color/oklch` transform, separate light/dark builds, `@theme inline` bridge), with runtime vars `--font-family-*`/`--motion-ease-*` that are never self-referential; docs are Fumadocs, statically exported to Cloudflare Workers Static Assets, and Storybook is deferred.
- **Registry integrity** — whole-item SHA-256 in `meta.integrity`, a Sigstore-signed manifest (GitHub OIDC), and a fail-closed consume preflight. **Auth topology** (2026-07-28) — every non-registry route is anonymous, including `/internal/*`, which stays unlisted, `noindex`, and outside every discovery corpus; `/r/*` alone is service-token-only, and `SITE_VISIBILITY` controls discovery metadata, never authorization.
- **No CI job is GitHub-hosted** — the LAN Debian boxes run every job, including credential-bearing publication/deployment (29-10-2026: all DS workflows run on Linux `vsk-runner` in the pinned container; the Mac runners are not used, and `verify-workflow-security` rejects any workflow that names one). A PR, a release, and a deploy cost zero billable minutes. The exact runner map is enforced by `tooling/verify-workflow-security.mjs` and mutation-tested by its negative harness. **npm publishes token-free via OIDC trusted publishing** from a self-hosted runner, with no `NPM_TOKEN` and no provenance bundle; detail in `docs/RELEASING.md`.
- **A release creates no git tag and no GitHub release** (2026-09-04, reaffirmed 2026-09-09) — Changesets writes versions and changelogs onto the Version Packages PR, while the post-merge workflow calls `npm publish --no-provenance` directly. Neither step creates a tag or release, and nothing consumes one: npm versions plus `meta.integrity` are the release markers. The `@vegastack/design@0.1.1`–`0.3.1` tags are residue of the old path; do not backfill. Detail: `docs/RELEASING.md` § Tags and GitHub releases.
- **PR CI is full-static plus deterministic affected Chromium** (2026-09-15, `docs/plans/2026-09-15-deterministic-affected-ci-and-one-instruction-shipping.md`). `component-contracts.json` owns source/test/preview/cross-cutting ownership; registry dependencies are reconciled against imports; `affected-tests.mjs` walks transitive reverse dependents and fails unknown paths. Broad inputs run named contracts plus fixed geometry canaries. The complete component suite is manual-only (`pnpm test:full --engines chromium|all`) and no automatic main, publish, or deploy workflow repeats PR tests.
- **Job containers are required on every job** (R2, 2026-09-08; the mac mini retired 29-10-2026) — the pinned `mcr.microsoft.com/playwright` image, whose tag is derived from `pnpm-lock.yaml`, is what makes a Linux box interchangeable, so the workflow-security gate REQUIRES it there and rejects it everywhere else.
- **No committed screenshot lane or baseline** — affected CI runs `packages/ui/test/geometry.browser.test.tsx` only for selected preview fixtures while retaining its global CSS/token and metadata guards. During `/ship`, the agent may create temporary targeted captures in light/dark and narrow/wide for judgment; none is committed or treated as a CI result.
- **Two contract-derived docs files are build outputs, not commits** (R4, 2026-09-08) — see § Single source of truth; the registry copy-in and `public/r/*` stay committed, and the distribution decision is untouched. **The changelog is assembled per version, not edited per PR** (R5, 2026-09-08) — a PR writes a changeset carrying one section marker, `tooling/changelog-assemble.mjs` writes the `/CHANGELOG.md` entry at version time, and `sync-changelog.mjs` regenerates the docs page.
- **30-09-2026 (MK) — Version Packages commits are pushed with git-cli**; the GraphQL createCommitOnBranch payload (~19 MB, ~2,086 restamped files) exceeds GitHub's limit. `tooling/verify-workflow-security.mjs` requires `commitMode: git-cli`.

### Sanctioned dependency exceptions

Adding to either list needs MK sign-off, tracked the same way.

- **Headless primitives** — non-Base-UI packages that own a behavioural core (interaction semantics or the state machine under them) but render nothing. Exactly eight, each isolated behind one registry item so an engine swap touches one file:
  - `@shadcn/react` v0.3 — the original exception, and the only one with **two** subpaths. `@shadcn/react/message-scroller` (the auto-scroll, anchor and prepend-preservation engine behind `message-scroller`) is the entry MK approved first; Batch 6 of the shadcn reset (2026-09-18) adopted `@shadcn/react/questionnaire` with it — upstream's `questionnaire` is that package's question-flow state machine (item sequencing, answer and skip status, shortcut keys, validation, resume, and the `role="progressbar"` / `role="alert"` live regions). No new package and no new MK decision: the package is already sanctioned and its whole surface was pre-approved with upstream's dependency set (DOC-7). Each subpath is imported in exactly one **registry** file, `packages/ui/registry/ui/{message-scroller,questionnaire}.tsx`, so an engine swap still touches one shipped file each; the chrome, the choice card, the tokens and the reduced-motion scroll override are ours. The docs previews import the headless parts a second time, and deliberately: upstream documents an **Unstyled** section on exactly these two pages, and `verify-variant-coverage` requires a live `<ComponentPreview>` under it, so mounting the primitive directly is the only honest demonstration of that section.
  - `@tanstack/react-table` v9 — `data-grid`'s row-model state machine. v9 requires an explicit feature set, and `data-grid` registers exactly one: `rowSortingFeature` plus `createSortedRowModel()`. Column visibility and column order are `data-grid`'s own state, applied before the engine sees a column; `columnVisibilityFeature`, `columnOrderingFeature` and `rowSelectionFeature` exist and are deliberately not adopted. It never touches DOM or focus; the APG grid keyboard layer is ours.
  - `@atlaskit/pragmatic-drag-and-drop` (+ `-hitbox`) — the drag engine behind `use-drag-reorder` (consumed by `board` and `sortable-list`). Pointer-first by design; the keyboard layer, live-region announcements, and "Move to…" menu equivalents are ours.
  - `react-dropzone` — the drop/paste acquisition engine behind `use-file-drop` (and `dropzone`'s thin shell). The four above were approved by MK 2026-07-27 (plan `2026-07-26-crm-commissioned-components.md` §2.1, D1–D4).
  - `react-day-picker` v10 — the calendar state machine (day grid, range selection, month navigation). Base UI ships no Calendar/DatePicker — its own was removed before publish — and shadcn's Calendar is this package under every base, `--base base` included. **One file RENDERS it: upstream's `calendar.tsx`.** Batch 7b of the shadcn reset (2026-09-18) rebuilt `date-picker.tsx` on top of that component, so it no longer mounts a `DayPicker` of its own; what it still imports from the package is the three TYPES it re-exports (`DateRange`, `Matcher`, `DayButton`) and the two matcher EVALUATORS (`dateMatchModifiers`, `rangeContainsModifiers`) that gate its presets against exactly the policy the grid enforces. Re-deriving `Matcher` evaluation would be the drift that gate exists to prevent, so the evaluators stayed and are flagged as the one residue. The `Intl.DateTimeFormat` formatting, the preset rails and the popover composition are ours. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D25**).
  - `input-otp` v1 — the one-time-password state machine behind `input-otp` (one hidden input driving the slots, so paste, autofill and the platform SMS suggestion all work). shadcn ships this package under every base; it is imported in exactly one file, `packages/ui/registry/ui/input-otp.tsx`, and the slot chrome, the separator and the caret are ours. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**), adopted in Batch 3.

  - `cmdk` v1 — the command-palette state machine behind `command`: the scoring filter, the selected-item cursor, the group bookkeeping and the `useCommandState` store. Decision **OVL-12** resolves as **shadcn** (upstream's `command` is cmdk under every base), so Batch 4 of the shadcn reset adopted it and retired the Base UI Combobox build; it is imported in exactly one file, `packages/ui/registry/ui/command.tsx`, and the chrome, the dialog shell and the result announcer are ours. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**).

  - `embla-carousel-react` v8 — the slide engine behind `carousel`: the scroll snapping, the drag and momentum, the slide index and the `canScrollPrev`/`canScrollNext` state, plus its own plugin protocol. It renders no element of its own — `Carousel` hands it a ref and reads its API — and the arrows, the slide chrome and the keyboard handler are ours. shadcn ships this package under every base; it is imported in exactly one file, `packages/ui/registry/ui/carousel.tsx`. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**), adopted in Batch 5.

  Nothing else — a ninth entry is a new MK decision, not a pattern to follow.

- **Theme engine** — `next-themes` (0.4.6): the class/attribute theme switcher, the storage and system-preference listener, and the anti-FOUC inline script. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D30**). It is **mounted** in `provider`, the sanctioned single app-root wrapper, and read in exactly ONE registry item: `provider` itself, where `useVegaStackTheme` is a thin wrapper over its `useTheme()`. Batch 4 of the shadcn reset briefly added a second reader, `sonner`, which needed the resolved theme to pick its own engine colour scheme; that component was retired on 2026-09-22 (OVL-10). `toast`, the Base UI surface, reads nothing — it inherits from the cascade — so a swap changes one file.
- **Notification engine — none; Toast IS the engine** (OVL-10, MK 2026-09-22). Upstream ships both `toast` (Base UI) and `sonner`, and Batch 4 of the shadcn reset shipped both. `sonner` is now retired: the registry item, the docs page and the `sonner` dependency are gone, and the name is recorded in `packages/ui/upstream/excluded.json`. One toaster, one live region, one imperative API. A second notification engine is a new MK decision, not a reinstatement.
- **Measurement engine** — `@tanstack/react-virtual` (same D1/D2 sign-off): windowing maths for `data-grid`'s `virtualize` flag. It measures; it owns no interaction.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts` (^3.10.1 — upstream pins `3.8.0` exactly; Batch 6 of the shadcn reset reconciled rather than downgraded, because 3.10.1 is the same major, is what `chart.tsx`'s focus behaviour was measured against, and satisfies upstream's range), `motion`, `tiptap` (with `@tiptap/markdown`, same vendor and version line, and its `marked` — the Markdown format of `text-edit-editor`), and `marked` itself (^17, the same lexer tiptap's Markdown format uses) behind `markdown-view`, which turns its tokens into a React tree we own and touches neither interaction semantics nor focus (imported directly by exactly one file, `packages/ui/registry/ui/markdown-view.tsx`; raw HTML renders as text and is never executed). `marked` replaced `react-markdown` + `remark-gfm` on 2026-09-27 (operator instruction: a light read renderer shared by `MarkdownView` and `TextEdit`'s read view, so neither ships a heavy parser in a page's first bundle). Approved by MK 2026-09-09. **`pdfjs-dist`** (^6.3.289) — the PDF renderer behind `file-viewer`, imported dynamically by exactly one file, `packages/ui/registry/ui/file-viewer-pdf.tsx` (itself `React.lazy`-loaded), with its worker served same-origin; it paints canvases and owns no interaction. Approved by MK 2026-09-27. **`xlsx`** (SheetJS 0.20.3, pinned to the vendor tarball `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, because the npm registry's `xlsx` stops at 0.18.5) and **`mammoth`** (`1.13.0`, exact) — the Excel and Word readers behind `file-viewer`, both imported dynamically by exactly one file, `packages/ui/registry/ui/file-viewer-office.ts` (itself dynamically imported the first time a spreadsheet or a `.docx` opens), capped at 20 MB; mammoth's HTML is rebuilt through `MarkdownView`'s allowlist, never injected. They parse; they own no interaction. Approved by MK 2026-09-30 ("MK, 30-09-2026: accept everything", the Regent design review). **`mermaid`** (`12.1.0`, exact) — the diagram renderer behind `mermaid-block`, imported dynamically by exactly one file, `packages/ui/registry/ui/mermaid-block.tsx`, the first time a diagram nears the viewport, with its configuration pinned on every render (`securityLevel: "strict"`, SVG labels only, dagre layout, no error diagram) and nothing but its own DOMPurify-sanitised SVG injected; it draws and owns no interaction. Approved by MK 2026-10-14 (Regent Pages v2 plan 12 §4.12, Round 2). Each is named per-component in `packages/ui/registry.json`. These render or animate; they do not own interaction semantics, which is why they are a narrower class than the primitive exception above. Nothing else joins this list by pointing at one of these as a precedent — a new entry is a new MK decision.
- **Diff engine** — `diff` (jsdiff, ^8.0.4): the line and word diff behind `diff-view`, which renders its changes as `ins`/`del` text it owns. Imported by exactly one file, `packages/ui/registry/ui/diff-view.tsx`, and only through a dynamic `import("diff")` behind `React.lazy`, so it loads in its own chunk the first time a `DiffView` renders. It computes; it owns no interaction. Approved by MK 2026-09-29 (plan `2026-09-29-collaboration.md`).

- **Collaboration engine** — `yjs` (^13.6.33, the shared-document CRDT), `y-protocols` (^1.0.7, its awareness protocol), `@tiptap/y-tiptap` (^3.0.9, the ProseMirror ↔ Yjs binding — never `y-prosemirror` beside it: two bindings or two `yjs` copies break sync), and `@tiptap/extension-collaboration` + `-collaboration-caret` (same vendor and version line as `tiptap`). Imported only by `text-edit` (`packages/ui/registry/ui/text-edit-editor.tsx`, the editor's lazily loaded chunk, behind the `collaboration` prop; `text-edit.tsx` takes their types alone); `yjs` and `@tiptap/y-tiptap` are also devDependencies of the VegaStack Markdown round-trip corpus. The provider (Hocuspocus or any other) stays the app's — typed structurally, never imported. They bind and sync; the editor's interaction is ours. Approved by MK 2026-10-14 (Regent Pages v2 decisions, Round 2: "Yjs + Mermaid in the DS").

- **Email renderer** — `react-email` (^6.11.0, the single package; never the split `@react-email/*` packages, whose `@react-email/tailwind` drops `dark:` media rules with Tailwind ≥4.3.3): the table primitives, the bulletproof `Button`, the `Preview` preheader and `render`/`toPlainText` behind the `email-kit` block. Imported only by the block's own files under `packages/ui/registry/blocks/email-kit/` (and the docs preview that renders them); no Tailwind, inline styles from the generated `email-tokens.ts`. `doiuse-email` (caniemail data) is a devDependency of its test only. It renders HTML strings on a server; it owns no interaction. Approved by MK 2026-10-05.

## Build rules

**Rebuilt 2026-09-18 by Batch 1 of the shadcn reset** (`docs/plans/2026-09-18-shadcn-reset/`), which
replaced the token contract with shadcn `base-nova`'s `neutral` base and deleted seventeen lint
rules whose decision row resolved to **shadcn**. Enforced by `tooling/design-lint.mjs`. Full token
vocabulary: `skills/internal/component/references/tokens.md`. Rule by rule:
`skills/internal/review/references/lint-rules.md`.

- **Colour** — semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`); no hex,
  no NUMBERED Tailwind palette. `bg-black/10` and `bg-white` pass, because they are upstream's own
  scrim vocabulary (the modal backdrops). Our own photo overlays read the theme-invariant `scrim` /
  `scrim-foreground` pair (`bg-scrim/40 text-scrim-foreground`, via `tile-overlay`), never raw
  black and white. There is no surface ladder: `background` → `card`/`popover`/`sidebar` → `muted`
  (well, track, skeleton) → `accent` (hover). `muted`, `accent` and `secondary` share one value and
  are all kept, so a consumer can retune one role without moving the others.
- **Status colour has two inks** — `<family>-foreground` on the solid fill, `<family>-text` on the
  page and on the family's own `/10`–`/30` tint. Using the fill as text on its own tint measures
  3.98–4.35:1; `contrast-check.mjs` gates the `-text` role on every surface and every tint. **A
  tinted status surface therefore takes the `-text` ink, never the fill** (A11Y-13, MK 2026-09-18):
  Button's `destructive` variant, Badge's four tinted variants, Alert's status variants, Field's
  error copy and — since Batch 6 — Bubble's `destructive` variant and Attachment's error
  description. **The row is the rule, not the roster**: it reaches a soft status surface when the
  pair MEASURES under the AA floor A11Y-1 enforces, which is how Batch 2 extended it to Badge and
  how Batch 6 extended it to those two (3.987:1 for `text-destructive` on its own `/10` tint,
  4.116:1 for `text-destructive/80` on `card`; the `-text` ink reads 6.966:1 and 8.323:1 on the
  same composites). Each extension is flagged for MK rather than decided silently, and everything
  that MEASURES at or over the floor — Attachment's error ICON on its tint, at 3.973:1 against the
  3:1 non-text floor — stays upstream verbatim.
- **No focus rings anywhere, Tabs included** (FOC-13, MK 2026-09-25) — `base.css` owns the one focus cue: a
  subtle `accent`/50 background tint on every focusable element EXCEPT text entry, which takes no
  fill (FOC-14's text-entry exception below); the contenteditable document editor (TextEdit
  `document`) and the ghost Input are caret-only; forced colours restore the outline.
- **A border never changes colour on focus or while active** (FOC-14, MK 2026-09-26) — every
  control and wrapper keeps its resting `border-border`/`border-input` in every state: no
  `focus:`/`focus-visible:`/`focus-within:`/`data-focused:`/`data-popup-open:` border change.
  **Except text entry** (MK 2026-09-27): Input, Textarea, the bordered field groups framing a text
  control (InputGroup and its dependents, the combobox chips, the PanelSearch row), the Questionnaire
  answer, the InputOTP active slot and TextEdit `boxed` darken their border to `border-ring/50`
  with `duration-150 ease-out`, with no fill. Invalid keeps its destructive border focused or not
  (a `not-…invalid` guard on the focus class). `design-lint`'s `no-focus-border` rejects a focus
  border class outside that one shape in those files, and the geometry lane's focus sweep holds
  both halves. `design-lint`'s `no-focus-ring-glow` rejects `ring-3`,
  `ring-[3px]`, `ring-ring/NN`, `focus-visible:ring-*`, `focus-visible:outline-*`,
  `aria-invalid:ring-*` and `shadow-[0_0_0_…]` anywhere in `packages/ui/registry/**`.
- **Size, radius, shadow, z-index, alpha, opacity are plain Tailwind** — `h-8`, `size-4`,
  `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`. Radius derives from one
  `--radius` (0.625rem) exactly as upstream derives it. The `--size-*`, `--icon-*`, `--panel-width-*`,
  `--z-*`, `--alpha-*`, `--opacity-*` and `--shadow-overlay` families are deleted. **`z-50` is the
  single overlay band and DOM order decides within it, with exactly ONE sanctioned exception**
  (OVL-15, MK 2026-09-22): the Toast viewport and `ToastPositioner` sit at `z-60`, because the
  viewport mounts with the provider before any dialog exists, so DOM order cannot put a toast above
  a scrim it predates. `packages/ui/test/stacking.browser.test.tsx` pins both bands and the hit test
  that proves the ordering; a second `z-60` anywhere is a new MK decision, not a precedent to copy.
- **Type SIZES are Tailwind's stock scale; the METRICS on top of them are ours and global** — a
  `text-sm` is 14px and `text-base` 16px everywhere, including the docs shell, and the role
  utilities (`text-h1`…`h4`, `text-label*`, `text-code*`, `text-mono-label`, `text-display-*`) and
  the 400/500 weight ladder are gone, so `font-semibold` and `text-4xl` are ordinary utilities.
  **`tracking-tight` is NOT** (TYP-15, MK 2026-09-22): the `@theme` bridge declares per-size
  `--text-*--line-height` and `--text-*--letter-spacing` for the heading tier (`text-lg` and up,
  −0.012em at 18px to −0.06em at 72px) and holds the copy tier at zero, which is Geist's own
  copy/heading split. A local `tracking-*` beats the ramp through `var(--tw-tracking, …)`, so
  `design-lint`'s `raw-tracking` rejects every spelling but `tracking-widest` (the keyboard-shortcut
  hint), and `arbitrary-text-size` rejects `text-[13px]`, which can receive neither half of the
  ramp. **No uppercase** (TYP-7 = shadcn, `uppercase-transform`): sentence case everywhere, and a
  CSS transform is banned outright because it rewrites what it is handed — it once rendered the
  token name `--text-lg` as `--TEXT-LG`. `body` carries a declared 14px default (never on `html`,
  which would rescale every rem and override the reader's preference) and
  `-webkit-font-smoothing: antialiased`; the docs shell keeps 16px prose. Fonts stay Geist (TYP-10),
  and mono is for code — a label or a sentence is `font-sans`.
- **Motion pairs nothing** — `transition-all`, `transition-colors`, `duration-100` and `ease-in-out`
  are upstream's vocabulary and are legal. Our `duration-fast|base|slow` and
  `ease-standard|emphasized|exit|spring` tokens remain for the keyed-presence and docked utilities
  (`motion-pop-in`, `motion-enter-up`, `motion-shake`, `motion-flash`, `motion-dock-in/out`,
  `motion-indeterminate`), which are ours. The global reduced-motion reset in `base.css` is the one
  hand-written `!important` in token CSS, and a `motion-reduce:` restatement of it is still a violation;
  in component class strings Tailwind's `!` modifier is allowed only in the counted, upstream-verbatim
  cases `design-lint` lists in `IMPORTANT_MODIFIER_EXEMPTIONS`.
- **No page bounce on mouse and trackpad** (INT-12, MK 2026-09-30) — `base.css` sets
  `overscroll-behavior-y: none` on `html, body` under `@media (pointer: fine)`: no page-edge
  rubber-band, no scroll chaining from an inner scroller to the page. Vertical only (trackpad swipe
  back/forward keeps working); touch keeps pull-to-refresh. Don't restate it per page.
- **Structure and icons** — CVA for variants, `cn()` from `@vegastack/design`, `data-*` for state,
  ref-as-prop (React 19 — never `React.forwardRef`), and Base UI `render` for composition, where a
  single-polymorphic-root component must not `Omit<…, 'render'>`. Icons are `lucide-react`, the
  lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon` — no other library, no inline `<svg>`
  as an icon.
- **Responsive and layout** — `min-w-0` on a truncating flex child with `truncate` on an inner span,
  never on the same element as `flex`; touch targets ≥24px via an invisible hit area, verified with a
  real `elementFromPoint` probe rather than `getComputedStyle`.
- **Public API documentation** — every component that is OURS carries JSDoc plus an `@example` on
  each exported part, checked by `tooling/verify-public-api-docs.mjs`. An **upstream-backed**
  component is exempt and documents its API on its docs page instead: upstream ships no JSDoc, and
  adding it would be a patch hunk with no decision ID behind it. **That boundary is derived, never
  listed** (2026-09-18): `tooling/upstream/lib.mjs`'s `migrated()` reads
  `vendor/shadcn/<cli>/ui/*.tsx`, minus the `exempt` record in `packages/ui/upstream/migrated.json`
  — so a name is exempt here exactly while upstream ships a file for it, and is under the parity and
  variant-coverage gates for exactly as long. Editing a JSON array used to move all three at once,
  silently.
- **Server-safe by default** — a _runtime_ claim enforced by `tooling/verify-rsc-safety.mjs`: under
  the `react-server` condition most React hooks are `undefined`, so touching one without
  `'use client'` throws on import in an RSC. Which hooks, and why `@vegastack/design/theme-scope` is a
  separate subpath: `component` skill § 3.
- **Accessibility** — WCAG 2.2 AA while preserving every existing 2.1 assertion; visible
  `:focus-visible` background tint (text entry: a subtle border change and no fill, FOC-14), enforced per control by the
  geometry lane, which rejects the user agent's own ring (`outline-style: auto`) by name; must pass
  `axe`; every applicable state implemented — default, hover, focus, loading, empty, error, success,
  disabled.

## Docs authoring

A component page is part of the component, not a follow-up, and it serves humans and agents from the same source. **The page canon — section order, what each section must contain, and which authority generates it — is `design.md` § Docs canon**; read that table before writing or changing a page. Not negotiable from anywhere: sections appear in the canon's order and Do/Don't is final; the machine-readable half of a section is generated (`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`), never typed; an API table lists own props only, expanded, with the literal union, and a part with no own props gets one sentence rather than placeholder rows; the Story explorer appears only where no curated playground does (DD-3). Register the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the barrel, and add the component's record to `component-contracts.json`. No `{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs` enforces the canon itself — row 0's frontmatter (`registry` is required and is never inferred from the slug; `status` and `since` are contract-owned, generated by `pnpm design:derived`, and must match `component-contracts.json`), the section vocabulary and order, the closing section, and generated-not-typed sections — with a `--self-test` that observes each rule failing. **Canon row 10, `Deviations`, closes a page for a component the shadcn reset has put back on upstream** (Batch 2, 2026-09-18): one bullet per decision ID its patch implements, and nothing after it. Do/Don't closes every other page. The section list of a reset page mirrors upstream's own docs page, which `tooling/upstream/verify-variant-coverage.mjs` holds it to; it also rejects skipped visual tests. `tooling/verify-docs-export.mjs` owns the DD-3 Explorer policy (never both, always wrapped, always under `## Playground`) and rejects a page whose markdown export still carries JSX or an empty API table. **A BLOCK page is not under that canon** (Batch 8, 2026-09-18): a block has no prop surface to document, so its page lives in `apps/docs/content/docs/blocks/`, carries `registry`/`preview` frontmatter and a free section list, and `content-lint`'s canon applies only to `apps/docs/content/docs/components/`. The 68 ported chart blocks share SEVEN family gallery pages (`charts-area` … `charts-tooltip`) rather than a page each — the same shared-surface exemption the 467 animated icons carry, recorded in `component-contracts.json` § modeledExemptions and reconciled member by member by `verify-component-contracts.mjs`. Guides live in `apps/docs/content/docs/guides/`; unlisted/noindex operations guides live in `apps/docs/content/internal/` and are public by policy though excluded from discovery.
