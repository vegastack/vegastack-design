# Catalog — `resend-design-skills` (full teardown)

> Durable reference. Source: `/Users/kmanojkumar/code/references/resend-design-skills`, read end-to-end 2026-06-20. This is our primary model for how to structure design _skills_ for AI agents. Preserve in full — used when designing the `vegastack-*` skill suite.

## Nature & distribution

A **skills-only** repo — **no `package.json`, not an npm package**. Installed via `npx skills add resend/design-skills` (Codex skills registry). Versioned **per-skill** (frontmatter `version`), not monolithically. ~28 markdown files, densely structured. It documents the Resend codebase's `src/` but does **not** ship that code.

## Directory tree

```
resend-design-skills/
├─ README.md                     # install + quick reference + 11 example prompts
├─ SKILL.md                      # ROOT router/index → 4 sub-skills
├─ brand-guidelines/SKILL.md     # resend-brand
├─ design-system/
│  ├─ SKILL.md                   # resend-design-system
│  └─ references/
│     ├─ components.md           # API catalog, 57+ src/ui primitives
│     ├─ design-tokens.md        # two-layer token system (exhaustive)
│     ├─ heuristics.md           # index of 13 UX decision guides
│     ├─ heuristics/             # 13 files, one decision each
│     │   ├─ dialog-stepper-fullscreen-drawer.md
│     │   ├─ disable-vs-hide.md
│     │   ├─ api-first.md
│     │   ├─ error-and-alert-communication.md
│     │   ├─ table-required-fields.md
│     │   ├─ button-appearance.md
│     │   ├─ complementary-information.md
│     │   ├─ affordance.md
│     │   ├─ using-time.md
│     │   ├─ friendly-names-over-ids.md
│     │   ├─ expose-debuggable-data.md
│     │   ├─ tag-colors-for-status.md
│     │   └─ keyboard-shortcuts.md
│     ├─ patterns.md             # pattern-doc specification
│     └─ patterns/README.md      # pattern framework (documented-patterns.json = [] currently)
├─ marketing-pages/
│  ├─ SKILL.md                   # marketing-pages
│  └─ references/components.md   # public primitives catalog
├─ design-audit/
│  ├─ SKILL.md                   # design-audit (read-only)
│  └─ references/
│     ├─ rubric.md               # 7-category audit rubric
│     ├─ report-format.md        # JSON schema + markdown template
│     └─ linear-delivery.md      # Linear MCP ticket workflow
└─ tests/TESTS.md                # 37 scenario tests (1–11 logged)
```

## Root `SKILL.md` (router)

Frontmatter:

```yaml
name: resend-design-skills
description: Use when needing Resend design resources. Routes to brand guidelines, visual identity, UI components, design tokens, and marketing page patterns.
metadata:
  author: resend
  version: "1.0.0"
```

Body = a master index table mapping each sub-skill → description → trigger phrases. The agent loads root SKILL.md, routes to the right sub-skill by intent, then lazy-loads that skill's `references/` files on demand.

## The 4 skills (verbatim frontmatter + substance)

### 1. `resend-brand` — `brand-guidelines/SKILL.md`

```yaml
name: resend-brand
description: Use when creating Resend marketing materials, documents, presentations, or visual content. Triggers for Resend brand, Resend style, or Resend visual identity requests.
metadata: { author: resend, version: "1.0.1" }
```

- **Colors:** Resend Black `#000000`, White `#FDFDFD`; status Gray, Red `#FF173F`, Amber `#FA8200`, Green `#22FF99`, Blue `#0077FF` — each with a foreground pairing, given as RGB+alpha for dark-mode flex.
- **Type:** Domaine Display Narrow (display, never bold, never in product), Favorit (headings), Inter (body), CommitMono (code). Full size scale. **Sentence case only.**
- **Logo:** CDN wordmark/lettermark (white/black, SVG/PNG); clearspace = ½ cap height; min 16px (extreme)/24px (preferred); restrictions (never rotate/effect/outline/slant/recolor/combine).
- **Gradients/effects:** font gradient `linear-gradient(97deg, #ffffff 30%, rgba(255,255,255,.5) 100%)`, glass `backdrop-filter: blur(25px)`, noise texture.
- **Layout scenes:** Right Object, Interface, Text-Only/Background/Subtle, Big Number. Dark-first, sharp contrast, accent=state-not-style.

### 2. `resend-design-system` — `design-system/SKILL.md`

```yaml
name: resend-design-system
description: Use when building or modifying UI in the Resend codebase. Provides component APIs, variant options, design tokens, composition patterns for all src/ui/ primitives, and the Resend heuristics for UX decisions like dialog-vs-stepper or disable-vs-hide.
metadata: { author: resend, version: "1.2.0" }
```

