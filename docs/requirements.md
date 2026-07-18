# VegaStack Design System — Requirement Document

| | |
|---|---|
| **Project** | `vegastack-design` (internal design system + design skills) |
| **Repo** | `github.com/VegaStack/vegastack-design` (private) |
| **npm scope** | `@vegastack/*` — **public npmjs** for tokens/preset/utils/icons (external consumers need no creds); component source stays private via the registry. GitHub Packages = optional internal mirror only (Codex F10) |
| **Registry namespace** | `@vegastack` (private shadcn registry) |
| **Status** | v1.1 — Codex adversarial review reconciled (F1–F5; see [gap-analysis.md](gap-analysis.md) Resolved) |
| **Author** | MK (mk@vegastack.com) |
| **Date** | 2026-06-21 |
| **Next artifact** | Implementation + migration plan (`/docs/plans/`) — being written now |

> This document captures **what** we are building and **why**, with every load-bearing decision locked and justified. It has been reconciled against the Codex adversarial review (findings F1–F5) and the gap analysis. The step-by-step build plan lives in [`/docs/plans/`](plans/).

---

## 1. Purpose & vision

**One design system, maintained in one place, consumed by every VegaStack project — for both humans and AI coding agents (Claude Code, Codex) — where downstream projects receive updates without making local changes, yet retain the right knobs to customize.**

