# Gap Analysis — what the requirement doc still misses

> **Amendment (2026-07-18):** the public npm layer was consolidated to `@vegastack/design` +
> zero-dep `@vegastack/design-tokens` (MK-approved — `docs/plans/package-consolidation.md`). Where this
> document names `@vegastack/tailwind-preset` / `@vegastack/utils` / `@vegastack/icons`, read
> `@vegastack/design` (icons via `@vegastack/design/icons`); where it names `@vegastack/tokens`,
> read `@vegastack/design-tokens`. Preserved as the historical record.

|              |                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Adversarial sweep of [`requirements.md`](requirements.md) to surface every unspecced/undecided area before the plan. Nothing should reach the build half-defined. |
| **Date**     | 2026-06-20                                                                                                                                                        |
| **Status**   | Open — gaps below feed new requirement decisions (some need MK; most have a recommendation).                                                                      |
| **Severity** | 🔴 blocker / cost-landmine · 🟠 important · 🟡 should-decide                                                                                                      |

Verified 2026 facts used below are cited inline. The original requirement doc covered: primitives, distribution, tokens (color/space/radius/type), theming/override, Tailwind boundary, repo layout, component standards, page template, showcase, release, skills, inventory, phasing. The gaps are everything else a real design system needs.

---

## A. Foundations not yet specced

### G1 🔴 Icons — `@vegastack/icons` is named but undefined