**Primitives (57+, imported `@/ui/{name}`):** Button, IconButton, CopyButton · TextField (compound), Select, Checkbox, Switch, Calendar · Heading, Text, Tag, Banner, Avatar, Card, EmptyState, Kbd · Dialog, Drawer, Popover, Tooltip, ContextMenu, DropdownMenu · Tabs, Pagination, Breadcrumb, Link, InternalLink · Toast, Skeleton, LoadingDots · 100+ icons (`@/ui/icons/icon-{name}`).

**Component rules (selected):**

- **Button** — `appearance`: white(primary)|gray(secondary)|fade-gray|fade(ghost)|fade-red|red(destructive); `size`: 1|2; `state`: loading|disabled (never manual `disabled={}`); shortcut via `SHORTCUTS_VALUES` constants. Icon left=action, right=destination.
- **TextField** — compound ONLY: `Root > [Slot?] + Input + [Slot?]`; size/state on **Input**; `TextField.Error` in trailing Slot auto-wires `aria-describedby`; max 1 slot each side; ResizeObserver auto-pads.
- **Select** — `import * as Select` namespace; for **value selection** only.
- **DropdownMenu** — for **actions**, not value selection; shared `dropdown.*` tokens from `src/ui/shared.ts`.
- **Dialog** — size 1 (max-w-lg) | 2 (1200px) | full-screen (80vw/80vh); `includeCloseButton` default true.
- **Banner** — auto icon by color (blue/gray=Info, green=Confetti, red/yellow=Warning); `role="alert"`.
- **Tag** — inline item labels (status/category), not page-level.
- **IconButton** — always `aria-label`.

**Sizing:** `'1'`=h-6/text-xs/rounded-lg · `'2'`=h-8/text-sm/rounded-xl · `'3'`=h-10/text-sm/rounded-xl. **Type:** font-sans(Inter), font-display(Favorit, sizes 7–8), font-domaine, font-mono(Commit Mono).

**Composition patterns:** CVA for type-safe variants (string-literal sizes) · compound (object namespace or named exports) · Radix slot/`asChild` (`<Button asChild><Link/></Button>`) · `state` prop over manual wiring · **Server by default, `'use client'` only at lowest interactive leaf** (already-client: TextField, Checkbox, Dialog, Drawer, Collapsible, Calendar, BulkActions; server-safe: Button, Heading, Text, Tag, Banner, Card, EmptyState, Kbd) · `@/` absolute imports · a11y baked in.

### Two-layer token system (the model we adopt)

**Semantic (primary path):**

| Category           | Tokens                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| Surfaces           | `bg-background`, `bg-canvas`, `bg-subtle`, `bg-elevated`                           |
| Text               | `text-emphasis`, `text-default`, `text-muted`, `text-placeholder`, `text-on-brand` |
| Borders            | `border-default`, `border-subtle`, `border-interactive`                            |
| Interactive (gray) | `bg-interactive`, `bg-interactive-hover`, `ring-focus`                             |
| Brand              | `bg-brand`, `bg-brand-hover`, `ring-brand` (inverted black/white, flips in dark)   |
| Error              | `bg-error(-hover)`, `border-error(-subtle)`, `text-error`, `ring-error`            |
| Warning            | `bg-warning`, `border-warning(-subtle)`, `text-warning`                            |
| Success            | `bg-success`, `border-success(-subtle)`, `text-success`                            |
| Info               | `bg-info`, `border-info-subtle`, `text-info`                                       |
| Link               | `text-link`, `border-link`, `ring-link` (distinct from info)                       |

**Primitive escapes:** `gray-1..12` + `gray-a2/a3/a4`; `light-gray-1..12` (theme-immune); Radix-alpha families red/yellow(→amber-alpha)/green/blue/orange/violet/sand/cyan/mauve/black. Radix step convention: 1=app bg, 3=UI rest, 4=hover, 6=border, 12=high-contrast text. Event-lifecycle colors are schema-driven (e.g. mauve-a11=scheduled), not exposed as semantic. **Deprecated (never use):** slate, zinc, neutral, stone, emerald, teal, sky, indigo, purple, fuchsia, pink, rose, amber, lime.

### 13 heuristics (decision guides — guidelines, not rules; `@design` escalation)