Today the real design system (the platform's `Vega*` wrappers plus shadcn primitives, OKLCH token set, Tailwind v4, and a `/components` showcase) lives **inside** `engg-vegastack-platform`. It cannot be reused by other repos without copy-paste drift. This project extracts it into a standalone, versioned, agent-native system.

**North star:** any VegaStack repo — existing or greenfield — can run `shadcn init` + `npx shadcn add @vegastack/<component>`, get on-brand components instantly, theme them through one file, and have agents build correctly against them. Brand/token changes propagate centrally; component customization stays local and safe.

---

## 2. Goals & non-goals

### Goals
- **G1** — Single source of truth for components, tokens, theme, and usage knowledge.
- **G2** — Downstream gets **token/brand updates propagated via dependency PRs** (npm + Renovate, **additive-only** so a token release can never break stale component copies — §5.4), **component updates safely/pull-based** (registry, with drift detection), and **never suffers a silent breaking change**.
- **G3** — **Agent-native**: Claude Code & Codex can discover, select, install, read, and edit components correctly.
- **G4** — A **visual showcase** (Fumadocs) that documents every component with live previews, all variants, props/API, and do/don't — the recreation of the current `/components` page, productized.
- **G5** — **Reversible foundation**: the primitive layer (Base UI) is swappable without rewriting consumer code.
- **G6** — **Self-maintaining workflow**: skills to add/update/release components in a standard shape so contributions are never ad-hoc and releases never break consumers.

### Non-goals (v1)
- **NG1** — Not migrating `engg-vegastack-platform` to consume the package in v1 (greenfield first; platform is the *first* migration after the system is proven — see §13).
- **NG2** — No **Storybook** in v1 (deferred — §8.4). **Visual-regression testing is NOT deferred** — it's day-one via Playwright (§7.7, gap G13); only the Storybook/Chromatic *workbench* is later.
- **NG3** — No native/mobile token targets in v1 (DTCG keeps the door open; web/Tailwind is the only build target now).
- **NG4** — *Revised (F5):* the **non-sensitive layer** (`@vegastack/design-tokens`, `/tailwind-preset`, `/utils`, `/icons` — CSS vars + helpers, no IP) is published as **public npm** so external/client projects consume it with **zero VegaStack credentials**. **Component source stays private** (registry, copy-in — not published openly). See §9.4.
- **NG5** — Client/white-label theming is **designed-for but not a v1 deliverable** (the token-override model supports it; we won't ship a separate white-label theme yet).

---

## 3. Locked decisions (decision log)

Each row is a decision made during the requirements interview, with the rejected alternative and the reason.

> **Amendment (2026-07-18, MK-approved — `docs/plans/package-consolidation.md`):** the public npm
> layer is consolidated from four packages to **two**: **`@vegastack/design`** (cn utility + icon
> runtime at `./icons` + Tailwind preset at `./preset`/`./preset.css` + the `vegastack-design` CLI +
> CSS re-exports of the token layer) and the zero-dependency **`@vegastack/design-tokens`** (kept separate
> as the portable design contract for non-React/non-Tailwind consumers). Everywhere this document
> names `@vegastack/tailwind-preset`, `@vegastack/utils`, or `@vegastack/icons`, read
> `@vegastack/design` (icons via the `@vegastack/design/icons` subpath); where it names
> `@vegastack/tokens`, read `@vegastack/design-tokens` (renamed same day). The hybrid
> npm + private-registry model, copy-in component distribution, and everything else in this log
> stand unchanged. This section is otherwise preserved as the historical record.

| # | Decision | Chosen | Rejected alternative | Why |
|---|---|---|---|---|
| D1 | **Primitive foundation** | **Base UI** (`@base-ui/react`) via shadcn abstraction | Stay on Radix · prototype both | Built by Radix+MUI+Floating-UI creators; stable v1 (Dec 2025), monthly releases; fills Radix gaps (Combobox, multi-select). shadcn makes it swappable → reversible. Radix kept as documented fallback. |
| D2 | **Distribution** | **Hybrid**: npm packages (tokens/utils/preset/icons — **public**) + **private** shadcn **registry** (components, copy-in) | npm-only · registry-only | npm layer propagates brand via dependency PRs (additive-only, §5.4); registry gives copy-in ownership + agent-editability + per-project knobs. Public token layer ⇒ external projects need no creds (§9.4). |
| D3 | **Source of truth** | **Greenfield** in `vegastack-design`, migrate platform later | Extract-and-consume now · mirror | Lower immediate risk; build clean, prove the pipeline, then cut platform over. |
| D4 | **Naming / scope** | `@vegastack/*`, repo `vegastack-design` | Keep `Vega*` brand · neutral white-label | Company-scoped is clearest for an org-wide standard across all repos. |
| D5 | **Token authoring** | **DTCG JSON + Style Dictionary** → CSS vars + TS | Direct `@theme` CSS · defer | Standard, Figma-syncable, multi-platform-ready, single source for CSS + TS. Worth the build step for an org standard. |
| D6 | **Visual identity** | **Refine, then lock** current Vega look | Lock as-is · neutral base | Current look is strong but needs a deliberate pass (token naming, dark mode, a11y — §7.5) before freezing. |
| D7 | **v1 component scope** | **64-component system** (phased internally) | Core 15 · core + hard cases | Complete coverage is the goal; we phase the inventory into waves (§13) so the pipeline is proven on wave 1 before scaling. |
| D8 | **Agent skills** | **All 4 suites**: Use-the-system · Authoring · Release-safety · Brand | Subset | The system must serve agents end-to-end: consume, contribute, release safely, and stay on-brand. |
| D9 | **Showcase/docs** | **Fumadocs** (MDX) + live previews | Custom Next.js · +Storybook | What shadcn/ui itself runs on; MDX is AI-readable; lower maintenance; live previews recreate the `/components` gallery. |
| D10 | **Monorepo tooling** | **pnpm + Turborepo + Changesets** (+ catalogs) | pnpm-only · workspaces-only | 2026 standard (shadcn, Radix Themes); you're already on pnpm 10 (catalogs). |
| D11 | **Deployment & registry auth** | **Static export on CF Workers Static Assets**; registry gated by **Cloudflare Access** with **one shared service token for internal**; external projects use the **public** npm layer + dev-time copy-in (**no token**) | OpenNext · per-customer tokens | Static = leanest/cheapest; **no always-on dependency** (§9.4). Token lifecycle + least-privilege in §8.5. |
| D12 | **Consumers** | platform (1st migration) · other internal apps · all future projects | — | Drives roadmap + that token-override is a first-class requirement. |

---

## 4. Architecture — the two-layer hybrid model

The system is split into **two layers by how each should behave on update**:

```
                    vegastack-design  (single source of truth, pnpm + Turborepo monorepo)
                    │
   ┌────────────────┴───────────────────────────────────────────────┐
   │                                                                  │
   ▼  LAYER A — npm packages (auto-propagate)            ▼  LAYER B — private shadcn registry (copy-in)
   @vegastack/design-tokens      design tokens (DTCG→CSS vars)  @vegastack/button     @vegastack/dialog
   @vegastack/tailwind-preset   Tailwind v4 preset       @vegastack/input      @vegastack/data-list
   @vegastack/utils       cn(), helpers                  @vegastack/badge      @vegastack/text-edit  ...
   @vegastack/icons       generated icon set             (the registry React components)
   │                                                      │
   │  consumed as deps → dependency PR (Renovate)         │  consumed via `npx shadcn add @vegastack/x`
   │  propagates ADDITIVE-ONLY token changes (§5.4)       │  → source copied INTO the downstream repo
   │  to ALL projects; override locally via one CSS file  │  → downstream OWNS & edits it; agents read/edit it
   │  (public npm → external projects need no creds)      │  → updates pull-based + drift-detected (§5.4)
   ▼                                                      ▼
        ┌─────────────────────────────────────────────────────────────┐
        │  Downstream project (vegastack-platform, audiolens, new app) │
        │  globals.css:  @import "tailwindcss";                        │
        │                @import "@vegastack/design-tokens/theme.css";        │
        │                @layer theme { :root { --primary: … } }       │  ← one-file override
        │  components/ui/button.tsx  ← copied in, locally owned        │
        └─────────────────────────────────────────────────────────────┘
```

**Rule of thumb for placement:**
- **Layer A (npm)** = anything you want *central control over and auto-propagated*: tokens, theme, Tailwind preset, `cn()`/utils, generated icons. Brand changes here reach every project via `npm update`.
- **Layer B (registry)** = the React components: copy-in, locally owned, agent-editable, per-project knobs, pull-based updates.
- **Exception lever:** a small number of *locked, centrally-controlled* components (candidate: `DataList` — complex) **may** ship as an npm package instead of the registry. (`TextEdit` is resolved → registry, two OSS items, collab deferred — §12.) Default is registry; exceptions in §12.

### 4.1 Why the registry (not just npm) for components
- **Agent-native is the decisive reason.** Agents can only customize code they can *see*. An npm component is an opaque import an agent can only wrap; a copied-in component is a file an agent can read and edit. (Industry evidence: a markdown-spec-only DS made agents re-implement components — ~92% more tokens, ~30% coverage — vs ~80% when pointed at real importable component code.)
- **No version-lock breakage.** Each project owns its copy; a component tweak in project X cannot break project Y.
- **The right knobs.** Downstream can diverge a single component file when a project genuinely needs to, without forking the system.

### 4.2 Why npm (not registry) for tokens — and the honest propagation model
- Brand lives in one place and **propagates via a dependency update**, not magically. A token release reaches a project when its `@vegastack/design-tokens` dep is bumped (PR-automated by **Renovate**), the lockfile updates, CI runs, and it deploys. There is **no runtime push** and **no zero-step "instant repaint"** — that earlier framing was wrong (Codex F1).
- **Why this is still safe across the npm↔registry boundary:** components are copied-in (registry) and can be stale relative to a newer token package. Breakage is prevented by a **token stability policy (additive-only within a major)** + **per-component token-version binding** + **drift detection** — all in §5.4. Without those, a token rename could silently break a stale component copy or a consumer override.
- Tokens are CSS variables, so a project still **overrides** them locally (one file) without losing propagation of everything it didn't override.

---

## 5. Token system & theming

### 5.1 Authoring → build pipeline
```
packages/design-tokens/
  src/tokens/*.tokens.json        ← author here (W3C DTCG 2025.10 format)
  style-dictionary.config.mjs
  build/  (generated)
    theme.css                     ← @theme { --color-…: oklch(…) }  (Tailwind v4)
    tokens.ts                     ← typed constants for JS/TS consumers
    tokens.json                   ← raw resolved values (Figma sync / tooling)
```
- **Source format:** DTCG JSON (color in OKLCH, spacing, radius, typography, semantic aliases).
- **Build:** Style Dictionary v4 → emits the three outputs above on `turbo run build --filter=@vegastack/design-tokens`.
- **Two-layer tokens** (adopt resend's model): **primitives** (raw scale, e.g. `--gray-1…12`) + **semantic** (intent, e.g. `--color-primary`, `--bg-elevated`, `--text-muted`, `--border-default`, status `--color-{success,warning,destructive,info}`). Components reference **semantic** tokens only; primitives are escape hatches.

### 5.2 The override model (one global file)
```css
/* downstream globals.css */
@import "tailwindcss";
@import "@vegastack/design-tokens/theme.css";    /* the standard look */

@layer theme {                            /* THE single override point */
  :root {
    --primary: oklch(45% 0.20 250);       /* this client = blue */
    --radius: 0.25rem;
  }
  .dark { --primary: oklch(0.65 0.18 250); }
}
```
**Override the runtime vars (`--primary`, `--background`, …), NOT `--color-*` (Codex F3).** Components use `bg-primary`, which Tailwind's `@theme inline` bridge compiles to `var(--primary)`; the `--color-*` names exist only inside that bridge and are inlined at build time, so redefining `--color-primary` at runtime does nothing. Redefining `--primary` in this one file re-themes **every** component — no component edits. (Exact variable model: detail/02 §1–§2.)

### 5.3 Tailwind v4 cross-boundary rules (non-negotiable)
- Components ship **raw Tailwind utility classes** in source — never inline styles, never hardcoded hex.
- Downstream owns Tailwind (`@import "tailwindcss"`); **everyone must be on Tailwind v4** (a v3 app silently won't style v4 components — the #1 failure mode). Platform is already v4. ✅
- **Registry (copy-in) components need no `@source`** — they land in `src/` and are auto-scanned. (An npm-packaged component would need `@source "../node_modules/@vegastack/<pkg>/**"`.)
- Tokens travel as `@theme` CSS variables so theming is centralized and overridable.

### 5.4 Token stability & propagation policy (F1 — the core hybrid safety mechanism)
Token names (CSS variables) are a **public API**: stale copied-in components reference them, and consumer overrides redefine them. A rename/removal would silently break both. So:

1. **Additive-only within a major (F1a).** Within a major version we **never rename or remove** a token in a routine release. New tokens are added freely; superseded token names remain available until a major cleanup. Guarantee: *a token release can never visually break a stale component copy or a consumer override.*
2. **Per-component token-version binding (F1b).** Each `registry-item.json` declares `@vegastack/design-tokens` as an npm **dependency with a compatible range** (e.g. `^2`). `shadcn add` installs/raises tokens to a compatible version, so a copied component always lands against compatible tokens.
3. **Version/hash header in generated files.** Every copied component carries a header (`// @vegastack <name>@<version> <sha>`). The **design-audit skill** flags components stale vs the latest registry — the drift detector.
4. **Honest, automated propagation.** Ship a **Renovate preset** consumers extend; token/util bumps arrive as **auto-PRs** (CI + VRT gate; additive token bumps may auto-merge). No "instant repaint" anywhere.
5. **Token changelog + removed/superseded table** on the docs site so consumers and agents see what changed.

> Net: the npm layer propagates brand on a dependency PR (additive-safe by policy), the registry layer is token-pinned + drift-detected, and nothing silently breaks.

---

## 6. Repository structure

```
vegastack-design/
├─ apps/
│  └─ docs/                       # Fumadocs showcase (Next.js App Router) → Cloudflare
│     ├─ content/docs/components/ # one MDX page per component (AI-readable source of truth)
│     ├─ components/              # docs-only: <ComponentPreview>, <PropsTable>, <DoDont>
│     ├─ public/r/                # built registry JSON (shadcn build output) — served here
│     ├─ source.config.ts         # fumadocs-mdx
│     ├─ open-next.config.ts | next.config (static export)  # per §8.5 decision
│     └─ wrangler.jsonc
├─ packages/
│  ├─ tokens/                     # @vegastack/design-tokens — DTCG → CSS vars + TS
│  ├─ tailwind-preset/            # @vegastack/tailwind-preset — Tailwind v4 preset/theme
│  ├─ ui/                         # @vegastack/ui — component SOURCE + registry definitions
│  │  ├─ src/components/<name>/<name>.tsx
│  │  ├─ src/lib/ (cn, utils re-export)
│  │  └─ registry.json + registry items
│  ├─ icons/                      # @vegastack/icons — generated lucide-based set
│  └─ utils/                      # @vegastack/utils — cn(), framework-agnostic helpers
├─ config/
│  ├─ eslint-config/              # @vegastack/eslint-config
│  └─ typescript-config/          # @vegastack/typescript-config
├─ skills/                        # agent skills (Claude Code + Codex)
│  ├─ vegastack-design-system/SKILL.md     # use-the-system (reference)
│  ├─ vegastack-add-component/SKILL.md     # authoring
│  ├─ vegastack-release/SKILL.md           # release-safety
│  ├─ vegastack-design-audit/SKILL.md      # read-only compliance audit
│  └─ vegastack-brand/SKILL.md             # brand guidelines
├─ tooling/codemods/              # @vegastack/ui-codemod — jscodeshift migrations
├─ .changeset/                    # release intents
├─ AGENTS.md                      # canonical agent rules (Codex/cross-tool)
├─ CLAUDE.md                      # @AGENTS.md + Claude-specific notes
├─ pnpm-workspace.yaml            # workspaces + catalog (react, tailwind, typescript pinned)
├─ turbo.json
└─ package.json                   # private root
```

**`pnpm-workspace.yaml` catalog** pins React 19 / Tailwind 4 / TS across all packages (`"react": "catalog:"`); internal deps use `workspace:*`. **Turborepo** builds `tokens → preset → ui → docs` in topological order (`dependsOn: ["^build"]`).

---

## 7. Component model & standards

### 7.1 Authoring conventions (carry over from Vega, formalized)
- **CVA** for every variant set; `cn()` from `@vegastack/utils` to merge classes.
- **Base UI** primitives via the `render` prop for composition.
- **Semantic tokens only** in classNames (`bg-primary`, not `bg-[#…]` or `bg-neutral-900`). **One formalized exception — palette/swatch DATA:** a component whose *content* is a set of pickable colors (the `ColorPicker` default swatches) may use Tailwind's built-in palette variables (`var(--color-<hue>-500)`) and a dynamic `style={{ backgroundColor }}` for the swatch fill. Rationale: those swatches are **data the user picks from** (recognizable hues), not component chrome — they are intentionally NOT repainted by a semantic `--primary` override, and there is no semantic alias for "blue/red/green". This exception is **narrow** (swatch fills + the default palette only; all chrome — borders, focus, spacing, the trigger — stays semantic-token-only), documented in the component header, and covered by the compiled-CSS contrast gate (which excludes only the dynamic swatch nodes).
  - **Inline-`style` contract (Codex R12 — narrowed).** `design-lint` enforces that a `style={…}` may ONLY: **(a)** assign **CSS custom properties** — every key is a `--*` variable — OR **(b)** be the **one swatch-fill exception above** (a dynamic `backgroundColor`/`background`, file-scoped to `color-picker.tsx`). **Any direct visual property** in an inline style (`gridTemplateColumns`, `width`, `height`, `minHeight`/`maxHeight`, `padding`, …) — **dynamic OR literal** — **fails**; hardcoded hex/px/rem in a style object also fails. **Runtime layout/sizing routes through a CSS var consumed by an arbitrary-value class**: ColorPicker's grid column count → `--swatch-cols` + `grid-cols-[repeat(var(--swatch-cols),…)]`; `TextEdit` min/max-height → `--te-min-h`/`--te-max-h` + `min-h-[var(--te-min-h)]`/`max-h-[var(--te-max-h)]`; `TableCellText` width → `--cell-w` + `max-w-[var(--cell-w)]`; the sidebar rail width vars (`--sidebar-width`). A `style={…}` that is a **bare variable reference** (`style={contentStyle}`) is allowed at the use site — its keys are validated where the object is constructed (which is itself linted). The `*-[var(--…)]` consumer classes are already permitted by the arbitrary-value `var()` exception, so the rule still bans hardcoded hex/px everywhere including here.
- **Data attributes** (`data-slot`, `data-variant`, `data-state`, `data-size`) for parent-driven styling — already a Vega pattern, keep it.
- **Server-safe by default**; `'use client'` only at the lowest interactive leaf.
- **Naming (O1 RESOLVED → drop the prefix):** components export **unprefixed** (`Button`, `Dialog`, `Badge`) — the `@vegastack/*` scope already namespaces. No `Vega*` prefix.
- **Authoring model (Model A — own it):** we **author and own** each component on Base UI (variants baked in); there is **no pristine-shadcn base layer + wrapper tier**. shadcn improvements are never auto-tracked (copy-in is always a manual `--diff`); the **maintenance skill** runs `shadcn add <comp> --diff` against shadcn's latest into a scratch dir to surface upstream changes for deliberate cherry-pick — so we keep access to shadcn improvements without a second tier.

### 7.2 Component file shape (standard, scaffolded by the Authoring skill)
```
packages/ui/src/components/button/
  button.tsx          # component (Base UI + CVA)
  index.ts            # public export
  meta.ts             # props metadata for the docs PropsTable (port component-meta.ts)
```
Plus a registry item entry + a Fumadocs MDX page — all generated together so a component is never half-shipped.

### 7.3 Per-component documentation template (canonical section order)
Synthesized from shadcn/Radix/MUI/React-Aria/enterprise systems:
1. **Title + one-line description**
2. **Preview** (live, interactive default — Preview ⇄ Code toggle)
3. **Installation** (`npx shadcn add @vegastack/<name>`)
4. **Usage** (import + minimal snippet)
5. **Anatomy** *(compound components only — the part tree)*
6. **Examples / Variants** (one live preview per variant · size · state: default/hover/disabled/loading/error)
7. **API Reference / Props** (auto-derived table — prop · type · default · description)
8. **Accessibility** (keyboard table + ARIA + focus behavior)
9. **Do / Don't** (paired correct/incorrect; content standards) — *the enterprise differentiator*
10. **Changelog / status** (stability badge; link to release notes)

Sections 5 & 9-i18n are conditional; 1-4, 6-8, 10 are mandatory.

### 7.4 Component inventory → see §12.

### 7.5 Identity refine-pass (D6) — required before lock
The current Vega look is the baseline; the refine pass must resolve:
- **⚠️ A11y regression found in audit:** platform `globals.css` sets `outline: none !important` globally and force-disables focus states. **Must be replaced with a proper `:focus-visible` ring** in the locked system (WCAG 2.1 AA, keyboard nav). This is a real defect to fix, not carry forward.
- **`!important` — exactly TWO sanctioned, narrowly-scoped exceptions (Codex R14 + R16 MED).** The design-audit contract bans `!important` in all shipped CSS *except*:
  1. **The reduced-motion accessibility reset** inside `@media (prefers-reduced-motion: reduce)` (animation-duration/iteration-count + transition-duration + scroll-behavior), in `packages/design-tokens/src/base.css`. This reset is the canonical WCAG mechanism for honoring `prefers-reduced-motion: reduce` — it *must* win over any component-authored animation/transition, which is precisely what `!important` guarantees; no other selector can be relied on to override later/higher-specificity motion rules.
  2. **The scroll-lock scrollbar-compensation zero-out (Codex R16 MED)** in `apps/docs/app/global.css`, under the selector `html > body[data-scroll-locked]`. `<html>` reserves the scrollbar track permanently via `scrollbar-gutter: stable`, so there is no layout shift on scroll-lock. But `react-remove-scroll-bar` (pulled in by the Fumadocs `SearchDialog` + the Radix-based copy-in components) is unaware of the gutter: on lock it injects a runtime `<style>` singleton setting `body[data-scroll-locked] { margin-right: <gap>px !important }` + `--removed-body-scroll-bar-size`, double-compensating and shifting content left. `!important` is **unavoidable** — a plain declaration can never override the library's `!important` (CSS cascade); the more-specific `html > body` selector wins it. Allowed ONLY for the two zeroed declarations (`margin-right: 0(px)` and `--removed-body-scroll-bar-size: 0(px)`) inside that exact selector block — nothing broader.

  **Enforcement covers both exported token CSS and the docs app's shipped CSS:** `design-lint` has a `--token-css <dir>` mode that runs ONLY the `!important` rule over plain CSS (the Tailwind-utility rules — hex/raw-palette/arbitrary-value/icon-source/render/inline-style — stay scoped to component source; they would false-positive on legitimate oklch token declarations / CSS custom properties / `@source` directives). It is wired into `@vegastack/design-tokens`'s `pnpm lint` (`node tooling/design-lint.mjs --token-css src`, over `@vegastack/design-tokens/base.css`) **and** into `@vegastack/docs`'s `pnpm lint` (`node tooling/design-lint.mjs --token-css app`, over `apps/docs/app/**/*.css`). It **FAILS on any `!important` not inside a `prefers-reduced-motion: reduce` block AND not one of the two zeroed scroll-lock declarations under `html > body[data-scroll-locked]`** (brace-depth scoped; CSS comments stripped so prose mentioning `!important` is ignored). This closes the gaps where public token CSS (R14) and the docs app CSS (R16) shipped bypassing the design-lint `!important` contract (which previously only scanned `packages/ui/registry`).
- **Token naming** → normalize to the two-layer primitive/semantic scheme (§5.1).
- **Dark mode** → verify every semantic token has a `.dark` value and AA contrast.
- **Typography scale** → confirm Lora-serif-headings / Geist-body / no-`font-bold` / 4px-scale as locked rules.
- **Status color contrast** → audit `success/warning/destructive/info` foregrounds against AA.

### 7.6 Per-component quality contract (mandatory, CI-gated)
Every component must satisfy this contract before it can be published (enforced by the authoring skill + CI):
- **All applicable UI states** implemented AND documented: default, hover/focus, **loading, empty, error, success/selected, disabled** (per the standing rule that every state is handled).
- **The knobs/extensibility contract (G6):** `className` passthrough (cn-merged) · `render` polymorphism · CVA variant/size props · `data-*` state hooks · forwarded ref · explicit slot props for compound parts.
- **Accessibility acceptance criteria:** keyboard-interaction map, correct ARIA/roles, visible `:focus-visible` ring, and **passing `axe`** (no violations).
- **Docs completeness:** a Fumadocs page with every §7.3 section, a live preview rendering the real source, an auto-generated props table (requires JSDoc on public props).
- **Changeset present** + registry item + token range declared (§5.4).

A component that misses any of these does not ship — checked in CI, not left to reviewer memory.

### 7.7 Testing & CI gates (day-one — gap G13, Codex F2)
Visual regression is **not** deferred (only Storybook is). Every PR runs:
- **Vitest + @testing-library/react** — component behavior + state logic.
- **vitest-axe / axe-core** — automated a11y; zero violations required.
- **Playwright `toHaveScreenshot`** — visual regression over the Fumadocs component previews (which render the real shipped source), catching token/visual regressions before release. This is the guard behind the "never silently break" promise.
- **typecheck + lint** (incl. design-lint rules: no hex/px, sanctioned icon sources only — G18).
Wired into Turborepo `test` + release CI; a red gate blocks publish. Storybook/Chromatic remains a later workbench (§8.4), not a v1 dependency.

---

## 8. Showcase & docs (Fumadocs)

### 8.1 What it is
The productized recreation of the platform `/components` page: a Fumadocs (Next.js App Router + MDX) site where **each component page embeds live, interactive previews** of every variant — exactly how `ui.shadcn.com` works — plus the §7.3 template sections. MDX is the source of truth (human- and agent-readable, reviewable in PRs).

### 8.2 Key building blocks
- **MDX:** `fumadocs-mdx` (what shadcn uses).
- **Live preview:** real inline React (`<ComponentPreview name="button" />`) rendering the actual component source — so the showcase is a true visual test of the shipped code.
- **Props table:** auto-generated from TypeScript via Fumadocs **`AutoTypeTable`** (`fumadocs-typescript`, ts-morph) — never drifts from source. (NOT `react-docgen-typescript` — Codex F9; see plan detail/03 §5.)
- **Code highlighting:** Shiki at **build time** (zero client JS, pre-rendered) via rehype-pretty-code.
- **Do/Don't:** MDX prose + a `<DoDont>` component.
- **Search:** Fumadocs built-in (Orama).

### 8.3 The showcase doubles as the registry host
`shadcn build` emits the registry JSON into `apps/docs/public/r/*.json`. The same Cloudflare deployment serves both the human docs and the machine registry — one deploy, one source of truth.

### 8.4 Storybook — deferred (NG2); visual regression is NOT (F2)
Fumadocs live previews cover variant display, and **Playwright visual-regression runs day-one over those previews (§7.7).** What's deferred is the **Storybook 10 + Chromatic workbench** (interaction-testing harness), a phase-2 evaluation once the set stabilizes — not the visual-regression capability itself.

### 8.5 Deployment, registry auth & integrity (D11, F5)
**`output: "export"` (static) on Cloudflare Workers Static Assets, registry gated by Cloudflare Access (Zero Trust).** Docs are static (MDX + build-time Shiki); registry is static JSON — no SSR/ISR → leanest/cheapest, Cloudflare's recommended direction. **No always-on dependency** (§9.4).
- **Internal consumers:** the **human docs** sit behind **SSO identity login** (`@vegastack.com` / IdP group — humans browse with no machine credential, Codex F8); the **`/r/*` registry endpoint** is **service-token-only**, and internal `components.json` sends those **CF Access service-token headers**. **One shared registry service token for internal is acceptable** (we control those CIs):
  ```json
  { "registries": { "@vegastack": {
      "url": "https://design.vegastack.com/r/{name}.json",
      "headers": { "CF-Access-Client-Id": "${CF_ACCESS_ID}",
                   "CF-Access-Client-Secret": "${CF_ACCESS_SECRET}" } } } }
  ```
- **External/client consumers:** **never receive a VegaStack token.** They consume the **public** npm layer (tokens/preset/utils/icons) and get components **copied in by us during development** (our creds) — so the shipped app + their CI need **zero** credentials (§9.4).
- **Token lifecycle (F5):** `/r/*.json` sits on a **tighter Access policy** than the human docs; the shared internal token has a **defined owner, rotation schedule, revocation runbook, and CI-secret storage**; rotation affects internal CIs only (external is tokenless).
- **Registry integrity (supply-chain — Codex F4 + F2):** the hash covers the **whole canonical item** (not just file content), and the integrity **manifest is Sigstore-signed (GitHub OIDC keyless — no long-lived key)**. `vegastack-consume` runs a **fail-closed preflight** that **verifies the signature against the pinned GitHub-Actions identity** then recomputes the item hash, **before** `shadcn add`, and re-hashes the copied files **after** write; `vegastack-design-audit` re-checks for drift later. Trust model: a compromised CF origin/bucket **cannot forge a passing manifest** (signature pins the workflow identity); residual risk = compromise of the GitHub Actions identity itself (mitigated by branch protection). shadcn re-fetches the item with no native integrity, so this is a fail-closed gate on the signed+published item + a post-write re-hash, not a guarantee of the exact bytes shadcn writes (detail/04 §3).
- **Switch to OpenNext** only if we later add server features (live playground, dynamic search API). Platform already runs OpenNext+R2 → fallback well-trodden.

---

## 9. Distribution & consumption (mechanics)

### 9.1 Registry (Layer B — components, private copy-in)
- **Author:** `registry.json` (index) + per-item `registry-item.json` (source files, npm deps incl. **`@vegastack/design-tokens` compatible range (§5.4)**, `registryDependencies`, cssVars, `meta.whenToUse`/`whenNotToUse`, **content hash**).
- **Build:** `shadcn build` → static `/r/*.json` + an **integrity manifest** (§8.5).
- **Consume:** the `vegastack-consume` skill runs the **fail-closed integrity preflight** (detail/04 §3), then `npx shadcn add @vegastack/button` installs `@base-ui/react`+`cva`+a compatible `@vegastack/design-tokens`, pulls `cn`, and **writes the source into the downstream repo** — carrying the provenance header (`// @vegastack <name>@<version> sha256-<integrity>`) that ships *inside* the registry item content (line 1), so shadcn copies it verbatim and the design-audit skill reads it for drift; a post-write re-hash confirms the copied files. (The header sha == `meta.integrity`; the canonical itemHash strips the header before hashing so it stays self-consistent — `tooling/registry-header.mjs` stamps it during `registry:build`, `tooling/verify-headers.mjs` gates it.)

### 9.2 npm packages (Layer A — tokens/utils/preset/icons) — PUBLIC (F5)
- **Publish:** **public** npm packages (no IP — CSS vars + a `cn` helper + icon conventions). Public ⇒ external/client projects install with **no credentials** and ride npm's CDN uptime.
- **Versioning:** additive-only token policy (§5.4); releases arrive via Renovate auto-PRs.
- **Consume:** `npm i @vegastack/design-tokens @vegastack/tailwind-preset @vegastack/utils @vegastack/icons`; import `theme.css`; Renovate raises the dep when a release lands.

### 9.3 One-time downstream setup (documented + scripted by the consume skill)
1. ensure Tailwind v4; `npm i @vegastack/design-tokens @vegastack/tailwind-preset @vegastack/utils @vegastack/icons` (**public — no auth**)
2. `globals.css`: `@import "tailwindcss"; @import "@vegastack/design-tokens/theme.css";`
3. wrap the app root in `<VegaStackProvider>` (theme + toast + tooltip + direction)
4. *(internal)* `shadcn init` → `components.json` with the `@vegastack` registry + CF Access headers; *(external)* components are copied in by us during development — **no registry creds**
5. add the **Renovate preset** so token/util bumps auto-PR
6. `npx shadcn add @vegastack/<component>` as needed (internal)

### 9.4 Consumption modes & availability (F5)
**There is no runtime "always-on" dependency. The only coupling is build/install-time, and external projects are made fully self-contained.**

| Coupling point | When contacted | If it's down / revoked |
|---|---|---|
| **Components (registry, copy-in)** | only at `shadcn add`/update (dev time) | shipped + building apps unaffected (code already in their repo); only *adding new components mid-dev* is blocked |
| **npm layer (tokens/utils/icons)** | at `npm install` (clean CI/build) — **public, no auth** | public-npm/CDN outage only; never our private infra; bundled into the app after build (no runtime contact) |

**Two modes:**
- **Internal → live mode.** Registry via one shared CF Access token (§8.5); public npm for the token layer. We control these CIs.
- **External / client → self-contained mode.** Components copied in **by us during development**; the public npm token layer needs no creds; the shipped app and the customer's CI hold **no VegaStack credentials**. Result: immune to our downtime, token rotation, and customer offboarding — and a clean handoff if the customer maintains it. (Max-isolation option: also **vendor** the token CSS into the customer repo for zero deps.)

**Net:** the design system can be offline and **every shipped app — internal and external — keeps building and running.** A direct benefit of copy-in components + a public, runtime-free token layer.

---

## 10. Release & versioning (never break downstream)

- **Authority:** **Changesets** (not commit-message inference — a visual break can hide under `fix:`). Every change ships a reviewed changeset declaring the bump.
- **Config highlights:** `@changesets/changelog-github`, **`access: public`** for the token layer (F5; a private `ui` package, if any, stays `restricted`), `linked: [["@vegastack/design-tokens","@vegastack/tailwind-preset","@vegastack/icons"]]` so the token layer moves together, `bumpVersionsWithWorkspaceProtocolOnly: true`. *(Registry components are versioned via their item header + token range — §5.4 — not a Changesets group with `ui`; Codex F1.)*
- **Automation:** `changesets/action` → on merge to `main`, opens a "Version Packages" PR (human gate); merging it publishes changed packages + redeploys docs/registry.
- **Update semantics by change type:**
  - *Token/brand* → **additive-only** release → **Renovate auto-PR** bumps the dep (CI + VRT gate); no code change, can't break stale copies (§5.4).
  - *Component fix/improvement* → downstream re-runs `shadcn add @vegastack/<x> --diff` / `--overwrite` (pull-based, never silent); audit flags stale copies.
  - *Breaking API / token removal* → **major + `MIGRATION.md` + a published codemod** (`@vegastack/ui-codemod`). Never a hard break.
- **Pre-release lanes:** `changeset version --snapshot canary` for ephemeral per-PR test builds; `pre enter next` (on a dedicated branch only) for real beta→rc→stable major runways.
- **Breaking cleanup policy:** remove wrong, unsafe, stale, or unnecessary APIs from the source of truth instead of preserving aliases. For legitimate consumer migrations, ship a codemod with the major release notes.

---

## 11. Agent enablement & skills

The system is consumable by **both Claude Code and Codex**, at parity. Files at repo root + a `skills/` suite.

### 11.1 Machine-readable layer (the load-bearing part)
- **shadcn registry** (`registry.json` + items) — makes components *installable*, and the `meta`/`description`/`categories` fields drive **agent selection**. We extend `meta` with `whenToUse` / `whenNotToUse` so agents disambiguate (primary vs ghost vs destructive).
- **shadcn MCP server** — wired into Claude Code/Codex so agents browse/search/install from the `@vegastack` registry by namespace.
- **`llms.txt` / `llms-full.txt`** on the docs site for cheap discovery.

### 11.2 Rules files
- **`AGENTS.md`** (root) — canonical, cross-tool (Codex/Cursor/Copilot): "always use `@vegastack` components when one exists; always use tokens, never hardcode hex/px; query the MCP/registry before generating component code," + a component-selection map + import conventions.
- **`CLAUDE.md`** = `@AGENTS.md` + Claude-specific notes (Claude Code reads CLAUDE.md, not AGENTS.md).

### 11.3 Skill suite (all 4, modeled on resend-design-skills)
| Skill | Type | Does |
|---|---|---|
| `vegastack-design-system` | Use-the-system | Component APIs, token reference, composition patterns, do/don't, heuristics. The skill downstream agents load to build correctly. |
| `vegastack-consume` *(part of Use-the-system)* | Use-the-system | Init a downstream project, `shadcn add`, override tokens. |
| `vegastack-add-component` | Authoring | Scaffolds a new component in the standard shape — source + registry entry + Fumadocs page + changeset — so contributions are never ad-hoc. |
| `vegastack-release` | Release-safety | Changeset authoring, semver decision, codemod generation, safe-release flow. |
| `vegastack-design-audit` | Release-safety | Read-only: flags hardcoded hex, non-token classes, raw HTML elements, stale usage, missing docs. (Reports, never edits.) |
| `vegastack-brand` | Brand | Marketing/external visual identity (logo, brand color, typography) — separate from the product DS. |

---

## 12. Component inventory (64) & placement

Ported from `engg-vegastack-platform/src/components/common` (Vega wrappers) on top of `@vegastack/ui` primitives. **Default placement = registry (Layer B).** npm-package exceptions flagged.

| Group | Components |
|---|---|
| **Actions** | Button, IconButton, CopyButton, split/dropdown-button |
| **Form** | Input, Textarea, Field, FieldInline, PasswordInput, OTPInput, Checkbox, Switch, Select, CountrySelect, StateSelect, DatePicker, ColorPicker, EmojiPicker, AutoSaveInput |
| **Display** | Badge, Avatar (+ group), Card, EmptyState, Kbd, StatusIcon, ProgressIndicator, Skeleton, Spinner, TruncatedText |
| **Overlay** | Dialog, AlertDialog, Drawer/Sheet, Popover, Tooltip, HoverCard *(presentational; User/Agent/Team data wrappers stay app-side — G7)*, DropdownMenu |
| **Navigation** | Tabs, Breadcrumb, Pagination, PageHeader, Sidebar, CommandMenu (⌘K) |
| **Data** | DataList — **`data-list` presentational core v1** (registry; columns/render/selection/sort-signal/loading/empty + composition slots); the full data-grid (search/paging/drag/Kanban/grouping/persistence) is a separate **deferred `data-grid`** (G7). FilterBar, Table, ScrollArea |
| **Rich text** | TextEdit — **`text-edit` base v1** (registry, OSS; controlled HTML + StarterKit + toolbar + onSubmit + min/max-height); image-upload/@mentions/markdown-IO/emoji/task-lists/code-lang are **deferred composed addons** and `text-edit-collab` is **deferred** pending a collab-adapter contract (F4) (G7). Textarea (rich), MarkdownView |
| **Feedback** | Alert, Toast (Sonner config) |
| **Layout/Settings** | SettingsRow/Card/Section |
| **Media** | Image *(presentational; app wraps R2 — G7)*, NotificationBell *(presentational)*, brand/logo icons via thesvg `BrandIcon` (replaces OAuthIcons/logos — G1) |
| **Foundations** | color palette, typography, **icons (lucide + lucide-animated + thesvg via `Icon`/`BrandIcon` — G1)**, motion tokens → documented as showcase foundation pages (G28) |

**Placement notes:**
- **App-coupled split (G7):** Avatar, Image, User/Agent/Team hover cards, CommandMenu, AutoSaveInput ship as **presentational** components only; the app keeps the data-fetching wrapper (R2 resolution, ID→data lookups, route wiring, autosave persistence).
- **`DataList` (formally scoped — presentational core v1):** ships the **presentational data table** — columns, render fns, row selection, sortable-header *signalling*, loading + empty states, and presentational composition affordances (`onRowClick`, `toolbar`/`footer` slots). This is a complete, first-class component **at this defined scope** — it is NOT a 1:1 port of the platform's full data surface. The app composes search/filtering, pagination/load-more, drag-reorder, board/Kanban, grouping & collapsible groups, and view persistence **around** it (G7: it owns the query + view state + the filtered/paged rows). A full-featured **`data-grid`** that owns those is a separate **deferred** component (build only if commissioned).
- **`TextEdit` (formally scoped — base v1):** ships the **presentational base editor** — a controlled HTML value, the StarterKit formatting set, the styled toolbar, placeholder, read-only mode, a `Cmd/Ctrl+Enter` `onSubmit` affordance, and `minHeight`/`maxHeight` sizing. Complete **at this defined scope** — NOT the platform's full editor. App-coupled / heavier capabilities are **deferred**: image-upload (needs app storage/R2), @mentions (needs app data), markdown import/export, emoji, task lists, code-block language menus → future *composed* addons; **`text-edit-collab`** (Yjs CRDT) is **deferred** (F4) until a collaboration-adapter contract exists — authenticated doc namespace, tenant-scoped provider, binary Y.Doc persistence, reconnect/idempotency rules, and reconnect/concurrent-edit tests.
- **No "exception rows" in the completion gate:** because the inventory above *defines* `data-list` / `text-edit` at the presentational-core/base-v1 scope, the component matrix marks them **complete for that defined scope** (all columns ✅) — this is honest completion of the scoped inventory item, not a claim of platform feature-parity. Full-parity `data-grid` / `text-edit-collab` are tracked as separate, deferred inventory items.
- Everything else defaults to registry.

**Explicit platform-`common` exclusions (the inventory is the 64 DS primitives, NOT every file in the platform `src/components/common`).** These platform components are deliberately **out of the DS inventory** and are *not* tracked as matrix rows — with owner-approved rationale:
- **App-coupled / data wrappers (G7 — stay host-side, compose a DS primitive):** `account-status-alert` (account state → composes `Alert`), `r2-image` (R2 resolution → wraps `Image`), `user-/team-/agent-hover-card` (entity data → wrap `HoverCard`), `mention-renderer` (user data → tied to TextEdit's deferred `@mentions`), `status-page` + `status-page-user-menu` (page-level compositions, not primitives).
- **Replaced by a DS decision:** `oauth-icons` → thesvg `BrandIcon` (`@vegastack/icons`, G1).
- **Already covered by a DS component:** `command-menu` → `CommandMenu`; `relative-day` + `time-ago` → `RelativeTime`; `avatar-fallback-generated` → `Avatar`'s built-in fallback.
- **Deferred presentational variants (composable today from shipped primitives; build as first-class items only if commissioned):** `textarea-inline` + `text-edit-inline` (the `FieldInline` click-to-edit pattern for multi-line / rich content — compose `FieldInline` + `Textarea` / `TextEdit`), `password-requirements` (a presentational rule-checklist — compose with `StatusIcon` + tokens).

The component matrix therefore tracks the defined 64 DS primitives at 100% — it does **not** claim a 1:1 file-for-file port of platform `common`; the above are the audited exclusions.

**API refinements (Model A — own a smaller, composable surface, not a prop-for-prop clone).** A "built" component re-authors the platform behavior; it does **not** preserve convenience props when composition expresses the same capability more cleanly. These are final API decisions, not compatibility layers:
- **`Button`** — exposes `loading` plus normal children composition for labels, icons, keyboard hints, and alternate text. Multi-action buttons are modeled by the dedicated **`SplitButton`** component.
- **`Tooltip`** — is a non-interactive tooltip primitive. Use `TooltipContent` children and `TooltipKbd` for rich text and shortcuts; use **`Popover`** for actionable or focusable content.
- Where a platform sub-export is a distinct, reusable pattern (not a convenience prop), it **is** ported as a named export — e.g. `TruncatedText` ships `IconText` + `TableCellText`, and `SplitButton` exists as its own component rather than a `Button` prop.
- Data-completeness is **not** a refinement lever: `CountrySelect`/`StateSelect` ship the full platform geography (198 countries / 45 subdivision datasets), never a compact subset.

**Presentational-core scope (Model A — the primitive owns rendering; the host app owns stateful/data behavior).** Like `data-list` / `text-edit`, **`FilterBar`** is defined at the **presentational-core** scope: it renders the filter chips (`FilterChip` — label/value + remove affordance), the add-filter menu, the search field, and a `trailing` slot. The platform demo's stateful/app-coupled behavior is **deliberately consumer-owned, not primitive features** (recorded scope decision, not a silent drop): active-filter STATE management (the consumer holds the filter model), **clear-all** (compose a button into the `trailing` slot — see `filter-bar.mdx`), **editable chip popovers** (compose `FilterChip` with a `Popover`), and **AI-suggested filters** (an app/data concern, G7 — out of the DS primitive, like the other app-coupled wrappers). Full-stateful `filter-bar-managed` is a separate, deferred inventory item; the matrix marks `FilterBar` complete for the **presentational-core** scope only. See the FilterBar **Scope** note in its docs.

---

## 13. Phasing / roadmap (high-level — detailed plan comes after review)

| Phase | Outcome |
|---|---|
| **P0 — Skeleton** | Monorepo (pnpm+Turbo+Changesets+catalogs), empty packages, CI, GitHub Packages auth, Cloudflare Access + static deploy wired, AGENTS.md/CLAUDE.md. |
| **P1 — Foundations** | `@vegastack/design-tokens` (DTCG→Style Dictionary), `tailwind-preset`, `utils`, `icons`. Identity refine-pass (§7.5) → lock. Fumadocs shell + foundations pages (colors/typography). |
| **P2 — Pipeline proof (Wave 1, ~10 core components)** | Button, Input, Field, Badge, Dialog, Select, Tooltip, Dropdown, Tabs, Alert — on Base UI, in the registry, each with a full Fumadocs page + live preview + props table. `vegastack-add-component` skill operational. Registry installable end-to-end. |
| **P3 — Scale (Waves 2–N)** | Remaining ~40 components in grouped waves. Release-safety + audit skills live. Resolve `DataList` placement; `text-edit-collab` only if its adapter contract is specced. |
| **P4 — First migration** | Migrate `engg-vegastack-platform` to consume `@vegastack`; prove zero-local-change updates + override model on a real app. (Detailed migration sub-plan in [`/docs/plans/`](plans/).) |
| **P5 — Rollout** | Onboard other internal apps; `shadcn init` becomes the default for new projects; brand skill + MCP wired into team agents. |

> **Showcase-first checkpoint (MK):** P1's Fumadocs showcase must be **fully implemented, tested, and deployed to Cloudflare** before P3 scaling. The detailed implementation + migration plan ([`/docs/plans/`](plans/)) is **revised after that deploy**, once the real pipeline is proven end-to-end.

---

## 14. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Base UI is young (v1 ~6 months) | Routed through shadcn abstraction → Radix is a reversible fallback; pin versions via catalog; track release cadence. |
| Registry updates don't auto-propagate (consumers drift) | Document the `--diff` re-pull flow in the consume skill; audit skill flags stale copies; Renovate in downstream repos for the npm layer. |
| Tailwind v3/v4 mismatch silently breaks styling | Hard requirement: consumers on v4; init script checks version and refuses otherwise. |
| Breaking changes reach consumers | Changesets gate + codemods + deprecation policy + canary lane. |
| 50-component port stalls the system | Phase into waves; ship/prove on Wave 1 before scaling; pipeline value lands early. |
| GitHub Packages auth friction (no fine-grained PAT) | Document classic-PAT/`GITHUB_TOKEN` setup explicitly in the consume skill. |
| Two pipelines (npm + registry) add maintenance | Authoring skill scaffolds both from one command; CI builds both; single deploy. |
| **Token rename breaks stale copied components** (Codex F1) | **Additive-only within a major** + per-component token-version binding + drift audit (§5.4). |
| **External/customer credential leak** (F5) | External projects are **tokenless** (public npm + dev-time copy-in); internal shared token rotated per runbook (§8.5). |
| **Collab data-integrity / tenant isolation** (Codex F4) | `text-edit-collab` **deferred** until an adapter contract + reconnect/concurrent-edit tests exist. |
| **Registry supply-chain tampering** | Content hashes + integrity manifest verified before write (§8.5). |
| Fear of an "always-on" dependency | No runtime coupling — copy-in components + public token layer; shipped apps build/run offline (§9.4). |
| VRT contradiction → unguarded registry (Codex F2) | VRT (Vitest+axe+Playwright) is **day-one** in CI (§7.7); only Storybook is deferred. |

---

## 15. Open questions (to resolve in review / plan)

> A full adversarial gap sweep lives in [`gap-analysis.md`](gap-analysis.md) — 33 gaps (icons, motion, fonts, dark-mode runtime, the "knobs" contract, app-coupled component split, Tiptap licensing landmine, testing/a11y program, providers, RSC policy, registry versioning, foundations pages, …). The 🔴 blockers there reshape §12 and must be decided before the plan. The list below is the original subset.


- **O1** — *(RESOLVED → Model A)* export **unprefixed** component names; we own each component on Base UI, no pristine-shadcn tier; the maintenance skill surfaces shadcn diffs for cherry-pick (§7.1).
- **O2** — *(resolved)* `TextEdit` → registry (`text-edit` base v1; `text-edit-collab` deferred — F4). Only `DataList` placement (registry vs locked npm) remains, decided in the plan.
- **O3** — *(RESOLVED)* v1 ports the **full existing OKLCH token set** from the platform ([catalog](research/catalog-vegastack-platform.md)), normalized to the primitive/semantic two-layer; expand later as needed.
- **O4** — *(MK)* repo name is MK's to set at creation; **`vegastack-design`** is the working default used in docs/paths.
- **O5** — *(deferred)* the `vegastack-brand` skill is a **stub until marketing input** (real logo/marketing palette) — a P3/P5 item, not a P0/P1 blocker.
- **O6** — *(updated)* external/client projects **are** first-class consumers now (F5). White-label theming is served by the public token layer + one-file override; a *packaged* named-theme set stays designed-for, not a v1 deliverable.

---

## 16. Success criteria

- A new VegaStack repo goes from zero → on-brand UI in **one `init` + `add`**, with agents selecting/installing correctly.
- A brand/token change ships to all consumers via a **Renovate auto-PR** (additive-only, zero code edits) and **cannot break a stale component copy** (§5.4).
- A component change reaches consumers **without ever silently breaking** a project (changeset + diff/codemod proven).
- Every component has a **live, accurate showcase page** (the page renders the real shipped source).
- The **add-component skill** produces a complete, correctly-shaped contribution (source + registry + docs + changeset) in one run.
- `engg-vegastack-platform` runs on `@vegastack` with **no local component copies** beyond intentional overrides.
- An **external/client project** builds and runs with **zero VegaStack credentials**, and is unaffected if our registry/docs is offline (§9.4).

---

## Appendix — research basis
Full cataloging + adversarial research (resend-design-skills teardown, vegastack component inventory, Base UI vs Radix verdict, shadcn registry/distribution mechanics, monorepo & docs tooling survey, OpenNext/Cloudflare state, per-component page template study) is preserved in [`/docs/research/findings.md`](research/findings.md). All version/tooling claims there are cited to June-2026 primary sources.
