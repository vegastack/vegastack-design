# Research & Catalog — Findings Dossier (synthesis)

> Supporting reference for [`/docs/requirements.md`](../requirements.md). Compiled 2026-06-20 from a full read of the two reference repos + adversarial web/Context7 research. Version and tooling claims are cited to primary sources (June 2026). Read this when you need the _why_ behind a requirement decision.
>
> **This is the condensed synthesis.** Full-detail per-stream research (exact token values, component APIs, config snippets, per-system breakdowns, citations) is preserved in the sibling docs — see [research/README.md](README.md) for the index. Use those when building; use this for the overview.

---

## A. `resend-design-skills` — full catalog

**Path:** `/Users/kmanojkumar/code/references/resend-design-skills` · **Nature:** a _skills-only_ repo (no `package.json`, no npm). Installed via `npx skills add resend/design-skills`. Versioned per-skill.

**Structure:**

```
resend-design-skills/
├─ README.md
├─ SKILL.md                     # router/index → 4 sub-skills
├─ brand-guidelines/SKILL.md    # resend-brand
├─ design-system/
│  ├─ SKILL.md                  # resend-design-system
│  └─ references/
│     ├─ components.md          # API catalog for 57+ src/ui primitives
│     ├─ design-tokens.md       # two-layer token system
│     ├─ heuristics.md + heuristics/*.md   # 13 UX decision guides
│     └─ patterns/              # composition-pattern framework (currently empty)
├─ marketing-pages/SKILL.md     # public-page primitives, kept separate from product UI
├─ design-audit/                # read-only compliance auditor → files Linear tickets
│  └─ references/{rubric,report-format,linear-delivery}.md
└─ tests/TESTS.md               # 37 scenario tests
```

**The 4 skills:**