**Gap:** §6 lists `@vegastack/icons` but no strategy: how lucide ships, tree-shaking, an `Icon` wrapper, sizing/stroke standard, brand/OAuth icons, or animated icons. The platform uses `lucide-react ^0.555.0` and **already consumes `@lucide-animated`**.
**Facts:** `@lucide-animated` ([lucide-animated.com](https://lucide-animated.com/), pqoqubbw/icons) is **MIT**, 350+ animated React icons built on **`motion`**, distributed as a **shadcn registry** (copy-in; auto-installs `motion`). lucide-react is tree-shakable with per-icon imports.
**Recommendation:**

- Static icons: standardize on **lucide-react**, re-exported through a thin `Icon`/sizing convention (size tokens `14/16/20/24`, `strokeWidth` default, `currentColor`, `aria-hidden` unless labeled). Decide package-reexport vs peer-dep + convention.
- Animated icons: **mirror selected `@lucide-animated` icons into our own `@vegastack` registry** (copy-in, MIT) so they're versioned with us and pull `motion` only when used.
- Brand/custom (logos, OAuth) → a generated `@vegastack/icons` set from SVG source.
  **Decision needed:** icons as a package vs registry vs peer-dep+convention; adopt animated icons in v1 or later.

### G2 🟠 Animation/motion — no strategy, no motion tokens

**Gap:** §7 mentions CVA/classes but nothing on motion. Platform uses `framer-motion ^12` + ad-hoc CSS keyframes. Owner wants _subtle only_ (success bounce, error shake, warning pulse; no button-hover animation).
**Facts:** `framer-motion` is now **`motion`** (`motion/react`), v12 ([motion.dev](https://motion.dev/docs/react-upgrade-guide)). shadcn on Tailwind v4 uses **`tw-animate-css`** (not `tailwindcss-animate`) ([shadcn](https://ui.shadcn.com/docs/tailwind-v4)). **Base UI ships built-in `data-starting-style`/`data-ending-style` CSS transitions** for overlays — cancellable, no JS lib needed ([base-ui animation](https://base-ui.com/react/handbook/animation)).
**Recommendation (tiered, so a Button never pulls a JS lib):**

1. **Default = CSS** via `tw-animate-css` + Base UI transition attributes for enter/exit (dialogs, popovers, dropdowns, toasts).
2. **Motion design tokens** in DTCG/CSS vars: `--duration-{fast,base,slow}`, `--ease-{standard,emphasized,exit}`. Migrate the existing `statusFadeIn/ScaleIn/Spin` + status animations to token-driven keyframes.
3. **`motion` (the lib) only where genuinely needed** (animated icons, complex micro-interactions) — as an **optional peer dep**, pulled in only by components that use it.
4. **`prefers-reduced-motion`** baked in globally (CSS) as a hard a11y requirement.
   **Decision needed:** confirm CSS-first + motion-as-optional-peer; whether `motion` is allowed at all in v1.

### G3 🟠 Fonts — loading/distribution undefined

**Gap:** Geist + Lora named, but no story for _how fonts load consistently across consumers_ (Next and non-Next). FOUT/FOIT, variable fonts, self-host vs Google Fonts (Lora) vs `geist` npm vs shadcn `registry:font`.
**Recommendation:** self-host all faces (Geist via `geist` pkg or static; Lora as woff2) shipped/declared by the token layer; tokens own `--font-{sans,mono,serif}`; document framework-agnostic `@font-face` + a Next `next/font` path. Consider `registry:font` for one-command install.
**Decision needed:** `@vegastack/fonts` package vs registry:font vs document-only; keep Lora for headings?

### G4 🟠 Dark mode + theme runtime — mechanism unspecced

**Gap:** §5 covers token _values_ (`.dark`) but not the _runtime_: how dark mode is toggled, FOUC prevention, system preference, multi-theme. Tailwind v4 changed dark-variant config.
**Recommendation:** Tailwind v4 `@custom-variant dark` + a `data-theme`/class on `<html>`; ship/recommend `next-themes` wiring with an inline anti-flash script; design tokens via `data-theme="<name>"` to allow multi/per-client themes coexisting with the one-file override. The DS documents this in the consume skill.
**Decision needed:** class vs `data-theme`; ship a ThemeProvider or document-only.

### G5 🟡 Token system scope — only color/space/radius/type covered

**Gap:** No tokens for **motion (G2), icon sizes (G1), z-index/layering (G14), breakpoints, elevation/shadow**. "Borders-only, no shadows" is stated, but overlays usually need _some_ elevation — confirm or define an elevation scale (even if border-based).
**Recommendation:** extend the DTCG token set with motion, z-index, breakpoint, and (if any) elevation tokens. Confirm borders-only holds for floating surfaces.

---

## B. Component architecture gaps

### G6 🔴 The "knobs" / extensibility contract is never defined

**Gap:** The whole premise is "downstream has the right knobs," but no doc says _what knobs each component exposes_. Without a contract, knobs are ad-hoc per component.
**Recommendation:** define a **standard extensibility contract** every component honors: `className` passthrough (merged via `cn`), `render`/`asChild` for polymorphism, variant/size props via CVA, `data-*` for state styling, forwarded refs, and explicit slot props for compound parts. Document it once; the audit skill enforces it.
**Decision needed:** ratify the contract.

### G7 🔴 App-coupled vs presentational separation — blocks the port

**Gap:** Several Vega components are coupled to app infra: **VegaAvatar/R2Image** resolve Cloudflare R2 URLs; **VegaUser/Agent/TeamHoverCard** resolve IDs → user data; **CommandMenu** wires app routes; **AutoSaveInput** hits app save. A design system must ship the **presentational core**, not app data-fetching.
**Recommendation:** adopt the **headless/presentational split** — DS ships pure presentational components (Avatar takes `src`/`fallback`; HoverCard takes resolved content); the **app keeps the data-fetching wrapper** (R2 resolution, ID lookups). Document which ~10 components split this way.
**Decision needed:** confirm the split policy + per-component handling (affects the inventory in §12).

### G8 🔴 `VegaTextEdit` / rich text — Tiptap licensing cost-landmine

**Gap:** §12 lists TextEdit as an "npm-exception candidate" but doesn't address that it's the riskiest component. The editor + extensions are **MIT/free**, but **collaboration, comments, and version history require paid Tiptap Cloud (~$149/mo+)** ([tiptap pricing](https://tiptap.dev/pricing)). Self-hosted Yjs collab is free; Cloud "documents" are not.
**Recommendation:** ship a **free-tier TextEdit** (editing, markdown, mentions, slash, drag-handle — all MIT). Treat **collaboration as an opt-in app-level concern** (self-hosted Yjs, free) — keep it OUT of the DS default. Flag the cost explicitly so no one accidentally adopts Tiptap Cloud.
**Decision needed:** is rich-text in the DS at all in v1, free-tier only, or deferred?

### G9 🟠 Provider components & required downstream setup

**Gap:** Overlays/toasts/tooltips/theme need root providers (ThemeProvider, Toaster/Sonner, TooltipProvider, Base UI DirectionProvider for RTL). Never enumerated.
**Recommendation:** ship a documented provider set (or a single `<VegaStackProvider>`) + a consume-skill step that wires them into the app root.

### G10 🟠 Form integration pattern unspecced

**Gap:** Field/Input/Select/Checkbox exist but no story for form state + validation. Base UI has Field/Fieldset/Form primitives.
**Recommendation:** standardize on Base UI Field/Form + **react-hook-form + Zod** (platform already uses Zod 4); document the canonical form composition + error wiring (`aria-describedby`, like resend's TextField.Error).
**Decision needed:** react-hook-form vs TanStack Form.

### G11 🟠 RSC / client-boundary policy

**Gap:** No policy on server vs client. Base UI interactive components are **`'use client'`** (RSC-composable) ([base-ui RSC fixes](https://base-ui.com/react/overview/releases)).
**Recommendation:** adopt resend's rule — server-safe by default, `'use client'` only at the lowest interactive leaf; label each component's boundary in its docs/meta so RSC-first consumers know.

### G12 🟡 Composite/heavy components (DataList, Command) — headless vs styled + deps

**Gap:** DataList pulls dnd-kit, sorting, Kanban; Command pulls cmdk. Bundling deps into the registry item vs leaving them to the consumer is undecided.
**Recommendation:** declare each composite's deps as `registryDependencies`/npm deps explicitly; keep them registry copy-in so consumers can trim features.

---

## C. Quality & engineering gaps

### G13 🟠 Testing strategy — only "Storybook deferred" is mentioned

**Gap:** No test plan for v1. Without Storybook we still need correctness + a11y + visual safety.
**Recommendation:** **Vitest + @testing-library/react** (component behavior), **vitest-axe/axe-core** (automated a11y) on every PR, and **Playwright `toHaveScreenshot`** for lightweight visual regression on the showcase previews (no Storybook needed). Wire into Turborepo `test` + CI.
**Decision needed:** visual-regression now (Playwright) vs defer with Storybook.

### G14 🟠 Accessibility program — beyond the focus-visible fix

**Gap:** §7.5 fixes the `outline:none` defect, but there's no a11y _program_: WCAG target, automated checks, keyboard/SR/reduced-motion/contrast/RTL.
**Recommendation:** declare **WCAG 2.1 AA**; axe in CI (G13); keyboard-interaction tables in every component page (template §8); `prefers-reduced-motion` (G2); contrast audit in the refine-pass (§7.5); RTL via logical properties + DirectionProvider (G9).

### G15 🟡 Z-index / portal / stacking strategy

**Gap:** Multiple overlays (dialog, popover, tooltip, dropdown, drawer, toast) need coherent layering; undefined.
**Recommendation:** a z-index token scale + consistent portal usage; document stacking order.

### G16 🟡 CSS `@layer` ordering across the boundary

**Gap:** Distributed classes can clash with consumer styles without a layer strategy.
**Recommendation:** define `@layer theme, base, components, utilities` order; ship component classes in the right layer so consumer utilities win predictably.

### G17 🟡 TypeScript / JSDoc discipline for auto prop tables

**Gap:** The showcase auto-generates props via `react-docgen-typescript` — which **requires JSDoc on props** or tables are empty/wrong.
**Recommendation:** mandate JSDoc on all public props + exported prop types; lint for it. This also feeds agent `meta.whenToUse`.

### G18 🟡 Design-lint rules (the audit skill's actual rules)

**Gap:** §11 names `vegastack-design-audit` but not its rule set.
**Recommendation:** port resend's rubric — no raw hex/px, no deprecated palettes, no raw `<button>/<input>`, prefer semantic tokens, `use-state-prop`. Ship as both the audit skill AND an ESLint plugin in `@vegastack/eslint-config`.

### G19 🟡 Performance / bundle budget; G20 browser support (OKLCH); G21 security (DOMPurify, dep audit)

**Gap:** No bundle-size budget / tree-shaking verification; no stated browser matrix (OKLCH needs modern browsers); no security note (rich-text XSS → DOMPurify, dependency audit).
**Recommendation:** set a per-component size budget + `size-limit` check; declare a modern-browser matrix with OKLCH fallback note; require DOMPurify in any HTML-rendering component + `pnpm audit`/Renovate.

---

## D. Distribution / release gaps

### G22 🟠 Is there an importable `@vegastack/ui` npm package, or registry-only?

**Gap:** §6 has `packages/ui` as _source + registry_, but it's ambiguous whether consumers can also `import { Button } from "@vegastack/ui"`. The hybrid says components→registry, but "locked" components→npm — so the package's role must be explicit.
**Recommendation:** registry is the default consumption path; publish `@vegastack/ui` as an npm package **only for the locked/exception components** (G7/G8 candidates). State this clearly.
**Decision needed:** confirm.

### G23 🟠 Registry versioning — how does a consumer know which version it pulled?

**Gap:** Copied-in code has no lockfile. The honest limit (research) is registry updates don't auto-propagate; consumers can't easily tell they're stale.
**Recommendation:** stamp a version/hash comment header into generated component files; the audit skill flags drift vs the latest registry; document the `shadcn add --diff` update flow.

### G24 🟠 vegastack-platform migration (P4) is thin

**Gap:** "Migrate the platform" is one line, but it's the hardest real test (app-coupled extraction G7, the platform wrapper/shadcn inventory, live app).
**Recommendation:** a dedicated migration sub-plan — parallel adoption (new code uses `@vegastack`, old coexists), codemods, the presentational/app split, component-by-component cutover. Write it when P4 nears.

### G25 🟡 i18n / RTL in components

**Gap:** next-intl is app-level; DS components take string props (good) but RTL needs logical properties + DirectionProvider; locale-aware components (DatePicker, number/date formatting) undefined.
**Recommendation:** components use CSS logical properties + Base UI DirectionProvider; locale formatting stays app-injected via props.

### G26 🟡 Changelog / deprecation surfacing in the showcase

**Gap:** Release notes + per-component deprecation aren't surfaced to consumers/agents.
**Recommendation:** generate a changelog page from Changesets; show stability/deprecation badges on component pages + in registry `meta`.

### G27 🟡 Contribution governance

**Gap:** No owner/process for approving new components, design review, or the "refine then lock" sign-off.
**Recommendation:** define a lightweight gate — design review + a11y check + the authoring-skill checklist before a component is published.

---

## E. Showcase gaps

### G28 🟠 Foundations pages missing from the showcase spec

**Gap:** §8 specs per-component pages only. A design system showcase needs **foundations**: principles, colors/tokens, typography, spacing, motion, icons, accessibility, theming.
**Recommendation:** add a Foundations section to the Fumadocs IA (mirrors the platform's `colors`/`fonts` pages, expanded).

### G29 🟡 Getting-started / theming / migration guides

**Gap:** No consumer-facing guides specced (install, theme override, upgrade, codemods).
**Recommendation:** add Guides section; the consume skill and these guides share one source.

### G30 🟡 Live-preview build wiring + llms.txt generation

**Gap:** "Live previews" is stated but not _how_ the showcase imports/renders real component source, nor how `llms.txt`/`llms-full.txt` are generated for a static export.
**Recommendation:** previews import from `packages/ui` source (so the page tests the shipped code); generate `llms.txt` at build time.

---

## F. Process / meta gaps

### G31 🟡 Design source of truth (Figma) + DTCG sync direction

**Gap:** DTCG enables Figma sync, but is Figma the source or is code? Undefined.
**Recommendation:** declare **code (DTCG JSON) as the source of truth** in v1; Figma sync optional/later.

### G32 🟡 Open questions from requirements still unresolved

O1 (drop `Vega*` prefix?), O2 (DataList/TextEdit placement — now informed by G7/G8), O3 (DTCG coverage), O4 (repo suffix), O6 (white-label scope). These remain.

### G33 🟡 Licensing register

**Gap:** Internal, but dependency licenses unaudited.
**Recommendation:** keep a license register; Base UI MIT, lucide MIT, lucide-animated MIT, **Tiptap MIT core but Cloud paid (G8)**, motion MIT.

---

## Resolved (2026-06-20 — MK decisions)

- **G1 Icons → three sanctioned sources + one convention.** (a) **lucide-react** for functional UI icons via an `Icon` primitive (size tokens `xs14/sm16/md20/lg24`, default strokeWidth, `currentColor`, `aria-hidden` unless labeled — themes downstream automatically). (b) **lucide-animated** (MIT, motion-based) mirrored into our own registry as copy-in items, `motion` pulled only when used. (c) **thesvg** (`thesvg` npm, MIT, tree-shakeable, +MCP) for brand/logo/integration icons via a `BrandIcon` convention (default = brand color; `variant="mono"` inherits `currentColor`) — replaces the platform's `OAuthIcons` + `logos/`. **Enforcement:** ESLint rule + design-audit reject any icon import outside these three and any inline `<svg>` icon; AGENTS.md/skills constrain agents to `Icon`/`BrandIcon`. A Fumadocs **Icons foundation page** documents + searches all three. `@vegastack/icons` = `Icon` + `BrandIcon` + animated registry items + lint rule + docs (not a giant re-export).
- **G2 Motion → CSS-first, `motion` optional peer.** Default = `tw-animate-css` + Base UI built-in `data-starting-style`/`data-ending-style` transitions (overlays animate with no JS). Motion tokens (`--duration-*`, `--ease-*`) in DTCG. `motion` (`motion/react`) only where genuinely needed (animated icons, rich micro-interactions), as an optional peer dep. `prefers-reduced-motion` baked in globally.
- **G7 App-coupled → presentational core only.** DS ships pure presentational components; the app keeps data-fetching wrappers (R2 URL resolution, ID→user/agent/team lookups, route wiring, autosave persistence). ~10 components split this way (see requirements §12).
- **G8 Rich text → 100% OSS, collab-optional, two registry items.** `@vegastack/text-edit` (base, Tiptap MIT, StarterKit history ON, no Yjs) + `@vegastack/text-edit-collab` (adds `@tiptap/extension-collaboration` + `@tiptap/y-tiptap` + `yjs` + provider; StarterKit history OFF, Yjs owns undo/redo). Backend = self-hosted **Hocuspocus** (MIT, runs on Node/Bun/Deno/CF Workers) or y-websocket — **no Tiptap Cloud**. Persistence + the Yjs server stay app-side; Tiptap Comments / managed version-history (paid Cloud) are excluded.
- **G3 Fonts → keep Geist + Lora, self-hosted via tokens.** Geist Sans/Mono (body/code) + Lora serif (headings, no font-bold). Self-host all faces; tokens own `--font-{sans,mono,serif}`; document a Next `next/font` path. Serif-heading choice revisited only in the identity refine-pass (§7.5).
- **G4 Dark mode → next-themes + class, in `<VegaStackProvider>`.** Class-based dark mode (anti-flash inline script, system preference) bundled in the provider; structured so `data-theme` multi-theme/per-client can be added later without rework. Tailwind v4 `@custom-variant dark`.
- **G10 Forms → react-hook-form + Zod.** Standardize Base UI Field/Form composition with react-hook-form + Zod (platform already on Zod 4); document the canonical form + error-wiring pattern (`aria-describedby`).
- **G13 Testing → Vitest + axe + Playwright VRT from day one.** Vitest + @testing-library (behavior), vitest-axe/axe-core (a11y), Playwright `toHaveScreenshot` (visual regression on showcase previews) — all in CI per PR. No Storybook needed for v1.
- **Locked as recommended defaults (no objection):** G6 knobs contract (className passthrough + render/asChild + CVA + data-* + forwarded refs + slot props) · G9 single root wrapper **`<VegaStackProvider>`** (theme+toast+tooltip+direction) + theme toggle hook **`useVegaStackTheme()`** (wraps next-themes) · G11 server-default, `'use client'` at the leaf · G15 z-index token scale · G16 `@layer theme, base, components, utilities` · G22 registry-default, npm only for locked components · G23 version/hash header stamped into generated files + audit drift detection.

### Codex adversarial-review resolutions (2026-06-21)

- **F1 — false propagation + token/component drift → FIXED.** "Instant npm auto-propagate, zero changes" language removed (requirements §4.2). New **token stability policy (§5.4):** additive-only within a major; per-component token-version binding (registry items pin `@vegastack/design-tokens` range); version/hash header + design-audit drift detection; Renovate auto-PRs; token changelog + deprecation table.
- **F2 — VRT deferred vs day-one → FIXED.** Only **Storybook** is deferred; **visual regression (Vitest+axe+Playwright) is day-one** (requirements §7.7, §8.4, NG2).
- **F3 — TextEdit resolved/unresolved contradiction → FIXED.** One source of truth: `text-edit` base = registry v1; `text-edit-collab` = deferred (F4). Reconciled in §12, §13/P3, O2.
- **F4 — collab lacks tenant isolation/data integrity → DEFERRED.** `text-edit-collab` is **out of v1** until a collaboration-adapter contract is specced: authenticated doc namespace, tenant-scoped provider factory, binary Y.Doc persistence, reconnect/idempotency, reconnect/concurrent-edit tests.
- **F5 — registry auth lifecycle + external consumers → RESOLVED.** Internal = one shared CF Access token (owner, rotation, revocation runbook, CI-secret storage; `/r/*.json` on a tighter policy). **External/client = tokenless:** public npm token layer + components copied in by us during dev → zero VegaStack creds in the shipped app/CI. **Availability:** no runtime/always-on dependency — copy-in + public token layer ⇒ shipped apps build/run offline (requirements §8.5, §9.4).
- **Additional gaps resolved:** registry **content hashes + integrity manifest** (§8.5/§9.1); **per-component quality contract** (all UI states + knobs + a11y) **CI-gated** (§7.6); **migration + implementation plan written now** in `/docs/plans/`, revised after the Fumadocs showcase is deployed to Cloudflare (§13 checkpoint).

### Codex adversarial-review #2 — plan-level (2026-06-21, all 8 FIXED)

Run against the full command-level plan (`plans/*`). 8 execution-blockers, all patched:

- **R2-F1** — token TS/JSON build globbed light+dark into one dictionary (name collision). Now a non-colliding `{ light, dark }` model from two filtered runs + a duplicate-key assertion (detail/02 §2).
- **R2-F2** — package `exports` pointed at uncompiled `tokens.js`/`.d.ts`; one template reused for 4 packages. Added a `tsup` compile step + a distinct per-package build/export table (detail/01 §4).
- **R2-F3** — override docs targeted `--color-*` (the build-inlined bridge), not the runtime var. Fixed: override `--primary`/`--background` (requirements §5.2 + ASCII; matches detail/02).
- **R2-F4** — "integrity verified before write" was overclaimed. Now hashes the WHOLE canonical item + a real **fail-closed consume preflight** before `shadcn add` + post-write re-hash, with an honest-scope caveat (detail/04 §3; requirements §8.5/§9.1).
- **R2-F5** — CI didn't enforce the stated gate. Added `fetch-depth: 0` + `registry:build` + a stale-registry `git diff --exit-code` (detail/01 §6; detail/05 §ci).
- **R2-F6** — Fumadocs `@source` path was one `../` too shallow. Fixed to `../../../packages/ui/...` + an only-if-workspace-import note (detail/03 §9).
- **R2-F7** — llms route imported an undefined `@/lib/source-urls`. `getPageMarkdownUrl` now defined in `lib/source.ts` (detail/03 §3/§8).
- **R2-F8 (superseded 2026-07-22)** — the original correction split human SSO from machine Service Auth. The approved public-docs topology now makes `/` + `/docs/*` anonymous, moves operational pages under `/internal/*` SSO, and retains `/r/*` as service-token-only. Public discovery artifacts are generated from the public loader only; the deployment probe tests all three boundaries (`docs/plans/public-docs-cutover.md`; requirements §8.5).

### Codex adversarial-review #3 — line-by-line vs the real repo (2026-06-21, all 10 FIXED)

Strictest pass (ran code against `references/fumadocs`, `import()`-ed Base UI). 10 execution-blockers, all patched:

- **R3-F1** CI stale-registry check ignored UNTRACKED new JSON → `test -z "$(git status --porcelain -- apps/docs/public/r)"` (detail/01 §6).
- **R3-F2** integrity had no trust root → **Sigstore keyless signing (GitHub OIDC)** of the manifest + a signature-verifying consume preflight pinning the workflow identity (detail/04 §3; requirements §8.5). _(MK chose signing over honest-downgrade.)_
- **R3-F3** `@vegastack/design-tokens/base.css` imported but not built/exported → authored in `src/`, copied to `dist/`, added to `exports`+`files` (detail/01 §4; detail/02 §2).
- **R3-F4** tokens pkg had no `build` script + `tsup` unpinned → script renamed to `build`; `tsup` pinned in the matrix + per-package `build` table (detail/01 §4; detail/02 §2).
- **R3-F5** CI called undefined `pnpm registry:build` + path ambiguity → root `registry:build` script added at `packages/ui/registry.json` (detail/01 §2).
- **R3-F6** preview imported undefined `@vegastack/ui/button` → copy-in import `@/components/ui/button` (docs dogfoods the registry; no `@source`) (detail/03 §4).
- **R3-F7** cyclic `--font-sans: var(--font-sans)` / `--ease-standard: var(--ease-standard)` → distinct runtime names `--font-family-*` / `--motion-ease-*` bridged to Tailwind `--font-*`/`--ease-*` (detail/02 §1–§3, §5).
- **R3-F8** `--src false` invalid flag → removed (detail/03 §2).
- **R3-F9** requirements §8.2 still said `react-docgen-typescript` → Fumadocs `AutoTypeTable` (requirements §8.2).
- **R3-F10** requirements header still said private GitHub Packages → public npmjs for the non-sensitive layer (requirements header).

### Handoff decisions (2026-06-21 — pre-autonomous-build)

- **O1 → Model A (own it, drop prefix):** components export unprefixed (`Button`); no pristine-shadcn tier; the maintenance skill surfaces `shadcn add --diff` upstream changes for cherry-pick (requirements §7.1).
- **O3 → full existing OKLCH token set** ported + normalized to primitive/semantic (research catalog).
- **O5 → `vegastack-brand` is a stub** until marketing assets (P3/P5; not a P0/P1 blocker).
- **Autonomy = build LOCAL, stop at publish/deploy:** the agent proves everything locally (incl. a local registry + scratch-consumer `shadcn add`); the user provisions accounts/secrets and triggers the first real publish + CF deploy.
- **Identity refine-pass = mechanical/a11y only** (fix `:focus-visible`, dark values, AA, token-name normalization); no subjective redesign.
- **Repo name = MK-set** at creation (`vegastack-design` working default).
- **Handoff doc written:** [`plans/00-START-HERE.md`](plans/00-START-HERE.md) (orientation + provisioning checklist for the fresh session).

## Priority triage

| Must resolve before the plan (🔴)                                                      | Resolve during P0/P1 (🟠)                                                                                                                                                                                             | Track, decide in-flight (🟡)       |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| G1 Icons strategy · G6 Knobs contract · G7 App-coupled split · G8 Tiptap/TextEdit fate | G2 Motion · G3 Fonts · G4 Dark-mode runtime · G9 Providers · G10 Forms · G11 RSC policy · G13 Testing · G14 A11y program · G22 ui-package role · G23 Registry versioning · G24 Migration plan · G28 Foundations pages | G5, G12, G15–G21, G25–G27, G29–G33 |

The 🔴 four reshape the component inventory and the port; everything in §12 of requirements should be revisited once they're decided.