| Heuristic                        | Decision                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dialog-stepper-fullscreen-drawer | Container by workload×occurrence×context. Dialog=fast/repeated/same-page; Stepper=complex/rare/ends-elsewhere; Full-screen=deep-focus single task; Drawer=complementary reference. Anti-patterns: dialog-in-dialog, overlay-close-while-typing, stepper-for-quick-edits. |
| disable-vs-hide                  | Disable if user can unlock (upgrade/finish prereq); hide if they can't (role-gated/sensitive).                                                                                                                                                                           |
| api-first                        | How API and dashboard capabilities relate.                                                                                                                                                                                                                               |
| error-and-alert-communication    | inline vs alert vs notification vs page error.                                                                                                                                                                                                                           |
| table-required-fields            | Which columns belong in the main view.                                                                                                                                                                                                                                   |
| button-appearance                | primary/secondary/ghost/destructive; icon placement; shortcut hints; Button vs IconButton.                                                                                                                                                                               |
| complementary-information        | tooltip vs placeholder vs label vs drawer.                                                                                                                                                                                                                               |
| affordance                       | element looks interactive iff it is; disabled = visually inert, no animation.                                                                                                                                                                                            |
| using-time                       | relative vs absolute, thresholds.                                                                                                                                                                                                                                        |
| friendly-names-over-ids          | aliases vs raw IDs.                                                                                                                                                                                                                                                      |
| expose-debuggable-data           | surface payloads/error codes/sources.                                                                                                                                                                                                                                    |
| tag-colors-for-status            | reserve Tag colors for status, not decoration.                                                                                                                                                                                                                           |
| keyboard-shortcuts               | adding hints + handlers.                                                                                                                                                                                                                                                 |

### Pattern framework

A pattern = ≥2 `src/ui/` primitives, specific repeatable structure, appears ≥3× in dashboard files, documented under `/design/patterns/<name>/page.tsx`. Currently none promoted (`documented-patterns.json = []`). Process: audit detects candidates → design team curates → promote.

### 3. `marketing-pages` — `marketing-pages/SKILL.md`

```yaml
name: marketing-pages
description: Use when creating, updating, editing, or deleting marketing/public pages in the Resend codebase. Covers page structure, component reuse rules, and the distinction between public and product design systems.
```

**Critical rule — strict system separation:** `src/ui/` (product) is **never** used on marketing pages; marketing uses `src/website/` primitives (PublicHeading, PublicText, PublicButton) + `src/components/website/` compositions (FeatureGrid, Carousel, Quote, CodeSnippet, 16+). Mandatory page shell `PublicPage.Root > Header > Hero > Container > … CallToAction > Footer`. Every page exports `metadata` + JSON-LD. Theme forced dark; Tailwind v4 utilities, no inline styles.

### 4. `design-audit` — `design-audit/SKILL.md`

```yaml
name: design-audit
description: Audit the Resend dashboard for design system alignment. Routes here when a user says "audit design", "design alignment", "dashboard design audit", or when triggered by the scheduled weekly routine.
metadata: { author: resend, version: "1.0.1" }
```

**Read-only** (never edits, branches, or PRs). Workflow: load alias map + ignore list (`_common/sidebar-data.ts`), `documented-components.json`, `documented-patterns.json`, commit SHA → run 7 audit categories → JSON report → markdown render → file Linear tickets.

**7 rubric categories:** (1) Missing Docs (ui file w/o doc page) · (2) Component Substitution (raw `<button>/<input>/<select>/<dialog>/<textarea>`; `use-state-prop` violation; `use-dropdown-tokens`) · (3) Token Misuse (arbitrary `w-[13px]`/`text-[14px]`/`bg-[#…]`, deprecated palettes, `prefer-semantic-token`) · (4) Deprecated Usage · (5) Pattern Candidates (≥3 repeats undocumented) · (6) Rubric Candidates (judgment) · (7) Copy & Brand Voice (sentence case, typos, vague CTAs).

**Report curation:** all errors in full; top-5 warn/info ranked by file count; rest summarized as counts; skip info-only <5; plain markdown only. **Linear delivery:** one ticket per component/rule_id/pattern; preflight defers warn/info if Triage ≥10 (errors exempt); idempotent (comment on existing open issue, skip cancelled).

## Patterns we steal (→ requirements)

1. Three knowledge layers: APIs (concrete) · patterns (copy-paste) · heuristics (decisions).
2. Two-layer tokens (semantic primary + primitive escapes).
3. Read-only audit (reports, never edits) → `vegastack-design-audit`.
4. Root SKILL.md router → self-contained sub-skills, each with `references/`.
5. Per-skill version frontmatter.
6. Copy/voice as a first-class audit category.
7. "Guidelines, not rules" tone with explicit escalation.

## Where resend falls short (we improve)

- No code/version management for the actual components (skills only).
- Patterns framework empty; no migration guides.
- No distribution mechanism — documents a codebase it doesn't ship. **We ship code + docs + skills.**