| Skill                  | Purpose                                          | Notable                                                                                                                                                |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resend-brand`         | External/marketing visual identity               | Colors (Black/White + status), Domaine/Favorit/Inter/CommitMono type, logo rules, gradients, layout scenes. Dark-first.                                |
| `resend-design-system` | Product UI: component APIs + tokens + heuristics | CVA + compound components + Radix slot/`asChild`. **Two-layer tokens** (semantic primary, primitives as escapes). `state` prop over manual `disabled`. |
| `marketing-pages`      | Public page structure                            | **Strict separation**: `src/ui/` (product) never used on marketing pages; `src/website/` primitives only.                                              |
| `design-audit`         | Read-only DS-compliance audit                    | 7 grep-based categories (substitution, token misuse, deprecated, pattern candidates, copy/voice). Reports → Linear, never edits.                       |

**Patterns worth stealing (→ adopted in requirements):**

1. **Three knowledge layers** — component APIs (concrete) · patterns (copy-paste compositions) · **heuristics** (decision guides like "dialog vs stepper"). We adopt the API + do/don't layers in §7.3; heuristics are a future addition.
2. **Two-layer tokens** (semantic + primitive escapes) → requirements §5.1.
3. **Read-only audit** that reports rather than edits → `vegastack-design-audit` skill.
4. **Top-level SKILL.md as router** to self-contained sub-skills, each with a `references/` dir → our `skills/` layout.
5. **Skill-per-version metadata** (name/description/version frontmatter).

**Gaps in resend's approach (we improve on):** no package/version management for the actual components (skills only); patterns framework is empty; no distribution mechanism (it documents a codebase it doesn't ship). **We ship code + docs + skills, not just skills.**

---

## B. `engg-vegastack-platform` — component-layer catalog

**Path:** `/Users/kmanojkumar/code/engg-vegastack-platform` · **Org:** `github.com/VegaStack` · **Stack:** Next.js 16, React 19.2, **Tailwind v4** (CSS `@theme`, OKLCH, no config file), `radix-ui` unified pkg, **OpenNext + Cloudflare + R2** (`open-next.config.ts` uses `r2IncrementalCache`), pnpm 10.28.2, lucide icons, CVA + clsx + tailwind-merge.

**Component layers:**

- `src/components/ui/` — **40 shadcn primitives** (style `radix-nova`, marked DO-NOT-EDIT). Button, Input, Dialog, Select, Popover, Tooltip, DropdownMenu, Tabs, Checkbox, Switch, Calendar, Command, ScrollArea, Sheet/Drawer, Sidebar, Table, etc.
- `src/components/common/` — **~50 `Vega*` wrappers** (all CVA-based), the real design system. Highlights: VegaButton (11 variants, 8 sizes, loading, kbd hints, split menu), VegaBadge (dynamic `color-mix` for unlimited colors), VegaField, VegaInput, VegaTextarea/VegaTextEdit (Tiptap + markdown + Yjs-ready), VegaMarkdownView, VegaDatePicker, VegaDialog/VegaAlertDialog (mobile drawer via vaul), VegaDropdownMenu, VegaCommand, VegaPageHeader, VegaTooltip, VegaAvatar (R2 resolution), VegaDataList (sortable/selectable/Kanban/dnd-kit), VegaFilterBar, VegaEmptyState, VegaTabs, VegaHoverCard (+User/Agent/Team), VegaColorPicker, VegaEmojiPicker, VegaScroll, plus CopyButton, TruncatedText, PasswordInput, SettingsRow, AutoSaveInput, CommandMenu, CountrySelect/StateSelect, R2Image.

**Showcase:** route `src/app/[locale]/components/` — overview gallery (cards: icon, name, description, variant count, feature tags) + **per-component pages** in dedicated dirs, with `_showcase-helpers/` (`SectionHeader`, `DemoRow`, `DemoGrid`, `PropsTable`, `SourceLink`) and a `src/lib/component-meta.ts` props system (`defineProps`, `ComponentMeta`). ~40 showcase pages. **This is the page we productize as the Fumadocs showcase.**

**Tokens & identity** (`globals.css` + `tailwind-palette.css`):

- **OKLCH** variables: background hierarchy, primary (near-black), secondary/muted/accent, semantic `destructive/success/warning/info` (+foregrounds), overlay, border/input/ring, chart-1..5, full sidebar token set, 22-color Tailwind palette.
- **Radius:** `--radius: 0.625rem` + sm/md/lg/xl derivations.
- **Type:** Geist Sans/Mono + **Lora serif for headings**; headings `tracking-tight`, **no `font-bold`/`font-semibold` on headings** (serif weight carries hierarchy). Utility classes `.text-page-title/.text-section-title/...` and `.status-{success,warning,...}`.
- **Spacing:** 4px scale. **Borders-only** (no shadows).
- `cn()` = `twMerge(clsx(...))` in `src/lib/utils.ts`.
- **⚠️ A11y defect found:** `globals.css` sets `outline: none !important` globally and disables focus states. Flagged in requirements §7.5 to FIX (replace with `:focus-visible`) — do not carry forward.

**Already-relevant signal:** `components.json` already consumes an **external shadcn registry** (`@lucide-animated`) — the team already understands registry consumption.

---

## C. Base UI vs Radix — verdict (adversarial)

- **Base UI** (`@base-ui/react`, formerly `@base-ui-components/react`) is **verified** built "from the creators of Radix, Material UI, and Floating UI" (Colm Tuite/Radix, James Nelson/Floating UI, MUI core). **Stable v1 shipped Dec 11 2025**; actively iterating (**v1.6.0, Jun 17 2026**). 35+ components incl. **Combobox, Autocomplete, Menubar, Toolbar** — primitives Radix lacked. Composition API = **`render` prop** (vs Radix `asChild`). Single tree-shakable package. Refs: base-ui.com/react/overview/{about,releases,quick-start}.
- **Radix is NOT dead** (myth-check): maintained by WorkOS, **active commits through Jun 15 2026** incl. React 19 fixes; `@radix-ui/react-slot` ~131M weekly downloads. Real backlog (285 issues/122 PRs) but battle-tested. The "Radix is dying" narrative is **partly pushed by conflicted sources** (the "liability" quote is from Colm Tuite, who now leads Base UI — discount heavily). Refs: github.com/radix-ui/primitives/commits/main.
- **shadcn supports both**, switchable per `components.json`.
- **Verdict (→ D1):** Base UI for longevity (active greenfield from the category's inventors, better coverage), **routed through shadcn so the choice is reversible**; Radix is the safe fallback. Caveat: Base UI ecosystem is younger and most AI-generated code still assumes Radix — agents need the registry/skill guidance to target Base UI correctly.
- **Evidence caveat:** no primary-source bundle-size benchmark found; treat KB comparisons skeptically.

---

## D. shadcn "never edit, always wrap" — myth-check

- shadcn is **copy-in: you own the code** ("once installed, they become your code and you are responsible for updating them"). No auto-update path because it's not a dependency.
- Upgrade tooling **exists and is current** (CLI v4, Mar 2026): `add --overwrite` re-pulls latest; **`--diff`** previews upstream vs local; `--dry-run`/`--view` inspect. Refs: ui.shadcn.com/docs/cli, /docs/changelog/2026-03-cli-v4.
- **"Never edit, always wrap" is a myth as an absolute.** shadcn's value _is_ owning/editing the code. Real practice = **hybrid**: edit-in-place where a component must diverge (accept the merge cost), wrap for additive behavior, and **centralize authoring in your own custom registry**. The canonical maintenance pattern is "pristine copy + `--diff` merge."
- **Custom registry = the real "one place to maintain" mechanism.** `registry.json` + `registry-item.json` → `shadcn build` → static JSON → downstream `npx shadcn add @org/x`. CLI v4 added **`registry:base`** (ship an entire DS — components + CSS vars + fonts + config — as one payload) and `registry:font`. Refs: ui.shadcn.com/docs/registry/*.
- **Honest limit:** even with your own registry, updates **do not auto-propagate** — downstream must re-run `add`. Registry centralizes _authoring_, not _distribution_. Anyone claiming registry = npm auto-update is wrong. (This is exactly why requirements use the **hybrid**: npm for the auto-propagate layer, registry for the owned layer.)

---

## E. Distribution model — npm vs registry vs hybrid

|                | npm package                 | shadcn registry             |
| -------------- | --------------------------- | --------------------------- |
| Code location  | `node_modules` (opaque)     | copied into downstream repo |
| Ownership      | central                     | downstream                  |
| Updates        | `npm update` (auto)         | re-run `add` (manual)       |
| Customizable   | only via exposed props/wrap | fully (it's their file)     |
| Agent-editable | ❌                          | ✅                          |

- **Big mature systems = npm packages** (Polaris, React Spectrum, Primer, Atlaskit) — central control, but deep customization means "drop to the headless layer and rebuild."
- **shadcn registry = copy-in ownership**, agent-native, can ship tokens+config+components together; updates are manual.
- **Hybrid is the production sweet spot.** Real example: **OpenStatus** runs a monorepo `packages/ui` consumed internally as a dep **and** exposed as a shadcn registry for copy-in. shadcn's `init --monorepo` scaffolds this shape.
- **Fundamental tension (sourced):** npm = central control + trivial updates but locked; registry = full customization + ownership but no auto-propagation. The hybrid puts each layer on the favorable side. → requirements §4.
- **Private registry auth:** `components.json` `registries` map + `${ENV}` interpolation (Bearer header, custom headers, or query token). **Private npm (GitHub Packages):** `.npmrc` scope map + token; **no fine-grained PAT support** (classic PAT/`GITHUB_TOKEN` only) — the #1 setup failure. Refs: ui.shadcn.com/docs/registry/authentication, docs.github.com/packages.

---

## F. Tailwind v4 across a package boundary

- **Don't bundle Tailwind / don't ship compiled CSS.** Consumer owns `@import "tailwindcss"`; library ships **raw class names**.
- npm-packaged components need a **tightly-scoped `@source`** in the consumer CSS to be scanned. **Registry copy-in components need none** (they land in `src/`, auto-scanned).
- **Everyone must be on v4** — a v3 consumer silently won't style v4 components (#1 failure).
- Ship tokens as **`@theme` CSS variables** → centralized, overridable theming (one-file override). v4.1 extras: `@source not`, `@source inline(...)` for dynamic classes. Refs: tailwindcss.com/docs/functions-and-directives, github.com/tailwindlabs/tailwindcss/discussions/18545.

---

## G. Monorepo & tooling survey

- **2026 standard = pnpm workspaces + Turborepo** (shadcn/ui `apps/v4` + `packages/*`; Radix Themes). **pnpm catalogs** (9.5+) pin shared versions via `catalog:`. Lerna+Nx only at MUI/Adobe scale.
- **Package boundaries that recur:** tokens (separate pkg) · primitives/ui · themes · icons (generated, separate) · tailwind/eslint/tsconfig presets (config-as-package) · utils · `apps/docs` (or `www`/`v4`).
- **Releases = Changesets** (not semantic-release): author intent → `version` → `publish -r`; `changesets/action` opens a "Version Packages" PR gate. Config: `changelog-github`, `access: restricted`, `fixed` groups, `bumpVersionsWithWorkspaceProtocolOnly`. Snapshot/canary for per-PR tests; `pre enter` (dedicated branch only) for majors.
- **Never-break:** `@deprecated` in a minor + codemod (jscodeshift) + remove at next major; React as `peerDependencies`; Renovate downstream; visual regression (Chromatic/Lost Pixel/Playwright) for the breaks semver can't see.
- **Tokens:** W3C **DTCG reached first stable (2025.10) on Oct 28 2025**; **Style Dictionary v4** builds DTCG → CSS vars / Tailwind theme / TS. Refs: w3.org/community/design-tokens, styledictionary.com, turborepo.dev, pnpm.io/catalogs, changesets docs.

---

## H. Docs/showcase tooling

- **What real DS docs run on (verified):** shadcn/ui = **Next.js App Router + Fumadocs (`fumadocs-mdx`)**; Radix = custom Next.js + MDX; MUI = Next.js (usage page + separate auto-gen API page); React Spectrum = Parcel. **None use Storybook as the public docs site** — Storybook is a component _workbench_.
- **Storybook is at v10** (Oct 2025, ESM-only, −29% install; v10.3 added a Storybook MCP) — not v9. Strength: variants-as-tests via Vitest+Playwright + Chromatic visual regression.
- **Fumadocs** (v16, very active) = the modern Next.js-native docs framework; MDX + Shiki + Twoslash, Orama search, **AutoTypeTable** (TS→props), `fumadocs-openapi`. Multi-framework since v15.2. **Nextra 4** = more opinionated content-first alternative. **Ladle** = fast Vite workbench (React-only, no auto prop tables). **Histoire = avoid** (Vue-first, stalled). **Avoid Sandpack** (unmaintained since Mar 2026) and **Contentlayer** (dead — shadcn migrated off it to Fumadocs).
- **Recommendation (→ D9):** Fumadocs for the showcase (live previews + `react-docgen-typescript` props + Shiki + MDX do/don't); Storybook deferred to phase 2. Refs: storybook.js.org/blog/storybook-10, fumadocs.dev, ui.shadcn.com.

---

## I. OpenNext + Cloudflare (showcase deploy)

- **`@opennextjs/cloudflare` v1.19.x — stable/GA**, weekly cadence. Supports Next 15 (latest minor) + 16; App Router GA; runs Node runtime in Workers. `@cloudflare/next-on-pages` is **deprecated** → use OpenNext. Cloudflare committed to an official first-party adapter built on OpenNext later in 2026 → building on OpenNext now is future-aligned.
- **For a static docs site**, `output: "export"` on **Workers Static Assets** is leaner/cheaper than OpenNext (no server) — Cloudflare's recommended direction. Use OpenNext only for SSR/ISR/route-handlers/live playground. → requirements §8.5.
- Worker limits: 3 MB (Free)/10 MB (Paid) gzipped _server_ bundle; static assets don't count. Do Shiki highlighting at **build time**. `nodejs_compat` + `compatibility_date ≥ 2024-09-23` required for OpenNext. Local dev: `next dev` (fast) + `opennextjs-cloudflare preview` (prod-accurate). Refs: opennext.js.org/cloudflare, developers.cloudflare.com/workers/static-assets, npmjs.com/package/@opennextjs/cloudflare.

---

## J. AI-agent-consumable design systems

- **Load-bearing finding (Atlassian A/B test):** a static markdown spec (DESIGN.md) made agents **re-implement** components (~92% more tokens, ~30% DS coverage); an **MCP/registry pointing at real importable components hit ~80%**. → ship the registry/MCP for components; markdown only for rules.
- **What to ship (priority):** (1) shadcn-compatible **`registry.json`/`registry-item.json`** (private, namespaced) — `title`/`description`/`categories`/`meta` drive agent _selection_; (2) **MCP server** (`npx shadcn mcp`) for discover→search→inspect→install→verify; (3) **`AGENTS.md` + `CLAUDE.md`**; (4) **`SKILL.md`** suite; (5) **`llms.txt`/`llms-full.txt`**. Extend `meta` with `whenToUse`/`whenNotToUse` for disambiguation; auto-generate from JSDoc to avoid drift. Refs: ui.shadcn.com/docs/{registry,mcp}, agents.md, storybook.js.org/docs/ai/manifests.

---

### Source caveats

- No primary-source bundle-size benchmark for Base UI vs Radix (treat KB claims skeptically).
- "OpenAI/Sonos/Adobe use shadcn private registries" is shadcn marketing, not independent case studies; **OpenStatus** is the one concrete documented hybrid example.
- The Radix "liability" quote is from a Base UI principal — conflicted.
- A few enterprise design-guideline pages (Spectrum/Carbon/Atlassian/Polaris) are client-rendered SPAs; their section structure was confirmed via indexed search, not direct DOM reads.
